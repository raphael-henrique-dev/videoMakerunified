import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { executarHeuristicas } from "../motor/audit/heuristics.js";
import { obterPerfil } from "../motor/formato.js";
import { dirTemporario } from "./helpers.js";

// Quadro 1920x1080 com bloco xadrez (alta densidade de bordas) em (x,y,w,h)
function quadro(caminho, bloco) {
  const script = `
import sys
from PIL import Image, ImageDraw
caminho, x, y, w, h = sys.argv[1], *map(int, sys.argv[2:6])
img = Image.new("RGB", (1920, 1080), (11, 18, 32))
d = ImageDraw.Draw(img)
for cy in range(y, y + h, 40):
    for cx in range(x, x + w, 40):
        if ((cx - x) // 40 + (cy - y) // 40) % 2 == 0:
            d.rectangle([cx, cy, min(cx + 39, x + w - 1), min(cy + 39, y + h - 1)], fill=(240, 240, 250))
img.save(caminho)
`;
  execFileSync("python3", ["-c", script, caminho, ...bloco.map(String)]);
}

async function auditar(bloco) {
  const dir = dirTemporario();
  const png = path.join(dir, "q.png");
  quadro(png, bloco);
  const r = await executarHeuristicas(
    [{ id: "c1", amostras: [{ caminho: png, tempo: 1 }, { caminho: png, tempo: 2 }] }],
    { preferencia: "python", perfil: obterPerfil({ formato: "horizontal" }) }
  );
  return r.cenas[0].alertas.filter((a) => a.zona);
}

test("horizontal: conteúdo no miolo (topo e base) não gera alerta de zona", async () => {
  assert.deepEqual(await auditar([600, 200, 800, 280]), []);
  assert.deepEqual(await auditar([600, 720, 800, 280]), []);
});

test("horizontal: conteúdo na margem esquerda ou na margem inferior gera alerta", async () => {
  assert.ok((await auditar([0, 300, 80, 600])).length > 0);
  assert.ok((await auditar([500, 1020, 900, 60])).length > 0);
});
