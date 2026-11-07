// motor/3d/environments.js — Ambientes procedurais 3D (Fundo do Mar Abissal com Caustics GLSL e Mundo Terrestre)

import { rand, mat, malha } from "./math.js";
import { aplicarCeu } from "./lighting.js";

export function criarFundoDoMar(THREE, palco, opts = {}) {
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

export function criarTerra(THREE, palco, corGrama = 0x569e4c) {
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
