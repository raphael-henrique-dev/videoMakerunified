// motor/publish/tiktok.js — Integração com a TikTok Content Posting API v2
import fs from "node:fs";
import crypto from "node:crypto";
import { carregarEnv, carregarTokens, salvarTokens, salvarNoEnv } from "./env-helper.js";

const TIKTOK_AUTH_ENDPOINT = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_ENDPOINT = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_DIRECT_POST_ENDPOINT = "https://open.tiktokapis.com/v2/post/publish/video/init/";
const TIKTOK_INBOX_UPLOAD_ENDPOINT = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/";
const TIKTOK_STATUS_ENDPOINT = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";

export function getTikTokScopes() {
  return process.env.TIKTOK_SCOPES || "user.info.basic,video.upload";
}

/**
 * Gera um code_verifier criptograficamente seguro para o fluxo PKCE do TikTok.
 */
export function gerarCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Calcula o code_challenge SHA-256 no formato Base64URL.
 */
export function gerarCodeChallenge(verifier) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Gera a URL para autorização no TikTok Developers com PKCE obrigatório.
 */
export function getTikTokAuthUrl(clientKey, redirectUri, codeVerifier) {
  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_key: clientKey,
    scope: getTikTokScopes(),
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });

  if (codeVerifier) {
    params.set("code_challenge", gerarCodeChallenge(codeVerifier));
    params.set("code_challenge_method", "S256");
  }

  return `${TIKTOK_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Troca o authorization code pelo access_token e refresh_token usando o code_verifier PKCE.
 */
export async function exchangeTikTokCode(code, clientKey, clientSecret, redirectUri, codeVerifier) {
  const params = {
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  };

  if (codeVerifier) {
    params.code_verifier = codeVerifier;
  }

  const res = await fetch(TIKTOK_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  const json = await res.json();
  const data = json.data || json;

  if (json.error?.code && json.error?.code !== "ok" && json.error?.code !== 0) {
    throw new Error(`Falha ao obter tokens do TikTok: ${json.error.message || JSON.stringify(json.error)}`);
  }
  if (!data.access_token) {
    throw new Error(`TikTok não retornou access_token: ${JSON.stringify(json)}`);
  }

  const agora = Date.now();
  const infoTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    open_id: data.open_id,
    expires_at: agora + (data.expires_in || 86400) * 1000,
    scope: data.scope,
  };

  salvarTokens("tiktok", infoTokens);
  if (data.refresh_token) {
    salvarNoEnv("TIKTOK_REFRESH_TOKEN", data.refresh_token);
  }

  return infoTokens;
}

/**
 * Retorna um access_token válido para o TikTok, renovando se necessário.
 */
export async function getValidTikTokToken() {
  carregarEnv();
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const tokenSalvo = carregarTokens("tiktok") || {};
  const refreshToken = tokenSalvo.refresh_token || process.env.TIKTOK_REFRESH_TOKEN;

  if (!clientKey || !clientSecret) {
    throw new Error("TIKTOK_CLIENT_KEY e TIKTOK_CLIENT_SECRET não estão configurados no .env.");
  }
  if (!refreshToken) {
    throw new Error("TikTok não autenticado. Execute primeiro: npm run auth:tiktok");
  }

  // Se o access_token ainda é válido por mais de 5 minutos, reutiliza
  if (tokenSalvo.access_token && tokenSalvo.expires_at && tokenSalvo.expires_at > Date.now() + 300000) {
    return tokenSalvo.access_token;
  }

  // Renova o token
  const res = await fetch(TIKTOK_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const json = await res.json();
  const data = json.data || json;

  if (json.error?.code && json.error?.code !== "ok" && json.error?.code !== 0) {
    throw new Error(`Falha ao renovar token do TikTok: ${json.error.message || JSON.stringify(json.error)}`);
  }

  const infoAtualizada = {
    ...tokenSalvo,
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + (data.expires_in || 86400) * 1000,
  };
  salvarTokens("tiktok", infoAtualizada);

  return data.access_token;
}

/**
 * Realiza a publicação direta de um vídeo no TikTok via Content Posting API v2.
 * @param {string} videoPath - Caminho do arquivo .mp4
 * @param {object} metadata - { caption, privacy_level, allow_comments, allow_duet, allow_stitch }
 * @param {object} options - { public?: boolean }
 */
export async function uploadToTikTok(videoPath, metadata, options = {}) {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Arquivo de vídeo não encontrado em: ${videoPath}`);
  }

  const stats = fs.statSync(videoPath);
  const fileSize = stats.size;
  const accessToken = await getValidTikTokToken();

  const privacyLevel = options.public ? "PUBLIC_TO_EVERYONE" : "SELF_ONLY";
  const tokenSalvo = carregarTokens("tiktok") || {};
  const escopos = tokenSalvo.scope || getTikTokScopes();
  const modoDirectPost = escopos.includes("video.publish");

  console.log(`[TikTok] Inicializando upload (${modoDirectPost ? "Direct Post" : "Inbox / Rascunho"}) (${(fileSize / (1024 * 1024)).toFixed(1)} MB)...`);
  if (modoDirectPost) {
    console.log(`[TikTok] Legenda: "${metadata.caption.slice(0, 50)}..." | Privacidade: ${privacyLevel}`);
  }

  // Passo 1: Inicializar o upload de vídeo (Direct Post ou Inbox)
  const initEndpoint = modoDirectPost ? TIKTOK_DIRECT_POST_ENDPOINT : TIKTOK_INBOX_UPLOAD_ENDPOINT;
  const initBody = modoDirectPost
    ? {
        post_info: {
          title: metadata.caption,
          privacy_level: privacyLevel,
          disable_duet: !metadata.allow_duet,
          disable_stitch: !metadata.allow_stitch,
          disable_comment: !metadata.allow_comments,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: fileSize,
          chunk_size: fileSize,
          total_chunk_count: 1,
        },
      }
    : {
        source_info: {
          source: "FILE_UPLOAD",
          video_size: fileSize,
          chunk_size: fileSize,
          total_chunk_count: 1,
        },
      };

  const initRes = await fetch(initEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(initBody),
  });

  const initJson = await initRes.json();
  if (!initRes.ok || initJson.error?.code !== "ok" && initJson.error?.code !== 0 && initJson.error?.code != null) {
    const msg = initJson.error?.message || JSON.stringify(initJson);
    throw new Error(`Falha ao iniciar postagem no TikTok (${initRes.status}): ${msg}`);
  }

  const publishId = initJson.data?.publish_id;
  const uploadUrl = initJson.data?.upload_url;

  if (!uploadUrl || !publishId) {
    throw new Error(`O TikTok não retornou a URL de upload ou publish_id: ${JSON.stringify(initJson)}`);
  }

  // Passo 2: Upload binário do vídeo em bloco único (chunk)
  console.log(`[TikTok] Transferindo bytes do vídeo para os servidores do TikTok...`);
  const fileBuffer = fs.readFileSync(videoPath);

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Range": `bytes 0-${fileSize - 1}/${fileSize}`,
      "Content-Length": String(fileSize),
    },
    body: fileBuffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Falha ao enviar arquivo para o TikTok (${uploadRes.status}): ${errText}`);
  }

  console.log(`[TikTok] ✅ Envio de bytes concluído! Publish ID: ${publishId}`);

  // Passo 3: Consultar status de processamento da postagem
  console.log(`[TikTok] Verificando status de processamento...`);
  let statusFinal = "PROCESSING_UPLOAD";
  try {
    const statusRes = await fetch(TIKTOK_STATUS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publish_id: publishId }),
    });
    const statusJson = await statusRes.json();
    if (statusJson.data?.status) {
      statusFinal = statusJson.data.status;
    }
  } catch {}

  console.log(`[TikTok] Status atual: ${statusFinal} (${privacyLevel})\n`);

  return {
    plataforma: "tiktok",
    sucesso: true,
    publish_id: publishId,
    status: statusFinal,
    privacidade: privacyLevel,
    data: new Date().toISOString(),
  };
}
