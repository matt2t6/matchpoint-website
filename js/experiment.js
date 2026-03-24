(function(){
  const LS_KEY = 'mp_experiment_arm';
  const SESSION_KEY = 'mp_experiment_session_id';

  function uid(){ return 'sess-' + Math.random().toString(36).slice(2,8) + '-' + Date.now(); }

  function getArm(){ return (localStorage.getItem(LS_KEY) || 'harmonic_on'); }
  function setArm(v){ localStorage.setItem(LS_KEY, v); updateBadge(); }
  function toggleArm(){ setArm(getArm()==='harmonic_on' ? 'harmonic_off' : 'harmonic_on'); }

  let state = {
    sessionId: null,
    startTs: null,
    baseline: { anomaly: null, latency: null },
    last: { anomaly: null, latency: null },
    stability: { window: [], reached: false, t_ms: 0 },
    slaRecoveryMs: 0,
  };

  function resetSession(){
    state = {
      sessionId: uid(),
      startTs: performance.now(),
      baseline: { anomaly: null, latency: null },
      last: { anomaly: null, latency: null },
      stability: { window: [], reached: false, t_ms: 0 },
      slaRecoveryMs: 0,
    };
    localStorage.setItem(SESSION_KEY, state.sessionId);
  }

  function updateBadge(){
    const el = document.getElementById('experiment-badge');
    if(!el) return;
    const on = getArm()==='harmonic_on';
    el.textContent = 'Experiment: ' + (on ? 'ON' : 'OFF');
    el.className = 'fixed top-3 right-3 text-xs px-2 py-1 rounded ' + (on ? 'bg-emerald-600 text-white' : 'bg-slate-600 text-white');
  }

  async function postJSON(url, body){
    try{ const r = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); return await r.json(); } catch { return null }
  }

  function onValidation(detail){
    if(!detail) return;
    const latency = Number(detail?.enterprise_metrics?.performance_slas?.avg_latency);
    const anomaly = Number(
      (detail.sensor_fusion && detail.sensor_fusion.anomaly_detection_score!=null)
        ? detail.sensor_fusion.anomaly_detection_score
        : (detail.neural_net ? detail.neural_net.anomaly_score : NaN)
    );
    if(!Number.isFinite(latency) && !Number.isFinite(anomaly)) return;

    if(state.baseline.anomaly==null && Number.isFinite(anomaly)) state.baseline.anomaly = anomaly;
    if(state.baseline.latency==null && Number.isFinite(latency)) state.baseline.latency = latency;
    state.last.anomaly = Number.isFinite(anomaly)? anomaly : state.last.anomaly;
    state.last.latency = Number.isFinite(latency)? latency : state.last.latency;

    // SLA recovery (first time under or equal 200ms)
    if(!state.slaRecoveryMs && Number.isFinite(latency) && latency <= 200){
      state.slaRecoveryMs = Math.round(performance.now() - state.startTs);
    }

    // Stability: last 5 deltas < 0.005
    if(Number.isFinite(anomaly)){
      const w = state.stability.window; w.push(anomaly); if(w.length>6) w.shift();
      if(!state.stability.reached && w.length>=6){
        let stable=true; for(let i=1;i<w.length;i++){ if(Math.abs(w[i]-w[i-1])>0.005){ stable=false; break; } }
        if(stable){ state.stability.reached=true; state.stability.t_ms = Math.round(performance.now() - state.startTs); }
      }
    }
  }

  async function finalizeAndLog(){
    const arm = getArm();
    const anomalyDelta = (state.baseline.anomaly!=null && state.last.anomaly!=null) ? (state.baseline.anomaly - state.last.anomaly) : 0;
    const payload = {
      session_id: state.sessionId || uid(),
      arm,
      time_to_stability_ms: state.stability.t_ms || 0,
      anomaly_delta: Number.isFinite(anomalyDelta)? Number(anomalyDelta.toFixed(3)) : 0,
      sla_recovery_ms: state.slaRecoveryMs || 0,
      extra: { baseline_latency: state.baseline.latency, baseline_anomaly: state.baseline.anomaly }
    };
    await postJSON('/api/experiment/log', payload);
  }

  // Public helpers
  window.MPExperiment = { getArm, setArm, toggleArm, resetSession, finalizeAndLog };

  // Wire UI elements + events
  document.addEventListener('DOMContentLoaded', ()=>{
    updateBadge();
    const toggle = document.getElementById('experiment-toggle');
    if(toggle){ toggle.addEventListener('click', ()=>{ toggle.disabled=true; toggle.textContent='Switching...'; toggleArm(); updateBadge(); setTimeout(()=>{toggle.disabled=false; toggle.textContent='Toggle Arm';},400); }); }

    const startBtn = document.getElementById('start-session-btn');
    if(startBtn){ startBtn.addEventListener('click', ()=>{ resetSession(); }); }

    window.addEventListener('beforeunload', ()=>{ finalizeAndLog(); });
  });

  // Consume SSE validation updates
  window.addEventListener('mp:validation', (e)=>{ try{ onValidation(e.detail); }catch{} });
})();

