// Definição das fases. Módulo puro.
// Encontros funcionam como "arenas": ao entrar, cercas fecham o caminho
// e só abrem quando todos os inimigos daquela área forem derrotados.

export const GROUND_Y = 470; // topo do chão (px)
export const START_LIVES = 3;
export const MAX_LIVES = 9;

// ------------------------------------------------------------------ Fase 1

export const LEVEL = {
  id: 1,
  name: 'Floresta Ensolarada',
  theme: 'day',
  worldWidth: 7600,
  castleGateX: 7180,
  heroStartX: 140,
  boss: { name: 'Rei Rex', intro: 'O Rei Rex guarda o portão!' },
  enemyWord: 'dinossauros',
  encounters: [
    { id: 'clareira', name: 'Clareira', x0: 900, x1: 1700, spawns: [{ type: 'raptor', x: 1450 }] },
    {
      id: 'riacho',
      name: 'Beira do riacho',
      x0: 2100,
      x1: 3000,
      spawns: [
        { type: 'raptor', x: 2650 },
        { type: 'raptor', x: 2850 },
      ],
    },
    { id: 'bosque', name: 'Bosque antigo', x0: 3500, x1: 4400, spawns: [{ type: 'trike', x: 4150 }] },
    {
      id: 'ravina',
      name: 'Ravina',
      x0: 4900,
      x1: 5900,
      spawns: [
        { type: 'raptor', x: 5450 },
        { type: 'trike', x: 5700 },
        { type: 'raptor', x: 5750 },
      ],
    },
    { id: 'portao', name: 'Portão do castelo', x0: 6300, x1: 7120, spawns: [{ type: 'rex', x: 6900 }], boss: true },
  ],
  // Plataformas de pedra: x, y (topo), largura
  ledges: [
    { x: 560, y: 380, w: 160 },
    { x: 1950, y: 370, w: 140 },
    { x: 3250, y: 360, w: 180 },
    { x: 4650, y: 375, w: 150 },
    { x: 6100, y: 365, w: 170 },
    { x: 6420, y: 360, w: 150 },
    // refúgios na arena do chefe: o bote do Rex passa por baixo
    { x: 6720, y: 365, w: 140 },
    { x: 6960, y: 360, w: 140 },
  ],
  // Maçãs: cada uma vale +1 vida
  pickups: [
    { x: 640, y: 340 },
    { x: 2020, y: 330 },
    { x: 3340, y: 320 },
    { x: 4725, y: 335 },
    { x: 6185, y: 325 },
    { x: 6495, y: 320 },
    // reforço para o chefe
    { x: 6360, y: 440 }, // no chão, logo na entrada da arena
    { x: 6790, y: 325 },
    { x: 7030, y: 320 },
  ],
};

// ------------------------------------------------------------------ Fase 2
// Floresta Sombria: anoitecer, névoa e vaga-lumes. Introduz dois verbos novos:
// golpear no ar (morcegos) e cortar projéteis (esporos da planta). Cada inimigo
// novo aparece primeiro sozinho, onde errar custa pouco, e depois misturado.

