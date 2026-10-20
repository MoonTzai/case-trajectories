/* UI preference only; applied in <head> before painting, independent of project state. */
(function () {
  'use strict';
  const key = 'dug.workbench.theme', root = document.documentElement;
  let current = 'light';
  try { if (localStorage.getItem(key) === 'dark') current = 'dark'; } catch (_) {}
  const icons = {
    light: '<path d="M20.1 15.3A8.5 8.5 0 0 1 8.7 3.9 8.5 8.5 0 1 0 20.1 15.3Z"/>',
    dark: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
  };
  function apply() {
    root.dataset.theme = current;
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', current);
    const button = document.getElementById('btn-theme');
    if (button) {
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[current] + '</svg><span>' + (current === 'light' ? '深色' : '浅色') + '</span>';
      button.setAttribute('aria-label', current === 'light' ? '切换到深色主题' : '切换到浅色主题');
      button.setAttribute('title', current === 'light' ? '切换到深色主题' : '切换到浅色主题');
      window.DUG_I18N?.apply();
    }
  }
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    document.getElementById('btn-theme').addEventListener('click', () => {
      current = current === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(key, current); } catch (_) {}
      apply();
    });
  }, { once: true });
})();
