// Regras de vida e dano. Módulo puro: sem Phaser, testável com `node --test`.

export const HERO = {
  maxHp: 100,
  invulnMs: 900, // invencibilidade após levar dano
  swordDamage: 34,
  attackCooldownMs: 340,
  attackWindupMs: 60, // atraso entre apertar e a lâmina acertar
  attackActiveMs: 130, // janela em que a espada causa dano
  knockback: { x: 280, y: -260 },
  clearHeal: 15, // vida recuperada ao liberar uma área
};

// Tabela de dinossauros (desenho original do projeto).
export const DINOS = {
  raptor: {
    label: 'Raptor',
    maxHp: 60,
    damage: 12,
    patrolSpeed: 60,
    chaseSpeed: 175,
    aggroRange: 380,
    attackRange: 120,
    windupMs: 380,
    lungeMs: 260,
    lungeSpeed: 420,
    recoverMs: 650,
    knockbackTaken: 260,
    poise: 1, // golpes até atordoar
    size: { w: 72, h: 48 },
    body: { w: 52, h: 34, ox: 10, oy: 12 },
  },
  trike: {
    label: 'Tricerátopo',
    maxHp: 140,
    damage: 20,
    patrolSpeed: 40,
    chaseSpeed: 95,
    aggroRange: 440,
    attackRange: 210,
    windupMs: 650,
    lungeMs: 600,
    lungeSpeed: 360,
    recoverMs: 900,
    knockbackTaken: 110,
    poise: 2,
    size: { w: 112, h: 66 },
    body: { w: 90, h: 46, ox: 12, oy: 18 },
  },
  rex: {
    label: 'Rei Rex',
    maxHp: 340,
    damage: 25,
    patrolSpeed: 50,
    chaseSpeed: 120,
    aggroRange: 620,
    attackRange: 170,
    windupMs: 680,
    lungeMs: 380,
    lungeSpeed: 430,
    recoverMs: 820,
    knockbackTaken: 40,
    poise: Infinity, // chefe: nunca é interrompido
    size: { w: 176, h: 132 },
    body: { w: 116, h: 76, ox: 30, oy: 54 }, // baixo o bastante para pular por cima
    boss: true,
  },
};

export function createFighter(maxHp) {
  return { hp: maxHp, maxHp, invulnUntil: 0, dead: false };
}

/**
 * Aplica dano respeitando a invencibilidade.
 * @returns {{hit: boolean, died: boolean, amount: number}}
 */
export function applyDamage(fighter, amount, nowMs, invulnMs = 0) {
  if (fighter.dead || nowMs < fighter.invulnUntil || amount <= 0) {
    return { hit: false, died: false, amount: 0 };
  }
  const dealt = Math.min(amount, fighter.hp);
  fighter.hp -= dealt;
  fighter.invulnUntil = nowMs + invulnMs;
  if (fighter.hp <= 0) {
    fighter.hp = 0;
    fighter.dead = true;
    return { hit: true, died: true, amount: dealt };
  }
  return { hit: true, died: false, amount: dealt };
}

export function heal(fighter, amount) {
  if (fighter.dead) return 0;
  const before = fighter.hp;
  fighter.hp = Math.min(fighter.maxHp, fighter.hp + amount);
  return fighter.hp - before;
}

export function hpRatio(fighter) {
  return fighter.maxHp ? fighter.hp / fighter.maxHp : 0;
}

/** Velocidade de pulo para atingir `height` px com gravidade `gravity` px/s². */
export function jumpVelocity(height, gravity) {
  return -Math.sqrt(2 * gravity * height);
}
