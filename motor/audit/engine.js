// motor/audit/engine.js — Camada de abstração de imagem do Tier 1 (híbrida: sharp → Python/PIL)
//
// Seleção do motor (variável MOTOR_CV_ENGINE ou opção `preferencia`):
//   auto   (padrão) usa `sharp` se estiver instalado no projeto; senão cai para python3 + PIL.
//   sharp  exige o pacote npm `sharp`.
//   python exige python3 com Pillow (motor/audit/cv_engine.py).
//
// Todos os motores expõem a MESMA interface, e as métricas de visão são calculadas em JS
// (motor/audit/heuristics.js) sobre buffers RGB crus — assim os dois motores geram
// diagnósticos equivalentes (fonte única de verdade para os algoritmos).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CV_ENGINE_PY = path.join(__dirname, "cv_engine.py");
const PYTHON_BIN = process.env.MOTOR_PYTHON || "python3";

function escaparXml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Motor Python/PIL (sempre disponível em Linux com python3-pil)
// ---------------------------------------------------------------------------
function criarMotorPython() {
  const rodar = (args, opts = {}) =>
    execFileSync(PYTHON_BIN, [CV_ENGINE_PY, ...args], {
      maxBuffer: 512 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
      ...opts,
    });

  return {
    nome: "python-pil",
    async decodificar(caminhos, largura, altura) {
      if (!caminhos.length) return [];
      const bruto = rodar(["decode", "--width", String(largura), "--height", String(altura), ...caminhos]);
      const tamanho = largura * altura * 3;
      if (bruto.length !== tamanho * caminhos.length) {
        throw new Error(`cv_engine.py decode retornou ${bruto.length} bytes (esperado ${tamanho * caminhos.length}).`);
      }
      return caminhos.map((_, i) => bruto.subarray(i * tamanho, (i + 1) * tamanho));
    },
    async codificarJpeg(entrada, saida, { maxLargura = 2048, maxBytes = 900_000 } = {}) {
      const out = rodar([
        "encode",
        "--in",
        entrada,
        "--out",
        saida,
        "--max-width",
        String(maxLargura),
        "--max-bytes",
        String(maxBytes),
      ]);
      return JSON.parse(out.toString("utf8"));
    },
    async montarPrancha(spec) {
      const tmp = path.join(os.tmpdir(), `motor-sheet-${process.pid}-${Date.now()}.json`);
      fs.writeFileSync(tmp, JSON.stringify(spec), "utf8");
      try {
        return JSON.parse(rodar(["sheet", "--spec", tmp]).toString("utf8"));
      } finally {
        fs.rmSync(tmp, { force: true });
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Motor sharp (libvips) — opcional, mais rápido e sem processo externo
// ---------------------------------------------------------------------------
function criarMotorSharp(sharp) {
  const hex = (h, a = 1) => {
    const s = h.replace("#", "");
    return `rgba(${parseInt(s.slice(0, 2), 16)},${parseInt(s.slice(2, 4), 16)},${parseInt(s.slice(4, 6), 16)},${a})`;
  };

  return {
    nome: "sharp",
    async decodificar(caminhos, largura, altura) {
      return Promise.all(
        caminhos.map((c) =>
          sharp(c)
            .flatten({ background: "#000000" })
            .removeAlpha()
            .resize(largura, altura, { fit: "fill", kernel: "linear" })
            .raw()
            .toBuffer()
        )
      );
    },
    async codificarJpeg(entrada, saida, { maxLargura = 2048, maxBytes = 900_000 } = {}) {
      const meta = await sharp(entrada).metadata();
      let largura = Math.min(maxLargura, meta.width);
      let qualidade = 85;
      let dados;
      for (;;) {
        dados = await sharp(entrada).flatten({ background: "#000000" }).resize({ width: largura }).jpeg({ quality: qualidade, mozjpeg: true }).toBuffer();
        if (dados.length <= maxBytes || (largura <= 320 && qualidade <= 45)) break;
        if (qualidade > 55) qualidade -= 10;
        else largura = Math.floor(largura * 0.8);
      }
      fs.writeFileSync(saida, dados);
      const altura = Math.round((meta.height * largura) / meta.width);
      return { ok: true, bytes: dados.length, largura, altura, qualidade };
    },
    async montarPrancha(spec) {
      const tileW = spec.tileWidth;
      const tileH = spec.tileHeight;
      const colunas = spec.columns;
      const headerH = spec.headerHeight ?? 56;
      const gap = spec.gap ?? 12;
      const tituloH = spec.titleHeight ?? 0;
      const linhas = Math.max(1, Math.ceil(spec.tiles.length / colunas));
      const largTotal = colunas * tileW + (colunas + 1) * gap;
      const altTotal = tituloH + linhas * (tileH + headerH) + (linhas + 1) * gap;
      const ex = tileW / (spec.sourceWidth ?? 1080);
      const ey = tileH / (spec.sourceHeight ?? 1920);

      const camadas = [];
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largTotal}" height="${altTotal}">`;
      if (tituloH) {
        svg += `<text x="${gap}" y="${Math.round(tituloH * 0.65)}" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="${Math.max(14, Math.floor(tituloH / 2))}" fill="#ebeef5">${escaparXml(spec.title)}</text>`;
      }
      for (let i = 0; i < spec.tiles.length; i++) {
        const tile = spec.tiles[i];
        const lin = Math.floor(i / colunas);
        const col = i % colunas;
        const x0 = gap + col * (tileW + gap);
        const y0 = tituloH + gap + lin * (tileH + headerH + gap);
        const statusCor = tile.statusColor ?? "#22c55e";

        const frame = await sharp(tile.path).flatten({ background: "#000000" }).resize(tileW, tileH, { fit: "fill" }).png().toBuffer();
        camadas.push({ input: frame, left: x0, top: y0 + headerH });

        svg += `<rect x="${x0}" y="${y0}" width="${tileW}" height="${headerH}" fill="#181c26"/>`;
        svg += `<rect x="${x0}" y="${y0}" width="9" height="${headerH}" fill="${statusCor}"/>`;
        svg += `<text x="${x0 + 16}" y="${y0 + Math.round(headerH * 0.42)}" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="${Math.max(12, Math.floor(headerH / 3))}" fill="#ebeef5">${escaparXml(tile.label)}</text>`;
        svg += `<text x="${x0 + 16}" y="${y0 + Math.round(headerH * 0.85)}" font-family="DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="${Math.max(11, Math.floor(headerH / 4))}" fill="${statusCor}">${escaparXml(tile.sublabel)}</text>`;
        for (const z of spec.zones ?? []) {
          const violada = (tile.violatedZones ?? []).includes(z.id);
          svg += `<rect x="${x0 + Math.round(z.x * ex)}" y="${y0 + headerH + Math.round(z.y * ey)}" width="${Math.round(z.w * ex)}" height="${Math.round(z.h * ey)}" fill="${hex(z.color ?? "#ef4444", violada ? 0.27 : 0.13)}" stroke="${hex(z.color ?? "#ef4444", violada ? 0.9 : 0.55)}" stroke-width="${violada ? 3 : 1}"/>`;
        }
        svg += `<rect x="${x0 + 1.5}" y="${y0 + headerH + 1.5}" width="${tileW - 3}" height="${tileH - 3}" fill="none" stroke="${statusCor}" stroke-width="3"/>`;
      }
      svg += `</svg>`;
      camadas.push({ input: Buffer.from(svg), left: 0, top: 0 });

      await sharp({ create: { width: largTotal, height: altTotal, channels: 3, background: "#0c0e14" } })
        .composite(camadas)
        .jpeg({ quality: spec.quality ?? 85 })
        .toFile(spec.output);
      return { ok: true, output: spec.output, largura: largTotal, altura: altTotal };
    },
  };
}

let cache = null;

/**
 * Retorna o motor de imagem ativo (memoizado por preferência).
 * @param {{preferencia?: "auto"|"sharp"|"python"}} [opcoes]
 */
export async function obterMotorImagem({ preferencia = process.env.MOTOR_CV_ENGINE || "auto" } = {}) {
  if (cache && cache.preferencia === preferencia) return cache.motor;

  let motor = null;
  if (preferencia === "auto" || preferencia === "sharp") {
    try {
      const mod = await import("sharp");
      motor = criarMotorSharp(mod.default ?? mod);
    } catch (err) {
      if (preferencia === "sharp") {
        throw new Error(`MOTOR_CV_ENGINE=sharp, mas o pacote 'sharp' não está instalado (${err.code || err.message}). Rode: npm install sharp`);
      }
    }
  }
  if (!motor) {
    try {
      execFileSync(PYTHON_BIN, [CV_ENGINE_PY, "probe"], { stdio: ["ignore", "pipe", "pipe"] });
    } catch (err) {
      const detalhe = err.stderr?.toString().trim() || err.message;
      throw new Error(
        `Nenhum motor de imagem disponível para o Tier 1. Instale 'sharp' (npm install sharp) ou python3 + Pillow. Detalhe: ${detalhe}`
      );
    }
    motor = criarMotorPython();
  }
  cache = { preferencia, motor };
  return motor;
}
