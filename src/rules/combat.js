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
  // escudo (Fase 3, tecla S): segurando, bloqueia o que vem da frente e de cima
  shield: { speedMult: 0.45, pushback: 140 },
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
    size: { w: 84, h: 56 },
    body: { w: 56, h: 36, ox: 14, oy: 18 },
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
    size: { w: 124, h: 74 },
    body: { w: 96, h: 50, ox: 16, oy: 22 },
  },
  rex: {
    label: 'Rei Rex',
    maxHp: 300,
    damage: 20,
    patrolSpeed: 50,
    chaseSpeed: 120,
    aggroRange: 620,
    attackRange: 170,
    windupMs: 820, // aviso longo antes do bote
    lungeMs: 380,
    lungeSpeed: 430,
    recoverMs: 1150, // janela para contra-atacar

    knockbackTaken: 40,
    poise: Infinity, // chefe: nunca é interrompido
    size: { w: 190, h: 142 },
    body: { w: 116, h: 76, ox: 37, oy: 64 }, // baixo o bastante para pular por cima
    boss: true,
  },
  // ---------------------------------------------------------------- Fase 2
  bat: {
    label: 'Morcego sombrio',
    kind: 'bat',
    maxHp: 34, // 1 golpe
    damage: 10,
    hoverHeight: 150, // acima do chão: só dá para acertar pulando ou quando ele mergulha
    hoverSpeed: 130,
    aggroRange: 380,
    windupMs: 480,
    swoopSpeed: 420,
    recoverMs: 900,
    cooldownMs: 700,
    knockbackTaken: 220,
    poise: 1,
    size: { w: 72, h: 48 },
    body: { w: 40, h: 26, ox: 16, oy: 12 },
  },
  plant: {
    label: 'Planta cuspidora',
    kind: 'plant',
    maxHp: 68, // 2 golpes
    damage: 12, // mordida
    sporeDamage: 10,
    range: 560,
    biteRange: 90,
    windupMs: 520,
    shootEveryMs: 2300,
    sporeFlightMs: 950,
    knockbackTaken: 0,
    poise: 1,
    size: { w: 72, h: 84 },
    body: { w: 42, h: 62, ox: 15, oy: 20 },
  },
  kaiju: {
    label: 'Colosso de Magma',
    kind: 'kaiju',
    maxHp: 640, // 19 golpes
    damage: 22, // pisão de perto
    shockDamage: 18,
    boltDamage: 14,
    fireDamage: 8,
    tailDamage: 20,
    walkSpeed: 70,
    aggroRange: 900,
    stompRange: 300,
    tailRange: 260,
    windup: { stomp: 950, bolts: 850, tail: 600 }, // avisos longos e diferentes para cada golpe
    activeMs: { stomp: 260, bolts: 320, tail: 320 },
    recoverMs: 1100, // janela para contra-atacar
    cooldownMs: 700,
    turnDelayMs: 650, // demora para virar: ficar atrás dele é uma estratégia
    enragedAt: 0.5, // abaixo de 50% fica mais rápido e cospe mais lava
    shockSpeed: 380,
    shockHeight: 28, // baixa o bastante para pular por cima
    knockbackTaken: 0,
    poise: Infinity,
    size: { w: 300, h: 250 },
    body: { w: 170, h: 140, ox: 65, oy: 108 },
    boss: true,
  },
  // ---------------------------------------------------------------- Fase 3
  raptorSnow: {
    label: 'Raptor da neve',
    maxHp: 60,
    damage: 12,
    patrolSpeed: 60,
    chaseSpeed: 175,
    aggroRange: 380,
    attackRange: 120,
    windupMs: 400,
    lungeMs: 260,
    lungeSpeed: 420,
    recoverMs: 700,
    knockbackTaken: 260,
    poise: 1,
    size: { w: 84, h: 56 },
    body: { w: 56, h: 36, ox: 14, oy: 18 },
  },
  yeti: {
    label: 'Yeti filhote',
    kind: 'yeti',
    maxHp: 68, // 2 golpes
    damage: 10, // empurrão de perto
    ballDamage: 10,
    range: 560,
    slapRange: 84,
    windupMs: 700, // levanta a bola de neve acima da cabeça
    throwEveryMs: 2200,
    ballFlightMs: 1000,
    knockbackTaken: 120,
    poise: 1,
    size: { w: 70, h: 76 },
    body: { w: 44, h: 56, ox: 13, oy: 18 },
  },
  penguin: {
    label: 'Pinguim escorregadio',
    kind: 'penguin',
    maxHp: 68,
    damage: 12,
    aggroRange: 520,
    crouchMs: 650, // agacha e balança antes de deslizar
    slideSpeed: 400,
    slideMaxMs: 1400,
    dizzyMs: 1700, // tonto depois de bater: hora de golpear
    walkSpeed: 50,
    knockbackTaken: 160,
    poise: 1,
    size: { w: 66, h: 52 },
    body: { w: 38, h: 34, ox: 14, oy: 16 },
  },
  ptero: {
    label: 'Ptero de gelo',
    kind: 'ptero',
    maxHp: 68,
    damage: 10,
    icicleDamage: 14,
    hoverHeight: 165, // só dá para acertar pulando
    hoverSpeed: 120,
    aggroRange: 440,
    warnMs: 800, // sombra no chão mostra onde o pingente vai cair
    cooldownMs: 1500,
    knockbackTaken: 200,
    poise: 1,
    size: { w: 96, h: 60 },
    body: { w: 50, h: 28, ox: 23, oy: 16 },
  },
  serpent: {
    label: 'Serpente de Cristal',
    kind: 'serpent',
    maxHp: 340, // 10 golpes (espada ou estilhaço devolvido)
    lungeDamage: 20,
    shardDamage: 12,
    emergeMs: 900, // o buraco treme antes de ela sair
    castWindupMs: 700,
    castMs: 2400, // fica exposta enquanto os estilhaços caem
    lungeWindupMs: 900,
    lungeMs: 450,
    lungeSpeed: 640,
    stuckMs: 1600, // presa no gelo depois do bote: hora de golpear
    submergeMs: 450,
    hiddenMs: 900,
    markerMs: 800,
    shardFallSpeed: 700,
    reflectSpeed: 650,
    shardSpread: 95,
    minEmergeDist: 200,
    enragedAt: 0.5,
    knockbackTaken: 0,
    poise: Infinity,
    size: { w: 260, h: 210 },
    bodyUp: { w: 80, h: 170, ox: 90, oy: 38 },
    bodyLow: { w: 210, h: 64, ox: 25, oy: 144 },
    body: { w: 80, h: 170, ox: 90, oy: 38 },
    boss: true,
  },
  // ---------------------------------------------------------------- Fase 4
  // Dois titãs originais. Usam o mesmo cérebro do Colosso (aviso -> golpe -> recuperação);
  // cada um troca o que os golpes fazem.
  spikeTitan: {
    label: 'Titã dos Espinhos',
    kind: 'kaiju',
    maxHp: 440, // 13 golpes
    damage: 20, // pisão de perto
    tailDamage: 18,
    spikeDamage: 14,
    rockDamage: 10,
    walkSpeed: 60,
    aggroRange: 900,
    stompRange: 300,
    tailRange: 260,
    windup: { stomp: 1000, bolts: 950, tail: 650 },
    activeMs: { stomp: 260, bolts: 400, tail: 320 },
    recoverMs: 1200,
    cooldownMs: 800,
    turnDelayMs: 700,
    enragedAt: 0.5,
    spikeStep: 85, // distância entre os espinhos da fileira que vem pelo chão
    spikeWarnMs: 700, // rachadura brilha antes do espinho sair
    spikeUpMs: 800,
    spikeHeight: 46, // dá para pular
    knockbackTaken: 0,
    poise: Infinity,
    size: { w: 320, h: 210 },
    body: { w: 220, h: 150, ox: 50, oy: 56 },
    boss: true,
  },
  plasmaTitan: {
    label: 'Titã de Plasma',
    kind: 'kaiju',
    maxHp: 520, // 16 golpes
    damage: 22,
    tailDamage: 20,
    shockDamage: 18,
    shockSpeed: 380,
    shockHeight: 28,
    beamDamage: 16,
    beamLength: 640,
    walkSpeed: 70,
    aggroRange: 900,
    stompRange: 300,
    tailRange: 260,
    windup: { stomp: 950, bolts: 1300, tail: 600 }, // a baforada carrega por mais tempo (boca acende)
    activeMs: { stomp: 260, bolts: 1500, tail: 320 },
    recoverMs: 1300, // superaquecido depois da baforada
    cooldownMs: 700,
    turnDelayMs: 650,
    enragedAt: 0.5,
    knockbackTaken: 0,
    poise: Infinity,
    size: { w: 300, h: 260 },
    body: { w: 170, h: 150, ox: 65, oy: 108 },
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

/**
 * Escudo: segurando S, bloqueia ataques que vêm da frente ou de cima.
 * Só quem ataca pelas costas atravessa a defesa.
 */
export function shieldBlocks(hero, attack) {
  if (!hero.blocking || attack.unblockable) return false; // espinhos do chão: pule!
  if (attack.fromAbove) return true;
  const dx = attack.fromX - hero.x;
  return Math.abs(dx) < 8 || Math.sign(dx) === hero.facing;
}
