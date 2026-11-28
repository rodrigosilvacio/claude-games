// Inimigos da Fase 2 e projéteis. Toda decisão vem de src/rules/monsterBrain.js;
// aqui só há física, animação e desenho.
import { DINOS, HERO, createFighter, applyDamage } from '../rules/combat.js';
import { GROUND_Y } from '../rules/level.js';
import { MOVE } from '../rules/movement.js';
import {
  createBatBrain,
  stepBat,
  createPlantBrain,
  stepPlant,
  arcVelocity,
  createKaijuBrain,
  stepKaiju,
} from '../rules/monsterBrain.js';

let nextId = 10_000;
const R = (x, y, w, h) => new Phaser.Geom.Rectangle(x, y, w, h);

/** Base comum: vida, barra de vida, piscar ao levar golpe, morte. */
export class Enemy {
  constructor(scene, type, encounter) {
    this.id = nextId++;
    this.scene = scene;
    this.type = type;
    this.stats = DINOS[type];
    this.encounter = encounter;
    this.fighter = createFighter(this.stats.maxHp);
    this.bar = scene.add.graphics().setDepth(20);
  }

  get alive() {
    return !this.fighter.dead;
  }

  bounds() {
    const b = this.sprite.body;
    return R(b.x, b.y, b.width, b.height);
  }

  attackBoxes() {
    return [];
  }

  flash() {
    const s = this.sprite;
    s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(90, () => {
      if (!s.active) return;
      s.clearTint();
      this.afterFlash?.();
    });
  }

  drawBar() {
    const g = this.bar;
    g.clear();
    if (!this.alive || this.stats.boss || this.fighter.hp === this.fighter.maxHp) return;
    const b = this.sprite.body;
    const w = Math.max(36, b.width * 0.8);
    g.fillStyle(0x1d1d28, 0.7).fillRect(b.center.x - w / 2 - 1, b.y - 15, w + 2, 7);
    g.fillStyle(0xe5394a).fillRect(b.center.x - w / 2, b.y - 14, (w * this.fighter.hp) / this.fighter.maxHp, 5);
  }

  takeHit(fromX, now) {
    const r = applyDamage(this.fighter, HERO.swordDamage, now, 0);
    if (!r.hit) return r;
    this.flash();
    if (r.died) this.die(Math.sign(this.sprite.x - fromX) || 1);
    else this.onHurt?.(fromX);
    return r;
  }

  die(away) {
    if (this.brain) this.brain.state = 'dead';
    this.bar.clear();
    const s = this.sprite;
    s.anims.stop();
    s.body.enable = false;
    this.scene.tweens.add({
      targets: s,
      angle: away * 80,
      alpha: 0,
      y: s.y + (this.type === 'bat' ? 60 : -10),
      duration: 700,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        s.destroy();
        this.bar.destroy();
      },
    });
  }
}

// ------------------------------------------------------------------ Morcego

export class Bat extends Enemy {
  constructor(scene, x, encounter) {
    super(scene, 'bat', encounter);
    const hoverY = GROUND_Y - this.stats.hoverHeight;
    this.brain = createBatBrain(x, hoverY);
    this.sprite = scene.physics.add.sprite(x, hoverY, 'bat', 'fly0').setDepth(11);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setSize(this.stats.body.w, this.stats.body.h).setOffset(this.stats.body.ox, this.stats.body.oy);
    this.sprite.play('bat-fly');
    this.attacking = false;
  }

