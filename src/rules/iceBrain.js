// Cérebros dos inimigos da Fase 3 (Picos de Cristal). Módulo puro, testável com node --test.
// Mesma regra de justiça das fases anteriores: aviso visível antes de cada golpe e uma
// janela depois dele em que o inimigo fica vulnerável.

// ------------------------------------------------------------------ Yeti filhote
// idle -> windup (bola de neve acima da cabeça) -> throw | slap (empurrão de perto) -> recover

export function createYetiBrain() {
  return { state: 'idle', timer: 900, kind: null };
}

export function stepYeti(b, ctx, stats) {
  const { dx, dtMs, active, heroAlive } = ctx;
  b.timer -= dtMs;
  const facing = Math.sign(dx) || -1;
  const dist = Math.abs(dx);
  const out = (attacking = false, throwBall = false) => ({ attacking, throwBall, state: b.state, facing });
  switch (b.state) {
    case 'idle':
      if (active && heroAlive) {
        if (dist < stats.slapRange) {
          b.state = 'windup';
          b.kind = 'slap';
          b.timer = stats.windupMs * 0.7;
        } else if (dist < stats.range && b.timer <= 0) {
          b.state = 'windup';
          b.kind = 'throw';
          b.timer = stats.windupMs;
        }
      }
      return out();
    case 'windup':
      if (b.timer > 0) return out();
      if (b.kind === 'slap') {
        b.state = 'slap';
        b.timer = 240;
        return out(true);
      }
      b.state = 'recover';
      b.timer = 500;
      return out(false, true);
    case 'slap':
      if (b.timer <= 0) {
        b.state = 'recover';
        b.timer = 700;
      }
      return out(b.state === 'slap');
    case 'recover':
    case 'hurt':
      if (b.timer <= 0) {
        b.state = 'idle';
        b.timer = stats.throwEveryMs;
      }
      return out();
    default:
      return out();
  }
}

// ------------------------------------------------------------------ Pinguim escorregadio
// walk -> crouch (agacha e balança) -> slide (de barriga, em linha reta) -> dizzy (tonto) -> walk

export function createPenguinBrain() {
  return { state: 'walk', timer: 900, dir: -1, slideDir: -1 };
}

export function stepPenguin(b, ctx, stats) {
  const { dx, dtMs, active, heroAlive, hitWall } = ctx;
  b.timer -= dtMs;
  const out = (vx, attacking = false) => ({ vx, attacking, state: b.state, facing: b.state === 'slide' || b.state === 'crouch' ? b.slideDir : b.dir });
  switch (b.state) {
    case 'walk':
      if (active && heroAlive && Math.abs(dx) < stats.aggroRange && b.timer <= 0) {
        b.state = 'crouch';
        b.timer = stats.crouchMs;
        b.slideDir = Math.sign(dx) || b.dir;
        return out(0);
      }
      if (!active && b.timer <= 0) {
        b.dir = -b.dir;
        b.timer = 1800;
      }
      if (active) b.dir = Math.sign(dx) || b.dir;
      return out(b.dir * stats.walkSpeed);
    case 'crouch':
      if (b.timer <= 0) {
        b.state = 'slide';
        b.timer = stats.slideMaxMs;
        return out(b.slideDir * stats.slideSpeed, true);
      }
      return out(0);
    case 'slide':
      if (hitWall || b.timer <= 0) {
        b.state = 'dizzy';
        b.timer = hitWall ? stats.dizzyMs : stats.dizzyMs * 0.6;
        b.dir = -b.slideDir;
        return out(0);
      }
      return out(b.slideDir * stats.slideSpeed, true);
    case 'dizzy':
      if (b.timer <= 0) {
        b.state = 'walk';
        b.timer = 1000;
      }
      return out(0);
    case 'hurt':
      if (b.timer <= 0) {
        b.state = 'walk';
        b.timer = 900;
      }
      return { vx: null, attacking: false, state: b.state, facing: b.dir };
    default:
      return out(0);
  }
}

// ------------------------------------------------------------------ Ptero de gelo
// hover (voa acima do herói) -> warn (sombra no chão marca onde vai cair) -> drop -> cooldown

export function createPteroBrain(homeX, hoverY) {
  return { state: 'hover', timer: 1200, t: 0, homeX, hoverY, markX: null };
}

export function stepPtero(b, ctx, stats) {
  const { x, y, heroX, dtMs, active, heroAlive } = ctx;
  const dt = dtMs / 1000;
  b.timer -= dtMs;
  b.t += dt;
  const toward = (tx, ty, speed) => {
    const ddx = tx - x;
    const ddy = ty - y;
    const d = Math.hypot(ddx, ddy) || 1;
    const s = Math.min(speed, d / Math.max(dt, 1e-3));
    return { vx: (ddx / d) * s, vy: (ddy / d) * s };
  };
  const facing = Math.sign(heroX - x) || 1;
  switch (b.state) {
    case 'hover':
    case 'cooldown': {
      if (active && heroAlive) b.homeX += Math.sign(heroX - b.homeX) * Math.min(Math.abs(heroX - b.homeX), 110 * dt);
      const v = toward(b.homeX + Math.sin(b.t * 1.1) * 70, b.hoverY + Math.sin(b.t * 2.2) * 10, stats.hoverSpeed);
      if (b.timer <= 0) {
        if (b.state === 'cooldown') {
          b.state = 'hover';
          b.timer = 300;
        } else if (active && heroAlive && Math.abs(heroX - x) < stats.aggroRange) {
          b.state = 'warn';
          b.timer = stats.warnMs;
          b.markX = heroX;
          return { ...v, drop: null, warnX: b.markX, state: b.state, facing };
        }
      }
      return { ...v, drop: null, warnX: null, state: b.state, facing };
    }
    case 'warn': {
      const v = toward(b.markX, b.hoverY, 300);
      if (b.timer <= 0) {
        b.state = 'cooldown';
        b.timer = stats.cooldownMs;
        b.homeX = b.markX;
        return { ...v, drop: b.markX, warnX: null, state: b.state, facing };
      }
      return { ...v, drop: null, warnX: b.markX, state: b.state, facing };
    }
    case 'hurt':
      if (b.timer <= 0) {
        b.state = 'cooldown';
        b.timer = 600;
      }
      return { vx: null, vy: null, drop: null, warnX: null, state: b.state, facing };
    default:
      return { vx: 0, vy: 0, drop: null, warnX: null, state: b.state, facing };
  }
}

