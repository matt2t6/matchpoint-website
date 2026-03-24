(function(){
  document.addEventListener('DOMContentLoaded', () => {
    // Guarded attaches; these are no-ops if elements are absent.
    const askButtons = document.querySelectorAll('[data-action="ask-modal"]');
    askButtons.forEach(btn => btn.addEventListener('click', ()=> window.dispatchEvent(new CustomEvent('mp:ask:show'))));
  });
})();

