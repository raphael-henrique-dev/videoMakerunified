# 🚀 Motor 2.0 — Fábrica Atômica de Vídeos & Automação de Publicação

> **Canal Oficial:** Curiorisando (`@ocuriorisando`)  
> **Arquitetura:** Multi-Vídeo Atômico + HyperFrames + Three.js 3D Procedural + Motor 2D Vetorial + Pipeline de Áudio Broadcast (-14 LUFS) + Publicador Automatizado (YouTube Shorts & TikTok API v2).

---

## 🌟 O Que é o Motor 2.0?

O **Motor 2.0** é uma plataforma completa e autônoma desenvolvida para criar, renderizar e publicar vídeos curtos verticais (9:16) de altíssima qualidade técnica para redes sociais.

O ecossistema resolve de ponta a ponta:
1. **Roteiro e Narrativa Magnética:** Formato *"100% Vida Real"* sem jargões acadêmicos, com gancho de 2s e dinamismo *"falha ➔ corrige"*.
2. **Síntese Vocal com Emoção Dramática:** Voz oficial **Liam** do ElevenLabs com parâmetros calibrados (`estabilidade: 0.38`, `estilo: 0.40`, `velocidade: 1.08`) e cache persistente por SHA-1.
3. **Engenharia de Áudio Broadcast:** Alinhamento de timestamps sílaba a sílaba, *sidechain ducking* dinâmico de trilha sonora/SFX e masterização em `-14 LUFS` (`TP = -1.5 dB`).
4. **Composição Visual Dual (3D Procedural + 2D Vetorial Puro):**
   - **3D:** Three.js procedural com shaders vivos (água, caustics, iluminação volumétrica) e mascote animado.
   - **2D:** Runtime SVG vetorial ultra-rápido (`motor2d.global.js`) renderizando em menos de metade do tempo com nitidez perfeita em 1080x1920 e lip-sync dinâmico.
5. **Publicador Multi-Plataforma com Agendamento:** Upload automático com metadados para **YouTube Shorts** e **TikTok**, diagnóstico ativo de status das APIs e sistema de agendamento em linguagem natural.

---

## 📁 Estrutura do Projeto

```
motor-v2/
├── assets/                     # Recursos globais compartilhados (fontes, SFX, Three.js)
├── canal/                      # Memória viva do canal
│   ├── perfil.md               # Identidade visual, mascote, tom de voz e canais
│   ├── aprendizados-curto.md   # Regras técnicas herdadas pelos vídeos curtos
│   ├── aprendizados-longo.md   # Estrutura reservada para aprendizados 16:9
│   └── historico.md            # Registro histórico de vídeos produzidos e uploads
├── motor/                      # Núcleo do motor (imutável para os vídeos)
│   ├── 2d/                     # Runtime SVG vetorial puro (motor2d.global.js)
│   ├── 3d/                     # Runtimes Three.js procedurais e construtores 3D
│   ├── audio/                  # Pipeline de TTS ElevenLabs, alinhamento e masterização
│   ├── audit/                  # Auditoria Visual por Visão Computacional (Tier 1 Local + Tier 2 VLM)
│   ├── cli/                    # Orquestrador CLI multi-vídeo e assistente por linguagem natural
│   ├── publish/                # Upload, OAuth2, agendamento de postagens e status
│   └── templates/              # Arquétipos de templates para novos vídeos
└── videos/                     # Catálogo de projetos de vídeos atômicos e isolados
    ├── cabo-submarino/         # Projeto 3D (Cabo submarino + mascote)
    ├── por-que-o-elevador.../  # Projeto 2D (Freio, contrapeso e física do elevador)
    └── por-que-a-bateria.../   # Projeto 2D (Curva de descarga de lítio + upload teste)
```

---

## ⚡ Guia Rápido de Comandos

