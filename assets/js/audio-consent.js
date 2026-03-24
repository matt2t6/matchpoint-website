(function(){
  const KEY = 'mp_audio_enabled';
  function enableAudio(){
    try { localStorage.setItem(KEY, '1'); } catch {}
    window.dispatchEvent(new CustomEvent('mp:sound-enabled'));
    toast('Sound enabled');
  }
  function toast(msg){
    try {
      const n = document.createElement('div');
      n.textContent = msg;
      n.style.cssText = 'position:fixed;right:12px;bottom:12px;background:#0ea5e9;color:#0b1220;padding:.5rem .75rem;border-radius:8px;font:600 12px Inter,system-ui;z-index:9999;box-shadow:0 10px 32px rgba(0,0,0,.3)';
      document.body.appendChild(n);
      setTimeout(()=> n.remove(), 2000);
    } catch {}
  }
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('enable-sound-button') || document.getElementById('enable-sound');
    if (btn) btn.addEventListener('click', enableAudio);
  });
})();

