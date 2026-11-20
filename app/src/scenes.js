/* Vice Cover Lab — six vignette scenes drawn entirely in code. No images, no assets. */
(function () {
  'use strict';

  // Small deterministic random generator, so a scene looks the same every render.
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function sky(ctx, x, y, w, h, stops) {
    var g = ctx.createLinearGradient(x, y, x, y + h);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }

  function sunDisc(ctx, cx, cy, r, color, glow) {
    var g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 2.4);
    g.addColorStop(0, glow);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  }

  function birds(ctx, rand, x, y, w, h, n) {
    ctx.strokeStyle = 'rgba(20,8,30,0.85)';
    ctx.lineWidth = Math.max(1.5, h * 0.006);
    for (var i = 0; i < n; i++) {
      var bx = x + rand() * w * 0.8 + w * 0.1;
      var by = y + rand() * h * 0.3 + h * 0.05;
      var s = w * 0.02 + rand() * w * 0.015;
      ctx.beginPath();
      ctx.moveTo(bx - s, by);
      ctx.quadraticCurveTo(bx - s * 0.4, by - s * 0.7, bx, by);
      ctx.quadraticCurveTo(bx + s * 0.4, by - s * 0.7, bx + s, by);
      ctx.stroke();
    }
  }

  function palmTree(ctx, x, y, h, lean, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, h * 0.03);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(lean * h * 0.4, -h * 0.55, lean * h * 0.5, -h);
    ctx.stroke();
    ctx.translate(lean * h * 0.5, -h);
    ctx.lineWidth = Math.max(1.5, h * 0.02);
    for (var i = 0; i < 7; i++) {
      var a = -Math.PI * 0.15 - (i / 6) * Math.PI * 1.15;
      var len = h * (0.42 + (i % 3) * 0.05);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.cos(a) * len * 0.6, Math.sin(a) * len * 0.6 - h * 0.08, Math.cos(a) * len, Math.sin(a) * len + h * 0.12);
      ctx.stroke();
    }
    ctx.restore();
  }

  function beach(ctx, x, y, w, h, rand) {
    sky(ctx, x, y, w, h, [[0, '#2b0a4a'], [0.45, '#ff2e88'], [0.72, '#ff9a3d'], [1, '#ffd166']]);
    sunDisc(ctx, x + w * 0.5, y + h * 0.52, w * 0.16, '#fff3c4', 'rgba(255,220,120,0.55)');
    // Sea: horizontal shimmer bands.
    ctx.fillStyle = '#c22a72';
    ctx.fillRect(x, y + h * 0.62, w, h * 0.38);
    for (var i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,180,120,0.35)' : 'rgba(255,255,255,0.18)';
      ctx.fillRect(x, y + h * (0.64 + i * 0.038), w, h * 0.012);
    }
    // Sand.
    ctx.fillStyle = '#e8a56b';
    ctx.fillRect(x, y + h * 0.88, w, h * 0.12);
    ctx.fillStyle = 'rgba(120,60,20,0.35)';
    ctx.fillRect(x, y + h * 0.88, w, h * 0.012);
    palmTree(ctx, x + w * 0.12, y + h * 0.9, h * 0.5, 0.35, '#1c0a2e');
    palmTree(ctx, x + w * 0.88, y + h * 0.92, h * 0.42, -0.3, '#240b38');
    birds(ctx, rand, x, y, w, h, 3);
  }

  function skyline(ctx, x, y, w, h, rand) {
    sky(ctx, x, y, w, h, [[0, '#0b1030'], [0.5, '#4a1a6e'], [0.8, '#ff2e88'], [1, '#ff9a3d']]);
    sunDisc(ctx, x + w * 0.68, y + h * 0.62, w * 0.11, '#ffe9a8', 'rgba(255,180,90,0.5)');
    var base = y + h;
    for (var i = 0; i < 9; i++) {
      var bw = w * (0.07 + rand() * 0.08);
      var bx = x + (i / 9) * w * 0.96;
      var bh = h * (0.3 + rand() * 0.42);
      ctx.fillStyle = i % 2 ? '#12082a' : '#0a0618';
      ctx.fillRect(bx, base - bh, bw, bh);
      // Lit windows.
      ctx.fillStyle = 'rgba(255,210,100,0.9)';
      var cols = Math.max(1, Math.floor(bw / (w * 0.035)));
      var rows = Math.max(1, Math.floor(bh / (h * 0.07)));
      for (var c = 0; c < cols; c++) {
        for (var r = 0; r < rows; r++) {
          if (rand() < 0.42) {
            ctx.fillRect(bx + w * 0.012 + c * (w * 0.035), base - bh + h * 0.03 + r * (h * 0.07), w * 0.016, h * 0.028);
          }
        }
      }
      if (rand() < 0.4) { // Antenna beacon.
        ctx.fillStyle = '#ff2e5e';
        ctx.beginPath(); ctx.arc(bx + bw / 2, base - bh - h * 0.02, Math.max(1.5, w * 0.006), 0, Math.PI * 2); ctx.fill();
      }
    }
    birds(ctx, rand, x, y, w, h, 2);
  }

  function convertible(ctx, x, y, w, h, rand) {
    sky(ctx, x, y, w, h, [[0, '#ff9a3d'], [0.55, '#ff5e8a'], [1, '#7a1e6e']]);
    sunDisc(ctx, x + w * 0.78, y + h * 0.24, w * 0.12, '#fff0b0', 'rgba(255,220,120,0.5)');
    palmTree(ctx, x + w * 0.1, y + h * 0.66, h * 0.34, 0.3, '#2a0a3a');
    palmTree(ctx, x + w * 0.9, y + h * 0.66, h * 0.3, -0.35, '#2a0a3a');
    // Road.
    ctx.fillStyle = '#1b0f2e';
    ctx.fillRect(x, y + h * 0.66, w, h * 0.34);
    ctx.fillStyle = '#ffd166';
    for (var i = 0; i < 6; i++) ctx.fillRect(x + (i / 6) * w, y + h * 0.82, w * 0.07, h * 0.014);
    // The car: low convertible silhouette. Proportions use the panel's short
    // side, so the car keeps its shape in tall narrow panels too.
    var u = Math.min(w, h);
    var cy = y + h * 0.66;
    var cw = Math.min(w * 0.62, u * 1.1), ch = Math.min(h * 0.16, w * 0.42);
    var cx = x + (w - cw) / 2;
    ctx.fillStyle = '#ff2e88';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + cw * 0.06, cy - ch * 0.55);
    ctx.lineTo(cx + cw * 0.3, cy - ch * 0.85);
    ctx.lineTo(cx + cw * 0.62, cy - ch * 0.85);
    ctx.lineTo(cx + cw * 0.82, cy - ch * 0.5);
    ctx.lineTo(cx + cw, cy - ch * 0.18);
    ctx.lineTo(cx + cw, cy);
    ctx.closePath(); ctx.fill();
    // Windshield + seats.
    ctx.fillStyle = '#bfe8ff';
    ctx.beginPath();
    ctx.moveTo(cx + cw * 0.33, cy - ch * 0.78);
    ctx.lineTo(cx + cw * 0.58, cy - ch * 0.78);
    ctx.lineTo(cx + cw * 0.66, cy - ch * 0.5);
    ctx.lineTo(cx + cw * 0.33, cy - ch * 0.5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b0a2e';
    ctx.fillRect(cx + cw * 0.42, cy - ch * 0.5, cw * 0.08, ch * 0.5);
    // Wheels.
    var wheelY = cy + u * 0.01;
    [[0.2], [0.78]].forEach(function (pos) {
      var wx = cx + cw * pos[0];
      ctx.fillStyle = '#0a0612';
      ctx.beginPath(); ctx.arc(wx, wheelY, u * 0.075, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8e8f0';
      ctx.beginPath(); ctx.arc(wx, wheelY, u * 0.032, 0, Math.PI * 2); ctx.fill();
    });
    // Headlight beam.
    var beam = ctx.createLinearGradient(cx + cw, cy - ch * 0.2, cx + cw + w * 0.2, cy - ch * 0.2);
    beam.addColorStop(0, 'rgba(255,240,180,0.55)');
    beam.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(cx + cw, cy - ch * 0.32);
    ctx.lineTo(cx + cw + w * 0.2, cy - ch * 0.55);
    ctx.lineTo(cx + cw + w * 0.2, cy + ch * 0.1);
    ctx.lineTo(cx + cw, cy - ch * 0.05);
    ctx.closePath(); ctx.fill();
    void rand;
  }

  function jet(ctx, x, y, w, h, rand) {
    sky(ctx, x, y, w, h, [[0, '#123a6e'], [0.55, '#4a7fb5'], [0.8, '#ff9a3d'], [1, '#ffd166']]);
    sunDisc(ctx, x + w * 0.2, y + h * 0.22, w * 0.1, '#fff3c4', 'rgba(255,220,120,0.5)');
    // Clouds.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (var i = 0; i < 5; i++) {
      var ccx = x + rand() * w;
      var ccy = y + h * (0.12 + rand() * 0.7);
      var cr = w * (0.05 + rand() * 0.06);
      ctx.beginPath();
      ctx.ellipse(ccx, ccy, cr, cr * 0.36, 0, 0, Math.PI * 2);
      ctx.ellipse(ccx + cr * 0.7, ccy + cr * 0.08, cr * 0.7, cr * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Contrails.
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(1.5, h * 0.008);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, y + h * 0.62);
    ctx.lineTo(x + w * 0.42, y + h * 0.5);
    ctx.stroke();
    // Jet silhouette, nose right.
    var jx = x + w * 0.42, jy = y + h * 0.5;
    var s = w * 0.4;
    ctx.fillStyle = '#f5f2ea';
    ctx.beginPath();
    ctx.moveTo(jx - s * 0.5, jy);
    ctx.quadraticCurveTo(jx - s * 0.1, jy - s * 0.06, jx + s * 0.38, jy - s * 0.02);
    ctx.quadraticCurveTo(jx + s * 0.52, jy, jx + s * 0.38, jy + s * 0.03);
    ctx.quadraticCurveTo(jx - s * 0.1, jy + s * 0.06, jx - s * 0.5, jy);
    ctx.closePath(); ctx.fill();
    // Wings.
    ctx.fillStyle = '#e8e2d4';
    ctx.beginPath();
    ctx.moveTo(jx - s * 0.05, jy - s * 0.02);
    ctx.lineTo(jx + s * 0.08, jy - s * 0.34);
    ctx.lineTo(jx + s * 0.2, jy - s * 0.34);
    ctx.lineTo(jx + s * 0.12, jy - s * 0.01);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(jx - s * 0.05, jy + s * 0.02);
    ctx.lineTo(jx + s * 0.05, jy + s * 0.26);
    ctx.lineTo(jx + s * 0.14, jy + s * 0.26);
    ctx.lineTo(jx + s * 0.08, jy + s * 0.01);
    ctx.closePath(); ctx.fill();
    // Tail + windows.
    ctx.fillStyle = '#ff2e88';
    ctx.beginPath();
    ctx.moveTo(jx - s * 0.48, jy);
    ctx.lineTo(jx - s * 0.42, jy - s * 0.22);
    ctx.lineTo(jx - s * 0.32, jy - s * 0.22);
    ctx.lineTo(jx - s * 0.36, jy);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#123a6e';
    for (var k = 0; k < 5; k++) {
      ctx.fillRect(jx + s * (0.05 + k * 0.055), jy - s * 0.012, s * 0.03, s * 0.018);
    }
  }

  function neonStreet(ctx, x, y, w, h, rand) {
    sky(ctx, x, y, w, h, [[0, '#05030f'], [0.6, '#1a0b33'], [1, '#3d1157']]);
    // Buildings left and right with neon signs.
    var signColors = ['#ff2e88', '#2de2c5', '#ffd166', '#7b5cff', '#ff5e3d'];
    for (var side = 0; side < 2; side++) {
      var bx = side === 0 ? x : x + w * 0.72;
      var bw = w * 0.28;
      ctx.fillStyle = '#0b0618';
      ctx.fillRect(bx, y, bw, h * 0.72);
      for (var i = 0; i < 4; i++) {
        var sy = y + h * (0.08 + i * 0.16);
        var col = signColors[Math.floor(rand() * signColors.length)];
        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur = w * 0.03;
        ctx.fillStyle = col;
        rr(ctx, bx + bw * 0.12, sy, bw * 0.76, h * 0.07, h * 0.02);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(bx + bw * 0.2, sy + h * 0.024, bw * 0.6, h * 0.02);
      }
    }
    // Wet road with reflections.
    ctx.fillStyle = '#120a24';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.28, y + h * 0.72);
    ctx.lineTo(x + w * 0.72, y + h * 0.72);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath(); ctx.fill();
    for (var j = 0; j < 7; j++) {
      var col2 = signColors[j % signColors.length];
      ctx.fillStyle = col2;
      ctx.globalAlpha = 0.28 - j * 0.03;
      var rx = x + w * (0.32 + j * 0.055);
      ctx.fillRect(rx, y + h * 0.74, w * 0.012, h * 0.24);
    }
    ctx.globalAlpha = 1;
    // Centre line.
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x + w * 0.49, y + h * 0.76, w * 0.02, h * 0.05);
    ctx.fillRect(x + w * 0.485, y + h * 0.86, w * 0.03, h * 0.07);
    // Distant car headlights.
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath(); ctx.arc(x + w * 0.46, y + h * 0.7, w * 0.012, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + w * 0.54, y + h * 0.7, w * 0.012, 0, Math.PI * 2); ctx.fill();
  }

  function palms(ctx, x, y, w, h, rand) {
    sky(ctx, x, y, w, h, [[0, '#0a2a4a'], [0.5, '#2de2c5'], [0.78, '#ff2e88'], [1, '#ff9a3d']]);
    sunDisc(ctx, x + w * 0.5, y + h * 0.58, w * 0.15, '#fff0b0', 'rgba(255,220,120,0.5)');
    // Ocean strip.
    ctx.fillStyle = '#0e5f7a';
    ctx.fillRect(x, y + h * 0.66, w, h * 0.1);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (var i = 0; i < 5; i++) ctx.fillRect(x + rand() * w * 0.8, y + h * (0.68 + rand() * 0.06), w * 0.12, h * 0.006);
    // Sand + palm row.
    ctx.fillStyle = '#1c0a2e';
    ctx.fillRect(x, y + h * 0.76, w, h * 0.24);
    var positions = [0.08, 0.26, 0.44, 0.62, 0.8, 0.94];
    for (var k = 0; k < positions.length; k++) {
      var lean = (k % 2 === 0 ? 0.35 : -0.3) * (0.7 + rand() * 0.5);
      palmTree(ctx, x + w * positions[k], y + h * 0.98, h * (0.34 + rand() * 0.16), lean, '#12081f');
    }
    birds(ctx, rand, x, y, w, h, 3);
  }

  var DRAWERS = {
    beach: beach,
    skyline: skyline,
    convertible: convertible,
    jet: jet,
    'neon-street': neonStreet,
    palms: palms,
  };

  // Draw one scene into a rectangle. seed keeps the random details stable.
  function drawScene(ctx, sceneId, x, y, w, h, seed) {
    var draw = DRAWERS[sceneId] || DRAWERS.beach;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    draw(ctx, x, y, w, h, mulberry32(seed || 7));
    ctx.restore();
  }

  window.ViceScenes = {
    drawScene: drawScene,
    ids: Object.keys(DRAWERS),
  };
})();
