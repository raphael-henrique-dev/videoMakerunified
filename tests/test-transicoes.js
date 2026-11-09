import { test } from "node:test";
import assert from "node:assert/strict";
import { TRANSICOES, planejarTransicao, escolherTransicao, emitirTweensJs, resetarClips } from "../motor/2d/transicoes.js";
import { obterPerfil } from "../motor/formato.js";

const p = { tCorte: 10, idSaida: "clip-f1", idEntrada: "clip-f2", largura: 1920 };

test("as 5 transições existem; flash é tratado pelo overlay (sem tweens)", () => {
  assert.deepEqual(TRANSICOES, ["flash", "fade", "wipe", "push", "zoom"]);
  assert.deepEqual(planejarTransicao("flash", p), []);
});

test("cada transição é determinística e atua em torno do corte", () => {
  for (const nome of ["fade", "wipe", "push", "zoom"]) {
    const a = planejarTransicao(nome, p);
    assert.deepEqual(a, planejarTransicao(nome, p));
    assert.ok(a.length >= 1);
    for (const tw of a) assert.ok(tw.em >= 9.7 && tw.em <= 10.3, `${nome} em=${tw.em}`);
    assert.ok(a.some((tw) => tw.alvo === "#clip-f2"), `${nome} anima a entrada`);
  }
  assert.throws(() => planejarTransicao("spin", p), /desconhecida/);
});

test("emitirTweensJs gera código GSAP válido", () => {
  const js = emitirTweensJs([...resetarClips(["clip-f1"]), ...planejarTransicao("push", p)]);
  new Function("tl", js)({ set() {}, to() {}, fromTo() {} });
});

test("escolha: curto sempre flash; horizontal alterna e usa zoom na troca de capítulo", () => {
  const curto = obterPerfil({});
  const h = obterPerfil({ formato: "horizontal" });
  assert.equal(escolherTransicao(curto, { transicao: "wipe" }, null, 0), "flash");
  assert.equal(escolherTransicao(h, { transicao: "wipe" }, null, 0), "wipe");
  assert.deepEqual([0, 1, 2, 3].map((i) => escolherTransicao(h, { capituloId: "a" }, { capituloId: "a" }, i)), ["fade", "wipe", "push", "fade"]);
  assert.equal(escolherTransicao(h, { capituloId: "b" }, { capituloId: "a" }, 0), "zoom");
});
