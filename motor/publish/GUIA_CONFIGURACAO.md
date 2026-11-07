# Guia de Configuração: Upload Automático (YouTube Shorts & TikTok) — Motor 2.0

Este módulo permite publicar automaticamente os vídeos renderizados pelo **Motor 2.0** no **YouTube Shorts** e no **TikTok**, com geração automática de metadados, suporte a publicação privada ou pública, e arquitetura modular pronta para ser consumida tanto pelo terminal (CLI) quanto por uma futura **Interface Web**.

---

## 🚀 Como Funciona o Fluxo

```
[ Vídeo Renderizado: output.mp4 ]
               │
               ▼
   prepararMetadados() (roteiro.json)
               │
       ┌───────┴───────┐
       ▼               ▼
[ YouTube API ]   [ TikTok API ]
 (Resumable)      (Direct Post v2)
       │               │
       └───────┬───────┘
               ▼
  publicacao_status.json + historico.md
```

1. **Geração Inteligente:** O sistema lê o `roteiro.json` do vídeo. Se houver o bloco `publicacao`, usa os valores customizados; se não houver, gera automaticamente títulos chamativos, tags relevantes e hashtags `#shorts #curiosidades` com base nas cenas do vídeo.
2. **Segurança por Padrão:** Por padrão, os envios sobem em modo **Privado** (`private` no YouTube e `SELF_ONLY` no TikTok) para você revisar antes de liberar. Adicione a flag `--public` se desejar publicação imediata.
3. **Registro Centralizado:** O resultado de cada upload é salvo em `videos/<slug>/publicacao_status.json` e no `canal/historico.md`.

---

## 1. Configurando o YouTube Shorts (Google Cloud Console)

### Passo 1: Criar o Projeto e Ativar a API
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto (ex: `Curiorisando-Upload`).
3. No menu lateral, acesse **APIs e Serviços** > **Biblioteca**.
4. Pesquise por **YouTube Data API v3** e clique em **Ativar**.

### Passo 2: Configurar a Tela de Consentimento OAuth
1. Vá em **APIs e Serviços** > **Tela de consentimento OAuth**.
2. Escolha **Externo** e clique em **Criar**.
3. Preencha o nome do app (ex: `Motor 2.0 Uploader`) e seu email de suporte.
4. Na aba **Escopos**, adicione o escopo:
   - `https://www.googleapis.com/auth/youtube.upload`
5. Na aba **Usuários de teste**, adicione o **endereço de e-mail da sua conta Google/YouTube** onde os vídeos serão postados.

### Passo 3: Criar o Client ID e Secret
1. Vá em **APIs e Serviços** > **Credenciais**.
2. Clique em **Criar Credenciais** > **ID do cliente OAuth**.
3. Tipo de aplicativo: selecione **Aplicativo da Web**.
4. Em **URIs de redirecionamento autorizados**, adicione:
   - `http://localhost:3000/oauth2callback`
5. Clique em **Criar** e copie o **Client ID** e o **Client Secret**.

### Passo 4: Adicionar ao `.env` e Autenticar
Abra o arquivo `.env` na pasta `motor-v2/` e preencha:
```env
YOUTUBE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=seu_client_secret
```

No terminal, execute o assistente de autenticação:
```bash
npm run auth:youtube
```
O navegador será aberto para você fazer login na sua conta do YouTube e autorizar o envio. O **Refresh Token** será salvo automaticamente!

---

## 2. Configurando o TikTok (TikTok Developers)

