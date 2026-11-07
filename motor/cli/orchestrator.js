#!/usr/bin/env node
// motor/cli/orchestrator.js — Orquestrador CLI Multi-Vídeo do Motor 2.0

import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { carregarEnv } from "../publish/env-helper.js";

carregarEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const VIDEOS_DIR = path.join(ROOT, "videos");
const TEMPLATES_DIR = path.join(ROOT, "motor", "templates");

function sanitizarSlug(nome) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolverVideoDir(slug) {
  if (!slug) {
    console.error("Erro: Especifique o identificador ou pasta do vídeo (ex: cabo-submarino ou videos/cabo-submarino).");
    process.exit(1);
  }
  const limpo = slug.replace(/^videos\//, "");
  return path.join(VIDEOS_DIR, limpo);
}

const comando = process.argv[2];
const argVideo = process.argv[3];
const argExtra = process.argv.slice(4).join(" ");

switch (comando) {
  case "novo": {
    if (!argVideo) {
      console.error("Uso: npm run video:novo -- <slug-do-video> [\"Título do Vídeo\"]");
      process.exit(1);
    }
    const slug = sanitizarSlug(argVideo);
    const destDir = path.join(VIDEOS_DIR, slug);
    if (fs.existsSync(destDir)) {
      console.error(`Erro: O vídeo "${slug}" já existe em: ${path.relative(ROOT, destDir)}`);
      process.exit(1);
    }

    console.log(`[motor] Criando novo vídeo atômico: videos/${slug}...`);
    fs.mkdirSync(destDir, { recursive: true });

    // 1. Copia composições, index.html, hyperframes.json e roteiro.json a partir dos templates
    fs.cpSync(TEMPLATES_DIR, destDir, { recursive: true });

    // 2. Personaliza roteiro.json com o slug e título
    const roteiroPath = path.join(destDir, "roteiro.json");
    if (fs.existsSync(roteiroPath)) {
      const rot = JSON.parse(fs.readFileSync(roteiroPath, "utf8"));
      rot.id = slug;
      if (argExtra) rot.titulo = argExtra;
      fs.writeFileSync(roteiroPath, JSON.stringify(rot, null, 2), "utf8");
    }

    // 3. Monta symlinks limpos para os assets globais compartilhados
    const destAssets = path.join(destDir, "assets");
    fs.mkdirSync(destAssets, { recursive: true });
    fs.mkdirSync(path.join(destAssets, "voice"), { recursive: true });
    fs.mkdirSync(path.join(destAssets, "bgm"), { recursive: true });
    fs.mkdirSync(path.join(destDir, "narracao"), { recursive: true });
    fs.mkdirSync(path.join(destDir, "renders"), { recursive: true });

    try {
      execFileSync("ln", ["-sfn", "../../../assets/fonts", path.join(destAssets, "fonts")]);
      execFileSync("ln", ["-sfn", "../../../assets/vendor", path.join(destAssets, "vendor")]);
      execFileSync("ln", ["-sfn", "../../../assets/sfx", path.join(destAssets, "sfx")]);
    } catch (err) {
      console.warn("Aviso ao criar symlinks de assets:", err.message);
    }

    console.log(`✅ Vídeo criado com sucesso em: videos/${slug}/`);
    console.log(`\nPróximos passos:`);
    console.log(`  1. Edite o roteiro em: videos/${slug}/roteiro.json`);
    console.log(`  2. Gere o áudio e legendas: npm run video:audio -- ${slug}`);
    console.log(`  3. Abra no estúdio para pré-visualizar: npm run video:dev -- ${slug}`);
    console.log(`  4. Valide a conformidade técnica: npm run video:check -- ${slug}`);
    console.log(`  5. Renderize o MP4 final: npm run video:render -- ${slug}\n`);
    break;
  }

  case "listar":
  case "list": {
    if (!fs.existsSync(VIDEOS_DIR)) {
      console.log("Nenhum vídeo criado ainda.");
      break;
    }
    const pastas = fs.readdirSync(VIDEOS_DIR).filter((f) => fs.statSync(path.join(VIDEOS_DIR, f)).isDirectory());
    console.log(`\n📁 Catálogo de Vídeos (${pastas.length} encontrados em videos/):\n`);
    pastas.forEach((p) => {
      const vDir = path.join(VIDEOS_DIR, p);
      const rotFile = path.join(vDir, "roteiro.json");
      const metaFile = path.join(vDir, "audio_meta.json");
      const mp4File = path.join(vDir, "renders", "output.mp4");

      let titulo = p;
      if (fs.existsSync(rotFile)) {
        try {
          titulo = JSON.parse(fs.readFileSync(rotFile, "utf8")).titulo || p;
        } catch {}
      }
      let dur = "-";
      if (fs.existsSync(metaFile)) {
        try {
          dur = `${JSON.parse(fs.readFileSync(metaFile, "utf8")).duracaoTotal?.toFixed(1)}s`;
        } catch {}
      }
      const statusMp4 = fs.existsSync(mp4File) ? "🎬 Renderizado (output.mp4)" : "📝 Em produção";
      console.log(`  • ${p.padEnd(24)} | ${titulo.padEnd(36)} | Duração: ${dur.padEnd(7)} | ${statusMp4}`);
    });
    console.log("");
    break;
  }

  case "audio": {
    const vDir = resolverVideoDir(argVideo);
    execFileSync("node", [path.join(ROOT, "motor", "audio", "pipeline.js"), vDir], { stdio: "inherit" });
    execFileSync("node", [path.join(ROOT, "scripts", "gerar-storyboard.js"), vDir], { stdio: "inherit" });
    break;
  }

  case "storyboard": {
    const vDir = resolverVideoDir(argVideo);
    execFileSync("node", [path.join(ROOT, "scripts", "gerar-storyboard.js"), vDir], { stdio: "inherit" });
    break;
  }

  case "check": {
    const vDir = resolverVideoDir(argVideo);
    execFileSync("npx", ["--yes", "hyperframes@0.8.177", "check", path.relative(ROOT, vDir)], { stdio: "inherit" });
    break;
  }

  case "audit":
  case "audit:fast": {
    const vDir = resolverVideoDir(argVideo);
    const slug = path.basename(vDir);
    const argsRestantes = process.argv.slice(4);
    const eFast = comando === "audit:fast" || argsRestantes.includes("--fast");
    const jsonModo = argsRestantes.includes("--json");
    const providerArg = argsRestantes.find((a) => a.startsWith("--provider="))?.split("=")[1];
    const engineArg = argsRestantes.find((a) => a.startsWith("--engine="))?.split("=")[1];

    const reuseSnaps = argsRestantes.includes("--reuse-snapshots");

    const { auditarVideoVisual } = await import("../audit/visual.js");
    try {
      const res = await auditarVideoVisual(slug, {
        fast: eFast,
        provider: providerArg,
        engine: engineArg,
        reuseSnapshots: reuseSnaps,
      });
      if (jsonModo) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log(`\n======================================================`);
        console.log(`📊 RESULTADO DA AUDITORIA VISUAL: ${slug.toUpperCase()}`);
        console.log(`======================================================`);
        console.log(`• Status:     ${res.aprovado ? "🟢 APROVADO" : "🔴 REPROVADO"}`);
        console.log(`• Nota Final: ${res.notaFinal.toFixed(1)} / 10`);
        console.log(`• Tier 1:     ${res.tier1.motor} (${res.tier1.duracaoMs}ms, ${res.tier1.resumo.criticos} críticos, ${res.tier1.resumo.altos} altos)`);
        console.log(`• Tier 2 VLM: ${res.tier2.ativo ? `${res.tier2.provedorNome} (${res.tier2.nota_geral?.toFixed(1)}/10)` : "Inativo"}`);
        console.log(`• Prancha:    ${path.relative(ROOT, res.pranchas.humana)}`);
        console.log(`• Relatório:  ${path.relative(ROOT, res.caminhoMd)}`);
        console.log(`======================================================\n`);
      }
      if (!res.aprovado) process.exitCode = 2;
    } catch (err) {
      console.error(`\n❌ Falha na auditoria visual de videos/${slug}:`, err.message);
      process.exit(1);
    }
    break;
  }

  case "dev": {
    const vDir = resolverVideoDir(argVideo);
    const child = spawn("npx", ["--yes", "hyperframes@0.8.177", "preview", path.relative(ROOT, vDir)], {
      stdio: "inherit",
    });
    child.on("exit", (code) => process.exit(code || 0));
    break;
  }

  case "render": {
    const vDir = resolverVideoDir(argVideo);
    const outMp4 = path.join(vDir, "renders", "output.mp4");
    fs.mkdirSync(path.join(vDir, "renders"), { recursive: true });
    execFileSync(
      "npx",
      ["--yes", "hyperframes@0.8.177", "render", path.relative(ROOT, vDir), "--output", outMp4],
      { stdio: "inherit" }
    );
    console.log(`\n🎉 Renderização concluída! Arquivo: ${path.relative(ROOT, outMp4)}\n`);
    break;
  }

  case "snapshot": {
    const vDir = resolverVideoDir(argVideo);
    const snapDir = path.join(vDir, "renders", "snapshots");
    fs.mkdirSync(snapDir, { recursive: true });
    execFileSync(
      "npx",
      [
        "--yes",
        "hyperframes@0.8.177",
        "snapshot",
        path.relative(ROOT, vDir),
        "--at",
        "2.0,6.5,16.5,27.0,36.5",
        "--no-end",
        "--describe",
        "false",
        "-o",
        snapDir,
      ],
      { stdio: "inherit" }
    );
    console.log(`\n📸 Snapshots capturados em: ${path.relative(ROOT, snapDir)}\n`);
    break;
  }

  case "pipeline": {
    const vDir = resolverVideoDir(argVideo);
    console.log(`[pipeline] Executando pipeline completo para: ${path.relative(ROOT, vDir)}`);
    execFileSync("node", [path.join(ROOT, "scripts", "build-3d-global.js")], { stdio: "inherit" });
    execFileSync("node", [path.join(ROOT, "motor", "audio", "pipeline.js"), vDir], { stdio: "inherit" });
    execFileSync("node", [path.join(ROOT, "scripts", "gerar-storyboard.js"), vDir], { stdio: "inherit" });
    execFileSync("npx", ["--yes", "hyperframes@0.8.177", "check", path.relative(ROOT, vDir)], { stdio: "inherit" });
    console.log(`\n✨ Pipeline concluído com sucesso para: ${path.relative(ROOT, vDir)}!`);
    break;
  }

  case "upload": {
    const vDir = resolverVideoDir(argVideo);
    const flagsRestantes = process.argv.slice(4);
    const soYouTube = flagsRestantes.includes("--youtube") || flagsRestantes.includes("-yt");
    const soTikTok = flagsRestantes.includes("--tiktok") || flagsRestantes.includes("-tt");
    const ePublico = flagsRestantes.includes("--public") || flagsRestantes.includes("-p");
    const eNaoListado = flagsRestantes.includes("--unlisted");
    const tiktokInbox = flagsRestantes.includes("--tiktok-inbox") || flagsRestantes.includes("--inbox");

    // Extrai argumentos de agendamento: --agendar "amanha 18:00", --schedule "+2h", --em "30m"
    let valorAgendamento = null;
    for (let i = 0; i < flagsRestantes.length; i++) {
      const f = flagsRestantes[i];
      if (f === "--agendar" || f === "--schedule" || f === "--em") {
        valorAgendamento = flagsRestantes[i + 1] || null;
      } else if (f.startsWith("--agendar=") || f.startsWith("--schedule=") || f.startsWith("--em=")) {
        valorAgendamento = f.split("=")[1];
      }
    }

    const { publicarVideo } = await import("../publish/uploader.js");
    await publicarVideo(vDir, {
      youtube: soYouTube,
      tiktok: soTikTok,
      public: ePublico,
      unlisted: eNaoListado,
      agendar: valorAgendamento,
      tiktokInbox,
    });
    break;
  }

  case "agendados":
  case "scheduler": {
    const subArgs = process.argv.slice(3);
    const {
      listarAgendamentos,
      executarAgendamentosPendentes,
      iniciarWatcher,
      cancelarAgendamento,
    } = await import("../publish/scheduler.js");

    if (subArgs.includes("--watch") || subArgs.includes("-w")) {
      iniciarWatcher(60);
    } else if (subArgs.includes("--run") || subArgs.includes("--exec")) {
      await executarAgendamentosPendentes({ force: subArgs.includes("--force") });
    } else if (subArgs.includes("--cancel")) {
      const idx = subArgs.indexOf("--cancel");
      const alvo = subArgs[idx + 1];
      if (!alvo) {
        console.error("Uso: npm run video:agendados -- --cancel <id-ou-slug>");
        process.exit(1);
      }
      const res = cancelarAgendamento(alvo);
      console.log(res.sucesso ? `✅ Cancelado: ${res.removido.slug} (${res.removido.id})` : `❌ ${res.mensagem}`);
    } else {
      listarAgendamentos();
      await executarAgendamentosPendentes();
    }
    break;
  }

  case "status": {
    const { exibirPainelStatus } = await import("../publish/status.js");
    await exibirPainelStatus();
    break;
  }

  default:
    console.log(`
Motor 2.0 — Orquestrador de Vídeos Atômicos

Comandos disponíveis:
  npm run video:novo -- <slug> ["Título"]   Cria um novo projeto de vídeo isolado em videos/<slug>
  npm run video:listar                    Lista todos os vídeos cadastrados e seus status
  npm run video:audio -- <slug>           Gera narração, alinhamento, ducking e legendas do vídeo
  npm run video:storyboard -- <slug>      Regenera STORYBOARD.md e captions.html do vídeo
  npm run video:check -- <slug>           Audita o vídeo com o linter estático do HyperFrames
  npm run video:audit -- <slug>           Audita o vídeo com Visão Computacional (Tier 1 + Tier 2 VLM)
  npm run video:audit:fast -- <slug>      Auditoria visual determinística ultra-rápida (100% offline)
  npm run video:dev -- <slug>             Abre o estúdio/preview do vídeo no navegador
  npm run video:snapshot -- <slug>        Captura 5 snapshots visuais para verificação rápida
  npm run video:render -- <slug>          Renderiza o arquivo MP4 final em videos/<slug>/renders/
  npm run video:upload -- <slug>          Publica o vídeo MP4 no YouTube e TikTok
  npm run video:status                    Exibe o painel de status ao vivo das APIs conectadas
  npm run video:agendados                 Lista e processa a fila de vídeos agendados
  npm run video:pipeline -- <slug>        Executa build 3D, áudio, storyboard e check sequencialmente
  npm run video:ai                        CLI interativa para gerar um vídeo novo por linguagem natural
  npm run auth:youtube                    Conecta sua conta Google/YouTube para upload de Shorts
  npm run auth:tiktok                     Conecta sua conta TikTok Developers para upload de vídeos
  npm run auth:status                     Exibe o painel de status das contas e APIs conectadas
`);
    break;
}
