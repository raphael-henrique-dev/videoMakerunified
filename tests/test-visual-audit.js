// tests/test-visual-audit.js — Testes do orquestrador de auditoria visual e gerador de relatórios
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolverVideoDir, calcularTimestampsCenas } from "../motor/audit/visual.js";
import { formatarRelatorioMarkdown, salvarRelatorio } from "../motor/audit/reporter.js";
import { dirTemporario } from "./helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

test("resolverVideoDir localiza a pasta correta ou lança erro explicativo", () => {
  const dirCabo = resolverVideoDir("cabo-submarino");
  assert.ok(fs.existsSync(dirCabo));
  assert.ok(dirCabo.endsWith("videos/cabo-submarino"));

  assert.throws(() => resolverVideoDir("slug_que_nao_existe_12345"), /não encontrada/);
  assert.throws(() => resolverVideoDir(""), /Slug do vídeo não informado/);
});

test("calcularTimestampsCenas extrai intervalos do index.html ou roteiro.json", () => {
  const dirCabo = resolverVideoDir("cabo-submarino");
  const { cenas, todosTimestamps } = calcularTimestampsCenas(dirCabo);

  assert.ok(cenas.length >= 4);
  assert.ok(todosTimestamps.length >= 8);

  // Cada cena deve ter 2 timestamps amostrados (30% e 75% da duração)
  for (const c of cenas) {
    assert.equal(c.timestamps.length, 2);
    assert.ok(c.timestamps[0] >= c.start);
    assert.ok(c.timestamps[1] <= c.start + c.duration);
    assert.ok(c.timestamps[0] < c.timestamps[1]);
  }
});

test("formatarRelatorioMarkdown gera estrutura completa com badges, tabelas e fixes de código", () => {
  const dadosMock = {
    slug: "video-teste",
    titulo: "Vídeo de Teste Visual",
    aprovado: false,
    notaFinal: 7.2,
    duracaoTotalMs: 1420,
    tier1: {
      motor: "python-pil",
      duracaoMs: 120,
      resumo: { criticos: 0, altos: 1, medios: 1, nota: 8.0, aprovado: true },
      cenas: [
        {
          id: "frame-01",
          amostras: [{ tempo: 2.5, metricas: { luminancia: { media: 25, p95: 90 } }, zonasVioladas: ["topo"] }],
          diferencasMovimento: [4.2],
          alertas: [{ codigo: "SAFE_ZONE_VIOLATION", severidade: "medio", zona: "topo", mensagem: "Aviso de topo" }],
        },
      ],
    },
    tier2: {
      ativo: true,
      provedor: "gemini",
      provedorNome: "Google Gemini",
      modelo: "gemini-2.5-flash",
      nota_geral: 6.8,
      aprovado: false,
      resumo_critico: "Mascote ligeiramente cortado à direita no enquadramento vertical 9:16.",
      cenas: [
        {
          indice: 1,
          identificador: "frame-01",
          nota: 6.8,
          enquadramento: "alerta",
          iluminacao: "ok",
          legibilidade: "ok",
          problemas: ["Mascote cortado na lateral direita"],
          sugestoes_correcao: [
            {
              alvo: "camera",
              acao: "Recuar a câmera para Z=8.0",
              codigo_sugerido: "camera.position.z = 8.0;",
            },
          ],
        },
      ],
    },
    pranchas: {
      humana: "/caminho/fake/contact-sheet-anotada.jpg",
    },
  };

  const md = formatarRelatorioMarkdown(dadosMock);

  assert.ok(md.includes("Relatório de Auditoria Visual por Visão Computacional"));
  assert.ok(md.includes("7.2 / 10"));
  assert.ok(md.includes("Google Gemini"));
  assert.ok(md.includes("contact-sheet-anotada.jpg"));
  assert.ok(md.includes("Plano de Ações Corretivas"));
  assert.ok(md.includes("camera.position.z = 8.0;"));

  const dirTmp = dirTemporario();
  const arqSalvo = salvarRelatorio(dirTmp, md, "video-teste");
  assert.ok(fs.existsSync(arqSalvo));
  assert.equal(fs.readFileSync(arqSalvo, "utf8"), md);
});
