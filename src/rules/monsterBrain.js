// Cérebros dos inimigos da Fase 2. Módulo puro (sem Phaser), testável com node --test.
// Regra de justiça (skill game-ai): todo ataque tem um aviso visível (windup)
// e, depois dele, uma janela em que o inimigo fica vulnerável (recover).

// ------------------------------------------------------------------ Morcego
// hover -> windup (para e treme) -> swoop (mergulho em linha reta) -> recover (volta a subir)

export function createBatBrain(homeX, hoverY) {
  return { state: 'hover', timer: 600, t: Math.random() * 6, homeX, hoverY, target: null, dir: 1 };
}

export function stepBat(b, ctx, stats) {
  const { x, y, heroX, heroY, dtMs, active, heroAlive } = ctx;
  const dt = dtMs / 1000;
  b.timer -= dtMs;
  b.t += dt;
  const toward = (tx, ty, speed) => {
    const dx = tx - x;
    const dy = ty - y;
    const d = Math.hypot(dx, dy) || 1;
    const s = Math.min(speed, d / Math.max(dt, 1e-3));
    return { vx: (dx / d) * s, vy: (dy / d) * s };
  };

  switch (b.state) {
    case 'hover': {
      // no ar, acompanha o herói de longe e balança
      if (active && heroAlive) b.homeX += Math.sign(heroX - b.homeX) * Math.min(Math.abs(heroX - b.homeX), 90 * dt);
      const v = toward(b.homeX + Math.sin(b.t * 1.3) * 55, b.hoverY + Math.sin(b.t * 2.6) * 12, stats.hoverSpeed);
      b.dir = Math.sign(heroX - x) || b.dir;
      if (active && heroAlive && b.timer <= 0 && Math.abs(heroX - x) < stats.aggroRange) {
        b.state = 'windup';
        b.timer = stats.windupMs;
        b.target = { x: heroX, y: heroY };
      }
      return { ...v, attacking: false, facing: b.dir };
    }
    case 'windup':
      if (b.timer <= 0) {
        const dx = b.target.x - x;
        const dy = b.target.y - y;
        const d = Math.hypot(dx, dy) || 1;
        b.state = 'swoop';
        b.timer = (d / stats.swoopSpeed) * 1000 + 220; // passa um pouco do alvo
        b.vel = { vx: (dx / d) * stats.swoopSpeed, vy: (dy / d) * stats.swoopSpeed };
        b.dir = Math.sign(dx) || b.dir;
        return { ...b.vel, attacking: true, facing: b.dir };
      }
      return { vx: 0, vy: 0, attacking: false, facing: b.dir };
    case 'swoop':
      if (b.timer <= 0 || y >= ctx.groundY - 24) {
        b.state = 'recover';
        b.timer = stats.recoverMs;
        b.homeX = x;
        return { vx: 0, vy: 0, attacking: false, facing: b.dir };
      }
      return { ...b.vel, attacking: true, facing: b.dir };
    case 'recover': {
      // sobe devagar: é a hora de acertar sem pular
      const v = toward(b.homeX, b.hoverY, 90);
      if (b.timer <= 0) {
        b.state = 'hover';
        b.timer = stats.cooldownMs;
      }
      return { ...v, attacking: false, facing: b.dir };
    }
    case 'hurt':
      if (b.timer <= 0) {
        b.state = 'recover';
        b.timer = stats.recoverMs * 0.6;
      }
      return { vx: null, vy: null, attacking: false, facing: b.dir };
    case 'dead':
    default:
      return { vx: 0, vy: 0, attacking: false, facing: b.dir };
  }
}

// ------------------------------------------------------------------ Planta
// idle -> windup (infla) -> shoot (cospe um esporo em arco) | bite (morde quem chega perto)

export function createPlantBrain() {
  return { state: 'idle', timer: 900, kind: null };
}

/** @returns {{attacking:boolean, shoot:boolean, state:string, facing:number}} */
export function stepPlant(b, ctx, stats) {
  const { dx, dtMs, active, heroAlive } = ctx;
  b.timer -= dtMs;
  const facing = Math.sign(dx) || 1;
  const dist = Math.abs(dx);
  switch (b.state) {
    case 'idle':
      if (active && heroAlive) {
        if (dist < stats.biteRange) {
          b.state = 'windup';
          b.kind = 'bite';
          b.timer = stats.windupMs * 0.7;
        } else if (dist < stats.range && b.timer <= 0) {
          b.state = 'windup';
          b.kind = 'shoot';
          b.timer = stats.windupMs;
        }
      }
      return { attacking: false, shoot: false, state: b.state, facing };
    case 'windup':
      if (b.timer > 0) return { attacking: false, shoot: false, state: b.state, facing };
      if (b.kind === 'bite') {
        b.state = 'bite';
        b.timer = 240;
        return { attacking: true, shoot: false, state: b.state, facing };
      }
      b.state = 'recover';
      b.timer = 450;
      return { attacking: false, shoot: true, state: b.state, facing };
    case 'bite':
      if (b.timer <= 0) {
        b.state = 'recover';
        b.timer = 700;
      }
      return { attacking: b.state === 'bite', shoot: false, state: b.state, facing };
    case 'recover':
    case 'hurt':
      if (b.timer <= 0) {
        b.state = 'idle';
        b.timer = stats.shootEveryMs;
      }
      return { attacking: false, shoot: false, state: b.state, facing };
    default:
      return { attacking: false, shoot: false, state: b.state, facing };
  }
}

