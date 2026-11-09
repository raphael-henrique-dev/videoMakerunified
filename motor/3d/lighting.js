// motor/3d/lighting.js — Céu procedural (shader GLSL + estrelas) e sistema de iluminação cinematográfica

import { rand } from "./math.js";

export const CEUS = {
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

export function montarCeu(THREE, cena) {
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

export function aplicarCeu(THREE, palco, presetNome = "mar") {
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
  if (palco.qualidade === "legado") {
    cena.fog = new THREE.FogExp2(cfg.nevoa, cfg.dens);
  } else {
    // Névoa mais leve e mais clara que o fundo: a profundidade vem da cor, não do escurecimento do sujeito
    const corNevoa = new THREE.Color(cfg.nevoa).lerp(new THREE.Color(cfg.horizonte), 0.5);
    cena.fog = new THREE.FogExp2(corNevoa, cfg.dens * 0.6);
    // Luz de recorte (rim) na cor do preset, para separar o sujeito do fundo
    const rim = new THREE.Color(cfg.solCor).lerp(new THREE.Color(0xffffff), 0.35);
    if (palco.contra) {
      palco.contra.color.copy(rim);
      palco.contra.intensity = 2.4;
    }
    if (palco.recorteLateral) {
      palco.recorteLateral.color.copy(rim);
      palco.recorteLateral.intensity = 1.6;
    }
    if (palco.preenchimento) palco.preenchimento.intensity = 0.62;
  }
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

export function montarLuzes(THREE, cena) {
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

  // Segunda luz de recorte, lateral e baixa, para delinear o contorno do lado oposto à luz principal
  const recorteLateral = new THREE.DirectionalLight(0x7dd3fc, 0.8);
  recorteLateral.position.set(9, 4, -7);
  cena.add(recorteLateral);

  return { luzAmbiente, sol, preenchimento, contra, recorteLateral };
}
