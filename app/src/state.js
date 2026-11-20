/* Vice Cover Lab — state, catalogues and persistence. Plain classic script, no modules. */
(function () {
  'use strict';

  var STORAGE_KEY = 'vice-cover-lab-v1';

  // Export sizes the app can write as PNG.
  var SIZES = {
    square:   { id: 'square',   w: 1080, h: 1080, label: '1080 × 1080', note: 'Square post' },
    portrait: { id: 'portrait', w: 1080, h: 1350, label: '1080 × 1350', note: 'Portrait post' },
    wide:     { id: 'wide',     w: 1920, h: 1080, label: '1920 × 1080', note: 'Landscape cover' },
  };

  // Six layouts. panelCount drives how many fill slots the cover has.
  var LAYOUTS = {
    'hero-duo':   { id: 'hero-duo',   name: 'Hero Duo',   note: 'Two tall panels',   panelCount: 2 },
    'nine-grid':  { id: 'nine-grid',  name: 'Nine Grid',  note: '3 × 3 poster grid', panelCount: 9 },
    'full-bleed': { id: 'full-bleed', name: 'Full Bleed', note: 'One big moment',    panelCount: 1 },
    'split-city': { id: 'split-city', name: 'Split City', note: 'Two halves',        panelCount: 2 },
    'tilted-snaps': { id: 'tilted-snaps', name: 'Tilted Snaps', note: 'Polaroid trio', panelCount: 3 },
    'neon-strips': { id: 'neon-strips', name: 'Neon Strips', note: 'Four film strips', panelCount: 4 },
  };

  // Five colour grades. filter is a canvas ctx.filter string applied to photos;
  // tint is drawn over the whole cover with the given composite mode.
  var GRADES = {
    'vice-sunset': {
      id: 'vice-sunset', name: 'Vice Sunset', note: 'Hot pink dusk, the classic look',
      filter: 'saturate(1.45) contrast(1.1) brightness(1.02)',
      tintTop: 'rgba(255,46,136,0.16)', tintBottom: 'rgba(255,154,61,0.20)',
      tintMode: 'overlay', sky: ['#2b0a4a', '#ff2e88', '#ff9a3d'], accent: '#ff2e88',
    },
    'neon-night': {
      id: 'neon-night', name: 'Neon Night', note: 'Electric blues and magentas',
      filter: 'saturate(1.6) contrast(1.14) hue-rotate(-14deg) brightness(0.98)',
      tintTop: 'rgba(80,40,255,0.22)', tintBottom: 'rgba(255,46,180,0.16)',
      tintMode: 'overlay', sky: ['#05081f', '#3b1d8f', '#ff2e88'], accent: '#2de2c5',
    },
    'golden-hour': {
      id: 'golden-hour', name: 'Golden Hour', note: 'Warm late-afternoon gold',
      filter: 'saturate(1.3) contrast(1.05) sepia(0.28) brightness(1.04)',
      tintTop: 'rgba(255,190,80,0.14)', tintBottom: 'rgba(255,120,40,0.20)',
      tintMode: 'soft-light', sky: ['#3a1c00', '#ff9a3d', '#ffd166'], accent: '#ffd166',
    },
    'palm-noir': {
      id: 'palm-noir', name: 'Palm Noir', note: 'Moody black-and-teal night',
      filter: 'saturate(0.55) contrast(1.22) brightness(0.94)',
      tintTop: 'rgba(45,226,197,0.10)', tintBottom: 'rgba(0,0,0,0.28)',
      tintMode: 'overlay', sky: ['#020617', '#0f2b33', '#2de2c5'], accent: '#2de2c5',
    },
    'ocean-drive': {
      id: 'ocean-drive', name: 'Ocean Drive', note: 'Turquoise Miami morning',
      filter: 'saturate(1.35) contrast(1.06) hue-rotate(8deg) brightness(1.05)',
      tintTop: 'rgba(45,226,197,0.14)', tintBottom: 'rgba(0,140,255,0.16)',
      tintMode: 'overlay', sky: ['#062a4a', '#0ea5b7', '#7ff0d4'], accent: '#0ea5b7',
    },
  };

  // Six vignette scenes, each drawn entirely in code by scenes.js.
  var SCENES = {
    beach:       { id: 'beach',       name: 'Beach sunset' },
    skyline:     { id: 'skyline',     name: 'City skyline' },
    convertible: { id: 'convertible', name: 'Convertible' },
    jet:         { id: 'jet',         name: 'Private jet' },
    'neon-street': { id: 'neon-street', name: 'Neon street' },
    palms:       { id: 'palms',       name: 'Palm row' },
  };

  var SCENE_ORDER = ['beach', 'skyline', 'convertible', 'jet', 'neon-street', 'palms'];

  var CAPTION_PRESETS = [
    { title: 'NEON SHORE', subtitle: 'a vice city story', badge: 'VICE CITY · 2026' },
    { title: 'SUNSET HEIST', subtitle: 'one last job on ocean drive', badge: 'EST. 2026' },
    { title: 'BOULEVARD QUEEN', subtitle: 'she runs this town now', badge: 'VICE CITY' },
    { title: 'PIER NIGHTS', subtitle: 'salt air, neon lights', badge: 'LEONIDA' },
    { title: 'GETAWAY', subtitle: 'no brakes, no regrets', badge: 'WANTED ★★★★★' },
  ];

  var SAMPLE_PHOTOS = [
    { id: 'sample-pier', name: 'Pier', src: 'samples/pier.jpg' },
    { id: 'sample-boulevard', name: 'Boulevard', src: 'samples/boulevard.jpg' },
  ];

  function defaultPanels(layoutId) {
    var count = LAYOUTS[layoutId].panelCount;
    var panels = [];
    for (var i = 0; i < count; i++) {
      panels.push({
        photoId: null,
        scene: SCENE_ORDER[i % SCENE_ORDER.length],
        panX: 0, panY: 0, zoom: 1,
      });
    }
    // First two panels start with the two sample photos, so the cover is alive at once.
    if (count > 0) panels[0].photoId = 'sample-pier';
    if (count > 1) panels[1].photoId = 'sample-boulevard';
    return panels;
  }

  function defaultState() {
    return {
      title: 'NEON SHORE',
      subtitle: 'a vice city story',
      badge: 'VICE CITY · 2026',
      layout: 'hero-duo',
      grade: 'vice-sunset',
      size: 'wide',
      grain: true,
      vignette: true,
      titleStroke: true,
      panels: defaultPanels('hero-duo'),
      selected: 0,
    };
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      var parsed = JSON.parse(raw);
      var base = defaultState();
      var merged = {};
      for (var key in base) merged[key] = parsed[key] === undefined ? base[key] : parsed[key];
      if (!Array.isArray(merged.panels) || !merged.panels.length) merged.panels = defaultPanels(merged.layout || 'hero-duo');
      if (!LAYOUTS[merged.layout]) merged.layout = 'hero-duo';
      if (!GRADES[merged.grade]) merged.grade = 'vice-sunset';
      if (!SIZES[merged.size]) merged.size = 'wide';
      merged.selected = Math.min(merged.selected || 0, merged.panels.length - 1);
      return merged;
    } catch (err) {
      return defaultState();
    }
  }

  function saveState(state) {
    try {
      var copy = {};
      for (var key in state) if (key !== 'photos') copy[key] = state[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    } catch (err) { /* storage full or unavailable: the app still works */ }
  }

  // Resize the panel list when the layout changes, keeping what fits.
  function panelsForLayout(state, layoutId) {
    var count = LAYOUTS[layoutId].panelCount;
    var next = state.panels.slice(0, count);
    while (next.length < count) {
      next.push({
        photoId: null,
        scene: SCENE_ORDER[next.length % SCENE_ORDER.length],
        panX: 0, panY: 0, zoom: 1,
      });
    }
    return next;
  }

  window.ViceState = {
    SIZES: SIZES,
    LAYOUTS: LAYOUTS,
    GRADES: GRADES,
    SCENES: SCENES,
    SCENE_ORDER: SCENE_ORDER,
    CAPTION_PRESETS: CAPTION_PRESETS,
    SAMPLE_PHOTOS: SAMPLE_PHOTOS,
    defaultState: defaultState,
    loadState: loadState,
    saveState: saveState,
    panelsForLayout: panelsForLayout,
  };
})();
