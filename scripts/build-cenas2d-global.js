// scripts/build-cenas2d-global.js — Empacota motor/2d/cenas/*.js em assets/vendor/cenas2d.global.js (window.Cenas2D)
// Cada módulo ESM roda no próprio escopo (as cenas repetem nomes como `tipo`, `validar` e `desenhar`),
// com um mini carregador de módulos. Sem dependências externas.

import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const modDir = path.join(rootDir, "motor", "2d", "cenas");
const outFile = path.join(rootDir, "assets", "vendor", "cenas2d.global.js");

function transformarModulo(codigo) {
  const exportados = [];
  let js = codigo
    .replace(/^\s*import\s+\*\s+as\s+(\w+)\s+from\s+["']\.\/([^"']+)\.js["'];?\s*$/gm, (_, nome, mod) => `const ${nome} = __req(${JSON.stringify(mod)});`)
    .replace(/^\s*import\s+\{([^}]+)\}\s+from\s+["']\.\/([^"']+)\.js["'];?\s*$/gm, (_, nomes, mod) => `const {${nomes}} = __req(${JSON.stringify(mod)});`)
    .replace(/^export\s+(?:async\s+)?function\s+(\w+)/gm, (m, nome) => (exportados.push(nome), m.replace(/^export\s+/, "")))
    .replace(/^export\s+(?:const|let)\s+(\w+)/gm, (m, nome) => (exportados.push(nome), m.replace(/^export\s+/, "")));
  return { js, exportados };
}

export function montarBundleCenas() {
  const arquivos = fs.readdirSync(modDir).filter((f) => f.endsWith(".js")).sort();
  let saida = `// Gerado automaticamente por scripts/build-cenas2d-global.js a partir de motor/2d/cenas/*.js\n(function (global) {\n  "use strict";\n  var __defs = {}, __cache = {};\n  function __req(nome) {\n    if (__cache[nome]) return __cache[nome];\n    var exp = (__cache[nome] = {});\n    __defs[nome](exp, __req);\n    return exp;\n  }\n`;
  for (const arq of arquivos) {
    const nome = arq.replace(/\.js$/, "");
    const { js, exportados } = transformarModulo(fs.readFileSync(path.join(modDir, arq), "utf8"));
    saida += `\n  // --- ${arq} ---\n  __defs[${JSON.stringify(nome)}] = function (__exp, __req) {\n${js}\n${exportados.map((n) => `    __exp.${n} = ${n};`).join("\n")}\n  };\n`;
  }
  saida += `\n  global.Cenas2D = __req("index");\n})(typeof window !== "undefined" ? window : globalThis);\n`;
  const restos = saida.split("\n").filter((l) => /^\s*(import|export)\s/.test(l));
  if (restos.length) throw new Error(`Bundle das cenas inválido: sobraram import/export:\n${restos.join("\n")}`);
  new vm.Script(saida, { filename: "cenas2d.global.js" });
  return saida;
}

const ehPrincipal = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (ehPrincipal) {
  const codigo = montarBundleCenas();
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, codigo, "utf8");
  console.log(`[build:cenas2d] Gerado ${path.relative(rootDir, outFile)} (${codigo.length} bytes).`);
}
