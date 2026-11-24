import { DINOS, HERO, createFighter, applyDamage } from '../rules/combat.js';
import { createBrain, stepBrain, hurtBrain, killBrain } from '../rules/dinoBrain.js';

let nextId = 1;

export default class Dino {
  constructor(scene, type, x, groundY, encounter) {
    this.id = nextId++;
    this.scene = scene;
    this.type = type;
    this.stats = DINOS[type];
    this.encounter = encounter;
    this.fighter = createFighter(this.stats.maxHp);
    this.brain = createBrain(x);
    this.brain.timer = 800 + Math.random() * 800;
    this.attacking = false;
    this.hitsTaken = 0;

    const { size, body } = this.stats;
    this.sprite = scene.physics.add.sprite(x, groundY - size.h / 2, type, 'walk0').setDepth(9);
    this.sprite.body.setSize(body.w, body.h).setOffset(body.ox, body.oy);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.play(`${type}-walk`);
    this.sprite.setData('dino', this);

    this.bar = scene.add.graphics().setDepth(20);
  }

  get alive() {
    return !this.fighter.dead;
  }

  bounds() {
    const b = this.sprite.body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  }

  update(heroX, heroAlive, activeEncounterId, dtMs) {
    if (!this.alive) return;
    const s = this.sprite;
    const active = activeEncounterId === this.encounter.id;
    const out = stepBrain(this.brain, { dx: heroX - s.x, dtMs, heroAlive, active }, this.stats);

    // patrulha não sai da própria área
    if (this.brain.state === 'patrol') {
      if (s.x < this.encounter.x0 + 80) this.brain.dir = 1;
      if (s.x > this.encounter.x1 - 80) this.brain.dir = -1;
    }

    if (out.vx !== null) s.body.setVelocityX(out.vx);
    this.attacking = out.attacking;
    s.setFlipX(out.facing < 0);

    const st = this.brain.state;
    if (st === 'windup' || st === 'lunge') {
      s.anims.stop();
      s.setTexture(this.type, 'windup');
      // tremidinha de aviso antes do bote
      s.setX(s.x + (st === 'windup' ? Math.sin(this.scene.time.now / 25) * 0.8 : 0));
    } else if (st === 'recover' || st === 'hurt') {
      s.anims.pause();
    } else if (!s.anims.isPlaying || s.anims.currentAnim?.key !== `${this.type}-walk`) {
      s.play(`${this.type}-walk`);
    }

    this.drawBar();
  }

  drawBar() {
    const g = this.bar;
    g.clear();
    if (!this.alive || this.stats.boss || this.fighter.hp === this.fighter.maxHp) return;
    const b = this.sprite.body;
    const w = Math.max(40, b.width * 0.8);
    const x = b.center.x - w / 2;
    const y = b.y - 14;
    g.fillStyle(0x1d1d28, 0.7).fillRect(x - 1, y - 1, w + 2, 7);
    g.fillStyle(0xe5394a).fillRect(x, y, (w * this.fighter.hp) / this.fighter.maxHp, 5);
  }

  /** Golpe da espada. Retorna o resultado do dano. */
  takeHit(fromX, now) {
    const r = applyDamage(this.fighter, HERO.swordDamage, now, 0);
    if (!r.hit) return r;
    const s = this.sprite;
    const away = Math.sign(s.x - fromX) || 1;
    if (this.brain.state !== 'lunge') s.body.setVelocity(away * this.stats.knockbackTaken, -this.stats.knockbackTaken * 0.6);
    s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(90, () => s.active && s.clearTint());
    if (r.died) this.die(away);
    else if (++this.hitsTaken % this.stats.poise === 0) hurtBrain(this.brain, 260);
    return r;
  }

  die(away) {
    killBrain(this.brain);
    this.bar.clear();
    const s = this.sprite;
    s.anims.stop();
    s.body.enable = false;
    this.scene.tweens.add({
      targets: s,
      angle: away * -90 * (s.flipX ? -1 : 1),
      alpha: 0,
      y: s.y - 10,
      duration: 700,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        s.destroy();
        this.bar.destroy();
      },
    });
  }
}
