/**
 * Speech mode (read aloud) — ported from book-of-mormon ReadAloudToolbar.
 * Uses the browser Web Speech API; fixed bottom-left on all Tanach pages.
 */
(function () {
  'use strict';

  const BLOCK_SELECTOR =
    '[data-read-aloud-block], #main-content, .main-content, #searchResults, article, .text-section, .reading-card, .reading-item, .result-item, .halakha-item, .content-area, .tab-content.active, #tabContent';
  const READABLE_SELECTOR =
    'h1, h2, h3, h4, p, li, blockquote, .verse, .reading-text, .hebrew-text, .english-text, .result-item, .result-hebrew, .result-english, .halakha-item, .stats';
  const IGNORE_ANCESTOR =
    '[data-read-aloud-ignore], nav, footer, header, button, .nav-links, .language-tabs, .date-selector, .header-content, .chapter-nav, .book-selector, .location-controls';
  const MAIN_ROOT_SELECTORS = [
    '#main-content',
    '#readingsContainer',
    '#contentArea',
    '.main-container',
    '#tabContent',
    '.main-content',
    '.container',
  ];
  const SPEEDS = [0.75, 1, 1.25, 1.5];
  /** Chromium desktop Google network voices stall after ~15s without firing onend. */
  const GOOGLE_NETWORK_PAUSE_RESUME_MS = 10000;
  const UTTERANCE_START_TIMEOUT_MS = 5000;
  const UTTERANCE_END_BUFFER_MS = 2000;
  const NETWORK_VOICE_MAX_CHARS = 180;
  const CHARS_PER_SECOND = 14;

  let selectionCache = null;
  let synthWarmedUp = false;

  function isVisible(el) {
    let node = el;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (Number(style.opacity) === 0) return false;
      node = node.parentElement;
    }
    return true;
  }

  function isIgnored(el) {
    if (!isVisible(el)) return true;
    if (el.closest(IGNORE_ANCESTOR)) return true;
    const anchor = el.closest('a');
    if (
      anchor &&
      !anchor.matches(BLOCK_SELECTOR) &&
      !anchor.hasAttribute('data-read-aloud-block')
    ) {
      return true;
    }
    return false;
  }

  function extractText(element) {
    const clone = element.cloneNode(true);
    clone
      .querySelectorAll(
        "[data-read-aloud-ignore], button, svg, [aria-hidden='true'], .verse-num, .verse-number, .spinner",
      )
      .forEach((node) => node.remove());
    return clone.innerText.replace(/\s+/g, ' ').trim();
  }

  function compareDocumentOrder(a, b) {
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  }

  function expandBlockToChunks(block) {
    const verses = Array.from(block.querySelectorAll('.verse')).filter(
      (el) => !isIgnored(el),
    );

    if (verses.length > 1) {
      return verses
        .map((element) => ({ text: extractText(element), element }))
        .filter((chunk) => chunk.text.length > 0);
    }

    const text = extractText(block);
    return text ? [{ text, element: block }] : [];
  }

  function getReadableChunks(root) {
    const blocks = Array.from(root.querySelectorAll(BLOCK_SELECTOR))
      .filter((el) => !isIgnored(el))
      .filter((el, _, arr) =>
        arr.every((other) => other === el || !other.contains(el)),
      )
      .sort(compareDocumentOrder);

    const claimed = new Set();
    const chunks = [];

    for (const block of blocks) {
      const blockChunks = expandBlockToChunks(block);
      if (!blockChunks.length) continue;

      for (const chunk of blockChunks) {
        chunks.push({ index: chunks.length, ...chunk });
      }

      claimed.add(block);
      block.querySelectorAll(READABLE_SELECTOR).forEach((el) => claimed.add(el));
      block.querySelectorAll('.verse').forEach((el) => claimed.add(el));
    }

    const standalone = Array.from(root.querySelectorAll(READABLE_SELECTOR))
      .filter((el) => {
        if (isIgnored(el)) return false;
        if (claimed.has(el)) return false;
        if (
          el.closest(
            '[data-read-aloud-block], article, .text-section, .reading-card, .content-area, .tab-content',
          )
        ) {
          return false;
        }
        return extractText(el).length > 0;
      })
      .sort(compareDocumentOrder);

    for (const el of standalone) {
      const text = extractText(el);
      if (!text) continue;
      chunks.push({ index: chunks.length, text, element: el });
    }

    if (!chunks.length) {
      chunks = collectFlatReadableChunks(root);
    }

    return chunks;
  }

  /** Fallback for AJAX/innerHTML content that does not match block layout rules. */
  function collectFlatReadableChunks(root) {
    const seen = new Set();
    const out = [];

    const candidates = Array.from(root.querySelectorAll(READABLE_SELECTOR)).filter(
      (el) => !isIgnored(el),
    );

    for (const el of candidates.sort(compareDocumentOrder)) {
      if (seen.has(el)) continue;
      if (el.closest('.read-aloud-root')) continue;

      const text = extractText(el);
      if (!text) continue;

      const parentVerse = el.closest('.verse');
      if (parentVerse && el !== parentVerse) {
        if (seen.has(parentVerse)) continue;
        if (!isIgnored(parentVerse)) {
          const verseText = extractText(parentVerse);
          if (verseText) {
            seen.add(parentVerse);
            out.push({ index: out.length, text: verseText, element: parentVerse });
          }
        }
        continue;
      }

      seen.add(el);
      out.push({ index: out.length, text, element: el });
    }

    return out;
  }

  function selectionToChunk(selection) {
    if (selection.isCollapsed) return null;

    const text = selection.toString().replace(/\s+/g, ' ').trim();
    if (!text) return null;

    const main = getMainRoot();
    const anchor = selection.anchorNode;
    if (!main || !anchor || !main.contains(anchor)) return null;

    const parentEl =
      anchor.nodeType === Node.TEXT_NODE
        ? anchor.parentElement
        : anchor;
    if (!parentEl) return null;

    const element =
      parentEl.closest(
        '[data-read-aloud-block], article, .text-section, .verse, .reading-text, p, h1, h2, h3, h4',
      ) || parentEl;

    return { text, element };
  }

  function updateSelectionCache() {
    const selection = window.getSelection();
    if (!selection) return;
    const chunk = selectionToChunk(selection);
    if (chunk) selectionCache = chunk;
  }

  function clearSelectionCache() {
    selectionCache = null;
  }

  function getSelectionChunk() {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const live = selectionToChunk(selection);
      if (live) return { index: 0, ...live };
    }

    if (selectionCache) {
      return {
        index: 0,
        text: selectionCache.text,
        element: selectionCache.element,
      };
    }

    return null;
  }

  function clearChunkHighlights(root) {
    root.querySelectorAll('[data-read-chunk-active]').forEach((el) => {
      el.removeAttribute('data-read-chunk-active');
      el.classList.remove('read-aloud-active');
    });
  }

  function highlightChunk(element) {
    const main = element.closest('main') || getMainRoot();
    if (main) clearChunkHighlights(main);
    element.setAttribute('data-read-chunk-active', 'true');
    element.classList.add('read-aloud-active');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function filterVoices(allVoices) {
    const enHe = allVoices.filter(
      (v) => v.lang.startsWith('en') || v.lang.startsWith('he'),
    );
    const rest = allVoices.filter((v) => !enHe.includes(v));
    const pool = enHe.length > 0 ? [...enHe, ...rest] : allVoices;

    return [...pool].sort((a, b) => {
      const score = (v) => {
        let s = 0;
        if (v.localService) s += 4;
        if (/microsoft|natural|premium|enhanced/i.test(v.name)) s += 3;
        if (/google/i.test(v.name) && v.localService) s += 2;
        if (/google/i.test(v.name) && !v.localService) s += 1;
        if (v.lang.startsWith('en-US') || v.lang === 'en_US') s += 2;
        if (v.default) s += 1;
        return s;
      };
      return score(b) - score(a);
    });
  }

  function pickDefaultVoiceKey(voiceList) {
    if (!voiceList.length) return '';
    const localEnUs = voiceList.find(
      (v) =>
        v.localService &&
        (v.lang.startsWith('en-US') || v.lang === 'en_US'),
    );
    if (localEnUs) return voiceToKey(localEnUs);
    const localEn = voiceList.find(
      (v) => v.localService && v.lang.startsWith('en'),
    );
    if (localEn) return voiceToKey(localEn);
    const anyEn = voiceList.find((v) => v.lang.startsWith('en'));
    if (anyEn) return voiceToKey(anyEn);
    return voiceToKey(voiceList[0]);
  }

  const VOICE_KEY_SEP = '\x1e';

  function voiceToKey(voice) {
    if (!voice) return '';
    return `${voice.name}${VOICE_KEY_SEP}${voice.lang}${VOICE_KEY_SEP}${voice.localService ? 1 : 0}`;
  }

  function resolveVoiceByKey(key, pool) {
    if (!key || !window.speechSynthesis) return null;
    let decoded = key;
    try {
      decoded = decodeURIComponent(key);
    } catch (_) {
      decoded = key;
    }
    const all = pool || window.speechSynthesis.getVoices();
    const parts = decoded.split(VOICE_KEY_SEP);
    if (parts.length >= 3) {
      const [name, lang, localFlag] = parts;
      const byParts = all.find(
        (v) =>
          v.name === name &&
          v.lang === lang &&
          (v.localService ? 1 : 0) === Number(localFlag),
      );
      if (byParts) return byParts;
    }
    return all.find((v) => v.voiceURI === decoded || v.voiceURI === key) || null;
  }

  function formatVoiceLabel(voice) {
    const lang = voice.lang.replace('_', '-');
    const tag = voice.localService ? 'Local' : 'Network';
    return `${voice.name} (${lang}, ${tag})`;
  }

  function getMainRoot() {
    for (const sel of MAIN_ROOT_SELECTORS) {
      const matches = document.querySelectorAll(sel);
      for (const el of matches) {
        if (isVisible(el)) return el;
      }
    }
    for (const sel of MAIN_ROOT_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return document.body;
  }

  function detectUtteranceLang(text) {
    return /[\u0590-\u05FF]/.test(text) ? 'he-IL' : 'en-US';
  }

  function normalizeLang(lang) {
    return lang.toLowerCase().replace('_', '-');
  }

  function isChromiumDesktop() {
    const ua = navigator.userAgent;
    return /Chrome|Chromium|Edg/i.test(ua) && !/Android|Mobile/i.test(ua);
  }

  function isGoogleNetworkVoice(voice) {
    return Boolean(voice && !voice.localService && /google/i.test(voice.name));
  }

  function voiceMatchesText(voice, text) {
    const prefix = detectUtteranceLang(text).slice(0, 2).toLowerCase();
    return normalizeLang(voice.lang).startsWith(prefix);
  }

  function resolveVoiceForChunk(voiceKey, text, pool) {
    const selected = resolveVoiceByKey(voiceKey, pool);
    if (!selected) return null;
    if (voiceMatchesText(selected, text)) return selected;

    const wantPrefix = detectUtteranceLang(text).slice(0, 2).toLowerCase();
    const matching = pool.filter((v) =>
      normalizeLang(v.lang).startsWith(wantPrefix),
    );
    if (!matching.length) return null;

    const preferSameKind = matching.find(
      (v) =>
        v.localService === selected.localService &&
        /google/i.test(v.name) === /google/i.test(selected.name),
    );
    const preferLocal = matching.find((v) => v.localService);
    return preferSameKind || preferLocal || matching[0];
  }

  function splitTextForSpeech(text, maxChars) {
    if (!maxChars || text.length <= maxChars) return [text];

    const parts = [];
    let remaining = text.trim();

    while (remaining.length > maxChars) {
      let splitAt = -1;
      const slice = remaining.slice(0, maxChars);
      for (const sep of ['. ', '? ', '! ', '; ', ', ', ' ']) {
        const idx = slice.lastIndexOf(sep);
        if (idx > maxChars * 0.4) {
          splitAt = idx + sep.length;
          break;
        }
      }
      if (splitAt <= 0) splitAt = maxChars;
      parts.push(remaining.slice(0, splitAt).trim());
      remaining = remaining.slice(splitAt).trim();
    }

    if (remaining) parts.push(remaining);
    return parts.length ? parts : [text];
  }

  function estimateSpeechDurationMs(text, speechRate) {
    const seconds = text.length / (CHARS_PER_SECOND * speechRate);
    return Math.max(3000, seconds * 1000 + UTTERANCE_END_BUFFER_MS);
  }

  function warmUpSynth() {
    if (synthWarmedUp || !window.speechSynthesis) return;
    synthWarmedUp = true;
    const warmup = new SpeechSynthesisUtterance(' ');
    warmup.volume = 0.01;
    window.speechSynthesis.speak(warmup);
    window.speechSynthesis.cancel();
  }

  function icon(name) {
    const icons = {
      headphones:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>',
      play: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
      pause:
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
      stop: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12"/></svg>',
      skipBack:
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>',
      skipForward:
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>',
      volume:
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
      close:
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    };
    return icons[name] || '';
  }

  function createReadAloudController(rootEl) {
    let status = 'idle';
    let chunks = [];
    let currentIndex = 0;
    let rate = 1;
    let pitch = 1;
    let volume = 1;
    let voices = [];
    let voiceKey = '';
    let mode = 'page';
    const session = { generation: 0, paused: false, stopped: true };
    let chunksRef = [];
    let indexRef = 0;
    let mainRef = null;

    const ui = {
      root: rootEl,
      panel: rootEl.querySelector('.read-aloud-panel'),
      fab: rootEl.querySelector('.read-aloud-fab'),
      hint: rootEl.querySelector('.read-aloud-hint'),
      statusLive: rootEl.querySelector('.read-aloud-status-live'),
      progressFill: rootEl.querySelector('.read-aloud-progress-fill'),
      progressLabel: rootEl.querySelector('.read-aloud-progress-label'),
      progressWrap: rootEl.querySelector('.read-aloud-progress-wrap'),
      waves: rootEl.querySelectorAll('.read-aloud-wave'),
      voiceSelect: rootEl.querySelector('.read-aloud-voice-select'),
      pitchRange: rootEl.querySelector('.read-aloud-pitch'),
      volumeRange: rootEl.querySelector('.read-aloud-volume'),
      pitchVal: rootEl.querySelector('.read-aloud-pitch-val'),
      volumeVal: rootEl.querySelector('.read-aloud-volume-val'),
    };

    function setHint(msg) {
      if (!ui.hint) return;
      ui.hint.hidden = !msg;
      ui.hint.textContent = msg;
    }

    const fabIcon = ui.fab?.querySelector('.read-aloud-fab-icon');
    const fabPing = ui.fab?.querySelector('.read-aloud-fab-ping');
    const activeUtterances = new Map();
    const speechTimers = {
      startTimeout: null,
      watchdog: null,
      googlePauseResume: null,
    };

    function clearSpeechTimers() {
      if (speechTimers.startTimeout) {
        clearTimeout(speechTimers.startTimeout);
        speechTimers.startTimeout = null;
      }
      if (speechTimers.watchdog) {
        clearTimeout(speechTimers.watchdog);
        speechTimers.watchdog = null;
      }
      if (speechTimers.googlePauseResume) {
        clearInterval(speechTimers.googlePauseResume);
        speechTimers.googlePauseResume = null;
      }
    }

    function startGooglePauseResumeWorkaround() {
      if (!isChromiumDesktop()) return;
      if (speechTimers.googlePauseResume) return;
      speechTimers.googlePauseResume = window.setInterval(() => {
        const synth = window.speechSynthesis;
        if (session.stopped || !synth?.speaking) {
          clearSpeechTimers();
          return;
        }
        synth.pause();
        synth.resume();
      }, GOOGLE_NETWORK_PAUSE_RESUME_MS);
    }

    function scheduleEndWatchdog(text, generation, onStuck) {
      if (speechTimers.watchdog) clearTimeout(speechTimers.watchdog);
      speechTimers.watchdog = window.setTimeout(() => {
        if (session.generation !== generation || session.stopped) return;
        onStuck();
      }, estimateSpeechDurationMs(text, rate));
    }

    function openPanel() {
      rootEl.classList.add('is-open');
      if (ui.fab) ui.fab.setAttribute('aria-expanded', 'true');
      updateUI();
    }

    function updateUI() {
      const isActive = status === 'playing' || status === 'paused';
      const isOpen = rootEl.classList.contains('is-open');
      if (ui.panel) ui.panel.hidden = !isOpen;
      if (ui.progressWrap) ui.progressWrap.hidden = !isActive;
      ui.fab.classList.toggle('read-aloud-play-btn', isActive);
      ui.fab.classList.toggle('read-aloud-fab-idle', !isActive);
      if (fabIcon) {
        fabIcon.innerHTML = isActive
          ? status === 'playing'
            ? icon('pause')
            : icon('play')
          : icon('headphones');
      }
      if (fabPing) {
        fabPing.hidden = !(isActive && status === 'playing');
      }

      ui.waves.forEach((w) => w.classList.toggle('active', status === 'playing'));

      const progress =
        chunks.length > 0 ? ((currentIndex + 1) / chunks.length) * 100 : 0;
      if (ui.progressFill) ui.progressFill.style.width = `${progress}%`;
      if (ui.progressLabel) {
        ui.progressLabel.textContent =
          chunks.length > 0
            ? `${currentIndex + 1} / ${chunks.length}`
            : '—';
      }

      if (isActive && chunks.length) {
        ui.statusLive.textContent = `Reading section ${currentIndex + 1} of ${chunks.length}${mode === 'selection' ? ' (selection)' : ''}`;
      } else {
        ui.statusLive.textContent = '';
      }

      rootEl.querySelectorAll('.read-aloud-mode-btn').forEach((btn) => {
        const m = btn.dataset.mode;
        btn.classList.toggle('active', isActive && mode === m);
      });

      rootEl.querySelectorAll('.read-aloud-speed-btn').forEach((btn) => {
        btn.classList.toggle('active', Number(btn.dataset.speed) === rate);
      });

      const prevBtn = rootEl.querySelector('[data-action="prev"]');
      const nextBtn = rootEl.querySelector('[data-action="next"]');
      const stopBtn = rootEl.querySelector('[data-action="stop"]');
      if (prevBtn) prevBtn.disabled = !isActive || currentIndex === 0;
      if (nextBtn) nextBtn.disabled = !isActive || currentIndex >= chunks.length - 1;
      if (stopBtn) stopBtn.disabled = !isActive;
    }

    function stop() {
      session.generation += 1;
      session.stopped = true;
      session.paused = false;
      clearSpeechTimers();
      activeUtterances.clear();
      window.speechSynthesis?.cancel();
      if (mainRef) clearChunkHighlights(mainRef);
      status = 'idle';
      currentIndex = 0;
      indexRef = 0;
      chunksRef = [];
      chunks = [];
      updateUI();
    }

    function loadVoices() {
      if (!window.speechSynthesis) return;
      const previousKey = voiceKey;
      voices = filterVoices(window.speechSynthesis.getVoices());
      if (!voiceKey) voiceKey = pickDefaultVoiceKey(voices);
      if (previousKey && resolveVoiceByKey(previousKey, voices)) {
        voiceKey = previousKey;
      }
      if (!ui.voiceSelect) return;
      ui.voiceSelect.innerHTML = voices
        .map((v) => {
          const key = voiceToKey(v);
          const encoded = encodeURIComponent(key);
          return `<option value="${encoded}"${key === voiceKey ? ' selected' : ''}>${formatVoiceLabel(v)}</option>`;
        })
        .join('');
    }

    function advanceAfterChunk(index, segmentIndex, segments, generation) {
      if (
        session.generation !== generation ||
        session.stopped ||
        session.paused
      ) {
        return;
      }

      if (segments && segmentIndex + 1 < segments.length) {
        speakChunk(index, {
          segmentIndex: segmentIndex + 1,
          segments,
          generation,
        });
        return;
      }

      if (index + 1 < chunksRef.length) {
        window.setTimeout(() => {
          if (
            session.generation !== generation ||
            session.stopped ||
            session.paused
          ) {
            return;
          }
          speakChunk(index + 1);
        }, 280);
      } else {
        stop();
      }
    }

    function speakChunk(index, options = {}) {
      const {
        skipVoiceAssignment = false,
        segmentIndex = 0,
        segments = null,
        generation = session.generation,
      } = options;

      if (session.stopped || session.generation !== generation) return;

      const list = chunksRef;
      if (!list.length || index >= list.length) {
        stop();
        return;
      }

      loadVoices();
      clearSpeechTimers();

      const chunk = list[index];
      indexRef = index;
      currentIndex = index;
      highlightChunk(chunk.element);

      const synth = window.speechSynthesis;
      if (!synth) {
        setHint('Speech is not supported in this browser.');
        stop();
        return;
      }

      try {
        const freshVoices = synth.getVoices();
        const voice =
          !skipVoiceAssignment && voiceKey
            ? resolveVoiceForChunk(voiceKey, chunk.text, freshVoices)
            : null;

        let maxChars = Infinity;
        if (voice && isGoogleNetworkVoice(voice) && isChromiumDesktop()) {
          maxChars = NETWORK_VOICE_MAX_CHARS;
        } else if (voice && !voice.localService) {
          maxChars = 250;
        }

        const textSegments = segments || splitTextForSpeech(chunk.text, maxChars);
        const text = textSegments[segmentIndex];
        if (!text) {
          advanceAfterChunk(index, segmentIndex, textSegments, generation);
          return;
        }

        const utteranceId = `${generation}-${index}-${segmentIndex}-${Date.now()}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        if (voice) {
          try {
            utterance.voice = voice;
            utterance.lang = voice.lang;
          } catch (voiceErr) {
            console.warn('[read-aloud] voice assignment failed:', voiceErr);
            utterance.lang = detectUtteranceLang(chunk.text);
          }
        } else {
          utterance.lang = detectUtteranceLang(chunk.text);
        }

        activeUtterances.set(utteranceId, utterance);
        let started = false;

        function cleanupUtterance() {
          activeUtterances.delete(utteranceId);
        }

        function finishSegment() {
          clearSpeechTimers();
          cleanupUtterance();
          advanceAfterChunk(index, segmentIndex, textSegments, generation);
        }

        utterance.onstart = () => {
          started = true;
          if (speechTimers.startTimeout) {
            clearTimeout(speechTimers.startTimeout);
            speechTimers.startTimeout = null;
          }
          if (voice && isGoogleNetworkVoice(voice)) {
            startGooglePauseResumeWorkaround();
          }
          scheduleEndWatchdog(text, generation, () => {
            console.warn('[read-aloud] watchdog: speech stalled, advancing');
            synth.cancel();
            finishSegment();
          });
        };

        utterance.onend = () => {
          if (
            session.generation !== generation ||
            session.stopped ||
            session.paused
          ) {
            clearSpeechTimers();
            cleanupUtterance();
            return;
          }
          finishSegment();
        };

        utterance.onerror = (event) => {
          if (session.generation !== generation || session.stopped) {
            cleanupUtterance();
            return;
          }
          if (event.error === 'interrupted' || event.error === 'canceled') {
            cleanupUtterance();
            return;
          }

          clearSpeechTimers();
          cleanupUtterance();
          if (event.error === 'not-allowed') {
            setHint(
              'Speech was blocked. Use Play again after clicking the page, or check browser permissions.',
            );
            stop();
            return;
          }
          if (
            !skipVoiceAssignment &&
            (event.error === 'synthesis-failed' ||
              event.error === 'network' ||
              event.error === 'audio-busy' ||
              event.error === 'language-unavailable')
          ) {
            console.warn('[read-aloud] retrying without voice:', event.error);
            if (voice && isGoogleNetworkVoice(voice)) {
              setHint(
                'Google network voice failed. Trying browser default, or pick a Local voice.',
              );
            }
            speakChunk(index, {
              skipVoiceAssignment: true,
              segmentIndex,
              segments: textSegments,
              generation,
            });
            return;
          }
          if (index < list.length - 1 || segmentIndex + 1 < textSegments.length) {
            finishSegment();
          } else {
            stop();
          }
        };

        speechTimers.startTimeout = window.setTimeout(() => {
          if (started || session.generation !== generation || session.stopped) {
            return;
          }
          console.warn('[read-aloud] speech never started, retrying');
          synth.cancel();
          clearSpeechTimers();
          cleanupUtterance();
          if (!skipVoiceAssignment) {
            speakChunk(index, {
              skipVoiceAssignment: true,
              segmentIndex,
              segments: textSegments,
              generation,
            });
          } else {
            advanceAfterChunk(index, segmentIndex, textSegments, generation);
          }
        }, UTTERANCE_START_TIMEOUT_MS);

        synth.cancel();
        synth.resume();
        synth.speak(utterance);
        status = session.paused ? 'paused' : 'playing';
        if (!skipVoiceAssignment) setHint('');
        updateUI();
      } catch (err) {
        console.error('[read-aloud] speak failed:', err);
        setHint('Could not start speech. Try a Local voice or Microsoft Edge.');
        stop();
      }
    }

    function start(readMode) {
      mainRef = getMainRoot();
      if (!mainRef) return false;

      session.generation += 1;
      session.stopped = false;
      session.paused = false;
      window.speechSynthesis.cancel();
      clearChunkHighlights(mainRef);

      let list = [];
      let activeMode = readMode;

      if (readMode === 'selection') {
        const selected = getSelectionChunk();
        if (!selected) return false;
        list = [selected];
        activeMode = 'selection';
      } else {
        list = getReadableChunks(mainRef);
      }

      if (!list.length) {
        const hiddenRoot =
          mainRef &&
          !isVisible(mainRef) &&
          MAIN_ROOT_SELECTORS.some((sel) => {
            const el = document.querySelector(sel);
            return el === mainRef;
          });
        if (hiddenRoot) {
          setHint('Open a chapter or wait for content to load, then try again.');
        } else {
          setHint(
            'No readable text found yet. Wait for the page to finish loading, then try Play again.',
          );
        }
        return false;
      }

      mode = activeMode;
      chunksRef = list;
      chunks = list;
      indexRef = 0;
      currentIndex = 0;
      status = 'playing';
      updateUI();
      speakChunk(0);
      return true;
    }

    function pause() {
      if (!window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        return;
      }
      session.paused = true;
      window.speechSynthesis.pause();
      status = 'paused';
      updateUI();
    }

    function resume() {
      if (!session.paused) return;
      session.paused = false;
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      status = 'playing';
      updateUI();
    }

    function togglePlayPause() {
      if (status === 'playing') pause();
      else if (status === 'paused') resume();
      else start(mode);
    }

    function skip(delta) {
      const next = indexRef + delta;
      if (next < 0 || next >= chunksRef.length) return;

      session.generation += 1;
      session.paused = false;
      session.stopped = false;
      clearSpeechTimers();
      activeUtterances.clear();
      window.speechSynthesis.cancel();
      speakChunk(next);
    }

    function handleStart(readMode) {
      openPanel();
      warmUpSynth();
      const wasActive = status === 'playing' || status === 'paused';
      if (wasActive) stop();
      const ok = start(readMode);
      if (!ok) {
        if (!ui.hint?.textContent) {
          setHint(
            readMode === 'selection'
              ? 'Highlight some text on the page first, then try again.'
              : 'No readable content on this page yet.',
          );
        }
      } else {
        setHint('');
      }
    }

    function handlePlayPause() {
      openPanel();
      warmUpSynth();
      if (status === 'idle') {
        const ok = start('page');
        if (!ok && !ui.hint?.textContent) {
          setHint('No readable content on this page yet.');
        } else if (ok) {
          setHint('');
        }
      } else {
        setHint('');
        togglePlayPause();
      }
    }

    rootEl.addEventListener('click', (e) => {
      const fab = e.target.closest('.read-aloud-fab');
      if (fab && rootEl.contains(fab)) {
        rootEl.classList.toggle('is-open');
        ui.fab?.setAttribute(
          'aria-expanded',
          rootEl.classList.contains('is-open') ? 'true' : 'false',
        );
        updateUI();
        return;
      }

      const btn = e.target.closest('[data-action], .read-aloud-mode-btn, .read-aloud-speed-btn');
      if (!btn || !rootEl.contains(btn)) return;

      if (btn.classList.contains('read-aloud-mode-btn')) {
        handleStart(btn.dataset.mode);
        return;
      }

      if (btn.classList.contains('read-aloud-speed-btn')) {
        rate = Number(btn.dataset.speed);
        updateUI();
        return;
      }

      switch (btn.dataset.action) {
        case 'close-panel':
          rootEl.classList.remove('is-open');
          updateUI();
          break;
        case 'play':
          handlePlayPause();
          break;
        case 'stop':
          stop();
          break;
        case 'prev':
          skip(-1);
          break;
        case 'next':
          skip(1);
          break;
        default:
          break;
      }
    });

    if (ui.voiceSelect) {
      ui.voiceSelect.addEventListener('change', (e) => {
        try {
          voiceKey = decodeURIComponent(e.target.value);
        } catch (_) {
          voiceKey = e.target.value;
        }
      });
    }

    if (ui.pitchRange) {
      ui.pitchRange.addEventListener('input', (e) => {
        pitch = Number(e.target.value);
        if (ui.pitchVal) ui.pitchVal.textContent = pitch.toFixed(1);
      });
    }

    if (ui.volumeRange) {
      ui.volumeRange.addEventListener('input', (e) => {
        volume = Number(e.target.value);
        if (ui.volumeVal) ui.volumeVal.textContent = `${Math.round(volume * 100)}%`;
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        openPanel();
        if (status === 'idle') start('page');
        else togglePlayPause();
        updateUI();
      }
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        stop();
      }
    });

    window.addEventListener('read-aloud-stop', stop);
    document.addEventListener('selectionchange', updateSelectionCache);

    if (window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    updateUI();

    return { stop, start };
  }

  function buildToolbar() {
    const el = document.createElement('div');
    el.className = 'read-aloud-root';
    el.setAttribute('data-read-aloud-ignore', '');
    el.innerHTML = `
      <div class="read-aloud-sr-only read-aloud-status-live" aria-live="polite"></div>
      <div class="read-aloud-panel" hidden role="region" aria-label="Listen to this page">
        <div class="read-aloud-panel-header">
          <div class="read-aloud-panel-header-row">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              ${icon('volume')}
              <div>
                <h2>Listen</h2>
                <p>Powered by your browser</p>
              </div>
            </div>
            <button type="button" class="read-aloud-close" data-action="close-panel" aria-label="Close listen panel">${icon('close')}</button>
          </div>
          <div class="read-aloud-waves" aria-hidden="true">
            ${[0, 1, 2, 3, 4].map((i) => `<span class="read-aloud-wave" style="animation-delay:${i * 0.12}s"></span>`).join('')}
          </div>
        </div>
        <div class="read-aloud-panel-body">
          <p class="read-aloud-hint" hidden role="status"></p>
          <div class="read-aloud-progress-wrap" hidden>
            <div class="read-aloud-progress-meta">
              <span>Progress</span>
              <span class="read-aloud-progress-label">—</span>
            </div>
            <div class="read-aloud-progress-track">
              <div class="read-aloud-progress-fill" style="width:0%"></div>
            </div>
          </div>
          <div class="read-aloud-controls" style="margin:0.75rem 0;">
            <button type="button" class="read-aloud-icon-btn" data-action="prev" aria-label="Previous section">${icon('skipBack')}</button>
            <button type="button" class="read-aloud-icon-btn read-aloud-icon-btn-primary read-aloud-play-btn" data-action="play" aria-label="Play or pause">${icon('play')}</button>
            <button type="button" class="read-aloud-icon-btn" data-action="next" aria-label="Next section">${icon('skipForward')}</button>
            <button type="button" class="read-aloud-icon-btn" data-action="stop" aria-label="Stop reading">${icon('stop')}</button>
          </div>
          <div class="read-aloud-mode-btns">
            <button type="button" class="read-aloud-mode-btn" data-mode="page">Read full page</button>
            <button type="button" class="read-aloud-mode-btn" data-mode="selection">Read selection</button>
          </div>
          <div class="read-aloud-divider">
            <span class="read-aloud-label">Speed</span>
            <div class="read-aloud-speed-btns">
              ${SPEEDS.map((s) => `<button type="button" class="read-aloud-speed-btn${s === 1 ? ' active' : ''}" data-speed="${s}">${s}×</button>`).join('')}
            </div>
            <label class="read-aloud-label" style="margin-top:0.75rem;">Voice</label>
            <select class="read-aloud-select read-aloud-voice-select" aria-label="Reading voice"></select>
            <label class="read-aloud-label" style="margin-top:0.75rem;display:flex;justify-content:space-between;">
              <span>Pitch</span>
              <span class="read-aloud-pitch-val">1.0</span>
            </label>
            <input type="range" class="read-aloud-range read-aloud-pitch" min="0.5" max="1.5" step="0.1" value="1" aria-label="Pitch">
            <label class="read-aloud-label" style="margin-top:0.5rem;display:flex;justify-content:space-between;">
              <span>Volume</span>
              <span class="read-aloud-volume-val">100%</span>
            </label>
            <input type="range" class="read-aloud-range read-aloud-volume" min="0" max="1" step="0.05" value="1" aria-label="Volume">
          </div>
          <p class="read-aloud-footer-note">Highlight text first for &ldquo;Read selection&rdquo;. Local voices are most reliable; Google network voices may need a retry on Chrome. Shortcuts: Alt+R play/pause · Alt+S stop</p>
        </div>
      </div>
      <button type="button" class="read-aloud-fab read-aloud-fab-idle" aria-expanded="false" aria-label="Open listen controls">
        <span class="read-aloud-fab-ping" hidden aria-hidden="true"></span>
        <span class="read-aloud-fab-icon">${icon('headphones')}</span>
        <span class="read-aloud-fab-badge">Listen</span>
      </button>
    `;
    return el;
  }

  function init() {
    const toolbar = buildToolbar();
    document.body.appendChild(toolbar);

    if (!window.speechSynthesis) {
      toolbar.querySelector('.read-aloud-hint')?.removeAttribute('hidden');
      const hint = toolbar.querySelector('.read-aloud-hint');
      if (hint) {
        hint.textContent =
          'Listen mode needs a browser with speech support (Chrome, Edge, or Safari).';
      }
      return;
    }

    const controller = createReadAloudController(toolbar);
    window.tanachReadAloud = controller;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
