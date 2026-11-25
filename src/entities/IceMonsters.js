// Inimigos da Fase 3 e seus projéteis. Decisões em src/rules/iceBrain.js;
// aqui só física, animação e desenho.
import { GROUND_Y } from '../rules/level.js';
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
  shardTargets,
  reflectVelocity,
} from '../rules/iceBrain.js';
import { Enemy, spawnProjectile } from './Monsters.js';

const R = (x, y, w, h) => new Phaser.Geom.Rectangle(x, y, w, h);

// ------------------------------------------------------------------ Yeti filhote

export class Yeti extends Enemy {
  constructor(scene, x, encounter) {
    super(scene, 'yeti', encounter);
    this.brain = createYetiBrain();
    const { size, body } = this.stats;
    this.sprite = scene.physics.add.sprite(x, GROUND_Y - size.h / 2 + 2, 'yeti', 'idle0').setDepth(9);
    this.sprite.body.setAllowGravity(false).setImmovable(true);
    this.sprite.body.setSize(body.w, body.h).setOffset(body.ox, body.oy);
    this.sprite.play('yeti-idle');
    this.baseX = x;
    this.facing = -1;
    this.slapping = false;
  }

  update(ctx) {
    if (!this.alive) return;
    const s = this.sprite;
    const out = stepYeti(this.brain, { dx: ctx.heroX - s.x, dtMs: ctx.dtMs, active: ctx.activeId === this.encounter.id, heroAlive: ctx.heroAlive }, this.stats);
    this.facing = out.facing;
    s.setFlipX(out.facing < 0);
    this.slapping = out.attacking;
    const st = this.brain.state;
    s.x = this.baseX;
    if (st === 'windup') {
      s.anims.stop();
      s.setFrame(this.brain.kind === 'slap' ? 'slap' : 'windup');
      s.x += Math.sin(ctx.now / 25) * 1.2;
    } else if (st === 'slap' || (st === 'recover' && this.brain.timer > 250)) {
      s.anims.stop();
      s.setFrame(this.brain.kind === 'slap' ? 'slap' : 'throw');
    } else if (!s.anims.isPlaying) {
      s.play('yeti-idle');
    }
    if (out.throwBall) {
      spawnProjectile(this.scene, 'snowball', s.x + this.facing * 10, s.y - 38, ctx.heroX, GROUND_Y - 30, this.stats.ballFlightMs, {
        damage: this.stats.ballDamage,
        destroyable: true,
        radius: 8,
      });
    }
    this.drawBar();
  }

  attackBoxes() {
    if (!this.slapping) return [];
    const s = this.sprite;
    return [{ rect: R(s.x + (this.facing > 0 ? 0 : -76), s.y - 30, 76, 50), damage: this.stats.damage, fromX: s.x }];
  }

  resetBrain() {
    this.brain = createYetiBrain();
  }
}

// ------------------------------------------------------------------ Pinguim escorregadio

export class Penguin extends Enemy {
  constructor(scene, x, encounter) {
    super(scene, 'penguin', encounter);
    this.brain = createPenguinBrain();
    const { size, body } = this.stats;
    this.sprite = scene.physics.add.sprite(x, GROUND_Y - size.h / 2, 'penguin', 'walk0').setDepth(9);
    this.sprite.body.setSize(body.w, body.h).setOffset(body.ox, body.oy);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.play('penguin-walk');
    this.attacking = false;
    this.walker = true; // colide com chão e cercas
  }

  update(ctx) {
    if (!this.alive) return;
    const s = this.sprite;
    const b = s.body;
    const hitWall = this.brain.state === 'slide' && (b.blocked.left || b.blocked.right || b.touching.left || b.touching.right);
    const out = stepPenguin(this.brain, { dx: ctx.heroX - s.x, dtMs: ctx.dtMs, active: ctx.activeId === this.encounter.id, heroAlive: ctx.heroAlive, hitWall }, this.stats);
    if (this.brain.state === 'walk') {
      if (s.x < this.encounter.x0 + 70) this.brain.dir = 1;
      if (s.x > this.encounter.x1 - 70) this.brain.dir = -1;
    }
    if (out.vx !== null) b.setVelocityX(out.vx);
    this.attacking = out.attacking;
    s.setFlipX(out.facing < 0);
    const st = this.brain.state;
    if (st === 'walk') {
      if (!s.anims.isPlaying) s.play('penguin-walk');
    } else {
      s.anims.stop();
      s.setFrame(st === 'crouch' ? 'crouch' : st === 'slide' ? 'slide' : st === 'dizzy' ? 'dizzy' : 'walk0');
      if (st === 'crouch') s.x += Math.sin(ctx.now / 22) * 1.2;
      if (st === 'slide' && Math.random() < 0.4) this.scene.dust?.explode(1, s.x - out.facing * 20, GROUND_Y - 2);
    }
    this.drawBar();
  }

