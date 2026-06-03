/**
 * Site-wide dark mode toggle with per-section themes (tanach / rambam / mishnah).
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'tanach-color-mode';

  const PAGE_THEMES = {
    '/': 'tanach',
    '/index.html': 'tanach',
    '/reader.html': 'tanach',
    '/reader': 'tanach',
    '/calendar.html': 'tanach',
    '/calendar': 'tanach',
    '/readings.html': 'tanach',
    '/readings': 'tanach',
    '/talmud.html': 'tanach',
    '/talmud': 'tanach',
    '/contact.html': 'tanach',
    '/contact': 'tanach',
    '/privacy.html': 'tanach',
    '/privacy': 'tanach',
    '/rambam.html': 'rambam',
    '/rambam': 'rambam',
    '/mishnah.html': 'mishnah',
    '/mishnah': 'mishnah',
  };

  const META_COLORS = {
    tanach: { light: '#667eea', dark: '#3d4a9e' },
    rambam: { light: '#ff9800', dark: '#c67600' },
    mishnah: { light: '#4caf50', dark: '#2d7a32' },
  };

  const ICON_MOON =
    '<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const ICON_SUN =
    '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

  function detectPageTheme() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    return PAGE_THEMES[path] || PAGE_THEMES[window.location.pathname] || 'tanach';
  }

  function getStoredMode() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function updateMetaThemeColor(mode) {
    const theme = document.documentElement.dataset.theme || 'tanach';
    const colors = META_COLORS[theme] || META_COLORS.tanach;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = mode === 'dark' ? colors.dark : colors.light;
  }

  function applyColorMode(mode) {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme || detectPageTheme();
    root.dataset.colorMode = mode;
    updateMetaThemeColor(mode);
    updateToggle();
  }

  function updateToggle() {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    const dark = document.documentElement.dataset.colorMode === 'dark';
    btn.classList.toggle('is-dark', dark);
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.setAttribute(
      'aria-label',
      dark ? 'Switch to light mode' : 'Switch to dark mode',
    );
    btn.title = dark ? 'Light mode' : 'Dark mode';
  }

  function toggleMode() {
    const next =
      document.documentElement.dataset.colorMode === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyColorMode(next);
  }

  function mountToggle() {
    if (document.querySelector('.theme-toggle')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.innerHTML = ICON_MOON + ICON_SUN;
    btn.addEventListener('click', toggleMode);
    document.body.appendChild(btn);
    updateToggle();
  }

  document.documentElement.dataset.theme = detectPageTheme();
  applyColorMode(getStoredMode());

  window.tanachTheme = { toggle: toggleMode, apply: applyColorMode };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountToggle);
  } else {
    mountToggle();
  }

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (event) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyColorMode(event.matches ? 'dark' : 'light');
      }
    });
})();