### 1. Criar e Produzir um Novo Vídeo
```bash
# Cria um novo projeto atômico e isolado em videos/<slug>
npm run video:novo -- por-que-o-ceu-e-azul "Por Que o Céu é Azul?"
# Vídeo longo horizontal 1920x1080:
npm run video:novo -- engenharia-do-clima "Engenharia do Clima" --formato=horizontal

# Gera a narração com ElevenLabs, timestamps de legenda e masterização de áudio
npm run video:audio -- por-que-o-ceu-e-azul

# Abre o estúdio de desenvolvimento visual com hot-reload no navegador
npm run video:dev -- por-que-o-ceu-e-azul

# Audita o vídeo com o linter técnico (conformidade de layout, contraste WCAG AA)
npm run video:check -- por-que-o-ceu-e-azul

# Audita visualmente com Visão Computacional (safe-zones, iluminação, freeze e VLM)
npm run video:audit:fast -- por-que-o-ceu-e-azul   # Tier 1: Local determinístico ultra-rápido (~25ms/frame, offline)
npm run video:audit -- por-que-o-ceu-e-azul        # Tier 1 + Tier 2: Avaliação semântica via NVIDIA NIM (padrão)
npm run video:audit -- por-que-o-ceu-e-azul --reuse-snapshots # Pula re-captura se os snapshots já existirem
npm run video:audit -- por-que-o-ceu-e-azul --provider=gemini # Alternativa: Google Gemini 2.5 Flash
npm run video:audit -- por-que-o-ceu-e-azul --provider=openai # Alternativa: OpenAI GPT-4o
npm run video:audit -- por-que-o-ceu-e-azul --provider=ollama # Alternativa: Ollama Llama 3.2 Vision Local
npm run video:audit -- engenharia-do-clima --vlm-lote=6 --vlm-timeout=120000 # Horizontal: VLM em lotes (padrão 8 cenas) com timeout por lote

# Captura snapshots visuais das cenas para inspeção rápida
npm run video:snapshot -- por-que-o-ceu-e-azul

# Renderiza o arquivo MP4 final em videos/<slug>/renders/output.mp4
npm run video:render -- por-que-o-ceu-e-azul
```

---

#### Vídeos horizontais: cenas data-driven, transições, áudio e render

```bash
# Em roteiro horizontal, um frame pode usar `cena` em vez de `arquivo` (o gerador monta a composição):
#   "cena": { "tipo": "grafico-barra", "dados": { "barras": [{ "rotulo": "A", "valor": 3 }, ...] } }
# Tipos: capitulo-titulo, lista-animada, comparacao-ab, grafico-linha, grafico-barra,
#        linha-do-tempo, numero-grande, diagrama-fluxo, mascote-explica (motor/2d/cenas/)
# Transições por frame: "transicao": "flash|fade|wipe|push|zoom" (o curto usa só flash; o horizontal alterna sozinho)
# Música por capítulo: capitulos[].musica (loop + crossfade de 1,5 s; sem ela vale `trilha`)
npm run build:cenas                      # regenera assets/vendor/cenas2d.global.js após mexer em motor/2d/cenas/
npm run video:render -- engenharia-do-clima --4k --workers=2 --low-memory --resume   # flags extras só no horizontal
node scripts/gerar-roteiro-sintetico.js teste-carga --cenas=40 --minutos=10          # teste de carga (~10 min, ~40 cenas)
node scripts/gerar-roteiro-sintetico.js teste-carga --sem-audio                      # timeline estimado, sem TTS
```

O áudio faz retry com backoff em 429/5xx (até 5 tentativas, respeita `Retry-After`), narra 3 frases em paralelo
e masteriza com `loudnorm` em 2 passadas (alvo -14 LUFS, TP -1,5; o valor final medido vai para `audio_meta.json`).

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

### 3. Status e Diagnóstico das APIs em Tempo Real
Verifique instantaneamente se todas as suas credenciais sociais e de voz estão ativas:

```bash
npm run video:status
# ou
npm run auth:status
```

