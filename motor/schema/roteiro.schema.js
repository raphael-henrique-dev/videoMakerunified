// motor/schema/roteiro.schema.js — Validador do contrato unificado roteiro.json (Motor 2.0)

import fs from "node:fs";
import path from "node:path";
import { achatarRoteiro, validarFormato } from "../formato.js";

const SFX_DIR = path.resolve("assets/sfx");

export function validarRoteiro(roteiro) {
  const erros = [];
  if (!roteiro || typeof roteiro !== "object") {
    return { valido: false, erros: ["O arquivo roteiro.json deve ser um objeto JSON válido."] };
  }
  if (!roteiro.id || typeof roteiro.id !== "string") {
    erros.push("Campo obrigatório ausente: 'id' (string).");
  }
  if (!roteiro.titulo || typeof roteiro.titulo !== "string") {
    erros.push("Campo obrigatório ausente: 'titulo' (string).");
  }
  const formato = validarFormato(roteiro);
  erros.push(...formato.erros);
  const normalizado = achatarRoteiro(roteiro);
  if (!Array.isArray(normalizado.frames) || normalizado.frames.length === 0) {
    erros.push("Campo obrigatório 'frames' deve ser um array não-vazio de cenas.");
  } else {
    normalizado.frames.forEach((f, idx) => {
      if (!f.id) erros.push(`Frame [${idx}] sem 'id'.`);
      if (!f.arquivo && !f.cena) erros.push(`Frame [${idx}] (${f.id || "?"}) sem 'arquivo' ou 'cena'.`);
      if (!Array.isArray(f.frases) || f.frases.length === 0) {
        erros.push(`Frame [${idx}] (${f.id || "?"}) deve conter ao menos uma frase em 'frases'.`);
      } else {
        f.frases.forEach((fr, j) => {
          if (!fr.texto || typeof fr.texto !== "string") {
            erros.push(`Frame '${f.id}', frase [${j}] sem 'texto'.`);
          }
          if (f.sons) {
            if (!Array.isArray(f.sons)) erros.push(`Frame '${f.id}' possui 'sons' inválido.`);
            else f.sons.forEach((som) => {
              if (!som?.nome) erros.push(`Frame '${f.id}' possui som sem 'nome'.`);
              else if (fs.existsSync(SFX_DIR) && !fs.readdirSync(SFX_DIR).some((n) => n.replace(/\.[^.]+$/, "").replace(/-\d+$/, "") === som.nome)) {
                erros.push(`Som '${som.nome}' não existe em assets/sfx.`);
              }
            });
          }
        });
      }
      if (roteiro.voz !== undefined && typeof roteiro.voz !== "object") erros.push("Campo 'voz' deve ser um objeto.");
      if (roteiro.trilha !== undefined && (typeof roteiro.trilha !== "object" || typeof roteiro.trilha.arquivo !== "string")) {
        erros.push("Campo 'trilha' deve conter 'arquivo'.");
      }
    });
  }
  return {
    valido: erros.length === 0,
    erros,
  };
}
