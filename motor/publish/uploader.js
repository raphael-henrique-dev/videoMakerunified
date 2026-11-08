// motor/publish/uploader.js — Orquestrador Principal de Publicação de Vídeos (YouTube + TikTok)
import fs from "node:fs";
import path from "node:path";
import { carregarEnv, carregarTokens, ROOT } from "./env-helper.js";
import { prepararMetadados } from "./metadata-helper.js";
import { uploadToYouTube } from "./youtube.js";
import { uploadToTikTok } from "./tiktok.js";
import { interpretarDataAgendamento, salvarAgendamento } from "./scheduler.js";

carregarEnv();

/**
 * Publica um vídeo nas plataformas selecionadas (YouTube, TikTok ou ambas),
 * com suporte a agendamento automático de lançamento.
 * Função exportável pronta para uso em CLI ou em futura Interface Web.
 * 
 * @param {string} slugOuDir - Slug do vídeo (ex: 'por-que-a-bateria-despenca') ou caminho completo
 * @param {object} opcoes - {
 *   youtube?: boolean,
 *   tiktok?: boolean,
 *   public?: boolean,
 *   unlisted?: boolean,
 *   agendar?: string|Date,
 *   tiktokInbox?: boolean,
 *   _execucaoFila?: boolean
 * }
 * @returns {Promise<object>} Relatório com status das publicações
 */