  attackBoxes() {
    return this.attacking ? [{ rect: this.bounds(), damage: this.stats.damage, fromX: this.sprite.x }] : [];
  }

  onHurt(fromX) {
    if (this.brain.state === 'dizzy') return; // tonto continua tonto
    const away = Math.sign(this.sprite.x - fromX) || 1;
    this.sprite.body.setVelocity(away * this.stats.knockbackTaken, -120);
    this.brain.state = 'hurt';
    this.brain.timer = 300;
  }

  resetBrain() {
    this.brain = createPenguinBrain();
  }
}

// ------------------------------------------------------------------ Ptero de gelo

export class Ptero extends Enemy {
  constructor(scene, x, encounter) {
    super(scene, 'ptero', encounter);
    this.hoverY = GROUND_Y - this.stats.hoverHeight;
    this.brain = createPteroBrain(x, this.hoverY);
    this.sprite = scene.physics.add.sprite(x, this.hoverY, 'ptero', 'fly0').setDepth(11);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setSize(this.stats.body.w, this.stats.body.h).setOffset(this.stats.body.ox, this.stats.body.oy);
    this.sprite.play('ptero-fly');
    this.marker = null;
  }

  update(ctx) {
    if (!this.alive) {
      this.clearMarker();
      return;
    }
    const s = this.sprite;
    const out = stepPtero(this.brain, { x: s.x, y: s.y, heroX: ctx.heroX, dtMs: ctx.dtMs, active: ctx.activeId === this.encounter.id, heroAlive: ctx.heroAlive }, this.stats);
    if (out.vx !== null) s.body.setVelocity(out.vx, out.vy);
    s.setFlipX(out.facing < 0);
    if (out.warnX !== null) {
      // sombra no chão: aviso de onde o pingente vai cair
      if (!this.marker) {
        this.marker = this.scene.add.image(out.warnX, GROUND_Y + 2, 'shadow').setDepth(7).setTint(0x3a6ad8).setScale(0.3, 1.4);
        this.scene.tweens.add({ targets: this.marker, scaleX: 0.9, duration: this.stats.warnMs, ease: 'Sine.in' });
      }
      s.anims.stop();
      s.setFrame('warn');
    } else if (!s.anims.isPlaying) {
      s.play('ptero-fly');
    }
    if (out.drop !== null) {
      this.clearMarker();
      dropIcicle(this.scene, out.drop, s.y + 20, this.stats.icicleDamage);
    }
    this.drawBar();
  }

  clearMarker() {
    this.marker?.destroy();
    this.marker = null;
  }

  onHurt(fromX) {
    const away = Math.sign(this.sprite.x - fromX) || 1;
    this.sprite.body.setVelocity(away * this.stats.knockbackTaken, -140);
    this.clearMarker();
    this.brain.state = 'hurt';
    this.brain.timer = 280;
  }

  die(away) {
    this.clearMarker();
    super.die(away);
  }

  resetBrain() {
    this.clearMarker();
    this.brain = createPteroBrain(this.sprite.x, this.hoverY);
  }
}

// ------------------------------------------------------------------ Serpente de Cristal

export class Serpent extends Enemy {
  constructor(scene, x, encounter) {
    super(scene, 'serpent', encounter);
    this.holes = encounter.holes;
    this.brain = createSerpentBrain(this.holes, Math.max(0, this.holes.indexOf(x)));
    this.holeImgs = this.holes.map((hx) => scene.add.image(hx, GROUND_Y + 10, 'icehole').setOrigin(0.5, 1).setDepth(6));
    this.sprite = scene.physics.add.sprite(x, GROUND_Y + 6, 'serpent', 'up0').setOrigin(0.5, 1).setDepth(9);
    this.sprite.body.setAllowGravity(false).setImmovable(true);
    this.setBody('up');
    this.sprite.setVisible(false);
    this.out = { state: 'hidden' };
    this.prevState = 'hidden';
  }

