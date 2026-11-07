# STORYBOARD — Cabo Submarino & Nuvem Global (`cabo-submarino-v2`)

> **Subtítulo:** Engenharia Abissal em 7 Camadas  
> **Resolução:** 1080x1920 (30 FPS)  
> **Duração Total:** `39.98s`  
> **Voz & Ritmo:** ElevenLabs (`TX3LPaxmHKxFdv7VOQHJ`) acelerada em `1.17x` (~190 PPM) + Masterização `-14 LUFS` com Sidechain Ducking.

---

## Mapa de Cenas (Frames Híbridos 3D + 2D)

| # | Frame ID | Arquivo | Início | Duração | Fim | Métrica HUD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `frame-01-gancho-abismo` | `compositions/frames/01-gancho-abismo.html` | `0.00s` | `9.77s` | `9.77s` | **8.000 m** (PROFUNDIDADE ABISSAL) |
| **02** | `frame-02-camadas-internas` | `compositions/frames/02-camadas-internas.html` | `9.77s` | `9.52s` | `19.29s` | **69 µm** (DIÂMETRO DO NÚCLEO) |
| **03** | `frame-03-blindagem-aco` | `compositions/frames/03-blindagem-aco.html` | `19.29s` | `9.72s` | `29.01s` | **10.000 V** (CONDUTOR DE COBRE) |
| **04** | `frame-04-vista-explodida` | `compositions/frames/04-vista-explodida.html` | `29.01s` | `10.97s` | `39.98s` | **400 Tbps** (CAPACIDADE DE DADOS) |

---

## Detalhamento por Frame

### Frame 01 — O Abismo e a Fragilidade do Vidro (`0.00s` → `9.77s`)

- **Kicker Editorial:** `INFRAESTRUTURA GLOBAL // 99% DOS DADOS`
- **Direção 3D (Three.js):** Oceano abissal com cáusticas GLSL, núcleo de sílica pura pulsando laser ciano e mascote testando a fibra nua que se rompe.
- **Direção 2D (HyperFrames HTML/GSAP):** Header editorial EB Garamond, HUD de telemetria oceânica e alerta vermelho de falha estrutural (Tensão > Limite).
- **Áudio do Frame:** `assets/voice/frame-01.wav`
- **Narração Alinhada:**
  - **[0.12s – 4.02s | local 0.12s – 4.02s]** (gancho): *"Como um fio de *cabelo* no fundo do *oceano* carrega a *internet* do mundo inteiro?"*
  - **[4.14s – 9.43s | local 4.14s – 9.43s]** (quebra / falha): *"Se você pega um fio de *vidro* fininho como cabelo e tenta esticar, ele *racha* no primeiro passo."*

### Frame 02 — Proteção Óptica: Acrílico & Tubo Gel (`9.77s` → `19.29s`)

- **Kicker Editorial:** `CAMADAS 01–03 // NÚCLEO ÓPTICO`
- **Direção 3D (Three.js):** Mascote com capacete de engenharia acoplando o revestimento primário de acrílico e o buffer tube com 6 fibras coloridas em gel.
- **Direção 2D (HyperFrames HTML/GSAP):** Cards técnicos escalonados detalhando Camada 1 (Sílica), Camada 2 (Acrílico) e Camada 3 (Tubo Buffer + Gel Hidrofóbico).
- **Áudio do Frame:** `assets/voice/frame-02.wav`
- **Narração Alinhada:**
  - **[9.89s – 14.50s | local 0.12s – 4.73s]** (revestimento / corrige): *"A solução? Uma camada de *acrílico* flexível que abraça o fio como uma capa."*
  - **[14.62s – 18.95s | local 4.85s – 9.18s]** (tubo / corrige): *"E pra evitar atrito, vários fios vão soltos num *tubo* plástico cheio de *gel*."*

### Frame 03 — Alta Tensão & Armadura de Aço (`19.29s` → `29.01s`)

- **Kicker Editorial:** `CAMADAS 04–07 // BLINDAGEM PESADA`
- **Direção 3D (Three.js):** Montagem telescópica do tubo condutor de cobre, vedação hermética de alumínio, 18 fios de aço trançados e jaqueta PEAD.
- **Direção 2D (HyperFrames HTML/GSAP):** Medidor de tração mecânica e cards de especificação do Cobre 10kV, Barreira Hermética e Armadura de Aço.
- **Áudio do Frame:** `assets/voice/frame-03.wav`
- **Narração Alinhada:**
  - **[19.41s – 24.14s | local 0.12s – 4.85s]** (cobre / corrige): *"No centro de tudo, passa um tubo de *cobre* maciço que leva *corrente* pra cada repetidor."*
  - **[24.26s – 28.67s | local 4.97s – 9.38s]** (aco / corrige): *"Por cima, entram fios pesados de *aço* trançados que aguentam a *tração* do abismo."*

### Frame 04 — Anatomia Completa: Vista Explodida (`29.01s` → `39.98s`)

- **Kicker Editorial:** `SÍNTESE DE ENGENHARIA // 7 CAMADAS`
- **Direção 3D (Three.js):** Torre vertical em vista explodida das 7 camadas girando suavemente enquanto o mascote comemora ao lado.
- **Direção 2D (HyperFrames HTML/GSAP):** Projeção 3D->2D em tempo real ancorando 7 linhas chamadas SVG (leader lines) às etiquetas técnicas numeradas + CTA final.
- **Áudio do Frame:** `assets/voice/frame-04.wav`
- **Narração Alinhada:**
  - **[29.13s – 33.06s | local 0.12s – 4.05s]** (por_dentro): *"Por dentro, é *fibra* de vidro, *gel*, *cobre*, *alumínio* e *aço*."*
  - **[33.18s – 38.54s | local 4.17s – 9.53s]** (segue): *"Pois é… o mundo é mais *curioso* do que parece. Se você é curioso, segue o *Curiorisando*!"*

