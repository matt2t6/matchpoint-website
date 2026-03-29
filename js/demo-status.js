(function () {
  const S = {
    status: 'OFFLINE',   // 'LIVE' | 'REPLAY' | 'OFFLINE'
    lastEventAt: 0,
    replaying: false,
    sseOpen: false,
    captions: !!JSON.parse(localStorage.getItem('mp_captions_on') || 'false'),
    contrast: !!JSON.parse(localStorage.getItem('mp_contrast_high') || 'false'),
    voStarted: false,
    voEnded: false,
    kpiTicked: false,
  };

  function setStatusChip(next) {
    const chip = document.getElementById('mp-status-chip');
    if (!chip) return;
    const dot = chip.querySelector('.dot');
    const label = chip.querySelector('.label');
    S.status = next;
    dot.className = 'dot ' + (next === 'LIVE' ? 'live' : next === 'REPLAY' ? 'replay' : 'off');
    label.textContent = next;
    chip.classList.add('mp-pulse');
    setTimeout(() => chip.classList.remove('mp-pulse'), 350);
  }

  function buildChipOnce() {
    if (document.getElementById('mp-status-chip')) return;
    const chip = document.createElement('div');
    chip.id = 'mp-status-chip';
    chip.innerHTML = '<span class="dot off" aria-hidden="true"></span>'+
      '<span class="label" aria-live="polite">OFFLINE</span>'+
      '<button type="button" id="mp-btn-captions" title="Toggle captions">CC</button>'+
      '<button type="button" id="mp-btn-contrast" title="High contrast">HC</button>'+
      '<button type="button" id="mp-btn-reset" title="Reset demo">Reset</button>';
    document.body.appendChild(chip);

    // Apply persisted toggles
    if (S.captions) document.documentElement.classList.add('mp-captions-on');
    if (S.contrast)  document.documentElement.classList.add('mp-contrast-high');

    const btnCC = chip.querySelector('#mp-btn-captions');
    const btnHC = chip.querySelector('#mp-btn-contrast');
    btnCC.setAttribute('aria-pressed', String(!!S.captions));
    btnHC.setAttribute('aria-pressed', String(!!S.contrast));

    btnCC.addEventListener('click', () => {
      S.captions = !S.captions;
      localStorage.setItem('mp_captions_on', JSON.stringify(S.captions));
      document.documentElement.classList.toggle('mp-captions-on', S.captions);
      btnCC.setAttribute('aria-pressed', String(S.captions));
      window.dispatchEvent(new CustomEvent('mp:captions:toggle', { detail: { on: S.captions }}));
    });

    btnHC.addEventListener('click', () => {
      S.contrast = !S.contrast;
      localStorage.setItem('mp_contrast_high', JSON.stringify(S.contrast));
      document.documentElement.classList.toggle('mp-contrast-high', S.contrast);
      btnHC.setAttribute('aria-pressed', String(S.contrast));
    });

    chip.querySelector('#mp-btn-reset').addEventListener('click', hardReset);

    // One-tap reset chord: Ctrl/âŒ˜ + Alt + 0
    document.addEventListener('keydown', (e) => {
      const metaOrCtrl = e.metaKey || e.ctrlKey;
      if (metaOrCtrl && e.altKey && (e.key === '0' || e.code === 'Digit0')) {
        e.preventDefault();
        hardReset();
      }
    });
  }

  // --- Demo Ready Banner ---
  function injectReadyStylesOnce(){
    if (document.getElementById('mp-ready-style')) return;
    const css = `#mp-ready-banner{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:99998;padding:.45rem .75rem;border-radius:10px;background:linear-gradient(135deg,rgba(16,185,129,.95),rgba(34,211,238,.95));color:#0b1220;border:1px solid rgba(255,255,255,.45);box-shadow:0 10px 28px rgba(0,0,0,.35);font:700 12px/1.1 Inter,system-ui,sans-serif;display:none;align-items:center;gap:.5rem}#mp-ready-banner.show{display:flex}#mp-ready-banner .x{margin-left:.5rem;background:rgba(0,0,0,.12);border:1px solid rgba(0,0,0,.25);border-radius:8px;padding:2px 6px;font:800 11px/1 Inter;cursor:pointer}`;
    const st = document.createElement('style'); st.id='mp-ready-style'; st.textContent = css; document.head.appendChild(st);
  }
  function buildReadyBannerOnce(){
    // If new banner exists, don't build legacy
    if (document.getElementById('demo-ready-banner')) return;
    if (document.getElementById('mp-ready-banner')) return;
    injectReadyStylesOnce();
    const b = document.createElement('div'); b.id='mp-ready-banner'; b.setAttribute('role','status'); b.setAttribute('aria-live','polite');
    b.innerHTML = '<span>âœ“ Demo Ready</span><button class="x" type="button" aria-label="Dismiss">Ã—</button>';
    b.querySelector('.x').addEventListener('click', ()=> b.classList.remove('show'));
    document.body.appendChild(b);
  }
  function updateReadyBanner(){
    const ok = (S.status !== 'OFFLINE') && (S.voEnded || (S.voStarted && S.captions)) && S.kpiTicked;
    const legacy = document.getElementById('mp-ready-banner');
    const modern = document.getElementById('demo-ready-banner');
    if (modern) {
      if (ok) {
        try { window.dispatchEvent(new Event('mp:demo:ready')); } catch {}
      } else {
        try { window.dispatchEvent(new Event('mp:demo:reset')); } catch {}
      }
    } else if (legacy) {
      legacy.classList.toggle('show', ok);
    }
  }

  function hardReset() {
    document.getElementById('walkthrough-overlay')?.classList.remove('visible');
    document.querySelectorAll('.spotlight').forEach(el => el.classList.remove('spotlight'));
    window.MP_TourVO?.stop?.();
    window.MP_Dev?.stop?.();
    try { window.stopSession?.(); } catch {}
    document.querySelectorAll('.toast-coach').forEach(n => n.remove());
    document.querySelectorAll('[data-kpi]').forEach(el => el.textContent = '--');
    S.replaying = false; window.dispatchEvent(new Event('mp:reset'));
    if (!S.sseOpen) setStatusChip('OFFLINE');
  }

  // Cross-browser audio sanity: prime on first user gesture (iOS Safari)
  let primed = false;
  function primeAudioOnce() {
    if (primed) return; primed = true;
    Promise.resolve().then(() => window.MP_enableAudio?.()).catch(()=>{});
  }
  ['click','touchstart','keydown'].forEach(ev =>
    document.addEventListener(ev, primeAudioOnce, { once: true, passive: true })
  );

  // Wire up status event listeners
  window.addEventListener('mp:sse:open', () => { S.sseOpen = true; setStatusChip('LIVE'); });
  window.addEventListener('mp:sse:error', () => { S.sseOpen = false; if (!S.replaying) setStatusChip('OFFLINE'); });
  window.addEventListener('mp:replay:start', () => { S.replaying = true; setStatusChip('REPLAY'); });
  window.addEventListener('mp:replay:end', () => { S.replaying = false; setStatusChip(S.sseOpen ? 'LIVE' : 'OFFLINE'); });
  // Treat SSE beats as liveness
  window.addEventListener('mp:sse:beat', () => { S.lastEventAt = Date.now(); if (S.sseOpen && !S.replaying) setStatusChip('LIVE'); });
  // VO readiness
  window.addEventListener('mp:vo:started', ()=> { S.voStarted = true; updateReadyBanner(); });
  window.addEventListener('mp:vo:ended',   ()=> { S.voEnded = true; updateReadyBanner(); });
  // KPI tick surrogates
  ['mp:style_outcome','mp:layout:diff','mp:cue_audit'].forEach(evt =>
    window.addEventListener(evt, ()=> { S.kpiTicked = true; updateReadyBanner(); })
  );
  ;['mp:drift:update','mp:persona:selected','mp:cue_audit','mp:style_outcome','mp:layout:diff']
    .forEach(evt => window.addEventListener(evt, () => { S.lastEventAt = Date.now(); if (S.sseOpen && !S.replaying && S.status !== 'LIVE') setStatusChip('LIVE'); }));
  setInterval(() => { if (!S.replaying && !S.sseOpen && Date.now() - S.lastEventAt > 15000 && S.status !== 'OFFLINE') setStatusChip('OFFLINE'); }, 3000);

  document.addEventListener('DOMContentLoaded', () => {
    buildChipOnce();
    buildReadyBannerOnce();
    setStatusChip(S.sseOpen ? 'LIVE' : (S.replaying ? 'REPLAY' : 'OFFLINE'));
    updateReadyBanner();
  });

  // Auto-hide module for modern banner
  (function(){
    const BANNER_ID = 'demo-ready-banner';
    let autohideTimer = null;
    const AUTOHIDE_MS = 5000;
    const $ = (id) => document.getElementById(id);
    const isPinned = () => localStorage.getItem('mp_demo_banner_pin') === '1';
    const setPinned = (v) => localStorage.setItem('mp_demo_banner_pin', v ? '1' : '0');

    function showBanner() {
      const el = $(BANNER_ID);
      if (!el) return;
      el.classList.add('is-visible');
      el.classList.remove('hidden');
      el.setAttribute('aria-hidden', 'false');
      // clear previous timer
      if (autohideTimer) { clearTimeout(autohideTimer); autohideTimer = null; }
      const wantsReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const eligible = !isPinned();
      if (eligible) {
        autohideTimer = setTimeout(() => {
          if (document.activeElement && el.contains(document.activeElement)) return;
          if (el.matches(':hover')) return;
          hideBanner();
        }, AUTOHIDE_MS + (wantsReduce ? 0 : 0));
      }
    }
    function hideBanner() {
      const el = $(BANNER_ID);
      if (!el) return;
      el.classList.remove('is-visible');
      const done = () => {
        el.classList.add('hidden');
        el.setAttribute('aria-hidden', 'true');
        el.removeEventListener('transitionend', done);
      };
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { done(); }
      else { el.addEventListener('transitionend', done); }
    }
    window.MP_DemoReady = {
      pin(on = true) { setPinned(on); if (!on) showBanner(); },
      hide: hideBanner,
      show: showBanner,
    };
    const el = $(BANNER_ID);
    if (el && !el.dataset.handlers) {
      el.dataset.handlers = '1';
      const pinBtn = el.querySelector('[data-pin]');
      const closeBtn = el.querySelector('[data-close]');
      pinBtn?.addEventListener('click', () => {
        const next = !isPinned();
        setPinned(next); pinBtn.setAttribute('aria-pressed', String(next));
        if (next) showBanner();
      });
      closeBtn?.addEventListener('click', hideBanner);
      el.addEventListener('mouseenter', () => { if (autohideTimer) { clearTimeout(autohideTimer); autohideTimer = null; }});
      el.addEventListener('focusin', () => { if (autohideTimer) { clearTimeout(autohideTimer); autohideTimer = null; }});
    }
    window.addEventListener('mp:demo:ready', showBanner);
    window.addEventListener('mp:demo:reset', hideBanner);
  })();
})();