  get hpRatio() {
    return this.fighter.hp / this.fighter.maxHp;
  }

  setBody(kind) {
    const b = kind === 'low' ? this.stats.bodyLow : this.stats.bodyUp;
    this.sprite.body.setSize(b.w, b.h).setOffset(b.ox, b.oy);
  }

  update(ctx) {
    if (!this.alive) return;
    const s = this.sprite;
    const b = this.brain;
    if (b.state === 'lunge') b.x = s.x;
    const out = stepSerpent(b, { heroX: ctx.heroX, dtMs: ctx.dtMs, active: ctx.activeId === this.encounter.id, heroAlive: ctx.heroAlive, hpRatio: this.hpRatio }, this.stats);
    this.out = out;
    const changed = out.state !== this.prevState;
    this.prevState = out.state;
    s.setFlipX(out.facing < 0);
    s.body.setVelocityX(out.vx);

    if (changed) this.enter(out, ctx);
    if (out.state === 'emerging') {
      // o buraco treme e solta neve: aviso de onde ela vai sair
      const img = this.holeImgs[b.hole];
      img.x = this.holes[b.hole] + Math.sin(ctx.now / 30) * 2;
      if (Math.random() < 0.3) this.scene.snow?.explode(2, img.x + (Math.random() - 0.5) * 80, GROUND_Y);
    }
    if (out.state === 'windup') {
      s.x = b.x + Math.sin(ctx.now / 28) * 1.6;
      if (!s.isTinted) s.setTint(out.enraged ? 0xd0a0ff : 0xc8e0ff).setTintMode(Phaser.TintModes.MULTIPLY);
    } else if (s.isTinted && s.tintMode !== Phaser.TintModes.FILL) {
      s.clearTint();
    }
    if (out.fire === 'shards') this.castShards(ctx, out.enraged);
  }

  enter(out, ctx) {
    const s = this.sprite;
    const st = out.state;
    if (st === 'emerging') {
      this.holeImgs.forEach((img, i) => (img.x = this.holes[i]));
    } else if (st === 'up') {
      this.holeImgs.forEach((img, i) => (img.x = this.holes[i]));
      s.anims.stop();
      s.setPosition(out.x, GROUND_Y + 6).setVisible(true).setAlpha(1).setScale(1, 0.05);
      this.setBody('up');
      s.body.enable = true;
      s.body.reset(out.x, GROUND_Y + 6);
      this.scene.tweens.add({ targets: s, scaleY: 1, duration: 260, ease: 'Back.out' });
      this.scene.snow?.explode(16, out.x, GROUND_Y);
      this.scene.cameras.main.shake(200, 0.006);
      s.play('serpent-idle');
    } else if (st === 'windup') {
      s.anims.stop();
      s.setFrame(out.attack === 'shards' ? 'cast' : 'up0');
    } else if (st === 'cast') {
      s.setFrame('cast');
    } else if (st === 'lunge') {
      s.setFrame('lunge');
      this.setBody('low');
      this.scene.snow?.explode(10, s.x, GROUND_Y);
    } else if (st === 'stuck') {
      s.setFrame('stuck');
      this.scene.cameras.main.shake(180, 0.008);
      this.scene.popText(s.x + out.facing * 60, s.y - 90, 'presa! ataque!', '#ffe07a', 18);
    } else if (st === 'submerge') {
      this.scene.tweens.add({
        targets: s,
        scaleY: 0.05,
        duration: this.stats.submergeMs,
        ease: 'Back.in',
        onComplete: () => s.active && s.setVisible(false),
      });
      this.scene.snow?.explode(12, s.x, GROUND_Y);
    } else if (st === 'hidden') {
      s.setVisible(false);
      s.body.enable = false;
    }
  }

  castShards(ctx, enraged) {
    const st = this.stats;
    for (const tx of shardTargets(ctx.heroX, enraged, st.shardSpread)) {
      const x = Phaser.Math.Clamp(tx, this.encounter.x0 + 30, this.encounter.x1 - 30);
      dropShard(this.scene, x, st, this);
    }
    this.scene.cameras.main.shake(160, 0.005);
  }

