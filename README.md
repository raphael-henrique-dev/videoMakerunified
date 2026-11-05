# 🚀 Motor 2.0 — Engine Autônoma de Geração de Vídeos Verticais (9:16)

> **Arquitetura:** Multi-Vídeo Atômico + HyperFrames + Three.js 3D Procedural + Motor 2D Vetorial SVG + Pipeline de Áudio Broadcast (-14 LUFS) + Publicador Multi-Plataforma (YouTube Shorts & TikTok API v2).

---

## 🌟 Visão Geral

O **Motor 2.0** é uma engine autônoma e modular desenvolvida para criar, renderizar e publicar vídeos curtos verticais (proporção 9:16) em resolução `1080x1920` a 30 FPS.

A engine unifica cinco pilares essenciais:
1. **Arquitetura Atômica Multi-Vídeo:** Cada vídeo criado em `videos/<slug>` é 100% independente, com seu próprio `roteiro.json`, composições de cena, áudios e renders.
2. **Runtime Dual (3D Procedural + 2D Vetorial Puro):**
   - **3D:** Palco Three.js procedural leve com iluminação volumétrica, câmeras calibradas para formato vertical (`FOV 42°`) e rig de mascote articulado com sincronização labial.
   - **2D:** Runtime SVG vetorial ultra-rápido (`motor2d.global.js`) renderizando cenas fluidas com GSAP e conformidade WCAG AA total de contraste.
3. **Engenharia de Áudio Broadcast:**
   - Integração com ElevenLabs para síntese vocal dinâmica com cache inteligente baseado em hash SHA-1 de cada frase.
   - *Sidechain ducking* determinístico entre trilha de fundo, efeitos sonoros (`sfx`) e locução.
   - Masterização automática na norma de streaming de **`-14 LUFS`** (`True Peak = -1.5 dB`).
4. **Legendas Karaokê Palavra por Palavra:** Sincronização sílaba a sílaba com animação de destaque tipográfico contida na zona segura do mobile.
5. **Automação de Publicação e Agendamento:**
   - Upload automático para **YouTube Shorts** (resumable upload via Data API v3).
   - Upload para **TikTok** (Content Posting API v2 com PKCE S256 obrigatório).
   - Sistema de agendamento com suporte a linguagem natural (`--agendar "amanha 18:00"` ou `"+2h"`).
   - Painel de status e diagnóstico em tempo real das conexões de API.

---

## 📁 Estrutura do Repositório

```
motor-v2/
├── assets/                     # Recursos globais compartilhados
│   ├── fonts/                  # Tipografia (Inter, EB Garamond, JetBrains Mono)
│   ├── sfx/                    # Catálogo de efeitos sonoros royalty-free
│   └── vendor/                 # Runtimes Three.js e Motor2D compilados
├── canal/                      # Memória e diretrizes do canal
│   ├── perfil.md               # Identidade visual, estilo e configurações do criador
│   ├── aprendizados.md         # Base de lições técnicas e padrões de renderização
│   └── historico.md            # Registro cronológico de produções e uploads
├── motor/                      # Núcleo da Engine (Kernel)
│   ├── 2d/                     # Runtime SVG vetorial (motor2d.global.js)
│   ├── 3d/                     # Módulos Three.js (câmera, rigging, props, shaders)
│   ├── audio/                  # Pipeline de TTS ElevenLabs, alinhamento e mixagem
│   ├── audit/                  # Auditoria Visual por Visão Computacional (Tier 1 Local + Tier 2 VLM)
│   ├── cli/                    # CLI orquestradora e assistente de IA
│   ├── publish/                # Upload, OAuth2, agendador e diagnósticos
│   ├── schema/                 # Validador de schema de roteiro
│   └── templates/              # Boilerplate base para novos vídeos
├── scripts/                    # Scripts de build do bundle 3D e storyboard
└── videos/                     # Catálogo de vídeos gerados (cada um isolado)
```

---

## ⚡ Instalação e Pré-requisitos

