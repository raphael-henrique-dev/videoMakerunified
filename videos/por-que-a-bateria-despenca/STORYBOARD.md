# STORYBOARD — Por Que a Bateria Despenca de 20% Para Zero? (`por-que-a-bateria-despenca`)

> **Subtítulo:** Você precisa pedir um carro na rua, a barra marca vinte por cento e o celular apaga na sua cara: o que acontece lá dentro  
> **Resolução:** 1080x1920 (30 FPS)  
> **Duração Total:** `105.29s`  
> **Voz & Ritmo:** ElevenLabs (`TX3LPaxmHKxFdv7VOQHJ`) acelerada em `1x` (~190 PPM) + Masterização `-14 LUFS` com Sidechain Ducking.

---

## Mapa de Cenas (Frames Híbridos 3D + 2D)

| # | Frame ID | Arquivo | Início | Duração | Fim | Métrica HUD |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `frame-01-apaga-na-rua` | `compositions/frames/01-apaga-na-rua.html` | `0.00s` | `17.95s` | `17.95s` | **20% → 0%** (BATERIA) |
| **02** | `frame-02-estante-de-gavetas` | `compositions/frames/02-estante-de-gavetas.html` | `17.95s` | `17.86s` | `35.81s` | **GAVETAS QUÍMICAS** (ESTRUTURA) |
| **03** | `frame-03-veneno-do-calor` | `compositions/frames/03-veneno-do-calor.html` | `35.81s` | `16.61s` | `52.42s` | **45°C DEFORMA TUDO** (TEMPERATURA) |
| **04** | `frame-04-ferrugem-interna` | `compositions/frames/04-ferrugem-interna.html` | `52.42s` | `16.99s` | `69.41s` | **ESPAÇO PERDIDO** (DESGASTE) |
| **05** | `frame-05-queda-de-pressao` | `compositions/frames/05-queda-de-pressao.html` | `69.41s` | `17.81s` | `87.22s` | **DESPENCA EM 1s** (VOLTAGEM) |
| **06** | `frame-06-raio-x-bateria` | `compositions/frames/06-raio-x-bateria.html` | `87.22s` | `18.07s` | `105.29s` | **VIDA LONGA** (CURIORISANDO) |

---

## Detalhamento por Frame

### Frame 01 — O Susto dos 20% na Rua (`0.00s` → `17.95s`)

- **Kicker Editorial:** `NOSSO DIA A DIA // O APAGÃO NA RUA`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Mascote na rua desesperado olhando a barra de 20% no smartphone piscar vermelho e apagar enquanto tenta pedir um carro.
- **Áudio do Frame:** `assets/voice/frame-01.wav`
- **Narração Alinhada:**
  - **[0.12s – 8.61s | local 0.12s – 8.61s]** (M / gancho_rua): *"Você está no meio da rua precisando chamar uma corrida, olha a tela marcando vinte por *cento* e, bem na hora de confirmar, o celular apaga na sua *cara!*"*
  - **[8.73s – 17.36s | local 8.73s – 17.36s]** (PA / ralo_energia): *"Dá uma raiva danada: de cem até cinquenta ele demora o dia todo, mas dos vinte para baixo parece que a energia escorre por um *ralo!*"*

### Frame 02 — A Estante de Gavetas Invisíveis (`17.95s` → `35.81s`)

- **Kicker Editorial:** `COMO FUNCIONA // NÃO É UM BALDE`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Diagrama em corte da bateria mostrando partículas de energia subindo para o andar de cima na carga e descendo no uso.
- **Áudio do Frame:** `assets/voice/frame-02.wav`
- **Narração Alinhada:**
  - **[18.07s – 25.77s | local 0.12s – 7.82s]** (PA / estante_gavetas): *"A primeira surpresa é que a bateria não é um balde de *energia:* ela funciona igualzinho a uma estante cheia de *gavetas!*"*
  - **[25.89s – 35.22s | local 7.94s – 17.27s]** (M / subir_descer): *"Quando você coloca na tomada, empurra milhares de pecinhas invisíveis para o andar de *cima;* conforme você usa o celular, elas vão escorregando de *volta.*"*

