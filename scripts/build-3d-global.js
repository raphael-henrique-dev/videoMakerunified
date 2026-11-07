// scripts/build-3d-global.js — Empacota os módulos ESM de motor/3d/* em assets/vendor/motor3d.global.js (window.Motor3D)
// Isso permite que os desenvolvedores mantenham o código 3D 100% modular em motor/3d/*.js,
// enquanto as sub-composições HyperFrames (<template>) têm acesso síncrono imediato a window.Motor3D.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const modDir = path.join(rootDir, "motor", "3d");
const outFile = path.join(rootDir, "assets", "vendor", "motor3d.global.js");

const ordemArquivos = [
  "math.js",
  "lighting.js",
  "camera.js",
  "character.js",
  "environments.js",
  "props.js",
  "runtime.js",
];

let codigoCombinado = `// Gerado automaticamente por scripts/build-3d-global.js a partir de motor/3d/*.js\n(function (global) {\n  "use strict";\n  const exportsObj = {};\n`;

const simbolosExportados = [];

for (const nomeArq of ordemArquivos) {
  const caminho = path.join(modDir, nomeArq);
  let conteudo = fs.readFileSync(caminho, "utf8");

  // Remove linhas de import relativas entre os módulos internos
  conteudo = conteudo.replace(/^\s*import\s+\{[^}]+\}\s+from\s+["']\.\/[^"']+["'];?\s*$/gm, "");

  // Captura nomes de funções/constantes exportadas e remove a palavra-chave export
  conteudo = conteudo.replace(/export\s+function\s+([a-zA-Z0-9_]+)/g, (_, nome) => {
    simbolosExportados.push(nome);
    return `function ${nome}`;
  });
  conteudo = conteudo.replace(/export\s+const\s+([a-zA-Z0-9_]+)/g, (_, nome) => {
    simbolosExportados.push(nome);
    return `const ${nome}`;
  });

  codigoCombinado += `\n  // --- Módulo: ${nomeArq} ---\n` + conteudo + "\n";
}

for (const s of simbolosExportados) {
  codigoCombinado += `  exportsObj.${s} = ${s};\n`;
}

codigoCombinado += `  global.Motor3D = exportsObj;\n})(typeof window !== "undefined" ? window : globalThis);\n`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, codigoCombinado, "utf8");

// Sincroniza também para videos/*/assets/vendor/motor3d.global.js caso não sejam symlinks
const videosDir = path.join(rootDir, "videos");
if (fs.existsSync(videosDir)) {
  for (const slug of fs.readdirSync(videosDir)) {
    const vendorDir = path.join(videosDir, slug, "assets", "vendor");
    const targetFile = path.join(vendorDir, "motor3d.global.js");
    if (fs.existsSync(vendorDir)) {
      try {
        const st = fs.lstatSync(path.join(videosDir, slug, "assets"));
        if (!st.isSymbolicLink()) {
          fs.writeFileSync(targetFile, codigoCombinado, "utf8");
        }
      } catch {}
    }
  }
}

console.log(`[build:3d] Gerado ${path.relative(rootDir, outFile)} com ${simbolosExportados.length} funções/constantes exportadas.`);
