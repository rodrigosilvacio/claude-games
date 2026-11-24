# O Mundo do Pepe

Jogo 2D de ação no navegador. Um herói com espada atravessa a floresta, enfrenta
dinossauros em arenas que só abrem quando todos são derrotados e precisa vencer o
Rei Rex para entrar no castelo. Se a vida zerar, ele cai e não chega.

## Como jogar

| Ação | Teclado | Celular/tablet |
| :--- | :--- | :--- |
| Mover | A / D ou ← → | ◀ ▶ |
| Pular | Espaço ou ↑ (segure para pular mais alto) | ⤒ |
| Espada | F ou G (ou clique) | ⚔ |

Dicas: os dinossauros avisam antes do bote (param e tremem com a boca aberta). Recue ou
pule por cima e contra-ataque enquanto eles se recuperam.

**Vidas:** o herói começa com 3. Cada maçã vale **+1 vida**, até 9. São 9 maçãs, 5 delas ao
redor do Rei Rex; as plataformas na arena dele são refúgios, porque o bote do Rex passa por baixo.
Ao cair, perde uma vida e renasce na entrada da área onde estava, com energia cheia; os dinos
dali voltam a patrulhar, mas continuam feridos. Sem vidas, é fim de jogo. Cada área liberada
devolve +15 de energia.

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
npm run features                          # setas, maçã = +1 vida, renascer após cair
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
