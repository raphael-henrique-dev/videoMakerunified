# Aprendizados — Formato 16:9

> Este arquivo herda de `aprendizados-curto.md` as regras técnicas HyperFrames (§2), áudio (§3), roteiro (§4), voz (§5), lições 2D (§7, §8, §9, §14, §15, §16), auditoria (§10) e publicação (§12, §13).

## 1. Formato 16:9

## 2. Capítulos e ritmo
- **Duração padrão de 10 minutos (`duracaoAlvoMin`):** o agente sempre pergunta a duração antes de começar a produção do vídeo horizontal; sem resposta, vale 10 min (~1.860 palavras de narração).

## 3. Cenas data-driven

## 4. Áudio longo

## 5. Render e desempenho
- **Medição de referência (sandbox de 8 GB):** um vídeo horizontal de ~45 s, 1920x1080 a 30 fps, renderizou em ~71 s.
- **Modo de baixa memória automático:** com ~8 GB de RAM o HyperFrames ativa o perfil de baixa memória sozinho (captura por screenshot) e ignora `--workers`; o ganho de paralelismo só aparece em máquinas com mais memória.

## 6. Publicação longa
