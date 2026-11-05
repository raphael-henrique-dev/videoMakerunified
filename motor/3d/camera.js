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
export function tela(THREE, ponto3D, camera, largura = 1080, altura = 1920) {
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
