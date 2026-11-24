import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFighter, applyDamage, heal, HERO, DINOS, jumpVelocity } from '../src/rules/combat.js';
import { createBrain, stepBrain, hurtBrain } from '../src/rules/dinoBrain.js';
import {
  LEVEL,
  GROUND_Y,
  createRun,
  tryStartEncounter,
  recordKill,
  canEnterCastle,
  totalDinos,
  encounterAt,
  gainLife,
  loseLife,
  respawnPoint,
  START_LIVES,
  MAX_LIVES,
} from '../src/rules/level.js';

test('herói perde vida e fica invencível por um tempo', () => {
  const h = createFighter(HERO.maxHp);
  assert.deepEqual(applyDamage(h, 12, 1000, HERO.invulnMs), { hit: true, died: false, amount: 12 });
  assert.equal(h.hp, 88);
  assert.equal(applyDamage(h, 12, 1500, HERO.invulnMs).hit, false, 'ainda invencível');
  assert.equal(applyDamage(h, 12, 1000 + HERO.invulnMs, HERO.invulnMs).hit, true);
  assert.equal(h.hp, 76);
});

test('herói morre quando a vida zera e não recebe mais dano nem cura', () => {
  const h = createFighter(30);
  const r = applyDamage(h, 50, 0);
  assert.equal(r.died, true);
  assert.equal(r.amount, 30);
  assert.equal(h.hp, 0);
  assert.equal(applyDamage(h, 5, 10_000).hit, false);
  assert.equal(heal(h, 20), 0);
});

test('cura não passa do máximo', () => {
  const h = createFighter(100);
  applyDamage(h, 10, 0);
  assert.equal(heal(h, 50), 10);
  assert.equal(h.hp, 100);
});

test('quantos golpes de espada cada dino aguenta', () => {
  const hits = (t) => Math.ceil(DINOS[t].maxHp / HERO.swordDamage);
  assert.equal(hits('raptor'), 2);
  assert.equal(hits('trike'), 5);
  assert.equal(hits('rex'), 9);
});

test('herói sobrevive a pelo menos 3 mordidas do Rex com vida cheia', () => {
  assert.ok(HERO.maxHp > DINOS.rex.damage * 3);
});

test('dino patrulha, persegue, avisa e ataca', () => {
  const s = DINOS.raptor;
  const b = createBrain(0);
  let out = stepBrain(b, { dx: 1000, dtMs: 16, heroAlive: true, active: true }, s);
  assert.equal(b.state, 'patrol');
  assert.equal(Math.abs(out.vx), s.patrolSpeed);

  stepBrain(b, { dx: 300, dtMs: 16, heroAlive: true, active: true }, s);
  assert.equal(b.state, 'chase');
  out = stepBrain(b, { dx: 300, dtMs: 16, heroAlive: true, active: true }, s);
  assert.equal(out.vx, s.chaseSpeed);

  out = stepBrain(b, { dx: 80, dtMs: 16, heroAlive: true, active: true }, s);
  assert.equal(b.state, 'windup');
  assert.equal(out.attacking, false, 'aviso não causa dano');

  out = stepBrain(b, { dx: 80, dtMs: s.windupMs, heroAlive: true, active: true }, s);
  assert.equal(b.state, 'lunge');
  assert.equal(out.attacking, true);
  assert.equal(out.vx, s.lungeSpeed);

  stepBrain(b, { dx: 80, dtMs: s.lungeMs, heroAlive: true, active: true }, s);
  assert.equal(b.state, 'recover');
  stepBrain(b, { dx: 80, dtMs: s.recoverMs, heroAlive: true, active: true }, s);
  assert.equal(b.state, 'chase');
});

test('dino fora da arena ativa não persegue', () => {
  const b = createBrain(0);
  stepBrain(b, { dx: 100, dtMs: 16, heroAlive: true, active: false }, DINOS.raptor);
  assert.equal(b.state, 'patrol');
});

