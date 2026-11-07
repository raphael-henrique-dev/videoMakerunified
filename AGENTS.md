# AGENTS.md — Protocolo do Agente de I.A. & Fábrica Atômica Multi-Vídeo (`motor-v2`)

Bem-vindo ao **Motor 2.0**, o ecossistema atômico de geração automatizada de vídeos que unifica o **runtime declarativo HyperFrames (2D Code Editorial)**, o **Kit 3D Procedural Three.js**, o **Motor 2D Vetorial Puro**, a **engenharia de áudio broadcast (-14 LUFS com Sidechain Ducking)** e o **Publicador Multi-Plataforma Automatizado (YouTube Shorts & TikTok API v2)**.

---

## 0. Regra Zero — Releitura Obrigatória do Contexto

> [!IMPORTANT]
> **Sempre antes de qualquer criação** (novo vídeo, roteiro, frame, animação, ajuste de áudio, render, publicação ou mudança estrutural no motor), **releia todos os arquivos de contexto `.md`**. A memória do canal evolui entre sessões; criar a partir de lembranças antigas gera retrabalho e contradiz padrões já aprovados.

**Ordem de leitura recomendada:**

1. [`AGENTS.md`](./AGENTS.md) — protocolo e regras operacionais.
2. [`canal/perfil.md`](./canal/perfil.md) — identidade visual, mascote, paleta, tipografia, tom de voz e canais conectados.
3. [`canal/aprendizados.md`](./canal/aprendizados.md) — regras técnicas, armadilhas já resolvidas e arsenal de efeitos opcionais.
4. [`canal/historico.md`](./canal/historico.md) — vídeos produzidos, uploads e links publicados.
5. [`README.md`](./README.md) — arquitetura e comandos atualizados.
6. [`assets/sfx/ORIGEM.md`](./assets/sfx/ORIGEM.md) — catálogo real de sons disponíveis (evita citar arquivo inexistente).
7. [`motor/publish/GUIA_CONFIGURACAO.md`](./motor/publish/GUIA_CONFIGURACAO.md) — obrigatório quando a tarefa envolver autenticação, agendamento ou upload.
8. `videos/<slug>/STORYBOARD.md` — obrigatório quando for editar ou retomar um vídeo existente.

Só depois dessa releitura: planejar, escrever ou executar.

---

## 1. Arquitetura da Fábrica de Vídeos Atômicos

O repositório é organizado em uma estrutura modular multi-projeto:
- `motor/`: Core imutável do sistema:
  - `motor/3d/`: Runtimes Three.js procedurais e construtores de props.
  - `motor/2d/`: Motor SVG vetorial puro (`motor2d.global.js`) ultra-rápido.
  - `motor/audio/`: Pipeline de narração ElevenLabs, timestamps, ducking de SFX/BGM e masterização -14 LUFS.
  - `motor/cli/`: Orquestrador CLI multi-vídeo (`orchestrator.js`) e assistente interativo (`agent.js`).
  - `motor/publish/`: Módulo de publicação, autenticação OAuth2, agendamento de postagens e status em tempo real.
  - `motor/templates/`: Arquétipos de templates para novos vídeos.
- `assets/`: Biblioteca global compartilhada (fontes WOFF2, SFX royalty-free, Three.js).
- `canal/`: Memória viva do canal (`perfil.md`, `aprendizados.md`, `historico.md`).
- `videos/<slug>/`: **Catálogo de vídeos 100% atômicos e independentes**. Cada pasta de vídeo possui seu próprio `roteiro.json`, `index.html`, `compositions/`, `narracao/` (cache SHA-1), pasta `renders/` e `publicacao_status.json`.

---

## 2. Protocolo de Operação por Linguagem Natural (No Chat)

Quando o usuário solicitar no chat a criação ou planejamento de um vídeo:

