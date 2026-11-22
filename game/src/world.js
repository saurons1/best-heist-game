// The simulation: one room, one thief, guards, cameras and an alarm meter.
//
// The world advances in fixed 1/60 s steps. Guards walk waypoint loops and look
// through a vision cone; cameras sweep from the walls. A detector that has the
// thief in its cone with a clear line of sight fills the alarm; hiding behind
// cover (or in smoke) lets it drain. At 100 the job is blown: a life is lost and
// the room resets. Grab the vault piece, then reach the exit to clear the room.
//
// Nothing here touches the DOM or the canvas — render.js paints this state.

import {
  ALARM, CAMERA, EVENTS, GUARD, ROOM, SCORE, STEP, THIEF, TOOLS,
} from './config.js';
import { LEVELS } from './levels.js';
import { createRandom } from './rng.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function angleLerp(a, b, t) {
  return a + angleDiff(b, a) * t;
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Does the segment (x1,y1)-(x2,y2) cross the rectangle? (Slab test.)
function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// Push a circle out of a rectangle it overlaps; returns true when it did.
function pushCircleOutOfRect(body, r) {
  const cx = clamp(body.x, r.x, r.x + r.w);
  const cy = clamp(body.y, r.y, r.y + r.h);
  const dx = body.x - cx;
  const dy = body.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= body.radius * body.radius) return false;
  if (d2 === 0) {
    // Centre inside the rectangle: push out along the shallowest side.
    const left = body.x - r.x;
    const right = r.x + r.w - body.x;
    const top = body.y - r.y;
    const bottom = r.y + r.h - body.y;
    const m = Math.min(left, right, top, bottom);
    if (m === left) body.x = r.x - body.radius;
    else if (m === right) body.x = r.x + r.w + body.radius;
    else if (m === top) body.y = r.y - body.radius;
    else body.y = r.y + r.h + body.radius;
    return true;
  }
  const d = Math.sqrt(d2);
  body.x = cx + (dx / d) * body.radius;
  body.y = cy + (dy / d) * body.radius;
  return true;
}

function setupLevel(state, index) {
  const level = LEVELS[index];
  // A fresh generator per room, seeded from the run's seed: the same ?seed=N
  // always deals the same patrol phases and camera sweeps.
  const random = createRandom((state.seed >>> 0) + index * 1013);
  state.levelIndex = index;
  state.level = level;
  state.levelTime = 0;
  state.levelScore = 0;
  state.vaultTaken = false;
  state.ghost = true;
  state.alarm = 0;
  state.emp = 0;
  state.smokesLeft = TOOLS.smokePerLevel;
  state.empsLeft = TOOLS.empPerLevel;
  state.smoke = [];
  state.thief = {
    x: level.start.x, y: level.start.y, radius: THIEF.radius,
    dirX: 1, dirY: 0, moving: false, sneaking: false,
  };
  state.guards = level.guards.map((g, i) => ({
    x: g.path[0][0], y: g.path[0][1], radius: GUARD.radius,
    angle: 0, waypoint: 1 % g.path.length, pause: random.range(0, 1.2),
    mode: 'patrol', lastSeen: null, loseTimer: 0,
    path: g.path, phase: i * 0.7,
  }));
  state.cameras = level.cameras.map((c) => ({
    x: c.x, y: c.y, baseAngle: c.baseAngle, sweep: c.sweep,
    speed: c.speed, angle: c.baseAngle, phase: random.range(0, Math.PI * 2),
  }));
  state.loot = level.loot.map((l) => ({ ...l, taken: false }));
  state.message = '';
  state.messageTtl = 0;
  state.spotted = false;
  state.seenBy = null;
}

// Load one room fresh (lives, score and total time carry over). Used by the
// screenshot stager to stage a later night without playing the earlier ones.
export function loadLevel(state, index) {
  setupLevel(state, index);
}

export function createWorld(seed = 0) {
  const state = {
    seed: seed >>> 0,
    levelIndex: 0,
    level: LEVELS[0],
    lives: 3,
    score: 0,
    alarm: 0,
    time: 0,
    levelTime: 0,
    levelScore: 0,
    vaultTaken: false,
    ghost: true,
    emp: 0,
    smokesLeft: TOOLS.smokePerLevel,
    empsLeft: TOOLS.empPerLevel,
    smoke: [],
    thief: null,
    guards: [],
    cameras: [],
    loot: [],
    message: '',
    messageTtl: 0,
    spotted: false,
    seenBy: null,
    finished: false,
  };
  setupLevel(state, 0);
  return state;
}

export function resetWorld(state) {
  state.lives = 3;
  state.score = 0;
  state.time = 0;
  state.finished = false;
  setupLevel(state, 0);
}