test('golpe interrompe a investida do dino', () => {
  const s = DINOS.raptor;
  const b = createBrain(0);
  b.state = 'lunge';
  b.timer = s.lungeMs;
  hurtBrain(b);
  const out = stepBrain(b, { dx: 50, dtMs: 16, heroAlive: true, active: true }, s);
  assert.equal(b.state, 'hurt');
  assert.equal(out.attacking, false);
});

test('arenas fecham, liberam ao derrotar todos e o castelo exige o chefe', () => {
  const run = createRun();
  assert.equal(run.total, totalDinos());
  const ravina = LEVEL.encounters.find((e) => e.id === 'ravina');
  assert.equal(tryStartEncounter(run, 'ravina'), true);
  assert.equal(tryStartEncounter(run, 'clareira'), false, 'uma arena por vez');
  for (let i = 0; i < ravina.spawns.length - 1; i++) assert.equal(recordKill(run, 'ravina'), false);
  assert.equal(recordKill(run, 'ravina'), true);
  assert.equal(run.active, null);
  assert.equal(tryStartEncounter(run, 'ravina'), false, 'arena vencida não reabre');

  assert.equal(canEnterCastle(run), false);
  tryStartEncounter(run, 'portao');
  recordKill(run, 'portao');
  assert.equal(canEnterCastle(run), true);
});

test('fase bem formada: arenas em ordem, inimigos dentro da arena, pulo alcança plataformas', () => {
  let prev = 0;
  for (const e of LEVEL.encounters) {
    assert.ok(e.x0 > prev && e.x1 > e.x0, `ordem de ${e.id}`);
    prev = e.x1;
    for (const s of e.spawns) assert.ok(s.x > e.x0 && s.x < e.x1, `${s.type} dentro de ${e.id}`);
  }
  assert.equal(encounterAt(LEVEL.heroStartX), null, 'herói começa fora de arena');
  // pulo de 125 px com gravidade 1500: plataformas até ~110 px acima do chão
  assert.ok(Math.abs(jumpVelocity(125, 1500)) > 600);
});

test('maçãs valem vidas; ao cair perde uma e renasce na entrada da arena', () => {
  const run = createRun();
  assert.equal(run.lives, START_LIVES);
  assert.equal(gainLife(run), true);
  assert.equal(run.lives, START_LIVES + 1);
  run.lives = MAX_LIVES;
  assert.equal(gainLife(run), false, 'não passa do máximo');

  run.lives = 2;
  tryStartEncounter(run, 'riacho');
  assert.equal(loseLife(run), 1);
  const riacho = LEVEL.encounters.find((e) => e.id === 'riacho');
  const p = respawnPoint(run, 2700);
  assert.deepEqual(p, { x: riacho.x0 - 120, encounterId: 'riacho' });
  assert.equal(run.active, null, 'arena reabre');
  assert.equal(tryStartEncounter(run, 'riacho'), true, 'pode tentar de novo');
  assert.equal(loseLife(run), 0, 'sem vidas: fim de jogo');
});

test('todas as maçãs são alcançáveis (no chão ou sobre uma plataforma)', () => {
  for (const p of LEVEL.pickups) {
    if (p.y > GROUND_Y - 60) continue; // no chão

    const ledge = LEVEL.ledges.find((l) => p.x >= l.x && p.x <= l.x + l.w);
    assert.ok(ledge, `maçã em ${p.x} tem plataforma embaixo`);
    assert.ok(ledge.y - p.y < 56, 'herói de pé na plataforma alcança a maçã');
  }
});

test('a arena do chefe tem maçãs e refúgios acima do bote do Rex', () => {
  const boss = LEVEL.encounters.find((e) => e.boss);
  const apples = LEVEL.pickups.filter((p) => p.x > boss.x0 - 250 && p.x < boss.x1);
  assert.ok(apples.length >= 5, `maçãs perto do chefe: ${apples.length}`);
  const rexTop = DINOS.rex.size.h - DINOS.rex.body.oy; // altura do topo do corpo acima do chão
  const refuges = LEVEL.ledges.filter((l) => l.x > boss.x0 && l.x + l.w < boss.x1);
  assert.ok(refuges.length >= 2);
  for (const l of refuges) assert.ok(GROUND_Y - l.y > rexTop, 'plataforma acima do corpo do Rex');
});
