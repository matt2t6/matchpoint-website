(function(){
  window.MP = window.MP || {};
  const bus = new EventTarget();
  window.MP.bus = bus;
  window.MP.on = (type, handler) => window.addEventListener(type, handler);
  window.MP.emit = (type, detail) => window.dispatchEvent(new CustomEvent(type, { detail }));
})();