// ------------------------------------------------------------------ Serpente de Cristal
// hidden -> emerging (buraco treme) -> up -> windup -> cast (estilhaços) | lunge -> stuck
//        -> submerge -> hidden.  Só pode ser atingida enquanto está fora do gelo.

const VISIBLE = new Set(['up', 'windup', 'cast', 'lunge', 'stuck']);

export function createSerpentBrain(holes, startHole = 1) {
  return { state: 'hidden', timer: 700, holes, hole: startHole, x: holes[startHole], attack: null, cycle: 0, facing: -1 };
}

export function serpentVulnerable(b) {
  return VISIBLE.has(b.state);
}

/** Buraco para sair: o mais perto do herói que fique a pelo menos `minDist` dele (nunca em cima). */
export function pickHole(holes, heroX, minDist) {
  const far = holes.map((x, i) => ({ i, d: Math.abs(x - heroX) })).filter((h) => h.d >= minDist);
  if (far.length) return far.sort((a, b) => a.d - b.d)[0].i;
  return holes.map((x, i) => ({ i, d: Math.abs(x - heroX) })).sort((a, b) => b.d - a.d)[0].i;
}

export function stepSerpent(b, ctx, stats) {
  const { heroX, dtMs, active, heroAlive, hpRatio } = ctx;
  const enraged = hpRatio <= stats.enragedAt;
  const pace = enraged ? 0.75 : 1;
  b.timer -= dtMs;
  const out = (vx = 0, fire = null) => ({
    vx,
    fire,
    state: b.state,
    attack: b.attack,
    facing: b.facing,
    x: b.x,
    vulnerable: VISIBLE.has(b.state),
    attacking: b.state === 'lunge',
    enraged,
  });

  if (b.state === 'dead') return out();
  if (!active || !heroAlive) {
    if (b.state !== 'hidden') {
      b.state = 'hidden';
      b.timer = 700;
    }
    return out();
  }

  switch (b.state) {
    case 'hidden':
      if (b.timer <= 0) {
        b.hole = pickHole(b.holes, heroX, stats.minEmergeDist);
        b.x = b.holes[b.hole];
        b.state = 'emerging';
        b.timer = stats.emergeMs;
      }
      return out();
    case 'emerging':
      if (b.timer <= 0) {
        b.state = 'up';
        b.timer = 350;
        b.facing = Math.sign(heroX - b.x) || -1;
      }
      return out();
    case 'up':
      if (b.timer <= 0) {
        // começa sempre pelos estilhaços (ensina o escudo), depois alterna
        b.attack = b.cycle % 2 === 0 ? 'shards' : 'lunge';
        b.cycle += 1;
        b.facing = Math.sign(heroX - b.x) || b.facing;
        b.state = 'windup';
        b.timer = (b.attack === 'shards' ? stats.castWindupMs : stats.lungeWindupMs) * pace;
      }
      return out();
    case 'windup':
      if (b.timer <= 0) {
        if (b.attack === 'shards') {
          b.state = 'cast';
          b.timer = stats.castMs;
          return out(0, 'shards');
        }
        b.state = 'lunge';
        b.timer = stats.lungeMs;
        return out(b.facing * stats.lungeSpeed, 'lunge');
      }
      return out();
    case 'cast':
      if (b.timer <= 0) {
        b.state = 'submerge';
        b.timer = stats.submergeMs;
      }
      return out();
    case 'lunge':
      if (b.timer <= 0) {
        b.state = 'stuck';
        b.timer = stats.stuckMs;
        return out();
      }
      return out(b.facing * stats.lungeSpeed);
    case 'stuck':
      if (b.timer <= 0) {
        b.state = 'submerge';
        b.timer = stats.submergeMs;
      }
      return out();
    case 'submerge':
      if (b.timer <= 0) {
        b.state = 'hidden';
        b.timer = stats.hiddenMs * pace;
      }
      return out();
    default:
      return out();
  }
}

/** Quantos estilhaços e onde caem (em volta do herói). */
export function shardTargets(heroX, enraged, spread) {
  const offs = enraged ? [-2, -1, 0, 1, 2] : [-1, 0, 1];
  return offs.map((o) => heroX + o * spread);
}

/** Velocidade de um projétil devolvido pelo escudo, mirando o alvo. */
export function reflectVelocity(fromX, fromY, toX, toY, speed) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const d = Math.hypot(dx, dy) || 1;
  return { vx: (dx / d) * speed, vy: (dy / d) * speed };
}