### Frame 03 — O Veneno do Calor e da Capinha (`35.81s` → `52.42s`)

- **Kicker Editorial:** `ERRO REAL // CAPA E TRAVESSEIRO`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Celular esquentando com ondas de calor sob a capa e travesseiro, mostrando as gavetas internas entortando e bloqueando pecinhas.
- **Áudio do Frame:** `assets/voice/frame-03.wav`
- **Narração Alinhada:**
  - **[35.93s – 42.94s | local 0.12s – 7.13s]** (PG / capa_travesseiro): *"Só que o grande veneno do aparelho tem nome e sobrenome: o *calor* da capa grossa e do travesseiro enquanto ele *carrega.*"*
  - **[43.06s – 51.83s | local 7.25s – 16.02s]** (PA / gavetas_tortas): *"A quentura entorta essas gavetas por dentro, e toda pecinha que fica presa no caminho é energia que você nunca mais vai conseguir *usar!*"*

### Frame 04 — A Ferrugem Que Rouba Espaço (`52.42s` → `69.41s`)

- **Kicker Editorial:** `O FALSO VÍCIO // CRISTAIS DE LÍTIO`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Fundo da bateria acumulando pontas afiadas e entulho que reduzem o espaço útil igual uma mochila enchendo de lixo.
- **Áudio do Frame:** `assets/voice/frame-04.wav`
- **Narração Alinhada:**
  - **[52.54s – 60.34s | local 0.12s – 7.92s]** (M / pontas_afiadas): *"Com o passar dos meses, essa sujeira acumulada cria pontas afiadas lá no *fundo,* como se fosse uma ferrugem que entope a *estrada.*"*
  - **[60.46s – 68.82s | local 8.04s – 16.40s]** (PA / mochila_velha): *"Aí a bateria não vicia de verdade: ela simplesmente perde o *espaço,* como uma mochila velha que vai enchendo de entulho no *fundo!*"*

### Frame 05 — Por Que Apaga de Repente nos 20% (`69.41s` → `87.22s`)

- **Kicker Editorial:** `A MENTIRA DA BARRA // MEDIR PRESSÃO`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Manômetro e curva de voltagem despencando ao abrir a câmera em 20%, com o chip desligando o aparelho em pânico para proteção.
- **Áudio do Frame:** `assets/voice/frame-05.wav`
- **Narração Alinhada:**
  - **[69.53s – 77.33s | local 0.12s – 7.92s]** (PG / medir_pressao): *"E sabe por que ele desliga de repente nos vinte por cento? Porque o celular não conta energia de verdade, ele só mede a *pressão!*"*
  - **[77.44s – 86.64s | local 8.03s – 17.23s]** (PA / abrir_camera): *"Quando a bateria já está cansada e você abre a câmera ou um mapa pesado, a força despenca de uma *vez* e o aparelho se desliga para não queimar a *placa.*"*

### Frame 06 — Por Fora e Por Dentro da Bateria (`87.22s` → `105.29s`)

- **Kicker Editorial:** `RAIO-X COMPLETO // HÁBITOS DE OURO`
- **Direção 3D (Three.js):** -
- **Direção 2D (HyperFrames HTML/GSAP):** Torre de 7 camadas de cuidados (não ferver, tirar da capa, 20-80%, carregador confiável) + comemoração do mascote e CTA do Curiorisando.
- **Áudio do Frame:** `assets/voice/frame-06.wav`
- **Narração Alinhada:**
  - **[87.34s – 97.00s | local 0.12s – 9.78s]** (PA / por_fora_por_dentro_bateria): *"Por fora, parece só uma barrinha verde que te deixou na mão na *calçada;* por dentro, é uma usina química lutando contra o calor e o *desgaste!*"*
  - **[97.12s – 104.50s | local 9.90s – 17.28s]** (M / fechamento_curiorisando): *"Pois é, o mundo é mais *curioso* do que parece! Se a sua bateria também já te deixou na mão, segue o *Curiorisando!*"*