  update(ctx) {
    if (!this.alive) return;
    const s = this.sprite;
    const out = stepBat(
      this.brain,
      { x: s.x, y: s.y, heroX: ctx.heroX, heroY: ctx.heroY - 30, dtMs: ctx.dtMs, active: ctx.activeId === this.encounter.id, heroAlive: ctx.heroAlive, groundY: GROUND_Y },
      this.stats,
    );
    if (out.vx !== null) s.body.setVelocity(out.vx, out.vy);
    this.attacking = out.attacking;
    s.setFlipX(out.facing < 0);
    const st = this.brain.state;
    if (st === 'swoop') {
      s.anims.stop();
      s.setFrame('swoop');
    } else {
      if (!s.anims.isPlaying) s.play('bat-fly');
      s.anims.timeScale = st === 'windup' ? 2.2 : 1;
    }
    // aviso: treme e fica avermelhado antes do mergulho
    if (st === 'windup') s.setTint(0xff8080).setTintMode(Phaser.TintModes.MULTIPLY);
    else if (!s.isTinted || s.tintMode !== Phaser.TintModes.FILL) s.clearTint();
    s.x += st === 'windup' ? Math.sin(ctx.now / 22) * 1.2 : 0;
    this.drawBar();
  }

  attackBoxes() {
    return this.attacking ? [{ rect: this.bounds(), damage: this.stats.damage, fromX: this.sprite.x }] : [];
  }

  resetBrain() {
    this.brain = createBatBrain(this.sprite.x, GROUND_Y - this.stats.hoverHeight);
    this.brain.state = 'recover';
    this.brain.timer = this.stats.recoverMs;
  }

  onHurt(fromX) {
    const away = Math.sign(this.sprite.x - fromX) || 1;
    this.sprite.body.setVelocity(away * this.stats.knockbackTaken, -160);
    this.brain.state = 'hurt';
    this.brain.timer = 260;
  }
}

// ------------------------------------------------------------------ Planta

export class Plant extends Enemy {
  constructor(scene, x, encounter) {
    super(scene, 'plant', encounter);
    this.brain = createPlantBrain();
    const { size, body } = this.stats;
    this.sprite = scene.physics.add.sprite(x, GROUND_Y - size.h / 2 + 2, 'plant', 'idle0').setDepth(9);
    this.sprite.body.setAllowGravity(false).setImmovable(true);
    this.sprite.body.setSize(body.w, body.h).setOffset(body.ox, body.oy);
    this.sprite.play('plant-idle');
    this.baseX = x;
    this.biting = false;
    this.facing = -1;
  }

  update(ctx) {
    if (!this.alive) return;
    const s = this.sprite;
    const out = stepPlant(this.brain, { dx: ctx.heroX - s.x, dtMs: ctx.dtMs, active: ctx.activeId === this.encounter.id, heroAlive: ctx.heroAlive }, this.stats);
    this.facing = out.facing;
    s.setFlipX(out.facing < 0);
    this.biting = out.attacking;
    const st = this.brain.state;
    if (st === 'windup') {
      s.anims.stop();
      s.setFrame('windup');
      s.x = this.baseX + Math.sin(ctx.now / 25) * 1.2;
    } else if (st === 'bite' || (st === 'recover' && this.brain.timer > 200)) {
      s.anims.stop();
      s.setFrame('open');
      s.x = this.baseX;
    } else {
      s.x = this.baseX;
      if (!s.anims.isPlaying) s.play('plant-idle');
    }
    if (out.shoot) this.shoot(ctx.heroX);
    this.drawBar();
  }

  resetBrain() {
    this.brain = createPlantBrain();
  }

  shoot(heroX) {
    const s = this.sprite;
    const mx = s.x + this.facing * 16;
    const my = s.y - 12;
    const tx = heroX + (Math.random() - 0.5) * 30;
    spawnProjectile(this.scene, 'spore', mx, my, tx, GROUND_Y - 24, this.stats.sporeFlightMs, {
      damage: this.stats.sporeDamage,
      destroyable: true,
      radius: 8,
    });
  }

  attackBoxes() {
    if (!this.biting) return [];
    const s = this.sprite;
    return [{ rect: R(s.x + (this.facing > 0 ? 0 : -70), s.y - 30, 70, 50), damage: this.stats.damage, fromX: s.x }];
  }
}

// ------------------------------------------------------------------ Colosso de Magma

