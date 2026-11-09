// motor/schema/roteiro.schema.js — Validador do contrato unificado roteiro.json (Motor 2.0)
//
// Retorna { valido, erros, avisos }. Só `erros` bloqueiam o pipeline; problemas de som/trilha
// (arquivo inexistente) são `avisos`, porque o pipeline de áudio simplesmente ignora sons não
// encontrados — bloquear aqui quebraria roteiros já existentes.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { achatarRoteiro, validarFormato, obterPerfil } from "../formato.js";
import { validarCena } from "../2d/cenas/index.js";
import { TRANSICOES } from "../2d/transicoes.js";

const SFX_DIR_GLOBAL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/sfx");

/** Mesma regra de resolução do pipeline de áudio: nome do arquivo sem extensão e sem sufixo "-N". */
function listarNomesSfx(dir) {
  if (!dir || !fs.existsSync(dir)) return null;
  return new Set(
    fs
      .readdirSync(dir)
      .filter((f) => /\.(wav|ogg|mp3)$/.test(f))
      .map((f) => f.replace(/\.\w+$/, "").replace(/-\d+$/, ""))
  );
}

export function validarRoteiro(roteiro, opcoes = {}) {
  const erros = [];
  const avisos = [];
  const addUnico = (lista, msg) => {
    if (!lista.includes(msg)) lista.push(msg);
  };

  if (!roteiro || typeof roteiro !== "object") {
    return { valido: false, erros: ["O arquivo roteiro.json deve ser um objeto JSON válido."], avisos };
  }
  if (!roteiro.id || typeof roteiro.id !== "string") erros.push("Campo obrigatório ausente: 'id' (string).");
  if (!roteiro.titulo || typeof roteiro.titulo !== "string") erros.push("Campo obrigatório ausente: 'titulo' (string).");

  erros.push(...validarFormato(roteiro).erros);

  if (roteiro.voz !== undefined && (typeof roteiro.voz !== "object" || roteiro.voz === null)) {
    erros.push("Campo 'voz' deve ser um objeto.");
  }

  const dirVideoSfx = opcoes.videoDir ? path.join(opcoes.videoDir, "assets", "sfx") : null;
  const nomesSfx = listarNomesSfx(dirVideoSfx && fs.existsSync(dirVideoSfx) ? dirVideoSfx : SFX_DIR_GLOBAL);

  if (roteiro.trilha !== undefined) {
    if (typeof roteiro.trilha !== "object" || roteiro.trilha === null || typeof roteiro.trilha.arquivo !== "string") {
      erros.push("Campo 'trilha' deve conter 'arquivo'.");
    } else if (nomesSfx && !nomesSfx.has(roteiro.trilha.arquivo.replace(/\.\w+$/, "").replace(/-\d+$/, ""))) {
      addUnico(avisos, `Trilha '${roteiro.trilha.arquivo}' não encontrada em assets/sfx (será ignorada).`);
    }
  }

  let perfil;
  try {
    perfil = obterPerfil(roteiro);
  } catch {
    perfil = obterPerfil({});
  }
  const normalizado = achatarRoteiro(roteiro);
  if (!Array.isArray(normalizado.frames) || normalizado.frames.length === 0) {
    erros.push("Campo obrigatório 'frames' deve ser um array não-vazio de cenas.");
    return { valido: false, erros, avisos };
  }

  normalizado.frames.forEach((f, idx) => {
    const rotulo = f.id || "?";
    if (!f.id) erros.push(`Frame [${idx}] sem 'id'.`);
    if (f.cena) {
      if (!perfil.tiposCena.includes("cena")) {
        erros.push(`Frame [${idx}] (${rotulo}) usa 'cena', disponível só no formato horizontal; no formato ${perfil.id} use 'arquivo'.`);
      } else {
        validarCena(f.cena).forEach((m) => erros.push(`Frame '${rotulo}' (cena ${f.cena?.tipo ?? "?"}): ${m}`));
      }
    } else if (!f.arquivo) {
      erros.push(`Frame [${idx}] (${rotulo}) sem 'arquivo' (ou 'cena', no formato horizontal).`);
    }
    if (f.transicao !== undefined) {
      if (!TRANSICOES.includes(f.transicao)) erros.push(`Frame '${rotulo}': transição '${f.transicao}' desconhecida (${TRANSICOES.join(", ")}).`);
      else if (!perfil.transicoes.includes(f.transicao)) addUnico(avisos, `Frame '${rotulo}': transição '${f.transicao}' não existe no formato ${perfil.id}; será usado '${perfil.transicoes[0]}'.`);
    }

    if (!Array.isArray(f.frases) || f.frases.length === 0) {
      erros.push(`Frame [${idx}] (${rotulo}) deve conter ao menos uma frase em 'frases'.`);
    } else {
      f.frases.forEach((fr, j) => {
        if (!fr || !fr.texto || typeof fr.texto !== "string") erros.push(`Frame '${rotulo}', frase [${j}] sem 'texto'.`);
      });
    }

    if (f.sons !== undefined) {
      if (!Array.isArray(f.sons)) {
        erros.push(`Frame '${rotulo}' possui 'sons' inválido.`);
      } else {
        f.sons.forEach((som) => {
          if (!som?.nome) addUnico(erros, `Frame '${rotulo}' possui som sem 'nome'.`);
          else if (nomesSfx && !nomesSfx.has(som.nome)) {
            addUnico(avisos, `Som '${som.nome}' (frame '${rotulo}') não existe em assets/sfx e será ignorado.`);
          }
        });
      }
    }
  });

  return { valido: erros.length === 0, erros, avisos };
}
