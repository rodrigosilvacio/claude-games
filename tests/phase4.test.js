import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DINOS, HERO, shieldBlocks } from '../src/rules/combat.js';
import { MOVE } from '../src/rules/movement.js';
import { LEVEL_4, LEVELS, LAST_PHASE, GROUND_Y, pacingProblems, canEnterCastle, createRun, recordKill, tryStartEncounter } from '../src/rules/level.js';
import { createQuake, startQuake, stepQuake, spikeLine, createRubble, hitRubble } from '../src/rules/cityRules.js';
import { chooseKaijuAttack, createKaijuBrain } from '../src/rules/monsterBrain.js';

test('Fase 4 é a última e está bem formada', () => {
  assert.equal(LAST_PHASE, 4);
  assert.equal(LEVELS[4], LEVEL_4);
  assert.deepEqual(pacingProblems(LEVEL_4.beats), []);
  const bosses = LEVEL_4.encounters.filter((e) => e.boss);
  assert.equal(bosses.length, 2, 'dois titãs');
  for (const e of LEVEL_4.encounters) for (const s of e.spawns) assert.ok(DINOS[s.type] && s.x > e.x0 + 110 && s.x < e.x1);
  assert.equal(LEVEL_4.portal.message, 'Seja bem-vindo ao novo mundo, você é demais!');
  assert.ok(LEVEL_4.portal.x > bosses.at(-1).x1);
  assert.ok(LEVEL_4.startWithShield, 'o escudo vem da Fase 3');
  // terremotos antes do primeiro titã, sem sobrepor arenas
  for (const q of LEVEL_4.quakes) {
    assert.ok(q.trigger > q.x0 + 100 && q.trigger < q.x1);
    for (const e of LEVEL_4.encounters) assert.ok(q.x1 < e.x0 || q.x0 > e.x1);
  }
  assert.ok(LEVEL_4.story.length >= 2, 'tem história antes da fase');
});

test('só entra no portal depois de vencer os dois titãs', () => {
  const run = createRun(LEVEL_4);
  tryStartEncounter(run, 'avenida');
  recordKill(run, 'avenida');
  assert.equal(canEnterCastle(run, LEVEL_4), false);
  tryStartEncounter(run, 'usina');
  recordKill(run, 'usina');
  assert.equal(canEnterCastle(run, LEVEL_4), true);
});

test('Fase 4: maçãs alcançáveis e moradores presos fora das arenas', () => {
  for (const p of LEVEL_4.pickups) {
    if (p.y > GROUND_Y - 60) continue;
    const ledge = LEVEL_4.ledges.find((l) => p.x >= l.x && p.x <= l.x + l.w);
    assert.ok(ledge && ledge.y - p.y < 56 && GROUND_Y - ledge.y < MOVE.jumpHeight, `maçã em ${p.x}`);
  }
  for (const t of LEVEL_4.trapped) for (const e of LEVEL_4.encounters) assert.ok(t.x < e.x0 || t.x > e.x1);
});

test('terremoto avisa antes de qualquer coisa cair e termina sozinho', () => {
  const cfg = LEVEL_4.quakes[1];
  assert.ok(cfg.warnMs >= 1200, 'aviso longo');
  const q = createQuake(cfg, 7);
  assert.equal(stepQuake(q, 100).state, 'idle', 'só começa quando chamado');
  assert.equal(startQuake(q), true);
  assert.equal(startQuake(q), false, 'não reinicia no meio');
  let spawned = 0;
  let t = 0;
  for (; t < cfg.warnMs - 16; t += 16) spawned += stepQuake(q, 16).debris.length;
  assert.equal(spawned, 0, 'nada cai durante o aviso');
  let debris = 0;
  let rows = 0;
  let ended = false;
  for (let i = 0; i < 2000 && !ended; i++) {
    const out = stepQuake(q, 16);
    debris += out.debris.length;
    rows += out.spikes.length;
    ended = out.ended;
  }
  assert.ok(ended);
  assert.ok(debris >= cfg.durationMs / cfg.debrisEveryMs - 1);
  assert.ok(rows >= 3, 'tremor forte tem espinhos');
  // mesma semente, mesmo tremor
  const a = createQuake(cfg, 3);
  const b = createQuake(cfg, 3);
  startQuake(a);
  startQuake(b);
  stepQuake(a, cfg.warnMs);
  stepQuake(b, cfg.warnMs);
  assert.deepEqual(stepQuake(a, 2000), stepQuake(b, 2000));
});

test('espinhos: pula-se por cima, o escudo não segura; pedras: o escudo segura', () => {
  const t = DINOS.spikeTitan;
  assert.ok(t.spikeHeight < MOVE.jumpHeight - 40);
  assert.ok(t.spikeWarnMs >= 600);
  const hero = { blocking: true, facing: 1, x: 100 };
  assert.equal(shieldBlocks(hero, { fromX: 100, unblockable: true }), false);
  assert.equal(shieldBlocks(hero, { fromX: 100, fromAbove: true }), true);
  const xs = spikeLine(500, 900, t.spikeStep, 6, 0, 800);
  assert.deepEqual(xs, [645, 730]);
  assert.ok(spikeLine(500, 100, 85, 3, 0, 9999).every((x) => x < 500), 'vem na direção do herói');
});

test('titãs são justos: avisos longos, janela de contra-ataque, baforada bloqueável', () => {
  for (const type of ['spikeTitan', 'plasmaTitan']) {
    const k = DINOS[type];
    for (const ms of Object.values(k.windup)) assert.ok(ms * 0.75 >= 440, `${type}: aviso`);
    assert.ok(k.recoverMs * 0.8 >= HERO.attackCooldownMs * 2);
    assert.ok(Math.ceil(k.maxHp / HERO.swordDamage) <= 16);
    const b = createKaijuBrain();
    assert.equal(chooseKaijuAttack(b, -600, k), 'bolts', 'de longe: espinhos / baforada');
  }
  const p = DINOS.plasmaTitan;
  assert.ok(p.windup.bolts >= 1200, 'a boca acende por mais de 1 s antes da baforada');
  assert.equal(shieldBlocks({ blocking: true, facing: 1, x: 100 }, { fromX: 400 }), true, 'escudo de frente segura a baforada');
});

test('morador preso: dois golpes libertam', () => {
  const r = createRubble();
  assert.equal(hitRubble(r), false);
  assert.equal(hitRubble(r), true);
  assert.equal(hitRubble(r), false, 'já está livre');
});