export class Kaiju extends Enemy {
  constructor(scene, x, encounter, type = 'kaiju') {
    super(scene, type, encounter);
    this.brain = createKaijuBrain();
    const { size, body } = this.stats;
    this.sprite = scene.physics.add.sprite(x, GROUND_Y - size.h / 2 + 4, type, 'walk0').setDepth(9);
    this.sprite.body.setAllowGravity(false).setImmovable(true);
    this.sprite.body.setSize(body.w, body.h).setOffset(body.ox, body.oy);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setFlipX(true);
    this.out = { state: 'idle', attack: null };
  }

  get hpRatio() {
    return this.fighter.hp / this.fighter.maxHp;
  }

  update(ctx) {
    if (!this.alive) return;
    const s = this.sprite;
    const out = stepKaiju(
      this.brain,
      { dx: ctx.heroX - s.x, dtMs: ctx.dtMs, active: ctx.activeId === this.encounter.id, heroAlive: ctx.heroAlive, hpRatio: this.hpRatio },
      this.stats,
    );
    this.out = out;
    s.body.setVelocityX(out.vx);
    s.setFlipX(out.facing < 0);

    const pose = { stomp: 'stomp', bolts: 'breath', tail: 'tail' }[out.attack];
    if ((out.state === 'windup' || out.state === 'active') && pose) {
      s.anims.stop();
      s.setFrame(pose);
    } else if (out.state === 'walk' && Math.abs(out.vx) > 0) {
      if (!s.anims.isPlaying) s.play(`${this.type}-walk`);
    } else {
      s.anims.stop();
      if (out.state === 'recover') s.setFrame('walk0');
    }
    // aviso: treme e as fendas esquentam (vermelho) antes de cada golpe
    if (out.state === 'windup') {
      s.x += Math.sin(ctx.now / 30) * 1.5;
      if (!s.isTinted) s.setTint(out.enraged ? 0xff9070 : 0xffc0a0).setTintMode(Phaser.TintModes.MULTIPLY);
    } else if (s.isTinted && s.tintMode !== Phaser.TintModes.FILL) {
      s.clearTint();
    }
    if (out.fire) this.fire(out.fire, ctx, out.enraged);
  }

  resetBrain() {
    const facing = this.brain.facing;
    this.brain = createKaijuBrain();
    this.brain.facing = facing;
    this.out = { state: 'idle', attack: null, facing };
  }

  afterFlash() {
    // depois de piscar branco, volta ao vermelho do aviso se ainda estiver avisando
    if (this.out.state === 'windup') this.sprite.setTint(0xffc0a0).setTintMode(Phaser.TintModes.MULTIPLY);
  }

  fire(attack, ctx, enraged) {
    const s = this.sprite;
    const f = this.out.facing;
    const st = this.stats;
    if (attack === 'stomp') {
      const fx = s.x + f * 110;
      for (const dir of [-1, 1]) spawnShockwave(this.scene, fx, dir, st);
      this.scene.events.emit('kaiju-stomp', fx);
    } else if (attack === 'bolts') {
      const offsets = enraged ? [-260, -130, 0, 130, 260] : [-150, 0, 150];
      const mx = s.x + f * 120;
      const my = s.y - 90;
      offsets.forEach((o, i) => {
        const tx = Phaser.Math.Clamp(ctx.heroX + o, this.encounter.x0 + 40, this.encounter.x1 - 40);
        spawnProjectile(this.scene, 'lavabolt', mx, my, tx, GROUND_Y - 10, 1000 + i * 90, {
          damage: st.boltDamage,
          destroyable: false,
          radius: 11,
          onGround: (x) => spawnFirePatch(this.scene, x, st.fireDamage),
        });
      });
      this.scene.events.emit('kaiju-roar');
    } else if (attack === 'tail') {
      this.scene.events.emit('kaiju-tail');
    }
  }

