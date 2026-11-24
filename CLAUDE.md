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
