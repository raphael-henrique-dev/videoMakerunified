# STORYBOARD — Como Construir um Bunker à Prova de Tudo? (`bunker-a-prova-de-tudo`)

> **Subtítulo:** A engenharia real por trás de uma casa enterrada: concreto armado, blindagem contra água, ar pressurizado e 90 dias de autonomia  
> **Resolução:** 1080x1920 (30 FPS)  
> **Duração Total:** `110.46s`  
> **Voz & Ritmo:** ElevenLabs (`TX3LPaxmHKxFdv7VOQHJ`) acelerada em `1x` (~190 PPM) + Masterização `-14 LUFS` com Sidechain Ducking.

---

## Mapa de Cenas (Frames Híbridos 3D + 2D)

| # | Frame ID | Arquivo | Início | Duração | Fim | Métrica HUD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `frame-01-porao-comum` | `compositions/frames/01-porao-comum.html` | `0.00s` | `13.27s` | `13.27s` | **0 DIAS** (AUTONOMIA DO PORÃO) |
| **02** | `frame-02-casca-concreto` | `compositions/frames/02-casca-concreto.html` | `13.27s` | `15.96s` | `29.23s` | **4,5 BAR** (PRESSÃO DA TERRA) |
| **03** | `frame-03-agua-freatico` | `compositions/frames/03-agua-freatico.html` | `29.23s` | `18.46s` | `47.69s` | **0 LITROS** (ÁGUA INFILTRADA) |
| **04** | `frame-04-ar-pressao` | `compositions/frames/04-ar-pressao.html` | `47.69s` | `18.55s` | `66.24s` | **+50 Pa** (PRESSÃO INTERNA) |
| **05** | `frame-05-autonomia` | `compositions/frames/05-autonomia.html` | `66.24s` | `18.64s` | `84.88s` | **90 DIAS** (AUTONOMIA TOTAL) |
| **06** | `frame-06-limite` | `compositions/frames/06-limite.html` | `84.88s` | `25.58s` | `110.46s` | **90 DIAS** (DIAS TRANCADO) |

---

## Detalhamento por Frame

### Frame 01 — O Porão Comum Não Salva (`0.00s` → `13.27s`)

- **Kicker Editorial:** `PROJETO BUNKER // O TESTE`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Corte de uma casa com porão alagado, água subindo, calor entrando pelas frestas e medidor de CO2 estourando no vermelho. O porão comum vira uma armadilha.
- **Áudio do Frame:** `assets/voice/frame-01.wav`
- **Narração Alinhada:**
  - **[0.12s – 5.32s | local 0.12s – 5.32s]** (PA / gancho_cidade): *"E se a cidade lá fora virasse um lugar *impossível* de viver... por trinta *dias?*"*
  - **[5.44s – 12.63s | local 5.44s – 12.63s]** (M / porao_falha): *"Um porão comum não resolve: a água *entra,* o ar *acaba,* e o calor te *cozinha* em horas."*

### Frame 02 — A Casca de Concreto Armado (`13.27s` → `29.23s`)

- **Kicker Editorial:** `CAMADA 01 // A CASCA`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Corte do solo com o bunker enterrado, setas de pressão empurrando as paredes, malha de vergalhões dentro do concreto e o comparativo entre tijolo rachado e casca armada intacta.
- **Áudio do Frame:** `assets/voice/frame-02.wav`
- **Narração Alinhada:**
  - **[13.39s – 19.51s | local 0.12s – 6.24s]** (M / enterrar_fundo): *"O primeiro passo é *enterrar* o bunker bem fundo — é a terra que segura a radiação e o *calor.*"*
  - **[19.63s – 28.64s | local 6.36s – 15.37s]** (PA / concreto_aco): *"A solução? Uma casca de *concreto armado,* com vergalhões de aço por dentro. Porque concreto sozinho *racha,* e a terra empurra a parede pra *dentro.*"*

### Frame 03 — O Inimigo Que Não Faz Barulho (`29.23s` → `47.69s`)