### Cenário A: Execução Autônoma Direta
*Exemplo do usuário:* `"faça um vídeo novo sobre [tema]"`
1. **Consulta à Memória (Regra Zero):** Releia **todos os arquivos de contexto `.md`** conforme a ordem da [seção 0](#0-regra-zero--releitura-obrigatória-do-contexto) — no mínimo [`canal/perfil.md`](./canal/perfil.md), [`canal/aprendizados.md`](./canal/aprendizados.md), [`canal/historico.md`](./canal/historico.md) e [`README.md`](./README.md).
2. **Criação do Projeto Atômico:** Execute `npm run video:novo -- <slug> "[Título]"`.
3. **Roteiro e Storyboard:** Escreva o `roteiro.json` em `videos/<slug>/roteiro.json` seguindo a estrutura magnética:
   - Gancho de 2s com quebra de expectativa.
   - Ritmo de videogame *"falha → corrige"*.
   - **Variação dinâmica de conectivos (PROIBIDO repetir "Então você..."):** Use transições assertivas como *"A solução?..."*, *"Para blindar isso, entra..."*, *"No centro de tudo..."*, *"E para aguentar o peso..."*.
   - **Interpretação e Emoção Vocal (ElevenLabs):** Voz oficial **Liam** (`estabilidade: 0.38`, `similaridade: 0.80`, `estilo: 0.40`, `velocidade: 1.08`).
4. **Composição Visual (3D ou 2D):**
   - No modo 3D: modele props no Three.js procedural e posicione o mascote (`menino`).
   - No modo 2D: use o construtor SVG `motor2d.global.js` (render 2,4x mais rápido, lip-sync nativo e peso leve).
5. **Pipeline de Áudio & Auditoria:**
   - Execute `npm run video:audio -- <slug>`.
   - Execute `npm run video:check -- <slug>` (meta: **0 erros** no HyperFrames check).
   - **Auditoria de Desenvolvimento (Rápida):** Execute `npm run video:audit:fast -- <slug>` durante a montagem das cenas para feedback determinístico imediato (< 300ms, offline, valida safe-zones, iluminação e freeze).
   - **Auditoria Final (Qualidade Semântica):** Execute `npm run video:audit -- <slug>` (ou `npm run video:audit -- <slug> --reuse-snapshots` se já tiver gerado snapshots recentes):
     - Executa o crítico VLM universal ativo (**NVIDIA NIM `meta/llama-3.2-90b-vision-instruct`**).
     - Meta: **Status APROVADO** e nota **>= 8.0/10**.
     - Inspecione a prancha anotada gerada em `videos/<slug>/renders/audit/contact-sheet-anotada.jpg`.
     - Garanta que nenhum card de texto, legenda ou métrica colida com o rodapé (`y > 1540px`) ou lateral direita (`x > 940px`).
6. **Entrega e Checkpoint de Aprendizado:**
   - Apresente os snapshots e o resumo ao usuário.
   - **REGRA MANDATÓRIA DE MEMÓRIA:** Se você desenvolveu uma nova solução técnica, geometria 3D reutilizável ou ajuste de layout durante a criação, formule a proposta de aprendizado e pergunte:  
     > *"Gostaria de registrar este aprendizado em `canal/aprendizados.md`?"*  
     **NUNCA registre na memória do canal sem a aprovação explícita do usuário.**

### Cenário B: Planejamento Prévio de Roteiro
*Exemplo do usuário:* `"planeje um vídeo sobre [tema]"` ou `"proponha um roteiro para..."`
1. O agente pesquisa e apresenta a proposta de roteiro (gancho, metáfora central, fases falha->corrige e CTA).
2. Aguarda o feedback e aprovação do usuário antes de criar os arquivos de cena e sintetizar o áudio.

---

## 3. Protocolo de Operação via Terminal (CLI)

O usuário também pode operar o motor diretamente pelo terminal:

```bash
# 1. Geração Assistida por IA interativa (pergunta tema, modelo de IA e confirma aprendizado)
npm run video:ai

# 2. Criação manual de um novo projeto atômico
npm run video:novo -- meu-video "Título do Vídeo"

# 3. Processamento de áudio, ducking e legendas
npm run video:audio -- meu-video

# 4. Pré-visualização com hot-reload no navegador (HyperFrames Studio)
npm run video:dev -- meu-video

# 5. Auditoria de conformidade técnica (linter estático de código HyperFrames)
npm run video:check -- meu-video

# 6. Auditoria Visual por Visão Computacional (Tier 1 Local + Tier 2 VLM)
npm run video:audit:fast -- meu-video                   # Tier 1 determinístico ultra-rápido (offline, safe-zones, freeze, luz)
npm run video:audit -- meu-video                        # Tier 1 + Tier 2 com NVIDIA NIM (Llama 3.2 90B Vision Instruct - padrão ativo)
npm run video:audit -- meu-video --reuse-snapshots      # Reutiliza snapshots existentes (pula captura HyperFrames)
npm run video:audit -- meu-video --provider=nvidia      # Força NVIDIA NIM (meta/llama-3.2-90b-vision-instruct)
npm run video:audit -- meu-video --provider=gemini      # Alternativa: Google Gemini 2.5 Flash
npm run video:audit -- meu-video --provider=openai      # Alternativa: OpenAI GPT-4o
npm run video:audit -- meu-video --provider=ollama      # Alternativa: Ollama Local (llama3.2-vision)

# 7. Renderização do vídeo final MP4
npm run video:render -- meu-video

# 7. Listagem de todos os vídeos da fábrica
npm run video:listar

# 8. Diagnóstico de conexão em tempo real com as APIs (YouTube, TikTok, ElevenLabs)
npm run video:status
# ou
npm run auth:status

# 9. Conectar novas contas sociais
npm run auth:youtube      # Autentica canal do YouTube com OAuth2 local
npm run auth:tiktok       # Autentica perfil do TikTok com PKCE S256

# 10. Publicar vídeo MP4 nas plataformas (YouTube Shorts & TikTok)
npm run video:upload -- meu-video                       # Envio para ambos em modo Privado Seguro
npm run video:upload -- meu-video --public              # Publica como público imediatamente
npm run video:upload -- meu-video --youtube             # Publica apenas no YouTube
npm run video:upload -- meu-video --tiktok              # Publica apenas no TikTok

# 11. Agendamento Inteligente de Publicação
npm run video:upload -- meu-video --agendar "amanha 18:00"  # Agendamento em linguagem natural
npm run video:upload -- meu-video --agendar "+2h"           # Agendamento relativo (daqui a 2h)
npm run video:upload -- meu-video --agendar "sexta 19:30"   # Agendamento para o dia da semana
npm run video:upload -- meu-video --agendar "amanha 18:00" --inbox # Envia direto como rascunho pro TikTok app

# 12. Gestão da Fila de Agendamentos
npm run video:agendados                                 # Lista e executa agendamentos vencidos
npm run video:agendados -- --watch                      # Mantém serviço rodando em segundo plano
npm run video:agendados -- --cancel <id-ou-slug>        # Cancela agendamento da fila
```

---

## 4. Regras Críticas de Safe-Zone Vertical 9:16 & Auditoria Visual

Para garantir legibilidade perfeita nas plataformas de vídeo curto (TikTok, YouTube Shorts e Instagram Reels), o motor impõe zonas de segurança obrigatórias no canvas vertical `1080x1920`:

| Zona | Coordenadas Críticas | Elementos das Redes | Regra para o Agente |
| :--- | :--- | :--- | :--- |
| **Rodapé** | `y: 1540px` a `1920px` (`h: 380px`) | Nome do canal, descrição, som e legendas nativas | **PROIBIDO** posicionar cards de dados, kickers ou títulos nesta área. Legendas devem ficar acima de `y=1250px`. |
| **Topo** | `y: 0px` a `160px` (`h: 160px`) | Abas "Seguindo/Para você", busca e botão de câmera | Não use para textos essenciais. O kicker editorial pode tangenciar, mas sem encostar no topo. |
| **Lateral Direita** | `x: 940px` a `1080px`, `y: 800` a `1600px` | Coluna de curtir, comentar, salvar e compartilhar | Mantenha margem direita mínima de `140px` para elementos interativos. |

### Tolerâncias e Motores de Auditoria
- **Blackout / Falha de Iluminação:** Média de brilho `< 16` acusa tela preta ou ausência de luzes no Three.js.
- **Congelamento (Animation Freeze):** Se a diferença média entre amostras da mesma cena for `< 0.35`, o motor acusa trava de JavaScript/Timeline.
- **Crítico VLM Ativo (NVIDIA NIM):** O modelo `meta/llama-3.2-90b-vision-instruct` inspeciona a prancha `vlm-sheet.jpg` avaliando enquadramento 3D, clipping e harmonia estética com nota mínima de corte `>= 8.0/10`.
- **Auto-Cura:** O agente executa até 2 iterações automáticas para corrigir enquadramento de câmera (`camera.position.z`) e layout antes de consultar o usuário.

---

## 5. Regra de Ouro da Memória Evolutiva

> [!CAUTION]
> **APROVAÇÃO HUMANA OBRIGATÓRIA PARA A MEMÓRIA DO CANAL:**  
> O agente é incentivado a usar sua autonomia criativa para inventar novas cenas e animações. Porém, nenhum padrão técnico, regra ou conclusão pode ser gravado em [`canal/aprendizados.md`](./canal/aprendizados.md) de forma unilateral. O agente deve formular o aprendizado com clareza, sugerir o registro ao usuário e somente persistir após o comando afirmativo ("sim", "pode registrar", "aprovo").
