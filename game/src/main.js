// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between seven screens: title, play, paused,
// level-done, busted, game over and win.
//
// ?seed=N fixes the guards' patrol phases. ?shot=start|play|tense|win (with
// &seed=N) stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, EVENTS, SCREENS, STEP } from './config.js';
import { createRandom } from './rng.js';
import { createWorld, resetWorld, stepWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best, performance.now() / 1000);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREENS.TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    resetWorld(world);
    accumulator = 0;
    screen = SCREENS.PLAY;
    announce(`Playing. ${world.level.sub}. ${world.lives} lives.`);
  }

  function endGame() {
    screen = SCREENS.OVER;
    if (world.score > best) {
      best = world.score;
      saveBest(best);
    }
    announce(`The job failed. Score ${world.score}. Best ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && screen === SCREENS.TITLE) startGame();
    else if (actions & ACTION_CONFIRM && screen === SCREENS.OVER) startGame();
    else if (actions & ACTION_CONFIRM && screen === SCREENS.WIN) startGame();
    else if (actions & ACTION_CONFIRM && screen === SCREENS.LEVEL_DONE) screen = SCREENS.PLAY;
    else if (actions & ACTION_CONFIRM && screen === SCREENS.BUSTED) screen = SCREENS.PLAY;
    else if (actions & ACTION_PAUSE && screen === SCREENS.PLAY) {
      screen = SCREENS.PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREENS.PAUSED) {
      screen = SCREENS.PLAY;
      announce('Playing.');
    }
  }

  function step() {
    if (screen === SCREENS.TITLE) {
      stepWorld(world, STEP, { x: 0, y: 0, sneak: false, smoke: false, emp: false });
      return;
    }
    const dir = input.direction();
    const tools = input.takeTools();
    const events = stepWorld(world, STEP, {
      x: dir.x, y: dir.y, sneak: input.sneaking(), smoke: tools.smoke, emp: tools.emp,
    });
    if (events & EVENTS.WIN) {
      screen = SCREENS.WIN;
      if (world.score > best) {
        best = world.score;
        saveBest(best);
      }
      announce(`Heist complete! Final score ${world.score}.`);
    } else if (events & EVENTS.GAME_OVER) {
      endGame();
    } else if (events & EVENTS.BUSTED) {
      screen = SCREENS.BUSTED;
      announce(`Busted! ${world.lives} lives left.`);
    } else if (events & EVENTS.LEVEL_DONE) {
      screen = SCREENS.LEVEL_DONE;
      announce(`Room cleared. ${world.level.sub}.`);
    } else if (events & EVENTS.SPOTTED) {
      announce('Spotted! The alarm is rising.');
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREENS.TITLE || screen === SCREENS.PLAY) {
      while (accumulator >= STEP && (screen === SCREENS.TITLE || screen === SCREENS.PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world, screen, best, now / 1000);
  }

  // Leaving the tab pauses a running game rather than letting guards close in unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREENS.PLAY) {
      screen = SCREENS.PAUSED;
      announce('Paused.');
    }
  });

  announce('The Marlowe Job. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
