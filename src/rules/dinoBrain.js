// Máquina de estados dos dinossauros (FSM). Módulo puro e testável.
//
// patrol -> chase (herói no alcance de visão)
// chase  -> windup (herói no alcance de ataque) : o dino "avisa" antes de atacar
// windup -> lunge  : investida que causa dano
// lunge  -> recover: janela segura para o herói contra-atacar
// recover-> chase
// qualquer -> hurt (levou golpe) -> chase
// qualquer -> dead

export function createBrain(homeX) {
  return { state: 'patrol', timer: 0, dir: -1, homeX, lungeDir: -1, hitLanded: false };
}

function enter(brain, state, timer = 0) {
  brain.state = state;
  brain.timer = timer;
}

/** Notifica que o dino levou dano: interrompe a investida. */
export function hurtBrain(brain, ms = 220) {
  if (brain.state === 'dead') return;
  enter(brain, 'hurt', ms);
}

export function killBrain(brain) {
  enter(brain, 'dead');
}

/**
 * Avança o cérebro um passo.
 * @param {object} brain estado mutável
 * @param {{dx:number, dy:number, dtMs:number, heroAlive:boolean, active:boolean}} ctx
 *   dx = heroi.x - dino.x
 * @param {object} stats linha da tabela DINOS
 * @returns {{vx:number, attacking:boolean, facing:number}}
 */
export function stepBrain(brain, ctx, stats) {
  const { dx, dtMs, heroAlive, active } = ctx;
  const dist = Math.abs(dx);
  const towardHero = dx === 0 ? brain.dir : Math.sign(dx);
  brain.timer -= dtMs;

  switch (brain.state) {
    case 'dead':
      return { vx: 0, attacking: false, facing: brain.dir };

    case 'patrol': {
      if (active && heroAlive && dist <= stats.aggroRange) {
        enter(brain, 'chase');
        break;
      }
      if (brain.timer <= 0) {
        brain.dir = -brain.dir;
        brain.timer = 1600;
      }
      return { vx: brain.dir * stats.patrolSpeed, attacking: false, facing: brain.dir };
    }

    case 'chase': {
      if (!heroAlive) {
        enter(brain, 'patrol', 1200);
        break;
      }
      brain.dir = towardHero;
      if (dist <= stats.attackRange) {
        enter(brain, 'windup', stats.windupMs);
        brain.lungeDir = towardHero;
        return { vx: 0, attacking: false, facing: brain.dir };
      }
      return { vx: brain.dir * stats.chaseSpeed, attacking: false, facing: brain.dir };
    }

    case 'windup': {
      brain.dir = brain.lungeDir;
      if (brain.timer <= 0) {
        enter(brain, 'lunge', stats.lungeMs);
        brain.hitLanded = false;
        return { vx: brain.lungeDir * stats.lungeSpeed, attacking: true, facing: brain.dir };
      }
      return { vx: 0, attacking: false, facing: brain.dir };
    }

    case 'lunge': {
      if (brain.timer <= 0) {
        enter(brain, 'recover', stats.recoverMs);
        return { vx: 0, attacking: false, facing: brain.dir };
      }
      return { vx: brain.lungeDir * stats.lungeSpeed, attacking: !brain.hitLanded, facing: brain.dir };
    }

    case 'recover':
      if (brain.timer <= 0) enter(brain, 'chase');
      return { vx: 0, attacking: false, facing: brain.dir };

    case 'hurt':
      if (brain.timer <= 0) enter(brain, 'chase');
      return { vx: null, attacking: false, facing: brain.dir }; // vx null = mantém o recuo
  }
  return stepBrain(brain, { ...ctx, dtMs: 0 }, stats);
}
