// motor/publish/status.js — Diagnóstico em Tempo Real do Status das APIs (YouTube, TikTok, ElevenLabs)
import { carregarEnv, carregarTokens, ROOT } from "./env-helper.js";
import { getValidYouTubeToken } from "./youtube.js";
import { getValidTikTokToken } from "./tiktok.js";

carregarEnv();

/**
 * Consulta e valida ativamente o status de conexão com todas as APIs configuradas.
 * Exportável como módulo para integração direta com a futura Interface Web.
 * 
 * @returns {Promise<object>} Status detalhado de cada serviço
 */
export async function obterStatusAPIs() {
  const relatorio = {
    horario: new Date().toISOString(),
    servicos: {
      youtube: { conectado: false, status: "desconectado" },
      tiktok: { conectado: false, status: "desconectado" },
      elevenlabs: { conectado: false, status: "desconectado" },
    },
  };

  // 1. YouTube Data API v3
  try {
    const tokenYt = await getValidYouTubeToken();
    const resYt = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      { headers: { Authorization: `Bearer ${tokenYt}` } }
    );
    const dataYt = await resYt.json();

    if (resYt.ok && dataYt.items?.length > 0) {
      const canal = dataYt.items[0];
      relatorio.servicos.youtube = {
        conectado: true,
        status: "ativo",
        canal: canal.snippet.title,
        handle: canal.snippet.customUrl || canal.id,
        canal_id: canal.id,
        inscritos: canal.statistics.subscriberCount,
        total_videos: canal.statistics.videoCount,
        escopos: "youtube.upload, youtube",
      };
    } else {
      relatorio.servicos.youtube = {
        conectado: false,
        status: "erro_resposta",
        detalhes: dataYt.error?.message || "Nenhum canal associado a esta credencial.",
      };
    }
  } catch (err) {
    relatorio.servicos.youtube = {
      conectado: false,
      status: "erro_autenticacao",
      detalhes: err.message,
    };
  }

  // 2. TikTok Content Posting API v2
  try {
    const tokenTk = await getValidTikTokToken();
    const resTk = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url",
      { headers: { Authorization: `Bearer ${tokenTk}` } }
    );
    const dataTk = await resTk.json();

    if (resTk.ok && dataTk.data?.user) {
      const tokensSalvos = carregarTokens("tiktok") || {};
      const escopos = tokensSalvos.scope || "user.info.basic,video.upload";
      const modoEnvio = escopos.includes("video.publish") ? "Direct Post (Direto no Perfil)" : "Inbox (Rascunho no App)";

      relatorio.servicos.tiktok = {
        conectado: true,
        status: "ativo",
        usuario: dataTk.data.user.display_name,
        open_id: dataTk.data.user.open_id,
        avatar_url: dataTk.data.user.avatar_url,
        escopos,
        modo_envio: modoEnvio,
      };
    } else {
      relatorio.servicos.tiktok = {
        conectado: false,
        status: "erro_resposta",
        detalhes: dataTk.error?.message || "Falha ao obter perfil do TikTok.",
      };
    }
  } catch (err) {
    relatorio.servicos.tiktok = {
      conectado: false,
      status: "erro_autenticacao",
      detalhes: err.message,
    };
  }

  // 3. ElevenLabs Voice AI
  const apiKeyEleven = process.env.ELEVENLABS_API_KEY;
  if (apiKeyEleven) {
    try {
      const resEl = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
        headers: { "xi-api-key": apiKeyEleven },
      });
      const dataEl = await resEl.json();

      if (resEl.ok && dataEl.status) {
        const usados = dataEl.character_count || 0;
        const total = dataEl.character_limit || 0;
        const restantes = Math.max(0, total - usados);

        relatorio.servicos.elevenlabs = {
          conectado: true,
          status: "ativo",
          plano: dataEl.tier,
          caracteres_usados: usados,
          limite_caracteres: total,
          caracteres_restantes: restantes,
          voz_oficial: "Liam (TX3LPaxmHKxFdv7VOQHJ)",
        };
      } else {
        relatorio.servicos.elevenlabs = {
          conectado: false,
          status: "erro_chave",
          detalhes: dataEl.detail?.message || "Chave de API inválida.",
        };
      }
    } catch (err) {
      relatorio.servicos.elevenlabs = {
        conectado: false,
        status: "erro_conexao",
        detalhes: err.message,
      };
    }
  } else {
    relatorio.servicos.elevenlabs = {
      conectado: false,
      status: "chave_ausente",
      detalhes: "ELEVENLABS_API_KEY não configurada no .env",
    };
  }

  return relatorio;
}

