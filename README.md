# Rumo ao Castelo

Jogo 2D de ação no navegador. Um herói com espada atravessa a floresta, enfrenta
dinossauros em arenas que só abrem quando todos são derrotados e precisa vencer o
Rei Rex para entrar no castelo. Se a vida zerar, ele cai e não chega.

## Como jogar

| Ação | Teclado | Celular/tablet |
| :--- | :--- | :--- |
| Mover | A (esquerda) e D (direita) | ◀ ▶ |
| Pular | Espaço (segure para pular mais alto) | ⤒ |
| Espada | F ou G (ou clique) | ⚔ |

Dicas: os dinossauros avisam antes do bote (param e tremem com a boca aberta). Recue ou
pule por cima e contra-ataque enquanto eles se recuperam. Frutas recuperam vida e cada
área liberada devolve +15.

## Rodar localmente

```bash
npm install
npm run serve   # http://localhost:8080
```

Adicione `?debug` na URL para ver as caixas de colisão.

## Testes

```bash
npm test                                  # regras (vida, dano, IA dos dinos, fase)
npm run smoke                             # robô joga a fase inteira no Chromium headless
node tests/smoke.mjs --strategy=spam      # robô que só ataca, sem desviar
```

O smoke test falha se houver erro no console ou se o robô "smart" não chegar ao castelo.
Capturas ficam em `tests/output/`.

## Estrutura

```
index.html              página + Phaser 4.2.1 (vendor/, build só com Arcade Physics)
src/main.js             configuração do jogo
src/rules/              regras puras, sem Phaser (testadas com node --test)
  combat.js             herói, tabela de dinossauros, dano, cura
  dinoBrain.js          máquina de estados: patrulha, persegue, aviso, bote, recuperação
  level.js              fase: arenas, plataformas, frutas, castelo
src/entities/           Hero (pulo, espada) e Dino (física + cérebro)
src/scenes/             Play, HUD (com controles de toque), Boot/Título/Fim
src/art/textures.js     toda a arte, pintada com Canvas 2D no boot (sem imagens externas)
tests/                  testes de regras e smoke test com robô
```

## Ajuste de dificuldade

Os números ficam em `src/rules/combat.js` (vida, dano, tempo de aviso de cada dino) e
`src/rules/level.js` (onde ficam arenas, inimigos e frutas). Rode `npm test` e
`npm run smoke` depois de mexer.
