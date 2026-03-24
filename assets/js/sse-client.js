(function(){
  function dispatch(type, detail){ try { window.dispatchEvent(new CustomEvent(type, {detail})); } catch {} }

  function connect(){
    if (location.protocol === 'file:'){ dispatch('mp:sse:error'); return; }
    const tryUrls = [
      '/sse',
      'http://localhost:5000/sse',
      'http://127.0.0.1:5000/sse'
    ];
    let idx = 0; let es;
    const openNext = ()=>{
      if (idx >= tryUrls.length){ dispatch('mp:sse:error'); return; }
      const url = tryUrls[idx++];
      try {
        es = new EventSource(url);
      } catch {
        return openNext();
      }
      es.onopen = ()=> dispatch('mp:sse:open');
      es.onerror = ()=> { try{ es.close(); }catch{}; dispatch('mp:sse:error'); openNext(); };
      es.onmessage = (e)=>{
        // Heartbeat: any message counts as a beat
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
      let maxDelay = 0;
      const now = Date.now();
      events.forEach(ev => {
        const delay = Math.max(0,(ev.ts||0) - now);
        if (delay > maxDelay) maxDelay = delay;
        setTimeout(()=> dispatch(ev.type, ev.detail), delay);
      });
      setTimeout(()=> dispatch('mp:replay:end'), maxDelay + 50);
    }catch{
      dispatch('mp:replay:start');
      setTimeout(()=> dispatch('mp:replay:end'), 300);
    }
  });

  // Start connection once DOM is ready
  document.addEventListener('DOMContentLoaded', connect);
})();

