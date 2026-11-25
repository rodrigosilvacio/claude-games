import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DINOS, HERO } from '../src/rules/combat.js';
import { MOVE } from '../src/rules/movement.js';
import {
  LEVEL,
  LEVEL_2,
  LEVELS,
  GROUND_Y,
  createRun,
  livesForNextPhase,
  pacingProblems,
  progress,
  START_LIVES,
  MAX_LIVES,
} from '../src/rules/level.js';
import {
  createBatBrain,
  stepBat,
  createPlantBrain,
  stepPlant,
  arcVelocity,
  createKaijuBrain,
  stepKaiju,
  chooseKaijuAttack,
} from '../src/rules/monsterBrain.js';

const SWORD_REACH_UP = 80; // a hitbox da espada sobe 80 px acima dos pés

test('Fase 2 bem formada: arenas em ordem, inimigos dentro, tipos existem, um chefe no fim', () => {
  let prev = 0;
  for (const e of LEVEL_2.encounters) {
    assert.ok(e.x0 > prev && e.x1 > e.x0, `ordem de ${e.id}`);
    prev = e.x1;
    for (const s of e.spawns) {
      assert.ok(DINOS[s.type], `tipo ${s.type}`);
      assert.ok(s.x > e.x0 + 110 && s.x < e.x1, `${s.type} dentro de ${e.id}`);
    }
  }
  const bosses = LEVEL_2.encounters.filter((e) => e.boss);
  assert.equal(bosses.length, 1);
  assert.equal(bosses[0], LEVEL_2.encounters.at(-1));
  assert.ok(LEVEL_2.castleGateX > bosses[0].x1 && LEVEL_2.castleGateX < LEVEL_2.worldWidth - 200);
  assert.equal(LEVELS[1], LEVEL);
});

test('Fase 2: todas as maçãs alcançáveis e reforço perto do chefe', () => {
  for (const p of LEVEL_2.pickups) {
    if (p.y > GROUND_Y - 60) continue;
    const ledge = LEVEL_2.ledges.find((l) => p.x >= l.x && p.x <= l.x + l.w);
    assert.ok(ledge, `maçã em ${p.x} tem plataforma embaixo`);
    assert.ok(ledge.y - p.y < 56);
    assert.ok(GROUND_Y - ledge.y < MOVE.jumpHeight, `plataforma em ${ledge.x} alcançável com pulo`);
  }
  const boss = LEVEL_2.encounters.find((e) => e.boss);
  assert.ok(LEVEL_2.pickups.filter((p) => p.x > boss.x0 - 400 && p.x < boss.x1).length >= 5);
});

test('ritmo da Fase 2: abre ensinando, sem 3 picos seguidos, descanso antes do chefe', () => {
  assert.deepEqual(pacingProblems(LEVEL_2.beats), []);
  // a verificação pega os erros
  assert.ok(pacingProblems([{ room: 'a', type: 'combat', intensity: 0.9 }]).length > 0);
  assert.ok(pacingProblems([{ room: 'a', type: 'teach', intensity: 0.2 }, { room: 'b', type: 'climax', intensity: 1 }]).length > 0);
  // cada inimigo novo aparece primeiro sozinho (ou só com um conhecido)
  assert.deepEqual(LEVEL_2.encounters[0].spawns.map((s) => s.type), ['bat']);
  assert.ok(LEVEL_2.encounters[1].spawns.some((s) => s.type === 'plant'));
});

test('vidas passam para a próxima fase, nunca menos que o inicial nem mais que o máximo', () => {
  assert.equal(livesForNextPhase(1), START_LIVES);
  assert.equal(livesForNextPhase(6), 6);
  assert.equal(livesForNextPhase(20), MAX_LIVES);
  const run = createRun(LEVEL_2, 6);
  assert.equal(run.phase, 2);
  assert.equal(run.lives, 6);
  assert.equal(progress(LEVEL_2.castleGateX, LEVEL_2), 1);
});

test('morcego no ar só é alcançado pulando; no mergulho chega ao chão', () => {
  const bat = DINOS.bat;
  assert.ok(bat.hoverHeight > SWORD_REACH_UP, 'parado no chão não alcança');
  assert.ok(bat.hoverHeight < MOVE.jumpHeight + SWORD_REACH_UP, 'pulando alcança');
  const b = createBatBrain(500, GROUND_Y - bat.hoverHeight);
  b.timer = 0;
  const ctx = { x: 500, y: GROUND_Y - bat.hoverHeight, heroX: 600, heroY: GROUND_Y - 30, dtMs: 16, active: true, heroAlive: true, groundY: GROUND_Y };
  stepBat(b, ctx, bat);
  assert.equal(b.state, 'windup');
  let out = stepBat(b, { ...ctx, dtMs: bat.windupMs }, bat);
  assert.equal(b.state, 'swoop');
  assert.equal(out.attacking, true);
  assert.ok(out.vy > 0 && out.vx > 0, 'mergulha em direção ao herói');
  out = stepBat(b, { ...ctx, y: GROUND_Y - 10, dtMs: 16 }, bat);
  assert.equal(b.state, 'recover', 'para ao chegar perto do chão');
  assert.equal(out.attacking, false);
});

