import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import { montarBundle } from "../scripts/build-3d-global.js";

const CODIGO_THREE = fs.readFileSync(new URL("../assets/vendor/three.min.js", import.meta.url), "utf8");
let THREE;

// DOM mínimo: canvas com contexto 2D "mudo" (sem WebGL, então o motor usa o rasterizador por software)
function criarContexto() {
  const ctx2d = new Proxy(function () {}, { get: (_, k) => (k === "createRadialGradient" || k === "createLinearGradient" ? () => ({ addColorStop() {} }) : ctx2d), apply: () => ctx2d, set: () => true });
  const canvas = () => ({ width: 0, height: 0, style: {}, setAttribute() {}, getContext: () => ctx2d });
  const janela = { addEventListener() {}, devicePixelRatio: 1 };
  const doc = { createElement: canvas, querySelector: () => null };
  const sandbox = { window: janela, document: doc, console, getComputedStyle: () => ({ position: "relative" }) };
  janela.document = doc;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(CODIGO_THREE, sandbox);
  sandbox.THREE = THREE = sandbox.THREE || sandbox.globalThis.THREE;
  return sandbox;
}

function carregarMotor3D(qualidade) {
  const sandbox = criarContexto();
  if (qualidade) sandbox.window.__MOTOR_QUALIDADE__ = qualidade;
  vm.runInContext(montarBundle().codigoCombinado, sandbox);
  return { M: sandbox.window.Motor3D, sandbox };
}

test("palco 3D sobe sem erro de referência e expõe qualidade e luzes de recorte", () => {
  const { M, sandbox } = carregarMotor3D();
  const palco = M.criarPalco3D(THREE, { largura: 270, altura: 480 });
  assert.equal(palco.qualidade, "alta");
  assert.ok(palco.contra && palco.recorteLateral);
  assert.equal(palco.contra.intensity > 1, true, "luz de recorte forte no modo alta");
  const legado = carregarMotor3D("legado");
  const palcoLegado = legado.M.criarPalco3D(THREE, { largura: 270, altura: 480 });
  assert.equal(palcoLegado.qualidade, "legado");
  assert.ok(palcoLegado.contra.intensity < 1, "modo legado mantém a luz de recorte original");
  assert.ok(sandbox);
});

test("fundo do mar monta cenário em camadas e anima de forma determinística", () => {
  const { M } = carregarMotor3D();
  const palco = M.criarPalco3D(THREE, { largura: 270, altura: 480 });
  const amb = M.criarFundoDoMar(THREE, palco, {});
  const posicoes = () => amb.grp.children.filter((o) => o.isPoints).map((o) => Array.from(o.geometry.attributes.position.array).join(","));
  amb.animarAmbiente(2.5);
  const a = posicoes();
  amb.animarAmbiente(7);
  amb.animarAmbiente(2.5);
  assert.deepEqual(posicoes(), a, "mesmo t, mesmo quadro");
  assert.ok(a.length >= 3, "3 camadas de partículas");
  assert.ok(amb.grp.children.length > 40);
});

test("enquadrar() faz o objeto caber na tela; dentroDaTela() detecta corte", () => {
  const { M } = carregarMotor3D();
  const camera = new THREE.PerspectiveCamera(42, 1080 / 1920, 0.1, 100);
  camera.position.set(0, 2, 3);
  const grupo = new THREE.Group();
  const caixa = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1), new THREE.MeshBasicMaterial());
  caixa.position.set(0, 1, 0);
  grupo.add(caixa);
  camera.lookAt(0, 1, 0);
  assert.equal(M.dentroDaTela(THREE, grupo, camera).dentro, false, "de perto, a caixa larga é cortada");
  M.enquadrar(THREE, camera, grupo, { margem: 0.15 });
  const r = M.dentroDaTela(THREE, grupo, camera, 0.04);
  assert.equal(r.dentro, true, JSON.stringify(r));
});