### Passo 1: Criar a Conta de Desenvolvedor
1. Acesse o portal [TikTok for Developers](https://developers.tiktok.com/).
2. Faça login e acesse **Manage Apps** > **Create an app**.
3. Escolha o tipo de aplicativo e defina o nome (ex: `Curiorisando Uploader`).

### Passo 2: Ativar a Content Posting API
1. Dentro do seu app no portal, acesse a aba **Products**.
2. Adicione o produto **Content Posting API**.
3. Verifique se os escopos `video.upload` e `video.publish` estão habilitados.
4. Na seção de **Redirect URI**, configure exatamente:
   - `http://localhost:3000/oauth2callback`

### Passo 3: Adicionar ao `.env` e Autenticar
Obtenha o **Client Key** e **Client Secret** no painel do TikTok e adicione ao `.env`:
```env
TIKTOK_CLIENT_KEY=seu_client_key_tiktok
TIKTOK_CLIENT_SECRET=seu_client_secret_tiktok
```

No terminal, execute o assistente de autenticação:
```bash
npm run auth:tiktok
```
Autorize a permissão no navegador. O token de atualização do TikTok será salvo automaticamente no sistema.

---

## 3. Verificando o Status de Conexão das APIs

A qualquer momento, você pode verificar a saúde e a conectividade de todas as suas APIs executando:

```bash
npm run auth:status
# ou
npm run video:status
```

O comando fará uma verificação em tempo real trazendo:
- 🔴 **YouTube:** Nome do canal, handle, canal ID, número de inscritos e vídeos.
- 🎵 **TikTok:** Nome do perfil autenticado, open_id e modo de publicação ativo.
- 🗣️ **ElevenLabs:** Plano contratado, voz padrão e saldo de caracteres disponíveis.

---

## 4. Como Fazer Upload dos Vídeos

### Upload Completo (YouTube + TikTok em modo Privado Seguro):
```bash
npm run video:upload -- por-que-a-bateria-despenca
```

### Publicar como Público Imediatamente:
```bash
npm run video:upload -- por-que-a-bateria-despenca --public
```

### Publicar Apenas no YouTube Shorts:
```bash
npm run video:upload -- por-que-a-bateria-despenca --youtube
```

### Publicar Apenas no TikTok:
```bash
npm run video:upload -- por-que-a-bateria-despenca --tiktok
```

---

## 5. Agendamento Automático de Publicação (`--agendar`, `--schedule`, `--em`)

O Motor 2.0 inclui um sistema inteligente de agendamento que entende datas em linguagem natural e offsets de tempo.

### Exemplos de Comandos:

```bash
# 1. Agendar para amanhã às 18:00 (YouTube + TikTok)
npm run video:upload -- por-que-a-bateria-despenca --agendar "amanha 18:00"

# 2. Agendar para daqui a 2 horas (offset relativo)
npm run video:upload -- por-que-a-bateria-despenca --agendar "+2h"

# 3. Agendar para hoje à noite
npm run video:upload -- por-que-a-bateria-despenca --em "hoje 21:30"

# 4. Agendar para um dia específico da semana
npm run video:upload -- por-que-a-bateria-despenca --agendar "sexta 19:00"

# 5. Agendar apenas no YouTube com data e hora exatas
npm run video:upload -- por-que-a-bateria-despenca --youtube --agendar "2026-11-10 18:00"

# 6. Agendar no YouTube e enviar direto como rascunho para o app do TikTok
npm run video:upload -- por-que-a-bateria-despenca --agendar "amanha 18:00" --inbox
```

### Formatos de Data Reconhecidos:
- **Relativos:** `"+2h"`, `"3h"`, `"30m"`, `"45min"`, `"1d"`, `"2h30m"`
- **Coloquiais (Português):** `"hoje 20:00"`, `"amanha 18:00"`, `"depois de amanha 14:00"`, `"sexta 19:30"`
- **Datas explícitas:** `"10/11/2026 18:00"`, `"2026-11-10 18:00"`, `"2026-11-10T21:00:00Z"`

### Como Funciona por Plataforma:
1. **YouTube Shorts (Agendamento Nativo na Nuvem):**
   - O YouTube Data API v3 suporta agendamento remoto nativo via `publishAt`.
   - O vídeo é enviado de imediato com `privacyStatus: "private"`. Os servidores do Google mantêm o vídeo protegido e o tornam **público automaticamente no segundo exato agendado**, sem exigir que seu computador esteja ligado!
2. **TikTok (Fila Local ou Rascunho no App):**
   - A API do TikTok v2 não possui o campo `publishAt` remoto no servidor.
   - **Por padrão:** O Motor registra a postagem na **fila local de agendamentos** (`motor/publish/agendamentos.json`) para disparo automatizado no horário alvo.
   - **Com a flag `--inbox`:** O vídeo é enviado agora mesmo para o Inbox do seu aplicativo do TikTok como rascunho com o título pronto. Você receberá uma notificação no celular e poderá agendar com 1 toque no app.

### Gerenciando a Fila de Agendamentos:
```bash
# Ver a fila e executar agendamentos que já venceram o horário:
npm run video:agendados

# Manter um watcher em segundo plano (verifica a cada 60s):
npm run video:agendados -- --watch

# Cancelar um agendamento da fila:
npm run video:agendados -- --cancel <id-ou-slug>
```

---

## 6. Customização de Metadados no `roteiro.json` (Opcional)

Se desejar personalizar título, tags ou legenda para um vídeo específico, adicione o bloco `"publicacao"` no arquivo `roteiro.json` do vídeo:

```json
{
  "slug": "por-que-a-bateria-despenca",
  "tema": "Por Que a Bateria Despenca de 20% Para Zero?",
  "modo": "2d",
  "publicacao": {
    "titulo": "Por Que a Bateria Despenca de 20% Para Zero? 🔋 #shorts",
    "descricao": "Você já passou pelo desespero de ver o celular apagar bem quando mais precisava? Entenda a química real da bateria!",
    "tags": ["bateria", "celular", "curiosidades", "ciencia", "tecnologia"],
    "tiktok_caption": "Por que a bateria despenca de 20% pra zero no momento que você mais precisa? 😱 #curiosidades #celular #bateria #fyp #foryou",
    "allow_comments": true,
    "allow_duet": true,
    "allow_stitch": true
  }
}
```
*(Caso não preencha, o Motor gera tudo automaticamente mantendo a consistência do canal).*

---

## 7. Integração com Futura Interface Web

O motor foi construído com arquitetura de serviços em JavaScript ES Modules desacoplada da CLI. Quando você for desenvolver a Interface Web, basta importar as funções de `uploader.js` ou `status.js`:

```javascript
import { publicarVideo } from "./motor/publish/uploader.js";
import { obterStatusAPIs } from "./motor/publish/status.js";

// Endpoint de publicação (Express, Fastify, Next.js, Electron):
app.post("/api/videos/:slug/upload", async (req, res) => {
  try {
    const { slug } = req.params;
    const { publico, youtube, tiktok, agendar, tiktokInbox } = req.body;

    const resultado = await publicarVideo(slug, {
      public: publico,
      youtube: youtube !== false,
      tiktok: tiktok !== false,
      agendar,
      tiktokInbox,
    });

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Endpoint de status das APIs em tempo real:
app.get("/api/auth/status", async (req, res) => {
  const status = await obterStatusAPIs();
  res.json(status);
});
```

---

## 8. Solução de Problemas Comuns (Troubleshooting)

### 🔴 Google / YouTube OAuth
1. **Erro: *"Acesso bloqueado: o app só pode ser usado dentro da organização"***
   - **Causa:** O tipo de usuário na Tela de Consentimento OAuth foi selecionado como "Interno".
   - **Solução:** No Google Cloud Console, altere o tipo para **Externo** em *APIs e Serviços > Tela de consentimento OAuth*. Em seguida, adicione o e-mail da sua conta Google na aba **Usuários de teste**.
2. **Erro: *"Acesso bloqueado: o app não concluiu o processo de verificação do Google"***
   - **Solução:** Como o app está em modo de desenvolvimento pessoal, clique em **Avançado** e depois em **Acessar Motor 2.0 (não seguro)** para conceder a autorização.

### 🎵 TikTok Developers OAuth
1. **Erro no portal: *"Enter a valid redirect uri (localhost is not supported)"***
   - **Causa:** O portal de desenvolvedores do TikTok bloqueia o protocolo `http://localhost`.
   - **Solução:** Use uma URL HTTPS pública através de um túnel seguro (ex: `ngrok http 3000` gerando `https://seu-subdominio.ngrok-free.dev/oauth2callback/`). Configure exatamente a mesma URL no `.env` em `TIKTOK_REDIRECT_URI`.
2. **Erro no formulário: *"Invalid Redirect Uri."***
   - **Causa:** O validador do portal do TikTok pode exigir uma barra final (`/`).
   - **Solução:** Adicione a barra no final da URL no painel do TikTok e no `.env` (ex: `https://.../oauth2callback/`). O helper local do Motor normaliza as rotas automaticamente.
3. **Erro de autorização: *"code_challenge required"***
   - **Causa:** O TikTok API v2 torna o padrão PKCE mandatória.
   - **Solução:** O módulo `tiktok.js` já gera automaticamente o `code_verifier` e o `code_challenge` via SHA-256 (Base64URL) com método `S256`.
4. **Erro de permissão: *"scope"* no login do TikTok**
   - **Causa:** Tentar solicitar `video.publish` em contas ou apps sem auditoria comercial aprovada.
   - **Solução:** Use o conjunto de escopos oficial suportado: `user.info.basic,video.upload`. Com ele, o vídeo é enviado para a sua caixa de entrada (Inbox/Rascunhos), pronto para ser revisado e postado.