  attackBoxes() {
    const { state, attack, facing } = this.out;
    if (state !== 'active') return [];
    const s = this.sprite;
    if (attack === 'stomp') {
      const x = facing > 0 ? s.x + 20 : s.x - 180;
      return [{ rect: R(x, GROUND_Y - 44, 160, 44), damage: this.stats.damage, fromX: s.x }];
    }
    if (attack === 'tail') {
      const x = facing > 0 ? s.x - 200 : s.x + 40;
      return [{ rect: R(x, GROUND_Y - 70, 160, 70), damage: this.stats.tailDamage, fromX: s.x }];
    }
    return [];
  }
}

// ------------------------------------------------------------------ projéteis e perigos

/** Projétil em arco até (tx, ty). Registrado na cena em scene.hazards. */
export function spawnProjectile(scene, key, x, y, tx, ty, flightMs, opts) {
  const p = scene.physics.add.image(x, y, key).setDepth(25);
  const v = arcVelocity(x, y, tx, ty, flightMs, MOVE.gravity);
  p.body.setCircle(opts.radius, p.width / 2 - opts.radius, p.height / 2 - opts.radius);
  p.body.setVelocity(v.vx, v.vy);
  const hz = {
    kind: key,
    sprite: p,
    damage: opts.damage,
    destroyable: opts.destroyable,
    reflectable: !!opts.reflectable,
    fromAbove: !!opts.fromAbove,
    dead: false,
    born: scene.time.now,
    box: () => R(p.body.x, p.body.y, p.body.width, p.body.height),
    update() {
      p.rotation += 0.15;
      if (p.y >= GROUND_Y - 6 || scene.time.now - hz.born > 3000) {
        opts.onGround?.(p.x);
        scene.events.emit('hazard-ground', key, p.x);
        hz.kill();
      }
    },
    kill() {
      if (hz.dead) return;
      hz.dead = true;
      p.destroy();
    },
  };
  scene.hazards.push(hz);
  return hz;
}

export function spawnShockwave(scene, x, dir, stats) {
  const img = scene.add.image(x, GROUND_Y + 2, 'shockwave').setOrigin(0.5, 1).setDepth(24).setFlipX(dir < 0);
  const hz = {
    kind: 'shockwave',
    sprite: img,
    damage: stats.shockDamage,
    destroyable: false,
    persistent: true, // continua depois de acertar
    dead: false,
    born: scene.time.now,
    box: () => R(img.x - 24, GROUND_Y - stats.shockHeight, 48, stats.shockHeight),
    update(dt) {
      img.x += dir * stats.shockSpeed * dt;
      const age = scene.time.now - hz.born;
      img.setAlpha(Math.max(0, 1 - age / 1800)).setScale(1 + age / 2400, 1);
      if (age > 1800) hz.kill();
    },
    kill() {
      if (hz.dead) return;
      hz.dead = true;
      img.destroy();
    },
  };
  scene.hazards.push(hz);
  return hz;
}

export function spawnFirePatch(scene, x, damage) {
  const img = scene.add.image(x, GROUND_Y + 4, 'firepatch').setOrigin(0.5, 1).setDepth(23).setScale(1, 0.2);
  scene.tweens.add({ targets: img, scaleY: 1, duration: 140, ease: 'Back.out' });
  const hz = {
    kind: 'fire',
    sprite: img,
    damage,
    destroyable: false,
    persistent: true,
    dead: false,
    born: scene.time.now,
    box: () => R(img.x - 26, GROUND_Y - 18, 52, 18),
    update() {
      const age = scene.time.now - hz.born;
      img.setAlpha(0.85 + Math.sin(age / 40) * 0.15);
      if (age > 1100) {
        hz.dead = true;
        scene.tweens.add({ targets: img, alpha: 0, scaleY: 0.2, duration: 200, onComplete: () => img.destroy() });
      }
    },
    kill() {
      hz.dead = true;
      img.destroy();
    },
  };
  scene.hazards.push(hz);
  return hz;
}
