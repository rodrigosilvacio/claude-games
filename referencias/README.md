# Guia: awesome-gamedev-agent-skills

Referência em português do repositório
[gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills),
usado no projeto O Mundo do Pepe. Versão de referência: commit `c6ca6c4` (release 2.0.0,
de 2026-11-11), a mesma instalada em `.claude/skills/`.

## Resumo

É um **pacote de 79 "skills" de desenvolvimento de jogos e um "router"** para agentes de IA
de programação (Claude Code, Cursor, Codex, Gemini CLI, Copilot e outros). Cada skill é um
manual curto em Markdown que o agente só lê quando o pedido combina com ele. O router
descobre a engine do projeto e escolhe as 2 ou 3 skills certas para cada pedido.

O diferencial não é ensinar a programar jogos, e sim **dar ao agente boas práticas
verificadas, armadilhas conhecidas e uma checagem final** para cada tipo de tarefa, em 12 engines.

| Número | Valor |
| :-- | :-- |
| Skills | 79 + router |
| Engines cobertas | 12 (Godot, Unity, Unreal, Ebitengine, Phaser, PixiJS, three.js, Bevy, pygame, LÖVE, Defold, Roblox) |
| Linhas nos `SKILL.md` | cerca de 15 mil |
| Arquivos de referência (aprofundamento) | 112 |
| Scripts de checagem embutidos | 17, em 11 skills |
| Prompts de teste de acerto | 366 |
| Licença | Apache-2.0 |

## Como o repositório está organizado

| Pasta / arquivo | O que tem | Onde está aqui |
| :-- | :-- | :-- |
| `skills/<categoria>/<skill>/` | As 79 skills (`SKILL.md` + `references/` + `scripts/` opcionais) | `.claude/skills/` |
| `router/` | O "despachante": detecta engine e tarefa, indica quais skills ler | `.claude/skills/router/` |
| `docs/SKILL-FORMAT.md` | O padrão de escrita de uma skill | `awesome-gamedev-agent-skills/docs/` |
| `docs/INSTALLATION.md`, `docs/COMPATIBILITY.md` | Como instalar em cada agente e onde cada um procura skills | idem |
| `docs/VERSION-SUPPORT.md` | Versões de cada engine verificadas em 2026-11-11 | idem |
| `evals/` | Teste de acerto (366 prompts) e resultados | `awesome-gamedev-agent-skills/evals/` |
| `templates/SKILL.template.md` | Modelo para escrever uma skill nova | `awesome-gamedev-agent-skills/templates/` |
| `.claude-plugin/marketplace.json` | Pacotes para instalar como plugin do Claude Code | `awesome-gamedev-agent-skills/marketplace.json` |
| `scripts/`, `tests/`, `.github/` | Validador, gerador do site, testes e CI do próprio repositório | não copiados (código do repositório de origem) |
| `CHANGELOG.md`, `CONTRIBUTING.md` | Histórico de versões e regras para contribuir | `awesome-gamedev-agent-skills/` |

## Como funciona (o modelo de "divulgação progressiva")

1. O agente carrega **só o nome e a descrição** de cada skill, como um índice. As 79
   descrições somam cerca de 30 mil caracteres, de propósito: o Claude Code reserva 1% do
   contexto para essa lista. Por isso configuramos `skillListingBudgetFraction` em
   `.claude/settings.json`.
2. Quando o pedido combina, o agente **lê o corpo** do `SKILL.md`.
3. Só se precisar de profundidade, lê os arquivos em `references/` ou roda os `scripts/`.

Cada descrição termina com **"Not for ..."**, que diz qual skill vizinha cuida do assunto
próximo. É isso que evita duas skills disputando o mesmo pedido.

## O router

Algoritmo em 7 passos:

1. **Detecta a engine** pelos arquivos (`project.godot` = Godot, `package.json` com `phaser` = Phaser etc.) e lê a versão instalada.
2. **Classifica o pedido** em disciplinas, no máximo um gênero e fluxos de trabalho.
3. **Resolve o conjunto mínimo** de skills, com regras de "quem é o dono" quando duas skills se sobrepõem.
4. **Divide o trabalho com ferramentas oficiais** (Unity, Roblox, Epic) se estiverem instaladas.
5. **Lê só as skills escolhidas.**
6. **Combina na ordem:** engine → conceito → gênero → fluxo.
7. **Plano B:** engine desconhecida ou própria; para projeto novo sem preferência, recomenda Godot.

## O catálogo (79 skills)

### Engines

**Godot 4.7 (16):** `godot-gdscript` (linguagem), `godot-nodes-scenes` (cenas e checador de
caminhos), `godot-signals-groups`, `godot-2d-movement`, `godot-tilemap`, `godot-physics`,
`godot-ui-control`, `godot-animation`, `godot-shaders`, `godot-3d-essentials`,
`godot-resources` (dados), `godot-audio`, `godot-multiplayer`, `godot-export`, `godot-csharp`,
`godot-gdscript-headless-testing` (testes no CI).

**Unity 6.3 LTS (9):** `unity-csharp-scripting`, `unity-input-system`, `unity-physics` (2D e 3D),
`unity-animation`, `unity-scriptableobjects` (dados), `unity-tilemap-2d`, `unity-navmesh`
(caminhos), `unity-build-pipeline`, `unity-build-size` (build grande demais).

**Unreal 5.8 (6):** `unreal-blueprints`, `unreal-cpp-gameplay`, `unreal-enhanced-input`,
`unreal-behavior-trees` (IA), `unreal-niagara` (efeitos), `unreal-packaging`.

