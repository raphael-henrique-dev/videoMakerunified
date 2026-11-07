// Gerado automaticamente por scripts/build-3d-global.js a partir de motor/3d/*.js
(function (global) {
  "use strict";
  const exportsObj = {};

  // --- Módulo: math.js ---
// motor/3d/math.js — Matemática determinística, curvas de animação e helpers de malha/material

function criarRand(sementeInicial = 1234567) {
  let _seed = sementeInicial >>> 0;
  const fn = () => {
    _seed = (_seed * 1664525 + 1013904223) >>> 0;
    return _seed / 4294967296;
  };
  fn.reseed = (s) => {
    _seed = (s >>> 0) || 1;
  };
  return fn;
}

const rand = criarRand(1234567);

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * clamp(u);
const lerp3 = (a, b, u) => [
  lerp(a[0], b[0], u),
  lerp(a[1], b[1], u),
  lerp(a[2], b[2], u),
];
const faixa = (t, ini, fim) => clamp((t - ini) / Math.max(0.0001, fim - ini));

const suave = (u) => {
  const x = clamp(u);
  return x * x * (3 - 2 * x);
};

const suavissimo = (u) => {
  const x = clamp(u);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

const saiVolta = (u, s = 1.5) => {
  const x = clamp(u) - 1;
  return x * x * ((s + 1) * x + s) + 1;
};

const quica = (u) => {
  let x = clamp(u);
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
};

const pulso = (u) => Math.sin(clamp(u) * Math.PI);
const queda = (u) => {
  const x = clamp(u);
  return x * x;
};

function arredondarGeometrias(THREE, estilo = "padrao", ehWebGL = false) {
  if (!THREE) return;
  if (!THREE.__origGeos) {
    THREE.__origGeos = {
      Sphere: THREE.SphereGeometry,
      Cyl: THREE.CylinderGeometry,
      Cone: THREE.ConeGeometry,
      Torus: THREE.TorusGeometry,
    };
  }
  const { Sphere: OrigSphere, Cyl: OrigCyl, Cone: OrigCone, Torus: OrigTorus } = THREE.__origGeos;
  const ehLowPoly = estilo === "lowpoly";

  THREE.SphereGeometry = function (r = 1, w = 20, h = 16, ...rest) {
    if (ehLowPoly) {
      return new OrigSphere(r, Math.min(w, 9), Math.min(h, 7), ...rest);
    }
    if (!ehWebGL) {
      return new OrigSphere(r, Math.min(w, 16), Math.min(h, 12), ...rest);
    }
    return new OrigSphere(r, Math.max(w, 28), Math.max(h, 22), ...rest);
  };
  THREE.SphereGeometry.prototype = OrigSphere.prototype;

  THREE.CylinderGeometry = function (rt = 1, rb = 1, h = 1, rs = 16, ...rest) {
    if (ehLowPoly) {
      return new OrigCyl(rt, rb, h, Math.min(rs, 7), ...rest);
    }
    if (!ehWebGL) {
      return new OrigCyl(rt, rb, h, Math.min(rs, 16), ...rest);
    }
    return new OrigCyl(rt, rb, h, Math.max(rs, 28), ...rest);
  };
  THREE.CylinderGeometry.prototype = OrigCyl.prototype;

  THREE.ConeGeometry = function (r = 1, h = 1, rs = 16, ...rest) {
    if (ehLowPoly) {
      return new OrigCone(r, h, Math.min(rs, 6), ...rest);
    }
    if (!ehWebGL) {
      return new OrigCone(r, h, Math.min(rs, 14), ...rest);
    }
    return new OrigCone(r, h, Math.max(rs, 24), ...rest);
  };
  THREE.ConeGeometry.prototype = OrigCone.prototype;

  THREE.TorusGeometry = function (r = 1, t = 0.4, rs = 12, ts = 24, ...rest) {
    if (ehLowPoly) {
      return new OrigTorus(r, t, Math.min(rs, 7), Math.min(ts, 12), ...rest);
    }
    if (!ehWebGL) {
      return new OrigTorus(r, t, Math.min(rs, 12), Math.min(ts, 20), ...rest);
    }
    return new OrigTorus(r, t, Math.max(rs, 18), Math.max(ts, 36), ...rest);
  };
  THREE.TorusGeometry.prototype = OrigTorus.prototype;
}

function mat(THREE, cor, opts = {}) {
  const base = {
    color: cor,
    roughness: opts.roughness ?? 0.62,
    metalness: opts.metalness ?? 0.06,
  };
  if (opts.emissive !== undefined) {
    base.emissive = opts.emissive;
    base.emissiveIntensity = opts.emissiveIntensity ?? 0.35;
  }
  if (opts.transparent) {
    base.transparent = true;
    base.opacity = opts.opacity ?? 0.5;
  }
  if (opts.side !== undefined) base.side = opts.side;
  if (opts.vertexColors) base.vertexColors = true;
  return new THREE.MeshStandardMaterial(base);
}

function malha(THREE, geo, material, sombra = true) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = sombra;
  m.receiveShadow = sombra;
  return m;
}

function manchaSombra(THREE, raio = 0.7) {
  const g = new THREE.Group();
  const anel1 = new THREE.Mesh(
    new THREE.CircleGeometry(raio, 28),
    new THREE.MeshBasicMaterial({ color: 0x050a14, transparent: true, opacity: 0.28, depthWrite: false })
  );
  anel1.rotation.x = -Math.PI / 2;
  anel1.position.y = 0.015;
  const anel2 = new THREE.Mesh(
    new THREE.CircleGeometry(raio * 0.65, 24),
    new THREE.MeshBasicMaterial({ color: 0x02060d, transparent: true, opacity: 0.22, depthWrite: false })
  );
  anel2.rotation.x = -Math.PI / 2;
  anel2.position.y = 0.018;
  g.add(anel1, anel2);
  return g;
}


  // --- Módulo: lighting.js ---
// motor/3d/lighting.js — Céu procedural (shader GLSL + estrelas) e sistema de iluminação cinematográfica

const CEUS = {
  dia:     { topo: 0x2f7be5, meio: 0x7bc2ff, horizonte: 0xdff4ff, chao: 0x5da654, nevoa: 0x9bd3ff, dens: 0.012, solInt: 1.5, ambInt: 0.9, solCor: 0xfff5dc, estrelas: 0 },
  tarde:   { topo: 0x3b2d6e, meio: 0xe06d53, horizonte: 0xffc87a, chao: 0x5c4738, nevoa: 0xf49d6e, dens: 0.015, solInt: 1.4, ambInt: 0.75, solCor: 0xffb570, estrelas: 0.2 },
  noite:   { topo: 0x050816, meio: 0x0f1b38, horizonte: 0x1d3158, chao: 0x0c1322, nevoa: 0x0f1b38, dens: 0.016, solInt: 0.65, ambInt: 0.55, solCor: 0x9ec5ff, estrelas: 0.9 },
  mar:     { topo: 0x031124, meio: 0x072647, horizonte: 0x0c3b66, chao: 0x041220, nevoa: 0x06203d, dens: 0.020, solInt: 1.15, ambInt: 0.85, solCor: 0x6fd3ff, estrelas: 0 },
  abismo:  { topo: 0x01050c, meio: 0x041226, horizonte: 0x082342, chao: 0x020813, nevoa: 0x041226, dens: 0.022, solInt: 1.0, ambInt: 0.75, solCor: 0x38bdf8, estrelas: 0 },
  escuro:     { topo: 0x070a12, meio: 0x0f1626, horizonte: 0x192338, chao: 0x070a12, nevoa: 0x0f1626, dens: 0.014, solInt: 1.2, ambInt: 0.75, solCor: 0xdbeafe, estrelas: 0.3 },
  espaco:     { topo: 0x010206, meio: 0x040711, horizonte: 0x091024, chao: 0x010206, nevoa: 0x030610, dens: 0.005, solInt: 1.4, ambInt: 0.55, solCor: 0xffffff, estrelas: 1.0 },
  tempestade: { topo: 0x040711, meio: 0x0c1629, horizonte: 0x1e293b, chao: 0x060b14, nevoa: 0x0c1629, dens: 0.018, solInt: 0.95, ambInt: 0.7, solCor: 0x93c5fd, estrelas: 0.15 },
  calor:      { topo: 0x140707, meio: 0x2b110d, horizonte: 0x5c2112, chao: 0x120907, nevoa: 0x26100c, dens: 0.016, solInt: 1.55, ambInt: 0.85, solCor: 0xfdba74, estrelas: 0.1 },
};

function montarCeu(THREE, cena) {
  const domoMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      cTopo: { value: new THREE.Color(0x031124) },
      cMeio: { value: new THREE.Color(0x072647) },
      cHorizonte: { value: new THREE.Color(0x0c3b66) },
      cChao: { value: new THREE.Color(0x041220) },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 cTopo;
      uniform vec3 cMeio;
      uniform vec3 cHorizonte;
      uniform vec3 cChao;
      varying vec3 vPos;
      void main() {
        float h = normalize(vPos).y;
        vec3 col;
        if (h >= 0.0) {
          float u1 = smoothstep(0.0, 0.35, h);
          float u2 = smoothstep(0.25, 0.95, h);
          col = mix(cHorizonte, cMeio, u1);
          col = mix(col, cTopo, u2);
        } else {
          col = mix(cHorizonte, cChao, smoothstep(0.0, -0.45, h));
        }
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const domo = new THREE.Mesh(new THREE.SphereGeometry(140, 32, 24), domoMat);
  domo.renderOrder = -10;
  cena.add(domo);

  const nEstrelas = 280;
  const pos = new Float32Array(nEstrelas * 3);
  for (let i = 0; i < nEstrelas; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(0.1 + rand() * 0.88);
    const r = 120;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi);
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geoE = new THREE.BufferGeometry();
  geoE.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const matE = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.55,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const estrelas = new THREE.Points(geoE, matE);
  cena.add(estrelas);

  return { domo, domoMat, estrelas, matE };
}

function aplicarCeu(THREE, palco, presetNome = "mar") {
  const cfg = CEUS[presetNome] || CEUS.mar;
  const { cena, luzAmbiente, sol, ceu } = palco;
  if (ceu && ceu.domoMat) {
    ceu.domoMat.uniforms.cTopo.value.setHex(cfg.topo);
    ceu.domoMat.uniforms.cMeio.value.setHex(cfg.meio);
    ceu.domoMat.uniforms.cHorizonte.value.setHex(cfg.horizonte);
    ceu.domoMat.uniforms.cChao.value.setHex(cfg.chao);
    ceu.matE.opacity = cfg.estrelas;
  }
  cena.background = new THREE.Color(cfg.meio);
  cena.fog = new THREE.FogExp2(cfg.nevoa, cfg.dens);
  if (luzAmbiente) {
    luzAmbiente.color.setHex(cfg.horizonte);
    luzAmbiente.groundColor.setHex(cfg.chao);
    luzAmbiente.intensity = cfg.ambInt;
  }
  if (sol) {
    sol.color.setHex(cfg.solCor);
    sol.intensity = cfg.solInt;
  }
}

function montarLuzes(THREE, cena) {
  const luzAmbiente = new THREE.HemisphereLight(0xdff4ff, 0x203040, 0.9);
  cena.add(luzAmbiente);

  const sol = new THREE.DirectionalLight(0xfff5dc, 1.45);
  sol.position.set(10, 18, 12);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  sol.shadow.camera.near = 1;
  sol.shadow.camera.far = 60;
  const d = 16;
  sol.shadow.camera.left = -d;
  sol.shadow.camera.right = d;
  sol.shadow.camera.top = d;
  sol.shadow.camera.bottom = -d;
  sol.shadow.bias = -0.0005;
  cena.add(sol);

  const preenchimento = new THREE.DirectionalLight(0x60a5fa, 0.42);
  preenchimento.position.set(-10, 8, -6);
  cena.add(preenchimento);

  const contra = new THREE.DirectionalLight(0x7dd3fc, 0.55);
  contra.position.set(0, 10, -12);
  cena.add(contra);

  return { luzAmbiente, sol, preenchimento, contra };
}


  // --- Módulo: camera.js ---
// motor/3d/camera.js — Direção de câmera, interpolação de planos e projeção 3D -> 2D

const _alvoAtual = [0, 1.5, 0];

function mirar(camera, x, y, z) {
  _alvoAtual[0] = x;
  _alvoAtual[1] = y;
  _alvoAtual[2] = z;
  camera.lookAt(x, y, z);
}

function plano(camera, t, tIni, tFim, de, para, fnCurva = suavissimo) {
  const u = fnCurva(faixa(t, tIni, tFim));
  const p = lerp3(de.pos, para.pos, u);
  const a = lerp3(de.alvo, para.alvo, u);
  camera.position.set(p[0], p[1], p[2]);
  mirar(camera, a[0], a[1], a[2]);
}

function camRespira(camera, t, amp = 0.04) {
  camera.position.x += Math.sin(t * 1.35) * amp;
  camera.position.y += Math.cos(t * 1.05) * amp * 0.7;
  camera.lookAt(_alvoAtual[0], _alvoAtual[1], _alvoAtual[2]);
}

function tremer(camera, t, tIni, dur = 0.35, intensidade = 0.14) {
  if (t < tIni || t > tIni + dur) return;
  const env = pulso(faixa(t, tIni, tIni + dur));
  const ox = Math.sin(t * 68) * intensidade * env;
  const oy = Math.cos(t * 83) * intensidade * 0.8 * env;
  camera.position.x += ox;
  camera.position.y += oy;
  camera.lookAt(_alvoAtual[0] + ox * 0.5, _alvoAtual[1] + oy * 0.5, _alvoAtual[2]);
}

/**
 * Projeta uma coordenada 3D (THREE.Vector3 ou [x,y,z]) para pixels 2D (x, y) da tela (1080x1920).
 * Essencial para conectar leader lines SVG e rótulos HTML da camada 2D HyperFrames aos objetos 3D.
 */
function tela(THREE, ponto3D, camera, largura = 1080, altura = 1920) {
  const v = Array.isArray(ponto3D)
    ? new THREE.Vector3(ponto3D[0], ponto3D[1], ponto3D[2])
    : ponto3D.clone();
  camera.updateMatrixWorld();
  v.project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * largura,
    y: (-v.y * 0.5 + 0.5) * altura,
    visivel: v.z >= -1 && v.z <= 1,
  };
}


  // --- Módulo: character.js ---
// motor/3d/character.js — Mascote 3D articulado (menino de moletom azul) e sistema de atuação procedural

function criarBoneco(THREE, opcoes = {}) {
  const corCamisa = opcoes.camisa ?? 0x1e78d6;
  const corCalca = opcoes.calca ?? 0x26334d;
  const corPele = opcoes.pele ?? 0xffcfa8;
  const corCabelo = opcoes.cabelo ?? 0x2b1b12;
  const corSapato = opcoes.sapato ?? 0xd93829;
  const escala = opcoes.escala ?? 1;

  const raiz = new THREE.Group();
  raiz.scale.setScalar(escala);

  const mPele = mat(THREE, corPele, { roughness: 0.58 });
  const mBochecha = mat(THREE, 0xff8a7a, { roughness: 0.7, transparent: true, opacity: 0.45 });
  const mCamisa = mat(THREE, corCamisa, { roughness: 0.62 });
  const mPunho = mat(THREE, 0x1558a3, { roughness: 0.65 });
  const mCalca = mat(THREE, corCalca, { roughness: 0.72 });
  const mCabelo = mat(THREE, corCabelo, { roughness: 0.68 });
  const mSapato = mat(THREE, corSapato, { roughness: 0.48 });
  const mSola = mat(THREE, 0xf8fafc, { roughness: 0.5 });
  const mOlhoBranco = mat(THREE, 0xffffff, { roughness: 0.2 });
  const mIris = mat(THREE, 0x1d4ed8, { roughness: 0.25 });
  const mPreto = mat(THREE, 0x111827, { roughness: 0.3 });
  const mBrilho = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mMochila = mat(THREE, 0xe6951e, { roughness: 0.58 });
  const mAlca = mat(THREE, 0x9a5b13, { roughness: 0.68 });

  // Sombra no chão
  const sombra = manchaSombra(THREE, 0.62);
  raiz.add(sombra);

  const corpo = new THREE.Group();
  raiz.add(corpo);

  // Tronco (moletom)
  const tronco = malha(THREE, new THREE.CylinderGeometry(0.34, 0.38, 0.86, 28), mCamisa);
  tronco.position.y = 1.05;
  corpo.add(tronco);

  const ombros = malha(THREE, new THREE.SphereGeometry(0.35, 28, 20), mCamisa);
  ombros.position.y = 1.42;
  ombros.scale.set(1.06, 0.45, 0.88);
  corpo.add(ombros);

  const quadril = malha(THREE, new THREE.SphereGeometry(0.37, 28, 20), mCalca);
  quadril.position.y = 0.64;
  quadril.scale.set(1.0, 0.5, 0.9);
  corpo.add(quadril);

  // Capuz e bolso canguru
  const capuz = malha(THREE, new THREE.TorusGeometry(0.24, 0.075, 16, 28), mCamisa);
  capuz.position.set(0, 1.47, -0.05);
  capuz.rotation.x = Math.PI / 2 + 0.22;
  corpo.add(capuz);

  const bolso = malha(THREE, new THREE.BoxGeometry(0.38, 0.22, 0.12), mPunho);
  bolso.position.set(0, 0.84, 0.31);
  corpo.add(bolso);

  // Mochila amarela
  if (opcoes.mochila !== false) {
    const mochila = new THREE.Group();
    const corpoMochila = malha(THREE, new THREE.BoxGeometry(0.5, 0.58, 0.26), mMochila);
    corpoMochila.position.set(0, 1.12, -0.38);
    const topoMochila = malha(THREE, new THREE.CylinderGeometry(0.25, 0.25, 0.26, 24), mMochila);
    topoMochila.rotation.z = Math.PI / 2;
    topoMochila.position.set(0, 1.41, -0.38);
    const bolsoMochila = malha(THREE, new THREE.BoxGeometry(0.36, 0.26, 0.1), mAlca);
    bolsoMochila.position.set(0, 1.02, -0.52);
    mochila.add(corpoMochila, topoMochila, bolsoMochila);
    corpo.add(mochila);
  }

  // Pescoço e Cabeça
  const pescoco = malha(THREE, new THREE.CylinderGeometry(0.13, 0.15, 0.18, 20), mPele);
  pescoco.position.y = 1.54;
  corpo.add(pescoco);

  const cabeca = new THREE.Group();
  cabeca.position.set(0, 1.92, 0);
  corpo.add(cabeca);

  const cranio = malha(THREE, new THREE.SphereGeometry(0.42, 32, 28), mPele);
  cranio.scale.set(1.02, 0.98, 0.98);
  cabeca.add(cranio);

  // Orelhas e bochechas
  for (const s of [-1, 1]) {
    const orelha = malha(THREE, new THREE.SphereGeometry(0.095, 18, 16), mPele);
    orelha.position.set(s * 0.41, -0.02, -0.02);
    orelha.scale.set(0.6, 1.0, 0.8);
    cabeca.add(orelha);

    const bochecha = malha(THREE, new THREE.SphereGeometry(0.075, 16, 14), mBochecha, false);
    bochecha.position.set(s * 0.24, -0.08, 0.35);
    bochecha.scale.set(1.2, 0.75, 0.4);
    cabeca.add(bochecha);
  }

  const nariz = malha(THREE, new THREE.SphereGeometry(0.062, 18, 16), mPele);
  nariz.position.set(0, -0.02, 0.42);
  cabeca.add(nariz);

  // Cabelo estilizado com topete
  const cabeloGrp = new THREE.Group();
  const touca = malha(THREE, new THREE.SphereGeometry(0.44, 28, 24, 0, Math.PI * 2, 0, Math.PI * 0.58), mCabelo);
  touca.position.set(0, 0.04, -0.02);
  touca.rotation.x = -0.18;
  cabeloGrp.add(touca);

  const topete1 = malha(THREE, new THREE.ConeGeometry(0.14, 0.32, 18), mCabelo);
  topete1.position.set(0.06, 0.44, 0.22);
  topete1.rotation.set(0.55, 0, -0.25);
  const topete2 = malha(THREE, new THREE.ConeGeometry(0.11, 0.26, 18), mCabelo);
  topete2.position.set(-0.1, 0.42, 0.18);
  topete2.rotation.set(0.45, 0, 0.22);
  cabeloGrp.add(topete1, topete2);
  cabeca.add(cabeloGrp);

  // Olhos compostos (esclera + íris + pupila + brilho) e sobrancelhas
  const olhos = [];
  const sobrancelhas = [];
  for (const s of [-1, 1]) {
    const olhoGrp = new THREE.Group();
    olhoGrp.position.set(s * 0.15, 0.05, 0.37);

    const esclera = malha(THREE, new THREE.SphereGeometry(0.082, 20, 18), mOlhoBranco, false);
    esclera.scale.set(1.0, 1.12, 0.55);
    const iris = malha(THREE, new THREE.SphereGeometry(0.052, 18, 16), mIris, false);
    iris.position.z = 0.032;
    iris.scale.set(1.0, 1.05, 0.45);
    const pupila = malha(THREE, new THREE.SphereGeometry(0.032, 16, 14), mPreto, false);
    pupila.position.z = 0.048;
    pupila.scale.set(1.0, 1.0, 0.4);
    const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), mBrilho);
    brilho.position.set(0.018, 0.022, 0.062);

    olhoGrp.add(esclera, iris, pupila, brilho);
    cabeca.add(olhoGrp);
    olhos.push(olhoGrp);

    const sob = malha(THREE, new THREE.BoxGeometry(0.14, 0.032, 0.035), mCabelo, false);
    sob.position.set(s * 0.15, 0.19, 0.39);
    cabeca.add(sob);
    sobrancelhas.push(sob);
  }

  // Bocas intercambiáveis para expressões faciais
  const bocas = {};
  const bocaSorriso = malha(
    THREE,
    new THREE.TorusGeometry(0.085, 0.02, 14, 24, Math.PI),
    mPreto,
    false
  );
  bocaSorriso.position.set(0, -0.12, 0.39);
  bocaSorriso.rotation.x = Math.PI;
  cabeca.add(bocaSorriso);
  bocas.sorriso = bocaSorriso;

  const bocaTriste = malha(
    THREE,
    new THREE.TorusGeometry(0.075, 0.02, 14, 24, Math.PI),
    mPreto,
    false
  );
  bocaTriste.position.set(0, -0.17, 0.39);
  bocaTriste.visible = false;
  cabeca.add(bocaTriste);
  bocas.triste = bocaTriste;

  const bocaOh = malha(THREE, new THREE.SphereGeometry(0.065, 18, 16), mPreto, false);
  bocaOh.position.set(0, -0.14, 0.39);
  bocaOh.scale.set(0.95, 1.25, 0.45);
  bocaOh.visible = false;
  cabeca.add(bocaOh);
  bocas.oh = bocaOh;

  const bocaReta = malha(THREE, new THREE.BoxGeometry(0.12, 0.026, 0.03), mPreto, false);
  bocaReta.position.set(0, -0.14, 0.4);
  bocaReta.visible = false;
  cabeca.add(bocaReta);
  bocas.reta = bocaReta;

  // Boca articulada para lip-sync sincronizado com a narração (cavidade + dentes + língua)
  const bocaFala = new THREE.Group();
  bocaFala.position.set(0, -0.14, 0.395);
  bocaFala.visible = false;

  const cavidadeBoca = malha(
    THREE,
    new THREE.SphereGeometry(0.072, 18, 14),
    mPreto,
    false
  );
  cavidadeBoca.scale.set(1.08, 0.95, 0.38);

  const mLingua = mat(THREE, 0xf43f5e, { roughness: 0.4, emissive: 0xbe123c, emissiveIntensity: 0.25 });
  const linguaBoca = malha(
    THREE,
    new THREE.SphereGeometry(0.044, 14, 12),
    mLingua,
    false
  );
  linguaBoca.position.set(0, -0.022, 0.018);
  linguaBoca.scale.set(1.05, 0.55, 0.38);

  const mDentes = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const dentesBoca = malha(
    THREE,
    new THREE.BoxGeometry(0.076, 0.022, 0.02),
    mDentes,
    false
  );
  dentesBoca.position.set(0, 0.035, 0.02);

  bocaFala.add(cavidadeBoca, linguaBoca, dentesBoca);
  cabeca.add(bocaFala);
  bocas.fala = bocaFala;

  // Gota de suor procedural
  const gotaSuor = malha(
    THREE,
    new THREE.ConeGeometry(0.045, 0.13, 16),
    mat(THREE, 0x38bdf8, { roughness: 0.15, emissive: 0x0284c7, emissiveIntensity: 0.3 }),
    false
  );
  gotaSuor.position.set(0.36, 0.18, 0.25);
  gotaSuor.visible = false;
  cabeca.add(gotaSuor);

  // Capacete de obra / engenheiro
  const capaceteObra = new THREE.Group();
  const cascoObra = malha(
    THREE,
    new THREE.SphereGeometry(0.46, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mat(THREE, 0xfacc15, { roughness: 0.32, metalness: 0.12 })
  );
  cascoObra.position.y = 0.08;
  const abaObra = malha(
    THREE,
    new THREE.CylinderGeometry(0.49, 0.52, 0.05, 28),
    mat(THREE, 0xeab308, { roughness: 0.35 })
  );
  abaObra.position.set(0, 0.08, 0.05);
  capaceteObra.add(cascoObra, abaObra);
  capaceteObra.visible = false;
  cabeca.add(capaceteObra);

  // Capacete espacial / mergulho abissal
  const capaceteEspaco = new THREE.Group();
  const colarEsp = malha(
    THREE,
    new THREE.TorusGeometry(0.34, 0.06, 16, 28),
    mat(THREE, 0xe2e8f0, { roughness: 0.3, metalness: 0.5 })
  );
  colarEsp.rotation.x = Math.PI / 2;
  colarEsp.position.y = -0.32;
  const bolhaEsp = malha(
    THREE,
    new THREE.SphereGeometry(0.56, 32, 28),
    mat(THREE, 0x7dd3fc, { roughness: 0.1, transparent: true, opacity: 0.32 }),
    false
  );
  bolhaEsp.position.y = 0.04;
  capaceteEspaco.add(colarEsp, bolhaEsp);
  capaceteEspaco.visible = false;
  cabeca.add(capaceteEspaco);

  // Braços articulados
  function montarBraco(lado) {
    const ombro = new THREE.Group();
    ombro.position.set(lado * 0.42, 1.38, 0);
    const manga = malha(THREE, new THREE.CylinderGeometry(0.105, 0.095, 0.52, 20), mCamisa);
    manga.position.y = -0.24;
    const punho = malha(THREE, new THREE.CylinderGeometry(0.098, 0.098, 0.08, 20), mPunho);
    punho.position.y = -0.48;
    const mao = malha(THREE, new THREE.SphereGeometry(0.105, 20, 18), mPele);
    mao.position.y = -0.56;
    ombro.add(manga, punho, mao);
    corpo.add(ombro);
    return { ombro, mao };
  }
  const bracoE = montarBraco(-1);
  const bracoD = montarBraco(1);

  // Pernas articuladas
  function montarPerna(lado) {
    const quadrilP = new THREE.Group();
    quadrilP.position.set(lado * 0.17, 0.62, 0);
    const coxa = malha(THREE, new THREE.CylinderGeometry(0.125, 0.11, 0.52, 20), mCalca);
    coxa.position.y = -0.26;
    const sapatoGrp = new THREE.Group();
    sapatoGrp.position.set(0, -0.54, 0.05);
    const tenis = malha(THREE, new THREE.BoxGeometry(0.24, 0.14, 0.34), mSapato);
    const sola = malha(THREE, new THREE.BoxGeometry(0.25, 0.05, 0.36), mSola);
    sola.position.y = -0.06;
    sapatoGrp.add(tenis, sola);
    quadrilP.add(coxa, sapatoGrp);
    corpo.add(quadrilP);
    return quadrilP;
  }
  const pernaE = montarPerna(-1);
  const pernaD = montarPerna(1);

  const bonecoObj = {
    raiz,
    corpo,
    cabeca,
    bracoE: bracoE.ombro,
    bracoD: bracoD.ombro,
    maoE: bracoE.mao,
    maoD: bracoD.mao,
    pernaE,
    pernaD,
    olhos,
    sobrancelhas,
    bocas,
    gotaSuor,
    capaceteObra,
    capaceteEspaco,
    cabeloGrp,
    humorAtual: "feliz",
  };
  raiz.userData = raiz.userData || {};
  raiz.userData.boneco = bonecoObj;
  return bonecoObj;
}

function resetPose(b, t = 0) {
  b.raiz.rotation.set(0, 0, 0);
  b.corpo.position.set(0, Math.sin(t * 2.6) * 0.022, 0);
  b.corpo.rotation.set(0, 0, 0);
  b.cabeca.rotation.set(Math.sin(t * 1.8) * 0.03, Math.cos(t * 1.3) * 0.04, 0);
  b.bracoE.rotation.set(0, 0, 0.14 + Math.sin(t * 2.2) * 0.03);
  b.bracoD.rotation.set(0, 0, -0.14 - Math.sin(t * 2.2) * 0.03);
  b.pernaE.rotation.set(0, 0, 0);
  b.pernaD.rotation.set(0, 0, 0);
  b.gotaSuor.visible = false;
  if (b.bocas.fala) b.bocas.fala.visible = false;

  // Piscada natural a cada ~3.7s
  const cicloPisca = (t + 0.9) % 3.7;
  const escalaOlhoY = cicloPisca < 0.13 ? 0.12 : 1.0;
  b.olhos[0].scale.set(1, escalaOlhoY, 1);
  b.olhos[1].scale.set(1, escalaOlhoY, 1);
}

function humor(b, tipo = "feliz") {
  b.humorAtual = tipo;
  b.bocas.sorriso.visible = false;
  b.bocas.triste.visible = false;
  b.bocas.oh.visible = false;
  b.bocas.reta.visible = false;
  if (b.bocas.fala) b.bocas.fala.visible = false;
  b.bocas.reta.scale.set(1, 1, 1);

  b.sobrancelhas[0].position.y = 0.19;
  b.sobrancelhas[1].position.y = 0.19;
  b.sobrancelhas[0].rotation.z = 0;
  b.sobrancelhas[1].rotation.z = 0;

  if (tipo === "feliz" || tipo === "orgulhoso") {
    b.bocas.sorriso.visible = true;
    b.sobrancelhas[0].position.y = 0.21;
    b.sobrancelhas[1].position.y = 0.21;
  } else if (tipo === "triste" || tipo === "cansado") {
    b.bocas.triste.visible = true;
    b.sobrancelhas[0].rotation.z = 0.26;
    b.sobrancelhas[1].rotation.z = -0.26;
  } else if (tipo === "assustado" || tipo === "surpreso") {
    b.bocas.oh.visible = true;
    b.sobrancelhas[0].position.y = 0.24;
    b.sobrancelhas[1].position.y = 0.24;
  } else if (tipo === "bravo" || tipo === "esforco") {
    b.bocas.reta.visible = true;
    b.sobrancelhas[0].rotation.z = -0.32;
    b.sobrancelhas[1].rotation.z = 0.32;
  } else if (tipo === "pensativo") {
    b.bocas.reta.visible = true;
    b.sobrancelhas[0].position.y = 0.23;
    b.sobrancelhas[1].rotation.z = 0.18;
  } else {
    b.bocas.sorriso.visible = true;
  }
}

/**
 * Anima a boca do avatar sincronizada com as palavras e sílabas da narração (lip-sync).
 * Lê automaticamente `window.__SPEECH_TIMELINE__` (gerado a partir do alinhamento ElevenLabs)
 * ou aplica cadência silábica procedural caso não haja timeline global carregada.
 */
function falar(b, tLocal = 0, offsetGlobal = 0) {
  if (!b || !b.bocas || !b.bocas.fala) return;
  const tGlobal = offsetGlobal + tLocal;
  const speech = typeof window !== "undefined" ? window.__SPEECH_TIMELINE__ : null;

  let palavraAtiva = null;
  if (Array.isArray(speech) && speech.length > 0) {
    for (let i = 0; i < speech.length; i++) {
      const w = speech[i];
      if (tGlobal >= w.s - 0.015 && tGlobal <= w.e + 0.025) {
        palavraAtiva = w;
        break;
      }
    }
  } else {
    // Fallback procedural quando visualizado isoladamente sem window.__SPEECH_TIMELINE__
    const emFrase = (tLocal % 3.6) < 3.15 && tLocal > 0.12;
    if (emFrase) {
      palavraAtiva = {
        s: Math.floor(tLocal * 3.2) / 3.2,
        e: Math.floor(tLocal * 3.2) / 3.2 + 0.28,
        sil: 2,
        ab: 1.0,
      };
    }
  }

  // Em pausa entre palavras ou frases: mantém a expressão facial do humor atual
  if (!palavraAtiva) {
    return;
  }

  const durPalavra = Math.max(0.06, palavraAtiva.e - palavraAtiva.s);
  const u = clamp((tGlobal - palavraAtiva.s) / durPalavra, 0, 1);
  const numSilabas = Math.max(1, palavraAtiva.sil || 2);
  const fatorVogal = palavraAtiva.ab || 1.0;

  // Onda silábica: abre nas vogais de cada sílaba e fecha nas consoantes entre sílabas
  const faseSilaba = u * numSilabas * Math.PI;
  const ondaSilaba = Math.pow(Math.abs(Math.sin(faseSilaba)), 1.35);
  const abertura = clamp(ondaSilaba * fatorVogal, 0, 1.35);

  b.bocas.sorriso.visible = false;
  b.bocas.triste.visible = false;
  b.bocas.oh.visible = false;
  b.bocas.reta.visible = false;
  b.bocas.fala.visible = false;

  if (abertura > 0.26) {
    b.bocas.fala.visible = true;
    const escalaY = 0.25 + abertura * 1.05;
    const escalaX = 0.82 + Math.sin(faseSilaba * 0.5) * 0.25 + (1.1 - abertura * 0.3) * 0.14;
    b.bocas.fala.scale.set(escalaX, escalaY, 1.0);
    // Micro-movimento natural de mandíbula/cabeça acompanhando a sílaba tônica
    b.cabeca.rotation.x += abertura * 0.045;
  } else {
    // Fechamento labial nítido entre sílabas (consoantes p, b, m, t, d, s)
    b.bocas.reta.visible = true;
    b.bocas.reta.scale.set(0.84, 0.95, 1.0);
  }
}

function olharCamera(b, camera, forca = 0.7) {
  const dx = camera.position.x - b.raiz.position.x;
  const dz = camera.position.z - b.raiz.position.z;
  const angAlvo = Math.atan2(dx, dz);
  let diff = angAlvo - b.raiz.rotation.y;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  b.cabeca.rotation.y = clamp(diff, -0.75, 0.75) * forca;
}

function andar(b, t, tIni, tFim, de, para, passo = 9) {
  const u = suave(faixa(t, tIni, tFim));
  const p = lerp3(de, para, u);
  b.raiz.position.set(p[0], p[1], p[2]);
  const dx = para[0] - de[0];
  const dz = para[2] - de[2];
  if (Math.hypot(dx, dz) > 0.001) {
    b.raiz.rotation.y = Math.atan2(dx, dz);
  }
  if (t >= tIni && t <= tFim) {
    const fase = (t - tIni) * passo;
    const amp = Math.sin(u * Math.PI);
    b.pernaE.rotation.x = Math.sin(fase) * 0.65 * amp;
    b.pernaD.rotation.x = -Math.sin(fase) * 0.65 * amp;
    b.bracoE.rotation.x = -Math.sin(fase) * 0.5 * amp;
    b.bracoD.rotation.x = Math.sin(fase) * 0.5 * amp;
    b.corpo.position.y = Math.abs(Math.sin(fase)) * 0.08 * amp;
  }
}

function correr(b, t, tIni, tFim, de, para) {
  andar(b, t, tIni, tFim, de, para, 15);
  if (t >= tIni && t <= tFim) {
    b.corpo.rotation.x = 0.22;
  }
}

function pular(b, t, tIni, dur = 0.6, altura = 0.85) {
  if (t < tIni || t > tIni + dur) return;
  const u = faixa(t, tIni, tIni + dur);
  b.corpo.position.y += pulso(u) * altura;
  b.bracoE.rotation.z = 2.4 * pulso(u);
  b.bracoD.rotation.z = -2.4 * pulso(u);
}

function acenar(b, t, tIni, tFim, mao = "D") {
  if (t < tIni || t > tIni + tFim) return;
  const env = pulso(faixa(t, tIni, tFim));
  const braco = mao === "E" ? b.bracoE : b.bracoD;
  const s = mao === "E" ? 1 : -1;
  braco.rotation.z = s * (2.35 + Math.sin(t * 14) * 0.32) * env;
}

function comemorar(b, t, tIni, tFim) {
  if (t < tIni || t > tFim) return;
  humor(b, "feliz");
  const fase = (t - tIni) * 11;
  b.corpo.position.y = Math.abs(Math.sin(fase)) * 0.28;
  b.bracoE.rotation.z = 2.5 + Math.sin(fase) * 0.25;
  b.bracoD.rotation.z = -2.5 - Math.sin(fase) * 0.25;
}

function apontar(b, pontoAlvo, mao = "D") {
  const braco = mao === "E" ? b.bracoE : b.bracoD;
  const dx = pontoAlvo[0] - b.raiz.position.x;
  const dy = pontoAlvo[1] - (b.raiz.position.y + 1.35);
  const dz = pontoAlvo[2] - b.raiz.position.z;
  const distH = Math.hypot(dx, dz);
  braco.rotation.x = -Math.PI / 2 - Math.atan2(dy, Math.max(0.2, distH)) * 0.6;
  braco.rotation.z = (mao === "E" ? 1 : -1) * 0.35;
}

function pensar(b, t, tIni, tFim) {
  if (t < tIni || t > tFim) return;
  humor(b, "pensativo");
  b.bracoD.rotation.x = -1.85;
  b.bracoD.rotation.z = -0.35;
  b.cabeca.rotation.z = 0.16 + Math.sin(t * 3) * 0.04;
}

function suar(b, t, tIni, tFim) {
  if (t < tIni || t > tFim) return;
  b.gotaSuor.visible = true;
  const ciclo = ((t - tIni) * 2.2) % 1;
  b.gotaSuor.position.y = 0.24 - ciclo * 0.26;
}

function segurar(b, obj, abertura = 0.32) {
  b.bracoE.rotation.x = -1.15;
  b.bracoD.rotation.x = -1.15;
  b.bracoE.rotation.z = abertura;
  b.bracoD.rotation.z = -abertura;
  if (obj) {
    const yaw = b.raiz.rotation.y;
    obj.position.set(
      b.raiz.position.x + Math.sin(yaw) * 0.58,
      b.raiz.position.y + 1.12 + b.corpo.position.y,
      b.raiz.position.z + Math.cos(yaw) * 0.58
    );
    obj.rotation.y = yaw;
  }
}

function capacete(b, ativo = true) {
  b.capaceteObra.visible = !!ativo;
}

function capaceteEspacial(b, ativo = true) {
  b.capaceteEspaco.visible = !!ativo;
}


  // --- Módulo: environments.js ---
// motor/3d/environments.js — Ambientes procedurais 3D (Fundo do Mar Abissal com Caustics GLSL e Mundo Terrestre)


function criarFundoDoMar(THREE, palco, opts = {}) {
  const { cena } = palco;
  aplicarCeu(THREE, palco, opts.abismo ? "abismo" : "mar");

  const grp = new THREE.Group();
  cena.add(grp);

  // Solo arenoso ondulado com cores por vértice
  const geoAreia = new THREE.PlaneGeometry(90, 90, 64, 64);
  geoAreia.rotateX(-Math.PI / 2);
  const pos = geoAreia.attributes.position;
  const cores = new Float32Array(pos.count * 3);
  const cClara = new THREE.Color(opts.abismo ? 0x0c223d : 0x163c63);
  const cEscura = new THREE.Color(opts.abismo ? 0x050e1c : 0x0b213b);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const dist = Math.hypot(x, z);
    const h =
      Math.sin(x * 0.22) * 0.18 +
      Math.cos(z * 0.19) * 0.16 +
      Math.sin((x + z) * 0.45) * 0.06 +
      (dist > 8 ? (dist - 8) * 0.04 : 0);
    // Achata o centro onde ficam o cabo e o mascote
    const fatorCentro = Math.min(1, Math.max(0, (dist - 3.2) / 4.0));
    pos.setY(i, h * fatorCentro);

    const mix = 0.5 + 0.5 * Math.sin(x * 0.35 + z * 0.25);
    const c = cEscura.clone().lerp(cClara, mix);
    cores[i * 3] = c.r;
    cores[i * 3 + 1] = c.g;
    cores[i * 3 + 2] = c.b;
  }
  geoAreia.setAttribute("color", new THREE.BufferAttribute(cores, 3));
  geoAreia.computeVertexNormals();

  const areia = malha(
    THREE,
    geoAreia,
    mat(THREE, 0xffffff, { vertexColors: true, roughness: 0.88 })
  );
  grp.add(areia);

  // Shader GLSL de Cáusticas Marinhas projetadas no leito oceânico
  const causticsUniforms = {
    uTempo: { value: 0 },
    uCor: { value: new THREE.Color(opts.abismo ? 0x0284c7 : 0x38bdf8) },
  };
  const matCaustics = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: causticsUniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv * 14.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTempo;
      uniform vec3 uCor;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv;
        float t = uTempo * 0.85;
        float w1 = sin(p.x * 2.4 + t) + cos(p.y * 2.1 - t * 1.1);
        float w2 = sin((p.x + p.y) * 1.9 - t * 0.8) + cos((p.x - p.y) * 2.3 + t * 1.3);
        float rede = pow(clamp(1.0 - abs(w1 + w2) * 0.35, 0.0, 1.0), 3.0);
        float fade = smoothstep(7.0, 1.5, length(vUv - vec2(7.0)));
        gl_FragColor = vec4(uCor, rede * 0.24 * fade);
      }
    `,
  });
  const planoCaustics = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), matCaustics);
  planoCaustics.rotation.x = -Math.PI / 2;
  planoCaustics.position.y = 0.03;
  grp.add(planoCaustics);

  // Rochas abissais e corais bioluminescentes ao redor do palco
  const mRocha = mat(THREE, 0x0f253e, { roughness: 0.85 });
  const coresCoral = [0x06b6d4, 0x3b82f6, 0xf43f5e, 0xa855f7, 0x10b981];
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2 + rand() * 0.25;
    const raio = 4.8 + rand() * 7.5;
    const rx = Math.cos(ang) * raio;
    const rz = Math.sin(ang) * raio - 1.5;
    // Evita obstruir a câmera frontal
    if (rz > 2.2 && Math.abs(rx) < 3.8) continue;

    const escalaR = 0.45 + rand() * 0.95;
    const rocha = malha(THREE, new THREE.DodecahedronGeometry(escalaR, 1), mRocha);
    rocha.position.set(rx, escalaR * 0.35, rz);
    rocha.scale.set(1.2, 0.65 + rand() * 0.5, 1.0);
    rocha.rotation.set(rand(), rand(), rand());
    grp.add(rocha);

    if (i % 2 === 0) {
      const corC = coresCoral[i % coresCoral.length];
      const coral = malha(
        THREE,
        new THREE.CylinderGeometry(0.05, 0.12, 0.55 + rand() * 0.5, 12),
        mat(THREE, corC, { roughness: 0.4, emissive: corC, emissiveIntensity: 0.28 })
      );
      coral.position.set(rx + 0.15, escalaR * 0.55 + 0.2, rz + 0.1);
      coral.rotation.z = (rand() - 0.5) * 0.4;
      grp.add(coral);
    }
  }

  // Neve marinha (partículas em suspensão) e bolhas ascendentes
  const nPart = 140;
  const posPart = new Float32Array(nPart * 3);
  const sementesPart = [];
  for (let i = 0; i < nPart; i++) {
    const sx = (rand() - 0.5) * 18;
    const sy = 0.2 + rand() * 10;
    const sz = (rand() - 0.5) * 16;
    posPart[i * 3] = sx;
    posPart[i * 3 + 1] = sy;
    posPart[i * 3 + 2] = sz;
    sementesPart.push({ sx, sy, sz, vel: 0.25 + rand() * 0.55, fase: rand() * 6.28 });
  }
  const geoPart = new THREE.BufferGeometry();
  geoPart.setAttribute("position", new THREE.BufferAttribute(posPart, 3));
  const matPart = new THREE.PointsMaterial({
    color: 0x7dd3fc,
    size: 0.09,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const neveMarinha = new THREE.Points(geoPart, matPart);
  grp.add(neveMarinha);

  function animarAmbiente(t) {
    causticsUniforms.uTempo.value = t;
    const attr = geoPart.attributes.position;
    for (let i = 0; i < nPart; i++) {
      const s = sementesPart[i];
      const y = ((s.sy + t * s.vel) % 9.5) + 0.15;
      const x = s.sx + Math.sin(t * 1.4 + s.fase) * 0.22;
      attr.setXYZ(i, x, y, s.sz);
    }
    attr.needsUpdate = true;
  }

  return { grp, areia, planoCaustics, neveMarinha, animarAmbiente };
}

function criarTerra(THREE, palco, corGrama = 0x569e4c) {
  const { cena } = palco;
  aplicarCeu(THREE, palco, "dia");
  const chao = malha(
    THREE,
    new THREE.CircleGeometry(65, 48),
    mat(THREE, corGrama, { roughness: 0.88 })
  );
  chao.rotation.x = -Math.PI / 2;
  cena.add(chao);
  return { chao };
}


  // --- Módulo: props.js ---
// motor/3d/props.js — Objetos técnicos 3D procedurais: Cabo Submarino de 7 camadas, Vista Explodida, Lasers e Efeitos

/**
 * Constrói o modelo 3D de alta precisão do Cabo Submarino de Fibra Óptica com 7 camadas concêntricas:
 * 1. fibra (núcleo de vidro de sílica pura + feixe luminoso)
 * 2. revestimento (acrílico protetor primário)
 * 3. tubo (buffer tube com gel hidrofóbico + 6 fibras coloridas internas)
 * 4. cobre (condutor tubular de alta tensão ~10.000V)
 * 5. vedacao (barreira hermética de policarbonato/alumínio contra pressão abissal)
 * 6. aco (armadura helicoidal de 18 fios de aço trançados)
 * 7. jaqueta (capa externa de polietileno de alta densidade com faixa amarela de sinalização)
 */
function criarCaboSubmarino(THREE, opcoes = {}) {
  const escala = opcoes.escala ?? 1.0;
  const raiz = new THREE.Group();
  raiz.scale.setScalar(escala);

  // Grupo horizontal telescopado (corte em degraus mostrando todas as 7 camadas)
  const cabo = new THREE.Group();
  raiz.add(cabo);

  // Materiais ricos para cada camada
  const mVidro = mat(THREE, 0x7dd3fc, {
    roughness: 0.08,
    metalness: 0.1,
    emissive: 0x00e5ff,
    emissiveIntensity: 0.85,
  });
  const mRevestimento = mat(THREE, 0x38bdf8, {
    roughness: 0.22,
    metalness: 0.15,
    transparent: true,
    opacity: 0.72,
  });
  const mTubo = mat(THREE, 0xf8fafc, { roughness: 0.35, metalness: 0.1 });
  const mGel = mat(THREE, 0xbae6fd, { roughness: 0.15, transparent: true, opacity: 0.48 });
  const mCobre = mat(THREE, 0xd97706, {
    roughness: 0.26,
    metalness: 0.82,
    emissive: 0x78350f,
    emissiveIntensity: 0.18,
  });
  const mVedacao = mat(THREE, 0x94a3b8, { roughness: 0.32, metalness: 0.68 });
  const mAco = mat(THREE, 0xcbd5e1, { roughness: 0.24, metalness: 0.88 });
  const mJaqueta = mat(THREE, 0x111827, { roughness: 0.55, metalness: 0.18 });
  const mFaixa = mat(THREE, 0xfacc15, {
    roughness: 0.35,
    emissive: 0xca8a04,
    emissiveIntensity: 0.25,
  });

  // 1. Núcleo de fibra óptica + feixe laser interno
  const fibra = new THREE.Group();
  const nucleoVidro = malha(THREE, new THREE.CylinderGeometry(0.065, 0.065, 5.2, 24), mVidro);
  nucleoVidro.rotation.z = Math.PI / 2;
  fibra.add(nucleoVidro);

  // Pulsos luminosos viajando pela fibra
  const pulsosLuz = [];
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 16, 14),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    p.scale.set(2.2, 0.85, 0.85);
    fibra.add(p);
    pulsosLuz.push(p);
  }
  const luzFibra = new THREE.PointLight(0x00f0ff, 2.2, 4.5);
  luzFibra.position.set(1.8, 0.1, 0.2);
  fibra.add(luzFibra);
  cabo.add(fibra);

  // 2. Revestimento primário de acrílico
  const revestimento = malha(
    THREE,
    new THREE.CylinderGeometry(0.13, 0.13, 4.3, 28),
    mRevestimento
  );
  revestimento.rotation.z = Math.PI / 2;
  revestimento.position.x = -0.35;
  cabo.add(revestimento);

  // 3. Tubo protetor (Buffer Tube) + 6 fibras coloridas + gel hidrofóbico
  const tubo = new THREE.Group();
  const cascaTubo = malha(THREE, new THREE.CylinderGeometry(0.24, 0.24, 3.6, 28), mTubo);
  cascaTubo.rotation.z = Math.PI / 2;
  const gelInterno = malha(THREE, new THREE.CylinderGeometry(0.245, 0.245, 0.25, 24), mGel, false);
  gelInterno.rotation.z = Math.PI / 2;
  gelInterno.position.x = 1.82;
  tubo.add(cascaTubo, gelInterno);

  const coresFibras = [0xef4444, 0x22c55e, 0x3b82f6, 0xeab308, 0xa855f7, 0x06b6d4];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const fCor = malha(
      THREE,
      new THREE.CylinderGeometry(0.032, 0.032, 0.7, 14),
      mat(THREE, coresFibras[i], { roughness: 0.2, emissive: coresFibras[i], emissiveIntensity: 0.35 })
    );
    fCor.rotation.z = Math.PI / 2;
    fCor.position.set(1.95, Math.sin(a) * 0.13, Math.cos(a) * 0.13);
    tubo.add(fCor);
  }
  tubo.position.x = -0.68;
  cabo.add(tubo);

  // 4. Tubo condutor de Cobre (energia elétrica para repetidores ópticos)
  const cobre = malha(THREE, new THREE.CylinderGeometry(0.35, 0.35, 3.0, 32), mCobre);
  cobre.rotation.z = Math.PI / 2;
  cobre.position.x = -1.02;
  cabo.add(cobre);

  // 5. Vedação hermética contra água e pressão abissal
  const vedacao = malha(THREE, new THREE.CylinderGeometry(0.45, 0.45, 2.4, 32), mVedacao);
  vedacao.rotation.z = Math.PI / 2;
  vedacao.position.x = -1.35;
  cabo.add(vedacao);

  // 6. Armadura de 18 fios de aço de alta tração
  const aco = new THREE.Group();
  const nFios = 18;
  const raioAnelAco = 0.54;
  for (let i = 0; i < nFios; i++) {
    const a = (i / nFios) * Math.PI * 2;
    const fio = malha(THREE, new THREE.CylinderGeometry(0.068, 0.068, 1.85, 16), mAco);
    fio.rotation.z = Math.PI / 2;
    fio.rotation.y = 0.08;
    fio.position.set(0, Math.sin(a) * raioAnelAco, Math.cos(a) * raioAnelAco);
    aco.add(fio);
  }
  aco.position.x = -1.68;
  cabo.add(aco);

  // 7. Jaqueta externa de Polietileno de Alta Densidade (PEAD)
  const jaqueta = new THREE.Group();
  const corpoJaqueta = malha(THREE, new THREE.CylinderGeometry(0.68, 0.68, 1.35, 36), mJaqueta);
  corpoJaqueta.rotation.z = Math.PI / 2;
  const listra1 = malha(THREE, new THREE.CylinderGeometry(0.692, 0.692, 0.14, 36), mFaixa);
  listra1.rotation.z = Math.PI / 2;
  listra1.position.x = 0.35;
  const listra2 = malha(THREE, new THREE.CylinderGeometry(0.692, 0.692, 0.14, 36), mFaixa);
  listra2.rotation.z = Math.PI / 2;
  listra2.position.x = -0.25;
  jaqueta.add(corpoJaqueta, listra1, listra2);
  jaqueta.position.x = -2.02;
  cabo.add(jaqueta);

  const camadas = {
    fibra,
    revestimento,
    tubo,
    cobre,
    vedacao,
    aco,
    jaqueta,
  };

  const posOriginais = {
    fibra: -0.0,
    revestimento: -0.35,
    tubo: -0.68,
    cobre: -1.02,
    vedacao: -1.35,
    aco: -1.68,
    jaqueta: -2.02,
  };

  /**
   * Atualiza o estado das camadas para animação progressiva de montagem (de dentro para fora)
   * e anima os pulsos de laser viajando pelo núcleo de vidro.
   */
  function atualizar(t, estadoCamadas = {}) {
    // Animação dos pulsos de luz na fibra óptica
    for (let i = 0; i < pulsosLuz.length; i++) {
      const u = ((t * 1.45 + i / pulsosLuz.length) % 1);
      pulsosLuz[i].position.x = lerp(-2.4, 2.4, u);
      const env = Math.sin(u * Math.PI);
      pulsosLuz[i].scale.set(2.2 * env, 0.85 * env, 0.85 * env);
    }
    luzFibra.intensity = 1.8 + Math.sin(t * 8.0) * 0.55;

    // Controle de entrada suave (deslizando no eixo X) para cada camada
    for (const [nome, obj] of Object.entries(camadas)) {
      const prog = estadoCamadas[nome] !== undefined ? clamp(estadoCamadas[nome]) : 1.0;
      if (prog <= 0.001) {
        obj.visible = false;
      } else {
        obj.visible = true;
        const u = suavissimo(prog);
        obj.position.x = lerp(posOriginais[nome] - 2.6, posOriginais[nome], u);
        obj.position.y = 0;
        const esc = lerp(0.75, 1.0, u);
        obj.scale.setScalar(esc);
      }
    }
  }

  return {
    raiz,
    cabo,
    camadas,
    pulsosLuz,
    luzFibra,
    atualizar,
  };
}

/**
 * Cria uma Torre Vertical de Vista Explodida das 7 camadas do cabo submarino,
 * ideal para o Frame 04 de revisão técnica com projeção 3D -> 2D e chamadas SVG.
 */
function criarPilhaExplodidaCabo(THREE) {
  const grupo = new THREE.Group();

  const definicoes = [
    { id: "jaqueta",      nome: "7. Jaqueta PEAD",        cor: 0x1e293b, emissive: 0xfacc15, r: 0.62, h: 0.20, yAlvo: -1.10 },
    { id: "aco",          nome: "6. Fios de Aço (18x)",   cor: 0xcbd5e1, emissive: 0x64748b, r: 0.53, h: 0.20, yAlvo: -0.68 },
    { id: "vedacao",      nome: "5. Barreira Hermética",  cor: 0x94a3b8, emissive: 0x334155, r: 0.45, h: 0.19, yAlvo: -0.26 },
    { id: "cobre",        nome: "4. Tubo de Cobre 10kV",  cor: 0xd97706, emissive: 0x92400e, r: 0.37, h: 0.19, yAlvo:  0.16 },
    { id: "tubo",         nome: "3. Buffer Tube + Gel",   cor: 0xf8fafc, emissive: 0x38bdf8, r: 0.29, h: 0.19, yAlvo:  0.58 },
    { id: "revestimento", nome: "2. Acrílico Primário",   cor: 0x38bdf8, emissive: 0x0284c7, r: 0.21, h: 0.19, yAlvo:  1.00 },
    { id: "fibra",        nome: "1. Fibra de Sílica",     cor: 0x00f0ff, emissive: 0x00f0ff, r: 0.12, h: 0.26, yAlvo:  1.42 },
  ];

  const pecas = [];
  for (let i = 0; i < definicoes.length; i++) {
    const d = definicoes[i];
    const pecaGrp = new THREE.Group();
    const cilindro = malha(
      THREE,
      new THREE.CylinderGeometry(d.r, d.r, d.h, 32),
      mat(THREE, d.cor, {
        roughness: 0.25,
        metalness: i <= 3 ? 0.65 : 0.15,
        emissive: d.emissive,
        emissiveIntensity: i === 6 ? 0.85 : 0.18,
      })
    );
    pecaGrp.add(cilindro);

    // Anel luminoso de borda técnica
    const anel = new THREE.Mesh(
      new THREE.TorusGeometry(d.r + 0.02, 0.016, 12, 32),
      new THREE.MeshBasicMaterial({ color: i === 6 ? 0x00ffff : 0x38bdf8, transparent: true, opacity: 0.65 })
    );
    anel.rotation.x = Math.PI / 2;
    pecaGrp.add(anel);

    grupo.add(pecaGrp);
    pecas.push({ ...d, grp: pecaGrp, cilindro, anel });
  }

  // Eixo central guia laser
  const eixoLaser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 2.8, 16),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
  );
  eixoLaser.position.y = 0.16;
  grupo.add(eixoLaser);

  function atualizar(t, tExplosao = 0.2) {
    const uExp = suavissimo(faixa(t, tExplosao, tExplosao + 1.4));
    for (let i = 0; i < pecas.length; i++) {
      const p = pecas[i];
      const yCompacto = -0.4 + i * 0.18;
      p.grp.position.y = lerp(yCompacto, p.yAlvo, uExp) + Math.sin(t * 2.2 + i * 0.6) * 0.03;
      p.grp.rotation.y = t * 0.45 + i * 0.25;
      p.grp.rotation.x = 0.18;
    }
  }

  return { grupo, pecas, atualizar };
}

/**
 * Normaliza qualquer modelo 3D externo (.glb / .gltf ou Group) para a escala, centro e padrão
 * de sombreamento estilizado do canal.
 */
function normalizarModeloExterno(THREE, raizModelo, opcoes = {}) {
  const tamanhoAlvo = opcoes.tamanhoAlvo ?? 2.0;
  const caixa = new THREE.Box3().setFromObject(raizModelo);
  const tam = new THREE.Vector3();
  const centro = new THREE.Vector3();
  caixa.getSize(tam);
  caixa.getCenter(centro);

  const maiorEixo = Math.max(tam.x, tam.y, tam.z, 0.001);
  const escala = tamanhoAlvo / maiorEixo;
  raizModelo.scale.multiplyScalar(escala);

  raizModelo.position.sub(centro.multiplyScalar(escala));
  raizModelo.traverse((filho) => {
    if (filho.isMesh) {
      filho.castShadow = true;
      filho.receiveShadow = true;
    }
  });
  return raizModelo;
}

/**
 * Frame 01 — Cria o Planeta Terra em Sobrecarga Térmica + Termômetro 3D Gigante
 * Mostra o globo terrestre com faixas de anomalia de temperatura (+1.5°C) e um termômetro
 * que sobrecarrega quando tenta medir o calor acumulado nos oceanos e atmosfera.
 */
function criarPlanetaTermico(THREE, opcoes = {}) {
  const escala = opcoes.escala ?? 1.0;
  const raiz = new THREE.Group();
  raiz.scale.setScalar(escala);

  const globoGrp = new THREE.Group();
  raiz.add(globoGrp);

  // Esfera oceânica base
  const mOceano = mat(THREE, 0x0b3b69, {
    roughness: 0.32,
    metalness: 0.18,
    emissive: 0x082f49,
    emissiveIntensity: 0.35,
  });
  const esferaTerra = malha(THREE, new THREE.SphereGeometry(1.18, 40, 32), mOceano);
  globoGrp.add(esferaTerra);

  // Placas continentais estilizadas ao redor do globo
  const mContinente = mat(THREE, 0x22c55e, {
    roughness: 0.55,
    metalness: 0.08,
    emissive: 0x15803d,
    emissiveIntensity: 0.18,
  });
  const coordsCont = [
    [0.45, 0.35, 1.0, 0.48],
    [-0.55, 0.42, 0.92, 0.52],
    [0.15, -0.48, 1.05, 0.42],
    [-0.38, -0.35, 0.98, 0.38],
    [0.85, 0.1, 0.72, 0.45],
    [-0.88, -0.1, 0.72, 0.44],
  ];
  const placas = [];
  for (const [cx, cy, cz, tam] of coordsCont) {
    const dir = new THREE.Vector3(cx, cy, cz).normalize();
    const placa = malha(THREE, new THREE.DodecahedronGeometry(tam, 1), mContinente);
    placa.position.copy(dir.multiplyScalar(1.06));
    placa.lookAt(0, 0, 0);
    placa.scale.set(1.15, 0.85, 0.28);
    globoGrp.add(placa);
    placas.push(placa);
  }

  // Faixas orbitais de anomalia térmica (azul -> âmbar -> vermelho incandescente)
  const aneisTermicos = [];
  const latitudes = [-0.55, -0.2, 0.18, 0.52];
  for (let i = 0; i < latitudes.length; i++) {
    const lat = latitudes[i];
    const rAnel = Math.sqrt(Math.max(0.2, 1.24 * 1.24 - lat * lat));
    const mAnel = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xf97316 : 0xef4444,
      transparent: true,
      opacity: 0.65,
    });
    const anel = new THREE.Mesh(new THREE.TorusGeometry(rAnel, 0.028, 14, 48), mAnel);
    anel.rotation.x = Math.PI / 2;
    anel.position.y = lat;
    globoGrp.add(anel);
    aneisTermicos.push({ anel, mAnel, lat });
  }

  // Casca atmosférica estufa (glow externo)
  const mAtmosfera = mat(THREE, 0xf97316, {
    roughness: 0.15,
    transparent: true,
    opacity: 0.24,
    emissive: 0xef4444,
    emissiveIntensity: 0.45,
  });
  const atmosfera = new THREE.Mesh(new THREE.SphereGeometry(1.34, 36, 28), mAtmosfera);
  globoGrp.add(atmosfera);

  // Termômetro 3D gigante ao lado do globo
  const termometro = new THREE.Group();
  termometro.position.set(1.22, -0.05, 0.45);
  raiz.add(termometro);

  const mVidroT = mat(THREE, 0xe2e8f0, {
    roughness: 0.12,
    transparent: true,
    opacity: 0.48,
  });
  const tuboVidro = malha(THREE, new THREE.CylinderGeometry(0.16, 0.16, 2.2, 24), mVidroT, false);
  tuboVidro.position.y = 0.3;
  termometro.add(tuboVidro);

  const mMercurio = mat(THREE, 0xef4444, {
    roughness: 0.2,
    emissive: 0xef4444,
    emissiveIntensity: 0.85,
  });
  const bulbo = malha(THREE, new THREE.SphereGeometry(0.28, 24, 20), mMercurio);
  bulbo.position.y = -0.82;
  termometro.add(bulbo);

  const colunaMercurio = malha(THREE, new THREE.CylinderGeometry(0.095, 0.095, 1.9, 20), mMercurio, false);
  colunaMercurio.position.y = -0.2;
  termometro.add(colunaMercurio);

  // Luz de sobrecarga térmica
  const luzCalor = new THREE.PointLight(0xf97316, 2.2, 6.0);
  luzCalor.position.set(0.5, 0.6, 1.8);
  raiz.add(luzCalor);

  function atualizar(t, nivelCalor = 0.5) {
    const nv = clamp(nivelCalor, 0, 1);
    globoGrp.rotation.y = t * 0.42;
    globoGrp.rotation.z = 0.18;

    // Animação da sobrecarga térmica nas faixas e atmosfera
    mAtmosfera.opacity = lerp(0.14, 0.38, nv) + Math.sin(t * 5.0) * 0.04;
    mAtmosfera.emissiveIntensity = lerp(0.2, 0.95, nv);
    mOceano.emissive.setHex(nv > 0.55 ? 0x7c2d12 : 0x082f49);
    mOceano.emissiveIntensity = lerp(0.25, 0.75, nv);

    for (let i = 0; i < aneisTermicos.length; i++) {
      const a = aneisTermicos[i];
      const escalaPulso = 1.0 + Math.sin(t * 4.5 + i * 1.1) * 0.035 * nv;
      a.anel.scale.setScalar(escalaPulso);
      a.mAnel.opacity = lerp(0.25, 0.88, nv);
    }

    // Subida do mercúrio no termômetro e vibração de sobrecarga
    const escalaMerc = lerp(0.22, 1.08, nv);
    colunaMercurio.scale.y = escalaMerc;
    colunaMercurio.position.y = -0.82 + (1.9 * escalaMerc) * 0.5;
    if (nv > 0.75) {
      termometro.rotation.z = Math.sin(t * 28.0) * 0.06;
      bulbo.scale.setScalar(1.0 + Math.sin(t * 18.0) * 0.08);
    } else {
      termometro.rotation.z = 0;
      bulbo.scale.setScalar(1.0);
    }
    luzCalor.intensity = lerp(1.0, 3.2, nv);
  }

  return { raiz, globoGrp, termometro, atmosfera, luzCalor, atualizar };
}

/**
 * Frame 02 — Cria a "Esponja Atmosférica" (Lei de Clausius-Clapeyron: +7% vapor por °C)
 * Nuvem cumulonimbus volumétrica que suga colunas de vapor do solo ressecado até saturar
 * e despencar em cortinas de chuva torrencial e raios.
 */
function criarEsponjaAtmosferica(THREE) {
  const raiz = new THREE.Group();

  // Nuvem-esponja superior (clusters esféricos que incham e escurecem)
  const nuvemGrp = new THREE.Group();
  nuvemGrp.position.set(0, 2.35, 0);
  raiz.add(nuvemGrp);

  const mNuvem = mat(THREE, 0xe2e8f0, {
    roughness: 0.65,
    metalness: 0.05,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.15,
  });

  const bolhasConfig = [
    [0, 0, 0, 0.78],
    [-0.68, -0.08, 0.12, 0.62],
    [0.68, -0.06, 0.1, 0.64],
    [-1.18, -0.18, -0.05, 0.48],
    [1.18, -0.16, -0.05, 0.5],
    [-0.35, 0.42, -0.08, 0.58],
    [0.38, 0.45, 0.06, 0.6],
    [0, 0.62, 0, 0.52],
  ];
  const bolhas = [];
  for (const [bx, by, bz, br] of bolhasConfig) {
    const b = malha(THREE, new THREE.SphereGeometry(br, 24, 20), mNuvem);
    b.position.set(bx, by, bz);
    nuvemGrp.add(b);
    bolhas.push(b);
  }

  // Colunas ascendentes de evaporação (vapor subindo do chão para a nuvem)
  const vaporGrp = new THREE.Group();
  raiz.add(vaporGrp);
  const mVapor = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.55,
  });
  const particulasVapor = [];
  for (let i = 0; i < 28; i++) {
    const ang = (i / 28) * Math.PI * 2;
    const raio = 0.25 + (i % 4) * 0.32;
    const gota = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), mVapor);
    vaporGrp.add(gota);
    particulasVapor.push({
      gota,
      x: Math.cos(ang) * raio,
      z: Math.sin(ang) * raio,
      fase: i / 28,
    });
  }

  // Cortina de chuva torrencial (quando a esponja é espremida)
  const chuvaGrp = new THREE.Group();
  raiz.add(chuvaGrp);
  const mChuva = new THREE.MeshBasicMaterial({
    color: 0x60a5fa,
    transparent: true,
    opacity: 0.82,
  });
  const tracosChuva = [];
  for (let i = 0; i < 36; i++) {
    const traco = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 8), mChuva);
    const rx = ((i % 9) - 4) * 0.28;
    const rz = (Math.floor(i / 9) - 1.5) * 0.28;
    chuvaGrp.add(traco);
    tracosChuva.push({ traco, rx, rz, offset: (i * 0.17) % 1 });
  }

  // Raio elétrico no centro da tempestade
  const mRaio = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const raioMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.02, 2.2, 8), mRaio);
  raioMesh.position.set(0.15, 1.1, 0.25);
  raioMesh.rotation.z = 0.14;
  raioMesh.visible = false;
  raiz.add(raioMesh);

  function atualizar(t, saturacao = 0.5, chovendo = 0.0) {
    const sat = clamp(saturacao, 0, 1);
    const chv = clamp(chovendo, 0, 1);

    // Nuvem incha conforme retém +7% de vapor por °C
    const esc = lerp(0.78, 1.28, sat);
    nuvemGrp.scale.set(esc, esc * (1.0 - chv * 0.12), esc);
    nuvemGrp.position.y = 2.35 + Math.sin(t * 2.2) * 0.06;

    // Cor da nuvem muda de branca/ciano (absorvendo vapor) para chumbo-elétrico (tempestade)
    const cClara = new THREE.Color(0xdbeafe);
    const cTempestade = new THREE.Color(0x1e293b);
    mNuvem.color.copy(cClara.lerp(cTempestade, chv * 0.85 + sat * 0.15));
    mNuvem.emissive.setHex(chv > 0.4 ? 0x0284c7 : 0x38bdf8);
    mNuvem.emissiveIntensity = lerp(0.15, 0.42, sat);

    // Anima vapor subindo
    mVapor.opacity = lerp(0.68, 0.15, chv);
    for (const p of particulasVapor) {
      const u = (t * 0.65 + p.fase) % 1;
      p.gota.position.set(
        p.x + Math.sin(t * 3.0 + p.fase * 6.28) * 0.08,
        lerp(0.15, 2.2, u),
        p.z
      );
      const s = Math.sin(u * Math.PI) * lerp(0.6, 1.35, sat);
      p.gota.scale.setScalar(Math.max(0.01, s));
    }

    // Anima cortina de chuva caindo
    chuvaGrp.visible = chv > 0.02;
    mChuva.opacity = chv * 0.88;
    for (const c of tracosChuva) {
      const u = (t * 2.8 + c.offset) % 1;
      c.traco.position.set(c.rx, lerp(2.15, 0.15, u), c.rz);
    }

    // Flashes de raio quando chovendo forte
    raioMesh.visible = chv > 0.5 && Math.sin(t * 19.0) > 0.65;
  }

  return { raiz, nuvemGrp, vaporGrp, chuvaGrp, raioMesh, atualizar };
}

/**
 * Frame 03 — Cria o Vórtice Ciclônico sobre Oceano Superaquecido (90% do Calor Global)
 * Mostra a superfície do mar brilhando em infravermelho térmico e alimentando
 * um funil espiral de furacão/supercélula com anéis rotativos de alta velocidade.
 */
function criarVorticeCiclonico(THREE) {
  const raiz = new THREE.Group();

  // Disco oceânico térmico na base
  const mMarQuente = mat(THREE, 0x0f172a, {
    roughness: 0.22,
    metalness: 0.35,
    emissive: 0xea580c,
    emissiveIntensity: 0.55,
  });
  const discoMar = malha(THREE, new THREE.CylinderGeometry(2.8, 2.8, 0.12, 48), mMarQuente);
  discoMar.position.y = 0.06;
  raiz.add(discoMar);

  // Anéis concêntricos de anomalia térmica na água
  const aneisCalorMar = [];
  for (let i = 0; i < 4; i++) {
    const r = 0.55 + i * 0.52;
    const mAnel = new THREE.MeshBasicMaterial({
      color: i < 2 ? 0xef4444 : 0xf59e0b,
      transparent: true,
      opacity: 0.65 - i * 0.12,
    });
    const anel = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 12, 48), mAnel);
    anel.rotation.x = Math.PI / 2;
    anel.position.y = 0.14;
    raiz.add(anel);
    aneisCalorMar.push({ anel, mAnel, rBase: r });
  }

  // Estrutura vertical do vórtice ciclônico (anéis de nuvens e vento em espiral)
  const vorticeGrp = new THREE.Group();
  raiz.add(vorticeGrp);

  const niveisVortice = [];
  const nNiveis = 7;
  for (let i = 0; i < nNiveis; i++) {
    const frac = i / (nNiveis - 1);
    const raioNivel = lerp(0.42, 1.55, Math.pow(frac, 0.85));
    const yNivel = lerp(0.38, 2.75, frac);
    const nivelGrp = new THREE.Group();
    nivelGrp.position.y = yNivel;

    const corAnel = frac < 0.35 ? 0xf97316 : frac < 0.7 ? 0x38bdf8 : 0xe2e8f0;
    const anelVento = new THREE.Mesh(
      new THREE.TorusGeometry(raioNivel, 0.045 + frac * 0.04, 14, 40),
      mat(THREE, corAnel, {
        roughness: 0.35,
        transparent: true,
        opacity: 0.78,
        emissive: corAnel,
        emissiveIntensity: 0.35,
      })
    );
    anelVento.rotation.x = Math.PI / 2;
    nivelGrp.add(anelVento);

    // Pás de nuvens espirais em cada nível
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const gomo = malha(
        THREE,
        new THREE.SphereGeometry(0.16 + frac * 0.12, 16, 14),
        mat(THREE, 0xcbd5e1, { roughness: 0.55, emissive: corAnel, emissiveIntensity: 0.2 })
      );
      gomo.position.set(Math.cos(a) * raioNivel, 0, Math.sin(a) * raioNivel);
      gomo.scale.set(1.6, 0.65, 0.9);
      nivelGrp.add(gomo);
    }

    vorticeGrp.add(nivelGrp);
    niveisVortice.push({ nivelGrp, frac });
  }

  function atualizar(t, potencia = 0.7) {
    const pot = clamp(potencia, 0, 1);
    const velGiro = lerp(1.8, 6.2, pot);

    mMarQuente.emissiveIntensity = lerp(0.25, 0.85, pot) + Math.sin(t * 4.0) * 0.08;

    for (let i = 0; i < aneisCalorMar.length; i++) {
      const a = aneisCalorMar[i];
      const u = 1.0 - ((t * 0.55 + i * 0.25) % 1) * 0.35;
      a.anel.scale.setScalar(u);
    }

    for (let i = 0; i < niveisVortice.length; i++) {
      const nv = niveisVortice[i];
      nv.nivelGrp.rotation.y = t * velGiro * (1.3 - nv.frac * 0.45) + i * 0.5;
      nv.nivelGrp.position.x = Math.sin(t * 2.5 + i * 0.7) * 0.08 * pot;
      const esc = lerp(0.65, 1.12, pot);
      nv.nivelGrp.scale.setScalar(esc);
    }
  }

  return { raiz, discoMar, vorticeGrp, atualizar };
}

/**
 * Frame 04 — Cria a Corrente de Jato (Jet Stream) e a Amplificação Ártica
 * Mostra o hemisfério terrestre com a calota polar aquecendo e a fita da Corrente de Jato
 * perdendo velocidade e criando ondas gigantes (Ondas de Rossby) que travam sistemas extremos.
 */
function criarCorrenteDeJato(THREE) {
  const raiz = new THREE.Group();

  // Globo hemisférico central
  const mTerra = mat(THREE, 0x0c2d48, { roughness: 0.45, metalness: 0.15 });
  const globo = malha(THREE, new THREE.SphereGeometry(1.25, 40, 32), mTerra);
  raiz.add(globo);

  // Calota Polar Ártica no topo (muda de gelo azul/branco para vermelho de amplificação ártica)
  const mArtico = mat(THREE, 0xe0f2fe, {
    roughness: 0.3,
    emissive: 0xef4444,
    emissiveIntensity: 0.1,
  });
  const calotaArtica = malha(
    THREE,
    new THREE.SphereGeometry(1.27, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.28),
    mArtico
  );
  raiz.add(calotaArtica);

  // Segmentos da fita da Corrente de Jato ao redor da latitude média
  const nSegs = 64;
  const esferasJato = [];
  const jatoGrp = new THREE.Group();
  raiz.add(jatoGrp);

  for (let i = 0; i < nSegs; i++) {
    const mSeg = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const seg = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 12), mSeg);
    jatoGrp.add(seg);
    esferasJato.push({ seg, mSeg, idx: i });
  }

  // Duas cúpulas estacionárias de bloqueio (Domo de Calor + Tempestade Travada)
  const mDomoCalor = mat(THREE, 0xef4444, {
    roughness: 0.2,
    transparent: true,
    opacity: 0.45,
    emissive: 0xef4444,
    emissiveIntensity: 0.65,
  });
  const domoCalor = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 20), mDomoCalor);
  domoCalor.position.set(0.88, 0.35, 0.92);
  raiz.add(domoCalor);

  const mDomoChuva = mat(THREE, 0x3b82f6, {
    roughness: 0.2,
    transparent: true,
    opacity: 0.45,
    emissive: 0x0284c7,
    emissiveIntensity: 0.65,
  });
  const domoChuva = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 20), mDomoChuva);
  domoChuva.position.set(-0.85, 0.12, 0.96);
  raiz.add(domoChuva);

  function atualizar(t, meandro = 0.5) {
    const m = clamp(meandro, 0, 1);
    globo.rotation.y = t * 0.18;

    // Amplificação ártica: polo esquenta 4x mais rápido
    mArtico.emissiveIntensity = lerp(0.08, 0.92, m);
    mArtico.color.setHex(m > 0.5 ? 0xfca5a5 : 0xe0f2fe);

    // Quando o gradiente enfraquece, a corrente de jato fica mais lenta e com curvas enormes
    const velFluxo = lerp(3.2, 0.65, m);
    const ampOnda = lerp(0.08, 0.44, m);

    for (let i = 0; i < nSegs; i++) {
      const s = esferasJato[i];
      const ang = (i / nSegs) * Math.PI * 2;
      const lat = 0.42 + Math.sin(ang * 4.0 + t * velFluxo) * ampOnda;
      const r = 1.34;
      const rHoriz = Math.cos(lat) * r;
      const y = Math.sin(lat) * r;
      s.seg.position.set(Math.cos(ang) * rHoriz, y, Math.sin(ang) * rHoriz);
      s.seg.scale.setScalar(1.0 + Math.sin(t * 6.0 + i * 0.4) * 0.22);
      s.mSeg.color.setHex(m > 0.55 && Math.sin(ang * 4.0) > 0 ? 0xf97316 : 0x00f0ff);
    }

    // Domos de bloqueio aparecem quando os meandros travam
    const escDomo = suavissimo(faixa(m, 0.25, 0.85));
    domoCalor.scale.setScalar(Math.max(0.01, escDomo * (1.0 + Math.sin(t * 4.0) * 0.08)));
    domoChuva.scale.setScalar(Math.max(0.01, escDomo * (1.0 + Math.cos(t * 4.0) * 0.08)));
  }

  return { raiz, globo, calotaArtica, domoCalor, domoChuva, atualizar };
}

/**
 * Frame 05 — Cria o Corte Geológico e Urbano (Solo Seco Impermeável + Enxurrada)
 * Mostra como o solo esturricado pela seca e o asfalto urbano impedem a infiltração,
 * gerando escoamento superficial explosivo (flash flood).
 */
function criarCorteSoloUrbano(THREE) {
  const raiz = new THREE.Group();

  // Base do bloco geológico em corte transversal
  const mSubsolo = mat(THREE, 0x451a03, { roughness: 0.85 });
  const blocoSubsolo = malha(THREE, new THREE.BoxGeometry(3.8, 0.65, 2.2), mSubsolo);
  blocoSubsolo.position.y = 0.325;
  raiz.add(blocoSubsolo);

  // Metade esquerda: Solo seco rachado (endurecido como concreto)
  const mSoloSeco = mat(THREE, 0xb45309, { roughness: 0.78 });
  const placaSeca = malha(THREE, new THREE.BoxGeometry(1.88, 0.16, 2.22), mSoloSeco);
  placaSeca.position.set(-0.95, 0.72, 0);
  raiz.add(placaSeca);

  // Metade direita: Asfalto urbano e prédios estilizados
  const mAsfalto = mat(THREE, 0x1e293b, { roughness: 0.65, metalness: 0.2 });
  const placaAsfalto = malha(THREE, new THREE.BoxGeometry(1.88, 0.16, 2.22), mAsfalto);
  placaAsfalto.position.set(0.95, 0.72, 0);
  raiz.add(placaAsfalto);

  // Mini edifícios urbanos na direita
  const mPredio = mat(THREE, 0x334155, {
    roughness: 0.35,
    metalness: 0.45,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.18,
  });
  const alturasPredios = [
    [0.55, 0.95, -0.55],
    [1.15, 1.35, -0.48],
    [1.55, 0.82, 0.25],
  ];
  for (const [px, ph, pz] of alturasPredios) {
    const predio = malha(THREE, new THREE.BoxGeometry(0.42, ph, 0.42), mPredio);
    predio.position.set(px, 0.8 + ph * 0.5, pz);
    raiz.add(predio);
  }

  // Lâmina de água / enxurrada superficial que acumula sobre o solo impermeável
  const mEnxurrada = mat(THREE, 0x0284c7, {
    roughness: 0.12,
    metalness: 0.25,
    transparent: true,
    opacity: 0.78,
    emissive: 0x0ea5e9,
    emissiveIntensity: 0.35,
  });
  const laminaAgua = malha(THREE, new THREE.BoxGeometry(3.76, 0.38, 2.18), mEnxurrada);
  laminaAgua.position.set(0, 0.82, 0);
  raiz.add(laminaAgua);

  function atualizar(t, nivelEnxurrada = 0.5) {
    const nv = clamp(nivelEnxurrada, 0.02, 1.0);
    laminaAgua.scale.y = nv;
    laminaAgua.position.y = 0.8 + (0.38 * nv) * 0.5 + Math.sin(t * 5.5) * 0.015;
    mEnxurrada.opacity = lerp(0.25, 0.84, nv);
  }

  return { raiz, blocoSubsolo, placaSeca, placaAsfalto, laminaAgua, atualizar };
}

/**
 * Frame 06 — Cria a Torre Vertical de Vista Explodida da Supercélula Climática (7 Níveis)
 * Usada no fechamento técnico com projeção 3D -> 2D e chamadas SVG para explicar toda a máquina térmica.
 */
function criarPilhaExplodidaTempestade(THREE) {
  const grupo = new THREE.Group();

  const definicoes = [
    { id: "oceano",      nome: "1. Oceano +30°C (90% Calor)", cor: 0xea580c, emissive: 0xef4444, r: 0.68, h: 0.18, yAlvo: -1.12 },
    { id: "evaporacao",  nome: "2. Vapor +7% / °C",           cor: 0xf59e0b, emissive: 0xf97316, r: 0.56, h: 0.18, yAlvo: -0.70 },
    { id: "condensacao", nome: "3. Base de Condensação",      cor: 0x38bdf8, emissive: 0x0284c7, r: 0.62, h: 0.19, yAlvo: -0.28 },
    { id: "updraft",     nome: "4. Corrente Ascendente",      cor: 0x06b6d4, emissive: 0x00f0ff, r: 0.46, h: 0.22, yAlvo:  0.15 },
    { id: "granizo",     nome: "5. Núcleo de Granizo e Raios",cor: 0x6366f1, emissive: 0xfacc15, r: 0.52, h: 0.20, yAlvo:  0.58 },
    { id: "jato",        nome: "6. Corrente de Jato Travada", cor: 0xa855f7, emissive: 0xc084fc, r: 0.58, h: 0.18, yAlvo:  1.00 },
    { id: "bigorna",     nome: "7. Bigorna Estratosférica",   cor: 0xe2e8f0, emissive: 0x38bdf8, r: 0.78, h: 0.22, yAlvo:  1.42 },
  ];

  const pecas = [];
  for (let i = 0; i < definicoes.length; i++) {
    const d = definicoes[i];
    const pecaGrp = new THREE.Group();
    const cilindro = malha(
      THREE,
      new THREE.CylinderGeometry(d.r, d.r * 0.88, d.h, 36),
      mat(THREE, d.cor, {
        roughness: 0.28,
        metalness: 0.25,
        emissive: d.emissive,
        emissiveIntensity: 0.35,
      })
    );
    pecaGrp.add(cilindro);

    const anel = new THREE.Mesh(
      new THREE.TorusGeometry(d.r + 0.025, 0.016, 12, 36),
      new THREE.MeshBasicMaterial({ color: d.emissive, transparent: true, opacity: 0.75 })
    );
    anel.rotation.x = Math.PI / 2;
    pecaGrp.add(anel);

    grupo.add(pecaGrp);
    pecas.push({ ...d, grp: pecaGrp, cilindro, anel });
  }

  // Coluna central de vorticidade térmica
  const eixoCentral = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 2.9, 16),
    new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.55 })
  );
  eixoCentral.position.y = 0.16;
  grupo.add(eixoCentral);

  function atualizar(t, tExplosao = 0.2) {
    const uExp = suavissimo(faixa(t, tExplosao, tExplosao + 1.4));
    for (let i = 0; i < pecas.length; i++) {
      const p = pecas[i];
      const yCompacto = -0.4 + i * 0.18;
      p.grp.position.y = lerp(yCompacto, p.yAlvo, uExp) + Math.sin(t * 2.4 + i * 0.65) * 0.03;
      p.grp.rotation.y = t * (0.55 + i * 0.08) + i * 0.3;
      p.grp.rotation.x = 0.16;
    }
  }

  return { grupo, pecas, atualizar };
}

// ============================================================================
// KIT WI-FI E SINAIS INVISÍVEIS EM CASA (6 CONSTRUTORES PROCEDURAIS 3D)
// ============================================================================

/**
 * Frame 01 (Wi-Fi) — Roteador na sala com 3 antenas + ondas 3D enfraquecendo até o celular travando
 */
function criarRoteadorSinalFraco(THREE) {
  const raiz = new THREE.Group();

  // Rack/mesa da sala
  const mMesa = mat(THREE, 0x334155, { roughness: 0.7 });
  const mesa = malha(THREE, new THREE.BoxGeometry(1.3, 0.14, 0.85), mMesa);
  mesa.position.set(-0.55, 0.72, 0);
  raiz.add(mesa);

  // Corpo do roteador
  const mCorpo = mat(THREE, 0x0f172a, { roughness: 0.35, metalness: 0.4 });
  const corpo = malha(THREE, new THREE.BoxGeometry(0.78, 0.16, 0.52), mCorpo);
  corpo.position.set(-0.55, 0.87, 0);
  raiz.add(corpo);

  // 3 Antenas articuladas
  const mAntena = mat(THREE, 0x1e293b, { roughness: 0.4, metalness: 0.5 });
  for (const ax of [-0.82, -0.55, -0.28]) {
    const ant = malha(THREE, new THREE.CylinderGeometry(0.025, 0.035, 0.62, 12), mAntena);
    ant.position.set(ax, 1.22, -0.18);
    ant.rotation.z = (ax + 0.55) * -0.25;
    raiz.add(ant);
  }

  // LEDs frontais do roteador
  const leds = [];
  for (let i = 0; i < 4; i++) {
    const mLed = mat(THREE, 0x22c55e, { emissive: 0x22c55e, emissiveIntensity: 0.85 });
    const led = malha(THREE, new THREE.SphereGeometry(0.032, 10, 8), mLed, false);
    led.position.set(-0.76 + i * 0.14, 0.87, 0.27);
    raiz.add(led);
    leds.push({ mesh: led, mat: mLed });
  }

  // Anéis de onda Wi-Fi propagando pelo ar
  const ondas = [];
  for (let i = 0; i < 4; i++) {
    const mOnda = mat(THREE, 0x38bdf8, {
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.75,
    });
    const anel = malha(THREE, new THREE.TorusGeometry(0.28 + i * 0.22, 0.032, 10, 24), mOnda, false);
    anel.position.set(-0.2 + i * 0.36, 1.35, 0);
    anel.rotation.y = Math.PI / 2;
    raiz.add(anel);
    ondas.push({ anel, mat: mOnda, idx: i });
  }

  // Celular distante no quarto com bolinha de carregamento ("travando")
  const celularGrp = new THREE.Group();
  celularGrp.position.set(1.15, 1.42, 0.12);
  celularGrp.rotation.y = -0.35;

  const mCel = mat(THREE, 0x1e293b, { roughness: 0.25, metalness: 0.6 });
  const chassiCel = malha(THREE, new THREE.BoxGeometry(0.54, 0.98, 0.08), mCel);
  const mTela = mat(THREE, 0x090d16, { emissive: 0xef4444, emissiveIntensity: 0.22 });
  const telaCel = malha(THREE, new THREE.BoxGeometry(0.46, 0.86, 0.02), mTela, false);
  telaCel.position.z = 0.045;

  const mSpinner = mat(THREE, 0xef4444, { emissive: 0xf97316, emissiveIntensity: 0.9 });
  const spinner = malha(THREE, new THREE.TorusGeometry(0.13, 0.028, 10, 18, Math.PI * 1.45), mSpinner, false);
  spinner.position.z = 0.065;

  celularGrp.add(chassiCel, telaCel, spinner);
  raiz.add(celularGrp);

  function atualizar(t, quedaSinal = 0.5) {
    const q = clamp(quedaSinal, 0, 1);
    spinner.rotation.z = -t * 5.2;
    celularGrp.position.y = 1.42 + Math.sin(t * 2.5) * 0.05;

    ondas.forEach((o, i) => {
      const fase = (t * 1.6 + i * 0.25) % 1;
      const enfraquece = clamp(1 - i * 0.24 * (0.4 + q * 0.8), 0.12, 1);
      o.anel.position.x = -0.35 + fase * 1.35;
      o.anel.scale.setScalar(0.55 + fase * 0.85);
      o.mat.opacity = (1 - fase) * 0.82 * enfraquece;
      if (q > 0.55 && i >= 2) {
        o.mat.color.setHex(0xef4444);
        o.mat.emissive.setHex(0xdc2626);
      } else {
        o.mat.color.setHex(0x38bdf8);
        o.mat.emissive.setHex(0x0284c7);
      }
    });

    leds.forEach((l, i) => {
      const alerta = q > 0.6 && i >= 2;
      l.mat.color.setHex(alerta ? 0xef4444 : 0x22c55e);
      l.mat.emissive.setHex(alerta ? 0xef4444 : 0x22c55e);
    });
  }

  return { raiz, ondas, celularGrp, atualizar };
}

/**
 * Frame 02 (Wi-Fi) — Roteador como "lâmpada invisível" preso atrás da TV/armário vs livre
 */
function criarRoteadorArmario(THREE) {
  const raiz = new THREE.Group();

  // Base do armário/rack
  const mMadeira = mat(THREE, 0x78350f, { roughness: 0.75 });
  const base = malha(THREE, new THREE.BoxGeometry(2.1, 0.16, 1.1), mMadeira);
  base.position.y = 0.65;
  raiz.add(base);

  // Roteador brilhando no centro como uma lâmpada de ondas
  const mLamp = mat(THREE, 0xfacc15, { emissive: 0xf59e0b, emissiveIntensity: 0.9 });
  const bulboSinal = malha(THREE, new THREE.SphereGeometry(0.28, 16, 12), mLamp, false);
  bulboSinal.position.set(0, 1.18, 0);
  raiz.add(bulboSinal);

  const mBaseRot = mat(THREE, 0x0f172a, { roughness: 0.4 });
  const baseRot = malha(THREE, new THREE.BoxGeometry(0.75, 0.16, 0.48), mBaseRot);
  baseRot.position.set(0, 0.82, 0);
  raiz.add(baseRot);

  // Portas/barreiras do armário e TV que abafam o roteador
  const mPorta = mat(THREE, 0x451a03, { roughness: 0.8 });
  const portaEsq = malha(THREE, new THREE.BoxGeometry(0.92, 1.15, 0.12), mPorta);
  portaEsq.position.set(-0.52, 1.32, 0.42);
  const portaDir = malha(THREE, new THREE.BoxGeometry(0.92, 1.15, 0.12), mPorta);
  portaDir.position.set(0.52, 1.32, 0.42);
  raiz.add(portaEsq, portaDir);

  // Anéis luminosos de alcance do sinal
  const raios = [];
  for (let i = 0; i < 4; i++) {
    const mRaio = mat(THREE, 0x38bdf8, {
      emissive: 0x38bdf8,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.7,
    });
    const anel = malha(THREE, new THREE.TorusGeometry(0.42 + i * 0.26, 0.032, 10, 24), mRaio, false);
    anel.position.set(0, 1.18, 0);
    raiz.add(anel);
    raios.push({ anel, mat: mRaio, idx: i });
  }

  function atualizar(t, abafado = 1.0) {
    const ab = clamp(abafado, 0, 1);
    // Portas fecham quando abafado=1 e abrem quando abafado=0
    portaEsq.position.x = lerp(-1.18, -0.46, ab);
    portaDir.position.x = lerp(1.18, 0.46, ab);
    portaEsq.rotation.y = lerp(-0.85, 0, ab);
    portaDir.rotation.y = lerp(0.85, 0, ab);

    const alcance = lerp(1.35, 0.42, ab);
    bulboSinal.scale.setScalar(lerp(1.15, 0.72, ab) + Math.sin(t * 5) * 0.05);

    raios.forEach((r, i) => {
      const pulsoR = 1 + Math.sin(t * 3.5 - i * 0.7) * 0.12;
      r.anel.scale.setScalar(alcance * pulsoR);
      r.anel.rotation.x = 0.35 + Math.sin(t * 1.4 + i) * 0.25;
      r.anel.rotation.y = t * (0.4 + i * 0.12);
      r.mat.opacity = lerp(0.82, 0.22, ab);
      r.mat.color.setHex(ab > 0.5 ? 0xf59e0b : 0x38bdf8);
    });
  }

  return { raiz, portaEsq, portaDir, bulboSinal, raios, atualizar };
}

/**
 * Frame 03 (Wi-Fi) — Os 3 inimigos dentro de casa: Parede de tijolo, Espelho e Canos d'água
 */
function criarParedeObstaculosCasa(THREE) {
  const raiz = new THREE.Group();

  // Parede de alvenaria/concreto no centro
  const mTijolo = mat(THREE, 0x9a3412, { roughness: 0.85 });
  const parede = malha(THREE, new THREE.BoxGeometry(0.36, 1.85, 1.35), mTijolo);
  parede.position.set(0.05, 1.35, 0);
  raiz.add(parede);

  // Espelho brilhante colado na face frontal da parede (rebate o sinal)
  const mEspelho = mat(THREE, 0xe0f2fe, {
    roughness: 0.08,
    metalness: 0.85,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.28,
  });
  const espelho = malha(THREE, new THREE.BoxGeometry(0.06, 1.25, 0.82), mEspelho);
  espelho.position.set(-0.16, 1.42, 0.15);
  raiz.add(espelho);

  // Canos hidráulicos azuis cheios de água (absorvem a onda)
  const mCano = mat(THREE, 0x0284c7, {
    roughness: 0.3,
    emissive: 0x0369a1,
    emissiveIntensity: 0.35,
  });
  for (const cz of [-0.38, 0.0, 0.38]) {
    const cano = malha(THREE, new THREE.CylinderGeometry(0.085, 0.085, 1.88, 14), mCano);
    cano.position.set(0.28, 1.35, cz);
    raiz.add(cano);
  }

  // Esferas de sinal batendo no espelho e voltando vs tentando atravessar
  const pulsos = [];
  for (let i = 0; i < 6; i++) {
    const mPulso = mat(THREE, 0x38bdf8, { emissive: 0x00f0ff, emissiveIntensity: 0.75 });
    const esf = malha(THREE, new THREE.SphereGeometry(0.095, 12, 10), mPulso, false);
    raiz.add(esf);
    pulsos.push({ esf, mat: mPulso, idx: i });
  }

  function atualizar(t) {
    pulsos.forEach((p, i) => {
      const ciclo = (t * 0.95 + i * 0.17) % 1;
      const yBase = 0.85 + (i % 3) * 0.48;
      const zBase = (i % 2 === 0 ? 0.15 : -0.25);

      if (ciclo < 0.5) {
        // Indo em direção à parede/espelho
        const u = ciclo / 0.5;
        p.esf.position.set(lerp(-1.25, -0.22, u), yBase, zBase);
        p.esf.scale.setScalar(1.0);
        p.mat.color.setHex(0x38bdf8);
        p.mat.emissive.setHex(0x00f0ff);
      } else {
        // Rebateu no espelho ou foi sugado pela água do cano
        const u = (ciclo - 0.5) / 0.5;
        if (i % 2 === 0) {
          // Rebate de volta!
          p.esf.position.set(lerp(-0.22, -1.15, u), yBase + u * 0.35, zBase);
          p.mat.color.setHex(0xf59e0b);
          p.mat.emissive.setHex(0xea580c);
          p.esf.scale.setScalar(1.0 - u * 0.4);
        } else {
          // Atravessa enfraquecido após os canos d'água
          p.esf.position.set(lerp(0.25, 1.15, u), yBase, zBase);
          p.mat.color.setHex(0xef4444);
          p.mat.emissive.setHex(0xdc2626);
          p.esf.scale.setScalar(0.42);
        }
      }
    });
  }

  return { raiz, parede, espelho, pulsos, atualizar };
}

/**
 * Frame 04 (Wi-Fi) — O Micro-ondas na cozinha emitindo ondas na mesma frequência e atropelando o Wi-Fi
 */
function criarMicroondasInterferencia(THREE) {
  const raiz = new THREE.Group();

  // Bancada da cozinha
  const mBancada = mat(THREE, 0x334155, { roughness: 0.7 });
  const bancada = malha(THREE, new THREE.BoxGeometry(1.75, 0.16, 1.0), mBancada);
  bancada.position.set(0.15, 0.72, 0);
  raiz.add(bancada);

  // Gabinete do micro-ondas
  const mGabinete = mat(THREE, 0xe2e8f0, { roughness: 0.3, metalness: 0.35 });
  const gabinete = malha(THREE, new THREE.BoxGeometry(1.42, 0.86, 0.82), mGabinete);
  gabinete.position.set(0.15, 1.23, 0);
  raiz.add(gabinete);

  // Visor escuro/laranja aceso do micro-ondas
  const mVisor = mat(THREE, 0xf97316, {
    roughness: 0.15,
    emissive: 0xea580c,
    emissiveIntensity: 0.75,
  });
  const visor = malha(THREE, new THREE.BoxGeometry(0.88, 0.56, 0.06), mVisor, false);
  visor.position.set(-0.02, 1.24, 0.40);
  raiz.add(visor);

  // Painel digital lateral do micro-ondas
  const mPainel = mat(THREE, 0x0f172a, { roughness: 0.3 });
  const painel = malha(THREE, new THREE.BoxGeometry(0.28, 0.64, 0.06), mPainel, false);
  painel.position.set(0.64, 1.24, 0.40);
  raiz.add(painel);

  // Anéis vermelhos/laranjas de ruído do micro-ondas colidindo com anéis azuis do Wi-Fi
  const ondasRuido = [];
  for (let i = 0; i < 4; i++) {
    const mRuido = mat(THREE, 0xef4444, {
      emissive: 0xf97316,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.75,
    });
    const anel = malha(THREE, new THREE.TorusGeometry(0.45 + i * 0.25, 0.038, 10, 22), mRuido, false);
    anel.position.set(0.15, 1.24, 0.2);
    raiz.add(anel);
    ondasRuido.push({ anel, mat: mRuido, idx: i });
  }

  function atualizar(t, ligado = 1.0) {
    const lg = clamp(ligado, 0, 1);
    // Micro-ondas treme levemente quando ligado no máximo
    gabinete.position.x = 0.15 + Math.sin(t * 32) * 0.015 * lg;
    visor.material.emissiveIntensity = lerp(0.15, 0.95 + Math.sin(t * 14) * 0.2, lg);

    ondasRuido.forEach((o, i) => {
      const fase = (t * 1.8 + i * 0.25) % 1;
      o.anel.scale.setScalar(0.55 + fase * 1.15 * (0.3 + lg * 0.7));
      o.anel.rotation.x = Math.sin(t * 3 + i) * 0.45;
      o.anel.rotation.y = Math.cos(t * 2.5 + i) * 0.45;
      o.mat.opacity = (1 - fase) * 0.85 * lg;
    });
  }

  return { raiz, gabinete, visor, ondasRuido, atualizar };
}

/**
 * Frame 05 (Wi-Fi) — O prédio/rua à noite com dezenas de redes dos vizinhos se atropelando
 */
function criarVizinhosCongestionados(THREE) {
  const raiz = new THREE.Group();

  // Prédio residencial de vários andares
  const mPredio = mat(THREE, 0x1e293b, { roughness: 0.6, metalness: 0.25 });
  const torre = malha(THREE, new THREE.BoxGeometry(1.55, 2.15, 0.95), mPredio);
  torre.position.set(0.15, 1.42, -0.15);
  raiz.add(torre);

  // Janelas acesas dos apartamentos dos vizinhos
  const mJanela = mat(THREE, 0xfef08a, { emissive: 0xfacc15, emissiveIntensity: 0.8 });
  const posJanelas = [
    [-0.32, 0.85], [0.15, 0.85], [0.62, 0.85],
    [-0.32, 1.38], [0.15, 1.38], [0.62, 1.38],
    [-0.32, 1.92], [0.15, 1.92], [0.62, 1.92],
  ];
  posJanelas.forEach(([jx, jy]) => {
    const jan = malha(THREE, new THREE.BoxGeometry(0.28, 0.32, 0.06), mJanela, false);
    jan.position.set(jx, jy, 0.34);
    raiz.add(jan);
  });

  // Bolhas/anéis coloridos das redes Wi-Fi dos vizinhos se cruzando e engarrafando o ar
  const coresVizinhos = [0xef4444, 0xf97316, 0xa855f7, 0xec4899, 0xeab308, 0x38bdf8];
  const redes = [];
  for (let i = 0; i < coresVizinhos.length; i++) {
    const cor = coresVizinhos[i];
    const mRede = mat(THREE, cor, {
      emissive: cor,
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.68,
    });
    const anel = malha(THREE, new THREE.TorusGeometry(0.48 + (i % 3) * 0.16, 0.035, 10, 22), mRede, false);
    const [px, py] = posJanelas[i];
    anel.position.set(px, py, 0.42);
    raiz.add(anel);
    redes.push({ anel, mat: mRede, idx: i });
  }

  function atualizar(t, congestionamento = 0.8) {
    const cg = clamp(congestionamento, 0.1, 1.0);
    redes.forEach((r, i) => {
      const pulso = 0.75 + Math.sin(t * (3.2 + i * 0.4) + i) * 0.35 * cg;
      r.anel.scale.setScalar(pulso);
      r.anel.rotation.z = t * (i % 2 === 0 ? 1.5 : -1.5);
      r.anel.rotation.x = Math.sin(t * 2 + i) * 0.35;
    });
  }

  return { raiz, torre, redes, atualizar };
}

/**
 * Frame 06 (Wi-Fi) — Pilha Explodida de 7 Níveis da Jornada do Wi-Fi na Vida Real
 */
function criarPilhaExplodidaWifi(THREE) {
  const grupo = new THREE.Group();

  const definicoes = [
    { id: "roteador",   nome: "1. Roteador no Alto",   cor: 0x22c55e, emissive: 0x16a34a, r: 0.66, h: 0.18, yAlvo: -1.12 },
    { id: "armario",    nome: "2. Fora da Gaveta",     cor: 0x38bdf8, emissive: 0x0284c7, r: 0.58, h: 0.18, yAlvo: -0.70 },
    { id: "parede",     nome: "3. Parede de Tijolo",   cor: 0xd97706, emissive: 0xb45309, r: 0.62, h: 0.19, yAlvo: -0.28 },
    { id: "espelho",    nome: "4. Espelho e Canos",    cor: 0x06b6d4, emissive: 0x00f0ff, r: 0.48, h: 0.21, yAlvo:  0.15 },
    { id: "microondas", nome: "5. Micro-ondas Ligado", cor: 0xef4444, emissive: 0xdc2626, r: 0.54, h: 0.20, yAlvo:  0.58 },
    { id: "vizinhos",   nome: "6. Redes dos Vizinhos", cor: 0xa855f7, emissive: 0x9333ea, r: 0.58, h: 0.18, yAlvo:  1.00 },
    { id: "celular",    nome: "7. Vídeo Liso na Mão",  cor: 0xfacc15, emissive: 0xeab308, r: 0.74, h: 0.22, yAlvo:  1.42 },
  ];

  const pecas = [];
  for (let i = 0; i < definicoes.length; i++) {
    const d = definicoes[i];
    const pecaGrp = new THREE.Group();
    const cilindro = malha(
      THREE,
      new THREE.CylinderGeometry(d.r, d.r * 0.88, d.h, 36),
      mat(THREE, d.cor, {
        roughness: 0.28,
        metalness: 0.25,
        emissive: d.emissive,
        emissiveIntensity: 0.35,
      })
    );
    pecaGrp.add(cilindro);

    const anel = new THREE.Mesh(
      new THREE.TorusGeometry(d.r + 0.025, 0.016, 12, 36),
      new THREE.MeshBasicMaterial({ color: d.emissive, transparent: true, opacity: 0.75 })
    );
    anel.rotation.x = Math.PI / 2;
    pecaGrp.add(anel);

    grupo.add(pecaGrp);
    pecas.push({ ...d, grp: pecaGrp, cilindro, anel });
  }

  const eixoCentral = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 2.9, 16),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 })
  );
  eixoCentral.position.y = 0.16;
  grupo.add(eixoCentral);

  function atualizar(t, tExplosao = 0.2) {
    const uExp = suavissimo(faixa(t, tExplosao, tExplosao + 1.4));
    for (let i = 0; i < pecas.length; i++) {
      const p = pecas[i];
      const yCompacto = -0.4 + i * 0.18;
      p.grp.position.y = lerp(yCompacto, p.yAlvo, uExp) + Math.sin(t * 2.4 + i * 0.65) * 0.03;
      p.grp.rotation.y = t * (0.55 + i * 0.08) + i * 0.3;
      p.grp.rotation.x = 0.16;
    }
  }

  return { grupo, pecas, atualizar };
}


  // --- Módulo: runtime.js ---
// motor/3d/runtime.js — Ponte determinística entre Three.js (WebGL + Software 3D Rasterizer Fallback) e HyperFrames




function sincronizarBonecosCena(nodo, t, offsetGlobal) {
  if (!nodo || !nodo.visible) return;
  if (nodo.userData && nodo.userData.boneco) {
    falar(nodo.userData.boneco, t, offsetGlobal);
    return;
  }
  if (nodo.children && !nodo.isMesh && !nodo.isPoints) {
    for (let i = 0; i < nodo.children.length; i++) {
      sincronizarBonecosCena(nodo.children[i], t, offsetGlobal);
    }
  }
}

/**
 * Rasterizador 3D por Software (Painter's Algorithm em Canvas 2D) para ambientes headless Linux sem GPU/WebGL.
 * Suporta múltiplos estilos gráficos ("padrao", "lowpoly", "papel", "pixel", "toon", "blueprint").
 */
function criarSoftwareRenderer3D(THREE, opcoes = {}) {
  const largura = opcoes.largura ?? 1080;
  const altura = opcoes.altura ?? 1920;
  const estilo =
    opcoes.estilo ||
    (typeof window !== "undefined" && window.__MOTOR_ESTILO_GRAFICO__) ||
    "padrao";

  arredondarGeometrias(THREE, estilo);

  const canvas = opcoes.canvas || document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctxSaida = canvas.getContext("2d");

  // No modo pixel art, renderiza em buffer 6x menor (180x320) e amplia com nearest-neighbor
  const escalaPixel = estilo === "pixel" ? 1 / 6 : 1.0;
  const largRender = Math.round(largura * escalaPixel);
  const altRender = Math.round(altura * escalaPixel);
  const canvasBuffer =
    escalaPixel < 1.0 ? document.createElement("canvas") : canvas;
  if (escalaPixel < 1.0) {
    canvasBuffer.width = largRender;
    canvasBuffer.height = altRender;
  }
  const ctx = canvasBuffer.getContext("2d");

  const matProjView = new THREE.Matrix4();
  const matModelView = new THREE.Matrix4();
  const matNormal = new THREE.Matrix3();
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const nFace = new THREE.Vector3();
  const dirLuz = new THREE.Vector3(0.45, 0.78, 0.43).normalize();
  const dirContra = new THREE.Vector3(-0.35, 0.55, -0.75).normalize();

  function render(cena, camera) {
    if (!ctx) return;
    cena.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    matProjView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

    // 1. Fundo oceânico abissal com gradiente rico
    const bgHex = cena.background ? cena.background.getHex() : 0x041226;
    const rBg = (bgHex >> 16) & 255;
    const gBg = (bgHex >> 8) & 255;
    const bBg = bgHex & 255;

    const grad = ctx.createLinearGradient(0, 0, 0, altRender);
    grad.addColorStop(0.0, `rgb(${Math.max(2, rBg - 12)}, ${Math.max(6, gBg - 16)}, ${Math.max(16, bBg - 22)})`);
    grad.addColorStop(0.48, `rgb(${rBg}, ${gBg}, ${bBg})`);
    grad.addColorStop(1.0, `rgb(${Math.max(3, rBg - 8)}, ${Math.max(10, gBg - 10)}, ${Math.max(20, bBg - 12)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, largRender, altRender);

    // Textura horizontal de papel cartão no modo Papercraft
    if (estilo === "papel") {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 251, 235, 0.045)";
      ctx.lineWidth = 2;
      for (let y = 0; y < altRender; y += 14) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(largRender, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Feixes de luz submarina / atmosférica sutis no topo
    ctx.save();
    const gradRaio = ctx.createRadialGradient(
      largRender * 0.5,
      altRender * 0.36,
      40 * escalaPixel,
      largRender * 0.5,
      altRender * 0.44,
      620 * escalaPixel
    );
    gradRaio.addColorStop(0, "rgba(56, 189, 248, 0.16)");
    gradRaio.addColorStop(0.6, "rgba(14, 116, 144, 0.06)");
    gradRaio.addColorStop(1, "rgba(3, 9, 20, 0)");
    ctx.fillStyle = gradRaio;
    ctx.fillRect(0, 0, largRender, altRender);
    ctx.restore();

    const listaTriangulos = [];
    const listaObjetos = [];
    const listaPontos = [];

    // Percorre objetos visíveis da cena
    cena.traverseVisible((obj) => {
      if (obj.renderOrder === -10) return; // ignora o sky dome de 140m

      if (obj.isPoints && obj.geometry) {
        const posAttr = obj.geometry.attributes.position;
        if (!posAttr) return;
        const corP = obj.material?.color ? obj.material.color.getStyle() : "#7dd3fc";
        const opP = obj.material?.opacity ?? 0.55;
        if (opP <= 0.02) return;
        const passo = Math.max(1, Math.floor(posAttr.count / 90));
        for (let i = 0; i < posAttr.count; i += passo) {
          vA.fromBufferAttribute(posAttr, i).applyMatrix4(obj.matrixWorld);
          vB.copy(vA).applyMatrix4(matProjView);
          if (vB.z >= -1 && vB.z <= 1) {
            listaPontos.push({
              x: (vB.x * 0.5 + 0.5) * largRender,
              y: (-vB.y * 0.5 + 0.5) * altRender,
              z: vB.z,
              cor: corP,
              op: opP,
            });
          }
        }
        return;
      }

      if (!obj.isMesh || !obj.geometry || !obj.material) return;
      const geo = obj.geometry;
      const pos = geo.attributes.position;
      if (!pos) return;

      // Ignora planos gigantes de chão/oceano (> 850 vértices ou Circle/Plane > 8m)
      if (
        pos.count > 850 ||
        (geo.type === "CircleGeometry" && (geo.parameters?.radius ?? 0) > 8) ||
        (geo.type === "PlaneGeometry" && (geo.parameters?.width ?? 0) > 8)
      ) {
        return;
      }

      const mat = obj.material;
      if (mat.opacity !== undefined && mat.opacity <= 0.03) return;

      const corBase = mat.color || new THREE.Color(0x38bdf8);
      const corEmissiva = mat.emissive || new THREE.Color(0x000000);
      const intEmissiva = mat.emissiveIntensity ?? 0;
      const ehBasico = !!mat.isMeshBasicMaterial;
      const opacidade = mat.transparent ? (mat.opacity ?? 0.65) : 1.0;

      const rBase = corBase.r * 255;
      const gBase = corBase.g * 255;
      const bBase = corBase.b * 255;
      const rEm = corEmissiva.r * 255 * intEmissiva;
      const gEm = corEmissiva.g * 255 * intEmissiva;
      const bEm = corEmissiva.b * 255 * intEmissiva;

      matModelView.multiplyMatrices(camera.matrixWorldInverse, obj.matrixWorld);
      matNormal.getNormalMatrix(obj.matrixWorld);

      const index = geo.index;
      const totalIndices = index ? index.count : pos.count;
      const totalTris = Math.floor(totalIndices / 3);
      const passoTri = 1;

      const trisDoObjeto = [];
      let somaZObj = 0;

      for (let t = 0; t < totalTris; t += passoTri) {
        const i0 = index ? index.getX(t * 3) : t * 3;
        const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
        const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;

        vA.fromBufferAttribute(pos, i0).applyMatrix4(obj.matrixWorld);
        vB.fromBufferAttribute(pos, i1).applyMatrix4(obj.matrixWorld);
        vC.fromBufferAttribute(pos, i2).applyMatrix4(obj.matrixWorld);

        // Normal da face no espaço do mundo
        nFace.subVectors(vB, vA);
        const vTemp = new THREE.Vector3().subVectors(vC, vA);
        nFace.cross(vTemp).normalize();

        // Projeção para clip space / NDC
        vA.applyMatrix4(matProjView);
        vB.applyMatrix4(matProjView);
        vC.applyMatrix4(matProjView);

        if (vA.z < -1 || vA.z > 1 || vB.z < -1 || vB.z > 1 || vC.z < -1 || vC.z > 1) continue;

        const x0 = (vA.x * 0.5 + 0.5) * largRender;
        const y0 = (-vA.y * 0.5 + 0.5) * altRender;
        const x1 = (vB.x * 0.5 + 0.5) * largRender;
        const y1 = (-vB.y * 0.5 + 0.5) * altRender;
        const x2 = (vC.x * 0.5 + 0.5) * largRender;
        const y2 = (-vC.y * 0.5 + 0.5) * altRender;

        // Back-face culling em coordenadas de tela (exceto materiais DoubleSide)
        const area2D = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
        if (area2D >= 0 && mat.side !== 2) continue;

        const zMedio = (vA.z + vB.z + vC.z) / 3;
        somaZObj += zMedio;

        let rFinal = rBase;
        let gFinal = gBase;
        let bFinal = bBase;

        if (!ehBasico) {
          const difusa = Math.max(0, nFace.dot(dirLuz));
          const contra = Math.max(0, nFace.dot(dirContra)) * 0.35;
          let ilum = 0.38 + difusa * 0.68 + contra;

          if (estilo === "toon") {
            ilum = difusa > 0.42 ? 1.06 : difusa > 0.14 ? 0.72 : 0.44;
          } else if (estilo === "papel") {
            // 2 tons chapados de papel cartão recortado (iluminado vs dobra de sombra)
            ilum = difusa > 0.32 ? 1.04 : 0.78;
          } else if (estilo === "lowpoly") {
            ilum = Math.round(ilum * 5) / 5;
          } else if (estilo === "pixel") {
            ilum = difusa > 0.38 ? 1.05 : difusa > 0.12 ? 0.76 : 0.48;
          }

          rFinal = Math.min(255, rBase * ilum + rEm);
          gFinal = Math.min(255, gBase * ilum + gEm);
          bFinal = Math.min(255, bBase * ilum + bEm);
        }

        if (estilo === "pixel") {
          rFinal = Math.min(255, Math.round(rFinal / 36) * 36);
          gFinal = Math.min(255, Math.round(gFinal / 36) * 36);
          bFinal = Math.min(255, Math.round(bFinal / 36) * 36);
        }

        const opTri = estilo === "blueprint" ? 0.22 : opacidade;
        const estiloCor =
          opTri < 0.99
            ? `rgba(${rFinal | 0},${gFinal | 0},${bFinal | 0},${opTri.toFixed(2)})`
            : `rgb(${rFinal | 0},${gFinal | 0},${bFinal | 0})`;

        let bordaCor = estiloCor;
        let largBorda = 0.7 * escalaPixel;
        if (estilo === "lowpoly") {
          bordaCor = "rgba(15, 23, 42, 0.22)";
          largBorda = 0.85;
        } else if (estilo === "toon") {
          bordaCor = "rgba(9, 13, 22, 0.45)";
          largBorda = 1.25;
        } else if (estilo === "blueprint") {
          bordaCor = "rgba(56, 189, 248, 0.68)";
          largBorda = 1.1;
        }

        const itemTri = {
          z: zMedio,
          x0,
          y0,
          x1,
          y1,
          x2,
          y2,
          cor: estiloCor,
          borda: bordaCor,
          lw: largBorda,
          transparente: !!mat.transparent,
        };
        listaTriangulos.push(itemTri);
        trisDoObjeto.push(itemTri);
      }

      if (trisDoObjeto.length > 0) {
        trisDoObjeto.sort((a, b) => b.z - a.z);
        listaObjetos.push({
          zMedio: somaZObj / trisDoObjeto.length,
          transparente: !!mat.transparent,
          tris: trisDoObjeto,
        });
      }
    });

    ctx.lineJoin = "round";

    if (estilo === "papel" || estilo === "pixel") {
      // Ordena objetos de trás para frente; objetos transparentes ficam por último
      listaObjetos.sort((a, b) => {
        if (a.transparente !== b.transparente) return a.transparente ? 1 : -1;
        return b.zMedio - a.zMedio;
      });

      for (let m = 0; m < listaObjetos.length; m++) {
        const objItem = listaObjetos[m];
        const tris = objItem.tris;

        if (estilo === "papel" && !objItem.transparente) {
          // 1. Sombra dura deslocada da peça de papel recortado (drop-shadow sólida sem costuras internas)
          ctx.fillStyle = "#030712";
          ctx.strokeStyle = "#030712";
          ctx.lineWidth = 1.5;
          for (let i = 0; i < tris.length; i++) {
            const tri = tris[i];
            ctx.beginPath();
            ctx.moveTo(tri.x0 + 8, tri.y0 + 10);
            ctx.lineTo(tri.x1 + 8, tri.y1 + 10);
            ctx.lineTo(tri.x2 + 8, tri.y2 + 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }

          // 2. Borda creme/branca de papel cartão recortado ao redor da silhueta da peça
          ctx.strokeStyle = "#fef3c7";
          ctx.lineWidth = 5.4;
          for (let i = 0; i < tris.length; i++) {
            const tri = tris[i];
            ctx.beginPath();
            ctx.moveTo(tri.x0, tri.y0);
            ctx.lineTo(tri.x1, tri.y1);
            ctx.lineTo(tri.x2, tri.y2);
            ctx.closePath();
            ctx.stroke();
          }
        } else if (estilo === "pixel" && !objItem.transparente) {
          // Contorno escuro estilo sprite 16-bit ao redor da silhueta da peça
          ctx.strokeStyle = "#050811";
          ctx.lineWidth = 2.6;
          for (let i = 0; i < tris.length; i++) {
            const tri = tris[i];
            ctx.beginPath();
            ctx.moveTo(tri.x0, tri.y0);
            ctx.lineTo(tri.x1, tri.y1);
            ctx.lineTo(tri.x2, tri.y2);
            ctx.closePath();
            ctx.stroke();
          }
        }

        // 3. Preenchimento interno dos triângulos da peça (cobre 100% das arestas internas)
        for (let i = 0; i < tris.length; i++) {
          const tri = tris[i];
          ctx.fillStyle = tri.cor;
          ctx.strokeStyle = tri.cor;
          ctx.lineWidth = estilo === "pixel" ? 0.85 : 1.45;
          ctx.beginPath();
          ctx.moveTo(tri.x0, tri.y0);
          ctx.lineTo(tri.x1, tri.y1);
          ctx.lineTo(tri.x2, tri.y2);
          ctx.closePath();
          ctx.fill();
          if (!tri.transparente) ctx.stroke();
        }
      }
    } else {
      // Ordena todos os triângulos de trás para frente (padrao, lowpoly, toon, blueprint)
      listaTriangulos.sort((a, b) => b.z - a.z);

      for (let i = 0; i < listaTriangulos.length; i++) {
        const tri = listaTriangulos[i];
        ctx.fillStyle = tri.cor;
        ctx.strokeStyle = tri.borda;
        ctx.lineWidth = tri.lw;
        ctx.beginPath();
        ctx.moveTo(tri.x0, tri.y0);
        ctx.lineTo(tri.x1, tri.y1);
        ctx.lineTo(tri.x2, tri.y2);
        ctx.closePath();
        ctx.fill();
        if (!tri.transparente || estilo === "blueprint") ctx.stroke();
      }
    }

    // Desenha partículas de neve marinha / poeira atmosférica
    const raioPt = Math.max(1.2, 2.6 * escalaPixel);
    for (let i = 0; i < listaPontos.length; i++) {
      const pt = listaPontos[i];
      ctx.fillStyle = pt.cor;
      ctx.globalAlpha = pt.op;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, raioPt, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Se estiver no modo Pixel Art, amplia com nearest-neighbor para o canvas final 1080x1920
    if (escalaPixel < 1.0 && ctxSaida) {
      ctxSaida.imageSmoothingEnabled = false;
      ctxSaida.clearRect(0, 0, largura, altura);
      ctxSaida.drawImage(canvasBuffer, 0, 0, largRender, altRender, 0, 0, largura, altura);
    }
  }

  return {
    domElement: canvas,
    isSoftwareFallback: true,
    setSize(w, h) {
      canvas.width = w;
      canvas.height = h;
    },
    setPixelRatio() {},
    render,
  };
}

function criarPalco3D(THREE, opcoes = {}) {
  const largura = opcoes.largura ?? 1080;
  const altura = opcoes.altura ?? 1920;
  const fov = opcoes.fov ?? 42;
  const estilo =
    opcoes.estilo ||
    (typeof window !== "undefined" && window.__MOTOR_ESTILO_GRAFICO__) ||
    "padrao";

  arredondarGeometrias(THREE, estilo);

  const container =
    typeof opcoes.container === "string"
      ? document.querySelector(opcoes.container)
      : opcoes.container;

  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, largura / altura, 0.1, 220);
  camera.position.set(0, 2.2, 6.2);
  camera.lookAt(0, 1.2, 0);

  let renderizador = null;
  let canvas = opcoes.canvas || null;

  // Verifica suporte a WebGL sem disparar erros no console
  let webglDisponivel = false;
  try {
    const probeCanvas = document.createElement("canvas");
    webglDisponivel = !!(
      window.WebGLRenderingContext &&
      (probeCanvas.getContext("webgl2") || probeCanvas.getContext("webgl"))
    );
  } catch {
    webglDisponivel = false;
  }

  // Estilos estilizados (papel, lowpoly, pixel, toon, blueprint) usam o rasterizador estilizado
  if (webglDisponivel && estilo === "padrao") {
    try {
      arredondarGeometrias(THREE);
      renderizador = new THREE.WebGLRenderer({
        canvas: canvas || undefined,
        antialias: true,
        alpha: !!opcoes.alpha,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });
      renderizador.setSize(largura, altura, false);
      renderizador.setPixelRatio(1);
      if (THREE.SRGBColorSpace) {
        renderizador.outputColorSpace = THREE.SRGBColorSpace;
      }
      if (THREE.ACESFilmicToneMapping !== undefined) {
        renderizador.toneMapping = THREE.ACESFilmicToneMapping;
        renderizador.toneMappingExposure = opcoes.exposicao ?? 1.12;
      }
      renderizador.shadowMap.enabled = true;
      if (THREE.PCFSoftShadowMap !== undefined) {
        renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
      }
    } catch {
      renderizador = criarSoftwareRenderer3D(THREE, { largura, altura, canvas, estilo });
    }
  } else {
    renderizador = criarSoftwareRenderer3D(THREE, { largura, altura, canvas, estilo });
  }

  canvas = renderizador.domElement;
  canvas.setAttribute("data-layout-allow-overflow", "true");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  if (estilo === "pixel") {
    canvas.style.imageRendering = "pixelated";
  }
  if (container && !opcoes.canvas) {
    container.setAttribute("data-layout-allow-overflow", "true");
    container.innerHTML = "";
    container.appendChild(canvas);
  }

  const ceu = montarCeu(THREE, cena);
  const luzes = montarLuzes(THREE, cena);
  const palco = {
    THREE,
    cena,
    camera,
    renderizador,
    canvas,
    largura,
    altura,
    estilo,
    ceu,
    ...luzes,
  };

  aplicarCeu(THREE, palco, opcoes.presetCeu || "mar");

  return palco;
}

/**
 * Conecta um palco Three.js à timeline GSAP da sub-composição HyperFrames e ao evento `hf-seek`.
 * Garante renderização 100% determinística quadro a quadro tanto no preview quanto no render final MP4.
 */
function conectarHyperFrames(palco, tl, fnCena, opcoes = {}) {
  const duracao = opcoes.duracao ?? 7.5;
  const respirarCamera = opcoes.respirarCamera !== false;
  const offsetGlobal = opcoes.offsetGlobal ?? 0;

  let ultimoTempo = -1;

  function renderizarEm(tLocal) {
    const t = Math.max(0, Math.min(duracao, tLocal));
    ultimoTempo = t;

    fnCena(t, palco);

    if (opcoes.sincronizarFala !== false && palco && palco.cena) {
      sincronizarBonecosCena(palco.cena, t, offsetGlobal);
    }

    if (respirarCamera) {
      camRespira(palco.camera, t, opcoes.amplitudeRespiracao ?? 0.032);
    }

    if (palco.contra && palco.camera) {
      palco.contra.position.set(
        -palco.camera.position.x * 0.85,
        Math.max(4, palco.camera.position.y + 3.5),
        -palco.camera.position.z * 0.85 - 3
      );
    }

    if (palco.renderizador) {
      palco.renderizador.render(palco.cena, palco.camera);
    }
  }

  if (tl) {
    const proxy = { t: 0 };
    tl.to(
      proxy,
      {
        t: duracao,
        duration: duracao,
        ease: "none",
        onUpdate: () => {
          renderizarEm(proxy.t);
        },
      },
      0
    );
  }

  if (typeof window !== "undefined") {
    window.addEventListener("hf-seek", (ev) => {
      const globalT = ev?.detail?.time;
      if (typeof globalT === "number") {
        const localT = globalT - offsetGlobal;
        if (localT >= -0.05 && localT <= duracao + 0.05) {
          renderizarEm(localT);
        }
      }
    });
  }

  if (offsetGlobal === 0) {
    renderizarEm(0);
  }

  return { renderizarEm, getUltimoTempo: () => ultimoTempo };
}

  exportsObj.criarRand = criarRand;
  exportsObj.arredondarGeometrias = arredondarGeometrias;
  exportsObj.mat = mat;
  exportsObj.malha = malha;
  exportsObj.manchaSombra = manchaSombra;
  exportsObj.rand = rand;
  exportsObj.clamp = clamp;
  exportsObj.lerp = lerp;
  exportsObj.lerp3 = lerp3;
  exportsObj.faixa = faixa;
  exportsObj.suave = suave;
  exportsObj.suavissimo = suavissimo;
  exportsObj.saiVolta = saiVolta;
  exportsObj.quica = quica;
  exportsObj.pulso = pulso;
  exportsObj.queda = queda;
  exportsObj.montarCeu = montarCeu;
  exportsObj.aplicarCeu = aplicarCeu;
  exportsObj.montarLuzes = montarLuzes;
  exportsObj.CEUS = CEUS;
  exportsObj.mirar = mirar;
  exportsObj.plano = plano;
  exportsObj.camRespira = camRespira;
  exportsObj.tremer = tremer;
  exportsObj.tela = tela;
  exportsObj.criarBoneco = criarBoneco;
  exportsObj.resetPose = resetPose;
  exportsObj.humor = humor;
  exportsObj.falar = falar;
  exportsObj.olharCamera = olharCamera;
  exportsObj.andar = andar;
  exportsObj.correr = correr;
  exportsObj.pular = pular;
  exportsObj.acenar = acenar;
  exportsObj.comemorar = comemorar;
  exportsObj.apontar = apontar;
  exportsObj.pensar = pensar;
  exportsObj.suar = suar;
  exportsObj.segurar = segurar;
  exportsObj.capacete = capacete;
  exportsObj.capaceteEspacial = capaceteEspacial;
  exportsObj.criarFundoDoMar = criarFundoDoMar;
  exportsObj.criarTerra = criarTerra;
  exportsObj.criarCaboSubmarino = criarCaboSubmarino;
  exportsObj.criarPilhaExplodidaCabo = criarPilhaExplodidaCabo;
  exportsObj.normalizarModeloExterno = normalizarModeloExterno;
  exportsObj.criarPlanetaTermico = criarPlanetaTermico;
  exportsObj.criarEsponjaAtmosferica = criarEsponjaAtmosferica;
  exportsObj.criarVorticeCiclonico = criarVorticeCiclonico;
  exportsObj.criarCorrenteDeJato = criarCorrenteDeJato;
  exportsObj.criarCorteSoloUrbano = criarCorteSoloUrbano;
  exportsObj.criarPilhaExplodidaTempestade = criarPilhaExplodidaTempestade;
  exportsObj.criarRoteadorSinalFraco = criarRoteadorSinalFraco;
  exportsObj.criarRoteadorArmario = criarRoteadorArmario;
  exportsObj.criarParedeObstaculosCasa = criarParedeObstaculosCasa;
  exportsObj.criarMicroondasInterferencia = criarMicroondasInterferencia;
  exportsObj.criarVizinhosCongestionados = criarVizinhosCongestionados;
  exportsObj.criarPilhaExplodidaWifi = criarPilhaExplodidaWifi;
  exportsObj.criarPalco3D = criarPalco3D;
  exportsObj.conectarHyperFrames = conectarHyperFrames;
  global.Motor3D = exportsObj;
})(typeof window !== "undefined" ? window : globalThis);
