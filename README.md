# O Mundo do Pepe

Jogo 2D de ação no navegador. Um herói com espada atravessa a floresta, enfrenta
dinossauros em arenas que só abrem quando todos são derrotados e precisa vencer o
Rei Rex para entrar no castelo. Se a vida zerar, ele cai e não chega.

## Fases

| Fase | Cenário | Inimigos | Chefe | Destino |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Floresta Ensolarada | Raptor, Tricerátopo | Rei Rex | Castelo Vermelho |
| 2 | Floresta Sombria (noite, névoa, vaga-lumes) | Morcego sombrio, Planta cuspidora, Raptor, Tricerátopo | Colosso de Magma | Castelo Azul |

- Ao vencer uma fase, o Pepe leva as vidas para a próxima (no mínimo 3, no máximo 9).
- Perdeu todas as vidas na Fase 2? Recomeça na Fase 2, não do início.
- Depois de vencer a Fase 1 uma vez, a tecla **2** na tela inicial leva direto para a Fase 2.
  Para testar sem vencer a Fase 1, abra o jogo com `#fase2` no fim do endereço.

**Novidades da Fase 2:**
- **Morcego sombrio** voa alto demais para a espada: pule e golpeie no ar, ou acerte quando ele mergulhar.
- **Planta cuspidora** fica parada, cospe esporos em arco e morde quem chega perto. A espada corta os esporos no ar.
- **Colosso de Magma** (chefe): o pisão solta ondas de choque pelo chão (pule por cima), a chuva de lava deixa fogo no chão, e quem fica atrás dele leva uma rabada. Ele avisa antes de cada golpe (treme e esquenta) e fica parado depois. Abaixo da metade da vida, fica furioso: mais rápido e com mais lava.

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

## Publicar no GitHub Pages

O jogo é um site estático (sem build): `index.html`, `src/` e `vendor/` na raiz.
Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
O endereço fica `https://<usuário>.github.io/<repositório>/`. O arquivo `.nojekyll`
faz o GitHub servir os arquivos como estão.

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
npm run phase2                            # transição com vidas, robô limpa a Fase 2, rabada do chefe
node tests/phase2.mjs --real              # robô sem invencibilidade (mede a dificuldade)
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
  level.js              fases 1 e 2: arenas, plataformas, frutas, castelo, ritmo
  monsterBrain.js       morcego, planta e Colosso de Magma (aviso → golpe → recuperação)
  movement.js           números do pulo e da corrida
src/entities/           Hero, Dino e Monsters (morcego, planta, Colosso, projéteis)
src/scenes/             Play, HUD (com controles de toque), Boot/Título/Fim
src/art/textures.js     arte da Fase 1, pintada com Canvas 2D no boot (sem imagens externas)
src/art/night.js        arte da Fase 2: noite, névoa, monstros, Colosso, Castelo Azul
tests/                  testes de regras e smoke test com robô
```

## Ajuste de dificuldade

Os números ficam em `src/rules/combat.js` (vida, dano, tempo de aviso de cada dino) e
`src/rules/level.js` (onde ficam arenas, inimigos e frutas). Rode `npm test` e
`npm run smoke` depois de mexer.
