// Regras da Fase 4 (Cidade das Torres): terremotos e moradores presos. Módulo puro.
//
// Terremoto: idle -> warn (tremor leve + alerta, nada cai ainda) -> shaking -> done.
// Durante o tremor, pedras caem em volta do herói (o chão marca onde) e, nos tremores
// fortes, fileiras de espinhos rasgam o chão (a rachadura brilha antes). Determinístico:
// a mesma semente gera sempre o mesmo tremor, o que deixa o teste repetível.

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createQuake(cfg, seed = 1) {
  return { state: 'idle', timer: 0, cfg, rnd: rng(seed), debrisT: 0, spikesT: 0, drops: 0 };
}

export function startQuake(q) {
  if (q.state !== 'idle') return false;
  q.state = 'warn';
  q.timer = q.cfg.warnMs;
  return true;
}

/**
 * @returns {{state:string, debris:number[], spikes:number[][], ended:boolean}}
 *   debris: deslocamentos (em x, relativos ao herói) onde marcar uma pedra
 *   spikes: fileiras de espinhos, cada uma uma lista de deslocamentos
 */
export function stepQuake(q, dtMs) {
  const out = { state: q.state, debris: [], spikes: [], ended: false };
  if (q.state === 'idle' || q.state === 'done') return out;
  q.timer -= dtMs;
  if (q.state === 'warn') {
    if (q.timer <= 0) {
      q.state = 'shaking';
      q.timer = q.cfg.durationMs;
      q.debrisT = 250;
      q.spikesT = q.cfg.spikesEveryMs * 0.5;
    }
    out.state = q.state;
    return out;
  }
  // shaking
  q.debrisT -= dtMs;
  while (q.debrisT <= 0) {
    q.debrisT += q.cfg.debrisEveryMs;
    q.drops += 1;
    // uma em cada duas cai perto do herói: é a que pede o escudo
    out.debris.push(q.drops % 2 === 0 ? (q.rnd() - 0.5) * 60 : (q.rnd() - 0.5) * 460);
  }
  if (q.cfg.spikesEveryMs > 0) {
    q.spikesT -= dtMs;
    while (q.spikesT <= 0) {
      q.spikesT += q.cfg.spikesEveryMs;
      const side = q.rnd() < 0.5 ? -1 : 1;
      out.spikes.push([1, 2, 3].map((i) => side * (60 + i * 70)));
    }
  }
  if (q.timer <= 0) {
    q.state = 'done';
    out.ended = true;
  }
  out.state = q.state;
  return out;
}

/** Fileira de espinhos do Titã: sai do pé dele e vem pelo chão em direção ao herói. */
export function spikeLine(fromX, towardX, step, count, minX, maxX) {
  const dir = Math.sign(towardX - fromX) || 1;
  const xs = [];
  for (let i = 1; i <= count; i++) {
    const x = fromX + dir * (60 + i * step);
    if (x < minX || x > maxX) break;
    xs.push(x);
  }
  return xs;
}

/** Morador preso: cada golpe tira um pedaço dos escombros. */
export function createRubble(hp = 2) {
  return { hp, freed: false };
}

export function hitRubble(r) {
  if (r.freed) return false;
  r.hp -= 1;
  if (r.hp <= 0) r.freed = true;
  return r.freed;
}