**Web (6):** `phaser-core`, `phaser-arcade-physics` (**usadas no Pepe**), `pixijs-rendering`,
`threejs-scene-setup`, `threejs-gltf-loading`, `threejs-materials-lighting`.

**Outras (13):** `ebitengine-game` (Go), `bevy-ecs` (Rust), `pygame-core` (Python),
`love2d-core` (Lua), `defold-core`, e 8 de Roblox: `roblox-luau`, `roblox-datastores` (salvar),
`roblox-ui`, `roblox-networking` (anti-trapaça), `roblox-characters`, `roblox-physics`,
`roblox-studio-workflow`, `roblox-simulator-economy` (economia de simuladores).

### Disciplinas (15, valem para qualquer engine)

| Skill | Para quê |
| :-- | :-- |
| `create-game-assets` | Direção de arte, sprites, cenários, geração por IA com controle de qualidade e licenças |
| `game-ai` | Inimigos: máquina de estados, percepção, perseguição, A* |
| `ai-behavior-trees-utility-ai` | Árvores de comportamento e "utility AI" escritas à mão |
| `procedural-gen` | Geração procedural: masmorras, ruído, sementes, tabelas de saque |
| `dialogue-systems` | Diálogos ramificados (Ink, Yarn, JSON) |
| `save-systems` | Salvar e carregar, espaços de save, migração |
| `audio-design` | Mixagem, música adaptativa, variação de efeitos |
| `shader-programming` | Como funcionam efeitos (dissolver, contorno, brilho) |
| `physics-tuning` | Tremedeira, objetos atravessando paredes, passo fixo |
| `level-design` | Medidas do pulo, bloqueio por habilidade, ritmo da fase |
| `input-systems` | Ações, controle, reconfiguração de teclas |
| `game-feel` | "Suco": tremida de tela, pausa no impacto, tweens |
| `camera-systems` | Câmera que segue, zona morta, câmera em 3ª pessoa |
| `game-ui-ux` | HUD e menus: escala, áreas seguras, acessibilidade |
| `performance-optimization` | FPS baixo e travadas, medindo antes de otimizar |

### Gêneros (9)

`platformer` (**usada no Pepe**), `roguelike`, `rpg`, `fps-shooter`, `tower-defense`,
`card-game`, `visual-novel`, `survival-crafting`, `puzzle`.

### Fluxos de trabalho (5)

`prototype-fast` (protótipo em 1 hora), `game-jam`, `game-docs` (documento de design),
`itch-publish`, `steam-publish`.

## Como é feita cada skill (o padrão de qualidade)

Toda skill segue o mesmo formato (`docs/SKILL-FORMAT.md`):

- **Descrição curta (300 a 700 caracteres):** engine, tarefa, palavras que o usuário digita e "Not for ...".
- **Corpo com menos de 500 linhas:**
  - quando usar;
  - um fluxo em passos;
  - poucos exemplos corretos;
  - uma seção `## Gotchas` (sintoma → causa → solução);
  - uma **checagem final que o agente consegue rodar**;
  - `## Version notes` com data.
- **Originalidade:** tudo escrito a partir da documentação oficial de cada engine, sem copiar de outras fontes.

## Como foi testado (`evals/RESULTS.md`)

- **Acerto na escolha:** um agente viu só as descrições e escolheu skills para 366 pedidos.
  A skill certa foi escolhida em **98,7%** dos pedidos que precisavam de uma (Opus 5.5) e
  97,9% com o modelo menor (Haiku 5.5). Nos pedidos parecidos que não devem ativar a skill,
  o acerto foi de 97,5% e 96,2%, respectivamente.
- **Teste A/B** em 2 skills novas: com a skill contra sem a skill, julgado por outro agente.
  Na primeira rodada, `game-docs` perdeu as 3 tarefas; foi reescrita e, na segunda, venceu as 3.
- **Código rodado** nas engines reais em 10 das 12. Unity, Unreal e Roblox Studio não foram
  executados.
- **Limites declarados pelo próprio repositório:** os juízes são modelos, não pessoas, e cada
  resultado vem de uma única rodada.

## O que usamos no Pepe

| Skill | Contribuição |
| :-- | :-- |
| router | Escolheu as skills a cada pedido |
| phaser-core | Lógica separada das cenas (`src/rules/`), robôs de teste no navegador, HUD em cena paralela |
| phaser-arcade-physics | Plataformas móveis da Fase 3, colisores e plataformas atravessáveis |
| platformer | Números do pulo (tolerância na borda, memória do botão, queda mais pesada) |
| game-feel | Pausa no impacto e tremida de tela proporcional |
| game-ai | Aviso antes do golpe e janela de contra-ataque; atraso para o chefe se virar |
| level-design | Ritmo das fases (`beats` + `pacingProblems`) |
| create-game-assets | Direção de arte registrada e checagem por capturas de tela |

Instaladas e ainda não usadas, mas úteis para o Pepe: `audio-design` (som), `game-ui-ux`
(acessibilidade e menus), `save-systems` (salvar progresso), `itch-publish` (publicar no itch.io).

## Como atualizar

```bash
git clone --depth 1 https://github.com/gamedev-skills/awesome-gamedev-agent-skills.git /tmp/ags
```

Depois, recopie `skills/**/` e `router/` para `.claude/skills/` e a documentação para esta
pasta. Compare o `CHANGELOG.md` para saber o que mudou.

## Licença

Apache-2.0. O `LICENSE` e o `NOTICE` originais estão em `awesome-gamedev-agent-skills/` e em
`.claude/skills/`.