- **Kicker Editorial:** `CAMADA 02 // A ÁGUA`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Lençol freático subindo até a parede do bunker, manta impermeável brilhando, colchão de brita drenando e bomba de sump tirando a água do poço.
- **Áudio do Frame:** `assets/voice/frame-03.wav`
- **Narração Alinhada:**
  - **[29.35s – 37.80s | local 0.12s – 8.57s]** (PA / lencol_freatico): *"Só que lá embaixo tem um inimigo *silencioso:* o lençol freático. Ele sobe e transforma o seu bunker numa *piscina.*"*
  - **[37.92s – 47.10s | local 8.69s – 17.87s]** (M / drenagem_bomba): *"Para blindar isso, entra uma *manta* impermeável por fora, um colchão de *brita* que puxa a água, e uma bomba que tira o que sobra — *sem parar.*"*

### Frame 04 — O Ar É o Primeiro a Acabar (`47.69s` → `66.24s`)

- **Kicker Editorial:** `CAMADA 03 // O AR`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Tomada de ar externa sugando fumaça, pilha de filtros (pré-filtro, HEPA e carvão ativado), ventilador empurrando ar limpo e o bunker sob pressão positiva com o CO2 caindo.
- **Áudio do Frame:** `assets/voice/frame-04.wav`
- **Narração Alinhada:**
  - **[47.81s – 54.31s | local 0.12s – 6.62s]** (PA / co2_sobe): *"Agora o pior: sem ar novo, você aguenta *minutos.* E o seu próprio CO2 te derruba em poucas *horas.*"*
  - **[54.43s – 65.65s | local 6.74s – 17.96s]** (M / filtro_pressao): *"A resposta? Um filtro de *carvão ativado* com HEPA, empurrando ar pra dentro e mantendo o bunker *pressurizado.* Assim, o veneno de fora não entra nem pela *fresta.*"*

### Frame 05 — 90 Dias de Autonomia (`66.24s` → `84.88s`)

- **Kicker Editorial:** `CAMADA 04 // OS SISTEMAS`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Sala de máquinas em quatro quadrantes: gerador a diesel, banco de baterias, tanques de água com filtragem e prateleiras de comida seca com sementes, sob um calendário de 90 dias.
- **Áudio do Frame:** `assets/voice/frame-05.wav`
- **Narração Alinhada:**
  - **[66.36s – 75.73s | local 0.12s – 9.49s]** (M / energia_gerador): *"Sem *energia,* a bomba para, o filtro para, e a luz acaba. Por isso entra um gerador a *diesel* lá fora, com baterias de reserva aqui *dentro.*"*
  - **[75.85s – 84.30s | local 9.61s – 18.05s]** (PA / estoque_90_dias): *"E para aguentar *noventa dias* trancado, você estoca água filtrada, comida seca e *sementes.* Porque o bunker não te salva de *ficar* lá dentro."*

### Frame 06 — O Detalhe Que Nenhum Concreto Resolve (`84.88s` → `110.46s`)

- **Kicker Editorial:** `RAIO-X FINAL // O LIMITE`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Porta de aço blindada numa encosta com grama por cima, corte interno mostrando as salas do bunker, linha do tempo do dia 1 ao dia 90 e o selo final do Curiorisando.
- **Áudio do Frame:** `assets/voice/frame-06.wav`
- **Narração Alinhada:**
  - **[85.00s – 95.91s | local 0.12s – 11.03s]** (PA / tempo_convivencia): *"Mas tem um detalhe que nenhum concreto resolve: o *tempo.* Noventa dias de silêncio, e o maior risco lá dentro não é a *bomba* — é o tédio e a *convivência.*"*
  - **[96.03s – 109.12s | local 11.15s – 24.24s]** (M / fechamento_curiorisando): *"Por fora, é só uma porta de *aço* no meio do mato. Por dentro, é uma casa que precisa de *gente* pra funcionar. Pois é, o mundo é mais *curioso* do que parece! Se você é curioso, segue o *Curiorisando!*"*