export const LEVEL_2 = {
  id: 2,
  name: 'Floresta Sombria',
  theme: 'night',
  worldWidth: 8700,
  castleGateX: 8280,
  heroStartX: 140,
  boss: { name: 'Colosso de Magma', intro: 'O Colosso de Magma desperta!' },
  enemyWord: 'monstros',
  encounters: [
    { id: 'trilha', name: 'Trilha escura', x0: 700, x1: 1500, spawns: [{ type: 'bat', x: 1250 }] },
    {
      id: 'brejo',
      name: 'Brejo',
      x0: 1900,
      x1: 2800,
      spawns: [
        { type: 'plant', x: 2400 },
        { type: 'raptor', x: 2650 },
      ],
    },
    {
      id: 'ninho',
      name: 'Ninho dos morcegos',
      x0: 3400,
      x1: 4300,
      spawns: [
        { type: 'bat', x: 3800 },
        { type: 'bat', x: 4050 },
        { type: 'raptor', x: 4100 },
      ],
    },
    {
      id: 'raizes',
      name: 'Raízes antigas',
      x0: 4700,
      x1: 5700,
      spawns: [
        { type: 'plant', x: 5150 },
        { type: 'trike', x: 5350 },
        { type: 'bat', x: 5450 },
      ],
    },
    {
      id: 'covil',
      name: 'Covil',
      x0: 5900,
      x1: 6650,
      spawns: [
        { type: 'raptor', x: 6250 },
        { type: 'plant', x: 6500 },
        { type: 'raptor', x: 6400 },
      ],
    },
    { id: 'cratera', name: 'Cratera', x0: 7050, x1: 8220, spawns: [{ type: 'kaiju', x: 7850 }], boss: true },
  ],
  ledges: [
    { x: 420, y: 380, w: 150 },
    { x: 1020, y: 360, w: 140 }, // trampolim para golpear o morcego no ar
    { x: 2100, y: 370, w: 140 },
    { x: 2950, y: 365, w: 160 }, // bosque das frutas (descanso)
    { x: 3180, y: 355, w: 140 },
    { x: 4500, y: 370, w: 140 },
    { x: 6720, y: 370, w: 150 }, // descanso antes do chefe
    // refúgios na cratera: as ondas de choque correm pelo chão
    { x: 7230, y: 360, w: 150 },
    { x: 8020, y: 360, w: 150 },
  ],
  pickups: [
    { x: 495, y: 340 },
    { x: 2170, y: 330 },
    { x: 3030, y: 325 },
    { x: 3250, y: 315 },
    { x: 4570, y: 330 },
    { x: 6795, y: 330 },
    { x: 6920, y: 440 }, // no chão, antes da cratera
    // reforço para o chefe
    { x: 7120, y: 440 },
    { x: 7305, y: 320 },
    { x: 8095, y: 320 },
  ],
  // Ritmo planejado (skill level-design): intensidade 0..1, descanso antes do clímax.
  beats: [
    { room: 'trilha', type: 'teach', intensity: 0.2 },
    { room: 'brejo', type: 'teach', intensity: 0.45 },
    { room: 'bosque-das-frutas', type: 'rest', intensity: 0.1 },
    { room: 'ninho', type: 'combat', intensity: 0.6 },
    { room: 'raizes', type: 'combat', intensity: 0.8 },
    { room: 'covil', type: 'combat', intensity: 0.75 },
    { room: 'clareira-da-lua', type: 'rest', intensity: 0.15 },
    { room: 'cratera', type: 'climax', intensity: 1 },
  ],
};

// ------------------------------------------------------------------ Fase 3
// Picos de Cristal: neve ao amanhecer. Habilidade nova: o escudo (tecla S), encontrado
// num baú logo no começo. Plataformas móveis atravessam buracos de neve fofa: quem cai
// perde um pouco de energia e volta para a borda, sem perder vida (justo para crianças).
// Fase final: ao vencer a Serpente de Cristal, a princesa sai do Castelo Dourado.

export const FALL_DAMAGE = 10;

