(function(){
  function dispatch(type, detail){ try { window.dispatchEvent(new CustomEvent(type, {detail})); } catch {} }

  let reconnectAttempt = 0;
  let reconnectTimer = null;
  let healthCheckTimer = null;
  let lastHeartbeat = Date.now();

  function exponentialBackoff() {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s max
    const baseDelay = 1000;
    const maxDelay = 32000;
    const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempt), maxDelay);
    reconnectAttempt++;
    return delay;
  }

  function resetBackoff() {
    reconnectAttempt = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function checkHealth() {
    const now = Date.now();
    const timeSinceLastBeat = now - lastHeartbeat;
    // If no heartbeat for 5 seconds, consider unhealthy
    if (timeSinceLastBeat > 5000) {
      dispatch('mp:sse:health', { healthy: false, lastHeartbeat });
      // Trigger reconnect
      if (!reconnectTimer) {
        reconnect();
      }
    } else {
      dispatch('mp:sse:health', { healthy: true, lastHeartbeat });
    }
  }

  function reconnect() {
    if (reconnectTimer) return;
    
    const delay = exponentialBackoff();
    dispatch('mp:sse:reconnecting', { attempt: reconnectAttempt, delay });
    
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  function connect(){
    if (location.protocol === 'file:'){ dispatch('mp:sse:error'); return; }
    const tryUrls = [
      '/sse',
      'http://localhost:5000/sse',
      'http://127.0.0.1:5000/sse'
    ];
    let idx = 0; let es;
    const openNext = ()=>{
      if (idx >= tryUrls.length){ 
        dispatch('mp:sse:error');
        reconnect(); // Schedule retry with backoff
        return; 
      }
      const url = tryUrls[idx++];
      try {
        es = new EventSource(url);
      } catch {
        return openNext();
      }
      es.onopen = ()=> {
        dispatch('mp:sse:open');
        resetBackoff(); // Reset backoff on successful connection
        lastHeartbeat = Date.now();
        // Start health checking
        if (healthCheckTimer) clearInterval(healthCheckTimer);
        healthCheckTimer = setInterval(checkHealth, 2000);
      };
      es.onerror = ()=> { 
        try{ es.close(); }catch{}; 
        dispatch('mp:sse:error'); 
        if (healthCheckTimer) {
          clearInterval(healthCheckTimer);
          healthCheckTimer = null;
        }
        openNext(); 
      };
      es.onmessage = (e)=>{
        // Heartbeat: any message counts as a beat
        lastHeartbeat = Date.now();
        dispatch('mp:sse:beat');
        try{
          const msg = JSON.parse(e.data);
          if (msg?.type) dispatch(msg.type, msg.detail || {});
        }catch{}
      };
    };
    openNext();
  }

  window.addEventListener('mp:replay:golden', async ()=>{
    try{
      const res = await fetch('/assets/replays/golden.json', {cache:'no-store'});
      if (!res.ok) throw new Error('not ok');
      const payload = await res.json();
      const events = payload.events||[];
      dispatch('mp:replay:start');
      // Support absolute ts or relative delay (ms). When delay is provided, accumulate.
      let cursor = 0;
      const now = Date.now();
      let lastFire = 0;
      events.forEach(ev => {
        let delay = 0;
        if (typeof ev.delay === 'number') {
          cursor += Math.max(0, ev.delay);
          delay = cursor;
        } else if (typeof ev.ts === 'number') {
          delay = Math.max(0, ev.ts - now);
        } else if (typeof ev.offset_ms === 'number') {
          cursor += Math.max(0, ev.offset_ms);
          delay = cursor;
        }
        lastFire = Math.max(lastFire, delay);
        setTimeout(()=> dispatch(ev.type, ev.detail), delay);
      });
      setTimeout(()=> dispatch('mp:replay:end'), lastFire + 100);
    }catch{
      dispatch('mp:replay:start');
      setTimeout(()=> dispatch('mp:replay:end'), 300);
    }
  });

  // Solar replays
  window.addEventListener('mp:replay:solar_fast', async ()=>{
    try{
      const res = await fetch('/assets/replays/fast_30s.json', {cache:'no-store'});
      if (!res.ok) throw new Error('not ok');
      const payload = await res.json();
      const events = payload.events||[];
      let cursor = 0; const now = Date.now(); let last=0;
      events.forEach(ev=>{ let d=0; if (typeof ev.delay==='number'){cursor+=Math.max(0,ev.delay); d=cursor;} else if (typeof ev.ts==='number'){d=Math.max(0, ev.ts-now);} setTimeout(()=>dispatch(ev.type, ev.detail), d); last=Math.max(last,d);});
    }catch{}
  });
  window.addEventListener('mp:replay:solar_res', async ()=>{
    try{
      const res = await fetch('/assets/replays/resilience_60s.json', {cache:'no-store'});
      if (!res.ok) throw new Error('not ok');
      const payload = await res.json();
      const events = payload.events||[];
      let cursor = 0; const now = Date.now(); let last=0;
      events.forEach(ev=>{ let d=0; if (typeof ev.delay==='number'){cursor+=Math.max(0,ev.delay); d=cursor;} else if (typeof ev.ts==='number'){d=Math.max(0, ev.ts-now);} setTimeout(()=>dispatch(ev.type, ev.detail), d); last=Math.max(last,d);});
    }catch{}
  });

  // Start connection once DOM is ready
  document.addEventListener('DOMContentLoaded', connect);
})();

