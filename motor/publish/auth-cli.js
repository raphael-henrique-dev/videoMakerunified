#!/usr/bin/env node
// motor/publish/auth-cli.js — CLI para Autenticação OAuth2 Inicial (YouTube e TikTok)
import { carregarEnv, carregarTokens } from "./env-helper.js";
import { aguardarCallbackOAuth, abrirNavegador } from "./oauth-helper.js";
import { getYouTubeAuthUrl, exchangeYouTubeCode } from "./youtube.js";
import { getTikTokAuthUrl, exchangeTikTokCode, gerarCodeVerifier, getTikTokScopes } from "./tiktok.js";

carregarEnv();

const plataforma = process.argv[2]?.toLowerCase();
const PORTA = Number(process.env.OAUTH_PORT) || 3000;
const REDIRECT_URI_PADRAO = `http://localhost:${PORTA}/oauth2callback`;
const REDIRECT_URI_YOUTUBE = process.env.YOUTUBE_REDIRECT_URI || REDIRECT_URI_PADRAO;
const REDIRECT_URI_TIKTOK = process.env.TIKTOK_REDIRECT_URI || REDIRECT_URI_PADRAO;

async function autenticarYouTube() {
  console.log("\n========================================================");
  console.log("   🔐 AUTENTICAÇÃO DO YOUTUBE (Google OAuth 2.0)");
  console.log("========================================================\n");

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("❌ ERRO: 'YOUTUBE_CLIENT_ID' e/ou 'YOUTUBE_CLIENT_SECRET' não encontrados no .env\n");
    console.log("📝 Passo a passo para obter suas chaves do Google Cloud:");
    console.log("  1. Acesse https://console.cloud.google.com/");
    console.log("  2. Crie um projeto ou selecione um existente.");
    console.log("  3. Em 'APIs e Serviços' > 'Biblioteca', ative a 'YouTube Data API v3'.");
    console.log("  4. Em 'Credenciais' > 'Criar Credenciais' > 'ID do cliente OAuth':");
    console.log("     - Tipo de aplicativo: 'Aplicativo da Web'");
    console.log(`     - URIs de redirecionamento autorizados: ${REDIRECT_URI}`);
    console.log("  5. Copie o Client ID e Client Secret e adicione no seu arquivo .env:");
    console.log("     YOUTUBE_CLIENT_ID=seu_client_id_aqui");
    console.log("     YOUTUBE_CLIENT_SECRET=seu_client_secret_aqui\n");
    process.exit(1);
  }

  const authUrl = getYouTubeAuthUrl(clientId, REDIRECT_URI_YOUTUBE);

  console.log("🌐 Abrindo seu navegador para autorizar o acesso à sua conta do YouTube...");
  console.log("Se o navegador não abrir automaticamente, copie e cole o link abaixo no seu navegador:\n");
  console.log(`\x1b[36m${authUrl}\x1b[0m\n`);
  console.log(`⏳ Aguardando confirmação no navegador em ${REDIRECT_URI_YOUTUBE}...`);

  abrirNavegador(authUrl);

  try {
    const { code } = await aguardarCallbackOAuth(PORTA, "/oauth2callback");
    console.log("\n📦 Código recebido! Solicitando tokens ao Google...");

    const tokens = await exchangeYouTubeCode(code, clientId, clientSecret, REDIRECT_URI_YOUTUBE);
    console.log("✅ YouTube autenticado com sucesso!");
    console.log("🔑 Refresh Token salvo no arquivo .env e persistido localmente.");
    console.log("Agora você já pode publicar vídeos usando: npm run video:upload -- <slug>\n");
  } catch (err) {
    console.error(`\n❌ Falha na autenticação do YouTube: ${err.message}\n`);
    process.exit(1);
  }
}

async function autenticarTikTok() {
  console.log("\n========================================================");
  console.log("   🔐 AUTENTICAÇÃO DO TIKTOK (Content Posting API v2)");
  console.log("========================================================\n");

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    console.error("❌ ERRO: 'TIKTOK_CLIENT_KEY' e/ou 'TIKTOK_CLIENT_SECRET' não encontrados no .env\n");
    console.log("📝 Passo a passo para obter suas chaves do TikTok:");
    console.log("  1. Acesse https://developers.tiktok.com/");
    console.log("  2. Crie uma conta de desenvolvedor e clique em 'Manage apps' > 'Create an app'.");
    console.log("  3. Em 'Products', adicione a 'Content Posting API' (escopos: video.upload, video.publish).");
    console.log(`  4. Em 'Redirect URI', configure exatamente: ${REDIRECT_URI_TIKTOK}`);
    console.log("  5. Copie o Client Key e Client Secret e adicione no seu arquivo .env:");
    console.log("     TIKTOK_CLIENT_KEY=seu_client_key_aqui");
    console.log("     TIKTOK_CLIENT_SECRET=seu_client_secret_aqui\n");
    process.exit(1);
  }

  const codeVerifier = gerarCodeVerifier();
  const authUrl = getTikTokAuthUrl(clientKey, REDIRECT_URI_TIKTOK, codeVerifier);

  console.log(`🔑 Escopos solicitados: ${getTikTokScopes()}`);
  console.log("🌐 Abrindo seu navegador para autorizar o acesso à sua conta do TikTok...");
  console.log("Se o navegador não abrir automaticamente, copie e cole o link abaixo no seu navegador:\n");
  console.log(`\x1b[36m${authUrl}\x1b[0m\n`);
  console.log(`⏳ Aguardando confirmação no navegador em ${REDIRECT_URI_TIKTOK}...`);

  abrirNavegador(authUrl);

  try {
    const { code } = await aguardarCallbackOAuth(PORTA, "/oauth2callback");
    console.log("\n📦 Código recebido! Solicitando tokens ao TikTok com validação PKCE...");

    const tokens = await exchangeTikTokCode(code, clientKey, clientSecret, REDIRECT_URI_TIKTOK, codeVerifier);
    console.log("✅ TikTok autenticado com sucesso!");
    console.log("🔑 Refresh Token salvo no arquivo .env e persistido localmente.");
    console.log("Agora você já pode publicar vídeos usando: npm run video:upload -- <slug>\n");
  } catch (err) {
    console.error(`\n❌ Falha na autenticação do TikTok: ${err.message}\n`);
    process.exit(1);
  }
}

switch (plataforma) {
  case "youtube":
    autenticarYouTube();
    break;
  case "tiktok":
    autenticarTikTok();
    break;
  default:
    console.log("Uso do comando de autenticação:");
    console.log("  npm run auth:youtube  — Autentica conta do YouTube para upload de Shorts");
    console.log("  npm run auth:tiktok   — Autentica conta do TikTok para upload de vídeos");
    process.exit(1);
}