function inSmoke(state, x, y) {
  for (const cloud of state.smoke) {
    const dx = x - cloud.x;
    const dy = y - cloud.y;
    if (dx * dx + dy * dy < TOOLS.smokeRadius * TOOLS.smokeRadius) return true;
  }
  return false;
}

// Can a watcher at (wx,wy) facing `angle` see the thief? Range, cone, line of
// sight past the room's cover, and smoke all matter.
function canSee(state, wx, wy, angle, range, halfAngle) {
  const t = state.thief;
  const dx = t.x - wx;
  const dy = t.y - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > halfAngle) return false;
  if (inSmoke(state, t.x, t.y) || inSmoke(state, wx, wy)) return false;
  for (const o of state.level.obstacles) {
    if (segmentHitsRect(wx, wy, t.x, t.y, o)) return false;
  }
  return true;
}

function moveBody(state, body, dx, dy) {
  body.x += dx;
  body.y += dy;
  for (const o of state.level.obstacles) pushCircleOutOfRect(body, o);
  body.x = clamp(body.x, ROOM.x + body.radius, ROOM.x + ROOM.width - body.radius);
  body.y = clamp(body.y, ROOM.y + body.radius, ROOM.y + ROOM.height - body.radius);
}

function guardTarget(state, guard) {
  if (guard.mode === 'chase') return { x: state.thief.x, y: state.thief.y };
  if (guard.mode === 'suspicious' && guard.lastSeen) return guard.lastSeen;
  const wp = guard.path[guard.waypoint];
  return { x: wp[0], y: wp[1] };
}

function stepGuard(state, guard, dt) {
  const target = guardTarget(state, guard);
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const speed = guard.mode === 'chase'
    ? GUARD.chaseSpeed
    : guard.mode === 'suspicious' ? GUARD.suspiciousSpeed : GUARD.patrolSpeed;
  if (guard.mode === 'patrol' && guard.pause > 0) {
    guard.pause -= dt;
    return;
  }
  if (dist < 4) {
    if (guard.mode === 'patrol') {
      guard.waypoint = (guard.waypoint + 1) % guard.path.length;
      guard.pause = GUARD.pauseAtWaypoint;
    } else if (guard.mode === 'suspicious') {
      guard.loseTimer -= dt;
      if (guard.loseTimer <= 0) {
        guard.mode = 'patrol';
        guard.lastSeen = null;
      }
    }
    return;
  }
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = angleLerp(guard.angle, Math.atan2(dy, dx), Math.min(1, dt * 8));
}