### 1. Requisitos do Sistema
- **Node.js** v20 ou superior
- **FFmpeg** com suporte a `libmp3lame` e filtro `ebur128` (para medição de LUFS)

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo e insira suas credenciais:

```bash
cp .env.example .env
```

Campos principais no `.env`:
- `ELEVENLABS_API_KEY`: Chave da API ElevenLabs (para síntese vocal).
- `YOUTUBE_CLIENT_ID` e `YOUTUBE_CLIENT_SECRET`: Credenciais OAuth 2.0 do Google Cloud Console.
- `TIKTOK_CLIENT_KEY` e `TIKTOK_CLIENT_SECRET`: Credenciais do portal TikTok Developers.

---

## 🚀 Guia de Operação (CLI)

### 1. Criar e Produzir um Novo Vídeo
```bash
# Cria um novo projeto atômico isolado em videos/<slug>
npm run video:novo -- meu-primeiro-video "Título do Vídeo"

# Gera a locução no ElevenLabs, timestamps de legenda e masterização de áudio
npm run video:audio -- meu-primeiro-video

# Abre o estúdio de desenvolvimento no navegador (HyperFrames Preview com hot-reload)
npm run video:dev -- meu-primeiro-video

# Audita conformidade técnica (linter, colisão de texto, conformidade WCAG AA)
npm run video:check -- meu-primeiro-video

# Audita visualmente com Visão Computacional (safe-zones 9:16, iluminação, freeze e VLM)
npm run video:audit:fast -- meu-primeiro-video   # Tier 1 determinístico local ultra-rápido (~25ms/frame, offline)
npm run video:audit -- meu-primeiro-video        # Tier 1 + Tier 2 com NVIDIA NIM 90B (padrão ativo)
npm run video:audit -- meu-primeiro-video --reuse-snapshots # Pula re-captura se snapshots já existirem
npm run video:audit -- meu-primeiro-video --provider=gemini # Alternativa: Google Gemini 2.5 Flash
npm run video:audit -- meu-primeiro-video --provider=openai # Alternativa: OpenAI GPT-4o
npm run video:audit -- meu-primeiro-video --provider=ollama # Alternativa: Ollama Local (llama3.2-vision)

# Captura 5 snapshots visuais para inspeção rápida
npm run video:snapshot -- meu-primeiro-video

# Renderiza o arquivo MP4 final em videos/<slug>/renders/output.mp4
npm run video:render -- meu-primeiro-video
```

---

### 2. Auditoria Visual por Visão Computacional (Two-Tier CV)

O Motor 2.0 possui uma camada dupla de auditoria visual automatizada antes do render final:

```
[Snapshots das Cenas]
         │
         ├───► Tier 1: Local Determinístico (Python PIL / Sharp) [~25ms/frame, 100% offline]
         │     ├── Safe-Zones 9:16 (Rodapé 1540-1920px, Topo 0-160px, Lateral 940-1080px)
         │     ├── Histograma de Luminância (Blackout / Superexposição / Baixo Contraste)
         │     ├── Detecção de Freeze de Animação (RMS delta entre amostras da cena < 0.35)
         │     └── Geração de Pranchas de Contato (Anotada para humanos + Limpa para VLM)
         │
         └───► Tier 2: Crítico Multimodal Universal (VLM)
               ├── Provedor Padrão Ativo: NVIDIA NIM (meta/llama-3.2-90b-vision-instruct)
               ├── Alternativas Prontas: Gemini 2.5 Flash, OpenAI GPT-4o, Ollama Local
               ├── Avaliação Semântica: Enquadramento 3D, clipping, clareza didática móvel
               └── Saída: Nota 1-10, Aprovado/Reprovado, correções de CSS/layout em código
```

#### Comandos de Auditoria:
```bash
# Auditoria rápida local (Tier 1 apenas — offline, sem consumo de API):
npm run video:audit:fast -- <slug>

# Auditoria completa (Tier 1 + Crítico NVIDIA NIM 90B):
npm run video:audit -- <slug>

# Reutilizar snapshots existentes (não dispara nova captura do HyperFrames):
npm run video:audit -- <slug> --reuse-snapshots

# Selecionar provedor VLM explicitamente:
npm run video:audit -- <slug> --provider=nvidia
npm run video:audit -- <slug> --provider=gemini
npm run video:audit -- <slug> --provider=openai
npm run video:audit -- <slug> --provider=ollama
```

