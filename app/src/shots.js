/* Vice Cover Lab — screenshot mode. ?shot=cover renders one cover full-bleed for the
   screenshot; ?shot=editor shows the editor with a sample photo loaded. */
(function () {
  'use strict';

  function params() {
    try { return new URLSearchParams(window.location.search); } catch (err) { return new URLSearchParams(''); }
  }

  function applyShotMode() {
    var q = params();
    var shot = q.get('shot');
    if (!shot) return false;
    var vice = window.__vice;
    if (!vice) return false;

    var caption = q.get('caption');
    if (caption) {
      vice.state.title = caption.toUpperCase();
      var titleInput = document.getElementById('in-title');
      if (titleInput) titleInput.value = vice.state.title;
    }
    var photo = q.get('photo');
    var photo2 = q.get('photo2');
    var layout = q.get('layout');
    if (layout && window.ViceState.LAYOUTS[layout]) vice.setLayout(layout);
    // Panel 0 takes ?photo, panel 1 takes ?photo2; the rest keep their scenes,
    // so a multi-panel cover shows photos and drawn scenes side by side.
    function photoIdFor(name, fallback) {
      if (name === 'pier') return 'sample-pier';
      if (name === 'boulevard') return 'sample-boulevard';
      return fallback;
    }
    if (vice.state.panels.length > 0) {
      vice.state.panels[0].photoId = photoIdFor(photo, 'sample-pier');
    }
    if (vice.state.panels.length > 1) {
      vice.state.panels[1].photoId = photoIdFor(photo2, 'sample-boulevard');
    }
    var grade = q.get('grade');
    if (grade && window.ViceState.GRADES[grade]) vice.state.grade = grade;
    var size = q.get('size');
    if (size && window.ViceState.SIZES[size]) vice.state.size = size;

    if (shot === 'cover') {
      document.body.classList.add('shot-cover');
      // Full-viewport cover at the chosen export aspect.
      var dims = window.ViceState.SIZES[vice.state.size];
      var canvas = document.getElementById('preview');
      var vw = Math.min(window.innerWidth, 1280);
      var vh = Math.round(vw * dims.h / dims.w);
      canvas.width = vw;
      canvas.height = vh;
      canvas.style.width = vw + 'px';
      canvas.style.height = vh + 'px';
      window.ViceRender.renderCover(canvas.getContext('2d'), vw, vh, vice.state, vice.photos);
      document.title = 'Vice Cover Lab — cover';
    } else {
      vice.render();
    }
    return true;
  }

  window.ViceShots = { applyShotMode: applyShotMode };
})();
