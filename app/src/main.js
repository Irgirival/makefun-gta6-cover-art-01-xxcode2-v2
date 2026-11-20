/* Vice Cover Lab — bootstrap. */
(function () {
  'use strict';

  function start() {
    window.ViceEditor.init();
    // Let the editor settle (fonts + sample photos), then apply ?shot= if present.
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (window.__vice && window.__vice.photos['sample-pier']) {
        clearInterval(timer);
        window.ViceShots.applyShotMode();
      } else if (tries > 40) {
        clearInterval(timer);
        window.ViceShots.applyShotMode();
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
