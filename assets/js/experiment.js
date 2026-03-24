// MatchPoint A/B Experiment Helper
// - Assigns an arm per session (harmonic_on | harmonic_off)
// - Tracks basic KPIs (time_to_stability_ms via SSE open)
// - Exposes window.MPExperiment.logKPI to post to backend

(function(){
  const LS_ARM = 'mp_exp_arm';
  const LS_SESSION = 'mp_exp_session_id';
  const BADGE_ID = 'experiment-badge';
  const TOGGLE_ID = 'experiment-toggle';

  function uuid(){
    try { return crypto.randomUUID(); } catch { return 'sess-'+Math.random().toString(36).slice(2); }
  }

  function getSessionId(){
    let sid = localStorage.getItem(LS_SESSION);
    if (!sid){ sid = uuid(); localStorage.setItem(LS_SESSION, sid); }
    return sid;
  }

  function getArm(){
    let arm = localStorage.getItem(LS_ARM);
    if (!arm){ arm = Math.random() < 0.5 ? 'harmonic_on' : 'harmonic_off'; localStorage.setItem(LS_ARM, arm); }
    return arm;
  }

  function setArm(arm){
    if (arm !== 'harmonic_on' && arm !== 'harmonic_off') return;
    localStorage.setItem(LS_ARM, arm);
    updateBadge(arm);
  }

  function updateBadge(arm){
    const badge = document.getElementById(BADGE_ID);
    if (badge){ badge.textContent = 'Experiment: ' + (arm === 'harmonic_on' ? 'ON' : 'OFF'); }
  }

  async function logKPI(kpis){
    try{
      const body = {
        session_id: getSessionId(),
        arm: getArm(),
        time_to_stability_ms: kpis?.time_to_stability_ms ?? 0,
        anomaly_delta: kpis?.anomaly_delta ?? 0,
        sla_recovery_ms: kpis?.sla_recovery_ms ?? 0,
        extra: kpis?.extra || {}
      };
      const res = await fetch('/api/experiment/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await res.json();
    }catch(e){ return { ok:false, error: String(e) }; }
  }

  // Track time-to-stability via SSE open from page load
  const pageStart = performance.now();
  let ttsLogged = false;
  window.addEventListener('mp:sse:open', async ()=>{
    if (ttsLogged) return;
    ttsLogged = true;
    const delta = Math.round(performance.now() - pageStart);
    try { await logKPI({ time_to_stability_ms: delta }); } catch {}
  });

  // Wire toggle
  function wireToggle(){
    const toggle = document.getElementById(TOGGLE_ID);
    if (!toggle) return;
    toggle.addEventListener('click', ()=>{
      const next = getArm() === 'harmonic_on' ? 'harmonic_off' : 'harmonic_on';
      setArm(next);
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', ()=>{
    updateBadge(getArm());
    wireToggle();
  });

  // Public API
  window.MPExperiment = { getArm, setArm, logKPI };
})();

