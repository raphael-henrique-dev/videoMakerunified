# Perfil do Canal — Engenharia Invisível (Motor 2.0)

## Identidade e Propósito
Explicamos a engenharia oculta que sustenta o mundo moderno (cabos submarinos, satélites, data centers, usinas, protocolos físicos) combinando **mundos 3D estilizados com física viva** e **infografia editorial 2D de alta precisão**.

## Mascote Oficial (`menino`)
- **Visual:** Menino curioso de cabelo castanho com topete, olhos expressivos com íris e brilho, moletom azul (`#1e78d6`) com capuz e bolso canguru, calça jeans escura (`#26334d`), tênis vermelho com sola branca e mochila amarela (`#e6951e`).
- **Papel Narrativo:** Ele testa hipóteses na prática (tenta usar um componente cru, falha, reage com expressão facial/corporal e aplica a solução de engenharia).

## Roteiro e Tom de Voz ("100% Vida Real")
- **Identificação Imediata:** Relacione qualquer tema técnico ao que o público vive na prática (ventilador que não dá conta do calor, a conta de luz subindo, o preço da comida na feira, o trânsito da cidade, o asfalto sem árvore virando rio).
- **Zero Jargão Acadêmico:** Nunca use fórmulas ou termos frios distantes sem antes traduzir em analogias do cotidiano (ex: em vez de falar em termodinâmica atmosférica, fale da *"toalha gigante molhada que é torcida de uma vez no seu bairro"*).
- **Fechamento Curiorisando:** *"Por fora, é só... Por dentro, é... Pois é, o mundo é mais curioso do que parece! Se você é curioso, segue o Curiorisando!"*

## Sistema de Design Híbrido (3D + Code Editorial 2D)
- **Resolução Padrão:** `1080x1920` (9:16 vertical, 30 FPS).
- **Tipografia:**
  - Display / Títulos: `EB Garamond` (700/400, itálico para ênfase editorial).
  - UI / Telemetria / Legendas: `Inter` (700/600/400, números tabulares `tabular-nums`).
- **Paleta Cromática:**
  - Fundo Abissal / Noite Técnica: `#050a14` a `#0c192c`
  - Ciano Laser / Dados / Fibra Óptica: `#38bdf8` / `#00f0ff`
  - Âmbar Engenharia / Cobre / Alerta: `#f59e0b` / `#fb923c`
  - Verde Validação / Sucesso: `#22c55e`
  - Vermelho Falha / Tensão Crítica: `#ef4444`
  - Superfície HUD Editorial: `rgba(8, 14, 26, 0.84)` com borda `1px solid rgba(56, 189, 248, 0.28)`

## Padrão de Áudio
- **Voz Principal Oficial:** **Liam** (`TX3LPaxmHKxFdv7VOQHJ` — ElevenLabs `eleven_multilingual_v2`), voz jovem, dinâmica e conversada (`estabilidade: 0.38`, `similaridade: 0.80`, `estilo: 0.40`, `velocidade: 1.08`, `acelerar: 1.0` sem distorção `atempo`).
- **Mixagem:** Trilha de fundo e ambiência com *sidechain ducking* sob a voz + normalização final em `-14 LUFS` (`TP = -1.5 dB`).

## Stack de Auditoria Visual & Qualidade
- **Auditoria Determinística Local (Tier 1):** Validação matemática instantânea (~25ms/frame) de Safe-Zones 9:16 (topo `0-160px`, rodapé `1540-1920px`, lateral direita `940-1080px`), contraste WCAG AA (≥ 4.5:1), ausência de blackout e detecção de freeze de animação.
- **Crítico Multimodal Universal (Tier 2):** **NVIDIA NIM** com o modelo `meta/llama-3.2-90b-vision-instruct` como crítico de inteligência visual padrão, avaliando enquadramento 3D, clipping e harmonia visual com nota mínima de aprovação `>= 8.0/10`.
- **Auto-Cura (Self-Healing):** Ciclo autônomo de até 2 iterações para correção automática de layout e câmera antes de solicitar intervenção humana.

---

## Canais e Plataformas Conectadas
- **YouTube Shorts:** `@ocuriorisando` (Nome: **Curiorisando**, ID: `UCSZb2xYEYvNJRNs2caiyLQg`). Upload automatizado de Shorts via Google YouTube Data API v3 com agendamento nativo na nuvem.
- **TikTok:** **Curiorisando** (OpenID: `-000Xy9Ilz5B5-UT9FJGa0U-LyRsQUB7bHYo`). Upload automatizado via TikTok Content Posting API v2 com PKCE S256 e modos Direct Post e Inbox (Rascunhos).
- **Diagnóstico em Tempo Real:** Verificável a qualquer momento via `npm run video:status` ou `npm run auth:status`.

## Formatos
- **Curto:** 1080x1920, safe-zones de aplicativos e legendas acima do rodapé.
- **Horizontal:** 1920x1080, margens de TV de aproximadamente 10% para títulos e 5% para ação, sem zonas de interface e legenda centralizada na parte inferior.