export async function publicarVideo(slugOuDir, opcoes = {}) {
  const VIDEOS_DIR = path.join(ROOT, "videos");
  const slug = slugOuDir.replace(/^videos\//, "").replace(/\/$/, "");
  const videoDir = path.isAbsolute(slugOuDir) ? slugOuDir : path.join(VIDEOS_DIR, slug);

  if (!fs.existsSync(videoDir)) {
    throw new Error(`Diretório do vídeo não encontrado: ${videoDir}`);
  }

  const mp4Path = path.join(videoDir, "renders", "output.mp4");
  if (!fs.existsSync(mp4Path)) {
    throw new Error(
      `Arquivo 'renders/output.mp4' não encontrado para '${slug}'.\nExecute antes a renderização: npm run video:render -- ${slug}`
    );
  }

  // Interpreta data de agendamento se fornecida
  let dataAgendadaISO = null;
  const inputAgendar = opcoes.agendar || opcoes.schedule || opcoes.em;
  if (inputAgendar) {
    dataAgendadaISO = interpretarDataAgendamento(inputAgendar);
  }

  const metadados = prepararMetadados(videoDir);

  // Determina quais plataformas publicar
  const tokens = carregarTokens() || {};
  const temYouTube = Boolean(process.env.YOUTUBE_CLIENT_ID && (tokens.youtube?.refresh_token || process.env.YOUTUBE_REFRESH_TOKEN));
  const temTikTok = Boolean(process.env.TIKTOK_CLIENT_KEY && (tokens.tiktok?.refresh_token || process.env.TIKTOK_REFRESH_TOKEN));

  let enviarYouTube = opcoes.youtube === true;
  let enviarTikTok = opcoes.tiktok === true;

  // Se nenhuma flag específica foi passada, tenta as plataformas configuradas
  if (!opcoes.youtube && !opcoes.tiktok) {
    enviarYouTube = temYouTube;
    enviarTikTok = temTikTok;
  }

  if (!enviarYouTube && !enviarTikTok) {
    console.log("\n⚠️ Nenhuma plataforma está autenticada para upload.");
    console.log("Execute os comandos de autenticação abaixo para conectar suas contas:");
    console.log("  • Para o YouTube: npm run auth:youtube");
    console.log("  • Para o TikTok:  npm run auth:tiktok\n");
    return {
      slug,
      sucesso: false,
      mensagem: "Nenhuma plataforma autenticada. Execute npm run auth:youtube ou npm run auth:tiktok.",
    };
  }

  const modoTexto = dataAgendadaISO
    ? `AGENDADO para ${new Date(dataAgendadaISO).toLocaleString("pt-BR")}`
    : opcoes.public
    ? "PÚBLICO"
    : opcoes.unlisted
    ? "NÃO LISTADO"
    : "PRIVADO (Rascunho Seguro)";

  console.log(`\n========================================================`);
  console.log(`   🚀 PUBLICADOR MOTOR 2.0 // ${slug}`);
  console.log(`========================================================`);
  console.log(`Arquivo: ${path.relative(ROOT, mp4Path)}`);
  console.log(`Modo:    ${modoTexto}\n`);

  const resultados = {
    slug,
    data_upload: new Date().toISOString(),
    agendado_para: dataAgendadaISO,
    plataformas: {},
  };

  // 1. Upload YouTube
  if (enviarYouTube) {
    try {
      const opcoesYt = {
        ...opcoes,
        agendar: dataAgendadaISO,
      };
      const resYt = await uploadToYouTube(mp4Path, metadados.youtube, opcoesYt);
      resultados.plataformas.youtube = resYt;
    } catch (err) {
      console.error(`[YouTube] ❌ Erro durante upload: ${err.message}`);
      resultados.plataformas.youtube = {
        sucesso: false,
        erro: err.message,
      };
    }
  } else if (!temYouTube && opcoes.youtube) {
    console.warn("[YouTube] ⚠️ Credenciais não configuradas. Execute: npm run auth:youtube");
  }

  // 2. Upload TikTok
  if (enviarTikTok) {
    // Se o agendamento foi solicitado e não é execução direta da fila:
    if (dataAgendadaISO && !opcoes._execucaoFila && !opcoes.tiktokInbox) {
      // Registra na fila do agendador local para publicação automática no horário
      const agendadoTk = salvarAgendamento(slug, dataAgendadaISO, {
        ...opcoes,
        plataformas: ["tiktok"],
      });
      console.log(`[TikTok] ⏰ Agendamento registrado na fila local para publicação em: ${new Date(dataAgendadaISO).toLocaleString("pt-BR")}`);
      console.log(`[TikTok] ID na fila: ${agendadoTk.id}`);
      console.log(`[TikTok] Para disparar quando chegar o horário: npm run video:agendados`);
      console.log(`[TikTok] (Dica: Para enviar agora como rascunho direto ao app do TikTok, use a flag --inbox)\n`);

      resultados.plataformas.tiktok = {
        sucesso: true,
        status: "scheduled_queue",
        agendamento_id: agendadoTk.id,
        agendado_para: dataAgendadaISO,
        mensagem: "Registrado na fila local para publicação no horário agendado.",
      };
    } else {
      try {
        const opcoesTk = {
          ...opcoes,
          agendar: dataAgendadaISO,
        };
        const resTk = await uploadToTikTok(mp4Path, metadados.tiktok, opcoesTk);
        resultados.plataformas.tiktok = resTk;
      } catch (err) {
        console.error(`[TikTok] ❌ Erro durante upload: ${err.message}`);
        resultados.plataformas.tiktok = {
          sucesso: false,
          erro: err.message,
        };
      }
    }
  } else if (!temTikTok && opcoes.tiktok) {
    console.warn("[TikTok] ⚠️ Credenciais não configuradas. Execute: npm run auth:tiktok");
  }

  // 3. Salva em videos/<slug>/publicacao_status.json
  const statusFile = path.join(videoDir, "publicacao_status.json");
  let historicoLocal = [];
  if (fs.existsSync(statusFile)) {
    try {
      const lido = JSON.parse(fs.readFileSync(statusFile, "utf8"));
      historicoLocal = Array.isArray(lido) ? lido : [lido];
    } catch {}
  }
  historicoLocal.unshift(resultados);
  fs.writeFileSync(statusFile, JSON.stringify(historicoLocal, null, 2), "utf8");
  console.log(`📄 Status registrado em: ${path.relative(ROOT, statusFile)}`);

  // 4. Registra no historico.md geral do canal
  try {
    const canalHistorico = path.join(ROOT, "canal", "historico.md");
    if (fs.existsSync(canalHistorico)) {
      const agoraStr = new Date().toISOString().replace("T", " ").slice(0, 16);
      let linhaYt = null;
      if (resultados.plataformas.youtube?.sucesso) {
        const statusYt = resultados.plataformas.youtube.agendado_para
          ? `Agendado para ${new Date(resultados.plataformas.youtube.agendado_para).toLocaleString("pt-BR")}`
          : resultados.plataformas.youtube.privacidade;
        const rotuloYt = metadados.formato === "horizontal" ? "YouTube" : "YouTube Shorts";
        linhaYt = `[${rotuloYt}](${resultados.plataformas.youtube.url}) (${statusYt})`;
      }

      let linhaTk = null;
      if (resultados.plataformas.tiktok?.sucesso) {
        if (resultados.plataformas.tiktok.agendamento_id) {
          linhaTk = `TikTok (Agendado na fila para ${new Date(resultados.plataformas.tiktok.agendado_para).toLocaleString("pt-BR")})`;
        } else {
          linhaTk = `TikTok Publish ID: \`${resultados.plataformas.tiktok.publish_id}\` (${resultados.plataformas.tiktok.privacidade})`;
        }
      }

      const detalhes = [linhaYt, linhaTk].filter(Boolean).join(" · ");
      if (detalhes) {
        const registro = `\n- **[${agoraStr}] Upload de \`${slug}\`**: ${detalhes}`;
        fs.appendFileSync(canalHistorico, registro, "utf8");
        console.log(`📚 Histórico do canal atualizado em: ${path.relative(ROOT, canalHistorico)}`);
      }
    }
  } catch (err) {
    console.warn("Aviso ao atualizar historico.md do canal:", err.message);
  }

  console.log("========================================================\n");
  return resultados;
}
