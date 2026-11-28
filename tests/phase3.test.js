import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DINOS, HERO, shieldBlocks } from '../src/rules/combat.js';
import { MOVE } from '../src/rules/movement.js';
import { LEVEL_3, LEVELS, LAST_PHASE, GROUND_Y, pacingProblems, gapAt, fallReturnX, FALL_DAMAGE } from '../src/rules/level.js';
import {
  createYetiBrain,
  stepYeti,
  createPenguinBrain,
  stepPenguin,
  createPteroBrain,
  stepPtero,
  createSerpentBrain,
  stepSerpent,
  serpentVulnerable,
  pickHole,
  shardTargets,
  reflectVelocity,
} from '../src/rules/iceBrain.js';

const SWORD_REACH_UP = 80;

test('Fase 3 está bem formada', () => {
  assert.ok(LAST_PHASE >= 3);
  assert.equal(LEVELS[3], LEVEL_3);
  let prev = 0;
  for (const e of LEVEL_3.encounters) {
    assert.ok(e.x0 > prev && e.x1 > e.x0, `ordem de ${e.id}`);
    prev = e.x1;
    for (const s of e.spawns) {
      assert.ok(DINOS[s.type], `tipo ${s.type}`);
      assert.ok(s.x > e.x0 + 110 && s.x < e.x1);
      assert.equal(gapAt(s.x, LEVEL_3), null, `${s.type} não nasce em cima de um buraco`);
    }
  }
  const boss = LEVEL_3.encounters.at(-1);
  assert.ok(boss.boss && boss.holes.length >= 3);
  for (const h of boss.holes) assert.ok(h > boss.x0 + 100 && h < boss.x1 - 100);
  assert.ok(LEVEL_3.finale.message === 'Parabéns, você é demais!!');
  assert.ok(LEVEL_3.chest.x < LEVEL_3.encounters[0].x0, 'escudo antes da primeira arena');
  assert.deepEqual(pacingProblems(LEVEL_3.beats), []);
});

test('Fase 3: maçãs alcançáveis, reforço perto do chefe, plataformas fora dos buracos', () => {
  for (const p of LEVEL_3.pickups) {
    assert.equal(gapAt(p.x, LEVEL_3), null);
    if (p.y > GROUND_Y - 60) continue;
    const ledge = LEVEL_3.ledges.find((l) => p.x >= l.x && p.x <= l.x + l.w);
    assert.ok(ledge && ledge.y - p.y < 56 && GROUND_Y - ledge.y < MOVE.jumpHeight, `maçã em ${p.x}`);
  }
  const boss = LEVEL_3.encounters.at(-1);
  assert.ok(LEVEL_3.pickups.filter((p) => p.x > boss.x0 - 600 && p.x < boss.x1).length >= 5);
});

test('buracos de neve: plataforma cabe e anda; cair devolve à borda certa e custa pouco', () => {
  for (const g of LEVEL_3.gaps) {
    assert.ok(g.platform.w < g.x1 - g.x0, 'a plataforma precisa atravessar o buraco');
    assert.ok(g.platform.speed <= 80, 'devagar, para crianças');
    assert.equal(gapAt((g.x0 + g.x1) / 2, LEVEL_3), g);
    assert.equal(fallReturnX(g, g.x0 - 100), g.x0 - 40);
    assert.equal(fallReturnX(g, g.x1 + 100), g.x1 + 40);
  }
  assert.ok(FALL_DAMAGE <= HERO.maxHp / 10, 'cair é um susto, não um castigo');
});

test('escudo bloqueia frente e cima, não as costas', () => {
  const hero = { blocking: true, facing: 1, x: 100 };
  assert.equal(shieldBlocks(hero, { fromX: 200 }), true, 'de frente');
  assert.equal(shieldBlocks(hero, { fromX: 0 }), false, 'pelas costas');
  assert.equal(shieldBlocks(hero, { fromX: 0, fromAbove: true }), true, 'de cima');
  assert.equal(shieldBlocks({ ...hero, blocking: false }, { fromX: 200 }), false, 'sem segurar S');
});

test('yeti avisa antes de jogar a bola e empurra quem chega perto', () => {
  const y = DINOS.yeti;
  const b = createYetiBrain();
  b.timer = 0;
  stepYeti(b, { dx: 300, dtMs: 16, active: true, heroAlive: true }, y);
  assert.equal(b.state, 'windup');
  assert.ok(y.windupMs >= 500);
  assert.equal(stepYeti(b, { dx: 300, dtMs: y.windupMs, active: true, heroAlive: true }, y).throwBall, true);
  const c = createYetiBrain();
  stepYeti(c, { dx: 50, dtMs: 16, active: true, heroAlive: true }, y);
  assert.equal(stepYeti(c, { dx: 50, dtMs: 1000, active: true, heroAlive: true }, y).attacking, true);
});

