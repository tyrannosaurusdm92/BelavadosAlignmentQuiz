(() => {
  'use strict';

  const BACKEND_CONFIG = window.EffectsStudioBackendConfig || {};
  const MAP_ENGINE = window.EffectsStudioMapEngine || null;
  const BACKEND_URL = BACKEND_CONFIG.serviceBackend?.exec || 'https://script.google.com/macros/s/AKfycbyqw2pg_-I8i8jP-nIVq4ATC_bw0fRNFi_yhM044TnbRtbuiEt98Btg1Q0ZnQRsIpItag/exec';
  const BACKEND_LIBRARY_URL = BACKEND_CONFIG.serviceBackend?.library || 'https://script.google.com/macros/library/d/18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr/10';
  const APP_NAME = 'Effects Studio';
  const STORAGE_KEY = 'effectsStudioProject';
  const PROJECT_DB_NAME = 'EffectsStudioProjects';
  const PROJECT_STORE = 'projects';
  const PROJECT_DB_VERSION = 1;
  const PROJECT_FALLBACK_KEY = 'effectsStudioProjectLibraryFallback';
  const fallbackProjects = new Map();
  let fallbackProjectsLoaded = false;
  const MAX_HISTORY = 24;
  const DEFAULT_W = 1600;
  const DEFAULT_H = 1200;
  const PALETTE = [
    '#E8FFFF','#D6FFFA','#C9FFF4','#FFE6C9','#FFF3D6',
    '#99FFFF','#7EFBEA','#65E9D2','#F7B36B','#EFA35C',
    '#00FFFF','#00D9D9','#2FBED8','#CA6309','#B85A08',
    '#008B8B','#007A78','#0B6E74','#7A3A07','#643006',
    '#003C42','#003A3A','#062D34','#2A1304','#1A0A02',
    '#FFFFFF','#ECFFFF','#FFF1E6','#F1FFF9','#E9F8FF',
    '#001E24','#220E02','#09292C','#061F27','#0A241F'
  ];

  const $ = (id) => document.getElementById(id);
  const safeStorageGet = (key) => { try { return localStorage.getItem(key); } catch (err) { return null; } };
  const safeStorageSet = (key, value) => { try { localStorage.setItem(key, value); return true; } catch (err) { return false; } };
  const safeStorageRemove = (key) => { try { localStorage.removeItem(key); return true; } catch (err) { return false; } };
  const els = {
    toolDrawer: $('toolDrawer'),
    toggleTools: $('toggleTools'),
    stage: $('stage'),
    viewport: $('canvasViewport'),
    layerStack: $('layerStack'),
    preview: $('previewCanvas'),
    grid: $('gridOverlay'),
    status: $('statusBar'),
    brushCursor: $('brushCursor'),
    colorDisc: $('colorDisc'),
    colorInput: $('colorInput'),
    hexInput: $('hexInput'),
    swatches: $('swatches'),
    toolGrid: $('toolGrid'),
    layersList: $('layersList'),
    framesList: $('framesList'),
    animationPreview: $('animationPreview'),
    hotspotLayer: $('hotspotLayer'),
    shortcutsDialog: $('shortcutsDialog'),
    objectLayer: $('objectLayer'),
    objectCanvas: $('objectCanvas'),
    assetGrid: $('assetGrid'),
    assetCategory: $('assetCategory'),
    assetSearch: $('assetSearch'),
    emojiGrid: $('emojiGrid'),
    objectList: $('objectList'),
    mapGridCanvas: $('mapGridCanvas'),
    lightingCanvas: $('lightingCanvas'),
    lightHandleLayer: $('lightHandleLayer'),
    soundZoneLayer: $('soundZoneLayer'),
    mapTexturePreview: $('mapTexturePreview'),
    customAssetGrid: $('customAssetGrid'),
    lightList: $('lightList'),
    soundList: $('soundList'),
  };

  const inputs = {
    size: $('sizeInput'), opacity: $('opacityInput'), softness: $('softnessInput'), smooth: $('smoothInput'),
    blend: $('blendInput'), shapeType: $('shapeType'), shapeFill: $('shapeFill'), rotation: $('rotationInput'),
    text: $('textInput'), font: $('fontInput'), link: $('linkInput'), zoom: $('zoomInput'), canvasPreset: $('canvasPreset'),
    layerOpacity: $('layerOpacityInput'), fps: $('fpsInput'), onion: $('onionSkinInput'), tolerance: $('toleranceInput'),
    imageImport: $('imageImport'), projectImport: $('projectImport'),
    overlayImport: $('overlayImport'), sprayPalette: $('sprayPaletteInput'), sprayDensity: $('sprayDensityInput'), dripChance: $('dripChanceInput'),
    gradientToggle: $('gradientToggle'), gradientA: $('gradientA'), gradientB: $('gradientB'), gradientAngle: $('gradientAngleInput'),
    textSize: $('textSizeInput'), letterSpacing: $('letterSpacingInput'), lineSpacing: $('lineSpacingInput'), bend: $('bendInput'),
    strokeColor: $('strokeColorInput'), strokeWidth: $('strokeWidthInput'), highlightColor: $('highlightColorInput'), shadowBlur: $('shadowBlurInput'),
    textAlign: $('textAlignInput'), objectMode: $('objectModeInput'), objectX: $('objectXInput'), objectY: $('objectYInput'),
    objectW: $('objectWInput'), objectH: $('objectHInput'), objectOpacity: $('objectOpacityInput'),
    shapeSides: $('shapeSidesInput'), edgeSoftness: $('edgeSoftnessInput'), removeStrength: $('removeStrengthInput'), previewTransparency: $('previewTransparencyInput'),
    backgroundMode: $('backgroundModeInput'), backgroundColor: $('backgroundColorInput'),
    mapTexture: $('mapTextureInput'), mapBrushSize: $('mapBrushSizeInput'), mapTextureScale: $('mapTextureScaleInput'),
    mapTextureOpacity: $('mapTextureOpacityInput'), mapTextureAngle: $('mapTextureAngleInput'), mapGridPreset: $('mapGridPresetInput'),
    mapGridStyle: $('mapGridStyleInput'), mapGridSize: $('mapGridSizeInput'), mapGridOpacity: $('mapGridOpacityInput'), mapGridColor: $('mapGridColorInput'),
    mapGridEnabled: $('mapGridEnabledInput'), mapGridExport: $('mapGridExportInput'), mapSnap: $('mapSnapInput'),
    lightingEnabled: $('lightingEnabledInput'), ambientColor: $('ambientColorInput'), ambientDarkness: $('ambientDarknessInput'),
    lightName: $('lightNameInput'), lightColor: $('lightColorInput'), lightIntensity: $('lightIntensityInput'), lightRadius: $('lightRadiusInput'),
    lightSoftness: $('lightSoftnessInput'), lightRotation: $('lightRotationInput'), lightAngle: $('lightAngleInput'), lightPulse: $('lightPulseInput'), lightFlicker: $('lightFlickerInput'), lightEnabled: $('lightEnabledInput'),
    soundName: $('soundNameInput'), soundRadius: $('soundRadiusInput'), soundVolume: $('soundVolumeInput'), soundLoop: $('soundLoopInput'), soundSpatial: $('soundSpatialInput'), soundEnabled: $('soundEnabledInput'), soundTrigger: $('soundTriggerInput'),
  };

  const state = {
    width: DEFAULT_W,
    height: DEFAULT_H,
    zoom: 1,
    pan: { x: 420, y: 80 },
    activeTool: 'pencil',
    color: '#00FFFF',
    pickedColor: '#FFFFFF',
    brush: { size: 18, opacity: 1, softness: 0.35, smoothing: 0.45, blend: 'source-over' },
    shape: { type: 'rect', fill: 'fillStroke', rotation: 0, sides: 6 },
    layers: [],
    activeLayerId: null,
    frames: [],
    annotations: [],
    objects: [],
    activeObjectId: null,
    assetLibrary: [],
    spray: { colors: ['#00FFFF','#7EFBEA','#CA6309'], density: 0.55, drip: 0.22 },
    textStyle: { bold: false, italic: false, underline: false, strike: false, size: 72, letterSpacing: 0, lineSpacing: 1.1, bend: 0, stroke: '#001E24', strokeWidth: 4, highlight: '#FFF3D6', shadowBlur: 10, align: 'left' },
    gradient: { enabled: true, a: '#00FFFF', b: '#CA6309', angle: 45 },
    background: { mode: 'transparent', color: '#FFFFFF' },
    objectMode: true,
    pinBackground: false,
    history: [],
    redo: [],
    pointer: null,
    lastPoint: null,
    points: [],
    mirror: false,
    grid: true,
    animationTimer: null,
    animationIndex: 0,
    beforeTransparentSnapshot: null,
    transparentColor: null,
    transparentSeed: null,
    repairSourceDataUrl: null,
    repairSourceCanvas: null,
    zoomBoxRect: null,
    deferredInstallPrompt: null,
    project: { id: null, name: 'Untitled Project', createdAt: null, updatedAt: null, dirty: false },
    projectDb: null,
    map: { textureId: 'dirt0', brushSize: 140, textureScale: 1, textureOpacity: 1, textureAngle: 0, grid: { enabled: true, preset: 'seamless-1', style: 'square', cellSize: 48, opacity: .38, color: '#00FFFF', export: true }, snap: true },
    lighting: { enabled: true, ambientColor: '#071019', darkness: .35, lights: [] },
    activeLightId: null,
    sounds: [],
    activeSoundId: null,
    soundPlayers: new Map(),
    customAssets: [],
  };

  function uid(prefix = 'id') {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function degToRad(deg) { return deg * Math.PI / 180; }
  function hex(n) { return n.toString(16).padStart(2, '0').toUpperCase(); }
  function rgbToHex(r, g, b) { return `#${hex(r)}${hex(g)}${hex(b)}`; }
  function parseHex(value) {
    if (!value) return [0, 255, 255, 255];
    let v = String(value).trim().replace('#', '');
    if (v.length === 3) v = v.split('').map((c) => c + c).join('');
    if (v.length === 6) v += 'FF';
    if (!/^[0-9a-fA-F]{8}$/.test(v)) return [0, 255, 255, 255];
    return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16), parseInt(v.slice(6,8),16)];
  }

  function canvasToBlob(canvas, type = 'image/png', quality = 0.95) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  function download(filename, data, mime = 'application/octet-stream') {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function status(message) {
    els.status.textContent = message;
  }

  function createCanvas(width = state.width, height = state.height, className = '') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.className = className;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    return canvas;
  }

  function getActiveLayer() {
    return state.layers.find((layer) => layer.id === state.activeLayerId) || state.layers[state.layers.length - 1];
  }

  function updateStageSize() {
    els.stage.style.width = `${state.width}px`;
    els.stage.style.height = `${state.height}px`;
    els.preview.width = state.width;
    els.preview.height = state.height;
    if (els.objectCanvas) { els.objectCanvas.width = state.width; els.objectCanvas.height = state.height; els.objectCanvas.style.width = `${state.width}px`; els.objectCanvas.style.height = `${state.height}px`; }
    for (const canvas of [els.mapGridCanvas, els.lightingCanvas].filter(Boolean)) { canvas.width = state.width; canvas.height = state.height; canvas.style.width = `${state.width}px`; canvas.style.height = `${state.height}px`; }
    els.preview.style.width = `${state.width}px`;
    els.preview.style.height = `${state.height}px`;
    applyCanvasBackground();
    for (const layer of state.layers) {
      if (layer.canvas.width !== state.width || layer.canvas.height !== state.height) {
        const old = layer.canvas;
        const replacement = createCanvas(state.width, state.height, 'art-layer');
        replacement.getContext('2d').drawImage(old, 0, 0);
        layer.canvas.replaceWith(replacement);
        layer.canvas = replacement;
        layer.ctx = replacement.getContext('2d', { willReadFrequently: true });
      }
    }
    applyView();
    renderHotspots();
    renderMapGrid();
    renderLighting();
    renderLightHandles();
    renderSoundZones();
  }

  function addLayer(name = `Layer ${state.layers.length + 1}`, dataUrl = null) {
    const canvas = createCanvas(state.width, state.height, 'art-layer');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const layer = { id: uid('layer'), name, canvas, ctx, visible: true, opacity: 1, blend: 'source-over' };
    state.layers.push(layer);
    els.layerStack.appendChild(canvas);
    state.activeLayerId = layer.id;
    if (dataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, state.width, state.height);
      img.src = dataUrl;
    }
    renderLayers();
    return layer;
  }

  function removeLayer(id) {
    if (state.layers.length <= 1) {
      status('Keep at least one layer.');
      return;
    }
    const idx = state.layers.findIndex((l) => l.id === id);
    if (idx < 0) return;
    pushHistory('delete layer');
    state.layers[idx].canvas.remove();
    state.layers.splice(idx, 1);
    state.activeLayerId = state.layers[Math.max(0, idx - 1)].id;
    renderLayers();
    status('Layer deleted.');
  }

  function reorderLayers() {
    els.layerStack.innerHTML = '';
    for (const layer of state.layers) els.layerStack.appendChild(layer.canvas);
    renderLayers();
  }

  function renderLayers() {
    els.layersList.innerHTML = '';
    for (let i = state.layers.length - 1; i >= 0; i--) {
      const layer = state.layers[i];
      layer.canvas.style.display = layer.visible ? 'block' : 'none';
      layer.canvas.style.opacity = layer.opacity;
      layer.canvas.style.mixBlendMode = cssBlend(layer.blend);
      const row = document.createElement('div');
      row.className = `layer-item${layer.id === state.activeLayerId ? ' active' : ''}`;
      const img = document.createElement('img');
      img.className = 'layer-thumb';
      img.alt = '';
      img.src = layer.canvas.toDataURL('image/png');
      const name = document.createElement('span');
      name.textContent = layer.name;
      const actions = document.createElement('div');
      actions.className = 'button-row';
      const select = document.createElement('button');
      select.type = 'button';
      select.textContent = 'Use';
      select.addEventListener('click', () => { state.activeObjectId = null; state.activeLayerId = layer.id; inputs.layerOpacity.value = Math.round(layer.opacity * 100); $('layerOpacityOut').textContent = String(Math.round(layer.opacity * 100)); renderLayers(); renderObjects(); });
      const visible = document.createElement('button');
      visible.type = 'button';
      visible.textContent = layer.visible ? 'Hide' : 'Show';
      visible.addEventListener('click', () => { layer.visible = !layer.visible; renderLayers(); });
      actions.append(select, visible);
      row.append(img, name, actions);
      els.layersList.appendChild(row);
    }
    renderObjectList();
  }

  function cssBlend(blend) {
    const allowed = new Set(['multiply','screen','overlay','soft-light','color-dodge','lighter','darken','lighten']);
    return allowed.has(blend) ? blend : 'normal';
  }

  function serializeProject(options = {}) {
    const includeFrames = options.includeFrames !== false;
    return {
      app: APP_NAME,
      version: '2026.07.30.effects-studio-map-effects',
      projectName: state.project.name,
      savedAt: new Date().toISOString(),
      backendAction: 'saveEffectStudioProject',
      width: state.width,
      height: state.height,
      zoom: state.zoom,
      pan: state.pan,
      activeTool: state.activeTool,
      color: state.color,
      brush: state.brush,
      shape: state.shape,
      mirror: state.mirror,
      annotations: state.annotations,
      objects: state.objects,
      spray: state.spray,
      textStyle: state.textStyle,
      gradient: state.gradient,
      background: state.background,
      map: state.map,
      lighting: state.lighting,
      sounds: state.sounds,
      customAssets: state.customAssets,
      transparentColor: state.transparentColor,
      transparentSeed: state.transparentSeed,
      repairSourceDataUrl: state.repairSourceDataUrl,
      layers: state.layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        blend: layer.blend,
        dataUrl: layer.canvas.toDataURL('image/png')
      })),
      frames: includeFrames ? state.frames : [],
    };
  }

  async function loadProject(project) {
    if (!project || !Array.isArray(project.layers)) throw new Error('Invalid project JSON.');
    state.width = Number(project.width) || DEFAULT_W;
    state.height = Number(project.height) || DEFAULT_H;
    state.pan = project.pan || { x: 80, y: 80 };
    state.zoom = Number(project.zoom) || 1;
    if (project.projectName) state.project.name = String(project.projectName).slice(0, 80);
    state.color = project.color || '#00FFFF';
    state.brush = { ...state.brush, ...(project.brush || {}) };
    state.shape = { ...state.shape, ...(project.shape || {}) };
    state.mirror = !!project.mirror;
    state.annotations = Array.isArray(project.annotations) ? project.annotations : [];
    state.objects = Array.isArray(project.objects) ? project.objects : [];
    state.spray = { ...state.spray, ...(project.spray || {}) };
    state.textStyle = { ...state.textStyle, ...(project.textStyle || {}) };
    state.gradient = { ...state.gradient, ...(project.gradient || {}) };
    state.background = { ...state.background, ...(project.background || {}) };
    state.map = { ...state.map, ...(project.map || {}), grid: { ...state.map.grid, ...(project.map?.grid || {}) } };
    state.lighting = { ...state.lighting, ...(project.lighting || {}), lights: Array.isArray(project.lighting?.lights) ? project.lighting.lights : [] };
    state.sounds = Array.isArray(project.sounds) ? project.sounds : [];
    state.customAssets = Array.isArray(project.customAssets) ? project.customAssets : [];
    state.activeLightId = state.lighting.lights[0]?.id || null;
    state.activeSoundId = state.sounds[0]?.id || null;
    stopAllSounds();
    state.transparentColor = project.transparentColor || null;
    state.transparentSeed = project.transparentSeed || null;
    state.repairSourceDataUrl = project.repairSourceDataUrl || null;
    if (state.repairSourceDataUrl) hydrateRepairSourceCanvas(state.repairSourceDataUrl);
    state.activeObjectId = null;
    state.frames = Array.isArray(project.frames) ? project.frames : [];
    els.layerStack.innerHTML = '';
    state.layers = [];
    for (const layerData of project.layers) {
      const layer = addLayer(layerData.name || 'Layer', null);
      layer.id = layerData.id || layer.id;
      layer.visible = layerData.visible !== false;
      layer.opacity = Number.isFinite(layerData.opacity) ? layerData.opacity : 1;
      layer.blend = layerData.blend || 'source-over';
      if (layerData.dataUrl) {
        await drawDataUrl(layer.ctx, layerData.dataUrl, state.width, state.height);
      }
    }
    state.activeLayerId = state.layers[state.layers.length - 1]?.id || null;
    setColor(state.color);
    inputs.size.value = String(state.brush.size);
    inputs.opacity.value = String(Math.round(state.brush.opacity * 100));
    inputs.softness.value = String(Math.round(state.brush.softness * 100));
    inputs.smooth.value = String(Math.round(state.brush.smoothing * 100));
    inputs.blend.value = state.brush.blend;
    inputs.zoom.value = String(Math.round(state.zoom * 100));
    updateOutputLabels();
    updateStageSize();
    renderLayers();
    renderFrames();
    renderHotspots();
    renderObjects();
    syncExtraInputsFromState();
    syncMapInputsFromState();
    renderMapGrid(); renderLighting(); renderLightHandles(); renderSoundZones(); renderCustomAssetGrid();
    applyCanvasBackground();
    applyView();
    status('Project loaded.');
  }

  function drawDataUrl(ctx, dataUrl, width, height) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { ctx.clearRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height); resolve(); };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function pushHistory(reason = 'edit') {
    try {
      state.history.push(serializeProject({ includeFrames: false }));
      if (state.history.length > MAX_HISTORY) state.history.shift();
      state.redo.length = 0;
      state.project.dirty = true;
      updateProjectHeading();
      status(`Saved undo point: ${reason}.`);
    } catch (err) {
      console.warn('History skipped:', err);
    }
  }

  async function undo() {
    const snapshot = state.history.pop();
    if (!snapshot) { status('Nothing to undo.'); return; }
    state.redo.push(serializeProject({ includeFrames: false }));
    await loadProject({ ...snapshot, frames: state.frames });
    status('Undo complete.');
  }

  async function redo() {
    const snapshot = state.redo.pop();
    if (!snapshot) { status('Nothing to redo.'); return; }
    state.history.push(serializeProject({ includeFrames: false }));
    await loadProject({ ...snapshot, frames: state.frames });
    status('Redo complete.');
  }

  function fitCanvas() {
    const rect = els.viewport.getBoundingClientRect();
    const sidePad = window.innerWidth >= 980 ? 48 : 24;
    const z = Math.min((rect.width - sidePad) / state.width, (rect.height - 120) / state.height);
    state.zoom = clamp(z, 0.05, 8);
    state.pan.x = (rect.width - state.width * state.zoom) / 2;
    state.pan.y = (rect.height - state.height * state.zoom) / 2;
    inputs.zoom.value = String(Math.round(state.zoom * 100));
    applyView();
  }

  function applyView() {
    els.stage.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
    $('zoomOut').textContent = String(Math.round(state.zoom * 100));
    inputs.zoom.value = String(Math.round(state.zoom * 100));
    renderHotspots();
    status(`${titleCase(state.activeTool)} · ${state.width}×${state.height} · ${Math.round(state.zoom * 100)}%`);
  }

  function titleCase(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }

  function setTool(tool) {
    state.activeTool = tool;
    document.querySelectorAll('[data-tool]').forEach((btn) => btn.classList.toggle('active', btn.dataset.tool === tool));
    els.viewport.style.cursor = tool === 'pan' ? 'grab' : 'crosshair';
    updateBrushCursor();
    status(`${titleCase(tool)} ready.`);
  }

  function setColor(value) {
    const [r, g, b] = parseHex(value);
    state.color = rgbToHex(r, g, b);
    els.colorInput.value = state.color;
    els.hexInput.value = state.color;
    updateBrushCursor();
    if ($('patternPrimaryInput')) $('patternPrimaryInput').value = state.color;
  }

  function updateOutputLabels() {
    state.brush.size = Number(inputs.size.value);
    state.brush.opacity = Number(inputs.opacity.value) / 100;
    state.brush.softness = Number(inputs.softness.value) / 100;
    state.brush.smoothing = Number(inputs.smooth.value) / 100;
    state.brush.blend = inputs.blend.value;
    state.shape.type = inputs.shapeType.value;
    state.shape.fill = inputs.shapeFill.value;
    state.shape.rotation = Number(inputs.rotation.value);
    if (inputs.shapeSides) state.shape.sides = Number(inputs.shapeSides.value || 6);
    state.zoom = Number(inputs.zoom.value) / 100;
    if (inputs.sprayPalette) state.spray.colors = parseColorList(inputs.sprayPalette.value);
    if (inputs.sprayDensity) state.spray.density = Number(inputs.sprayDensity.value) / 100;
    if (inputs.dripChance) state.spray.drip = Number(inputs.dripChance.value) / 100;
    if (inputs.gradientToggle) state.gradient.enabled = inputs.gradientToggle.checked;
    if (inputs.gradientA) state.gradient.a = inputs.gradientA.value;
    if (inputs.gradientB) state.gradient.b = inputs.gradientB.value;
    if (inputs.gradientAngle) state.gradient.angle = Number(inputs.gradientAngle.value);
    if (inputs.backgroundMode) state.background.mode = inputs.backgroundMode.value;
    if (inputs.backgroundColor) state.background.color = rgbToHex(...parseHex(inputs.backgroundColor.value));
    applyCanvasBackground();
    if (state.frames.length) updateAnimationPreview(state.frames[0]?.dataUrl);
    if (inputs.textSize) state.textStyle.size = Number(inputs.textSize.value);
    if (inputs.letterSpacing) state.textStyle.letterSpacing = Number(inputs.letterSpacing.value);
    if (inputs.lineSpacing) state.textStyle.lineSpacing = Number(inputs.lineSpacing.value) / 100;
    if (inputs.bend) state.textStyle.bend = Number(inputs.bend.value) / 100;
    if (inputs.strokeColor) state.textStyle.stroke = inputs.strokeColor.value;
    if (inputs.strokeWidth) state.textStyle.strokeWidth = Number(inputs.strokeWidth.value);
    if (inputs.highlightColor) state.textStyle.highlight = inputs.highlightColor.value;
    if (inputs.shadowBlur) state.textStyle.shadowBlur = Number(inputs.shadowBlur.value);
    if (inputs.textAlign) state.textStyle.align = inputs.textAlign.value;
    if (inputs.objectMode) state.objectMode = inputs.objectMode.checked;
    $('sizeOut').textContent = String(state.brush.size);
    $('opacityOut').textContent = String(Math.round(state.brush.opacity * 100));
    $('softnessOut').textContent = String(Math.round(state.brush.softness * 100));
    $('smoothOut').textContent = String(Math.round(state.brush.smoothing * 100));
    $('rotationOut').textContent = String(state.shape.rotation);
    if ($('shapeSidesOut')) $('shapeSidesOut').textContent = String(state.shape.sides || 6);
    if ($('sprayDensityOut')) $('sprayDensityOut').textContent = String(Math.round(state.spray.density * 100));
    if ($('dripChanceOut')) $('dripChanceOut').textContent = String(Math.round(state.spray.drip * 100));
    if ($('gradientAngleOut')) $('gradientAngleOut').textContent = String(state.gradient.angle);
    if ($('textSizeOut')) $('textSizeOut').textContent = String(state.textStyle.size);
    if ($('letterSpacingOut')) $('letterSpacingOut').textContent = String(state.textStyle.letterSpacing);
    if ($('lineSpacingOut')) $('lineSpacingOut').textContent = String(state.textStyle.lineSpacing.toFixed(1));
    if ($('bendOut')) $('bendOut').textContent = String(Math.round(state.textStyle.bend * 100));
    if ($('strokeWidthOut')) $('strokeWidthOut').textContent = String(state.textStyle.strokeWidth);
    if ($('shadowBlurOut')) $('shadowBlurOut').textContent = String(state.textStyle.shadowBlur);
    updateSelectedObjectFromInputs(false);
    $('fpsOut').textContent = String(inputs.fps.value);
    $('toleranceOut').textContent = String(inputs.tolerance.value);
    $('zoomOut').textContent = String(Math.round(state.zoom * 100));
    $('layerOpacityOut').textContent = String(inputs.layerOpacity.value);
    if ($('edgeSoftnessOut') && inputs.edgeSoftness) $('edgeSoftnessOut').textContent = String(inputs.edgeSoftness.value);
    if ($('removeStrengthOut') && inputs.removeStrength) $('removeStrengthOut').textContent = String(inputs.removeStrength.value);
    updateBrushCursor();
  }

  function clientToCanvas(clientX, clientY) {
    const rect = els.viewport.getBoundingClientRect();
    const x = (clientX - rect.left - state.pan.x) / state.zoom;
    const y = (clientY - rect.top - state.pan.y) / state.zoom;
    return { x: clamp(x, -5000, state.width + 5000), y: clamp(y, -5000, state.height + 5000) };
  }

  function configureCtx(ctx, options = {}) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = options.color || state.color;
    ctx.fillStyle = options.color || state.color;
    ctx.lineWidth = options.size || state.brush.size;
    ctx.globalAlpha = options.opacity ?? state.brush.opacity;
    ctx.globalCompositeOperation = options.blend || state.brush.blend || 'source-over';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  function drawLine(ctx, from, to, tool = state.activeTool) {
    const size = state.brush.size;
    configureCtx(ctx);
    if (tool === 'eraser') ctx.globalCompositeOperation = 'destination-out';
    if (tool === 'repair') ctx.globalCompositeOperation = 'source-over';
    if (tool === 'marker') { ctx.globalAlpha *= 0.38; ctx.lineWidth = size * 1.15; }
    if (tool === 'crayon') { ctx.globalAlpha *= 0.52; ctx.lineWidth = size; }
    if (tool === 'charcoal') { ctx.globalAlpha *= 0.48; ctx.lineWidth = size * 1.25; }
    if (tool === 'paint') { ctx.globalAlpha *= 0.9; ctx.lineWidth = size * 1.35; }
    if (tool === 'ink') { ctx.lineWidth = Math.max(1, size * 0.55); }
    if (tool === 'neon') { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.88; ctx.lineWidth = Math.max(2, size * 0.42); ctx.shadowBlur = size * 0.9; ctx.shadowColor = state.color; }
    if (tool === 'calligraphy') {
      const angle = Math.atan2(to.y - from.y, to.x - from.x) - 0.55;
      ctx.save();
      ctx.translate(to.x, to.y);
      ctx.rotate(angle);
      ctx.globalAlpha *= 0.92;
      ctx.fillRect(-size * 0.52, -Math.max(1, size * 0.11), size * 1.04, Math.max(2, size * 0.22));
      ctx.restore();
      return;
    }
    if (tool === 'pixel') {
      const grid = Math.max(2, Math.round(size));
      ctx.globalAlpha = state.brush.opacity;
      ctx.fillRect(Math.floor(to.x / grid) * grid, Math.floor(to.y / grid) * grid, grid, grid);
      return;
    }
    if (tool === 'repair' && state.repairSourceCanvas) {
      const radius = Math.max(1, size / 2);
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = state.brush.opacity;
      ctx.beginPath();
      ctx.arc(to.x, to.y, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(state.repairSourceCanvas, to.x - radius, to.y - radius, radius * 2, radius * 2, to.x - radius, to.y - radius, radius * 2, radius * 2);
      ctx.restore();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    if (state.brush.smoothing > 0.02) {
      const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      ctx.quadraticCurveTo(from.x, from.y, mid.x, mid.y);
    } else {
      ctx.lineTo(to.x, to.y);
    }
    ctx.stroke();
    if (tool === 'crayon' || tool === 'charcoal') addTexture(ctx, to, size, tool);
  }

  function addTexture(ctx, point, size, tool) {
    const count = tool === 'charcoal' ? 10 : 6;
    const [r,g,b] = parseHex(state.color);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = Math.random() * size * 0.9;
      const dot = Math.max(1, size * (Math.random() * 0.11));
      ctx.fillStyle = `rgba(${r},${g},${b},${0.06 + Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.arc(point.x + Math.cos(a) * rad, point.y + Math.sin(a) * rad, dot, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSpray(ctx, point, graffiti = false) {
    const size = state.brush.size;
    const softness = state.brush.softness;
    const density = Math.round(((graffiti ? 28 : 18) + size * (0.7 + softness)) * (0.35 + state.spray.density));
    const radius = size * (0.65 + softness * 1.5);
    const palette = state.spray.colors && state.spray.colors.length ? state.spray.colors : [state.color];
    ctx.globalCompositeOperation = state.brush.blend;
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.72) * radius;
      const x = point.x + Math.cos(angle) * dist;
      const y = point.y + Math.sin(angle) * dist;
      const chosen = palette[Math.floor(Math.random() * palette.length)];
      const [r, g, b] = parseHex(chosen);
      const alpha = state.brush.opacity * (graffiti ? 0.16 : 0.10) * (1 - dist / (radius + 1));
      ctx.fillStyle = `rgba(${r},${g},${b},${clamp(alpha, 0.015, 0.7)})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.7, Math.random() * size * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }
    if (graffiti && Math.random() < state.spray.drip) {
      const [r,g,b] = parseHex(palette[Math.floor(Math.random() * palette.length)] || state.color);
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.22 * state.brush.opacity})`;
      ctx.lineWidth = Math.max(1, size * 0.07);
      ctx.beginPath();
      ctx.moveTo(point.x + (Math.random() - .5) * size, point.y);
      ctx.lineTo(point.x + (Math.random() - .5) * size, point.y + Math.random() * size * 2.5);
      ctx.stroke();
    }
  }


  function drawMirrorIfNeeded(drawFn) {
    drawFn(false);
    if (state.mirror) drawFn(true);
  }

  function mirrorPoint(point) {
    return { x: state.width - point.x, y: point.y };
  }

  function pointerDown(ev) {
    if (ev.button !== undefined && ev.button !== 0 && ev.pointerType !== 'touch') return;
    ev.preventDefault();
    els.viewport.setPointerCapture?.(ev.pointerId);
    const p = clientToCanvas(ev.clientX, ev.clientY);
    state.pointer = { id: ev.pointerId, start: p, clientStart: { x: ev.clientX, y: ev.clientY }, panStart: { ...state.pan }, moved: false, spacePan: ev.altKey || ev.shiftKey || state.activeTool === 'pan' };
    state.lastPoint = p;
    state.points = [p];
    if (state.pointer.spacePan) { els.viewport.style.cursor = 'grabbing'; return; }
    if (state.activeTool === 'zoomBox') { drawZoomBoxPreview(state.pointer.start, p); return; }

    const layer = getActiveLayer();
    if (!layer) return;
    if (['pencil','ink','paint','marker','crayon','charcoal','calligraphy','neon','spray','graffiti','pixel','eraser','repair','mapTexture'].includes(state.activeTool)) {
      pushHistory(state.activeTool);
      drawMirrorIfNeeded((mirrored) => {
        const point = mirrored ? mirrorPoint(p) : p;
        if (state.activeTool === 'spray' || state.activeTool === 'graffiti') drawSpray(layer.ctx, point, state.activeTool === 'graffiti');
        else if (state.activeTool === 'mapTexture') paintMapTexture(layer.ctx, point, { x: point.x + 0.1, y: point.y + 0.1 });
        else drawLine(layer.ctx, point, { x: point.x + 0.1, y: point.y + 0.1 }, state.activeTool);
      });
      renderLayersSoon();
    } else if (state.activeTool === 'fill') {
      pushHistory('fill');
      floodFill(layer.ctx, Math.round(p.x), Math.round(p.y), state.color, Number(inputs.tolerance.value) / 100, false);
      if (state.mirror) floodFill(layer.ctx, Math.round(state.width - p.x), Math.round(p.y), state.color, Number(inputs.tolerance.value) / 100, false);
      renderLayers();
    } else if (state.activeTool === 'eyedropper') {
      pickColorAt(p);
    } else if (state.activeTool === 'text') {
      pushHistory('text object');
      addTextObject(p);
    }
  }

  function pointerMove(ev) {
    updateCursorPosition(ev);
    if (!state.pointer || state.pointer.id !== ev.pointerId) return;
    ev.preventDefault();
    const p = clientToCanvas(ev.clientX, ev.clientY);
    state.pointer.moved = true;
    if (state.pointer.spacePan) {
      state.pan.x = state.pointer.panStart.x + (ev.clientX - state.pointer.clientStart.x);
      state.pan.y = state.pointer.panStart.y + (ev.clientY - state.pointer.clientStart.y);
      applyView();
      return;
    }
    const layer = getActiveLayer();
    if (!layer) return;
    if (['pencil','ink','paint','marker','crayon','charcoal','calligraphy','neon','pixel','eraser','repair','mapTexture'].includes(state.activeTool)) {
      const last = state.lastPoint || p;
      drawMirrorIfNeeded((mirrored) => {
        const from = mirrored ? mirrorPoint(last) : last;
        const to = mirrored ? mirrorPoint(p) : p;
        if (state.activeTool === 'mapTexture') paintMapTexture(layer.ctx, from, to);
        else drawLine(layer.ctx, from, to, state.activeTool);
      });
      state.lastPoint = p;
      renderLayersSoon();
    } else if (state.activeTool === 'spray' || state.activeTool === 'graffiti') {
      drawMirrorIfNeeded((mirrored) => drawSpray(layer.ctx, mirrored ? mirrorPoint(p) : p, state.activeTool === 'graffiti'));
      renderLayersSoon();
    } else if (state.activeTool === 'shape') {
      drawShapePreview(state.pointer.start, p);
    } else if (state.activeTool === 'zoomBox') {
      drawZoomBoxPreview(state.pointer.start, p);
    }
    state.points.push(p);
  }

  function pointerUp(ev) {
    if (!state.pointer || state.pointer.id !== ev.pointerId) return;
    ev.preventDefault();
    const end = clientToCanvas(ev.clientX, ev.clientY);
    const layer = getActiveLayer();
    if (state.pointer.spacePan) {
      els.viewport.style.cursor = state.activeTool === 'pan' ? 'grab' : 'crosshair';
    } else if (state.activeTool === 'zoomBox') {
      clearPreview();
      zoomToBox(state.pointer.start, end);
    } else if (state.activeTool === 'shape' && layer) {
      pushHistory('shape');
      clearPreview();
      if (state.objectMode) { addShapeObjectFromPoints(state.pointer.start, end); }
      else { drawMirrorIfNeeded((mirrored) => drawShape(layer.ctx, mirrored ? mirrorPoint(state.pointer.start) : state.pointer.start, mirrored ? mirrorPoint(end) : end, mirrored)); renderLayers(); }
    }
    state.pointer = null;
    state.lastPoint = null;
    state.points = [];
  }


  function drawZoomBoxPreview(start, end) {
    clearPreview();
    const ctx = els.preview.getContext('2d');
    const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x), h = Math.abs(end.y - start.y);
    ctx.save();
    ctx.strokeStyle = '#00FFFF';
    ctx.fillStyle = 'rgba(0,255,255,0.08)';
    ctx.lineWidth = Math.max(1, 2 / state.zoom);
    ctx.setLineDash([10 / state.zoom, 6 / state.zoom]);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  function zoomToBox(start, end) {
    const rect = els.viewport.getBoundingClientRect();
    const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x), h = Math.abs(end.y - start.y);
    if (w < 8 || h < 8) { fitCanvas(); return; }
    const z = clamp(Math.min((rect.width - 36) / w, (rect.height - 36) / h), 0.05, 8);
    state.zoom = z;
    state.pan.x = (rect.width - w * z) / 2 - x * z;
    state.pan.y = (rect.height - h * z) / 2 - y * z;
    inputs.zoom.value = String(Math.round(state.zoom * 100));
    applyView();
    status(`Zoomed to ${Math.round(w)}×${Math.round(h)} selection.`);
  }

  function clearPreview() {
    els.preview.getContext('2d').clearRect(0, 0, state.width, state.height);
  }

  function drawShapePreview(start, end) {
    const ctx = els.preview.getContext('2d');
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.save();
    ctx.setLineDash([10, 8]);
    drawShape(ctx, start, end, false, true);
    ctx.restore();
  }

  function rotatedRectData(start, end) {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  }

  function drawShape(ctx, start, end, mirrored = false, preview = false) {
    const type = state.shape.type;
    const mode = state.shape.fill;
    const { x, y, w, h, cx, cy } = rotatedRectData(start, end);
    const color = state.color;
    configureCtx(ctx, { opacity: preview ? Math.min(.7, state.brush.opacity) : state.brush.opacity });
    ctx.lineWidth = Math.max(1, state.brush.size * 0.12);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(degToRad(state.shape.rotation * (mirrored ? -1 : 1)));
    ctx.translate(-cx, -cy);
    ctx.beginPath();
    if (type === 'rect') ctx.rect(x, y, w, h);
    else if (type === 'roundrect') roundRectPath(ctx, x, y, w, h, Math.min(w, h) * .12);
    else if (type === 'circle') ellipsePath(ctx, cx, cy, w / 2, h / 2);
    else if (type === 'line') { ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); }
    else if (type === 'triangle') polygonPath(ctx, [[cx, y], [x + w, y + h], [x, y + h]]);
    else if (type === 'diamond') polygonPath(ctx, [[cx, y], [x + w, cy], [cx, y + h], [x, cy]]);
    else if (type === 'star') starPath(ctx, cx, cy, Math.max(w, h) / 2, Math.max(w, h) / 4, Math.max(3, state.shape.sides || 5));
    else if (type === 'polygon') starPath(ctx, cx, cy, Math.max(w, h) / 2, Math.max(w, h) / 2, Math.max(3, state.shape.sides || 6));
    else if (type === 'cloud') cloudPath(ctx, x, y, w, h);
    else if (type === 'burst') burstPath(ctx, cx, cy, Math.max(w, h) / 2, 14);
    else if (type === 'moon') moonPath(ctx, cx, cy, w / 2, h / 2);
    else if (type === 'plant') plantPath(ctx, x, y, w, h);
    else if (type === 'cube') cubePath(ctx, x, y, w, h);
    if (mode === 'fill' || mode === 'fillStroke') ctx.fill();
    if (mode === 'stroke' || mode === 'fillStroke' || type === 'line' || type === 'cube' || type === 'plant') ctx.stroke();
    ctx.restore();
    if (!preview) maybeAddAnnotation(x, y, w, h);
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  }
  function ellipsePath(ctx, cx, cy, rx, ry) { ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2); }
  function polygonPath(ctx, points) { ctx.moveTo(points[0][0], points[0][1]); for (const p of points.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); }
  function starPath(ctx, cx, cy, outer, inner, points) {
    const step = Math.PI / points;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = -Math.PI / 2 + i * step;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function cloudPath(ctx, x, y, w, h) {
    const bumps = 8;
    ctx.moveTo(x + w * .14, y + h * .58);
    for (let i = 0; i <= bumps; i++) {
      const t = i / bumps;
      const px = x + t * w;
      const py = y + h * (.5 + Math.sin(t * Math.PI * 4) * .12);
      ctx.quadraticCurveTo(px - w / bumps / 2, y + h * (.18 + Math.random() * .12), px, py);
    }
    ctx.quadraticCurveTo(x + w * .9, y + h * .9, x + w * .2, y + h * .82);
    ctx.quadraticCurveTo(x, y + h * .74, x + w * .14, y + h * .58);
  }
  function burstPath(ctx, cx, cy, radius, points) {
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius : radius * 0.58;
      const a = -Math.PI / 2 + i * Math.PI / points;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function moonPath(ctx, cx, cy, rx, ry) {
    ctx.moveTo(cx + rx * .45, cy - ry);
    ctx.bezierCurveTo(cx - rx, cy - ry, cx - rx, cy + ry, cx + rx * .45, cy + ry);
    ctx.bezierCurveTo(cx - rx * .25, cy + ry * .35, cx - rx * .25, cy - ry * .35, cx + rx * .45, cy - ry);
  }
  function plantPath(ctx, x, y, w, h) {
    const cx = x + w / 2;
    ctx.moveTo(cx, y + h); ctx.bezierCurveTo(cx - w * .08, y + h * .65, cx + w * .08, y + h * .35, cx, y);
    ctx.moveTo(cx, y + h * .55); ctx.bezierCurveTo(cx - w * .55, y + h * .35, cx - w * .3, y + h * .15, cx, y + h * .42);
    ctx.moveTo(cx, y + h * .45); ctx.bezierCurveTo(cx + w * .55, y + h * .25, cx + w * .32, y + h * .05, cx, y + h * .35);
    ctx.moveTo(cx, y + h * .72); ctx.bezierCurveTo(cx + w * .45, y + h * .62, cx + w * .42, y + h * .42, cx, y + h * .62);
  }
  function cubePath(ctx, x, y, w, h) {
    const d = Math.min(w, h) * .22;
    ctx.rect(x, y + d, w - d, h - d);
    ctx.moveTo(x, y + d); ctx.lineTo(x + d, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - d, y + d);
    ctx.moveTo(x + w - d, y + h); ctx.lineTo(x + w, y + h - d); ctx.lineTo(x + w, y);
  }

  function maybeAddAnnotation(x, y, w, h) {
    const link = inputs.link.value.trim();
    if (!link || w < 4 || h < 4) return;
    state.annotations.push({ id: uid('hotspot'), x, y, w, h, href: link, label: inputs.text.value || 'Link' });
    renderHotspots();
  }

  function drawText(ctx, point) {
    const text = inputs.text.value || 'Your text';
    configureCtx(ctx);
    ctx.font = `${Math.max(12, state.brush.size * 2.4)}px ${inputs.font.value}`;
    ctx.textBaseline = 'top';
    ctx.lineWidth = Math.max(2, state.brush.size * 0.16);
    ctx.strokeStyle = '#001E24';
    ctx.strokeText(text, point.x, point.y);
    ctx.fillStyle = state.color;
    ctx.fillText(text, point.x, point.y);
    const metrics = ctx.measureText(text);
    maybeAddAnnotation(point.x, point.y, metrics.width, state.brush.size * 2.6);
  }

  function pickColorAt(point) {
    const sample = makeCompositeCanvas();
    const ctx = sample.getContext('2d', { willReadFrequently: true });
    const data = ctx.getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data;
    const picked = rgbToHex(data[0], data[1], data[2]);
    state.pickedColor = picked;
    state.transparentColor = picked;
    state.transparentSeed = { x: Math.round(point.x), y: Math.round(point.y) };
    setColor(picked);
    updateTransparencyPreview();
    status(`Picked ${picked}; transparency seed stored at ${state.transparentSeed.x}, ${state.transparentSeed.y}.`);
  }

  function floodFill(ctx, x, y, fillColor, tolerance, erase) {
    if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;
    const img = ctx.getImageData(0, 0, state.width, state.height);
    const data = img.data;
    const idx = (y * state.width + x) * 4;
    const target = [data[idx], data[idx+1], data[idx+2], data[idx+3]];
    const fill = parseHex(fillColor);
    fill[3] = Math.round(state.brush.opacity * 255);
    const gradA = parseHex(state.gradient.a || fillColor);
    const gradB = parseHex(state.gradient.b || fillColor);
    const gradAngle = degToRad(state.gradient.angle || 0);
    const gx = Math.cos(gradAngle);
    const gy = Math.sin(gradAngle);
    const span = Math.max(1, Math.abs(state.width * gx) + Math.abs(state.height * gy));
    const maxDiff = tolerance * 442;
    const stack = [[x, y]];
    const seen = new Uint8Array(state.width * state.height);
    let count = 0;
    while (stack.length && count < state.width * state.height) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= state.width || cy >= state.height) continue;
      const pos = cy * state.width + cx;
      if (seen[pos]) continue;
      seen[pos] = 1;
      const i = pos * 4;
      const diff = Math.hypot(data[i] - target[0], data[i+1] - target[1], data[i+2] - target[2], data[i+3] - target[3]);
      if (diff > maxDiff) continue;
      if (erase) data[i+3] = 0;
      else {
        if (state.gradient.enabled) {
          const t = clamp(((cx - state.width / 2) * gx + (cy - state.height / 2) * gy) / span + 0.5, 0, 1);
          data[i] = Math.round(gradA[0] + (gradB[0] - gradA[0]) * t);
          data[i+1] = Math.round(gradA[1] + (gradB[1] - gradA[1]) * t);
          data[i+2] = Math.round(gradA[2] + (gradB[2] - gradA[2]) * t);
          data[i+3] = fill[3];
        } else { data[i] = fill[0]; data[i+1] = fill[1]; data[i+2] = fill[2]; data[i+3] = fill[3]; }
      }
      count++;
      stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
    }
    ctx.putImageData(img, 0, 0);
    status(erase ? `Removed connected color area (${count} px).` : `Filled connected area (${count} px).`);
  }


  function hydrateRepairSourceCanvas(dataUrl) {
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      const canvas = createCanvas(state.width, state.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, state.width, state.height);
      state.repairSourceCanvas = canvas;
    };
    img.src = dataUrl;
  }

  function refreshRepairSource() {
    const composite = makeCompositeCanvas(false);
    state.repairSourceCanvas = composite;
    state.repairSourceDataUrl = composite.toDataURL('image/png');
    status('Repair source refreshed from current visible artwork.');
  }

  function colorDistance(data, i, target) {
    return Math.hypot(data[i] - target[0], data[i+1] - target[1], data[i+2] - target[2], data[i+3] - (target[3] ?? 255));
  }

  function connectedMaskFromLayer(layer, seed, target, maxDiff) {
    const image = layer.ctx.getImageData(0, 0, state.width, state.height);
    const sx = clamp(Math.round(seed?.x ?? 0), 0, state.width - 1);
    const sy = clamp(Math.round(seed?.y ?? 0), 0, state.height - 1);
    const mask = new Uint8Array(state.width * state.height);
    const start = (sy * state.width + sx) * 4;
    if (image.data[start + 3] === 0 || colorDistance(image.data, start, target) > maxDiff) return { mask, image };
    const stack = [sy * state.width + sx];
    mask[sy * state.width + sx] = 1;
    while (stack.length) {
      const idx = stack.pop();
      const x = idx % state.width;
      const y = Math.floor(idx / state.width);
      const neigh = [];
      if (x > 0) neigh.push(idx - 1);
      if (x < state.width - 1) neigh.push(idx + 1);
      if (y > 0) neigh.push(idx - state.width);
      if (y < state.height - 1) neigh.push(idx + state.width);
      for (const ni of neigh) {
        if (mask[ni]) continue;
        const di = ni * 4;
        if (image.data[di + 3] > 0 && colorDistance(image.data, di, target) <= maxDiff) {
          mask[ni] = 1;
          stack.push(ni);
        }
      }
    }
    return { mask, image };
  }

  function updateTransparencyPreview() {
    if (!inputs.previewTransparency?.checked || !state.transparentColor || !state.transparentSeed) return;
    const layer = getActiveLayer();
    if (!layer) return;
    clearPreview();
    const target = parseHex(state.transparentColor);
    const tol = Number(inputs.tolerance?.value || 18) / 100;
    const maxDiff = Math.max(1, 442 * tol);
    const { mask, image } = connectedMaskFromLayer(layer, state.transparentSeed, target, maxDiff);
    const ctx = els.preview.getContext('2d');
    const out = ctx.createImageData(state.width, state.height);
    let hits = 0;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const di = i * 4;
      const dist = colorDistance(image.data, di, target);
      const hit = 1 - dist / maxDiff;
      out.data[di] = 255; out.data[di+1] = 205; out.data[di+2] = 110; out.data[di+3] = Math.round(45 + hit * 145);
      hits++;
    }
    ctx.putImageData(out, 0, 0);
    status(`Previewing ${hits.toLocaleString()} connected pixels for transparency.`);
  }

  function applyConnectedTransparency() {
    const layer = getActiveLayer();
    if (!layer || !state.transparentColor || !state.transparentSeed) { status('Use Pick on the color/area first.'); return; }
    pushHistory('bounded transparency');
    if (!state.repairSourceCanvas) refreshRepairSource();
    const target = parseHex(state.transparentColor);
    const tol = Number(inputs.tolerance?.value || 18) / 100;
    const maxDiff = Math.max(1, 442 * tol);
    const softness = Number(inputs.edgeSoftness?.value || 8);
    const strength = Number(inputs.removeStrength?.value || 100) / 100;
    const { mask, image } = connectedMaskFromLayer(layer, state.transparentSeed, target, maxDiff);
    let changed = 0;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const di = i * 4;
      const edge = clamp(colorDistance(image.data, di, target) / maxDiff, 0, 1);
      const softened = softness > 0 ? Math.pow(edge, 1 + softness / 8) : edge;
      const removal = strength * (1 - softened);
      image.data[di + 3] = Math.round(image.data[di + 3] * (1 - removal));
      changed++;
    }
    layer.ctx.putImageData(image, 0, 0);
    clearPreview();
    renderLayers();
    status(`Bounded transparency applied to ${changed.toLocaleString()} connected pixels.`);
  }

  function trimTransparentEdges() {
    const composite = makeCompositeCanvas(false);
    const image = composite.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, state.width, state.height);
    let minX = state.width, minY = state.height, maxX = -1, maxY = -1;
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        if (image.data[(y * state.width + x) * 4 + 3] > 4) {
          if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) { status('Nothing visible to trim.'); return; }
    pushHistory('trim transparent edges');
    const nw = maxX - minX + 1, nh = maxY - minY + 1;
    for (const layer of state.layers) {
      const old = layer.canvas;
      const replacement = createCanvas(nw, nh, 'art-layer');
      replacement.getContext('2d').drawImage(old, minX, minY, nw, nh, 0, 0, nw, nh);
      old.replaceWith(replacement);
      layer.canvas = replacement;
      layer.ctx = replacement.getContext('2d', { willReadFrequently: true });
    }
    state.objects.forEach((o) => { o.x -= minX; o.y -= minY; });
    state.annotations.forEach((a) => { a.x -= minX; a.y -= minY; });
    state.lighting.lights.forEach((a) => { a.x -= minX; a.y -= minY; });
    state.sounds.forEach((a) => { a.x -= minX; a.y -= minY; });
    state.width = nw; state.height = nh;
    updateStageSize(); fitCanvas(); renderLayers(); renderObjects();
    status(`Trimmed empty transparent edges to ${nw}×${nh}.`);
  }

  function newTransparentProject() {
    pushHistory('new transparent canvas');
    state.layers.forEach((l) => l.canvas.remove());
    state.layers = []; state.objects = []; state.annotations = []; state.frames = [];
    stopAllSounds(); state.sounds = []; state.activeSoundId = null; state.lighting.lights = []; state.activeLightId = null; state.customAssets = [];
    state.map = { textureId: MAP_ENGINE?.presets?.[0]?.id || 'dirt0', brushSize: 140, textureScale: 1, textureOpacity: 1, textureAngle: 0, grid: { enabled: true, preset: 'seamless-1', style: 'square', cellSize: 48, opacity: .38, color: '#00FFFF', export: true }, snap: true };
    state.background = { mode: 'transparent', color: '#FFFFFF' };
    addLayer('Sketch Layer'); addLayer('Effects Layer'); state.activeLayerId = state.layers[1].id;
    syncExtraInputsFromState(); syncMapInputsFromState(); updateStageSize(); fitCanvas(); renderLayers(); renderObjects(); renderCustomAssetGrid();
    refreshRepairSource();
    state.project.dirty = true; updateProjectHeading(); status('New transparent canvas created.');
  }

  async function loadBrowserProject() {
    const loaded = await restoreFromBrowser();
    status(loaded ? 'Browser save loaded.' : 'No browser save found.');
  }

  function clearBrowserProject() {
    safeStorageRemove(STORAGE_KEY);
    status('Browser save cleared.');
  }

  function removePickedColor() {
    const layer = getActiveLayer();
    if (!layer) return;
    pushHistory('remove picked color');
    state.beforeTransparentSnapshot = layer.canvas.toDataURL('image/png');
    const tol = Number(inputs.tolerance.value) / 100;
    const [pr, pg, pb] = parseHex(state.pickedColor || state.color);
    const img = layer.ctx.getImageData(0, 0, state.width, state.height);
    const d = img.data;
    const max = 442 * tol;
    let removed = 0;
    for (let i = 0; i < d.length; i += 4) {
      const diff = Math.hypot(d[i] - pr, d[i+1] - pg, d[i+2] - pb);
      if (diff <= max) { d[i+3] = 0; removed++; }
    }
    layer.ctx.putImageData(img, 0, 0);
    renderLayers();
    status(`Removed ${removed.toLocaleString()} pixels near ${state.pickedColor || state.color}.`);
  }

  function applyKernel(kernel, divisor, bias = 0) {
    const layer = getActiveLayer();
    if (!layer) return;
    pushHistory('filter');
    const src = layer.ctx.getImageData(0, 0, state.width, state.height);
    const out = layer.ctx.createImageData(state.width, state.height);
    const side = Math.sqrt(kernel.length);
    const half = Math.floor(side / 2);
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const dstOff = (y * state.width + x) * 4;
        let r=0,g=0,b=0,a=0;
        for (let ky = 0; ky < side; ky++) {
          for (let kx = 0; kx < side; kx++) {
            const px = clamp(x + kx - half, 0, state.width - 1);
            const py = clamp(y + ky - half, 0, state.height - 1);
            const srcOff = (py * state.width + px) * 4;
            const wt = kernel[ky * side + kx];
            r += src.data[srcOff] * wt; g += src.data[srcOff+1] * wt; b += src.data[srcOff+2] * wt; a += src.data[srcOff+3] * wt;
          }
        }
        out.data[dstOff] = clamp(r / divisor + bias, 0, 255);
        out.data[dstOff+1] = clamp(g / divisor + bias, 0, 255);
        out.data[dstOff+2] = clamp(b / divisor + bias, 0, 255);
        out.data[dstOff+3] = clamp(a / divisor, 0, 255);
      }
    }
    layer.ctx.putImageData(out, 0, 0);
    renderLayers();
  }

  function makeCompositeCanvas(includeBackground = true, includeMapEffects = includeBackground) {
    const out = createCanvas(state.width, state.height);
    const ctx = out.getContext('2d');
    if (includeBackground) drawCanvasBackground(ctx, state.width, state.height);
    for (const layer of state.layers) {
      if (!layer.visible) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blend || 'source-over';
      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    }
    if (includeMapEffects && state.map.grid.export && els.mapGridCanvas) ctx.drawImage(els.mapGridCanvas, 0, 0);
    if (els.objectCanvas) ctx.drawImage(els.objectCanvas, 0, 0);
    if (includeMapEffects && els.lightingCanvas) ctx.drawImage(els.lightingCanvas, 0, 0);
    return out;
  }

  async function exportPNG() {
    const canvas = makeCompositeCanvas(true);
    const blob = await canvasToBlob(canvas, 'image/png');
    download(`effects-studio-${Date.now()}.png`, blob);
  }

  function exportSVG() {
    const png = makeCompositeCanvas(true).toDataURL('image/png');
    const linkObjects = state.objects.filter((o) => o.href).map((o) => ({ x:o.x, y:o.y, w:o.w, h:o.h, href:o.href, label:o.name || o.href }));
    const hotspots = [...state.annotations, ...linkObjects].map((a) => `<a href="${escapeXml(a.href)}" target="_blank"><rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" fill="transparent" stroke="#00FFFF" stroke-dasharray="8 6"><title>${escapeXml(a.label || a.href)}</title></rect></a>`).join('\n');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${state.width}" height="${state.height}" viewBox="0 0 ${state.width} ${state.height}">\n<image href="${png}" width="${state.width}" height="${state.height}"/>\n${hotspots}\n</svg>`;
    download(`effects-studio-${Date.now()}.svg`, svg, 'image/svg+xml');
  }

  function escapeXml(str) {
    return String(str).replace(/[<>&"']/g, (ch) => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' }[ch]));
  }

  function exportJSON() {
    download(`effects-studio-project-${Date.now()}.json`, JSON.stringify(serializeProject(), null, 2), 'application/json');
  }

  function exportHTML() {
    const image = makeCompositeCanvas(true).toDataURL('image/png');
    const linkObjects = state.objects.filter((o) => o.href).map((o) => ({ x:o.x, y:o.y, w:o.w, h:o.h, href:o.href, label:o.name || o.href }));
    const links = [...state.annotations, ...linkObjects].map((a) => `<a class="hotspot" href="${escapeXml(a.href)}" target="_blank" title="${escapeXml(a.label || a.href)}" style="left:${(a.x/state.width)*100}%;top:${(a.y/state.height)*100}%;width:${(a.w/state.width)*100}%;height:${(a.h/state.height)*100}%"></a>`).join('\n');
    const soundData = state.sounds.filter((sound) => sound.enabled !== false && sound.src).map((sound) => ({ id:sound.id, name:sound.name, x:sound.x/state.width*100, y:sound.y/state.height*100, radius:sound.radius/Math.max(state.width,state.height)*100, volume:sound.volume, loop:sound.loop, spatial:sound.spatial, trigger:sound.trigger, src:sound.src }));
    const soundMarkup = soundData.map((sound) => `<button class="sound-zone" data-sound="${escapeXml(sound.id)}" title="${escapeXml(sound.name)}" style="left:${sound.x}%;top:${sound.y}%;width:${Math.max(4,sound.radius*2)}%;aspect-ratio:1">♪</button>`).join('\n');
    const soundJson = JSON.stringify(soundData).replace(/</g, '\\u003c');
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Effects Studio Map Export</title><style>body{margin:0;background:#000305;display:grid;min-height:100dvh;place-items:center;font-family:system-ui;color:#e8ffff}.art{position:relative;width:min(100vw,${state.width}px)}img{width:100%;display:block}.hotspot{position:absolute;border:2px dashed #00ffff;background:rgba(0,255,255,.08)}.sound-zone{position:absolute;translate:-50% -50%;border:2px dashed #99ffff;border-radius:50%;background:rgba(0,60,66,.25);color:#fff;cursor:pointer;min-width:34px;min-height:34px}.sound-zone:hover,.sound-zone.playing{box-shadow:0 0 20px #00ffff;background:rgba(0,255,255,.2)}</style></head><body><main class="art"><img src="${image}" alt="Effects Studio map export">${links}${soundMarkup}</main><script>const sounds=${soundJson};const players=new Map();function playSound(s,b){let a=players.get(s.id);if(!a){a=new Audio(s.src);players.set(s.id,a)}a.volume=Math.max(0,Math.min(1,s.volume??.7));a.loop=!!s.loop;a.currentTime=0;a.play().catch(()=>{});b?.classList.add('playing');a.onended=()=>b?.classList.remove('playing')}document.querySelectorAll('[data-sound]').forEach(b=>{const s=sounds.find(x=>x.id===b.dataset.sound);if(!s)return;if(s.trigger==='enter')b.addEventListener('pointerenter',()=>playSound(s,b));else b.addEventListener('click',()=>playSound(s,b))});sounds.filter(s=>s.trigger==='ambient').forEach(s=>{const b=document.querySelector('[data-sound="'+s.id+'"]');b?.setAttribute('title','Play ambient: '+s.name)});</script></body></html>`;
    download(`effects-studio-map-${Date.now()}.html`, html, 'text/html');
  }

  function renderHotspots() {
    els.hotspotLayer.innerHTML = '';
    const rect = els.viewport.getBoundingClientRect();
    for (const a of state.annotations) {
      const link = document.createElement('a');
      link.href = a.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.title = a.label || a.href;
      link.style.left = `${state.pan.x + a.x * state.zoom}px`;
      link.style.top = `${state.pan.y + a.y * state.zoom}px`;
      link.style.width = `${a.w * state.zoom}px`;
      link.style.height = `${a.h * state.zoom}px`;
      els.hotspotLayer.appendChild(link);
    }
  }

  function captureFrame() {
    const dataUrl = makeCompositeCanvas(true).toDataURL('image/png');
    state.frames.push({ id: uid('frame'), dataUrl, delay: Math.round(1000 / Number(inputs.fps.value)), note: `Frame ${state.frames.length + 1}` });
    renderFrames();
    status(`Captured frame ${state.frames.length}.`);
  }

  function renderFrames() {
    els.framesList.innerHTML = '';
    state.frames.forEach((frame, index) => {
      const row = document.createElement('div');
      row.className = 'frame-item';
      const img = document.createElement('img');
      img.className = 'frame-thumb';
      img.src = frame.dataUrl;
      img.alt = '';
      const label = document.createElement('span');
      label.textContent = `${index + 1}. ${frame.note || 'Frame'}`;
      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = 'Delete';
      del.addEventListener('click', () => { state.frames.splice(index, 1); renderFrames(); });
      row.append(img, label, del);
      els.framesList.appendChild(row);
    });
    updateAnimationPreview(state.frames[0]?.dataUrl);
  }

  function updateAnimationPreview(dataUrl) {
    const canvas = els.animationPreview;
    const ctx = canvas.getContext('2d');
    drawPreviewBackground(ctx, canvas.width, canvas.height);
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      drawPreviewBackground(ctx, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    };
    img.src = dataUrl;
  }

  function playAnimation() {
    if (!state.frames.length) { status('Capture frames first.'); return; }
    stopAnimation();
    const frameMs = Math.round(1000 / Number(inputs.fps.value));
    state.animationIndex = 0;
    state.animationTimer = setInterval(() => {
      const frame = state.frames[state.animationIndex % state.frames.length];
      updateAnimationPreview(frame.dataUrl);
      if (inputs.onion.checked && state.frames.length > 1) drawOnionSkin();
      state.animationIndex++;
    }, frameMs);
    status('Animation playing.');
  }

  function stopAnimation() {
    if (state.animationTimer) clearInterval(state.animationTimer);
    state.animationTimer = null;
    status('Animation stopped.');
  }

  function drawOnionSkin() {
    const frame = state.frames[(state.animationIndex - 1 + state.frames.length) % state.frames.length];
    if (!frame) return;
    const ctx = els.preview.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.save(); ctx.globalAlpha = 0.2; ctx.drawImage(img, 0, 0, state.width, state.height); ctx.restore();
      setTimeout(clearPreview, 260);
    };
    img.src = frame.dataUrl;
  }

  function renderLayersSoon() {
    clearTimeout(renderLayersSoon.timer);
    renderLayersSoon.timer = setTimeout(renderLayers, 160);
  }

  function drawColorDisc() {
    const canvas = els.colorDisc;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const image = ctx.createImageData(w, h);
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const idx = (y*w+x)*4;
        if (dist <= radius) {
          const hue = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
          const sat = dist / radius;
          const [r,g,b] = hslToRgb(hue / 360, sat, 0.5);
          image.data[idx] = r; image.data[idx+1] = g; image.data[idx+2] = b; image.data[idx+3] = 255;
        } else {
          image.data[idx+3] = 0;
        }
      }
    }
    ctx.putImageData(image, 0, 0);
    ctx.beginPath(); ctx.arc(cx, cy, radius - 30, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.36)'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  }

  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) r = g = b = l;
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function pickFromDisc(ev) {
    const rect = els.colorDisc.getBoundingClientRect();
    const x = Math.round((ev.clientX - rect.left) * (els.colorDisc.width / rect.width));
    const y = Math.round((ev.clientY - rect.top) * (els.colorDisc.height / rect.height));
    const data = els.colorDisc.getContext('2d').getImageData(x, y, 1, 1).data;
    if (data[3]) setColor(rgbToHex(data[0], data[1], data[2]));
  }

  function renderSwatches() {
    els.swatches.innerHTML = '';
    for (const color of PALETTE) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.title = color;
      b.style.background = color;
      b.addEventListener('click', () => setColor(color));
      els.swatches.appendChild(b);
    }
  }

  function updateBrushCursor() {
    const c = els.brushCursor;
    const sourceSize = state.activeTool === 'mapTexture' ? state.map.brushSize : state.brush.size;
    const diameter = clamp(sourceSize * state.zoom, 6, 420);
    c.style.width = `${diameter}px`;
    c.style.height = `${diameter}px`;
    c.style.background = colorWithAlpha(state.color, state.activeTool === 'eraser' ? 0.05 : 0.24);
    c.style.borderColor = state.activeTool === 'eraser' ? '#FFFFFF' : state.color;
  }

  function colorWithAlpha(color, alpha) {
    const [r,g,b] = parseHex(color);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function applyCanvasBackground() {
    if (!els.stage) return;
    const mode = ['transparent','white','color'].includes(state.background?.mode) ? state.background.mode : 'transparent';
    const color = rgbToHex(...parseHex(state.background?.color || '#FFFFFF'));
    state.background = { mode, color };
    els.stage.dataset.backgroundMode = mode;
    els.stage.style.setProperty('--canvas-bg-color', color);
    if (inputs.backgroundMode) inputs.backgroundMode.value = mode;
    if (inputs.backgroundColor) inputs.backgroundColor.value = color;
  }

  function drawCanvasBackground(ctx, width, height) {
    const mode = state.background?.mode || 'transparent';
    if (mode === 'transparent') return;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = mode === 'color' ? (state.background.color || '#FFFFFF') : '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function drawPreviewBackground(ctx, width, height) {
    ctx.save();
    if ((state.background?.mode || 'transparent') === 'transparent') {
      const tile = 16;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#D8EEEE';
      for (let y = 0; y < height; y += tile) {
        for (let x = 0; x < width; x += tile) {
          if (((x / tile) + (y / tile)) % 2 === 0) ctx.fillRect(x, y, tile, tile);
        }
      }
    } else {
      ctx.fillStyle = state.background.mode === 'color' ? state.background.color : '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  function updateCursorPosition(ev) {
    els.brushCursor.classList.add('visible');
    els.brushCursor.style.left = `${ev.clientX}px`;
    els.brushCursor.style.top = `${ev.clientY}px`;
  }


  function updateProjectHeading() {
    const heading = $('currentProjectName');
    if (heading) heading.textContent = `${state.project.name || 'Untitled Project'}${state.project.dirty ? ' •' : ''}`;
    document.title = `${state.project.name || 'Untitled Project'} — Effects Studio`;
  }

  function openProjectDatabase() {
    if (state.projectDb) return Promise.resolve(state.projectDb);
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB is unavailable.'));
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(PROJECT_DB_NAME, PROJECT_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PROJECT_STORE)) {
          const store = db.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
          store.createIndex('name', 'name');
        }
      };
      request.onsuccess = () => { state.projectDb = request.result; resolve(request.result); };
      request.onerror = () => reject(request.error || new Error('Project database failed to open.'));
    });
  }

  async function projectStoreRequest(mode, executor) {
    const db = await openProjectDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECT_STORE, mode);
      const store = tx.objectStore(PROJECT_STORE);
      let request;
      try { request = executor(store); } catch (err) { reject(err); return; }
      if (request) {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Project operation failed.'));
      } else {
        tx.oncomplete = () => resolve(true);
      }
      tx.onerror = () => reject(tx.error || new Error('Project transaction failed.'));
    });
  }

  function loadFallbackProjects() {
    if (fallbackProjectsLoaded) return;
    fallbackProjectsLoaded = true;
    try {
      const records = JSON.parse(safeStorageGet(PROJECT_FALLBACK_KEY) || '[]');
      if (Array.isArray(records)) records.forEach((record) => record?.id && fallbackProjects.set(record.id, record));
    } catch (err) { console.warn('Fallback project library could not be read:', err); }
  }

  function persistFallbackProjects() {
    try { if (!safeStorageSet(PROJECT_FALLBACK_KEY, JSON.stringify([...fallbackProjects.values()]))) throw new Error('Local storage is unavailable.'); }
    catch (err) { console.warn('Fallback project library is session-only:', err); }
  }

  async function getProjectRecord(id) {
    try { return await projectStoreRequest('readonly', (store) => store.get(id)); }
    catch (err) { loadFallbackProjects(); return fallbackProjects.get(id) || null; }
  }

  async function putProjectRecord(record) {
    try { return await projectStoreRequest('readwrite', (store) => store.put(record)); }
    catch (err) { loadFallbackProjects(); fallbackProjects.set(record.id, record); persistFallbackProjects(); return record.id; }
  }

  async function removeProjectRecord(id) {
    try { return await projectStoreRequest('readwrite', (store) => store.delete(id)); }
    catch (err) { loadFallbackProjects(); fallbackProjects.delete(id); persistFallbackProjects(); return true; }
  }

  async function getAllProjectRecords() {
    try { return await projectStoreRequest('readonly', (store) => store.getAll()); }
    catch (err) { loadFallbackProjects(); return [...fallbackProjects.values()]; }
  }

  function showEditor() {
    const home = $('projectHome');
    const app = $('app');
    if (home) { home.hidden = true; home.setAttribute('aria-hidden', 'true'); }
    if (app) { app.classList.add('editor-active'); app.setAttribute('aria-hidden', 'false'); }
    updateProjectHeading();
    requestAnimationFrame(() => { applyView(); renderObjects(); if (state.zoom <= .1 || !Number.isFinite(state.zoom)) fitCanvas(); });
  }

  async function showProjectHome() {
    if (state.project.id && state.project.dirty && $('autoSaveInput')?.checked) await saveCurrentProject(false, true);
    const home = $('projectHome');
    const app = $('app');
    if (home) { home.hidden = false; home.setAttribute('aria-hidden', 'false'); }
    if (app) { app.classList.remove('editor-active'); app.setAttribute('aria-hidden', 'true'); }
    const cont = $('homeContinueBtn');
    if (cont) cont.hidden = !state.project.id;
    await renderProjectLibrary();
  }

  function projectThumbnail() {
    try {
      const source = makeCompositeCanvas(true);
      const thumb = document.createElement('canvas');
      const maxW = 420, maxH = 260;
      const scale = Math.min(maxW / source.width, maxH / source.height, 1);
      thumb.width = Math.max(1, Math.round(source.width * scale));
      thumb.height = Math.max(1, Math.round(source.height * scale));
      const ctx = thumb.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, thumb.width, thumb.height);
      ctx.drawImage(source, 0, 0, thumb.width, thumb.height);
      return thumb.toDataURL('image/jpeg', .72);
    } catch (err) { console.warn('Thumbnail skipped:', err); return ''; }
  }

  function askProjectName(title, suggested) {
    const dialog = $('projectNameDialog');
    const input = $('projectNameInput');
    const heading = $('projectDialogTitle');
    if (!dialog || !input) return Promise.resolve(prompt(title, suggested) || '');
    heading.textContent = title;
    input.value = suggested || 'Untitled Project';
    return new Promise((resolve) => {
      const finish = () => {
        dialog.removeEventListener('close', finish);
        resolve(dialog.returnValue === 'confirm' ? input.value.trim() : '');
      };
      dialog.addEventListener('close', finish);
      dialog.showModal();
      requestAnimationFrame(() => { input.focus(); input.select(); });
    });
  }

  async function saveCurrentProject(saveAs = false, silent = false) {
    let id = state.project.id;
    let name = state.project.name || 'Untitled Project';
    if (!id || saveAs) {
      const proposed = saveAs ? `${name} Copy` : name;
      const chosen = await askProjectName(saveAs ? 'Save project copy' : 'Name this project', proposed);
      if (!chosen) return false;
      name = chosen.slice(0, 80);
      id = uid('project');
    }
    const now = new Date().toISOString();
    const existing = saveAs ? null : await getProjectRecord(id).catch(() => null);
    const project = serializeProject();
    project.projectName = name;
    const record = {
      id, name, createdAt: existing?.createdAt || state.project.createdAt || now, updatedAt: now,
      width: state.width, height: state.height, thumbnail: projectThumbnail(), project
    };
    try {
      await putProjectRecord(record);
      state.project = { id, name, createdAt: record.createdAt, updatedAt: now, dirty: false };
      safeStorageSet('effectsStudioCurrentProjectId', id);
      updateProjectHeading();
      if (!silent) status(`Saved project: ${name}.`);
      return true;
    } catch (err) {
      console.error(err);
      if (!silent) status('Project save failed; export JSON as a backup.');
      return false;
    }
  }

  async function createNamedProject() {
    const name = await askProjectName('New project', 'Untitled Project');
    if (!name) return;
    newTransparentProject();
    const now = new Date().toISOString();
    state.project = { id: uid('project'), name: name.slice(0,80), createdAt: now, updatedAt: now, dirty: true };
    await saveCurrentProject(false, true);
    showEditor();
    status(`Created ${state.project.name}.`);
  }

  async function openNamedProject(id) {
    const record = await getProjectRecord(id);
    if (!record?.project) { status('Project could not be opened.'); return; }
    await loadProject(record.project);
    state.project = { id: record.id, name: record.name, createdAt: record.createdAt, updatedAt: record.updatedAt, dirty: false };
    safeStorageSet('effectsStudioCurrentProjectId', id);
    updateProjectHeading();
    showEditor();
    setTimeout(fitCanvas, 60);
  }

  async function renameNamedProject(id) {
    const record = await getProjectRecord(id); if (!record) return;
    const name = await askProjectName('Rename project', record.name);
    if (!name) return;
    record.name = name.slice(0,80); record.updatedAt = new Date().toISOString(); record.project.projectName = record.name;
    await putProjectRecord(record);
    if (state.project.id === id) { state.project.name = record.name; updateProjectHeading(); }
    await renderProjectLibrary();
  }

  async function duplicateNamedProject(id) {
    const record = await getProjectRecord(id); if (!record) return;
    const name = await askProjectName('Duplicate project', `${record.name} Copy`); if (!name) return;
    const copy = JSON.parse(JSON.stringify(record));
    copy.id = uid('project'); copy.name = name.slice(0,80); copy.createdAt = copy.updatedAt = new Date().toISOString(); copy.project.projectName = copy.name;
    await putProjectRecord(copy); await renderProjectLibrary();
  }

  async function deleteNamedProject(id) {
    const record = await getProjectRecord(id); if (!record) return;
    if (!confirm(`Delete “${record.name}”? This cannot be undone.`)) return;
    await removeProjectRecord(id);
    if (state.project.id === id) state.project = { id:null, name:'Untitled Project', createdAt:null, updatedAt:null, dirty:false };
    await renderProjectLibrary(); updateProjectHeading();
  }

  async function renderProjectLibrary() {
    const host = $('projectCards'); if (!host) return;
    const query = ($('projectSearchInput')?.value || '').trim().toLowerCase();
    let records = await getAllProjectRecords().catch(() => []);
    records.sort((a,b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    if (query) records = records.filter((r) => `${r.name} ${r.width} ${r.height}`.toLowerCase().includes(query));
    host.innerHTML = '';
    for (const record of records) {
      const card = document.createElement('article'); card.className = 'project-card';
      const preview = document.createElement('button'); preview.type='button'; preview.className='project-preview'; preview.title=`Open ${record.name}`;
      if (record.thumbnail) { const img=document.createElement('img'); img.src=record.thumbnail; img.alt=''; preview.appendChild(img); }
      else { const blank=document.createElement('span'); blank.textContent='▧'; preview.appendChild(blank); }
      preview.addEventListener('click',()=>openNamedProject(record.id));
      const body=document.createElement('div'); body.className='project-card-body';
      const title=document.createElement('button'); title.type='button'; title.className='project-card-title'; title.textContent=record.name; title.addEventListener('click',()=>openNamedProject(record.id));
      const meta=document.createElement('span'); meta.textContent=`${record.width || '?'}×${record.height || '?'} · ${new Date(record.updatedAt).toLocaleDateString()}`;
      const actions=document.createElement('div'); actions.className='project-card-actions';
      [['Open',()=>openNamedProject(record.id)],['Rename',()=>renameNamedProject(record.id)],['Copy',()=>duplicateNamedProject(record.id)],['Delete',()=>deleteNamedProject(record.id)]].forEach(([label,fn])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);actions.appendChild(b);});
      body.append(title,meta,actions); card.append(preview,body); host.appendChild(card);
    }
    if ($('projectCount')) $('projectCount').textContent = `${records.length} saved`;
    if ($('projectEmpty')) $('projectEmpty').hidden = records.length > 0;
  }

  async function importProjectIntoLibrary(file) {
    if (!file) return;
    try {
      const project = JSON.parse(await file.text());
      await loadProject(project);
      const base = (project.projectName || file.name.replace(/\.[^.]+$/,'') || 'Imported Project').slice(0,80);
      const name = await askProjectName('Import project', base); if (!name) return;
      const now = new Date().toISOString();
      state.project = { id:uid('project'), name:name.slice(0,80), createdAt:now, updatedAt:now, dirty:true };
      await saveCurrentProject(false,true); showEditor(); status(`Imported ${state.project.name}.`);
    } catch (err) { console.error(err); status(`Project import failed: ${err.message}`); }
  }

  async function migrateLegacySave() {
    if (safeStorageGet('effectsStudioLegacyMigrated')) return;
    const raw = safeStorageGet(STORAGE_KEY);
    if (raw) {
      try {
        const project = JSON.parse(raw); const now = new Date().toISOString();
        await putProjectRecord({ id:uid('project'), name:'Recovered Project', createdAt:now, updatedAt:now, width:project.width, height:project.height, thumbnail:'', project:{...project,projectName:'Recovered Project'} });
      } catch (err) { console.warn('Legacy project migration skipped:', err); }
    }
    safeStorageSet('effectsStudioLegacyMigrated','1');
  }

  async function initProjectLibrary() {
    try { await openProjectDatabase(); await migrateLegacySave(); }
    catch (err) { console.warn(err); loadFallbackProjects(); status('Using the local project-library fallback.'); }
    $('homeNewProjectBtn')?.addEventListener('click', createNamedProject);
    $('homeContinueBtn')?.addEventListener('click', showEditor);
    $('projectHomeBtn')?.addEventListener('click', showProjectHome);
    $('homeSettingsBtn')?.addEventListener('click', () => { showEditor(); document.querySelector('[data-panel="exportPanel"]')?.click(); });
    $('projectSearchInput')?.addEventListener('input', renderProjectLibrary);
    $('homeProjectImport')?.addEventListener('change', (ev) => { const file=ev.target.files?.[0]; importProjectIntoLibrary(file); ev.target.value=''; });
    setInterval(() => { if (state.project.id && state.project.dirty && $('autoSaveInput')?.checked) saveCurrentProject(false,true); }, 30000);
    await renderProjectLibrary();
  }

  function applyStaticPattern(type) {
    const layer = getActiveLayer(); if (!layer) return;
    pushHistory(`${type} pattern`);
    const ctx=layer.ctx, w=state.width, h=state.height;
    const opacity=Number($('patternOpacityInput')?.value || 45)/100;
    const c1=$('patternPrimaryInput')?.value || state.color;
    const c2=$('patternSecondaryInput')?.value || '#FFFFFF';
    ctx.save(); ctx.globalAlpha=opacity; ctx.globalCompositeOperation='source-over';
    if(type==='checker') { const size=Math.max(12,Math.round(Math.min(w,h)/24)); for(let y=0;y<h;y+=size)for(let x=0;x<w;x+=size){ctx.fillStyle=((x/size+y/size)%2)?c1:c2;ctx.fillRect(x,y,size,size);} }
    else if(type==='stripes') { ctx.strokeStyle=c1;ctx.lineWidth=Math.max(6,w/90);for(let x=-h;x<w+h;x+=Math.max(18,w/24)){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x-h,h);ctx.stroke();} }
    else if(type==='noise') { const image=ctx.getImageData(0,0,w,h),d=image.data;for(let i=0;i<d.length;i+=4){const n=Math.random()*255;d[i]=d[i]*(1-opacity)+n*opacity;d[i+1]=d[i+1]*(1-opacity)+n*opacity;d[i+2]=d[i+2]*(1-opacity)+n*opacity;}ctx.globalAlpha=1;ctx.putImageData(image,0,0); }
    else if(type==='fabric') { ctx.strokeStyle=c1;ctx.lineWidth=1;const size=Math.max(4,Math.round(w/180));for(let x=0;x<w;x+=size){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}ctx.strokeStyle=c2;for(let y=0;y<h;y+=size){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();} }
    else if(type==='metal') { const g=ctx.createLinearGradient(0,0,w,0);g.addColorStop(0,'#222');g.addColorStop(.22,c1);g.addColorStop(.5,'#fff');g.addColorStop(.78,c2);g.addColorStop(1,'#222');ctx.fillStyle=g;ctx.fillRect(0,0,w,h); }
    else if(type==='stars') { ctx.fillStyle=c1;for(let i=0;i<Math.max(30,w*h/8500);i++){const x=Math.random()*w,y=Math.random()*h,r=Math.random()*5+1;ctx.beginPath();for(let j=0;j<10;j++){const rr=j%2?r*.42:r,a=-Math.PI/2+j*Math.PI/5;const px=x+Math.cos(a)*rr,py=y+Math.sin(a)*rr;j?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();} }
    ctx.restore(); renderLayers(); status(`${titleCase(type)} pattern applied.`);
  }

  function applyRasterFilter(type) {
    const layer=getActiveLayer(); if(!layer) return;
    if(type==='blur') { pushHistory('blur filter'); const temp=createCanvas(state.width,state.height);temp.getContext('2d').drawImage(layer.canvas,0,0);layer.ctx.clearRect(0,0,state.width,state.height);layer.ctx.save();layer.ctx.filter='blur(4px)';layer.ctx.drawImage(temp,0,0);layer.ctx.restore();renderLayers();status('Blur applied.');return; }
    if(type==='sharpen'){applyKernel([0,-1,0,-1,5,-1,0,-1,0],1);status('Sharpen applied.');return;}
    if(type==='emboss'){applyKernel([-2,-1,0,-1,1,1,0,1,2],1,128);status('Emboss applied.');return;}
    if(type==='edge'){applyKernel([-1,-1,-1,-1,8,-1,-1,-1,-1],1);status('Edge filter applied.');return;}
    pushHistory(`${type} filter`);
    const image=layer.ctx.getImageData(0,0,state.width,state.height),d=image.data;
    for(let i=0;i<d.length;i+=4){let r=d[i],g=d[i+1],b=d[i+2];
      if(type==='grayscale'){r=g=b=.299*r+.587*g+.114*b;}
      else if(type==='invert'){r=255-r;g=255-g;b=255-b;}
      else if(type==='sepia'){const nr=.393*r+.769*g+.189*b,ng=.349*r+.686*g+.168*b,nb=.272*r+.534*g+.131*b;r=nr;g=ng;b=nb;}
      else if(type==='brighten'){r+=24;g+=24;b+=24;}
      else if(type==='darken'){r-=24;g-=24;b-=24;}
      else if(type==='contrast'){const f=1.25;r=(r-128)*f+128;g=(g-128)*f+128;b=(b-128)*f+128;}
      else if(type==='saturate'||type==='desaturate'){const avg=(r+g+b)/3,f=type==='saturate'?1.35:.45;r=avg+(r-avg)*f;g=avg+(g-avg)*f;b=avg+(b-avg)*f;}
      d[i]=clamp(r,0,255);d[i+1]=clamp(g,0,255);d[i+2]=clamp(b,0,255);
    }
    layer.ctx.putImageData(image,0,0);renderLayers();status(`${titleCase(type)} filter applied.`);
  }

  function setupStaticEffects() {
    const primary=$('patternPrimaryInput'), opacity=$('patternOpacityInput'), out=$('patternOpacityOut');
    if(primary) primary.value=state.color;
    opacity?.addEventListener('input',()=>{if(out)out.textContent=opacity.value;});
    document.querySelectorAll('[data-pattern]').forEach((b)=>b.addEventListener('click',()=>applyStaticPattern(b.dataset.pattern)));
    document.querySelectorAll('[data-filter]').forEach((b)=>b.addEventListener('click',()=>applyRasterFilter(b.dataset.filter)));
  }

  async function saveToBrowser() {
    try {
      if (!safeStorageSet(STORAGE_KEY, JSON.stringify(serializeProject()))) throw new Error('Local storage is unavailable.');
      status('Saved to this browser.');
    } catch (err) {
      console.error(err);
      status('Browser save ran out of space; export JSON instead.');
    }
  }

  async function restoreFromBrowser() {
    const raw = safeStorageGet(STORAGE_KEY);
    if (!raw) return false;
    try { await loadProject(JSON.parse(raw)); return true; }
    catch (err) { console.warn('Stored project could not load:', err); return false; }
  }

  async function syncBackend() {
    const project = serializeProject();
    const payload = { action: 'saveEffectStudioProject', source: APP_NAME, backendLibrary: BACKEND_LIBRARY_URL, preferredHosts: BACKEND_CONFIG.preferredHosts || [], project };
    status('Syncing to backend…');
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      const text = await response.text().catch(() => '');
      if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
      status('Backend sync request completed.');
    } catch (err) {
      console.warn('Backend sync failed:', err);
      status('Backend sync failed; project saved locally and JSON export is available.');
      await saveToBrowser();
    }
  }

  function attachEvents() {
    els.toggleTools.addEventListener('click', () => {
      const collapsed = els.toolDrawer.classList.toggle('collapsed');
      els.toggleTools.setAttribute('aria-expanded', String(!collapsed));
    });
    document.querySelectorAll('[data-tool]').forEach((btn) => btn.addEventListener('click', () => setTool(btn.dataset.tool)));
    for (const input of [inputs.size, inputs.opacity, inputs.softness, inputs.smooth, inputs.blend, inputs.shapeType, inputs.shapeFill, inputs.rotation, inputs.zoom, inputs.fps, inputs.tolerance, inputs.sprayPalette, inputs.sprayDensity, inputs.dripChance, inputs.gradientToggle, inputs.gradientA, inputs.gradientB, inputs.gradientAngle, inputs.textSize, inputs.letterSpacing, inputs.lineSpacing, inputs.bend, inputs.strokeColor, inputs.strokeWidth, inputs.highlightColor, inputs.shadowBlur, inputs.textAlign, inputs.objectMode, inputs.objectX, inputs.objectY, inputs.objectW, inputs.objectH, inputs.objectOpacity, inputs.shapeSides, inputs.edgeSoftness, inputs.removeStrength, inputs.previewTransparency, inputs.backgroundMode, inputs.backgroundColor].filter(Boolean)) {
      input.addEventListener('input', () => { updateOutputLabels(); if (input === inputs.zoom) applyView(); });
      input.addEventListener('change', () => { updateOutputLabels(); if (input === inputs.zoom) applyView(); });
    }
    inputs.layerOpacity.addEventListener('input', () => {
      const layer = getActiveLayer();
      if (!layer) return;
      layer.opacity = Number(inputs.layerOpacity.value) / 100;
      $('layerOpacityOut').textContent = inputs.layerOpacity.value;
      renderLayers();
    });
    els.colorInput.addEventListener('input', () => setColor(els.colorInput.value));
    els.hexInput.addEventListener('change', () => setColor(els.hexInput.value));
    els.colorDisc.addEventListener('pointerdown', pickFromDisc);
    els.colorDisc.addEventListener('pointermove', (ev) => { if (ev.buttons) pickFromDisc(ev); });
    els.viewport.addEventListener('pointerdown', pointerDown);
    els.viewport.addEventListener('pointermove', pointerMove);
    els.viewport.addEventListener('pointerup', pointerUp);
    els.viewport.addEventListener('pointercancel', pointerUp);
    els.viewport.addEventListener('pointerleave', () => els.brushCursor.classList.remove('visible'));
    els.viewport.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const oldZoom = state.zoom;
      const factor = ev.deltaY < 0 ? 1.08 : 0.92;
      state.zoom = clamp(state.zoom * factor, 0.1, 8);
      const rect = els.viewport.getBoundingClientRect();
      const cx = ev.clientX - rect.left;
      const cy = ev.clientY - rect.top;
      state.pan.x = cx - ((cx - state.pan.x) / oldZoom) * state.zoom;
      state.pan.y = cy - ((cy - state.pan.y) / oldZoom) * state.zoom;
      inputs.zoom.value = String(Math.round(state.zoom * 100));
      applyView();
    }, { passive: false });

    $('undoBtn').addEventListener('click', undo); $('quickUndo').addEventListener('click', undo);
    $('redoBtn').addEventListener('click', redo); $('quickRedo').addEventListener('click', redo);
    $('clearBtn').addEventListener('click', () => { const l = getActiveLayer(); if (l) { pushHistory('clear layer'); l.ctx.clearRect(0,0,state.width,state.height); renderLayers(); } });
    $('newTransparentBtn')?.addEventListener('click', newTransparentProject);
    $('loadBrowserBtn')?.addEventListener('click', showProjectHome);
    $('clearBrowserBtn')?.addEventListener('click', () => saveCurrentProject(true));
    $('fitBtn').addEventListener('click', fitCanvas);
    $('zoomOutBtn').addEventListener('click', () => { state.zoom = clamp(state.zoom * .85, .1, 8); applyView(); });
    $('zoomInBtn').addEventListener('click', () => { state.zoom = clamp(state.zoom * 1.15, .1, 8); applyView(); });
    $('resetViewBtn').addEventListener('click', () => { state.pan = { x: 80, y: 80 }; state.zoom = 1; applyView(); });
    $('toggleGridBtn').addEventListener('click', () => { state.grid = !state.grid; els.grid.classList.toggle('hidden', !state.grid); $('toggleGridBtn').setAttribute('aria-pressed', String(state.grid)); });
    $('toggleMirrorBtn').addEventListener('click', () => { state.mirror = !state.mirror; $('toggleMirrorBtn').setAttribute('aria-pressed', String(state.mirror)); status(`Mirror ${state.mirror ? 'on' : 'off'}.`); });
    $('applyCurrentColorBgBtn')?.addEventListener('click', () => { state.background.mode = 'color'; state.background.color = state.color; syncExtraInputsFromState(); applyCanvasBackground(); status(`Background set to ${state.color}.`); });
    $('resizeCanvasBtn').addEventListener('click', () => {
      const [w,h] = inputs.canvasPreset.value.split('x').map(Number);
      pushHistory('resize canvas');
      state.width = w; state.height = h; updateStageSize(); fitCanvas(); renderLayers(); renderObjects(); renderMapGrid(); renderLighting();
    });

    $('addLayerBtn').addEventListener('click', () => { pushHistory('add layer'); addLayer(); });
    $('duplicateLayerBtn').addEventListener('click', () => {
      const l = getActiveLayer(); if (!l) return; pushHistory('duplicate layer'); const nl = addLayer(`${l.name} copy`); nl.ctx.drawImage(l.canvas, 0, 0); renderLayers();
    });
    $('deleteLayerBtn').addEventListener('click', () => removeLayer(state.activeLayerId));
    $('layerUpBtn').addEventListener('click', () => moveLayer(1));
    $('layerDownBtn').addEventListener('click', () => moveLayer(-1));
    $('mergeDownBtn').addEventListener('click', mergeDown);

    $('captureFrameBtn').addEventListener('click', captureFrame);
    $('playAnimBtn').addEventListener('click', playAnimation);
    $('stopAnimBtn').addEventListener('click', stopAnimation);
    $('removeColorBtn').addEventListener('click', removePickedColor);
    $('applyConnectedTransparencyBtn')?.addEventListener('click', applyConnectedTransparency);
    $('trimTransparentBtn')?.addEventListener('click', trimTransparentEdges);
    $('refreshRepairSourceBtn')?.addEventListener('click', refreshRepairSource);
    $('loadBrowserProjectBtn')?.addEventListener('click', showProjectHome);
    $('clearBrowserProjectBtn')?.addEventListener('click', () => saveCurrentProject(true));
    inputs.previewTransparency?.addEventListener('change', () => { clearPreview(); updateTransparencyPreview(); });
    $('softenBtn').addEventListener('click', () => applyKernel([1,1,1,1,1,1,1,1,1], 9));
    $('sharpenBtn').addEventListener('click', () => applyKernel([0,-1,0,-1,5,-1,0,-1,0], 1));
    $('exportPngBtn').addEventListener('click', exportPNG);
    $('exportSvgBtn').addEventListener('click', exportSVG);
    $('exportJsonBtn').addEventListener('click', exportJSON);
    $('exportHtmlBtn').addEventListener('click', exportHTML);
    $('saveBrowserBtn').addEventListener('click', () => saveCurrentProject(false));
    $('backendSaveBtn').addEventListener('click', syncBackend);
    $('showShortcutsBtn').addEventListener('click', () => els.shortcutsDialog.showModal());
    inputs.imageImport.addEventListener('change', importImage);
    inputs.projectImport.addEventListener('change', (ev) => { const file=ev.target.files?.[0]; importProjectIntoLibrary(file); ev.target.value=''; });
    window.addEventListener('resize', () => { applyView(); renderHotspots(); renderObjects(); renderLightHandles(); renderSoundZones(); });
    document.addEventListener('keydown', keydown);
    window.addEventListener('beforeinstallprompt', (ev) => {
      ev.preventDefault();
      state.deferredInstallPrompt = ev;
      const btn = $('installBtn');
      btn.hidden = false;
      btn.addEventListener('click', async () => {
        if (!state.deferredInstallPrompt) return;
        state.deferredInstallPrompt.prompt();
        await state.deferredInstallPrompt.userChoice;
        state.deferredInstallPrompt = null;
        btn.hidden = true;
      }, { once: true });
    });
  }

  function moveLayer(dir) {
    const idx = state.layers.findIndex((l) => l.id === state.activeLayerId);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= state.layers.length) return;
    pushHistory('move layer');
    [state.layers[idx], state.layers[next]] = [state.layers[next], state.layers[idx]];
    reorderLayers();
  }

  function mergeDown() {
    const idx = state.layers.findIndex((l) => l.id === state.activeLayerId);
    if (idx <= 0) { status('No lower layer to merge into.'); return; }
    pushHistory('merge layer down');
    const top = state.layers[idx];
    const below = state.layers[idx - 1];
    below.ctx.save();
    below.ctx.globalAlpha = top.opacity;
    below.ctx.globalCompositeOperation = top.blend || 'source-over';
    below.ctx.drawImage(top.canvas, 0, 0);
    below.ctx.restore();
    top.canvas.remove();
    state.layers.splice(idx, 1);
    state.activeLayerId = below.id;
    renderLayers();
  }


  function parseColorList(value) {
    const found = String(value || '').match(/#[0-9a-fA-F]{3,8}/g) || [];
    return found.map((c) => rgbToHex(...parseHex(c))).slice(0, 12);
  }

  function syncExtraInputsFromState() {
    if (inputs.sprayPalette) inputs.sprayPalette.value = state.spray.colors.join(', ');
    if (inputs.sprayDensity) inputs.sprayDensity.value = Math.round(state.spray.density * 100);
    if (inputs.dripChance) inputs.dripChance.value = Math.round(state.spray.drip * 100);
    if (inputs.gradientToggle) inputs.gradientToggle.checked = !!state.gradient.enabled;
    if (inputs.gradientA) inputs.gradientA.value = state.gradient.a;
    if (inputs.gradientB) inputs.gradientB.value = state.gradient.b;
    if (inputs.gradientAngle) inputs.gradientAngle.value = state.gradient.angle;
    if (inputs.textSize) inputs.textSize.value = state.textStyle.size;
    if (inputs.letterSpacing) inputs.letterSpacing.value = state.textStyle.letterSpacing;
    if (inputs.lineSpacing) inputs.lineSpacing.value = Math.round(state.textStyle.lineSpacing * 100);
    if (inputs.bend) inputs.bend.value = Math.round(state.textStyle.bend * 100);
    if (inputs.strokeColor) inputs.strokeColor.value = state.textStyle.stroke;
    if (inputs.strokeWidth) inputs.strokeWidth.value = state.textStyle.strokeWidth;
    if (inputs.highlightColor) inputs.highlightColor.value = state.textStyle.highlight;
    if (inputs.shadowBlur) inputs.shadowBlur.value = state.textStyle.shadowBlur;
    if (inputs.textAlign) inputs.textAlign.value = state.textStyle.align;
    if (inputs.objectMode) inputs.objectMode.checked = !!state.objectMode;
    if (inputs.shapeSides) inputs.shapeSides.value = Math.round(state.shape.sides || 6);
    if (inputs.backgroundMode) inputs.backgroundMode.value = state.background?.mode || 'transparent';
    if (inputs.backgroundColor) inputs.backgroundColor.value = state.background?.color || '#FFFFFF';
  }


  function resetPalettePosition() {
    const drawer = els.toolDrawer;
    if (!drawer) return;
    drawer.classList.remove('is-floating', 'collapsed');
    ['left', 'top', 'right', 'bottom', 'width', 'height'].forEach((property) => drawer.style.removeProperty(property));
    els.toggleTools?.setAttribute('aria-expanded', 'true');
    status('Tool menu reset.');
  }

  function setupMovablePalette() {
    const drawer = els.toolDrawer;
    if (!drawer) return;
    const handles = [document.getElementById('paletteDragHandle'), ...drawer.querySelectorAll('.tool-panel > h2, .always-panel > h2')].filter(Boolean);
    const reset = document.getElementById('paletteResetBtn');
    reset?.addEventListener('click', resetPalettePosition);
    const startDrag = (ev) => {
      if (ev.target.closest('button,input,select,textarea,a,label')) return;
      if (!window.matchMedia('(min-width: 900px), (orientation: landscape)').matches) return;
      ev.preventDefault();
      const rect = drawer.getBoundingClientRect();
      drawer.classList.add('is-floating');
      drawer.classList.remove('collapsed');
      els.toggleTools?.setAttribute('aria-expanded', 'true');
      drawer.style.width = `${Math.min(rect.width, window.innerWidth - 16)}px`;
      drawer.style.height = `${Math.min(rect.height, window.innerHeight - 16)}px`;
      drawer.style.left = `${rect.left}px`;
      drawer.style.top = `${rect.top}px`;
      drawer.style.right = 'auto';
      drawer.style.bottom = 'auto';
      const start = { x: ev.clientX, y: ev.clientY, left: rect.left, top: rect.top };
      const move = (mev) => {
        const w = drawer.offsetWidth || rect.width;
        const h = drawer.offsetHeight || rect.height;
        const left = clamp(start.left + (mev.clientX - start.x), 4, Math.max(4, window.innerWidth - w - 4));
        const top = clamp(start.top + (mev.clientY - start.y), 4, Math.max(4, window.innerHeight - h - 4));
        drawer.style.left = `${left}px`;
        drawer.style.top = `${top}px`;
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up, { once: true });
    };
    handles.forEach((handle) => handle.addEventListener('pointerdown', startDrag));
  }

  function setupSimplePanels() {
    const showPanel = (id) => {
      document.querySelectorAll('.tool-panel').forEach((p) => p.classList.toggle('active-panel', p.id === id));
      document.querySelectorAll('[data-panel]').forEach((b) => b.classList.toggle('active', b.dataset.panel === id));
      // Same shell on desktop, tablet, mobile, portrait, and rotated views:
      // Choosing a tool panel opens the responsive tool drawer.
      els.toolDrawer.classList.remove('collapsed');
      els.toggleTools?.setAttribute('aria-expanded', 'true');
    };
    document.querySelectorAll('[data-panel]').forEach((btn) => btn.addEventListener('click', () => showPanel(btn.dataset.panel)));
  }

  function currentGradient(ctx, x, y, w, h) {
    if (!state.gradient.enabled) return state.color;
    const angle = degToRad(state.gradient.angle);
    const cx = x + w / 2, cy = y + h / 2;
    const len = Math.max(w, h) || 1;
    const x1 = cx - Math.cos(angle) * len / 2;
    const y1 = cy - Math.sin(angle) * len / 2;
    const x2 = cx + Math.cos(angle) * len / 2;
    const y2 = cy + Math.sin(angle) * len / 2;
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, state.gradient.a || state.color);
    g.addColorStop(1, state.gradient.b || state.color);
    return g;
  }

  function createObject(base) {
    const obj = {
      id: uid('obj'), type: 'shape', name: 'Object', x: 120, y: 120, w: 420, h: 220, rotation: 0,
      opacity: 1, flipX: false, flipY: false, blend: 'source-over', href: inputs.link?.value?.trim() || '',
      ...base
    };
    state.objects.push(obj);
    state.activeObjectId = obj.id;
    renderObjects();
    renderLayers();
    setObjectInputs(obj);
    status(`${obj.name || obj.type} added.`);
    return obj;
  }

  function getActiveObject() { return state.objects.find((o) => o.id === state.activeObjectId) || null; }

  function addTextObject(point = null) {
    const p = point || { x: Math.max(40, (state.width - 520) / 2), y: Math.max(40, state.height * .18) };
    createObject({
      type: 'text', name: 'Text overlay', x: p.x, y: p.y, w: Math.min(680, state.width - p.x), h: Math.max(90, state.textStyle.size * 1.45),
      text: inputs.text?.value || 'Your text', color: state.color, font: inputs.font?.value || 'Impact, fantasy', style: { ...state.textStyle }, gradient: { ...state.gradient }
    });
  }

  function addShapeObjectFromPoints(start, end) {
    const r = rotatedRectData(start, end);
    if (r.w < 8 || r.h < 8) { r.w = 320; r.h = 180; }
    createObject({ type: 'shape', name: `${titleCase(state.shape.type)} object`, x: r.x, y: r.y, w: r.w, h: r.h, shapeType: state.shape.type, shapeFill: state.shape.fill, sides: state.shape.sides || 6, color: state.color, stroke: state.textStyle.stroke, strokeWidth: Math.max(2, state.brush.size * 0.12), gradient: { ...state.gradient } });
  }

  function addShapeObject() {
    createObject({ type: 'shape', name: `${titleCase(state.shape.type)} object`, x: Math.max(40, state.width * .18), y: Math.max(40, state.height * .18), w: Math.min(520, state.width * .5), h: Math.min(320, state.height * .35), shapeType: state.shape.type, shapeFill: state.shape.fill, sides: state.shape.sides || 6, color: state.color, stroke: state.textStyle.stroke, strokeWidth: Math.max(2, state.brush.size * 0.12), gradient: { ...state.gradient } });
  }

  function addImageObject(src, label = 'Image overlay') {
    createObject({ type: 'image', name: label, x: Math.max(40, state.width * .18), y: Math.max(40, state.height * .18), w: Math.min(520, state.width * .5), h: Math.min(420, state.height * .45), src, preserveAspect: true });
  }

  function updateSelectedObjectFromInputs(render = true) {
    const obj = getActiveObject();
    if (!obj || !inputs.objectX) return;
    obj.x = Number(inputs.objectX.value);
    obj.y = Number(inputs.objectY.value);
    obj.w = Number(inputs.objectW.value);
    obj.h = Number(inputs.objectH.value);
    obj.rotation = Number(inputs.rotation.value || 0);
    obj.opacity = Number(inputs.objectOpacity?.value || 100) / 100;
    if (obj.type === 'text') {
      obj.text = inputs.text?.value || obj.text;
      obj.color = state.color;
      obj.font = inputs.font?.value || obj.font;
      obj.style = { ...state.textStyle };
      obj.gradient = { ...state.gradient };
    } else if (obj.type === 'shape') {
      obj.shapeType = inputs.shapeType?.value || obj.shapeType;
      obj.shapeFill = inputs.shapeFill?.value || obj.shapeFill;
      obj.sides = Number(inputs.shapeSides?.value || obj.sides || state.shape.sides || 6);
      obj.color = state.color;
      obj.stroke = state.textStyle.stroke;
      obj.strokeWidth = Math.max(1, state.textStyle.strokeWidth || obj.strokeWidth || 3);
      obj.gradient = { ...state.gradient };
    }
    obj.href = inputs.link?.value?.trim() || obj.href || '';
    if (render) renderObjects();
  }

  function setObjectInputs(obj) {
    if (!obj || !inputs.objectX) return;
    const rangeSet = (input, value) => { if (!input) return; input.max = String(Math.max(Number(input.max) || 3000, Math.ceil(value + 500), state.width + 1200, state.height + 1200)); input.value = String(Math.round(value)); };
    rangeSet(inputs.objectX, obj.x); rangeSet(inputs.objectY, obj.y); rangeSet(inputs.objectW, obj.w); rangeSet(inputs.objectH, obj.h);
    if (inputs.objectOpacity) inputs.objectOpacity.value = Math.round((obj.opacity ?? 1) * 100);
    inputs.rotation.value = Math.round(obj.rotation || 0);
    if (obj.type === 'text') {
      if (inputs.text) inputs.text.value = obj.text || '';
      if (inputs.font && obj.font) inputs.font.value = obj.font;
    }
    if (obj.type === 'shape') {
      if (inputs.shapeType && obj.shapeType) inputs.shapeType.value = obj.shapeType;
      if (inputs.shapeFill && obj.shapeFill) inputs.shapeFill.value = obj.shapeFill;
      if (inputs.shapeSides) inputs.shapeSides.value = Math.round(obj.sides || state.shape.sides || 6);
    }
    $('objectXOut').textContent = String(Math.round(obj.x)); $('objectYOut').textContent = String(Math.round(obj.y));
    $('objectWOut').textContent = String(Math.round(obj.w)); $('objectHOut').textContent = String(Math.round(obj.h));
    if ($('objectOpacityOut')) $('objectOpacityOut').textContent = String(Math.round((obj.opacity ?? 1) * 100));
    $('rotationOut').textContent = String(Math.round(obj.rotation || 0));
  }

  function renderObjects() {
    if (!els.objectLayer || !els.objectCanvas) return;
    els.objectLayer.innerHTML = '';
    for (const obj of state.objects) {
      const box = document.createElement(obj.href ? 'a' : 'button');
      box.className = `object-box${obj.id === state.activeObjectId ? ' active' : ''}`;
      box.dataset.objectId = obj.id;
      if (obj.href) { box.href = obj.href; box.target = '_blank'; box.rel = 'noopener noreferrer'; box.title = obj.name || obj.href; }
      else { box.type = 'button'; box.title = obj.name || obj.type; }
      box.style.left = `${obj.x}px`; box.style.top = `${obj.y}px`; box.style.width = `${obj.w}px`; box.style.height = `${obj.h}px`;
      box.style.transform = `rotate(${obj.rotation || 0}deg) scale(${obj.flipX ? -1 : 1}, ${obj.flipY ? -1 : 1})`;
      box.addEventListener('pointerdown', objectPointerDown);
      box.addEventListener('click', (ev) => { ev.preventDefault(); selectObject(obj.id); });
      els.objectLayer.appendChild(box);
    }
    renderObjectCanvas();
    renderObjectList();
  }

  function selectObject(id) {
    state.activeObjectId = id;
    const obj = getActiveObject();
    if (obj) { setObjectInputs(obj); status(`Selected ${obj.name || obj.type}.`); }
    renderObjects();
  }

  function objectPointerDown(ev) {
    const id = ev.currentTarget.dataset.objectId;
    selectObject(id);
    const obj = getActiveObject();
    if (!obj) return;
    ev.preventDefault(); ev.stopPropagation();
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
    const start = { x: ev.clientX, y: ev.clientY, ox: obj.x, oy: obj.y };
    const move = (mev) => {
      const dx = (mev.clientX - start.x) / state.zoom;
      const dy = (mev.clientY - start.y) / state.zoom;
      obj.x = snapCoordinate(start.ox + dx); obj.y = snapCoordinate(start.oy + dy);
      setObjectInputs(obj); renderObjects();
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); pushHistory('move object'); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  function renderObjectList() {
    if (!els.objectList) return;
    els.objectList.innerHTML = '';
    for (let i = state.objects.length - 1; i >= 0; i--) {
      const obj = state.objects[i];
      const row = document.createElement('div'); row.className = `layer-item object-row${obj.id === state.activeObjectId ? ' active' : ''}`;
      const thumb = document.createElement('div'); thumb.className = 'layer-thumb object-thumb'; thumb.textContent = obj.type === 'text' ? 'T' : obj.type === 'image' ? '★' : '◇';
      const name = document.createElement('span'); name.textContent = obj.name || obj.type;
      const actions = document.createElement('div'); actions.className = 'button-row';
      const use = document.createElement('button'); use.type = 'button'; use.textContent = 'Use'; use.addEventListener('click', () => selectObject(obj.id));
      const del = document.createElement('button'); del.type = 'button'; del.textContent = 'Del'; del.addEventListener('click', () => deleteObject(obj.id));
      actions.append(use, del); row.append(thumb, name, actions); els.objectList.appendChild(row);
    }
  }

  function renderObjectCanvas() {
    if (!els.objectCanvas) return;
    const ctx = els.objectCanvas.getContext('2d');
    ctx.clearRect(0, 0, state.width, state.height);
    for (const obj of state.objects) drawObjectToCanvas(ctx, obj);
    renderHotspots();
  }

  function drawObjectToCanvas(ctx, obj) {
    ctx.save();
    ctx.globalAlpha = obj.opacity ?? 1;
    ctx.globalCompositeOperation = obj.blend || 'source-over';
    ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
    ctx.rotate(degToRad(obj.rotation || 0));
    ctx.scale(obj.flipX ? -1 : 1, obj.flipY ? -1 : 1);
    ctx.translate(-obj.w / 2, -obj.h / 2);
    if (obj.type === 'image' && obj.src) drawImageObject(ctx, obj);
    else if (obj.type === 'text') drawTextObject(ctx, obj);
    else drawShapeObject(ctx, obj);
    ctx.restore();
  }

  function drawImageObject(ctx, obj) {
    let img = drawImageObject.cache?.get(obj.src);
    if (!drawImageObject.cache) drawImageObject.cache = new Map();
    img = drawImageObject.cache.get(obj.src);
    if (!img) {
      img = new Image(); if (/^https?:/i.test(obj.src)) img.crossOrigin = 'anonymous'; img.onload = renderObjectCanvas; img.src = obj.src;
      drawImageObject.cache.set(obj.src, img); return;
    }
    if (!img.complete) return;
    ctx.drawImage(img, 0, 0, obj.w, obj.h);
  }

  function drawTextObject(ctx, obj) {
    const style = { ...state.textStyle, ...(obj.style || {}) };
    const lines = String(obj.text || '').split(/\n/);
    const fontBits = `${style.italic ? 'italic ' : ''}${style.bold ? '800 ' : '500 '}${style.size || 72}px ${obj.font || inputs.font?.value || 'Impact, fantasy'}`;
    ctx.font = fontBits; ctx.textBaseline = 'top'; ctx.textAlign = style.align || 'left';
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = style.shadowBlur || 0; ctx.shadowOffsetX = style.shadowBlur ? 4 : 0; ctx.shadowOffsetY = style.shadowBlur ? 4 : 0;
    const lh = (style.size || 72) * (style.lineSpacing || 1.1);
    const fill = (obj.gradient?.enabled ?? state.gradient.enabled) ? currentGradient(ctx, 0, 0, obj.w, obj.h) : (obj.color || state.color);
    ctx.fillStyle = colorWithAlpha(style.highlight || '#FFF3D6', 0.42); ctx.fillRect(0, 0, obj.w, Math.min(obj.h, lines.length * lh + 8));
    ctx.shadowBlur = style.shadowBlur || 0;
    let x = style.align === 'center' ? obj.w / 2 : style.align === 'right' ? obj.w : 0;
    for (let i=0;i<lines.length;i++) {
      const y = i * lh + 4;
      if (Math.abs(style.bend || 0) > 0.02) drawBentLine(ctx, lines[i], x, y, obj.w, fill, style, obj);
      else drawSpacedLine(ctx, lines[i], x, y, fill, style, obj);
    }
  }

  function drawSpacedLine(ctx, text, x, y, fill, style, obj) {
    ctx.fillStyle = fill; ctx.strokeStyle = style.stroke || '#001E24'; ctx.lineWidth = style.strokeWidth || 0;
    const chars = [...text];
    if (!style.letterSpacing) {
      if (style.strokeWidth > 0) ctx.strokeText(text, x, y); ctx.fillText(text, x, y); decorateText(ctx, text, x, y, style); return;
    }
    const widths = chars.map((ch) => ctx.measureText(ch).width + style.letterSpacing);
    const total = widths.reduce((a,b)=>a+b,0);
    let start = style.align === 'center' ? x - total / 2 : style.align === 'right' ? x - total : x;
    for (let i=0;i<chars.length;i++) { if (style.strokeWidth > 0) ctx.strokeText(chars[i], start, y); ctx.fillText(chars[i], start, y); start += widths[i]; }
    decorateText(ctx, text, x, y, style, total);
  }

  function drawBentLine(ctx, text, x, y, w, fill, style) {
    const chars = [...text]; const total = ctx.measureText(text).width + chars.length * (style.letterSpacing || 0);
    let start = style.align === 'center' ? (w - total) / 2 : style.align === 'right' ? w - total : 0;
    for (const ch of chars) {
      const cw = ctx.measureText(ch).width + (style.letterSpacing || 0);
      const t = (start + cw / 2) / Math.max(1, w);
      const cy = y + Math.sin((t - .5) * Math.PI) * (style.bend * 80);
      ctx.save(); ctx.translate(start, cy); ctx.rotate((t - .5) * style.bend * .45); ctx.fillStyle = fill; ctx.strokeStyle = style.stroke; ctx.lineWidth = style.strokeWidth || 0; if (style.strokeWidth > 0) ctx.strokeText(ch, 0, 0); ctx.fillText(ch, 0, 0); ctx.restore();
      start += cw;
    }
  }

  function decorateText(ctx, text, x, y, style, width=null) {
    const w = width || ctx.measureText(text).width; const fs = style.size || 72;
    const start = style.align === 'center' ? x - w / 2 : style.align === 'right' ? x - w : x;
    ctx.save(); ctx.shadowBlur = 0; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(2, fs * .035);
    if (style.underline) { ctx.beginPath(); ctx.moveTo(start, y + fs * 1.05); ctx.lineTo(start + w, y + fs * 1.05); ctx.stroke(); }
    if (style.strike) { ctx.beginPath(); ctx.moveTo(start, y + fs * .58); ctx.lineTo(start + w, y + fs * .58); ctx.stroke(); }
    ctx.restore();
  }

  function drawShapeObject(ctx, obj) {
    const oldShape = { ...state.shape };
    state.shape.type = obj.shapeType || 'rect'; state.shape.fill = obj.shapeFill || 'fillStroke'; state.shape.rotation = 0;
    ctx.fillStyle = (obj.gradient?.enabled ?? state.gradient.enabled) ? currentGradient(ctx, 0, 0, obj.w, obj.h) : (obj.color || state.color);
    ctx.strokeStyle = obj.stroke || '#001E24'; ctx.lineWidth = obj.strokeWidth || 4;
    ctx.beginPath();
    const start = {x:0,y:0}, end = {x:obj.w,y:obj.h};
    const type = state.shape.type;
    const { x, y, w, h, cx, cy } = rotatedRectData(start, end);
    if (type === 'heart') heartPath(ctx, cx, cy, w, h);
    else if (type === 'arrow') arrowPath(ctx, x, y, w, h);
    else if (type === 'speech') speechPath(ctx, x, y, w, h);
    else if (type === 'rect') ctx.rect(x, y, w, h);
    else if (type === 'roundrect') roundRectPath(ctx, x, y, w, h, Math.min(w, h) * .12);
    else if (type === 'circle') ellipsePath(ctx, cx, cy, w / 2, h / 2);
    else if (type === 'line') { ctx.moveTo(0, 0); ctx.lineTo(w, h); }
    else if (type === 'triangle') polygonPath(ctx, [[cx, y], [x + w, y + h], [x, y + h]]);
    else if (type === 'diamond') polygonPath(ctx, [[cx, y], [x + w, cy], [cx, y + h], [x, cy]]);
    else if (type === 'star') starPath(ctx, cx, cy, Math.max(w, h) / 2, Math.max(w, h) / 4, Math.max(3, state.shape.sides || 5));
    else if (type === 'polygon') starPath(ctx, cx, cy, Math.max(w, h) / 2, Math.max(w, h) / 2, Math.max(3, state.shape.sides || 6));
    else if (type === 'cloud') cloudPath(ctx, x, y, w, h);
    else if (type === 'burst') burstPath(ctx, cx, cy, Math.max(w, h) / 2, 14);
    else if (type === 'moon') moonPath(ctx, cx, cy, w / 2, h / 2);
    else if (type === 'plant') plantPath(ctx, x, y, w, h);
    else if (type === 'cube') cubePath(ctx, x, y, w, h);
    if (state.shape.fill === 'fill' || state.shape.fill === 'fillStroke') ctx.fill();
    if (state.shape.fill === 'stroke' || state.shape.fill === 'fillStroke' || type === 'line' || type === 'cube' || type === 'plant') ctx.stroke();
    state.shape = oldShape;
  }

  function heartPath(ctx, cx, cy, w, h) {
    ctx.moveTo(cx, cy + h*.32); ctx.bezierCurveTo(cx - w*.52, cy - h*.05, cx - w*.22, cy - h*.55, cx, cy - h*.18); ctx.bezierCurveTo(cx + w*.22, cy - h*.55, cx + w*.52, cy - h*.05, cx, cy + h*.32); ctx.closePath();
  }
  function arrowPath(ctx, x, y, w, h) { polygonPath(ctx, [[x,y+h*.35],[x+w*.62,y+h*.35],[x+w*.62,y+h*.12],[x+w,y+h*.5],[x+w*.62,y+h*.88],[x+w*.62,y+h*.65],[x,y+h*.65]]); }
  function speechPath(ctx, x, y, w, h) { roundRectPath(ctx,x,y,w,h*.78,Math.min(w,h)*.14); ctx.moveTo(x+w*.22,y+h*.78); ctx.lineTo(x+w*.18,y+h); ctx.lineTo(x+w*.42,y+h*.78); }

  function deleteObject(id = state.activeObjectId) {
    const idx = state.objects.findIndex((o) => o.id === id); if (idx < 0) return;
    pushHistory('delete object'); state.objects.splice(idx,1); state.activeObjectId = state.objects[Math.min(idx, state.objects.length - 1)]?.id || null; renderObjects(); renderLayers();
  }
  function duplicateObject() { const obj = getActiveObject(); if (!obj) return; pushHistory('duplicate object'); createObject({ ...JSON.parse(JSON.stringify(obj)), id: uid('obj'), x: obj.x + 28, y: obj.y + 28, name: `${obj.name || obj.type} copy` }); }
  function moveObject(dir) { const idx = state.objects.findIndex((o) => o.id === state.activeObjectId); const next = idx + dir; if (idx < 0 || next < 0 || next >= state.objects.length) return; pushHistory('move object layer'); [state.objects[idx], state.objects[next]] = [state.objects[next], state.objects[idx]]; renderObjects(); }
  function flipObject(axis) { const obj = getActiveObject(); if (!obj) return; pushHistory('flip object'); if (axis === 'x') obj.flipX = !obj.flipX; else obj.flipY = !obj.flipY; renderObjects(); }

  function rasterizeSelectedObject() {
    const obj = getActiveObject(); const layer = getActiveLayer(); if (!obj || !layer) { status('Select an object and a raster layer first.'); return; }
    pushHistory('rasterize object'); drawObjectToCanvas(layer.ctx, obj); deleteObject(obj.id); renderLayers(); status('Object rasterized to active layer.');
  }

  function transformActiveLayer(kind) {
    const layer = getActiveLayer(); if (!layer) return; pushHistory(kind);
    const tmp = createCanvas(state.width, state.height); const tctx = tmp.getContext('2d');
    if (kind === 'rotate') { tctx.translate(state.width/2, state.height/2); tctx.rotate(Math.PI/2); tctx.drawImage(layer.canvas, -state.width/2, -state.height/2); }
    else if (kind === 'flipH') { tctx.translate(state.width, 0); tctx.scale(-1, 1); tctx.drawImage(layer.canvas, 0, 0); }
    else if (kind === 'flipV') { tctx.translate(0, state.height); tctx.scale(1, -1); tctx.drawImage(layer.canvas, 0, 0); }
    layer.ctx.clearRect(0,0,state.width,state.height); layer.ctx.drawImage(tmp,0,0); renderLayers();
  }


  async function loadAssetLibrary() {
    if (!els.assetGrid) return;
    try {
      let data = window.EffectsStudioAssetLibrary;
      if (!data) {
        const response = await fetch('json/admins/effects-studio/asset-library-manifest.json');
        data = await response.json();
      }
      state.assetLibrary = Array.isArray(data.assets) ? data.assets : [];
      renderAssetCategoryOptions(); renderAssetGrid();
      status(`Loaded ${state.assetLibrary.length} bundled assets.`);
    } catch (err) { console.warn('Asset library not loaded:', err); status('Asset library is optional and did not load from file:// in this browser.'); }
  }

  function renderAssetCategoryOptions() {
    if (!els.assetCategory) return;
    const cats = [...new Set(state.assetLibrary.map((a) => a.category))].sort();
    els.assetCategory.innerHTML = '<option value="all">All assets</option>' + cats.map((c) => `<option value="${escapeXml(c)}">${escapeXml(titleCase(c))}</option>`).join('');
  }

  function renderAssetGrid() {
    if (!els.assetGrid) return;
    const cat = els.assetCategory?.value || 'all'; const q = (els.assetSearch?.value || '').toLowerCase();
    els.assetGrid.innerHTML = '';
    state.assetLibrary.filter((a) => a.type === 'image').filter((a) => (cat === 'all' || a.category === cat) && (!q || `${a.label} ${a.category} ${a.source}`.toLowerCase().includes(q))).slice(0, 180).forEach((a) => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'asset-tile'; btn.title = `${a.label} · ${a.category}`;
      const img = document.createElement('img'); img.src = a.src; img.alt = '';
      const span = document.createElement('span'); span.textContent = a.label;
      btn.append(img, span); btn.addEventListener('click', () => addImageObject(a.src, a.label)); els.assetGrid.appendChild(btn);
    });
  }

  function renderEmojiGrid() {
    if (!els.emojiGrid) return;
    const emojis = '😀 😎 🤩 🦖 🐉 🐈‍⬛ ⭐ ✨ 🔥 💧 🌊 🌙 ☀️ 🌈 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💬 💭 ❗ ❓ 🎨 🖌️ 🖍️ 🧪 🛸 🏰 🌲 🍄 🌸'.split(' ');
    els.emojiGrid.innerHTML = '';
    emojis.forEach((emoji) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = emoji; b.addEventListener('click', () => createObject({ type: 'text', name: `Emoji ${emoji}`, text: emoji, x: state.width*.25, y: state.height*.25, w: 160, h: 160, color: state.color, font: 'system-ui, sans-serif', style: { ...state.textStyle, size: 110, strokeWidth: 0, highlight: 'rgba(255,255,255,0)' }, gradient: { enabled: false } })); els.emojiGrid.appendChild(b); });
  }


  function setupProgrammedTools() {
    const data = window.EffectsStudioPresetData; if (!data) return;
    const brushes=data.brushes?.presets || [], textures=data.textures?.presets || [], palettes=data.colors?.palettes || [];
    const bsel=$('programBrushInput'), tsel=$('programTextureInput'), psel=$('programPaletteInput');
    if (bsel) bsel.innerHTML=brushes.map((b)=>`<option value="${b.id}">${escapeXml(b.name)} · ${escapeXml(b.family)}</option>`).join('');
    if (tsel) tsel.innerHTML=textures.map((t)=>`<option value="${t.id}">${escapeXml(t.name)}</option>`).join('');
    if (psel) psel.innerHTML=palettes.map((p)=>`<option value="${p.id}">${escapeXml(p.name)}</option>`).join('');
    const find=(list,id)=>list.find((x)=>x.id===id) || list[0];
    const update=()=>{
      const b=find(brushes,bsel?.value), t=find(textures,tsel?.value), pal=find(palettes,psel?.value);
      if ($('programBrushInfo') && b) $('programBrushInfo').textContent=`${b.description} Uses: ${(b.uses || []).join(', ')}. Suggested ${b.defaultPx}px.`;
      if ($('programTextureInfo') && t) $('programTextureInfo').textContent=t.description || t.name;
      const preview=$('programTexturePreview'); if(preview && t){ preview.className=`program-texture-preview studio-texture ${t.cssClass}`; const rgb=parseHex(state.color); preview.style.setProperty('--paint-current',state.color); preview.style.setProperty('--paint-rgb',`${rgb[0]} ${rgb[1]} ${rgb[2]}`); preview.style.setProperty('--texture-intensity',String(Number($('programTextureIntensityInput')?.value || 70)/100)); preview.style.setProperty('--texture-scale',String(Number($('programTextureScaleInput')?.value || 100)/100)); preview.style.setProperty('--texture-angle',`${Number($('programTextureAngleInput')?.value || 35)}deg`); }
      const sw=$('programSwatches'); if(sw && pal){sw.innerHTML=''; (pal.colors || []).slice(0,74).forEach((c)=>{const btn=document.createElement('button');btn.type='button';btn.title=`${c.name}: ${c.hex}`;btn.style.background=c.hex;btn.addEventListener('click',()=>setColor(c.hex));sw.appendChild(btn);});}
      if($('programTextureIntensityOut'))$('programTextureIntensityOut').textContent=$('programTextureIntensityInput').value;
      if($('programTextureScaleOut'))$('programTextureScaleOut').textContent=$('programTextureScaleInput').value;
      if($('programTextureAngleOut'))$('programTextureAngleOut').textContent=$('programTextureAngleInput').value;
    };
    [bsel,tsel,psel,$('programTextureIntensityInput'),$('programTextureScaleInput'),$('programTextureAngleInput')].filter(Boolean).forEach((el)=>{el.addEventListener('input',update);el.addEventListener('change',update);});
    $('applyProgramBrushBtn')?.addEventListener('click',()=>{const b=find(brushes,bsel.value); if(!b)return; inputs.size.value=String(b.defaultPx || 22); inputs.softness.value=String(Math.round((1-(b.tip?.hardness ?? .7))*100)); inputs.smooth.value=String(Math.round((b.dynamics?.smoothing ?? .45)*100)); const map={marker:'marker',chalk:'charcoal',dry:'crayon',rigger:'ink',spotter:'pencil',fan:'paint',wash:'paint'}; setTool(map[b.renderer] || 'paint'); updateOutputLabels(); status(`Brush program loaded: ${b.name}.`);});
    const textureTile=(preset,fillBase)=>{const size=Math.max(32,Math.round(96*Number($('programTextureScaleInput').value)/100));const c=createCanvas(size,size);const x=c.getContext('2d');const intensity=Number($('programTextureIntensityInput').value)/100;const angle=degToRad(Number($('programTextureAngleInput').value));const rgb=parseHex(state.color);const rgba=(a)=>`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;if(fillBase){x.fillStyle=colorWithAlpha(state.color,.30+.42*intensity);x.fillRect(0,0,size,size);}x.save();x.globalAlpha=.2+.8*intensity;const renderer=preset.renderer;
      if(renderer==='fiber-grid'){x.strokeStyle=rgba(.55);x.lineWidth=1;for(let i=0;i<size;i+=Math.max(3,size/16)){x.beginPath();x.moveTo(i,0);x.lineTo(i,size);x.stroke();x.beginPath();x.moveTo(0,i+2);x.lineTo(size,i+2);x.stroke();}}
      else if(renderer==='paper-fiber'||renderer==='chalk'||renderer==='watercolor-granulation'||renderer==='stipple'||renderer==='metallic'){for(let i=0;i<Math.round(size*size*(renderer==='stipple'?.012:.006)*intensity);i++){x.fillStyle=renderer==='metallic'?(Math.random()>.5?'rgba(255,255,255,.55)':'rgba(0,0,0,.32)'):rgba(.18+Math.random()*.52);const r=.4+Math.random()*(renderer==='chalk'?2.2:1.3);x.beginPath();x.arc(Math.random()*size,Math.random()*size,r,0,Math.PI*2);x.fill();}}
      else if(renderer==='marker'||renderer==='acrylic'||renderer==='impasto'||renderer==='dry'){x.translate(size/2,size/2);x.rotate(angle);x.translate(-size/2,-size/2);for(let i=-size;i<size*2;i+=renderer==='impasto'?8:5){x.strokeStyle=rgba(renderer==='dry'?.25:.46);x.lineWidth=renderer==='impasto'?3:1.4;x.setLineDash(renderer==='dry'?[5,7]:[]);x.beginPath();x.moveTo(-size,i);x.lineTo(size*2,i+Math.sin(i)*3);x.stroke();}}
      else if(renderer==='crosshatch'){for(const a of [angle,angle+Math.PI/2]){x.save();x.translate(size/2,size/2);x.rotate(a);x.translate(-size/2,-size/2);x.strokeStyle=rgba(.5);for(let i=-size;i<size*2;i+=8){x.beginPath();x.moveTo(-size,i);x.lineTo(size*2,i);x.stroke();}x.restore();}}
      else {const g=x.createRadialGradient(size*.35,size*.35,1,size*.5,size*.5,size*.7);g.addColorStop(0,rgba(renderer==='fluorescent'?.88:.62));g.addColorStop(.6,rgba(.25));g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,size,size);}x.restore();return c;};
    const applyTexture=(fillBase)=>{const t=find(textures,tsel.value),layer=getActiveLayer();if(!t||!layer)return;pushHistory(fillBase?'fill programmed texture':'overlay programmed texture');const tile=textureTile(t,fillBase);const pattern=layer.ctx.createPattern(tile,'repeat');layer.ctx.save();layer.ctx.globalCompositeOperation='source-over';layer.ctx.fillStyle=pattern;layer.ctx.fillRect(0,0,state.width,state.height);layer.ctx.restore();renderLayers();status(`${t.name} ${fillBase?'filled':'overlaid'} on active layer.`);};
    $('overlayProgramTextureBtn')?.addEventListener('click',()=>applyTexture(false)); $('fillProgramTextureBtn')?.addEventListener('click',()=>applyTexture(true)); update();
  }


  function snapCoordinate(value) {
    if (!state.map?.snap) return value;
    const cell = Math.max(1, Number(state.map.grid?.cellSize) || 48);
    return Math.round(value / cell) * cell;
  }

  function mapTextureOptions(extra = {}) {
    return { size: state.map.brushSize, scale: state.map.textureScale, opacity: state.map.textureOpacity, angle: state.map.textureAngle, seed: 1, ...extra };
  }

  function paintMapTexture(ctx, from, to) {
    if (!MAP_ENGINE) return;
    MAP_ENGINE.paintTextureStroke(ctx, from, to, state.map.textureId, mapTextureOptions({ blend: state.brush.blend || 'source-over' }));
  }

  function renderMapGrid() {
    if (!MAP_ENGINE || !els.mapGridCanvas) return;
    MAP_ENGINE.drawGrid(els.mapGridCanvas.getContext('2d'), state.width, state.height, state.map.grid);
  }

  function renderLighting(time = performance.now()) {
    if (!MAP_ENGINE || !els.lightingCanvas) return;
    MAP_ENGINE.drawLighting(els.lightingCanvas.getContext('2d'), state.width, state.height, state.lighting, time);
  }

  function getActiveLight() { return state.lighting.lights.find((light) => light.id === state.activeLightId) || null; }
  function getActiveSound() { return state.sounds.find((sound) => sound.id === state.activeSoundId) || null; }

  function syncMapInputsFromState() {
    if (!inputs.mapTexture) return;
    inputs.mapTexture.value = state.map.textureId;
    inputs.mapBrushSize.value = String(Math.round(state.map.brushSize));
    inputs.mapTextureScale.value = String(Math.round(state.map.textureScale * 100));
    inputs.mapTextureOpacity.value = String(Math.round(state.map.textureOpacity * 100));
    inputs.mapTextureAngle.value = String(Math.round(state.map.textureAngle));
    inputs.mapGridPreset.value = state.map.grid.preset;
    inputs.mapGridStyle.value = state.map.grid.style;
    inputs.mapGridSize.value = String(Math.round(state.map.grid.cellSize));
    inputs.mapGridOpacity.value = String(Math.round(state.map.grid.opacity * 100));
    inputs.mapGridColor.value = state.map.grid.color;
    inputs.mapGridEnabled.checked = state.map.grid.enabled !== false;
    inputs.mapGridExport.checked = state.map.grid.export !== false;
    inputs.mapSnap.checked = state.map.snap !== false;
    $('mapBrushSizeOut').textContent = String(Math.round(state.map.brushSize));
    $('mapTextureScaleOut').textContent = String(Math.round(state.map.textureScale * 100));
    $('mapTextureOpacityOut').textContent = String(Math.round(state.map.textureOpacity * 100));
    $('mapTextureAngleOut').textContent = String(Math.round(state.map.textureAngle));
    $('mapGridSizeOut').textContent = String(Math.round(state.map.grid.cellSize));
    $('mapGridOpacityOut').textContent = String(Math.round(state.map.grid.opacity * 100));
    updateMapTexturePreview(); syncLightInputs(); syncSoundInputs();
  }

  function updateMapTexturePreview() {
    if (!MAP_ENGINE || !els.mapTexturePreview) return;
    MAP_ENGINE.renderTexturePreview(els.mapTexturePreview, state.map.textureId, mapTextureOptions());
    const preset = MAP_ENGINE.getPreset(state.map.textureId);
    $('mapTextureSourceInfo').textContent = `${preset.name} · CSS/JavaScript procedural replacement for ${preset.sourceName}.`;
  }

  function addLight(type = 'point') {
    const light = { id: uid('light'), type, name: `${titleCase(type)} Light`, x: snapCoordinate(state.width / 2), y: snapCoordinate(state.height / 2), color: type === 'cone' ? '#B7D8FF' : '#FFD27A', intensity: .8, radius: type === 'area' ? 360 : 280, softness: .65, rotation: 0, angle: 70, width: 520, height: 320, pulse: false, flicker: false, enabled: true };
    pushHistory(`add ${type} light`); state.lighting.lights.push(light); state.activeLightId = light.id; syncLightInputs(); renderLighting(); renderLightHandles(); state.project.dirty = true; updateProjectHeading();
  }

  function deleteActiveLight() {
    const index = state.lighting.lights.findIndex((light) => light.id === state.activeLightId); if (index < 0) return;
    pushHistory('delete light'); state.lighting.lights.splice(index, 1); state.activeLightId = state.lighting.lights[Math.min(index, state.lighting.lights.length - 1)]?.id || null; syncLightInputs(); renderLighting(); renderLightHandles();
  }

  function syncLightInputs() {
    if (!inputs.lightingEnabled) return;
    inputs.lightingEnabled.checked = state.lighting.enabled !== false; inputs.ambientColor.value = state.lighting.ambientColor; inputs.ambientDarkness.value = String(Math.round(state.lighting.darkness * 100)); $('ambientDarknessOut').textContent = String(Math.round(state.lighting.darkness * 100));
    const l = getActiveLight();
    for (const input of [inputs.lightName, inputs.lightColor, inputs.lightIntensity, inputs.lightRadius, inputs.lightSoftness, inputs.lightRotation, inputs.lightAngle, inputs.lightPulse, inputs.lightFlicker, inputs.lightEnabled].filter(Boolean)) input.disabled = !l;
    if (l) { inputs.lightName.value=l.name;inputs.lightColor.value=l.color;inputs.lightIntensity.value=Math.round(l.intensity*100);inputs.lightRadius.value=Math.round(l.radius);inputs.lightSoftness.value=Math.round(l.softness*100);inputs.lightRotation.value=Math.round(l.rotation||0);inputs.lightAngle.value=Math.round(l.angle||70);inputs.lightPulse.checked=!!l.pulse;inputs.lightFlicker.checked=!!l.flicker;inputs.lightEnabled.checked=l.enabled!==false;$('lightIntensityOut').textContent=String(Math.round(l.intensity*100));$('lightRadiusOut').textContent=String(Math.round(l.radius));$('lightSoftnessOut').textContent=String(Math.round(l.softness*100));$('lightRotationOut').textContent=String(Math.round(l.rotation||0));$('lightAngleOut').textContent=String(Math.round(l.angle||70)); }
    renderLightList();
  }

  function updateActiveLightFromInputs() {
    const l=getActiveLight();if(!l)return;l.name=inputs.lightName.value||'Map Light';l.color=inputs.lightColor.value;l.intensity=Number(inputs.lightIntensity.value)/100;l.radius=Number(inputs.lightRadius.value);l.softness=Number(inputs.lightSoftness.value)/100;l.rotation=Number(inputs.lightRotation.value);l.angle=Number(inputs.lightAngle.value);l.pulse=inputs.lightPulse.checked;l.flicker=inputs.lightFlicker.checked;l.enabled=inputs.lightEnabled.checked;state.project.dirty=true;updateProjectHeading();syncLightInputs();renderLighting();renderLightHandles();
  }

  function renderLightList() {
    if(!els.lightList)return;els.lightList.innerHTML='';for(const l of state.lighting.lights){const b=document.createElement('button');b.type='button';b.className=l.id===state.activeLightId?'active':'';const sw=document.createElement('span');sw.className='light-swatch';sw.style.color=l.color;sw.style.background=l.color;const name=document.createElement('span');name.textContent=l.name;const type=document.createElement('small');type.textContent=l.type;b.append(sw,name,type);b.addEventListener('click',()=>{state.activeLightId=l.id;syncLightInputs();renderLightHandles();});els.lightList.appendChild(b);}
  }

  function renderLightHandles() {
    if(!els.lightHandleLayer)return;els.lightHandleLayer.innerHTML='';for(const l of state.lighting.lights){const b=document.createElement('button');b.type='button';b.className=`light-handle${l.id===state.activeLightId?' active':''}${l.enabled===false?' disabled':''}`;b.dataset.lightId=l.id;b.dataset.type=l.type;b.style.left=`${l.x}px`;b.style.top=`${l.y}px`;b.style.color=l.color;b.title=l.name;b.addEventListener('pointerdown',(ev)=>dragMapMarker(ev,l,'light'));b.addEventListener('click',(ev)=>{ev.preventDefault();state.activeLightId=l.id;syncLightInputs();renderLightHandles();});els.lightHandleLayer.appendChild(b);}
  }

  function stopAllSounds() { for (const audio of state.soundPlayers.values()) { try { audio.pause(); audio.currentTime=0; } catch (err) {} } state.soundPlayers.clear(); document.querySelectorAll('.sound-zone.playing').forEach((el)=>el.classList.remove('playing')); }

  function playActiveSound() { const s=getActiveSound();if(!s?.src)return;let a=state.soundPlayers.get(s.id);if(!a){a=new Audio(s.src);state.soundPlayers.set(s.id,a);}a.volume=clamp(s.volume??.7,0,1);a.loop=!!s.loop;a.currentTime=0;a.play().catch(()=>status('Your browser blocked audio preview until it receives a direct click.')); }

  async function importMapSounds(files) {
    for(const file of [...(files||[])]){if(!file.type.startsWith('audio/'))continue;const src=await readFileAsDataUrl(file);const s={id:uid('sound'),name:file.name.replace(/\.[^.]+$/,''),src,x:snapCoordinate(state.width/2),y:snapCoordinate(state.height/2),radius:180,volume:.7,loop:true,spatial:true,enabled:true,trigger:'click'};state.sounds.push(s);state.activeSoundId=s.id;}state.project.dirty=true;updateProjectHeading();syncSoundInputs();renderSoundZones();
  }

  function deleteActiveSound(){const i=state.sounds.findIndex(s=>s.id===state.activeSoundId);if(i<0)return;const a=state.soundPlayers.get(state.activeSoundId);a?.pause();state.soundPlayers.delete(state.activeSoundId);pushHistory('delete sound');state.sounds.splice(i,1);state.activeSoundId=state.sounds[Math.min(i,state.sounds.length-1)]?.id||null;syncSoundInputs();renderSoundZones();}

  function syncSoundInputs(){if(!inputs.soundName)return;const s=getActiveSound();for(const input of [inputs.soundName,inputs.soundRadius,inputs.soundVolume,inputs.soundLoop,inputs.soundSpatial,inputs.soundEnabled,inputs.soundTrigger].filter(Boolean))input.disabled=!s;if(s){inputs.soundName.value=s.name;inputs.soundRadius.value=Math.round(s.radius);inputs.soundVolume.value=Math.round(s.volume*100);inputs.soundLoop.checked=!!s.loop;inputs.soundSpatial.checked=s.spatial!==false;inputs.soundEnabled.checked=s.enabled!==false;inputs.soundTrigger.value=s.trigger||'click';$('soundRadiusOut').textContent=String(Math.round(s.radius));$('soundVolumeOut').textContent=String(Math.round(s.volume*100));}renderSoundList();}

  function updateActiveSoundFromInputs(){const s=getActiveSound();if(!s)return;s.name=inputs.soundName.value||'Map Sound';s.radius=Number(inputs.soundRadius.value);s.volume=Number(inputs.soundVolume.value)/100;s.loop=inputs.soundLoop.checked;s.spatial=inputs.soundSpatial.checked;s.enabled=inputs.soundEnabled.checked;s.trigger=inputs.soundTrigger.value;state.project.dirty=true;updateProjectHeading();syncSoundInputs();renderSoundZones();}

  function renderSoundList(){if(!els.soundList)return;els.soundList.innerHTML='';for(const s of state.sounds){const b=document.createElement('button');b.type='button';b.className=s.id===state.activeSoundId?'active':'';const icon=document.createElement('span');icon.textContent='♪';const name=document.createElement('span');name.textContent=s.name;const meta=document.createElement('small');meta.textContent=s.trigger||'click';b.append(icon,name,meta);b.addEventListener('click',()=>{state.activeSoundId=s.id;syncSoundInputs();renderSoundZones();});els.soundList.appendChild(b);}}

  function renderSoundZones(){if(!els.soundZoneLayer)return;els.soundZoneLayer.innerHTML='';for(const s of state.sounds){const b=document.createElement('button');b.type='button';b.className=`sound-zone${s.id===state.activeSoundId?' active':''}${s.enabled===false?' disabled':''}`;b.dataset.soundId=s.id;b.style.left=`${s.x}px`;b.style.top=`${s.y}px`;const d=Math.max(48,s.spatial===false?48:s.radius*2);b.style.width=`${d}px`;b.style.height=`${d}px`;b.title=s.name;b.addEventListener('pointerdown',(ev)=>dragMapMarker(ev,s,'sound'));b.addEventListener('click',(ev)=>{ev.preventDefault();state.activeSoundId=s.id;syncSoundInputs();renderSoundZones();if(s.trigger==='click')playActiveSound();});els.soundZoneLayer.appendChild(b);}}

  function dragMapMarker(ev,item,type){ev.preventDefault();ev.stopPropagation();const start={cx:ev.clientX,cy:ev.clientY,x:item.x,y:item.y};const move=(e)=>{item.x=snapCoordinate(start.x+(e.clientX-start.cx)/state.zoom);item.y=snapCoordinate(start.y+(e.clientY-start.cy)/state.zoom);type==='light'?renderLightHandles():renderSoundZones();if(type==='light')renderLighting();};const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);state.project.dirty=true;updateProjectHeading();};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});}

  function readFileAsDataUrl(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file);});}

  async function importMapAssets(files){for(const file of [...(files||[])]){if(!file.type.startsWith('image/')&&!/\.svg$/i.test(file.name))continue;const src=await readFileAsDataUrl(file);state.customAssets.push({id:uid('asset'),name:file.name.replace(/\.[^.]+$/,''),src});}state.project.dirty=true;updateProjectHeading();renderCustomAssetGrid();}

  function renderCustomAssetGrid(){if(!els.customAssetGrid)return;els.customAssetGrid.innerHTML='';for(const asset of state.customAssets){const b=document.createElement('button');b.type='button';b.title=`Place ${asset.name}`;const img=document.createElement('img');img.src=asset.src;img.alt='';const label=document.createElement('span');label.textContent=asset.name;b.append(img,label);b.addEventListener('click',()=>{pushHistory('place uploaded map asset');addImageObject(asset.src,asset.name);renderObjects();});els.customAssetGrid.appendChild(b);}if(!state.customAssets.length){const p=document.createElement('p');p.className='microcopy';p.textContent='Upload PNG, JPG, WEBP, GIF, or SVG map pieces here.';els.customAssetGrid.appendChild(p);}}

  function setupMapStudio(){
    if(!MAP_ENGINE||!inputs.mapTexture)return;
    const groups=new Map();for(const preset of MAP_ENGINE.presets){if(!groups.has(preset.group)){const g=document.createElement('optgroup');g.label=preset.group;groups.set(preset.group,g);inputs.mapTexture.appendChild(g);}const o=document.createElement('option');o.value=preset.id;o.textContent=preset.name;groups.get(preset.group).appendChild(o);}state.map.textureId=MAP_ENGINE.presets[0]?.id||state.map.textureId;
    for(const preset of MAP_ENGINE.gridPresets){const o=document.createElement('option');o.value=preset.id;o.textContent=preset.name;inputs.mapGridPreset.appendChild(o);}
    inputs.mapTexture.addEventListener('change',()=>{state.map.textureId=inputs.mapTexture.value;updateMapTexturePreview();state.project.dirty=true;updateProjectHeading();});
    for(const input of [inputs.mapBrushSize,inputs.mapTextureScale,inputs.mapTextureOpacity,inputs.mapTextureAngle])input.addEventListener('input',()=>{state.map.brushSize=Number(inputs.mapBrushSize.value);state.map.textureScale=Number(inputs.mapTextureScale.value)/100;state.map.textureOpacity=Number(inputs.mapTextureOpacity.value)/100;state.map.textureAngle=Number(inputs.mapTextureAngle.value);syncMapInputsFromState();});
    for(const input of [inputs.mapGridPreset,inputs.mapGridStyle,inputs.mapGridSize,inputs.mapGridOpacity,inputs.mapGridColor,inputs.mapGridEnabled,inputs.mapGridExport,inputs.mapSnap])input.addEventListener('input',()=>{state.map.grid.preset=inputs.mapGridPreset.value;state.map.grid.style=inputs.mapGridStyle.value;state.map.grid.cellSize=Number(inputs.mapGridSize.value);state.map.grid.opacity=Number(inputs.mapGridOpacity.value)/100;state.map.grid.color=inputs.mapGridColor.value;state.map.grid.enabled=inputs.mapGridEnabled.checked;state.map.grid.export=inputs.mapGridExport.checked;state.map.snap=inputs.mapSnap.checked;syncMapInputsFromState();renderMapGrid();state.project.dirty=true;updateProjectHeading();});
    $('fillMapTextureBtn')?.addEventListener('click',()=>{const l=getActiveLayer();if(!l)return;pushHistory('fill procedural map texture');l.ctx.clearRect(0,0,state.width,state.height);MAP_ENGINE.fillTexture(l.ctx,state.width,state.height,state.map.textureId,mapTextureOptions());renderLayers();});
    $('overlayMapTextureBtn')?.addEventListener('click',()=>{const l=getActiveLayer();if(!l)return;pushHistory('overlay procedural map texture');MAP_ENGINE.fillTexture(l.ctx,state.width,state.height,state.map.textureId,mapTextureOptions({opacity:state.map.textureOpacity*.62,blend:'overlay'}));renderLayers();});
    $('newTerrainLayerBtn')?.addEventListener('click',()=>{pushHistory('new terrain layer');addLayer('Terrain Layer');setTool('mapTexture');});
    document.querySelectorAll('[data-map-size]').forEach(b=>b.addEventListener('click',()=>{const [w,h]=b.dataset.mapSize.split('x').map(Number);pushHistory('map canvas size');state.width=w;state.height=h;updateStageSize();fitCanvas();renderLayers();renderObjects();}));
    $('mapAssetImport')?.addEventListener('change',async(ev)=>{await importMapAssets(ev.target.files);ev.target.value='';});
    $('addPointLightBtn')?.addEventListener('click',()=>addLight('point'));$('addConeLightBtn')?.addEventListener('click',()=>addLight('cone'));$('addAreaLightBtn')?.addEventListener('click',()=>addLight('area'));$('deleteLightBtn')?.addEventListener('click',deleteActiveLight);
    for(const input of [inputs.lightingEnabled,inputs.ambientColor,inputs.ambientDarkness])input.addEventListener('input',()=>{state.lighting.enabled=inputs.lightingEnabled.checked;state.lighting.ambientColor=inputs.ambientColor.value;state.lighting.darkness=Number(inputs.ambientDarkness.value)/100;syncLightInputs();renderLighting();});
    for(const input of [inputs.lightName,inputs.lightColor,inputs.lightIntensity,inputs.lightRadius,inputs.lightSoftness,inputs.lightRotation,inputs.lightAngle,inputs.lightPulse,inputs.lightFlicker,inputs.lightEnabled])input.addEventListener('input',updateActiveLightFromInputs);
    $('mapSoundImport')?.addEventListener('change',async(ev)=>{await importMapSounds(ev.target.files);ev.target.value='';});$('playSoundBtn')?.addEventListener('click',playActiveSound);$('stopSoundBtn')?.addEventListener('click',stopAllSounds);$('deleteSoundBtn')?.addEventListener('click',deleteActiveSound);
    for(const input of [inputs.soundName,inputs.soundRadius,inputs.soundVolume,inputs.soundLoop,inputs.soundSpatial,inputs.soundEnabled,inputs.soundTrigger])input.addEventListener('input',updateActiveSoundFromInputs);
    syncMapInputsFromState();renderCustomAssetGrid();
  }

  function startLightingAnimation(){let last=0;const tick=(time)=>{if(time-last>45&&(state.lighting.lights.some(l=>l.pulse||l.flicker))){renderLighting(time);last=time;}requestAnimationFrame(tick);};requestAnimationFrame(tick);}

  function setupObjectEvents() {
    const bind = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
    bind('addTextObjectBtn', () => { pushHistory('add text object'); addTextObject(); });
    bind('addShapeObjectBtn', () => { pushHistory('add shape object'); addShapeObject(); });
    bind('duplicateObjectBtn', duplicateObject); bind('deleteObjectBtn', () => deleteObject());
    bind('objectUpBtn', () => moveObject(1)); bind('objectDownBtn', () => moveObject(-1));
    bind('flipObjectHBtn', () => flipObject('x')); bind('flipObjectVBtn', () => flipObject('y'));
    bind('rasterizeObjectBtn', rasterizeSelectedObject);
    bind('rotateLayerBtn', () => transformActiveLayer('rotate')); bind('flipLayerHBtn', () => transformActiveLayer('flipH')); bind('flipLayerVBtn', () => transformActiveLayer('flipV'));
    bind('pinBackgroundBtn', () => { state.pinBackground = !state.pinBackground; $('pinBackgroundBtn').setAttribute('aria-pressed', String(state.pinBackground)); status(`Background pin ${state.pinBackground ? 'on' : 'off'}.`); });
    ['boldBtn','italicBtn','underlineBtn','strikeBtn'].forEach((id) => { const el = $(id); if (!el) return; el.addEventListener('click', () => { const map = { boldBtn:'bold', italicBtn:'italic', underlineBtn:'underline', strikeBtn:'strike' }; const key = map[id]; state.textStyle[key] = !state.textStyle[key]; el.setAttribute('aria-pressed', String(state.textStyle[key])); updateSelectedObjectFromInputs(); }); });
    if (els.assetCategory) els.assetCategory.addEventListener('change', renderAssetGrid);
    if (els.assetSearch) els.assetSearch.addEventListener('input', renderAssetGrid);
    if (inputs.overlayImport) inputs.overlayImport.addEventListener('change', importOverlayImage);
  }

  function importOverlayImage(ev) {
    const file = ev.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => addImageObject(reader.result, `Overlay ${file.name.slice(0, 24)}`); reader.readAsDataURL(file); ev.target.value = '';
  }

  function importImage(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        pushHistory('import image');
        const layer = addLayer(`Imported ${file.name.slice(0, 22)}`);
        const scale = Math.min(state.width / img.width, state.height / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        layer.ctx.drawImage(img, (state.width - w) / 2, (state.height - h) / 2, w, h);
        renderLayers();
        status(`Imported ${file.name}.`);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    ev.target.value = '';
  }

  function importProjectFile(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try { await loadProject(JSON.parse(reader.result)); }
      catch (err) { status(`Project import failed: ${err.message}`); }
    };
    reader.readAsText(file);
    ev.target.value = '';
  }

  function keydown(ev) {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (['input','select','textarea'].includes(tag)) return;
    const mod = ev.ctrlKey || ev.metaKey;
    if (mod && ev.key.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); }
    else if (ev.key === '[') { inputs.size.value = String(clamp(Number(inputs.size.value) - 2, 1, 240)); updateOutputLabels(); }
    else if (ev.key === ']') { inputs.size.value = String(clamp(Number(inputs.size.value) + 2, 1, 240)); updateOutputLabels(); }
    else if (ev.key.toLowerCase() === 'g') setTool('graffiti');
    else if (ev.key.toLowerCase() === 's') setTool('spray');
    else if (ev.key.toLowerCase() === 'e') setTool('eraser');
    else if (ev.key.toLowerCase() === 'v') setTool('shape');
  }

  async function init() {
    drawColorDisc();
    renderSwatches();
    setupSimplePanels();
    setupMovablePalette();
    document.getElementById('clearPreviewBtn')?.addEventListener('click', clearPreview);
    setupProgrammedTools();
    setupStaticEffects();
    setupMapStudio();
    setupObjectEvents();
    loadAssetLibrary();
    renderEmojiGrid();
    attachEvents();
    setColor('#00FFFF');
    addLayer('Sketch Layer');
    addLayer('Design Layer');
    updateStageSize();
    const restored = false;
    if (!restored) {
      state.background = { mode: 'transparent', color: '#FFFFFF' };
      state.activeLayerId = state.layers[1].id;
      renderLayers();
      setTimeout(fitCanvas, 80);
    }
    syncExtraInputsFromState();
    syncMapInputsFromState();
    applyCanvasBackground();
    updateOutputLabels();
    renderObjects(); renderMapGrid(); renderLighting(); renderLightHandles(); renderSoundZones(); renderCustomAssetGrid();
    startLightingAnimation();
    await initProjectLibrary();
    updateProjectHeading();
    await showProjectHome();
  }

  init();
})();
