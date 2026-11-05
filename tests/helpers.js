// tests/helpers.js — utilitários compartilhados pelos testes da auditoria visual
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

export function dirTemporario(prefixo = "motor-audit-test-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefixo));
}

/**
 * Gera PNGs sintéticos 1080x1920 via Python/PIL.
 * tipos: "preto", "uniforme", "cena" (gradiente + formas), "texto-rodape", "cena-deslocada"
 */
export function gerarPng(caminho, tipo, semente = 0) {
  const script = `
import sys, random
from PIL import Image, ImageDraw, ImageFont
caminho, tipo, semente = sys.argv[1], sys.argv[2], int(sys.argv[3])
random.seed(semente)
W, H = 1080, 1920
if tipo == "preto":
    img = Image.new("RGB", (W, H), (2, 2, 3))
elif tipo == "uniforme":
    img = Image.new("RGB", (W, H), (40, 60, 90))
else:
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=(20 + y * 60 // H, 30 + y * 40 // H, 70 + y * 80 // H))
    dx = 90 if tipo == "cena-deslocada" else 0
    d.ellipse([300 + dx, 600, 780 + dx, 1080], fill=(230, 120, 40))
    d.rectangle([200, 1150, 880, 1250], fill=(40, 200, 160))
    try:
        f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 54)
    except Exception:
        f = ImageFont.load_default()
    d.text((180, 320), "TITULO DA CENA", font=f, fill=(250, 250, 250))
    if tipo == "texto-rodape":
        for i in range(5):
            d.text((60, 1580 + i * 66), "TEXTO IMPORTANTE ESCONDIDO 12345", font=f, fill=(255, 255, 255))
img.save(caminho)
`;
  execFileSync("python3", ["-c", script, caminho, tipo, String(semente)]);
  return caminho;
}

/** Buffer RGB cru sintético (largura x altura) preenchido por uma função (x,y)->[r,g,b]. */
export function bufferRgb(largura, altura, fn) {
  const buf = Buffer.alloc(largura * altura * 3);
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const [r, g, b] = fn(x, y);
      const i = (y * largura + x) * 3;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
    }
  }
  return buf;
}
