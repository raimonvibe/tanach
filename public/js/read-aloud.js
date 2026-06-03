/**
 * Speech mode (read aloud) — ported from book-of-mormon ReadAloudToolbar.
 * Uses the browser Web Speech API; fixed bottom-left on all Tanach pages.
 */
(function () {
  'use strict';

  const BLOCK_SELECTOR =
    '[data-read-aloud-block], #main-content, .main-content, article, .text-section, .reading-card, .reading-item, .content-area, .tab-content.active, #tabContent';
  const READABLE_SELECTOR = 'h1, h2, h3, h4, p, li, blockquote, .verse, .reading-text, .hebrew-text, .english-text';
  const IGNORE_ANCESTOR =
    '[data-read-aloud-ignore], nav, footer, header, button, .nav-links, .language-tabs, .date-selector, .header-content, .chapter-nav, .book-selector, .location-controls';
  const MAIN_ROOT_SELECTORS =
    '#main-content, #readingsContainer, #contentArea, .main-container, #tabContent, .main-content, .container';
  const SPEEDS = [0.75, 1, 1.25, 1.5];

  let selectionCache = null;

  function isVisible(el) {
    let node = el;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
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

    return chunks;
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

  function filterVoices(voices) {
    const preferred = voices.filter(
      (v) => v.lang.startsWith('en') || v.lang.startsWith('he'),
    );
    const pool = preferred.length > 0 ? preferred : voices;

    return [...pool].sort((a, b) => {
      const score = (v) => {
        let s = 0;
        if (v.localService) s += 2;
        if (/natural|premium|enhanced|google/i.test(v.name)) s += 3;
        if (v.default) s += 1;
        return s;
      };
      return score(b) - score(a);
    });
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
    let voiceURI = '';
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

    const fabIcon = ui.fab.querySelector('.read-aloud-fab-icon');
    const fabPing = ui.fab.querySelector('.read-aloud-fab-ping');

    function updateUI() {
      const isActive = status === 'playing' || status === 'paused';
      ui.panel.hidden = !rootEl.classList.contains('is-open');
      ui.progressWrap.hidden = !isActive;
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
      ui.progressLabel.textContent =
        chunks.length > 0
          ? `${currentIndex + 1} / ${chunks.length}`
          : '—';

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

      rootEl.querySelector('[data-action="prev"]').disabled =
        !isActive || currentIndex === 0;
      rootEl.querySelector('[data-action="next"]').disabled =
        !isActive || currentIndex >= chunks.length - 1;
      rootEl.querySelector('[data-action="stop"]').disabled = !isActive;
    }

    function stop() {
      session.generation += 1;
      session.stopped = true;
      session.paused = false;
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
      voices = filterVoices(window.speechSynthesis.getVoices());
      if (!voiceURI && voices[0]) voiceURI = voices[0].voiceURI;
      ui.voiceSelect.innerHTML = voices
        .map(
          (v) =>
            `<option value="${v.voiceURI}"${v.voiceURI === voiceURI ? ' selected' : ''}>${formatVoiceLabel(v)}</option>`,
        )
        .join('');
    }

    function pickVoiceForLang(lang) {
      const prefix = lang.startsWith('he') ? 'he' : 'en';
      const match = voices.find((v) => v.lang.startsWith(prefix));
      return match || voices[0] || null;
    }

    function waitForVoicesThenSpeak(index) {
      const generation = session.generation;
      const trySpeak = () => {
        if (session.generation !== generation || session.stopped) return;
        loadVoices();
        if (voices.length) {
          speakChunk(index);
          return;
        }
        setHint('Loading voices… try Play again in a moment.');
      };

      if (window.speechSynthesis.getVoices().length) {
        trySpeak();
        return;
      }

      const onVoices = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
        trySpeak();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoices);
      window.setTimeout(trySpeak, 250);
    }

    function speakChunk(index) {
      if (session.stopped) return;

      const list = chunksRef;
      if (!list.length || index >= list.length) {
        stop();
        return;
      }

      loadVoices();
      if (!voices.length) {
        waitForVoicesThenSpeak(index);
        return;
      }

      const generation = session.generation;
      const chunk = list[index];
      indexRef = index;
      currentIndex = index;
      highlightChunk(chunk.element);

      try {
        const utterance = new SpeechSynthesisUtterance(chunk.text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        utterance.lang = detectUtteranceLang(chunk.text);

        const selected = voices.find((item) => item.voiceURI === voiceURI);
        const voice = selected || pickVoiceForLang(utterance.lang);
        if (voice) utterance.voice = voice;

        utterance.onend = () => {
          const current = session;
          if (
            current.generation !== generation ||
            current.stopped ||
            current.paused
          ) {
            return;
          }
          window.setTimeout(() => {
            const after = session;
            if (
              after.generation !== generation ||
              after.stopped ||
              after.paused
            ) {
              return;
            }
            speakChunk(index + 1);
          }, 280);
        };

        utterance.onerror = (event) => {
          if (session.generation !== generation || session.stopped) return;
          if (event.error === 'interrupted' || event.error === 'canceled') {
            return;
          }
          if (event.error === 'not-allowed') {
            setHint(
              'Speech was blocked. Use Play again after clicking the page, or check browser permissions.',
            );
            stop();
            return;
          }
          if (index < list.length - 1) speakChunk(index + 1);
          else stop();
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
        status = session.paused ? 'paused' : 'playing';
        setHint('');
        updateUI();
      } catch (err) {
        console.error('[read-aloud] speak failed:', err);
        setHint('Could not start speech. Try another browser or voice.');
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
        }
        return false;
      }

      mode = activeMode;
      chunksRef = list;
      chunks = list;
      indexRef = 0;
      currentIndex = 0;

      window.setTimeout(() => speakChunk(0), 50);
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
      window.speechSynthesis.cancel();

      window.setTimeout(() => speakChunk(next), 80);
    }

    function handleStart(readMode) {
      const wasActive = status === 'playing' || status === 'paused';
      if (wasActive) stop();
      window.setTimeout(
        () => {
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
        },
        wasActive ? 100 : 0,
      );
    }

    function handlePlayPause() {
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

    rootEl.querySelector('[data-action="close-panel"]').addEventListener('click', () => {
      rootEl.classList.remove('is-open');
      updateUI();
    });

    ui.fab.addEventListener('click', () => {
      rootEl.classList.toggle('is-open');
      const open = rootEl.classList.contains('is-open');
      ui.fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      updateUI();
    });

    rootEl.querySelector('[data-action="play"]').addEventListener('click', handlePlayPause);
    rootEl.querySelector('[data-action="stop"]').addEventListener('click', stop);
    rootEl.querySelector('[data-action="prev"]').addEventListener('click', () => skip(-1));
    rootEl.querySelector('[data-action="next"]').addEventListener('click', () => skip(1));

    rootEl.querySelectorAll('.read-aloud-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleStart(btn.dataset.mode));
    });

    rootEl.querySelectorAll('.read-aloud-speed-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        rate = Number(btn.dataset.speed);
        updateUI();
      });
    });

    ui.voiceSelect.addEventListener('change', (e) => {
      voiceURI = e.target.value;
    });

    ui.pitchRange.addEventListener('input', (e) => {
      pitch = Number(e.target.value);
      ui.pitchVal.textContent = pitch.toFixed(1);
    });

    ui.volumeRange.addEventListener('input', (e) => {
      volume = Number(e.target.value);
      ui.volumeVal.textContent = `${Math.round(volume * 100)}%`;
    });

    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        rootEl.classList.add('is-open');
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
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:#6c757d;margin-bottom:0.25rem;">
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
          <p class="read-aloud-footer-note">Highlight text first for &ldquo;Read selection&rdquo;. Shortcuts: Alt+R play/pause · Alt+S stop</p>
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
    if (!window.speechSynthesis) return;

    const toolbar = buildToolbar();
    document.body.appendChild(toolbar);
    const controller = createReadAloudController(toolbar);
    window.tanachReadAloud = controller;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