Artefatos gerados em `videos/<slug>/renders/audit/`:
- `contact-sheet-anotada.jpg`: Visão consolidada com overlays de safe-zones e badges de status por cena.
- `vlm-sheet.jpg`: Prancha em grade 2×N limpa enviada ao VLM.
- `AUDITORIA_VISUAL.md`: Relatório completo com notas, advertências e sugestões acionáveis de código.
- `audit-result.json`: Metadados estruturados para integração contínua e auto-cura (self-healing).

---

### 3. Autenticação das Redes Sociais
Conecte suas contas com os assistentes interativos locais:

```bash
# Autentica seu canal no YouTube (Google OAuth2 via callback local)
npm run auth:youtube

# Autentica seu perfil no TikTok (Content Posting API v2 com PKCE)
npm run auth:tiktok
```

---

### 4. Diagnóstico e Status em Tempo Real
A qualquer momento, verifique a integridade das suas conexões e saldos de cota:

```bash
npm run video:status
# ou
npm run auth:status
```

Exibe o canal conectado no YouTube (inscritos e vídeos), o usuário ativo no TikTok, o saldo de caracteres disponíveis no ElevenLabs e agendamentos pendentes.

---

### 5. Publicação Automática de Vídeos

```bash
# Upload em ambas as plataformas (em modo PRIVADO para revisão segura):
npm run video:upload -- meu-primeiro-video

# Upload como PÚBLICO imediatamente:
npm run video:upload -- meu-primeiro-video --public

# Publicar apenas no YouTube Shorts:
npm run video:upload -- meu-primeiro-video --youtube

# Publicar apenas no TikTok:
npm run video:upload -- meu-primeiro-video --tiktok
```

---

### 6. Agendamento Inteligente de Postagens

O Motor compreende datas tanto em **linguagem natural** quanto em **tempo relativo**:

```bash
# Agendar para amanhã às 18:00 (YouTube na nuvem, TikTok na fila local):
npm run video:upload -- meu-primeiro-video --agendar "amanha 18:00"

# Agendar para daqui a 2 horas (offset relativo):
npm run video:upload -- meu-primeiro-video --agendar "+2h"

# Agendar para hoje à noite:
npm run video:upload -- meu-primeiro-video --em "hoje 21:30"

# Agendar para o próximo dia da semana:
npm run video:upload -- meu-primeiro-video --agendar "sexta 19:00"

# Agendar no YouTube e enviar direto como rascunho para o aplicativo do TikTok:
npm run video:upload -- meu-primeiro-video --agendar "amanha 18:00" --inbox
```

#### Gerenciamento da Fila de Agendamentos:
```bash
# Ver a fila e disparar publicações cujo horário já foi atingido:
npm run video:agendados

# Manter um watcher em segundo plano (avalia a fila a cada 60s):
npm run video:agendados -- --watch

# Cancelar um agendamento da fila:
npm run video:agendados -- --cancel <id-ou-slug>
```

---

## 📖 Documentação Adicional

- [**Guia de Configuração e APIs** (`motor/publish/GUIA_CONFIGURACAO.md`)](./motor/publish/GUIA_CONFIGURACAO.md) — Passo a passo para criação de apps no Google Cloud e TikTok Developers, soluções de erros comuns e integração com Web UI.
- [**Protocolo do Agente** (`AGENTS.md`)](./AGENTS.md) — Regras de operação, arquitetura e fluxo de trabalho para assistentes de IA no repositório.
- [**Diretrizes do Canal** (`canal/perfil.md`)](./canal/perfil.md) — Template de identidade editorial, visual e tom de voz.
- [**Aprendizados Técnicos** (`canal/aprendizados.md`)](./canal/aprendizados.md) — Regras de engenharia 3D, contrastes WCAG AA, sidechain ducking e protocolos de publicação.
