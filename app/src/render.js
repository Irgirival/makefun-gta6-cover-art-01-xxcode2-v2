/* Vice Cover Lab — the cover renderer. One function draws the whole cover at any size,
   so the live preview and the exported PNG are the same picture. */
(function () {
  'use strict';

  var GUTTER = 0.012; // panel gap, as a fraction of the cover's short side

  // Every layout returns panels in normalised coords plus where the caption lives.
  // title: { x, y, w, h, align, maxLines } in normalised coords.
  function layoutGeometry(layoutId, W, H) {
    var g = GUTTER * Math.min(W, H);
    var panels = [];
    var title = null;
    var badge = { x: 0.03, y: 0.028, align: 'left' };

    if (layoutId === 'hero-duo') {
      var leftW = W * 0.56 - g;
      panels = [
        { x: 0, y: 0, w: leftW, h: H * 0.78, rot: 0 },
        { x: leftW + g, y: 0, w: W - leftW - g, h: H * 0.78, rot: 0 },
      ];
      title = { x: 0.03, y: 0.80, w: 0.94, h: 0.18, align: 'left' };
    } else if (layoutId === 'nine-grid') {
      var cw = (W - g * 2) / 3;
      var ch = (H * 0.76 - g * 2) / 3;
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
          panels.push({ x: c * (cw + g), y: r * (ch + g), w: cw, h: ch, rot: 0 });
        }
      }
      title = { x: 0.03, y: 0.78, w: 0.94, h: 0.2, align: 'left' };
    } else if (layoutId === 'full-bleed') {
      panels = [{ x: 0, y: 0, w: W, h: H, rot: 0 }];
      title = { x: 0.04, y: 0.74, w: 0.92, h: 0.22, align: 'left' };
    } else if (layoutId === 'split-city') {
      var half = (W - g) / 2;
      panels = [
        { x: 0, y: 0, w: half, h: H, rot: 0 },
        { x: half + g, y: 0, w: half, h: H, rot: 0 },
      ];
      title = { x: 0.05, y: 0.42, w: 0.9, h: 0.16, align: 'center' };
      badge = { x: 0.5, y: 0.035, align: 'center' };
    } else if (layoutId === 'tilted-snaps') {
      var pw = W * 0.3, ph = H * 0.62;
      var py = H * 0.1;
      panels = [
        { x: W * 0.05, y: py, w: pw, h: ph, rot: -0.07, polaroid: true },
        { x: W * 0.35, y: py - H * 0.02, w: pw, h: ph, rot: 0.03, polaroid: true },
        { x: W * 0.65, y: py, w: pw, h: ph, rot: 0.08, polaroid: true },
      ];
      title = { x: 0.05, y: 0.78, w: 0.9, h: 0.18, align: 'center' };
    } else if (layoutId === 'neon-strips') {
      var sh = (H * 0.74 - g * 3) / 4;
      for (var i = 0; i < 4; i++) {
        panels.push({ x: 0, y: i * (sh + g), w: W, h: sh, rot: 0 });
      }
      title = { x: 0.03, y: 0.76, w: 0.94, h: 0.22, align: 'left' };
    } else {
      panels = [{ x: 0, y: 0, w: W, h: H, rot: 0 }];
      title = { x: 0.04, y: 0.74, w: 0.92, h: 0.22, align: 'left' };
    }
    return { panels: panels, title: title, badge: badge };
  }

  // Draw an image cover-fit into a rect, with pan (fractions of the rect) and zoom.
  function drawPhoto(ctx, img, x, y, w, h, panX, panY, zoom, filter) {
    if (!img || !img.naturalWidth) return false;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var scale = Math.max(w / iw, h / ih) * (zoom || 1);
    var dw = iw * scale, dh = ih * scale;
    var dx = x + (w - dw) / 2 + (panX || 0) * w * 0.5;
    var dy = y + (h - dh) / 2 + (panY || 0) * h * 0.5;
    ctx.save();
    if (filter) {
      try { ctx.filter = filter; } catch (err) { /* old canvas: draw unfiltered */ }
    }
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
    return true;
  }

  // Fit the title on one line: shrink until it fits the box, never below the floor.
  function fitFont(ctx, text, maxWidth, startPx, family, floorPx) {
    var px = startPx;
    ctx.font = px + 'px ' + family;
    while (px > floorPx && ctx.measureText(text).width > maxWidth) {
      px -= 2;
      ctx.font = px + 'px ' + family;
    }
    return px;
  }

  function drawCaption(ctx, W, H, geo, state, grade) {
    var t = geo.title;
    var tx = t.x * W, ty = t.y * H, tw = t.w * W, th = t.h * H;
    var titlePx = fitFont(ctx, state.title, tw, th * 0.62, 'Anton, sans-serif', Math.max(18, th * 0.3));
    var baseline = ty + th * 0.52;

    // Soft dark plate behind the caption so it reads on any photo.
    var plate = ctx.createLinearGradient(0, ty - th * 0.18, 0, ty + th);
    plate.addColorStop(0, 'rgba(5,2,12,0)');
    plate.addColorStop(0.35, 'rgba(5,2,12,0.55)');
    plate.addColorStop(1, 'rgba(5,2,12,0.82)');
    ctx.fillStyle = plate;
    ctx.fillRect(0, ty - th * 0.18, W, th + th * 0.18);

    ctx.save();
    ctx.textAlign = t.align;
    var ax = t.align === 'center' ? tx + tw / 2 : (t.align === 'right' ? tx + tw : tx);
    ctx.font = titlePx + 'px Anton, sans-serif';
    ctx.shadowColor = 'rgba(255,46,136,0.55)';
    ctx.shadowBlur = titlePx * 0.22;
    ctx.shadowOffsetY = titlePx * 0.05;
    if (state.titleStroke) {
      ctx.lineWidth = Math.max(2, titlePx * 0.09);
      ctx.strokeStyle = '#12081f';
      ctx.lineJoin = 'round';
      ctx.strokeText(state.title, ax, baseline);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillText(state.title, ax, baseline);
    ctx.restore();

    // Subtitle in Pacifico, under the title, in the grade's accent colour.
    var subPx = Math.max(14, titlePx * 0.34);
    ctx.save();
    ctx.font = subPx + 'px Pacifico, cursive';
    ctx.textAlign = t.align;
    ctx.fillStyle = grade.accent;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = subPx * 0.25;
    ctx.shadowOffsetY = 2;
    ctx.fillText(state.subtitle, ax, baseline + subPx * 1.5);
    ctx.restore();
  }

  function drawBadge(ctx, W, H, geo, state) {
    if (!state.badge) return;
    var b = geo.badge;
    var px = Math.max(13, Math.min(W, H) * 0.026);
    ctx.save();
    ctx.font = '700 ' + px + 'px system-ui, sans-serif';
    var textW = ctx.measureText(state.badge).width;
    var padX = px * 0.9, padY = px * 0.55;
    var bw = textW + padX * 2, bh = px + padY * 2;
    var bx = b.align === 'center' ? W * b.x - bw / 2 : (b.align === 'right' ? W * b.x - bw : W * b.x);
    var by = H * b.y;
    ctx.fillStyle = 'rgba(10,4,20,0.72)';
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = Math.max(1.5, px * 0.08);
    ctx.beginPath();
    var r = bh / 2;
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
    ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
    ctx.arcTo(bx, by + bh, bx, by, r);
    ctx.arcTo(bx, by, bx + bw, by, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.badge, bx + padX, by + bh / 2 + px * 0.04);
    ctx.restore();
  }

  function drawGrain(ctx, W, H, seed) {
    var rand = (function (s) {
      var a = s >>> 0;
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    })(seed || 99);
    ctx.save();
    ctx.globalAlpha = 0.07;
    var dots = Math.floor((W * H) / 9000);
    for (var i = 0; i < dots; i++) {
      ctx.fillStyle = rand() < 0.5 ? '#ffffff' : '#000000';
      ctx.fillRect(rand() * W, rand() * H, Math.max(1, W * 0.0012), Math.max(1, W * 0.0012));
    }
    ctx.restore();
  }

  function drawVignette(ctx, W, H) {
    var g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(5,2,12,0.42)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // The whole cover. photos is a map id -> HTMLImageElement (or null when not loaded).
  function renderCover(ctx, W, H, state, photos) {
    var grade = window.ViceState.GRADES[state.grade] || window.ViceState.GRADES['vice-sunset'];
    var geo = layoutGeometry(state.layout, W, H);

    // Base: the grade's sky.
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, grade.sky[0]);
    sky.addColorStop(0.55, grade.sky[1]);
    sky.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Panels.
    for (var i = 0; i < geo.panels.length; i++) {
      var p = geo.panels[i];
      var panel = state.panels[i] || { photoId: null, scene: 'beach', panX: 0, panY: 0, zoom: 1 };
      var img = panel.photoId ? photos[panel.photoId] : null;

      ctx.save();
      if (p.rot) {
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate(p.rot);
        ctx.translate(-(p.x + p.w / 2), -(p.y + p.h / 2));
      }
      if (p.polaroid) {
        // White polaroid frame with a soft shadow.
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = Math.min(W, H) * 0.02;
        ctx.shadowOffsetY = Math.min(W, H) * 0.008;
        ctx.fillStyle = '#f7f2e8';
        ctx.fillRect(p.x - 6, p.y - 6, p.w + 12, p.h + 12 + Math.min(W, H) * 0.05);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }
      ctx.beginPath();
      ctx.rect(p.x, p.y, p.w, p.h);
      ctx.clip();
      var drawn = false;
      if (img) drawn = drawPhoto(ctx, img, p.x, p.y, p.w, p.h, panel.panX, panel.panY, panel.zoom, grade.filter);
      if (!drawn) window.ViceScenes.drawScene(ctx, panel.scene, p.x, p.y, p.w, p.h, 11 + i * 7);
      ctx.restore();

      // Panel edge.
      ctx.save();
      if (p.rot) {
        ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
        ctx.rotate(p.rot);
        ctx.translate(-(p.x + p.w / 2), -(p.y + p.h / 2));
      }
      ctx.strokeStyle = p.polaroid ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(1.5, Math.min(W, H) * 0.004);
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.restore();
    }

    // Grade tint over the whole cover.
    ctx.save();
    ctx.globalCompositeOperation = grade.tintMode;
    var tint = ctx.createLinearGradient(0, 0, 0, H);
    tint.addColorStop(0, grade.tintTop);
    tint.addColorStop(1, grade.tintBottom);
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    drawCaption(ctx, W, H, geo, state, grade);
    drawBadge(ctx, W, H, geo, state);
    if (state.vignette) drawVignette(ctx, W, H);
    if (state.grain) drawGrain(ctx, W, H, 99);
  }

  // Hit-test a point (in canvas pixels) against the layout's panels. Returns the panel index or -1.
  function hitPanel(W, H, layoutId, px, py) {
    var geo = layoutGeometry(layoutId, W, H);
    for (var i = geo.panels.length - 1; i >= 0; i--) {
      var p = geo.panels[i];
      if (!p.rot) {
        if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return i;
      } else {
        // Rotate the point back around the panel centre.
        var cx = p.x + p.w / 2, cy = p.y + p.h / 2;
        var dx = px - cx, dy = py - cy;
        var cos = Math.cos(-p.rot), sin = Math.sin(-p.rot);
        var lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
        if (Math.abs(lx) <= p.w / 2 && Math.abs(ly) <= p.h / 2) return i;
      }
    }
    return -1;
  }

  window.ViceRender = {
    renderCover: renderCover,
    layoutGeometry: layoutGeometry,
    hitPanel: hitPanel,
  };
})();
