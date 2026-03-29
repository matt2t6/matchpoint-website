// public/assets/js/dev-mode.js
// MatchPoint Dev Mode: Spotlight skin, KPI Tiles, Drift Compass, Replay Capsule
// - Event-driven (listens to mp:* events)
// - Safe to import multiple times (idempotent)
// - Teardown included for hot-reload

export function initDevMode(opts = {}) {
  if (window.__MP_DEV_MODE__) return window.__MP_DEV_MODE__;
  const state = { cleanup: [], wins:0, trials:0, ewma:null };
  window.__MP_DEV_MODE__ = { teardown, state };

  const root = findRoot(opts.rootSelector);
  injectCSS(state);
  mountUI(root, state);
  wireEvents(state);

  // optional: gentle demo if no events show up quickly
  maybeSimulateForDemo();

  return window.__MP_DEV_MODE__;

  // ---------- internals ----------
  function findRoot(sel) {
    const trySel = sel || '#dashboard-container, #demo .glass-card, #demo, main, body';
    const el = document.querySelector(trySel);
    return el || document.body;
  }

  function injectCSS(state) {
    if (document.getElementById('mp-dev-style')) return;
    const css = `
/* Spotlight / glass aesthetic */
.spotlight-card{
  background: linear-gradient(180deg, rgba(2,6,23,.72), rgba(2,6,23,.55));
  border:1px solid rgba(148,163,184,.25);
  border-radius:16px;
  backdrop-filter: blur(12px);
  transition: box-shadow .25s ease, transform .25s ease, border-color .25s;
  padding:12px;
  margin:12px 0;
}
.spotlight-card:hover{ box-shadow:0 10px 30px rgba(0,0,0,.25); border-color:rgba(34,211,238,.55); transform: translateY(-2px); }
.mp-event-pulse{ animation: mpPulse .6s ease; }
@keyframes mpPulse{0%{box-shadow:0 0 0 0 rgba(0,245,212,.5)}100%{box-shadow:0 0 0 12px rgba(0,245,212,0)}}

/* Context chips */
.mp-chip{
  display:inline-flex; align-items:center; gap:.4rem;
  padding:.25rem .55rem; border-radius:999px; font:600 11px/1 Inter,system-ui;
  background:rgba(15,23,42,.6); border:1px solid rgba(148,163,184,.25)
}
.mp-chip[data-kind="drift"]  { color:#22d3ee; border-color:rgba(34,211,238,.35) }
.mp-chip[data-kind="solar"]  { color:#c084fc; border-color:rgba(192,132,252,.35) }
.mp-chip[data-kind="bandit"] { color:#00f5d4; border-color:rgba(0,245,212,.35) }

/* KPI tiles */
#mp-kpis{ display:grid; gap:10px; grid-template-columns:repeat(3,1fr); align-items:center }
#mp-kpis .mp-kpi{ display:flex; flex-direction:column; padding:8px 10px; border-radius:12px; background:rgba(15,23,42,.5); border:1px solid rgba(148,163,184,.15) }
#mp-kpis .label{ font:600 11px/1.2 Inter,system-ui; color:#9aa5b1; letter-spacing:.02em }
#mp-kpis .value{ font:800 20px/1.1 Inter,system-ui; color:#e5f9f5 }
#mp-kpis .mp-tags{ display:flex; gap:8px; justify-content:flex-end; grid-column: 1 / -1 }
@media (max-width: 900px){ #mp-kpis{ grid-template-columns:1fr; } #mp-kpis .mp-tags{ justify-content:flex-start } }
.mp-up   { color:#22d3ee }
.mp-down { color:#ef4444 }

/* Compass */
.mp-compass{ display:flex; justify-content:center; align-items:center }

/* Replay capsule */
.mp-drop{padding:16px;border:1px dashed rgba(148,163,184,.35);border-radius:12px;text-align:center;cursor:pointer}
.mp-drop.mp-hot{background:rgba(34,211,238,.05);border-color:rgba(34,211,238,.6)}
.mp-link{color:#22d3ee;cursor:pointer}
    `.trim();
    const style = document.createElement('style');
    style.id = 'mp-dev-style';
    style.textContent = css;
    document.head.appendChild(style);
    state.cleanup.push(()=> style.remove());
  }

  function mountUI(root, state) {
    // Container dock
    let dock = document.getElementById('mp-dev-dock');
    if (!dock) {
      dock = document.createElement('div');
      dock.id = 'mp-dev-dock';
      root.prepend(dock);
      state.cleanup.push(()=> dock.remove());
    }

    // KPI block
    if (!document.getElementById('mp-kpis')) {
      dock.appendChild(html(`
        <div id="mp-kpis" class="spotlight-card" role="status" aria-live="polite">
          <div class="mp-kpi"><span class="label">Coaching Uplift</span><span id="kpi-uplift" class="value">â€”</span></div>
          <div class="mp-kpi"><span class="label">Fibonacci Gain</span><span id="kpi-gain" class="value">â€”</span></div>
          <div class="mp-kpi"><span class="label">Bandit Win Rate</span><span id="kpi-bandit" class="value">â€”</span></div>
          <div class="mp-tags">
            <span class="mp-chip" data-kind="drift">drift: <b id="kpi-drift">â€”</b></span>
            <span class="mp-chip" data-kind="solar">domain: <b>solar</b></span>
            <span class="mp-chip" data-kind="bandit">learner: <b>ucb1</b></span>
          </div>
        </div>
      `));
    }

    // Compass
    if (!document.getElementById('mp-compass')) {
      dock.appendChild(html(`
        <div class="spotlight-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <h3 style="font:700 14px Inter">Emotional Drift Compass</h3>
            <span class="mp-chip" data-kind="drift">live</span>
          </div>
          <div id="mp-compass" class="mp-compass">
            <svg viewBox="0 0 120 120" width="100%" height="140" aria-label="Emotional Drift Compass">
              <defs><radialGradient id="g" cx="50%" cy="50%"><stop offset="0%" stop-color="rgba(34,211,238,.25)"/><stop offset="100%" stop-color="rgba(34,211,238,0)"/></radialGradient></defs>
              <circle cx="60" cy="60" r="52" fill="rgba(15,23,42,.6)" stroke="rgba(148,163,184,.25)" stroke-width="1" />
              <circle cx="60" cy="60" r="52" fill="url(#g)" />
              <line x1="60" y1="8" x2="60" y2="112" stroke="rgba(148,163,184,.25)" stroke-width="1"/>
              <line x1="8"  y1="60" x2="112" y2="60" stroke="rgba(148,163,184,.25)" stroke-width="1"/>
              <g id="mp-needle" transform="rotate(0,60,60)"><polygon points="60,18 66,62 60,70 54,62" fill="#00f5d4"/></g>
              <circle cx="60" cy="60" r="3" fill="#e2e8f0"/>
              <text x="60" y="16" text-anchor="middle" font-size="8" fill="#9aa5b1">focus+</text>
              <text x="60" y="116" text-anchor="middle" font-size="8" fill="#9aa5b1">fatigue+</text>
            </svg>
          </div>
        </div>
      `));
    }

    // Replay
    if (!document.getElementById('mp-replay-drop')) {
      dock.appendChild(html(`
        <div class="spotlight-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <h3 style="font:700 14px Inter">Replay Capsule</h3>
            <button id="mp-replay-golden" class="mp-chip" data-kind="bandit" type="button">Play Golden Replay</button>
          </div>
          <div id="mp-replay-drop" class="mp-drop">
            Drop a replay JSON here or <label class="mp-link">
              <input id="mp-replay-file" type="file" accept=".json" hidden>browse
            </label>
          </div>
        </div>
      `));
    }
  }

  function wireEvents(state){
    const $ = (id)=>document.getElementById(id);
    const elU = $('kpi-uplift'), elG = $('kpi-gain'), elB = $('kpi-bandit'), elD = $('kpi-drift');
    const needle = document.getElementById('mp-needle');

    const pulse = (el)=>{ if(!el) return; el.classList.remove('mp-event-pulse'); el.offsetWidth; el.classList.add('mp-event-pulse'); };

    // Coaching uplift: EWMA of audit deltas
    const onAudit = (e)=>{
      const s = Number(e?.detail?.audit_score);
      if(!Number.isFinite(s)) return;
      if(state.ewma==null) state.ewma = s;
      const prev = state.ewma || s || 1;
      state.ewma = 0.7*state.ewma + 0.3*s;
      const delta = ((state.ewma - prev) / (prev || 1)) * 100;
      if(elU){ elU.textContent = (delta>=0?'+':'') + delta.toFixed(1) + '%'; elU.className = 'value ' + (delta>=0?'mp-up':'mp-down'); pulse(elU); }
    };
    window.addEventListener('mp:cue_audit', onAudit);
    state.cleanup.push(()=> window.removeEventListener('mp:cue_audit', onAudit));

    // Fibonacci gain
    const onLayout = (e)=>{
      const g = Number(e?.detail?.gain_pct);
      if(!Number.isFinite(g)) return;
      if(elG){ elG.textContent = (g>=0?'+':'') + g.toFixed(1) + '%'; elG.className = 'value ' + (g>=0?'mp-up':'mp-down'); pulse(elG); }
    };
    window.addEventListener('mp:layout:diff', onLayout);
    state.cleanup.push(()=> window.removeEventListener('mp:layout:diff', onLayout));

    // Bandit outcomes
    const renderBandit = ()=>{
      if(window.MP_Bandit?.stats){
        const stats = window.MP_Bandit.stats();
        if(stats && stats.length){
          const totalW = stats.reduce((a,b)=>a+b.wins,0);
          const totalT = stats.reduce((a,b)=>a+b.trials,0) || 1;
          if(elB){ elB.textContent = ((totalW/totalT)*100).toFixed(1)+'%'; pulse(elB); }
          return;
        }
      }
      if(elB){ elB.textContent = ((state.wins/(state.trials||1))*100).toFixed(1)+'%'; }
    };
    const onOutcome = (e)=>{
      state.trials++; if (e?.detail?.success) state.wins++;
      renderBandit();
    };
    window.addEventListener('mp:style_outcome', onOutcome);
    state.cleanup.push(()=> window.removeEventListener('mp:style_outcome', onOutcome));
    renderBandit();

    // Drift compass
    const toAngle = (focus=0.5, fatigue=0.5)=>{
      const x = (focus - 0.5);
      const y = ((1 - fatigue) - 0.5);
      const deg = Math.atan2(y, x) * 180/Math.PI;
      return deg + 90;
    };
    const setAngle = (deg)=>{
      if(!needle) return;
      needle.setAttribute('transform', `rotate(${deg.toFixed(1)},60,60)`);
      needle.classList.remove('mp-event-pulse'); needle.getBoundingClientRect(); needle.classList.add('mp-event-pulse');
    };
    const onDrift = (e)=>{
      const f = Number(e?.detail?.focus ?? 0.5);
      const fa= Number(e?.detail?.fatigue ?? 0.5);
      if (elD){ elD.textContent = `focus:${Math.round(f*100)}% / fatigue:${Math.round(fa*100)}%`; pulse(elD); }
      setAngle(toAngle(f, fa));
    };
    window.addEventListener('mp:drift:update', onDrift);
    state.cleanup.push(()=> window.removeEventListener('mp:drift:update', onDrift));

    // Replay capsule
    const drop = document.getElementById('mp-replay-drop');
    const file = document.getElementById('mp-replay-file');
    const btn  = document.getElementById('mp-replay-golden');
    if(drop && file && btn){
      const playPayload = (payload)=>{
        if(window.MP_Replay?.playPayload){ window.MP_Replay.playPayload(payload); }
        else { window.dispatchEvent(new CustomEvent('mp:replay:payload',{detail:payload})); }
      };
      const playFile = (f)=>{
        if(!f) return;
        const r = new FileReader();
        r.onload = ()=>{ try{ playPayload(JSON.parse(r.result)); }catch(e){ console.warn('Replay parse failed', e);} };
        r.readAsText(f);
      };
      const onDragOver = (e)=>{ e.preventDefault(); drop.classList.add('mp-hot'); };
      const onDragLeave= ()=> drop.classList.remove('mp-hot');
      const onDrop     = (e)=>{ e.preventDefault(); drop.classList.remove('mp-hot'); playFile(e.dataTransfer.files?.[0]); };
      const onClick    = ()=> file.click();
      const onChange   = (e)=> playFile(e.target.files?.[0]);
      drop.addEventListener('dragover', onDragOver);
      drop.addEventListener('dragleave', onDragLeave);
      drop.addEventListener('drop', onDrop);
      drop.addEventListener('click', onClick);
      file.addEventListener('change', onChange);
      btn.addEventListener('click', async ()=>{
        try{
          const res = await fetch('/assets/replays/golden.json', {cache:'no-store'});
          if(res.ok){ playPayload(await res.json()); return; }
        }catch{}
        playPayload({
          events:[
            {type:'mp:sound-enabled', ts:Date.now()},
            {type:'mp:persona:selected', ts:Date.now()+500, detail:{key:'zen_master', ctx:{fatigue:'high'}}},
            {type:'mp:cue_audit', ts:Date.now()+1500, detail:{audit_score:0.78}},
            {type:'mp:style_outcome', ts:Date.now()+2600, detail:{style:'zen_master', success:true}},
            {type:'mp:layout:diff', ts:Date.now()+3700, detail:{gain_pct:4.2}}
          ]
        });
      });
      state.cleanup.push(()=>{
        drop.removeEventListener('dragover', onDragOver);
        drop.removeEventListener('dragleave', onDragLeave);
        drop.removeEventListener('drop', onDrop);
        drop.removeEventListener('click', onClick);
        file.removeEventListener('change', onChange);
      });
    }
  }

  function maybeSimulateForDemo(){
    const dev = location.search.includes('dev=1');
    if (!dev) return;
    // If nothing fires within 2s, emit gentle drift + gain so UI shows life.
    setTimeout(()=>{
      // skip if already updated
      const touched = document.querySelector('.mp-event-pulse');
      if (touched) return;
      window.dispatchEvent(new CustomEvent('mp:drift:update', {detail:{focus:.62, fatigue:.41}}));
      window.dispatchEvent(new CustomEvent('mp:layout:diff', {detail:{gain_pct:3.7}}));
      window.dispatchEvent(new CustomEvent('mp:cue_audit', {detail:{audit_score:.74}}));
    }, 2000);
  }

  function teardown(){
    (state.cleanup || []).forEach(fn => { try{ fn(); }catch{} });
    delete window.__MP_DEV_MODE__;
  }

  function html(markup){
    const t = document.createElement('template');
    t.innerHTML = markup.trim();
    return t.content.firstElementChild;
  }
}

