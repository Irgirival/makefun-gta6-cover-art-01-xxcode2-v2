/* Vice Cover Lab — editor wiring: library, controls, canvas interaction, export. */
(function () {
  'use strict';

  var V = window.ViceState;

  var state = V.loadState();
  var photos = {};   // id -> HTMLImageElement (loaded)
  var photoMeta = []; // { id, name, src, removable }
  var canvas, ctx, wrap;
  var dragging = null;
  var uploadCounter = 0;

  function el(id) { return document.getElementById(id); }

  function previewSize() {
    var size = V.SIZES[state.size];
    var w = size.w >= size.h ? 960 : 720;
    var h = Math.round(w * size.h / size.w);
    return { w: w, h: h };
  }

  function render() {
    var ps = previewSize();
    if (canvas.width !== ps.w || canvas.height !== ps.h) {
      canvas.width = ps.w;
      canvas.height = ps.h;
    }
    V.saveState(state);
    window.ViceRender.renderCover(ctx, ps.w, ps.h, state, photos);
    syncControls();
  }

  function syncControls() {
    // Layout buttons.
    var lb = el('layout-buttons');
    if (lb) {
      var kids = lb.children;
      for (var i = 0; i < kids.length; i++) {
        kids[i].setAttribute('aria-pressed', kids[i].dataset.layout === state.layout ? 'true' : 'false');
      }
    }
    var gb = el('grade-buttons');
    if (gb) {
      var gkids = gb.children;
      for (var j = 0; j < gkids.length; j++) {
        gkids[j].setAttribute('aria-pressed', gkids[j].dataset.grade === state.grade ? 'true' : 'false');
      }
    }
    var sb = el('size-buttons');
    if (sb) {
      var skids = sb.children;
      for (var k = 0; k < skids.length; k++) {
        skids[k].setAttribute('aria-pressed', skids[k].dataset.size === state.size ? 'true' : 'false');
      }
    }
    // Panel strip.
    var strip = el('panel-strip');
    if (strip) {
      var chips = strip.children;
      for (var p = 0; p < chips.length; p++) {
        chips[p].setAttribute('aria-pressed', p === state.selected ? 'true' : 'false');
        var panel = state.panels[p];
        var label = 'Panel ' + (p + 1) + ' · ' + panelLabel(panel);
        if (chips[p].textContent !== label) chips[p].textContent = label;
      }
    }
    // Thumbs.
    var thumbs = el('thumbs');
    if (thumbs) {
      var t = thumbs.children;
      for (var q = 0; q < t.length; q++) {
        var pid = t[q].dataset.photo;
        var sel = state.panels[state.selected];
        t[q].setAttribute('aria-pressed', sel && sel.photoId === pid ? 'true' : 'false');
      }
    }
    // Selected-panel editor.
    var fill = el('sel-fill');
    if (fill) {
      var panelNow = state.panels[state.selected];
      var want = panelNow.photoId ? 'photo:' + panelNow.photoId : 'scene:' + panelNow.scene;
      if (fill.value !== want) fill.value = want;
    }
    var zoom = el('in-zoom');
    if (zoom) {
      var z = state.panels[state.selected] ? state.panels[state.selected].zoom : 1;
      if (Number(zoom.value) !== z) zoom.value = String(z);
    }
    var note = el('export-note');
    if (note) {
      var size = V.SIZES[state.size];
      note.textContent = 'Exports at ' + size.w + ' × ' + size.h + ' PNG — ' + size.note + ', ready to post.';
    }
  }

  function panelLabel(panel) {
    if (panel.photoId) {
      var meta = null;
      for (var i = 0; i < photoMeta.length; i++) if (photoMeta[i].id === panel.photoId) meta = photoMeta[i];
      return meta ? meta.name : 'Photo';
    }
    return (V.SCENES[panel.scene] || { name: 'Scene' }).name;
  }

  function loadPhoto(meta) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { photos[meta.id] = img; resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = meta.src;
    });
  }

  function addPhotoMeta(meta) {
    photoMeta.push(meta);
    var thumbs = el('thumbs');
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb';
    button.dataset.photo = meta.id;
    button.setAttribute('aria-pressed', 'false');
    var img = document.createElement('img');
    img.src = meta.src;
    img.alt = meta.name;
    var label = document.createElement('span');
    label.textContent = meta.name;
    button.appendChild(img);
    button.appendChild(label);
    if (meta.removable) {
      var x = document.createElement('span');
      x.className = 'thumb-x';
      x.textContent = '×';
      x.title = 'Remove photo';
      x.addEventListener('click', function (ev) {
        ev.stopPropagation();
        removePhoto(meta.id);
      });
      button.appendChild(x);
    }
    button.addEventListener('click', function () {
      assignPhotoToSelected(meta.id);
    });
    thumbs.appendChild(button);
  }

  function assignPhotoToSelected(photoId) {
    var panel = state.panels[state.selected];
    panel.photoId = photoId;
    panel.panX = 0; panel.panY = 0; panel.zoom = 1;
    render();
  }

  function removePhoto(photoId) {
    photoMeta = photoMeta.filter(function (m) { return m.id !== photoId; });
    delete photos[photoId];
    state.panels.forEach(function (panel) {
      if (panel.photoId === photoId) panel.photoId = null;
    });
    var thumbs = el('thumbs');
    var kids = thumbs.querySelectorAll('[data-photo="' + photoId + '"]');
    kids.forEach(function (k) { k.remove(); });
    render();
  }

  function buildLayoutButtons() {
    var box = el('layout-buttons');
    Object.keys(V.LAYOUTS).forEach(function (id) {
      var l = V.LAYOUTS[id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick';
      b.dataset.layout = id;
      b.setAttribute('aria-pressed', id === state.layout ? 'true' : 'false');
      var name = document.createElement('strong');
      name.textContent = l.name;
      var note = document.createElement('small');
      note.textContent = l.note;
      b.appendChild(name);
      b.appendChild(note);
      b.addEventListener('click', function () {
        state.layout = id;
        state.panels = V.panelsForLayout(state, id);
        state.selected = 0;
        buildPanelStrip();
        buildFillSelect();
        render();
      });
      box.appendChild(b);
    });
  }

  function buildGradeButtons() {
    var box = el('grade-buttons');
    Object.keys(V.GRADES).forEach(function (id) {
      var g = V.GRADES[id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'grade-btn';
      b.dataset.grade = id;
      b.setAttribute('aria-pressed', id === state.grade ? 'true' : 'false');
      var sw = document.createElement('span');
      sw.className = 'swatch';
      sw.style.background = 'linear-gradient(135deg,' + g.sky[0] + ',' + g.sky[1] + ' 55%,' + g.sky[2] + ')';
      var text = document.createElement('span');
      var name = document.createElement('strong');
      name.textContent = g.name;
      var note = document.createElement('small');
      note.textContent = g.note;
      text.appendChild(name);
      text.appendChild(note);
      b.appendChild(sw);
      b.appendChild(text);
      b.addEventListener('click', function () {
        state.grade = id;
        render();
      });
      box.appendChild(b);
    });
  }

  function buildSizeButtons() {
    var box = el('size-buttons');
    box.classList.add('two');
    Object.keys(V.SIZES).forEach(function (id) {
      var s = V.SIZES[id];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick';
      b.dataset.size = id;
      b.setAttribute('aria-pressed', id === state.size ? 'true' : 'false');
      var name = document.createElement('strong');
      name.textContent = s.label;
      var note = document.createElement('small');
      note.textContent = s.note;
      b.appendChild(name);
      b.appendChild(note);
      b.addEventListener('click', function () {
        state.size = id;
        render();
      });
      box.appendChild(b);
    });
  }

  function buildPresetRow() {
    var row = el('preset-row');
    V.CAPTION_PRESETS.forEach(function (preset) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'preset';
      b.textContent = preset.title;
      b.addEventListener('click', function () {
        state.title = preset.title;
        state.subtitle = preset.subtitle;
        state.badge = preset.badge;
        el('in-title').value = preset.title;
        el('in-subtitle').value = preset.subtitle;
        el('in-badge').value = preset.badge;
        render();
      });
      row.appendChild(b);
    });
  }

  function buildPanelStrip() {
    var strip = el('panel-strip');
    strip.innerHTML = '';
    state.panels.forEach(function (panel, i) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'panel-chip';
      chip.setAttribute('aria-pressed', i === state.selected ? 'true' : 'false');
      chip.textContent = 'Panel ' + (i + 1) + ' · ' + panelLabel(panel);
      chip.addEventListener('click', function () {
        state.selected = i;
        render();
      });
      strip.appendChild(chip);
    });
  }

  function buildFillSelect() {
    var sel = el('sel-fill');
    sel.innerHTML = '';
    var photoGroup = document.createElement('optgroup');
    photoGroup.label = 'Photos';
    photoMeta.forEach(function (meta) {
      var opt = document.createElement('option');
      opt.value = 'photo:' + meta.id;
      opt.textContent = 'Photo — ' + meta.name;
      photoGroup.appendChild(opt);
    });
    sel.appendChild(photoGroup);
    var sceneGroup = document.createElement('optgroup');
    sceneGroup.label = 'Drawn scenes';
    V.SCENE_ORDER.forEach(function (sceneId) {
      var opt = document.createElement('option');
      opt.value = 'scene:' + sceneId;
      opt.textContent = 'Scene — ' + V.SCENES[sceneId].name;
      sceneGroup.appendChild(opt);
    });
    sel.appendChild(sceneGroup);
    var panel = state.panels[state.selected];
    sel.value = panel.photoId ? 'photo:' + panel.photoId : 'scene:' + panel.scene;
  }

  function randomize() {
    var layoutIds = Object.keys(V.LAYOUTS);
    var gradeIds = Object.keys(V.GRADES);
    state.layout = layoutIds[Math.floor(Math.random() * layoutIds.length)];
    state.grade = gradeIds[Math.floor(Math.random() * gradeIds.length)];
    state.panels = V.panelsForLayout(state, state.layout);
    state.panels.forEach(function (panel, i) {
      panel.scene = V.SCENE_ORDER[Math.floor(Math.random() * V.SCENE_ORDER.length)];
      panel.panX = (Math.random() - 0.5) * 0.3;
      panel.panY = (Math.random() - 0.5) * 0.3;
      panel.zoom = 1 + Math.random() * 0.6;
      void i;
    });
    var preset = V.CAPTION_PRESETS[Math.floor(Math.random() * V.CAPTION_PRESETS.length)];
    state.title = preset.title;
    state.subtitle = preset.subtitle;
    state.badge = preset.badge;
    el('in-title').value = preset.title;
    el('in-subtitle').value = preset.subtitle;
    el('in-badge').value = preset.badge;
    state.selected = 0;
    buildPanelStrip();
    buildFillSelect();
    render();
  }

  // Export the cover at full size. Returns a Promise of the PNG data URL.
  function exportPNG(sizeId) {
    var size = V.SIZES[sizeId || state.size];
    var off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    var octx = off.getContext('2d');
    window.ViceRender.renderCover(octx, size.w, size.h, state, photos);
    return new Promise(function (resolve) {
      off.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'vice-cover-' + size.id + '-' + size.w + 'x' + size.h + '.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.readAsDataURL(blob);
      }, 'image/png');
    });
  }

  function canvasPoint(ev) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left) * (canvas.width / rect.width),
      y: (ev.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function wireCanvas() {
    canvas.addEventListener('pointerdown', function (ev) {
      var pt = canvasPoint(ev);
      var hit = window.ViceRender.hitPanel(canvas.width, canvas.height, state.layout, pt.x, pt.y);
      if (hit >= 0) {
        state.selected = hit;
        dragging = { x: pt.x, y: pt.y, panel: hit };
        canvas.setPointerCapture(ev.pointerId);
        render();
      }
    });
    canvas.addEventListener('pointermove', function (ev) {
      if (!dragging) return;
      var pt = canvasPoint(ev);
      var panel = state.panels[dragging.panel];
      if (!panel || !panel.photoId) return;
      var geo = window.ViceRender.layoutGeometry(state.layout, canvas.width, canvas.height);
      var p = geo.panels[dragging.panel];
      panel.panX += ((pt.x - dragging.x) / p.w) * 2;
      panel.panY += ((pt.y - dragging.y) / p.h) * 2;
      panel.panX = Math.max(-1, Math.min(1, panel.panX));
      panel.panY = Math.max(-1, Math.min(1, panel.panY));
      dragging.x = pt.x;
      dragging.y = pt.y;
      render();
    });
    canvas.addEventListener('pointerup', function () { dragging = null; });
    canvas.addEventListener('pointercancel', function () { dragging = null; });
    canvas.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var panel = state.panels[state.selected];
      if (!panel || !panel.photoId) return;
      panel.zoom = Math.max(1, Math.min(3, panel.zoom * Math.exp(-ev.deltaY * 0.0012)));
      render();
    }, { passive: false });
  }

  function wireControls() {
    el('in-title').addEventListener('input', function (ev) { state.title = ev.target.value.toUpperCase(); render(); });
    el('in-subtitle').addEventListener('input', function (ev) { state.subtitle = ev.target.value; render(); });
    el('in-badge').addEventListener('input', function (ev) { state.badge = ev.target.value.toUpperCase(); render(); });
    el('sel-fill').addEventListener('change', function (ev) {
      var panel = state.panels[state.selected];
      var value = ev.target.value;
      if (value.indexOf('photo:') === 0) {
        panel.photoId = value.slice(6);
        panel.panX = 0; panel.panY = 0; panel.zoom = 1;
      } else {
        panel.photoId = null;
        panel.scene = value.slice(6);
      }
      render();
    });
    el('in-zoom').addEventListener('input', function (ev) {
      var panel = state.panels[state.selected];
      if (panel) panel.zoom = Number(ev.target.value);
      render();
    });
    el('btn-center').addEventListener('click', function () {
      var panel = state.panels[state.selected];
      if (panel) { panel.panX = 0; panel.panY = 0; panel.zoom = 1; }
      render();
    });
    el('btn-scene-next').addEventListener('click', function () {
      var panel = state.panels[state.selected];
      if (!panel) return;
      var idx = V.SCENE_ORDER.indexOf(panel.scene);
      panel.scene = V.SCENE_ORDER[(idx + 1) % V.SCENE_ORDER.length];
      panel.photoId = null;
      buildFillSelect();
      render();
    });
    el('chk-grain').addEventListener('change', function (ev) { state.grain = ev.target.checked; render(); });
    el('chk-vignette').addEventListener('change', function (ev) { state.vignette = ev.target.checked; render(); });
    el('chk-stroke').addEventListener('change', function (ev) { state.titleStroke = ev.target.checked; render(); });
    el('btn-surprise').addEventListener('click', randomize);
    el('btn-reset').addEventListener('click', function () {
      state = V.defaultState();
      el('in-title').value = state.title;
      el('in-subtitle').value = state.subtitle;
      el('in-badge').value = state.badge;
      el('chk-grain').checked = state.grain;
      el('chk-vignette').checked = state.vignette;
      el('chk-stroke').checked = state.titleStroke;
      buildPanelStrip();
      buildFillSelect();
      render();
    });
    el('btn-export').addEventListener('click', function () {
      var note = el('export-note');
      note.textContent = 'Rendering your PNG…';
      exportPNG().then(function () {
        var size = V.SIZES[state.size];
        note.textContent = 'Exported ' + size.w + ' × ' + size.h + ' PNG — check your downloads.';
      });
    });
    el('file-upload').addEventListener('change', function (ev) {
      var files = Array.prototype.slice.call(ev.target.files || []);
      files.forEach(function (file) {
        if (!file.type || file.type.indexOf('image/') !== 0) return;
        var reader = new FileReader();
        reader.onload = function () {
          uploadCounter++;
          var meta = {
            id: 'upload-' + uploadCounter,
            name: file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'Photo ' + uploadCounter,
            src: reader.result,
            removable: true,
          };
          loadPhoto(meta).then(function () {
            addPhotoMeta(meta);
            buildFillSelect();
            assignPhotoToSelected(meta.id);
          });
        };
        reader.readAsDataURL(file);
      });
      ev.target.value = '';
    });
  }

  function init() {
    canvas = el('preview');
    ctx = canvas.getContext('2d');
    wrap = el('canvas-wrap');
    void wrap;

    // The inputs start with the HTML defaults: bring them in line with the
    // loaded (possibly saved) state, so the form always shows what the cover shows.
    el('in-title').value = state.title;
    el('in-subtitle').value = state.subtitle;
    el('in-badge').value = state.badge;
    el('chk-grain').checked = state.grain;
    el('chk-vignette').checked = state.vignette;
    el('chk-stroke').checked = state.titleStroke;

    buildLayoutButtons();
    buildGradeButtons();
    buildSizeButtons();
    buildPresetRow();
    buildPanelStrip();

    // Sample photos first, so the cover is alive immediately.
    var loads = V.SAMPLE_PHOTOS.map(function (meta) {
      return loadPhoto(meta).then(function () { addPhotoMeta(meta); });
    });
    Promise.all(loads).then(function () {
      buildFillSelect();
      render();
    });

    wireCanvas();
    wireControls();

    // Fonts: render again once Anton/Pacifico arrive so the caption is real type.
    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load('16px Anton'),
        document.fonts.load('16px Pacifico'),
      ]).then(function () { render(); }).catch(function () { /* fall back to system fonts */ });
      document.fonts.ready.then(function () { render(); });
    }

    render();

    // Test hooks (also used by shots.js): state, export, render.
    window.__vice = {
      get state() { return state; },
      photos: photos,
      render: render,
      exportPNG: exportPNG,
      assignPhotoToSelected: assignPhotoToSelected,
      setLayout: function (id) {
        state.layout = id;
        state.panels = V.panelsForLayout(state, id);
        state.selected = 0;
        buildPanelStrip();
        buildFillSelect();
        render();
      },
    };
  }

  window.ViceEditor = { init: init };
})();
