(function(){
  window.MP_Lang = window.MP_Lang || {
    injectCopy() {
      // Non-destructive: add text only if empty slots are present
      const el = document.getElementById('kpi-uplift');
      if (el && !el.textContent.trim()) el.textContent = 'â€”';
    }
  };
})();

