(function(){
  function isAccel(e){ return (e.ctrlKey || e.metaKey) && e.altKey; }
  window.addEventListener('keydown', (e) => {
    if (!isAccel(e)) return;
    if (e.key.toLowerCase() === 'm') { e.preventDefault(); window.dispatchEvent(new CustomEvent('mp:dev:toggle')); }
    if (e.key.toLowerCase() === 'r') { e.preventDefault(); window.dispatchEvent(new CustomEvent('mp:replay:golden')); }
    if (e.key.toLowerCase() === 'a') { e.preventDefault(); window.dispatchEvent(new CustomEvent('mp:ask:show')); }
    if (e.key === '0') { e.preventDefault(); window.dispatchEvent(new CustomEvent('mp:reset')); }
  });
})();

// === MP GO Harness (dev-only) ================================================
(() => {
  const devOn = /\bdev=1\b/.test(location.search) || localStorage.getItem('mp_dev_enabled') === '1';
  if (!devOn || window.MP_GoHarness) return;

  // minimal styles (safe to inline; tiny + isolated)
  const css = `
  #mp-go-btn{position:fixed;right:18px;bottom:18px;z-index:99999;
    padding:.55rem .7rem;border-radius:.75rem;border:1px solid rgba(0,245,212,.45);
    background:rgba(10,14,18,.8);backdrop-filter:blur(6px);color:#00f5d4;
    font:600 12px/1.2 Inter,system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.35);
    cursor:pointer;transition:transform .15s ease, box-shadow .2s ease}
  #mp-go-btn:hover{transform:translateY(-1px)}
  #mp-go-btn:disabled{opacity:.5;cursor:not-allowed}
  #mp-go-panel{position:fixed;right:18px;bottom:62px;z-index:99998;
    min-width:240px;max-width:320px;padding:.6rem .75rem;border-radius:.9rem;
    border:1px solid rgba(55,65,81,.6);background:rgba(16,23,30,.85);backdrop-filter:blur(8px);
    color:#c9d1d9;font:500 12px/1.4 Inter,system-ui,sans-serif;display:none}
  #mp-go-panel.show{display:block}
  #mp-go-panel .row{display:flex;align-items:center;gap:.5rem;margin:.2rem 0}
  #mp-go-panel .tick{width:1.2em;text-align:center;font-weight:800}
  #mp-go-panel .ok{color:#10b981} /* emerald */
  #mp-go-panel .fail{color:#ef4444} /* red */
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const panel = document.createElement('div'); panel.id = 'mp-go-panel';
  const btn = document.createElement('button'); btn.id = 'mp-go-btn'; btn.type = 'button'; btn.textContent = 'GO';
  btn.setAttribute('aria-label', 'Run demo GO harness'); document.body.append(panel, btn);

  const logRow = (ok, msg) => {
    const row = document.createElement('div'); row.className = 'row';
    const tick = document.createElement('span'); tick.className = 'tick ' + (ok ? 'ok' : 'fail');
    tick.textContent = ok ? 'âœ“' : 'âœ•';
    const text = document.createElement('span'); text.textContent = msg;
    row.append(tick, text); panel.append(row);
    console[(ok ? 'log' : 'warn')]((ok ? 'âœ“ ' : 'âœ• ') + msg);
    panel.classList.add('show');
  };

  const waitOnce = (type, ms = 8000) => new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(type + ' timeout')), ms);
    function h(){ clearTimeout(t); window.removeEventListener(type, h); res(); }
    window.addEventListener(type, h, { once: true });
  });

  async function runHarness() {
    btn.disabled = true;
    panel.innerHTML = '';
    const restore = () => localStorage.removeItem('mp_vo_force');

    try {
      // TTS / default path
      restore();
      window.dispatchEvent(new Event('mp:sound-enabled'));
      window.dispatchEvent(new CustomEvent('mp:tour:start'));
      await waitOnce('mp:vo:started'); await waitOnce('mp:vo:ended');
      logRow(true, 'VO (auto/TTS)');

      // MP3 fallback path
      localStorage.setItem('mp_vo_force','mp3');
      window.dispatchEvent(new CustomEvent('mp:tour:start'));
      await waitOnce('mp:vo:started'); await waitOnce('mp:vo:ended');
      logRow(true, 'VO (MP3 fallback)');

      // Caption path
      localStorage.setItem('mp_vo_force','fail');
      window.dispatchEvent(new CustomEvent('mp:tour:start'));
      await waitOnce('mp:vo:ended');
      logRow(true, 'VO (caption path)');

      // ASK modal open/close
      window.dispatchEvent(new CustomEvent('mp:ask:show'));
      await new Promise(r => setTimeout(r, 500));
      document.getElementById('ask-close-btn')?.click();
      logRow(true, 'ASK modal open/close');

      // Final stamp
      logRow(true, 'ðŸŽ¬ Demo VO + ASK: GO');
    } catch (e) {
      logRow(false, e.message || 'Harness error');
    } finally {
      restore();
      btn.disabled = false;
      setTimeout(() => panel.classList.remove('show'), 4500);
    }
  }

  btn.addEventListener('click', runHarness);
  window.MP_GoHarness = { run: runHarness, panel, btn };
})();

// === Stealth reveal for GO harness (toggle with Ctrl/âŒ˜ + Alt + G) ==========
(() => {
  const GH = window.MP_GoHarness;
  if (!GH) return;

  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  const fromQuery = /\bgo=1\b/.test(location.search);
  const fromStorage = localStorage.getItem('mp_go_visible') === '1';

  // helper: show/hide + persist
  function toggle(show) {
    const btn = GH.btn;
    if (!btn) return;
    btn.style.display = show ? '' : 'none';
    btn.setAttribute('aria-hidden', show ? 'false' : 'true');
    try { localStorage.setItem('mp_go_visible', show ? '1' : '0'); } catch {}
  }

  // expose a programmatic toggle too
  GH.toggle = toggle;

  // default hidden unless explicitly requested
  toggle(fromQuery || fromStorage);

  // ignore chords while typing
  const inEditable = (e) =>
    e.target && (
      e.target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
    );

  let last = 0;
  window.addEventListener('keydown', (e) => {
    if (inEditable(e)) return;
    const ctrlOrMeta = isMac ? e.metaKey : e.ctrlKey;
    if (ctrlOrMeta && e.altKey && e.code === 'KeyG') {
      e.preventDefault();
      const now = Date.now();
      if (now - last < 500) return; // throttle
      last = now;
      const visible = GH.btn && GH.btn.style.display !== 'none';
      toggle(!visible);
    }
  });

  // optional: hide GO button after a successful run (keeps panel behavior unchanged)
  const originalRun = GH.run?.bind(GH);
  if (originalRun) {
    GH.run = async (...args) => {
      try { return await originalRun(...args); }
      finally {
        // auto-hide the button a moment after success to keep recordings clean
        setTimeout(() => toggle(false), 3500);
      }
    };
  }
})();

// Auto-hide GO button after Demo Ready (keeps capture clean)
(function(){
  const hideGo = () => {
    try { setTimeout(() => window.MP_GoHarness?.toggle?.(false), 800); } catch {}
  };
  window.addEventListener('mp:demo:ready', hideGo);
  // compatibility: if you dispatch a generic mp:demo when ready
  window.addEventListener('mp:demo', hideGo);
})();

