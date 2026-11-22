// The screenshot scenes behind ?shot=start|play|tense|win. Each one plays the real
// rules forward from a fresh world, steered by a simple waypoint autopilot (walk to
// the next point, sneak when the alarm climbs, drop smoke when it climbs too far),
// so the frame is what a real game looks like and the same seed always stages the
// same frame.
//
// The four scenes are the dossier's cover order: the title over the room, a
// mid-sneak frame with every element in view, a high-alarm frame, and the getaway.

import { EVENTS, SCREENS, STEP } from './config.js';
import { loadLevel, resetWorld, stepWorld } from './world.js';

const START_SECONDS = 6;
// Night one: a covered lane to the middle of the room, past the first case.
const PLAY_WAYPOINTS = [[340, 620], [340, 420], [520, 420], [820, 420]];
const PLAY_SECONDS = 20;
// Night two: cross the room on the covered lane, then stand under the camera at
// (640, 84) until the alarm burns. The spot (700, 300) has a clear line of sight
// to that camera past the display case.
const TENSE_WAYPOINTS = [[340, 620], [340, 420], [520, 420], [520, 300], [700, 300]];
const TENSE_ALARM = 78;
const TENSE_SECONDS = 25;
// Night three: lift the Marlowe Diamond, then run home to the left door. The
// route stays in the open lanes: the top lane, the middle lane south of the
// centre guard's loop, and the left lane home.
const WIN_WAYPOINTS = [[260, 150], [260, 292], [640, 292], [260, 292], [260, 150], [80, 150], [80, 600], [30, 600]];
const WIN_SECONDS = 45;
const MAX_ATTEMPTS = 3;

// Steer the thief toward a point: a unit vector, or (0,0) when already there.
function seek(state, point) {
  const dx = point[0] - state.thief.x;
  const dy = point[1] - state.thief.y;
  const len = Math.hypot(dx, dy);
  if (len < 18) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}

// Run the world forward with the waypoint pilot. Stops early on a bust, on
// opts.stopAt, or when the last waypoint is reached.
function runPilot(state, waypoints, seconds, opts) {
  let at = 0;
  let events = 0;
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const point = waypoints[Math.min(at, waypoints.length - 1)];
    const dir = seek(state, point);
    if (dir.x === 0 && dir.y === 0) {
      // Arrived at this waypoint: the last one ends the run — unless a stopAt
      // is set, in which case the pilot holds position there until it fires.
      if (at >= waypoints.length - 1) {
        if (!opts.stopAt) return { events, done: true };
      } else {
        at += 1;
      }
    }
    const sneak = opts.sneak || state.alarm > 45;
    const smoke = opts.smoke && state.alarm > 55 && state.smokesLeft > 0;
    events = stepWorld(state, STEP, { x: dir.x, y: dir.y, sneak, smoke, emp: false });
    if (events & EVENTS.BUSTED) return { events, done: false };
    if (opts.stopAt && opts.stopAt(state)) return { events, done: true };
  }
  return { events, done: at >= waypoints.length - 1 };
}

// Play the waypoints, retrying with more caution (sneak, then smoke) when the
// thief gets busted. Returns true when the run finished without a bust.
function stagePlay(state, waypoints, seconds, stopAt) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const run = runPilot(state, waypoints, seconds, {
      sneak: attempt >= 1,
      smoke: attempt >= 2,
      stopAt,
    });
    if (run.done) return true;
    // A bust reset the room; try again from the staged start.
    if (attempt < MAX_ATTEMPTS - 1) {
      const keep = state.levelIndex;
      const thiefAt = state.thief ? { x: state.thief.x, y: state.thief.y } : null;
      resetWorld(state);
      loadLevel(state, keep);
      if (thiefAt && state.stagedStart) {
        state.thief.x = state.stagedStart.x;
        state.thief.y = state.stagedStart.y;
      }
    }
  }
  return false;
}

// Set `state` to the named scene and return the screen to draw over it and the
// best score to show. Any unknown name stages the title.
export function stageShot(name, state) {
  if (name === 'play') {
    resetWorld(state);
    stagePlay(state, PLAY_WAYPOINTS, PLAY_SECONDS, null);
    return { screen: SCREENS.PLAY, best: state.score };
  }
  if (name === 'tense') {
    // Night one again: the camera over the middle of the room has the clearest
    // line of sight, so the high-alarm frame stages there.
    resetWorld(state);
    stagePlay(state, TENSE_WAYPOINTS, TENSE_SECONDS, (s) => s.alarm >= TENSE_ALARM);
    return { screen: SCREENS.PLAY, best: state.score };
  }
  if (name === 'win') {
    resetWorld(state);
    loadLevel(state, 2);
    // Start the getaway in the top lane, diamond in reach down the middle lane.
    state.thief.x = 400;
    state.thief.y = 150;
    state.stagedStart = { x: 400, y: 150 };
    const finished = stagePlay(state, WIN_WAYPOINTS, WIN_SECONDS, (s) => s.finished);
    if (!finished && !state.finished) {
      // Last resort staging: the diamond in hand, one step from the door.
      state.vaultTaken = true;
      state.thief.x = 60;
      state.thief.y = 600;
      for (let i = 0; i < 6; i += 1) {
        stepWorld(state, STEP, { x: -1, y: 0, sneak: false, smoke: false, emp: false });
        if (state.finished) break;
      }
    }
    return { screen: state.finished ? SCREENS.WIN : SCREENS.PLAY, best: state.score };
  }
  // start (and anything else): the title over a live room.
  resetWorld(state);
  for (let i = 0; i < START_SECONDS / STEP; i += 1) {
    stepWorld(state, STEP, { x: 0, y: 0, sneak: false, smoke: false, emp: false });
  }
  return { screen: SCREENS.TITLE, best: 0 };
}
