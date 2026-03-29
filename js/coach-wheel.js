(function(){
  const STYLES = {
    zen_master:      { label: "Zen Master",      hue: 160 },
    strategist:      { label: "Strategist",      hue: 200 },
    motivator:       { label: "Motivator",       hue: 15  },
    technician:      { label: "Technician",      hue: 220 },
    empath:          { label: "Empath",          hue: 290 },
    challenger:      { label: "Challenger",      hue: 335 },
    tempo_shifter:   { label: "Tempo Shifter",   hue: 48  },
    storyteller:     { label: "Storyteller",     hue: 265 },
    anchor:          { label: "Anchor",          hue: 180 },
    spark:           { label: "Spark",           hue: 28  },
    sentinel:        { label: "Sentinel",        hue: 120 },
    composer:        { label: "Composer",        hue: 245 }
  };

  let angleOffset = -Math.PI/2; // start at top
  let currentKey = null;
  let wheel, status, announce, rollBtn;

  document.addEventListener('DOMContentLoaded', initCoachWheel);

  function initCoachWheel(){
    wheel   = document.getElementById('coach-wheel');
    status  = document.getElementById('coach-wheel-status');
    announce= document.getElementById('coach-wheel-announce');
    rollBtn = document.getElementById('coach-wheel-roll');
    if(!wheel) return;

    renderTags();
    bindEvents();
  }

  function renderTags(){
    wheel.innerHTML = '';
    const keys = Object.keys(STYLES);
    const n = keys.length;
    const styles = getComputedStyle(wheel);
    const ringVar = styles.getPropertyValue('--ring').trim();
    const R = parseFloat(ringVar) || (parseFloat(styles.getPropertyValue('--size')) * 0.4) || 140;

    keys.forEach((key, i) => {
      const t = i / n * (Math.PI*2) + angleOffset;
      const x = Math.cos(t) * R;
      const y = Math.sin(t) * R;

      const div = document.createElement('div');
      div.className = 'mp-tag';
      div.dataset.key = key;
      div.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
      div.style.borderColor = `hsla(${STYLES[key].hue}, 80%, 65%, .35)`;
      div.textContent = STYLES[key].label;
      div.addEventListener('click', () => selectStyle(key));
      wheel.appendChild(div);
    });

    highlight(currentKey); // maintain selection on re-render
  }

  function selectStyle(key, source='wheel'){
    currentKey = key;
    highlight(key);
    const detail = { key, label: STYLES[key]?.label || key, source };
    try{ window.dispatchEvent(new CustomEvent('mp:persona:selected', { detail })); }catch{}
    if (status) status.textContent = `Selected: ${detail.label}`;
    if (announce) announce.textContent = `Selected ${detail.label}`;
  }

  function highlight(key){
    Array.from(wheel.querySelectorAll('.mp-tag')).forEach(el => {
      el.classList.toggle('active', key && el.dataset.key === key);
    });
  }

  function roll(){
    let pickedKey = null, label = null;
    try {
      if (window.MP_Bandit?.pick) {
        const picked = window.MP_Bandit.pick();
        pickedKey = picked?.key; label = picked?.style?.label;
      }
    } catch {}
    if(!pickedKey){
      const keys = Object.keys(STYLES);
      pickedKey = keys[Math.floor(Math.random()*keys.length)];
      label = STYLES[pickedKey].label;
    }
    selectStyle(pickedKey, 'wheel-roll');
    flash();
  }

  function flash(){
    try { wheel.animate([{boxShadow:'0 0 0 rgba(0,0,0,0)'},{boxShadow:'0 0 28px rgba(0,245,212,.35)'}], {duration:260, direction:'alternate'}); } catch {}
  }

  function easeRotateToward(recommendedKey){
    if(!recommendedKey) return;
    const keys = Object.keys(STYLES);
    const idx = keys.indexOf(recommendedKey);
    if(idx < 0) return;

    const target = (idx / keys.length) * Math.PI*2 - Math.PI/2;
    const start = angleOffset;
    const diff = shortestAngle(target - start);
    const dur = 420;
    const t0 = performance.now();

    function step(now){
      const p = Math.min(1, (now - t0)/dur);
      angleOffset = start + diff * (0.5 - Math.cos(p*Math.PI)/2); // ease-in-out
      renderTags();
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function shortestAngle(a){
    while (a >  Math.PI) a -= Math.PI*2;
    while (a < -Math.PI) a += Math.PI*2;
    return a;
  }

  function bindEvents(){
    rollBtn?.addEventListener('click', roll);

    // External selection highlights on wheel
    window.addEventListener('mp:persona:selected', (e)=>{
      const k = e.detail?.key;
      if(k) { currentKey = k; highlight(k); }
    });

    // Drift nudges wheel toward a recommended style
    window.addEventListener('mp:drift:update', (e)=>{
      const d = e.detail || {};
      let rec = null;
      if (d.fatigue === 'high') rec = 'zen_master';
      else if (d.focus === 'low' || d.tension === 'high') rec = 'empath';
      else if (d.focus === 'high') rec = 'strategist';
      else rec = 'tempo_shifter';
      easeRotateToward(rec);
    });

    // Dice via keyboard chord if your harness uses it
    window.addEventListener('mp:wheel:roll', roll);
  }
})();

// Stealth roll: Ctrl/âŒ˜+Alt+W and public API
(() => {
  let lock = 0;
  window.addEventListener('keydown', (e) => {
    const ctrlOrMeta = e.metaKey || e.ctrlKey;
    if (ctrlOrMeta && e.altKey && e.key.toLowerCase() === 'w') {
      const now = Date.now(); if (now - lock < 600) return; lock = now;
      window.dispatchEvent(new Event('mp:wheel:roll'));
    }
  });
  window.MP_Wheel = window.MP_Wheel || {};
  window.MP_Wheel.select = (key, label = key) =>
    window.dispatchEvent(new CustomEvent('mp:persona:selected', { detail: { key, label, source: 'api' } }));
})();