export const LEVEL_3 = {
  id: 3,
  name: 'Picos de Cristal',
  theme: 'ice',
  worldWidth: 9300,
  castleGateX: 8800,
  heroStartX: 140,
  boss: { name: 'Serpente de Cristal', intro: 'A Serpente de Cristal protege o lago!' },
  enemyWord: 'monstros',
  chest: { x: 480 }, // escudo
  finale: { message: 'Parabéns, você é demais!!' },
  encounters: [
    { id: 'trilha-nevada', name: 'Trilha nevada', x0: 800, x1: 1600, spawns: [{ type: 'yeti', x: 1300 }] },
    { id: 'cachoeira', name: 'Cachoeira congelada', x0: 2000, x1: 2800, spawns: [{ type: 'penguin', x: 2550 }] },
    {
      id: 'ponte',
      name: 'Ponte de gelo',
      x0: 3900,
      x1: 4950,
      spawns: [
        { type: 'ptero', x: 4200 },
        { type: 'yeti', x: 4780 },
      ],
    },
    {
      id: 'caverna',
      name: 'Caverna de cristal',
      x0: 5300,
      x1: 6400,
      spawns: [
        { type: 'raptorSnow', x: 5650 },
        { type: 'ptero', x: 5850 },
        { type: 'penguin', x: 6050 },
        { type: 'yeti', x: 6280 },
      ],
    },
    {
      id: 'lago',
      name: 'Lago congelado',
      x0: 7050,
      x1: 8550,
      spawns: [{ type: 'serpent', x: 7800 }],
      holes: [7350, 7800, 8250],
      boss: true,
    },
  ],
  // buracos de neve fofa, cada um com uma plataforma de gelo que vai e volta devagar
  gaps: [
    { x0: 3450, x1: 3690, platform: { w: 110, speed: 70 } }, // ensina, sem inimigos
    { x0: 4300, x1: 4540, platform: { w: 110, speed: 70 } }, // dentro da Ponte de gelo
  ],
  ledges: [
    { x: 600, y: 380, w: 150 },
    { x: 2950, y: 370, w: 150 }, // gruta das frutas (descanso)
    { x: 3150, y: 360, w: 140 },
    { x: 6500, y: 370, w: 150 }, // mirante (descanso antes do chefe)
    { x: 6720, y: 360, w: 140 },
    { x: 7500, y: 360, w: 140 }, // refúgios no lago: o bote da Serpente passa por baixo
    { x: 8030, y: 360, w: 140 },
  ],
  pickups: [
    { x: 675, y: 340 },
    { x: 3025, y: 330 },
    { x: 3220, y: 320 },
    { x: 6575, y: 330 },
    { x: 6790, y: 320 },
    { x: 6930, y: 440 },
    // reforço para o chefe
    { x: 7120, y: 440 },
    { x: 7570, y: 320 },
    { x: 8100, y: 320 },
  ],
  beats: [
    { room: 'trilha-nevada', type: 'teach', intensity: 0.2 }, // escudo contra bolas de neve
    { room: 'cachoeira', type: 'teach', intensity: 0.4 }, // pular o pinguim
    { room: 'gruta-das-frutas', type: 'rest', intensity: 0.1 },
    { room: 'ponte', type: 'combat', intensity: 0.6 },
    { room: 'caverna', type: 'combat', intensity: 0.75 },
    { room: 'mirante', type: 'rest', intensity: 0.15 },
    { room: 'lago', type: 'climax', intensity: 1 },
  ],
};

// ------------------------------------------------------------------ Fase 4
// Cidade das Torres: os terremotos vêm de um titã que acordou embaixo da cidade.
// Terremoto não tira vidas de surpresa: avisa antes (tremor leve + alerta), as pedras
// marcam o chão onde vão cair (proteja a cabeça com o escudo) e os espinhos rachando
// o chão brilham antes de sair (pule). Moradores presos nos escombros: libertar = +1 vida.