test('morcego fora da arena ativa não ataca', () => {
  const b = createBatBrain(500, 300);
  b.timer = 0;
  stepBat(b, { x: 500, y: 300, heroX: 520, heroY: 440, dtMs: 16, active: false, heroAlive: true, groundY: GROUND_Y }, DINOS.bat);
  assert.equal(b.state, 'hover');
});

test('planta: avisa antes de cuspir, morde quem chega perto, esporo cai no alvo', () => {
  const p = DINOS.plant;
  const b = createPlantBrain();
  b.timer = 0;
  stepPlant(b, { dx: 300, dtMs: 16, active: true, heroAlive: true }, p);
  assert.equal(b.state, 'windup');
  const out = stepPlant(b, { dx: 300, dtMs: p.windupMs, active: true, heroAlive: true }, p);
  assert.equal(out.shoot, true);

  const c = createPlantBrain();
  stepPlant(c, { dx: 40, dtMs: 16, active: true, heroAlive: true }, p);
  assert.equal(c.kind, 'bite');
  const bite = stepPlant(c, { dx: 40, dtMs: 1000, active: true, heroAlive: true }, p);
  assert.equal(bite.attacking, true);

  // a trajetória calculada termina exatamente no alvo
  const g = MOVE.gravity;
  const v = arcVelocity(100, 400, 400, 440, p.sporeFlightMs, g);
  const t = p.sporeFlightMs / 1000;
  assert.ok(Math.abs(100 + v.vx * t - 400) < 1e-6);
  assert.ok(Math.abs(400 + v.vy * t + 0.5 * g * t * t - 440) < 1e-6);
});

test('Colosso: escolhe o golpe pela posição do herói', () => {
  const k = DINOS.kaiju;
  const b = createKaijuBrain(); // virado para a esquerda
  assert.equal(chooseKaijuAttack(b, -150, k), 'stomp', 'herói à frente e perto');
  assert.equal(chooseKaijuAttack(b, 150, k), 'tail', 'herói atrás e perto');
  assert.equal(chooseKaijuAttack(b, -600, k), 'bolts', 'herói longe');
});

test('Colosso é justo: todo golpe avisa por pelo menos meio segundo e deixa janela de contra-ataque', () => {
  const k = DINOS.kaiju;
  for (const [atk, ms] of Object.entries(k.windup)) {
    assert.ok(ms * 0.75 >= 440, `${atk}: aviso de ${ms * 0.75} ms mesmo enfurecido`);
  }
  assert.ok(k.recoverMs * 0.8 >= HERO.attackCooldownMs * 2, 'cabem pelo menos 2 golpes na recuperação');
  assert.ok(k.shockHeight < MOVE.jumpHeight - 40, 'onda de choque é pulável');
  assert.ok(Math.ceil(k.maxHp / HERO.swordDamage) <= 20);
});

test('Colosso: aviso, disparo único, recuperação; vira devagar; fica furioso na metade da vida', () => {
  const k = DINOS.kaiju;
  const b = createKaijuBrain();
  b.timer = 0;
  const ctx = { dx: -200, dtMs: 16, active: true, heroAlive: true, hpRatio: 1 };
  let out = stepKaiju(b, ctx, k);
  assert.equal(b.state, 'windup');
  assert.equal(b.attack, 'stomp');
  out = stepKaiju(b, { ...ctx, dtMs: k.windup.stomp }, k);
  assert.equal(out.fire, 'stomp');
  out = stepKaiju(b, ctx, k);
  assert.equal(out.fire, null, 'dispara uma vez só');
  stepKaiju(b, { ...ctx, dtMs: k.activeMs.stomp }, k);
  assert.equal(b.state, 'recover');

  // herói atrás e longe: só vira depois do atraso
  const c = createKaijuBrain();
  c.state = 'walk';
  c.timer = 99999;
  stepKaiju(c, { dx: 500, dtMs: k.turnDelayMs - 50, active: true, heroAlive: true, hpRatio: 1 }, k);
  assert.equal(c.facing, -1);
  stepKaiju(c, { dx: 500, dtMs: 100, active: true, heroAlive: true, hpRatio: 1 }, k);
  assert.equal(c.facing, 1);

  // herói colado atrás: não vira, usa a rabada quando o tempo de espera acaba
  const e = createKaijuBrain();
  e.state = 'walk';
  e.timer = 2000;
  stepKaiju(e, { dx: 150, dtMs: 1500, active: true, heroAlive: true, hpRatio: 1 }, k);
  assert.equal(e.facing, -1, 'não vira com o herói perto atrás');
  stepKaiju(e, { dx: 150, dtMs: 600, active: true, heroAlive: true, hpRatio: 1 }, k);
  assert.equal(e.attack, 'tail');

  // furioso: aviso mais curto
  const d = createKaijuBrain();
  d.timer = 0;
  stepKaiju(d, { dx: -200, dtMs: 16, active: true, heroAlive: true, hpRatio: 0.4 }, k);
  assert.ok(d.timer < k.windup.stomp);
});