/**
 * Exibe no terminal um painel visual formatado do status das conexões.
 */
export async function exibirPainelStatus() {
  console.log("\n========================================================");
  console.log("   📡 PAINEL DE STATUS DAS APIs — MOTOR 2.0");
  console.log("========================================================\n");

  const { servicos } = await obterStatusAPIs();

  // YouTube
  if (servicos.youtube.conectado) {
    console.log("🔴 YouTube Data API v3: \x1b[32m● CONECTADO\x1b[0m");
    console.log(`   • Canal:     \x1b[1m${servicos.youtube.canal}\x1b[0m (${servicos.youtube.handle})`);
    console.log(`   • Canal ID:  ${servicos.youtube.canal_id}`);
    console.log(`   • Estatísticas: ${servicos.youtube.inscritos} inscritos · ${servicos.youtube.total_videos} vídeos`);
    console.log(`   • Permissões: Upload de Shorts habilitado`);
  } else {
    console.log("🔴 YouTube Data API v3: \x1b[31m○ DESCONECTADO\x1b[0m");
    console.log(`   • Motivo: ${servicos.youtube.detalhes || "Não autenticado"}`);
    console.log("   • Para conectar: npm run auth:youtube");
  }

  console.log("\n--------------------------------------------------------\n");

  // TikTok
  if (servicos.tiktok.conectado) {
    console.log("🎵 TikTok Content Posting: \x1b[32m● CONECTADO\x1b[0m");
    console.log(`   • Perfil:    \x1b[1m${servicos.tiktok.usuario}\x1b[0m`);
    console.log(`   • Open ID:   ${servicos.tiktok.open_id}`);
    console.log(`   • Modo:      ${servicos.tiktok.modo_envio}`);
    console.log(`   • Permissões: ${servicos.tiktok.escopos}`);
  } else {
    console.log("🎵 TikTok Content Posting: \x1b[31m○ DESCONECTADO\x1b[0m");
    console.log(`   • Motivo: ${servicos.tiktok.detalhes || "Não autenticado"}`);
    console.log("   • Para conectar: npm run auth:tiktok");
  }

  console.log("\n--------------------------------------------------------\n");

  // ElevenLabs
  if (servicos.elevenlabs.conectado) {
    console.log("🗣️  ElevenLabs Voice AI: \x1b[32m● CONECTADO\x1b[0m");
    console.log(`   • Plano:     ${servicos.elevenlabs.plano.toUpperCase()}`);
    console.log(`   • Voz:       ${servicos.elevenlabs.voz_oficial}`);
    console.log(`   • Créditos:  ${servicos.elevenlabs.caracteres_restantes.toLocaleString("pt-BR")} caracteres disponíveis`);
  } else {
    console.log("🗣️  ElevenLabs Voice AI: \x1b[31m○ DESCONECTADO\x1b[0m");
    console.log(`   • Motivo: ${servicos.elevenlabs.detalhes}`);
  }

  // Agendamentos Pendentes
  try {
    const { carregarAgendamentos } = await import("./scheduler.js");
    const pendentes = carregarAgendamentos().filter((a) => a.status === "pendente");
    if (pendentes.length > 0) {
      console.log("\n--------------------------------------------------------\n");
      console.log(`⏰ Agendamentos Pendentes na Fila: \x1b[33m${pendentes.length}\x1b[0m`);
      pendentes.forEach((a) => {
        const dataStr = new Date(a.data_agendada).toLocaleString("pt-BR");
        console.log(`   • \x1b[1m${a.slug}\x1b[0m ➔ ${dataStr} (${a.plataformas.join(", ")})`);
      });
      console.log("   • Para gerenciar a fila: npm run video:agendados");
    }
  } catch {}

  console.log("\n========================================================\n");
}

if (process.argv[1]?.endsWith("status.js")) {
  exibirPainelStatus();
}
