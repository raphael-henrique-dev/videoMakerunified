// motor/publish/env-helper.js — Gerenciamento de Variáveis e Tokens OAuth2 para YouTube e TikTok
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");
export const TOKENS_FILE = path.join(__dirname, ".tokens.json");

/**
 * Carrega variáveis de ambiente de .env em motor-v2 e na raiz do projeto.
 */
export function carregarEnv() {
  const caminhos = [
    path.join(ROOT, ".env"),
    path.resolve(ROOT, "..", ".env"),
  ];

  for (const p of caminhos) {
    if (fs.existsSync(p)) {
      const conteudo = fs.readFileSync(p, "utf8");
      for (const linha of conteudo.split(/\r?\n/)) {
        const m = linha.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !m[1].startsWith("#")) {
          const chave = m[1];
          const valor = m[2].replace(/^["']|["']$/g, "").trim();
          if (!process.env[chave]) {
            process.env[chave] = valor;
          }
        }
      }
    }
  }
}

/**
 * Salva ou atualiza uma chave no arquivo .env local.
 */
export function salvarNoEnv(chave, valor) {
  const envPath = path.join(ROOT, ".env");
  let conteudo = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const regex = new RegExp(`^\\s*${chave}\\s*=.*$`, "m");

  if (regex.test(conteudo)) {
    conteudo = conteudo.replace(regex, `${chave}=${valor}`);
  } else {
    conteudo = (conteudo.trim() ? conteudo.trim() + "\n" : "") + `${chave}=${valor}\n`;
  }

  fs.writeFileSync(envPath, conteudo, "utf8");
  process.env[chave] = valor;
}

/**
 * Carrega todos os tokens persistidos em .tokens.json
 */
export function carregarTokens(plataforma) {
  if (!fs.existsSync(TOKENS_FILE)) return null;
  try {
    const dados = JSON.parse(fs.readFileSync(TOKENS_FILE, "utf8"));
    return plataforma ? dados[plataforma] || null : dados;
  } catch {
    return null;
  }
}

/**
 * Salva tokens de uma plataforma em .tokens.json
 */
export function salvarTokens(plataforma, dados) {
  let todos = {};
  if (fs.existsSync(TOKENS_FILE)) {
    try {
      todos = JSON.parse(fs.readFileSync(TOKENS_FILE, "utf8"));
    } catch {}
  }
  todos[plataforma] = {
    ...todos[plataforma],
    ...dados,
    atualizado_em: new Date().toISOString(),
  };
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(todos, null, 2), "utf8");
}
