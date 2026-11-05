// motor/3d/math.js — Matemática determinística, curvas de animação e helpers de malha/material

export function criarRand(sementeInicial = 1234567) {
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

export const rand = criarRand(1234567);

export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, u) => a + (b - a) * clamp(u);
export const lerp3 = (a, b, u) => [
  lerp(a[0], b[0], u),
  lerp(a[1], b[1], u),
  lerp(a[2], b[2], u),
];
export const faixa = (t, ini, fim) => clamp((t - ini) / Math.max(0.0001, fim - ini));

export const suave = (u) => {
  const x = clamp(u);
  return x * x * (3 - 2 * x);
};

export const suavissimo = (u) => {
  const x = clamp(u);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export const saiVolta = (u, s = 1.5) => {
  const x = clamp(u) - 1;
  return x * x * ((s + 1) * x + s) + 1;
};

export const quica = (u) => {
  let x = clamp(u);
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
};

export const pulso = (u) => Math.sin(clamp(u) * Math.PI);
export const queda = (u) => {
  const x = clamp(u);
  return x * x;
};

export function arredondarGeometrias(THREE, estilo = "padrao", ehWebGL = false) {
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

export function mat(THREE, cor, opts = {}) {
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

export function malha(THREE, geo, material, sombra = true) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = sombra;
  m.receiveShadow = sombra;
  return m;
}

export function manchaSombra(THREE, raio = 0.7) {
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
