import { HERO, createFighter, applyDamage, heal, jumpVelocity } from '../rules/combat.js';

// Sensação do pulo (skill `platformer`): coyote time, buffer, pulo variável,
// gravidade maior na queda e velocidade máxima de queda.
export const MOVE = {
  runSpeed: 240,
  accelGround: 2600, // chega na velocidade máxima em ~0,09 s
  accelAir: 1700, // 0,65x do chão
  gravity: 1500,
  fallGravityExtra: 1100, // queda ~1,7x mais pesada que a subida
  jumpHeight: 125,
  jumpCut: 0.5,
  maxFall: 900,
  coyoteMs: 100,
  bufferMs: 120,
};

export default class Hero {
  constructor(scene, x, y) {
    this.scene = scene;
    this.fighter = createFighter(HERO.maxHp);
    this.facing = 1;
    this.lastGroundAt = -1e9;
    this.lastJumpPressAt = -1e9;
    this.attackReadyAt = 0;
    this.attack = null; // { startedAt, hitIds:Set }
    this.landed = true;

    this.sprite = scene.physics.add.sprite(x, y, 'hero-idle').setDepth(10);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.body.setSize(20, 48).setOffset(14, 16);
    this.sprite.body.setMaxVelocityY(MOVE.maxFall);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.play('hero-idle');

    this.sword = scene.add.image(x, y, 'sword').setOrigin(0.12, 0.5).setDepth(11);
    this.slash = scene.add.image(x, y, 'slash').setDepth(12).setVisible(false).setBlendMode('ADD');
  }

  get x() {
    return this.sprite.x;
  }

  get alive() {
    return !this.fighter.dead;
  }

  /** Retângulo de acerto da espada (só existe na janela ativa do golpe). */
  swordHitbox(now) {
    if (!this.attack) return null;
    const t = now - this.attack.startedAt;
    if (t < HERO.attackWindupMs || t > HERO.attackWindupMs + HERO.attackActiveMs) return null;
    const w = 78;
    const h = 64;
    const cx = this.sprite.x + this.facing * 42;
    return new Phaser.Geom.Rectangle(cx - w / 2, this.sprite.y - 66, w, h);
  }

  update(input, now, dt) {
    const s = this.sprite;
    const body = s.body;
    if (!this.alive) {
      this.sword.setVisible(false);
      return;
    }

    const onGround = body.blocked.down;
    if (onGround && body.velocity.y >= 0) {
      this.lastGroundAt = now;
      if (!this.landed) {
        this.landed = true;
        this.scene.events.emit('hero-landed', s.x, s.y);
      }
    } else if (!onGround) {
      this.landed = false;
    }

    // corrida com aceleração
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir !== 0 && !this.attack) this.facing = dir;
    const target = dir * MOVE.runSpeed * (this.attack && onGround ? 0.35 : 1);
    const accel = onGround ? MOVE.accelGround : MOVE.accelAir;
    const vx = body.velocity.x;
    const step = accel * dt;
    body.setVelocityX(Math.abs(target - vx) <= step ? target : vx + Math.sign(target - vx) * step);

    // pulo com buffer + coyote
    if (input.jumpPressed) this.lastJumpPressAt = now;
    if (now - this.lastJumpPressAt <= MOVE.bufferMs && now - this.lastGroundAt <= MOVE.coyoteMs) {
      body.setVelocityY(jumpVelocity(MOVE.jumpHeight, MOVE.gravity));
      this.lastJumpPressAt = this.lastGroundAt = -1e9;
      if (!input.jumpHeld) body.velocity.y *= MOVE.jumpCut;
      this.scene.events.emit('hero-jumped', s.x, s.y);
    }
    if (input.jumpReleased && body.velocity.y < 0) body.velocity.y *= MOVE.jumpCut;
    body.setGravityY(body.velocity.y > 0 ? MOVE.fallGravityExtra : 0);

    // ataque
    if (input.attackPressed && now >= this.attackReadyAt) this.startAttack(now);
    if (this.attack && now - this.attack.startedAt > HERO.attackCooldownMs) this.attack = null;

    // animação
    if (this.attack) s.anims.stop(), s.setTexture('hero-attack');
    else if (!onGround) s.anims.stop(), s.setTexture('hero-jump');
    else if (Math.abs(body.velocity.x) > 30) s.anims.currentAnim?.key !== 'hero-run' && s.play('hero-run');
    else s.anims.currentAnim?.key !== 'hero-idle' && s.play('hero-idle');
    s.setFlipX(this.facing < 0);

    // piscar durante invencibilidade
    s.setAlpha(now < this.fighter.invulnUntil ? (Math.floor(now / 70) % 2 ? 0.35 : 1) : 1);

    this.placeSword(now);
  }

  startAttack(now) {
    this.attack = { startedAt: now, hitIds: new Set() };
    this.attackReadyAt = now + HERO.attackCooldownMs;
    this.scene.events.emit('hero-swing');
  }

  placeSword(now) {
    const s = this.sprite;
    const f = this.facing;
    let angle = -1.1; // em repouso: lâmina levantada à frente
    let handX = 8;
    let handY = -27;
    if (this.attack) {
      const t = Math.min(1, (now - this.attack.startedAt) / (HERO.attackWindupMs + HERO.attackActiveMs));
      const eased = 1 - Math.pow(1 - t, 3);
      angle = -2.3 + eased * 3.4; // arco de trás/cima para frente/baixo
      handX = 10;
      handY = -45 + eased * 10;
    }
    this.sword.setVisible(true).setAlpha(s.alpha);
    this.sword.setPosition(s.x + f * handX, s.y + handY);
    this.sword.setScale(f, 1).setRotation(f * angle);

    const active = this.swordHitbox(now);
    this.slash.setVisible(!!active);
    if (active) {
      this.slash.setPosition(s.x + f * 30, s.y - 36).setScale(f * 0.8, 0.8).setAlpha(0.85);
    }
  }

  takeHit(amount, fromX, now) {
    const r = applyDamage(this.fighter, amount, now, HERO.invulnMs);
    if (!r.hit) return r;
    const away = Math.sign(this.sprite.x - fromX) || -this.facing;
    this.sprite.body.setVelocity(away * HERO.knockback.x, HERO.knockback.y);
    this.attack = null;
    if (r.died) this.die();
    return r;
  }

  heal(amount) {
    return heal(this.fighter, amount);
  }

  die() {
    const s = this.sprite;
    s.anims.stop();
    s.setTexture('hero-dead').setAlpha(1).setFlipX(this.facing < 0);
    s.body.setSize(40, 20).setOffset(12, 12);
    s.body.setVelocityX(0);
    this.sword.setVisible(false);
    this.slash.setVisible(false);
  }
}
