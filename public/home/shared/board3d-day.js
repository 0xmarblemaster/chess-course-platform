// Chess Empire: scroll-driven 3D board, daylight theme (5b). three.js r165, self-hosted.
import * as THREE from './vendor/three.module.min.js';

const C = { gold: 0xC2A580, burg: 0x5F192B, white: 0xF5F5F5 };

function makeEnv(r) {
  const pm = new THREE.PMREMGenerator(r);
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 20), new THREE.MeshBasicMaterial({ color: 0x9a918c, side: THREE.BackSide }));
  room.position.y = 4; s.add(room);
  const panel = (w, h, x, y, z, rx, ry, k, col = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
  };
  panel(8, 4, 0, 9.5, 0, Math.PI / 2, 0, 8);
  panel(6, 6, 0, 4, 9.5, 0, Math.PI, 3, 0xfff6ea);
  panel(2, 8, -9.5, 4, 0, 0, Math.PI / 2, 4);
  panel(2, 8, 9.5, 4, 2, 0, -Math.PI / 2, 3, 0xfff1dc);
  panel(10, 3, 0, 3, -9.5, 0, 0, 2.2);
  const t = pm.fromScene(s, 0.03).texture; pm.dispose(); return t;
}

const mats = (flat) => ({
  gold: new THREE.MeshPhysicalMaterial({ color: C.gold, metalness: 1, roughness: 0.22, flatShading: flat }),
  burg: new THREE.MeshPhysicalMaterial({ color: C.burg, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06, flatShading: flat }),
  white: new THREE.MeshPhysicalMaterial({ color: C.white, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.15, flatShading: flat }),
});

const V = (a) => a.map(([x, y]) => new THREE.Vector2(x, y));

function piece(type, mat, flat) {
  const seg = flat ? 8 : 64;
  const g = new THREE.Group();
  const add = (geo, y = 0, x = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const lathe = (p) => new THREE.LatheGeometry(V(p), seg);
  const sph = (r) => new THREE.SphereGeometry(r, flat ? 8 : 48, flat ? 6 : 32);
  const base = [[0, 0], [.42, 0], [.42, .07], [.37, .11], [.37, .15], [.30, .20]];
  switch (type) {
    case 'p':
      add(lathe([[0, 0], [.40, 0], [.40, .07], [.35, .11], [.35, .15], [.28, .19], [.20, .27], [.15, .42], [.13, .56], [.21, .59], [.21, .63], [.12, .66], [0, .66]]));
      add(sph(.17), .80); break;
    case 'r':
      add(lathe([...base, [.24, .30], [.22, .70], [.28, .76], [.31, .80], [.31, .92], [0, .92]]));
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; const m = add(new THREE.BoxGeometry(.17, .13, .1), .985, Math.cos(a) * .25, Math.sin(a) * .25); m.rotation.y = -(a + Math.PI / 2); }
      break;
    case 'b':
      add(lathe([...base, [.19, .29], [.14, .60], [.12, .80], [.22, .83], [.22, .87], [.12, .90], [.16, .98], [.19, 1.08], [.18, 1.18], [.13, 1.28], [.06, 1.36], [0, 1.39]]));
      add(sph(.055), 1.43); break;
    case 'q':
      add(lathe([[0, 0], [.45, 0], [.45, .07], [.40, .11], [.40, .16], [.32, .21], [.21, .33], [.15, .80], [.13, 1.00], [.25, 1.04], [.25, 1.08], [.14, 1.12], [.18, 1.22], [.27, 1.40], [.21, 1.41], [.13, 1.46], [0, 1.48]]));
      add(sph(.075), 1.56);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; add(sph(.04), 1.42, Math.cos(a) * .25, Math.sin(a) * .25); }
      break;
    case 'k':
      add(lathe([[0, 0], [.46, 0], [.46, .07], [.41, .11], [.41, .16], [.33, .21], [.22, .33], [.16, .86], [.14, 1.08], [.26, 1.12], [.26, 1.16], [.15, 1.20], [.19, 1.30], [.26, 1.46], [.16, 1.50], [0, 1.53]]));
      add(new THREE.BoxGeometry(.08, .34, .08), 1.72); add(new THREE.BoxGeometry(.26, .08, .08), 1.76); break;
    case 'n': {
      add(lathe([...base, [.27, .26], [0, .26]]));
      const pts = [[-.24, .24], [.26, .24], [.20, .45], [.10, .60], [.18, .70], [.36, .78], [.40, .90], [.30, 1.00], [.12, 1.08], [.02, 1.20], [-.04, 1.12], [-.14, 1.08], [-.24, .95], [-.28, .70], [-.26, .45]];
      const sh = new THREE.Shape(); sh.moveTo(...pts[0]); pts.slice(1).forEach(p => sh.lineTo(...p));
      const eg = new THREE.ExtrudeGeometry(sh, { depth: .24, bevelEnabled: true, bevelSize: .04, bevelThickness: .05, bevelSegments: flat ? 1 : 4, curveSegments: 1 });
      eg.translate(0, 0, -.12); add(eg); break;
    }
  }
  return g;
}