export const LEVEL_4 = {
  id: 4,
  name: 'Cidade das Torres',
  theme: 'city',
  worldWidth: 8600,
  castleGateX: 8050, // aqui é o portal
  heroStartX: 140,
  startWithShield: true,
  boss: { name: 'Titã de Plasma', intro: 'O Titã de Plasma saiu da usina!' },
  enemyWord: 'titãs',
  story: [
    { art: 'castle3', text: 'A princesa agradeceu o Pepe. Mas, de repente... o chão tremeu!' },
    { art: 'city', text: 'Lá longe, na Cidade das Torres, os tremores assustavam todo mundo.' },
    { art: 'titan', text: 'Um titã de pedra acordou embaixo da cidade. O Pepe pegou a espada e o escudo e partiu!' },
  ],
  portal: { x: 8050, message: 'Seja bem-vindo ao novo mundo, você é demais!' },
  quakes: [
    { id: 'tremor-1', name: 'Primeiro tremor', x0: 1000, x1: 1800, trigger: 1180, warnMs: 1600, durationMs: 6000, debrisEveryMs: 700, spikesEveryMs: 0 },
    { id: 'tremor-2', name: 'Tremor forte', x0: 2400, x1: 3300, trigger: 2580, warnMs: 1400, durationMs: 8000, debrisEveryMs: 900, spikesEveryMs: 1700 },
  ],
  encounters: [
    {
      id: 'avenida',
      name: 'Avenida Central',
      x0: 4000,
      x1: 5300,
      spawns: [{ type: 'spikeTitan', x: 4800 }],
      boss: true,
      bossName: 'Titã dos Espinhos',
      intro: 'O Titã dos Espinhos é quem causa os terremotos!',
    },
    {
      id: 'usina',
      name: 'Usina de Energia',
      x0: 6200,
      x1: 7700,
      spawns: [{ type: 'plasmaTitan', x: 7200 }],
      boss: true,
      bossName: 'Titã de Plasma',
      intro: 'O Titã de Plasma saiu da usina!',
      cutscene: 'plant',
    },
  ],
  plant: { x: 7250 },
  citizens: [
    { x: 420, look: 0 },
    { x: 760, look: 1 },
    { x: 2050, look: 2 },
    { x: 3650, look: 0 },
    { x: 5650, look: 1 },
    { x: 5950, look: 2 },
  ],
  trapped: [
    { x: 1700, look: 1 },
    { x: 3200, look: 2 },
    { x: 5550, look: 0 },
  ],
  ledges: [
    { x: 560, y: 380, w: 150 },
    { x: 3550, y: 370, w: 150 }, // praça (descanso)
    { x: 3780, y: 360, w: 140 },
    { x: 4300, y: 360, w: 140 }, // refúgios na avenida
    { x: 5000, y: 360, w: 140 },
    { x: 5780, y: 370, w: 150 }, // descanso antes da usina
    { x: 6500, y: 360, w: 140 }, // refúgios na usina: a baforada passa por baixo
    { x: 7450, y: 360, w: 140 },
  ],
  pickups: [
    { x: 635, y: 340 },
    { x: 3625, y: 330 },
    { x: 3850, y: 320 },
    { x: 4100, y: 440 },
    { x: 4370, y: 320 },
    { x: 5070, y: 320 },
    { x: 5855, y: 330 },
    { x: 6050, y: 440 },
    { x: 6300, y: 440 },
    { x: 6570, y: 320 },
    { x: 7520, y: 320 },
  ],
  beats: [
    { room: 'tremor-1', type: 'teach', intensity: 0.3 }, // escudo na cabeça
    { room: 'tremor-2', type: 'teach', intensity: 0.5 }, // pular os espinhos
    { room: 'praca', type: 'rest', intensity: 0.1 },
    { room: 'avenida', type: 'combat', intensity: 0.9 }, // primeiro titã
    { room: 'praca-norte', type: 'rest', intensity: 0.15 },
    { room: 'usina', type: 'climax', intensity: 1 }, // segundo titã
  ],
};

export const LEVELS = { 1: LEVEL, 2: LEVEL_2, 3: LEVEL_3, 4: LEVEL_4 };
export const LAST_PHASE = 4;

/** Buraco de neve que contém x, ou null. */
export function gapAt(x, level) {
  return (level.gaps ?? []).find((g) => x > g.x0 && x < g.x1) ?? null;
}

/** Onde o herói volta depois de cair na neve fofa: a borda por onde entrou. */
export function fallReturnX(gap, lastSafeX) {
  return lastSafeX >= gap.x1 ? gap.x1 + 40 : gap.x0 - 40;
}