// One fixed step. `input` is { x, y, sneak, smoke, emp } with x/y a unit vector
// (or 0,0). Returns an EVENTS bitmask.
export function stepWorld(state, dt, input) {
  if (state.finished) return EVENTS.NONE;
  let events = EVENTS.NONE;
  state.time += dt;
  state.levelTime += dt;
  if (state.messageTtl > 0) {
    state.messageTtl -= dt;
    if (state.messageTtl <= 0) state.message = '';
  }
  if (state.emp > 0) state.emp -= dt;
  for (const cloud of state.smoke) cloud.ttl -= dt;
  state.smoke = state.smoke.filter((c) => c.ttl > 0);

  // --- tools ---
  if (input.smoke && state.smokesLeft > 0) {
    state.smoke.push({ x: state.thief.x, y: state.thief.y, ttl: TOOLS.smokeSeconds });
    state.smokesLeft -= 1;
    state.score = Math.max(0, state.score - SCORE.toolCost);
    state.levelScore = Math.max(0, state.levelScore - SCORE.toolCost);
    state.message = 'Smoke out — the cones cannot see through it.';
    state.messageTtl = 2.5;
  }
  if (input.emp && state.empsLeft > 0) {
    state.emp = TOOLS.empSeconds;
    state.empsLeft -= 1;
    state.score = Math.max(0, state.score - SCORE.toolCost);
    state.levelScore = Math.max(0, state.levelScore - SCORE.toolCost);
    state.message = 'EMP burst — every camera is blind.';
    state.messageTtl = 2.5;
  }

  // --- thief movement ---
  const t = state.thief;
  const speed = input.sneak ? THIEF.sneakSpeed : THIEF.walkSpeed;
  t.sneaking = !!input.sneak;
  t.moving = input.x !== 0 || input.y !== 0;
  if (t.moving) {
    const len = Math.hypot(input.x, input.y) || 1;
    moveBody(state, t, (input.x / len) * speed * dt, (input.y / len) * speed * dt);
    t.dirX = input.x / len;
    t.dirY = input.y / len;
  }

  // --- cameras sweep ---
  for (const cam of state.cameras) {
    cam.phase += dt * cam.speed;
    cam.angle = cam.baseAngle + Math.sin(cam.phase) * cam.sweep;
  }

  // --- detection ---
  const wasSpotted = state.spotted;
  state.spotted = false;
  state.seenBy = null;
  let alarmRate = 0;
  const sneakFactor = t.sneaking ? THIEF.sneakSpotFactor : 1;
  for (const guard of state.guards) {
    if (canSee(state, guard.x, guard.y, guard.angle, GUARD.sightRange, GUARD.sightHalfAngle)) {
      state.spotted = true;
      state.seenBy = 'guard';
      alarmRate += GUARD.spotRate * sneakFactor;
      guard.lastSeen = { x: t.x, y: t.y };
      guard.loseTimer = 3;
    }
  }
  if (state.emp <= 0) {
    for (const cam of state.cameras) {
      if (canSee(state, cam.x, cam.y, cam.angle, CAMERA.sightRange, CAMERA.sightHalfAngle)) {
        state.spotted = true;
        state.seenBy = state.seenBy ?? 'camera';
        alarmRate += CAMERA.spotRate * sneakFactor;
      }
    }
  }
  if (!wasSpotted && state.spotted) events |= EVENTS.SPOTTED;
  if (alarmRate > 0) {
    state.alarm = Math.min(100, state.alarm + alarmRate * dt);
    if (state.alarm >= ALARM.suspiciousAt) state.ghost = false;
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM.decayPerSecond * dt);
  }

  // --- guard alertness follows the alarm ---
  for (const guard of state.guards) {
    if (state.alarm >= ALARM.alertAt) guard.mode = 'chase';
    else if (state.alarm >= ALARM.suspiciousAt) {
      if (guard.mode === 'patrol') guard.mode = 'suspicious';
    } else if (guard.mode === 'chase') guard.mode = 'suspicious';
    else if (guard.mode === 'suspicious' && !guard.lastSeen) guard.mode = 'patrol';
  }

  // --- guards move (and a touch is a catch) ---
  for (const guard of state.guards) {
    stepGuard(state, guard, dt);
    const dx = guard.x - t.x;
    const dy = guard.y - t.y;
    if (dx * dx + dy * dy < (guard.radius + t.radius - 2) * (guard.radius + t.radius - 2)) {
      return bust(state, 'A guard grabbed Marlowe.');
    }
  }

  // --- alarm full is a bust ---
  if (state.alarm >= 100) return bust(state, 'The alarm hit full — the room locked down.');

  // --- loot ---
  for (const item of state.loot) {
    if (item.taken) continue;
    const dx = item.x - t.x;
    const dy = item.y - t.y;
    if (dx * dx + dy * dy < 30 * 30) {
      item.taken = true;
      state.score += SCORE.smallLoot;
      state.levelScore += SCORE.smallLoot;
      state.message = item.kind === 'gold' ? 'Gold bars pocketed (+40).' : 'A small canvas, quietly lifted (+40).';
      state.messageTtl = 2;
      events |= EVENTS.LOOT;
    }
  }

  // --- vault piece ---
  if (!state.vaultTaken) {
    const v = state.level.vault;
    const dx = v.x - t.x;
    const dy = v.y - t.y;
    if (dx * dx + dy * dy < 34 * 34) {
      state.vaultTaken = true;
      state.score += SCORE.vaultLoot;
      state.levelScore += SCORE.vaultLoot;
      state.message = `${v.name} secured (+150) — get to the exit!`;
      state.messageTtl = 3;
      events |= EVENTS.VAULT;
    }
  }

  // --- exit ---
  if (state.vaultTaken && pointInRect(t.x, t.y, state.level.exit)) {
    const timeBonus = Math.max(0, SCORE.levelTimeBonusMax - Math.floor(state.levelTime) * SCORE.levelTimeBonusPerSecond);
    const ghostBonus = state.ghost ? SCORE.ghostBonus : 0;
    state.score += timeBonus + ghostBonus;
    state.levelScore += timeBonus + ghostBonus;
    if (state.levelIndex + 1 >= LEVELS.length) {
      state.score += state.lives * SCORE.lifeBonus;
      state.finished = true;
      return events | EVENTS.WIN;
    }
    setupLevel(state, state.levelIndex + 1);
    state.message = `${state.level.sub} — ${state.level.brief}`;
    state.messageTtl = 4;
    return events | EVENTS.LEVEL_DONE;
  }

  return events;
}

function bust(state, reason) {
  state.lives -= 1;
  state.message = reason;
  state.messageTtl = 3;
  if (state.lives <= 0) {
    state.finished = true;
    return EVENTS.BUSTED | EVENTS.GAME_OVER;
  }
  // The room resets around the thief: guards back on patrol, alarm cooling,
  // but what was already lifted stays lifted.
  const taken = state.loot.map((l) => l.taken);
  const vaultTaken = state.vaultTaken;
  setupLevel(state, state.levelIndex);
  state.loot.forEach((l, i) => { l.taken = taken[i]; });
  state.vaultTaken = vaultTaken;
  state.alarm = ALARM.respawnAt;
  return EVENTS.BUSTED;
}

export { STEP };