function board(m, dk = m.burg, lt = m.white) {
  const g = new THREE.Group();
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(1, .12, 1), (i + j) % 2 === 1 ? dk : lt);
    t.position.set(i - 3.5, -.06, j - 3.5); t.receiveShadow = true; g.add(t);
  }
  const f = new THREE.Mesh(new THREE.BoxGeometry(8.7, .16, 8.7), dk); f.position.y = -.1; f.receiveShadow = true; g.add(f);
  const inlay = new THREE.Mesh(new THREE.BoxGeometry(8.16, .13, 8.16), m.gold); inlay.position.y = -.075; g.add(inlay);
  return g;
}

function lights(scene, { x = 4, y = 8, z = 5, k = 2.2, size = 6, ground = 0xE8DCCB } = {}) {
  scene.add(new THREE.HemisphereLight(0xffffff, ground, .35));
  const d = new THREE.DirectionalLight(0xfff4e6, k); d.position.set(x, y, z); d.castShadow = true;
  d.shadow.mapSize.set(2048, 2048);
  Object.assign(d.shadow.camera, { left: -size, right: size, top: size, bottom: -size, near: .5, far: 40 });
  d.shadow.bias = -.0004; d.shadow.normalBias = .02; d.shadow.radius = 6;
  scene.add(d); return d;
}

function catcher(scene, op = .14, y = 0) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: op }));
  p.rotation.x = -Math.PI / 2; p.position.y = y; p.receiveShadow = true; scene.add(p);
}