// Compatibilidade com a Fase 1
export const WORLD_WIDTH = LEVEL.worldWidth;
export const CASTLE_GATE_X = LEVEL.castleGateX;

// ------------------------------------------------------------------ regras

export function totalDinos(level = LEVEL) {
  return level.encounters.reduce((n, e) => n + e.spawns.length, 0);
}

/** Encontro cuja área contém `x`, ou null. */
export function encounterAt(x, level = LEVEL) {
  return level.encounters.find((e) => x >= e.x0 && x <= e.x1) ?? null;
}

export function createRun(level = LEVEL, lives = START_LIVES) {
  return {
    phase: level.id ?? 1,
    kills: 0,
    total: totalDinos(level),
    cleared: new Set(), // ids de encontros vencidos
    alive: new Map(level.encounters.map((e) => [e.id, e.spawns.length])),
    active: null, // id do encontro em andamento (cercas fechadas)
    lives,
    startedAt: 0,
    finishedAt: 0,
    outcome: null, // 'victory' | 'defeat'
  };
}

/** Vidas ao começar a próxima fase: mantém o que juntou, nunca menos que o inicial. */
export function livesForNextPhase(lives) {
  return Math.min(MAX_LIVES, Math.max(START_LIVES, lives));
}

/** Herói entrou numa área: fecha a arena se ainda não foi vencida. */
export function tryStartEncounter(run, encounterId) {
  if (run.active || run.cleared.has(encounterId)) return false;
  run.active = encounterId;
  return true;
}

/** Registra um inimigo derrotado; retorna true se a arena foi liberada. */
export function recordKill(run, encounterId) {
  run.kills += 1;
  const left = Math.max(0, (run.alive.get(encounterId) ?? 1) - 1);
  run.alive.set(encounterId, left);
  if (left === 0) {
    run.cleared.add(encounterId);
    if (run.active === encounterId) run.active = null;
    return true;
  }
  return false;
}

/** Só se entra no castelo depois de vencer o chefe do portão. */
export function canEnterCastle(run, level = LEVEL) {
  // todos os chefes da fase (a Fase 4 tem dois)
  return level.encounters.filter((e) => e.boss).every((e) => run.cleared.has(e.id));
}

export function progress(heroX, level = LEVEL) {
  return Math.max(0, Math.min(1, heroX / level.castleGateX));
}

/** Maçã coletada: +1 vida, até o máximo. Retorna true se ganhou. */
export function gainLife(run) {
  if (run.lives >= MAX_LIVES) return false;
  run.lives += 1;
  return true;
}

/** Herói caiu: perde uma vida. Retorna quantas restam (0 = fim de jogo). */
export function loseLife(run) {
  run.lives = Math.max(0, run.lives - 1);
  return run.lives;
}

/** Onde o herói renasce: na entrada da arena em que caiu, que reabre e pode ser tentada de novo. */
export function respawnPoint(run, heroX, level = LEVEL) {
  const enc = level.encounters.find((e) => e.id === run.active);
  if (!enc) return { x: heroX, encounterId: null };
  run.active = null;
  return { x: enc.x0 - 120, encounterId: enc.id };
}

/**
 * Problemas de ritmo numa lista de beats (skill level-design). Vazio = passa.
 * Regras: abre ensinando, no máximo 2 beats intensos seguidos, descanso antes do clímax.
 */
export function pacingProblems(beats, high = 0.7, maxHighRun = 2) {
  const problems = [];
  let run = 0;
  beats.forEach((b, i) => {
    run = b.intensity >= high ? run + 1 : 0;
    if (run > maxHighRun) problems.push(`${b.room}: ${run} beats intensos seguidos`);
    if (b.type === 'climax' && (i === 0 || beats[i - 1].type !== 'rest')) problems.push(`${b.room}: sem descanso antes do clímax`);
  });
  if (beats.length && beats[0].type !== 'teach') problems.push(`${beats[0].room}: a fase não abre ensinando`);
  return problems;
}
