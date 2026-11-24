// Definição da fase: a floresta até o castelo. Módulo puro.
// Encontros funcionam como "arenas": ao entrar, cercas fecham o caminho
// e só abrem quando todos os dinossauros daquela área forem derrotados.

export const GROUND_Y = 470; // topo do chão (px)
export const WORLD_WIDTH = 7600;
export const CASTLE_GATE_X = 7180;
export const START_LIVES = 3;
export const MAX_LIVES = 9;

export const LEVEL = {
  heroStartX: 140,
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

export function totalDinos(level = LEVEL) {
  return level.encounters.reduce((n, e) => n + e.spawns.length, 0);
}

/** Encontro cuja área contém `x`, ou null. */
export function encounterAt(x, level = LEVEL) {
  return level.encounters.find((e) => x >= e.x0 && x <= e.x1) ?? null;
}

export function createRun(level = LEVEL) {
  return {
    kills: 0,
    total: totalDinos(level),
    cleared: new Set(), // ids de encontros vencidos
    alive: new Map(level.encounters.map((e) => [e.id, e.spawns.length])),
    active: null, // id do encontro em andamento (cercas fechadas)
    lives: START_LIVES,
    startedAt: 0,
    finishedAt: 0,
    outcome: null, // 'victory' | 'defeat'
  };
}

/** Herói entrou numa área: fecha a arena se ainda não foi vencida. */
export function tryStartEncounter(run, encounterId) {
  if (run.active || run.cleared.has(encounterId)) return false;
  run.active = encounterId;
  return true;
}

/** Registra um dino derrotado; retorna true se a arena foi liberada. */
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
  const boss = level.encounters.find((e) => e.boss);
  return boss ? run.cleared.has(boss.id) : true;
}

export function progress(heroX) {
  return Math.max(0, Math.min(1, heroX / CASTLE_GATE_X));
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
