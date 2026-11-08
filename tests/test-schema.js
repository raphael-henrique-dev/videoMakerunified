import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { validarRoteiro } from "../motor/schema/roteiro.schema.js";

const base = () => ({ id: "x", titulo: "X", frames: [{ id: "f1", arquivo: "compositions/frames/f1.html", frases: [{ texto: "oi" }] }] });

test("todos os roteiros existentes em videos/ continuam válidos", () => {
  for (const slug of fs.existsSync("videos") ? fs.readdirSync("videos") : []) {
    const p = path.join("videos", slug, "roteiro.json");
    if (!fs.existsSync(p)) continue;
    const r = validarRoteiro(JSON.parse(fs.readFileSync(p, "utf8")));
    assert.equal(r.valido, true, `${slug}: ${r.erros.join("; ")}`);
  }
});

test("'cena' sem 'arquivo' é rejeitada com mensagem clara", () => {
  const r = validarRoteiro({ ...base(), frames: [{ id: "f1", cena: "x", frases: [{ texto: "oi" }] }] });
  assert.equal(r.valido, false);
  assert.match(r.erros.join(" "), /use 'arquivo'/);
});

test("som inexistente vira aviso (sem duplicar) e não bloqueia", () => {
  const r = base();
  r.frames[0].frases = [{ texto: "a" }, { texto: "b" }];
  r.frames[0].sons = [{ nome: "som-que-nao-existe" }];
  const v = validarRoteiro(r);
  assert.equal(v.valido, true);
  assert.equal(v.avisos.length, 1);
});
