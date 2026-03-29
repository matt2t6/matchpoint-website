import { initDevMode } from './dev-mode.js';
if (location.search.includes('dev=1')) {
  try { initDevMode(); } catch (e) { console.warn('Dev mode failed to init', e); }
}
// Toggle via chord
window.addEventListener('mp:dev:toggle', ()=>{
  try {
    if (window.__MP_DEV_MODE__) window.__MP_DEV_MODE__.teardown();
    else initDevMode();
  } catch (e) { console.warn('Dev mode toggle failed', e); }
});