O comando sonda ativamente as APIs e exibe:
- 🔴 **YouTube Data API v3:** Nome do canal, handle, canal ID, número de inscritos e vídeos.
- 🎵 **TikTok Content Posting API v2:** Nome do perfil autenticado, open_id e modo de postagem.
- 🗣️ **ElevenLabs Voice AI:** Plano ativo, voz padrão e saldo de caracteres disponíveis.
- ⏰ **Fila de Agendamentos:** Total de vídeos aguardando publicação automática.

---

### 4. Autenticação das Redes Sociais
Conecte suas contas com assistentes locais que abrem o navegador e capturam os tokens:

```bash
# Autentica canal do YouTube (Google OAuth2)
npm run auth:youtube

# Autentica perfil do TikTok (TikTok Developers com PKCE SHA-256 S256)
npm run auth:tiktok
```

---

### 5. Publicação Automática de Vídeos

```bash
# Upload em ambas as plataformas (em modo PRIVADO para revisão segura):
npm run video:upload -- por-que-a-bateria-despenca

# Upload como PÚBLICO imediatamente:
npm run video:upload -- por-que-a-bateria-despenca --public

# Publicar apenas no YouTube Shorts:
npm run video:upload -- por-que-a-bateria-despenca --youtube

# Publicar apenas no TikTok:
npm run video:upload -- por-que-a-bateria-despenca --tiktok
```

---

### 6. Agendamento Inteligente de Postagens

O Motor compreende datas em **linguagem natural** e **offsets relativos**:

```bash
# Agendar para amanhã às 18h (YouTube agenda na nuvem, TikTok entra na fila local):
npm run video:upload -- por-que-a-bateria-despenca --agendar "amanha 18:00"

# Agendar para daqui a 2 horas:
npm run video:upload -- por-que-a-bateria-despenca --agendar "+2h"

# Agendar para hoje à noite:
npm run video:upload -- por-que-a-bateria-despenca --em "hoje 21:30"

# Agendar para o próximo dia da semana:
npm run video:upload -- por-que-a-bateria-despenca --agendar "sexta 19:00"

# Agendar no YouTube e enviar como rascunho direto ao app do TikTok no smartphone:
npm run video:upload -- por-que-a-bateria-despenca --agendar "amanha 18:00" --inbox
```

#### Gerenciamento da Fila de Agendamentos:
```bash
# Ver agendamentos e disparar tarefas que atingiram o horário:
npm run video:agendados

# Manter um watcher rodando em background (avalia a fila a cada 60s):
npm run video:agendados -- --watch

# Cancelar um agendamento da fila:
npm run video:agendados -- --cancel <id-ou-slug>
```

---

## 📚 Documentações Detalhadas

Para aprofundamento técnico em regras, arquitetura e integrações, consulte:
- 📖 [**Guia de Configuração e Publicação** (`motor/publish/GUIA_CONFIGURACAO.md`)](./motor/publish/GUIA_CONFIGURACAO.md) — Passo a passo no Google Cloud e TikTok Developers, soluções de erros (troubleshooting) e exemplos de código.
- 🧠 [**Aprendizados Curtos** (`canal/aprendizados-curto.md`)](./canal/aprendizados-curto.md) — regras acumuladas do formato vertical.
- 🧠 [**Aprendizados Longos** (`canal/aprendizados-longo.md`)](./canal/aprendizados-longo.md) — estrutura reservada para o formato horizontal.
- 👤 [**Perfil do Canal** (`canal/perfil.md`)](./canal/perfil.md) — Personagem mascote, paleta de cores, tipografia e diretrizes de roteiro.
- 📜 [**Histórico de Produção** (`canal/historico.md`)](./canal/historico.md) — Log de vídeos renderizados e registros de upload nas redes.
- 🤖 [**Protocolo do Agente** (`AGENTS.md`)](./AGENTS.md) — Instruções operacionais para agentes de IA operando no repositório.
