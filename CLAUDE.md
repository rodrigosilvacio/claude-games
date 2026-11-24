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

## Projeto atual: O Mundo do Pepe

- Engine: **Phaser 4.2.1** (global via `vendor/phaser-arcade-physics.min.js`, sem bundler). Skills: `phaser-core`, `phaser-arcade-physics`, `platformer`, `game-feel`.
- Regra de arquitetura: lógica em `src/rules/` (sem import de Phaser), cenas só desenham e leem input.
- Antes de commitar mudanças de jogo: `npm test`, `npm run smoke` (o robô precisa vencer) e `npm run features`.
- Arte é procedural (Canvas 2D) em `src/art/textures.js`, seguindo a direção de arte no topo do arquivo (luz do sol à direita, contorno #2a1d24, perspectiva atmosférica). Mudanças de arte passam pela skill `create-game-assets`.
- Controles: A/D ou ←/→ movem, Espaço ou ↑ pula, F/G espada.
- Vidas: começa com 3, maçã = +1 vida (máx. 9); ao cair renasce na entrada da arena.
