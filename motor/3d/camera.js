// motor/3d/camera.js — Direção de câmera, interpolação de planos e projeção 3D -> 2D

import { faixa, suavissimo, lerp3, pulso } from "./math.js";

const _alvoAtual = [0, 1.5, 0];

export function mirar(camera, x, y, z) {
  _alvoAtual[0] = x;
  _alvoAtual[1] = y;
  _alvoAtual[2] = z;
  camera.lookAt(x, y, z);
}

export function plano(camera, t, tIni, tFim, de, para, fnCurva = suavissimo) {
  const u = fnCurva(faixa(t, tIni, tFim));
  const p = lerp3(de.pos, para.pos, u);
  const a = lerp3(de.alvo, para.alvo, u);
  camera.position.set(p[0], p[1], p[2]);
  mirar(camera, a[0], a[1], a[2]);
}

export function camRespira(camera, t, amp = 0.04) {
  camera.position.x += Math.sin(t * 1.35) * amp;
  camera.position.y += Math.cos(t * 1.05) * amp * 0.7;
  camera.lookAt(_alvoAtual[0], _alvoAtual[1], _alvoAtual[2]);
}

export function tremer(camera, t, tIni, dur = 0.35, intensidade = 0.14) {
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
export function tela(THREE, ponto3D, camera, largura = camera?.userData?.largura || 1080, altura = camera?.userData?.altura || 1920) {
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

/**
 * Lento avanço de câmera (dolly-in) ao longo da cena: soma, na direção do alvo, um deslocamento de 0 a `dist`.
 * Chame depois de `plano()`/posicionar a câmera no quadro (a posição é reescrita a cada quadro, sem acúmulo).
 */
export function camDeriva(camera, t, dur, dist = 0.6) {
  const u = suavissimo(faixa(t, 0, Math.max(0.001, dur)));
  const dx = _alvoAtual[0] - camera.position.x;
  const dy = _alvoAtual[1] - camera.position.y;
  const dz = _alvoAtual[2] - camera.position.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  camera.position.x += (dx / len) * dist * u;
  camera.position.y += (dy / len) * dist * u;
  camera.position.z += (dz / len) * dist * u;
  camera.lookAt(_alvoAtual[0], _alvoAtual[1], _alvoAtual[2]);
}

/** Retângulo (0..1) que a caixa envolvente do objeto ocupa na tela e se está dentro de [margem, 1-margem]. */
export function dentroDaTela(THREE, objeto, camera, margem = 0.04) {
  const caixa = new THREE.Box3().setFromObject(objeto);
  camera.updateMatrixWorld();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < 8; i++) {
    const v = new THREE.Vector3(i & 1 ? caixa.max.x : caixa.min.x, i & 2 ? caixa.max.y : caixa.min.y, i & 4 ? caixa.max.z : caixa.min.z).project(camera);
    x0 = Math.min(x0, v.x * 0.5 + 0.5);
    x1 = Math.max(x1, v.x * 0.5 + 0.5);
    y0 = Math.min(y0, -v.y * 0.5 + 0.5);
    y1 = Math.max(y1, -v.y * 0.5 + 0.5);
  }
  return { dentro: x0 >= margem && x1 <= 1 - margem && y0 >= margem && y1 <= 1 - margem, x0, y0, x1, y1 };
}

/**
 * Enquadra um ou mais objetos: afasta/aproxima a câmera, mantendo a direção atual, até que a esfera envolvente
 * caiba no campo de visão (vertical e horizontal) com `margem`, e mira no centro (deslocado por `deslocamentoY`,
 * em frações da altura visível, para deixar espaço para cards 2D).
 * @returns {{distancia:number, centro:number[]}}
 */
export function enquadrar(THREE, camera, alvos, { margem = 0.12, deslocamentoY = 0 } = {}) {
  const lista = Array.isArray(alvos) ? alvos : [alvos];
  const caixa = new THREE.Box3();
  lista.forEach((o) => caixa.expandByObject(o));
  const esfera = caixa.getBoundingSphere(new THREE.Sphere());
  const fovV = (camera.fov * Math.PI) / 180;
  const fovH = 2 * Math.atan(Math.tan(fovV / 2) * camera.aspect);
  const distancia = (esfera.radius / Math.sin(Math.min(fovV, fovH) / 2)) * (1 + margem);
  const centro = esfera.center.clone();
  const dir = camera.position.clone().sub(_alvoVec(THREE)).normalize();
  if (!Number.isFinite(dir.x) || dir.lengthSq() === 0) dir.set(0, 0.12, 1).normalize();
  const alturaVisivel = 2 * distancia * Math.tan(fovV / 2);
  const alvo = centro.clone();
  alvo.y -= deslocamentoY * alturaVisivel;
  camera.position.copy(centro.clone().add(dir.multiplyScalar(distancia)));
  camera.position.y -= deslocamentoY * alturaVisivel;
  mirar(camera, alvo.x, alvo.y, alvo.z);
  return { distancia, centro: [centro.x, centro.y, centro.z] };
}

function _alvoVec(THREE) {
  return new THREE.Vector3(_alvoAtual[0], _alvoAtual[1], _alvoAtual[2]);
}