const sq2xz = (sq) => [sq.charCodeAt(0) - 97 - 3.5, 3.5 - (+sq[1] - 1)];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function mountSite(canvas, hud, theme) {
  const small = Math.min(innerWidth, innerHeight) < 600;
  const r = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(devicePixelRatio, small ? 1 : 1.5));
  r.toneMapping = THREE.NeutralToneMapping;
  // light and pieces only change with scroll progress, so the shadow map is redrawn on demand (see step)
  r.shadowMap.enabled = true; r.shadowMap.type = small ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap; r.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene(); scene.environment = makeEnv(r);
  const P = BOARDS[theme] || BOARDS['3b'];
  if (!P.day) scene.fog = new THREE.Fog(P.fog, 13, 26);
  const m = mats(false);
  { const dk = mk(P.dkKind || 'lacq', P.dk), lt = mk('matte', P.lt), fr = mk(P.frameKind || 'lacq', P.frame); const g = new THREE.Group();
    for (let i = 0; i < 8; i++) for (let k = 0; k < 8; k++) { const t = new THREE.Mesh(new THREE.BoxGeometry(1, .12, 1), (i + k) % 2 === 1 ? dk : lt); t.position.set(i - 3.5, -.06, k - 3.5); t.receiveShadow = true; t.castShadow = !!P.day; g.add(t); }
    const f = new THREE.Mesh(new THREE.BoxGeometry(8.7, .16, 8.7), fr); f.position.y = -.1; f.receiveShadow = true; f.castShadow = !!P.day; g.add(f);
    if (P.inlay) { const inl = new THREE.Mesh(new THREE.BoxGeometry(8.16, .13, 8.16), m.gold); inl.position.y = -.075; g.add(inl); }
    scene.add(g); if (P.day) catcher(scene, .16, -.2); }
  const nearM = mk(...P.near), farM = mk(...P.far);
  const cam = new THREE.PerspectiveCamera(32, 1, .1, 100);
  const at = {};
  const place = (type, sq, mat, side) => { const p = piece(type, mat); p.scale.setScalar(.78); const [x, z] = sq2xz(sq); p.position.set(x, 0, z); if (type === 'n') p.rotation.y = side * Math.PI / 2; scene.add(p); at[sq] = p; };
  [['r', 'a1'], ['n', 'b1'], ['b', 'c1'], ['q', 'd1'], ['k', 'e1'], ['r', 'h1'], ['b', 'c4'], ['n', 'f3'], ['p', 'e4'], ...'abcdfgh'.split('').map(f => ['p', f + '2'])].forEach(([t, s]) => place(t, s, nearM, 1));
  [['r', 'a8'], ['b', 'c8'], ['q', 'd8'], ['k', 'e8'], ['b', 'f8'], ['n', 'g8'], ['r', 'h8'], ['n', 'c6'], ['p', 'e5'], ...'abcdfgh'.split('').map(f => ['p', f + '7'])].forEach(([t, s]) => place(t, s, farM, -1));
  { const L = lights(scene, P.day ? { x: -4, y: 11, z: 7, k: 2.1, size: 6.2, ground: P.ground } : { x: 5, y: 10, z: 6, k: 2.4, size: 6.2, ground: 0x5F192B });
    L.shadow.bias = -.0002; L.shadow.normalBias = .015; L.shadow.camera.near = 4; L.shadow.camera.far = 24; L.shadow.camera.updateProjectionMatrix(); if (small) L.shadow.mapSize.set(1024, 1024); }
  // Giuoco Pianissimo continuation, one half-move per scroll window
  const game = [
    ['3… Bc5', [['f8', 'c5']]], ['4. c3', [['c2', 'c3']]], ['4… Nf6', [['g8', 'f6']]], ['5. d3', [['d2', 'd3']]],
    ['5… d6', [['d7', 'd6']]], ['6. O-O', [['e1', 'g1'], ['h1', 'f1']]], ['6… O-O', [['e8', 'g8'], ['h8', 'f8']]],
    ['7. Re1', [['f1', 'e1']]], ['7… a6', [['a7', 'a6']]], ['8. Bb3', [['c4', 'b3']]],
  ];
  const tracks = []; const occ = { ...at };
  const p0 = .1, p1 = .9, w = (p1 - p0) / game.length;
  game.forEach(([label, mv], i) => mv.forEach(([f, t]) => { const obj = occ[f]; delete occ[f]; occ[t] = obj; tracks.push({ obj, a: sq2xz(f), b: sq2xz(t), s: p0 + i * w, e: p0 + i * w + w * .7, first: !tracks.some(k => k.obj === obj) }); }));
  const keys = [
    [0, .55, 11, 4.6, 1], [.14, 1.25, 8.2, 2.4, 0], [.4, 2.3, 9, 3.6, 0], [.7, 3.5, 9.5, 5.2, 0], [1, 4.6, 7, 12, 0],
  ];
  let mx = 0, my = 0, tx = 0, ty = 0;
  const move = (e) => { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; wake(); };
  addEventListener('pointermove', move);
  const clock = new THREE.Clock(); let raf = 0, lastLabel = null, prog = 0, shadowProg = -1, dirty = true, shown = true, lastStep = performance.now();
  let W = 1, H = 1;
  const size = () => { const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; if (!w || !h) return; W = w; H = h; r.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); dirty = true; wake(); };
  addEventListener('resize', size); const ro = new ResizeObserver(size); ro.observe(canvas); size();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const step = (snap) => {
    if (!canvas.width || !canvas.height || canvas.clientWidth !== W) size();
    const t = reduce ? 0 : clock.getElapsedTime();
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const target = Math.min(1, scrollY / max);
    // easing is tuned per 60 fps frame; scale it by real elapsed time so slow devices settle in fewer frames
    const now = performance.now(), dt = Math.min(100, now - lastStep) / 16.7; lastStep = now;
    prog = snap ? target : prog + (target - prog) * (1 - Math.pow(.88, dt));
    const e = 1 - Math.pow(.95, dt); mx += (tx - mx) * e; my += (ty - my) * e;
    let k = 0; while (k < keys.length - 2 && prog > keys[k + 1][0]) k++;
    const [pa, aa, ra, ya, oa] = keys[k], [pb, ab, rb, yb, ob] = keys[k + 1];
    const u = sstep(pa, pb, prog);
    const idle = Math.sin(t * .08) * .3 * (1 - sstep(0, .12, prog));
    const ang = aa + (ab - aa) * u + idle + mx * .2, rad = ra + (rb - ra) * u, y = ya + (yb - ya) * u - my * .6;
    cam.position.set(Math.sin(ang) * rad, y, Math.cos(ang) * rad); cam.lookAt(0, 0, 0);
    const off = oa + (ob - oa) * u;
    if (W > 760 && off > .001) cam.setViewOffset(W, H, -W * .34 * off, H * .03 * off, W, H); else cam.clearViewOffset();
    let label = '3. Bc4';
    // a piece's later moves (h1 rook: O-O then Re1) only take over once their window starts
    tracks.forEach(({ obj, a, b, s, e, first }) => { if (!first && prog < s) return; const q = sstep(s, e, prog); obj.position.set(a[0] + (b[0] - a[0]) * q, Math.sin(Math.PI * q) * .55, a[1] + (b[1] - a[1]) * q); });
    game.forEach(([l], i) => { if (prog >= p0 + i * w + w * .5) label = l; });
    if (hud && label !== lastLabel) { hud.textContent = label; lastLabel = label; }
    if (prog !== shadowProg) { r.shadowMap.needsUpdate = true; shadowProg = prog; }
    r.render(scene, cam); dirty = false;
  };
  // The canvas is fixed behind the page and shows only where no opaque section covers it.
  // Sample the viewport; while fully covered (or the tab is hidden) nothing is drawn.
  // elementsFromPoint skips the canvas (pointer-events:none); a point is covered when any element stacked
  // there, other than html/body (which sit under the canvas), paints an opaque background
  const opaque = new WeakMap();
  const isOpaque = (el) => {
    if (!opaque.has(el)) { const c = getComputedStyle(el).backgroundColor.match(/[\d.]+/g); opaque.set(el, !!c && (c.length < 4 || +c[3] === 1)); }
    return opaque.get(el);
  };
  const covered = (x, y) => document.elementsFromPoint(x, y).some((el) => el !== document.body && el !== document.documentElement && isOpaque(el));
  const exposed = () => {
    for (const fy of [.15, .4, .65, .9]) for (const fx of [.2, .5, .8]) {
      if (!covered(innerWidth * fx, innerHeight * fy)) return true;
    }
    return false;
  };
  let lastR = 0;
  const frame = (now) => {
    raf = 0;
    if (document.hidden || !shown) return;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const moving = Math.abs(Math.min(1, scrollY / max) - prog) > 1e-4 || Math.abs(tx - mx) > 1e-3 || Math.abs(ty - my) > 1e-3;
    const drifting = !reduce && prog < .12; // idle camera sway, only near the top
    // the sway is slow, so 30 fps is enough for it; scroll and pointer get every frame
    if (moving || dirty || now - lastR >= 33) { step(false); lastR = now; }
    if (moving || drifting) raf = requestAnimationFrame(frame);
  };
  // hoisted: size() and move() can call it before frame is defined, so frame is looked up lazily
  function wake() { if (!raf) raf = requestAnimationFrame((t) => frame(t)); }
  let checking = false;
  const onScroll = () => {
    if (checking) return; checking = true;
    requestAnimationFrame(() => {
      checking = false;
      const was = shown; shown = exposed();
      // back from behind a section: jump to the current position instead of easing from a stale one
      if (shown && !was) step(true);
      wake();
    });
  };
  const onVis = () => { if (!document.hidden) wake(); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll); // layout changes move the sections over the canvas
  document.addEventListener('visibilitychange', onVis);
  // coverage is first measured a frame later, once the caller has added .has-3d (which opens the gaps)
  step(true); onScroll();
  return () => { cancelAnimationFrame(raf); removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); document.removeEventListener('visibilitychange', onVis); removeEventListener('pointermove', move); removeEventListener('resize', size); ro.disconnect(); r.dispose(); };
}

