// motor/3d/runtime.js — Ponte determinística entre Three.js (WebGL + Software 3D Rasterizer Fallback) e HyperFrames

import { arredondarGeometrias } from "./math.js";
import { montarCeu, montarLuzes, aplicarCeu } from "./lighting.js";
import { camRespira } from "./camera.js";
import { falar } from "./character.js";

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

export function criarPalco3D(THREE, opcoes = {}) {
  // `perfil` é um objeto de motor/formato.js passado pelo chamador (este módulo vai para o bundle do browser e não importa formato.js)
  const perfil = opcoes.perfil && typeof opcoes.perfil === "object" ? opcoes.perfil : null;
  const largura = opcoes.largura ?? perfil?.largura ?? 1080;
  const altura = opcoes.altura ?? perfil?.altura ?? 1920;
  const fov = opcoes.fov ?? perfil?.camera?.fov ?? 42;
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
  camera.position.set(0, 2.2, opcoes.cameraZ ?? perfil?.camera?.z ?? 6.2);
  camera.userData.largura = largura;
  camera.userData.altura = altura;
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
export function conectarHyperFrames(palco, tl, fnCena, opcoes = {}) {
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
