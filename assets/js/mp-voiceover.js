(function(){
  const VO_PRIMARY = '/assets/audio/tour_step1_intro.mp3';
  const VO_FALLBACK = '/assets/crowd_noise.mp3'; // soft fallback if primary missing
  const VO_FORCE = (typeof localStorage !== 'undefined' && localStorage.getItem('mp_vo_force')) || null; // 'tts' | 'mp3' | 'fail'
  let audioEl = null;

  function dispatch(type){
    try { window.dispatchEvent(new CustomEvent(type)); } catch {}
  }
  function speak(text){
    try {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.0; u.pitch = 1.0; u.lang = 'en-US';
        u.onstart = ()=> dispatch('mp:vo:started');
        u.onend = ()=> dispatch('mp:vo:ended');
        // Safety: ensure end even if onend is swallowed
        setTimeout(()=> dispatch('mp:vo:ended'), 8000);
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
        return true;
      }
    } catch {}
    return false;
  }
  function playUrl(url){
    try {
      if (!audioEl) {
        audioEl = document.getElementById('mp-vo-audio') || new Audio();
        if (!audioEl.id) {
          audioEl.id = 'mp-vo-audio';
          try { document.body.appendChild(audioEl); } catch {}
        }
      }
      audioEl.src = url;
      audioEl.preload = 'auto';
      audioEl.onplay = ()=> dispatch('mp:vo:started');
      audioEl.onended = ()=> dispatch('mp:vo:ended');
      audioEl.onerror = ()=> {
        // try fallback once, else caption and end
        if (url !== VO_FALLBACK) {
          playUrl(VO_FALLBACK);
        } else {
          caption('Voiceover unavailable');
          dispatch('mp:vo:ended');
        }
      };
      audioEl.currentTime = 0;
      audioEl.play().catch(()=> { caption('Audio blocked â€” captions enabled'); dispatch('mp:vo:ended'); });
    } catch { caption('Voiceover unavailable'); dispatch('mp:vo:ended'); }
  }
  function caption(text){
    try{
      let el = document.getElementById('mp-vo-caption') || document.getElementById('vo-caption');
      if (!el){ el = document.createElement('div'); el.id = 'mp-vo-caption'; document.body.appendChild(el); }
      el.textContent = text || 'Cinematic unveiling...';
      el.style.cssText = 'position:fixed;left:12px;bottom:12px;background:rgba(2,6,23,.8);color:#e2e8f0;padding:.35rem .5rem;border-radius:8px;font:600 12px Inter,system-ui;z-index:9999;border:1px solid rgba(148,163,184,.25)';
      setTimeout(()=> el.remove(), 4000);
    }catch{}
  }
  function dispatchCaptionAndEnd(){ caption('Voiceover unavailable'); dispatch('mp:vo:ended'); }

  function useTTSOnly(){
    const ok = speak('Welcome to MatchPoint. Beginning the cinematic tour.');
    if (!ok) dispatchCaptionAndEnd();
  }
  function useMP3FallbackFirst(){ playUrl(VO_PRIMARY); }
  function tryTTSThenMP3Normally(){
    const ok = speak('Welcome to MatchPoint. Beginning the cinematic tour.');
    if (!ok) playUrl(VO_PRIMARY);
  }

  function startVOByPolicy(){
    if (VO_FORCE === 'fail') return dispatchCaptionAndEnd();
    if (VO_FORCE === 'mp3') return useMP3FallbackFirst();
    if (VO_FORCE === 'tts') return useTTSOnly();
    tryTTSThenMP3Normally();
  }

  window.addEventListener('mp:tour:start', ()=>{
    // Gate on iOS/Safari until sound enabled
    const ua = navigator.userAgent || '';
    const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const needsGate = isAppleMobile || isSafari;
    const soundOK = (typeof localStorage !== 'undefined' && localStorage.getItem('mp_audio_enabled') === '1');
    if (needsGate && !soundOK) {
      const once = ()=> { window.removeEventListener('mp:sound-enabled', once); startVOByPolicy(); };
      window.addEventListener('mp:sound-enabled', once, { once: true });
      return;
    }
    startVOByPolicy();
  });

  // Optional: expose a stop control for harness/regression
  window.MP_TourVO = window.MP_TourVO || {};
  window.MP_TourVO.stop = function(){
    try {
      if ('speechSynthesis' in window) speechSynthesis.cancel();
    } catch {}
    try {
      const a = document.getElementById('mp-vo-audio') || audioEl;
      if (a && !a.paused) { a.pause(); a.currentTime = 0; a.removeAttribute('src'); a.load?.(); }
    } catch {}
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch {}
    dispatch('mp:vo:ended');
  };
})();