const BOARDS = {
  '3b': { fog: 0x42111D, dk: 0x5F192B, lt: 0xF5F5F5, frame: 0x5F192B, inlay: true, near: ['matte', 0xF5F5F5], far: ['metal', C.gold] },
  '4a': { fog: 0x42111D, dk: 0x5F192B, lt: 0xEBEBEB, frame: 0x5F192B, inlay: true, near: ['matte', 0xF5F5F5], far: ['metal', C.gold] },
  '4b': { day: true, ground: 0xEBEBEB, dk: 0x5F192B, lt: 0xFFFFFF, frame: 0x5F192B, inlay: true, near: ['matte', 0xF5F5F5], far: ['metal', C.gold] },
  '5a': { day: true, ground: 0xFFFFFF, dk: 0xC2A580, dkKind: 'lacq', lt: 0xFFFFFF, frame: 0x5F192B, inlay: false, near: ['matte', 0xF7F7F7], far: ['lacq', 0x5F192B] },
  '5b': { day: true, ground: 0xF4EEE6, dk: 0xC2A580, dkKind: 'lacq', lt: 0xF4EEE6, frame: 0x42111D, inlay: false, near: ['matte', 0xFBF6EC], far: ['lacq', 0x5F192B] },
  '5c': { fog: 0x42111D, dk: 0x5F192B, lt: 0xE6D5BC, frame: 0xE6D5BC, frameKind: 'matte', inlay: false, near: ['matte', 0xF5F5F5], far: ['satin', 0xD9C4A3] },
};
const mk = (kind, color) => {
  if (kind === 'metal') return new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: .22 });
  if (kind === 'satin') return new THREE.MeshPhysicalMaterial({ color, metalness: .55, roughness: .34, clearcoat: .4 });
  if (kind === 'lacq') return new THREE.MeshPhysicalMaterial({ color, roughness: .32, clearcoat: 1, clearcoatRoughness: .06 });
  return new THREE.MeshPhysicalMaterial({ color, roughness: .42, clearcoat: .5, clearcoatRoughness: .15 });
};


const canvas = document.getElementById('board3d');
const hud = document.getElementById('move-hud');
const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
if (canvas && webgl) {
  try { mountSite(canvas, hud, '5b'); document.documentElement.classList.add('has-3d'); }
  catch (e) { console.warn('3D board disabled', e); }
}