  takeHit(fromX, now) {
    if (!serpentVulnerable(this.brain)) return { hit: false, died: false, amount: 0 };
    return super.takeHit(fromX, now);
  }

  attackBoxes() {
    if (!this.out.attacking) return [];
    return [{ rect: this.bounds(), damage: this.stats.lungeDamage, fromX: this.sprite.x }];
  }

  resetBrain() {
    this.brain = createSerpentBrain(this.holes, 1);
    this.prevState = 'up';
    this.sprite.setVisible(false);
    this.sprite.body.enable = false;
    this.out = { state: 'hidden' };
  }

  die(away) {
    this.holeImgs.forEach((img) => this.scene.tweens.add({ targets: img, alpha: 0.3, duration: 800 }));
    this.brain.state = 'dead';
    this.bar.clear();
    const s = this.sprite;
    s.anims.stop();
    s.body.enable = false;
    // vira cristais que se desfazem
    this.scene.tweens.add({
      targets: s,
      alpha: 0,
      scaleY: 0.3,
      angle: away * 10,
      duration: 1100,
      ease: 'Cubic.in',
      onComplete: () => {
        s.destroy();
        this.bar.destroy();
      },
    });
    this.scene.shardBurst?.explode(40, s.x, s.y - 80);
  }
}

// ------------------------------------------------------------------ projéteis que caem do céu

/** Pingente de gelo: cai reto de onde está o ptero. */
export function dropIcicle(scene, x, y, damage) {
  const p = scene.physics.add.image(x, y, 'icicle').setDepth(25);
  p.body.setSize(10, 30).setVelocity(0, 60);
  const hz = {
    kind: 'icicle',
    sprite: p,
    damage,
    fromAbove: true,
    destroyable: true,
    dead: false,
    box: () => R(p.body.x, p.body.y, p.body.width, p.body.height),
    update() {
      if (p.y >= GROUND_Y - 14) {
        scene.events.emit('hazard-ground', 'icicle', p.x);
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

/**
 * Estilhaço da Serpente: uma marca brilha no chão (aviso) e o estilhaço cai.
 * Se o herói estiver segurando o escudo, ele volta e acerta a Serpente.
 */
export function dropShard(scene, x, stats, serpent) {
  const marker = scene.add.image(x, GROUND_Y + 2, 'shadow').setDepth(7).setTint(0x8af0ff).setBlendMode('ADD').setScale(0.2, 1.3);
  scene.tweens.add({ targets: marker, scaleX: 0.8, alpha: { from: 0.4, to: 1 }, duration: stats.markerMs, ease: 'Sine.in' });
  scene.time.delayedCall(stats.markerMs, () => {
    marker.destroy();
    if (!scene.sys.isActive()) return;
    const p = scene.physics.add.image(x, GROUND_Y - 320, 'shard').setDepth(25);
    p.body.setAllowGravity(false).setSize(12, 28).setVelocity(0, stats.shardFallSpeed);
    const hz = {
      kind: 'shard',
      sprite: p,
      damage: stats.shardDamage,
      fromAbove: true,
      reflectable: true,
      friendly: false, // vira true quando o escudo devolve
      destroyable: false,
      dead: false,
      born: scene.time.now,
      box: () => R(p.body.x, p.body.y, p.body.width, p.body.height),
      reflect(fromX, fromY) {
        hz.friendly = true;
        const t = serpent.alive && serpent.sprite.visible ? serpent.bounds() : null;
        const tx = t ? t.centerX : fromX + (Math.random() - 0.5) * 200;
        const ty = t ? t.centerY : fromY - 300;
        const v = reflectVelocity(fromX, fromY, tx, ty, stats.reflectSpeed);
        p.body.setVelocity(v.vx, v.vy);
        p.setRotation(Math.atan2(v.vy, v.vx) - Math.PI / 2);
        p.setTint(0xfff0a0);
      },
      update() {
        if ((!hz.friendly && p.y >= GROUND_Y - 16) || p.y < -60 || scene.time.now - hz.born > 4000) {
          if (!hz.friendly) scene.events.emit('hazard-ground', 'shard', p.x);
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
  });
}

