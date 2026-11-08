// motor/publish/youtube.js — Integração com a YouTube Data API v3 (Upload Resumable de Shorts)
import fs from "node:fs";
import { carregarEnv, carregarTokens, salvarTokens, salvarNoEnv } from "./env-helper.js";

const YOUTUBE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const YOUTUBE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const YOUTUBE_UPLOAD_INIT_ENDPOINT = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
].join(" ");

/**
 * Gera a URL para o usuário autorizar o aplicativo no Google.
 */
export function getYouTubeAuthUrl(clientId, redirectUri) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
  });
  return `${YOUTUBE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Troca o authorization code pelo access_token e refresh_token.
 */
export async function exchangeYouTubeCode(code, clientId, clientSecret, redirectUri) {
  const res = await fetch(YOUTUBE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Falha ao obter tokens do YouTube: ${data.error_description || data.error || JSON.stringify(data)}`);
  }

  const agora = Date.now();
  const infoTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: agora + (data.expires_in || 3600) * 1000,
    scope: data.scope,
  };

  salvarTokens("youtube", infoTokens);
  if (data.refresh_token) {
    salvarNoEnv("YOUTUBE_REFRESH_TOKEN", data.refresh_token);
  }

  return infoTokens;
}

/**
 * Retorna um access_token válido, renovando via refresh_token se necessário.
 */
export async function getValidYouTubeToken() {
  carregarEnv();
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const tokenSalvo = carregarTokens("youtube") || {};
  const refreshToken = tokenSalvo.refresh_token || process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error("YOUTUBE_CLIENT_ID e YOUTUBE_CLIENT_SECRET não estão configurados no .env.");
  }
  if (!refreshToken) {
    throw new Error("YouTube não autenticado. Execute primeiro: npm run auth:youtube");
  }

  // Se o access_token atual ainda tem pelo menos 2 minutos de validade, reutiliza
  if (tokenSalvo.access_token && tokenSalvo.expires_at && tokenSalvo.expires_at > Date.now() + 120000) {
    return tokenSalvo.access_token;
  }

  // Renova o token
  const res = await fetch(YOUTUBE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Falha ao renovar token do YouTube: ${data.error_description || data.error || JSON.stringify(data)}`);
  }

  const infoAtualizada = {
    access_token: data.access_token,
    refresh_token: refreshToken,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };
  salvarTokens("youtube", infoAtualizada);

  return data.access_token;
}

/**
 * Realiza o upload resumable de um arquivo MP4 para o YouTube.
 * @param {string} videoPath - Caminho do arquivo .mp4
 * @param {object} metadata - { titulo, descricao, tags, categoryId }
 * @param {object} options - { public?: boolean, unlisted?: boolean, agendar?: string|Date }
 */
export async function uploadToYouTube(videoPath, metadata, options = {}) {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Arquivo de vídeo não encontrado em: ${videoPath}`);
  }

  const stats = fs.statSync(videoPath);
  const fileSize = stats.size;
  const accessToken = await getValidYouTubeToken();

  let privacyStatus = options.public ? "public" : options.unlisted ? "unlisted" : "private";
  let publishAt = null;

  if (options.agendar) {
    publishAt = typeof options.agendar === "string" ? options.agendar : options.agendar.toISOString();
    if (new Date(publishAt).getTime() <= Date.now()) {
      throw new Error(`A data de agendamento do YouTube (${new Date(publishAt).toLocaleString("pt-BR")}) deve ser no futuro.`);
    }
    // Regra estrita da Google YouTube Data API: publishAt só é aceito se privacyStatus = "private"
    privacyStatus = "private";
  }

  console.log(`[YouTube] Iniciando sessão de upload resumable (${(fileSize / (1024 * 1024)).toFixed(1)} MB)...`);
  console.log(`[YouTube] Título: "${metadata.titulo}" | Privacidade: ${privacyStatus}`);
  if (publishAt) {
    console.log(`[YouTube] ⏰ Publicação AGENDADA nativamente para: ${new Date(publishAt).toLocaleString("pt-BR")}`);
    console.log(`[YouTube] (O vídeo ficará privado nos servidores do YouTube até o horário, quando se tornará público automaticamente)`);
  }

  const initBody = {
    snippet: {
      title: metadata.titulo,
      description: metadata.descricao,
      tags: metadata.tags || [],
      categoryId: metadata.categoryId || "28",
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: false,
      ...(publishAt ? { publishAt } : {}),
    },
  };

  // Passo 1: Iniciar sessão de upload resumable
  const initRes = await fetch(YOUTUBE_UPLOAD_INIT_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(fileSize),
      "X-Upload-Content-Type": "video/mp4",
    },
    body: JSON.stringify(initBody),
  });

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`Falha ao iniciar upload no YouTube (${initRes.status}): ${errText}`);
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    throw new Error("O YouTube não retornou a URL de upload no cabeçalho Location.");
  }

  // Passo 2: Upload do arquivo binário
  console.log(`[YouTube] Enviando arquivo de vídeo...`);
  const fileStream = fs.createReadStream(videoPath);

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(fileSize),
    },
    body: fileStream,
    duplex: "half",
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Falha ao transferir bytes do vídeo para o YouTube (${uploadRes.status}): ${errText}`);
  }

  const uploadData = await uploadRes.json();
  const videoId = uploadData.id;
  const ehHorizontal = metadata.formato === "horizontal";
  const videoUrl = ehHorizontal ? `https://youtube.com/watch?v=${videoId}` : `https://youtube.com/shorts/${videoId}`;

  console.log(`[YouTube] ✅ Upload concluído com sucesso!`);
  console.log(`[YouTube] ID do Vídeo: ${videoId}`);
  console.log(`[YouTube] Link: ${videoUrl} (${privacyStatus})`);
  if (publishAt) {
    console.log(`[YouTube] ⏰ Agendado para publicação pública em: ${new Date(publishAt).toLocaleString("pt-BR")}`);
  }
  console.log("");

  return {
    plataforma: "youtube",
    sucesso: true,
    id: videoId,
    url: videoUrl,
    privacidade: privacyStatus,
    agendado_para: publishAt || null,
    status: publishAt ? "scheduled" : "uploaded",
    data: new Date().toISOString(),
  };
}
