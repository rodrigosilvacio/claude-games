# claude-games

Projeto de jogos construídos com Claude Code.

## Skills de game dev

As skills em `.claude/skills/` vêm de
[gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills)
(Apache-2.0, commit `c6ca6c4`, engines verificadas em 2026-11-11): 79 skills + `router`.

- Em qualquer pedido de game dev, comece pela skill `router`: ela detecta a engine pelo projeto,
  classifica a tarefa e indica as 2 ou 3 skills a carregar (engine → disciplina → gênero → workflow).
- Sem engine definida ainda, o router pergunta ou recomenda uma (§7 do `router/SKILL.md`).
- Para atualizar: clonar o repositório de origem e recopiar `skills/**/` e `router/` para `.claude/skills/`.
- Referência completa do repositório (docs, resultados dos testes, padrão de escrita, catálogo em português): `referencias/README.md` e `referencias/awesome-gamedev-agent-skills/`.

## Projeto atual: O Mundo do Pepe

- Engine: **Phaser 4.2.1** (global via `vendor/phaser-arcade-physics.min.js`, sem bundler). Skills: `phaser-core`, `phaser-arcade-physics`, `platformer`, `game-feel`.
- Regra de arquitetura: lógica em `src/rules/` (sem import de Phaser), cenas só desenham e leem input.
- Antes de commitar mudanças de jogo: `npm test`, `npm run smoke` (o robô precisa vencer), `npm run features`, `npm run phase2`, `npm run phase3` e `npm run phase4`. Neste contêiner o navegador de teste roda a ~20 FPS (sem GPU): se um teste de navegador falhar por tempo, rode de novo antes de mexer no jogo.
- Fases ficam em `LEVELS` (`src/rules/level.js`), cada uma com tema visual, arenas, `beats` de ritmo (checados por `pacingProblems`) e chefe. Vidas passam de fase com `livesForNextPhase`.
- Fase 2: inimigos novos em `src/rules/monsterBrain.js` + `src/entities/Monsters.js`; arte em `src/art/night.js`. Todo golpe tem aviso (windup) e janela de contra-ataque (recover); há teste para isso.
- O chefe da Fase 2 é o Colosso de Magma, criatura original (não usar nomes ou visual de personagens registrados).
- Fase 3: escudo na tecla S/↓ (`shieldBlocks` em `combat.js`), plataformas móveis sobre neve fofa (`gaps` no nível; cair custa `FALL_DAMAGE`, nunca uma vida), inimigos em `src/rules/iceBrain.js` + `src/entities/IceMonsters.js`, arte em `src/art/ice.js`. Final: a princesa sai do Castelo Dourado com "Parabéns, você é demais!!" (`playFinale` em `PlayScene`).
- Fase 4 (última): Cidade das Torres. História em quadros antes da fase (`story` no nível, `StoryScene`). Terremotos em `quakes` (`src/rules/cityRules.js`): aviso antes, pedras bloqueáveis, espinhos que só se pulam (`unblockable`). Moradores presos (`trapped`) = +1 vida. Dois chefes na mesma fase (`canEnterCastle` exige todos); o segundo aparece numa cena (`cutscene: 'plant'`). Titãs em `src/entities/CityStuff.js` reaproveitam o cérebro do Colosso. Final: portal com "Seja bem-vindo ao novo mundo, você é demais!".
- Chefes são sempre criaturas originais: nada de nomes ou visual de personagens registrados (ex.: Godzilla). Usina "sobrecarrega" com um clarão; sem radiação ou explosão nuclear, por ser jogo infantil.
- Público: crianças. Manter monstros fofos, quedas que não matam, avisos longos antes de cada golpe.
- Arte é procedural (Canvas 2D) em `src/art/textures.js`, seguindo a direção de arte no topo do arquivo (luz do sol à direita, contorno #2a1d24, perspectiva atmosférica). Mudanças de arte passam pela skill `create-game-assets`.
- Controles: A/D ou ←/→ movem, Espaço ou ↑ pula, F/G espada, S/↓ escudo (a partir da Fase 3).
- Vidas: começa com 3, maçã = +1 vida (máx. 9); ao cair renasce na entrada da arena.