test('pinguim agacha, desliza em linha reta e fica tonto ao bater', () => {
  const p = DINOS.penguin;
  const b = createPenguinBrain();
  b.timer = 0;
  stepPenguin(b, { dx: -300, dtMs: 16, active: true, heroAlive: true }, p);
  assert.equal(b.state, 'crouch');
  let out = stepPenguin(b, { dx: -300, dtMs: p.crouchMs, active: true, heroAlive: true }, p);
  assert.equal(out.vx, -p.slideSpeed);
  assert.equal(out.attacking, true);
  out = stepPenguin(b, { dx: 300, dtMs: 16, active: true, heroAlive: true }, p);
  assert.equal(out.vx, -p.slideSpeed, 'não muda de direção no meio do deslize');
  stepPenguin(b, { dx: 300, dtMs: 16, active: true, heroAlive: true, hitWall: true }, p);
  assert.equal(b.state, 'dizzy');
  assert.ok(p.dizzyMs >= HERO.attackCooldownMs * 3, 'tempo de sobra para golpear');
});

test('ptero: sombra avisa onde o pingente cai; só é alcançado pulando', () => {
  const p = DINOS.ptero;
  assert.ok(p.hoverHeight > SWORD_REACH_UP && p.hoverHeight < MOVE.jumpHeight + SWORD_REACH_UP);
  const b = createPteroBrain(500, GROUND_Y - p.hoverHeight);
  b.timer = 0;
  const ctx = { x: 500, y: GROUND_Y - p.hoverHeight, heroX: 560, dtMs: 16, active: true, heroAlive: true };
  let out = stepPtero(b, ctx, p);
  assert.equal(b.state, 'warn');
  assert.equal(out.warnX, 560);
  out = stepPtero(b, { ...ctx, dtMs: p.warnMs }, p);
  assert.equal(out.drop, 560, 'cai onde a sombra marcou');
  assert.ok(p.warnMs >= 600);
});

test('Serpente: sai longe do herói, começa pelos estilhaços, fica presa depois do bote', () => {
  const s = DINOS.serpent;
  const holes = [100, 500, 900];
  assert.equal(pickHole(holes, 520, s.minEmergeDist), 2, 'o buraco válido mais perto, nunca embaixo do herói');
  const b = createSerpentBrain(holes);
  const ctx = { heroX: 520, dtMs: 16, active: true, heroAlive: true, hpRatio: 1 };
  stepSerpent(b, { ...ctx, dtMs: 800 }, s);
  assert.equal(b.state, 'emerging');
  assert.equal(serpentVulnerable(b), false, 'escondida não leva dano');
  stepSerpent(b, { ...ctx, dtMs: s.emergeMs }, s);
  stepSerpent(b, { ...ctx, dtMs: 400 }, s);
  assert.equal(b.attack, 'shards');
  let out = stepSerpent(b, { ...ctx, dtMs: s.castWindupMs }, s);
  assert.equal(out.fire, 'shards');
  assert.equal(out.vulnerable, true);
  stepSerpent(b, { ...ctx, dtMs: s.castMs }, s);
  stepSerpent(b, { ...ctx, dtMs: s.submergeMs }, s);
  stepSerpent(b, { ...ctx, dtMs: s.hiddenMs }, s);
  stepSerpent(b, { ...ctx, dtMs: s.emergeMs }, s);
  stepSerpent(b, { ...ctx, dtMs: 400 }, s);
  assert.equal(b.attack, 'lunge');
  out = stepSerpent(b, { ...ctx, dtMs: s.lungeWindupMs }, s);
  assert.equal(out.fire, 'lunge');
  assert.equal(out.attacking, true);
  stepSerpent(b, { ...ctx, dtMs: s.lungeMs }, s);
  assert.equal(b.state, 'stuck');
  assert.ok(s.stuckMs >= HERO.attackCooldownMs * 4, 'presa tempo bastante para vários golpes');
});

test('Serpente é justa: avisos longos, estilhaços em volta do herói, escudo devolve na direção dela', () => {
  const s = DINOS.serpent;
  for (const ms of [s.emergeMs, s.castWindupMs, s.lungeWindupMs, s.markerMs]) assert.ok(ms * 0.75 >= 500);
  assert.equal(shardTargets(500, false, s.shardSpread).length, 3);
  assert.equal(shardTargets(500, true, s.shardSpread).length, 5);
  // tempo de queda + volta cabe no tempo em que ela fica exposta
  const fall = s.markerMs + (300 / s.shardFallSpeed) * 1000;
  const back = (700 / s.reflectSpeed) * 1000;
  assert.ok(fall + back < s.castMs, 'estilhaço devolvido chega antes de ela mergulhar');
  const v = reflectVelocity(0, 0, 300, -400, 500);
  assert.ok(Math.abs(Math.hypot(v.vx, v.vy) - 500) < 1e-9);
  assert.ok(v.vx > 0 && v.vy < 0);
  assert.ok(Math.ceil(s.maxHp / HERO.swordDamage) <= 10);
});