/**
 * Velocidade inicial de um projétil em arco que sai de (x0,y0) e cai em (x1,y1)
 * depois de `ms` milissegundos, com gravidade `g` (px/s²).
 */
export function arcVelocity(x0, y0, x1, y1, ms, g) {
  const t = ms / 1000;
  return { vx: (x1 - x0) / t, vy: (y1 - y0 - 0.5 * g * t * t) / t };
}

// ------------------------------------------------------------------ Colosso de Magma
// walk -> windup(ataque) -> active -> recover -> walk
// Ataques: stomp (perto, à frente: ondas de choque pelo chão), bolts (longe: chuva de lava),
// tail (herói atrás dele: rabada). Vira devagar, então ficar atrás é uma estratégia,
// mas a rabada pune quem fica parado lá.

export function createKaijuBrain() {
  return { state: 'idle', timer: 800, facing: -1, attack: null, behindMs: 0, cycle: 0, fired: false };
}

export function isEnraged(hpRatio, stats) {
  return hpRatio <= stats.enragedAt;
}

/** Escolhe o próximo ataque. Puro e determinístico (alterna pelo contador `cycle`). */
export function chooseKaijuAttack(b, dx, stats) {
  const dist = Math.abs(dx);
  const behind = Math.sign(dx) !== b.facing && dist > 20;
  if (behind && dist < stats.tailRange) return 'tail';
  if (!behind && dist < stats.stompRange) return 'stomp';
  return b.cycle % 3 === 2 ? null : 'bolts'; // de vez em quando só avança
}

/**
 * @returns {{vx:number, facing:number, state:string, attack:string|null, fire:string|null}}
 *   fire: nome do ataque no instante em que ele dispara (uma vez por ataque)
 */
export function stepKaiju(b, ctx, stats) {
  const { dx, dtMs, active, heroAlive, hpRatio } = ctx;
  const enraged = isEnraged(hpRatio, stats);
  const pace = enraged ? 0.75 : 1;
  b.timer -= dtMs;
  const out = (vx, fire = null) => ({ vx, facing: b.facing, state: b.state, attack: b.attack, fire, enraged });

  if (b.state === 'dead') return out(0);
  if (!active || !heroAlive) {
    b.state = 'idle';
    return out(0);
  }

  switch (b.state) {
    case 'idle':
    case 'walk': {
      // virar demora: o herói atrás dele tem uma janela
      const behind = Math.sign(dx) !== b.facing && Math.abs(dx) > 20;
      b.behindMs = behind ? b.behindMs + dtMs : 0;
      // perto e atrás: não vira, prepara a rabada; longe e atrás: vira depois do atraso
      if (b.behindMs >= stats.turnDelayMs && Math.abs(dx) >= stats.tailRange) {
        b.facing = -b.facing;
        b.behindMs = 0;
      }
      if (b.timer <= 0) {
        const attack = chooseKaijuAttack(b, dx, stats);
        b.cycle += 1;
        if (attack) {
          b.state = 'windup';
          b.attack = attack;
          b.timer = stats.windup[attack] * pace;
          b.fired = false;
          return out(0);
        }
        b.timer = 900;
      }
      b.state = 'walk';
      const far = Math.abs(dx) > 170 && !behind;
      return out(far ? b.facing * stats.walkSpeed * (enraged ? 1.4 : 1) : 0);
    }
    case 'windup':
      if (b.timer <= 0) {
        b.state = 'active';
        b.timer = stats.activeMs[b.attack];
        b.fired = true;
        return out(0, b.attack);
      }
      return out(0);
    case 'active':
      if (b.timer <= 0) {
        b.state = 'recover';
        b.timer = stats.recoverMs * (enraged ? 0.8 : 1);
      }
      return out(0);
    case 'recover':
      if (b.timer <= 0) {
        b.state = 'walk';
        b.attack = null;
        b.timer = stats.cooldownMs * pace;
      }
      return out(0);
    default:
      return out(0);
  }
}
