// Keyboard and mouse input. WASD or arrows move Marlowe, Shift sneaks, Q drops a
// smoke bomb, E fires the EMP, Space or Enter confirms, P pauses. A click also
// confirms, so the title screen works with the mouse too.
//
// The world reads a fresh direction vector every step; tool presses are edges
// (true for exactly one step) so holding Q cannot spend every smoke bomb at once.

export const ACTION_CONFIRM = 1 << 0;
export const ACTION_PAUSE = 1 << 1;

const KEY_DIRECTION = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;
  let smokePressed = false;
  let empPressed = false;

  function onKeyDown(event) {
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyQ') {
      smokePressed = true;
    } else if (event.code === 'KeyE') {
      empPressed = true;
    }
    if (event.code in KEY_DIRECTION || event.code === 'Space') event.preventDefault();
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onClick() {
    actions |= ACTION_CONFIRM;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onClick);

  return {
    // The movement vector for this step, normalised.
    direction() {
      let x = 0;
      let y = 0;
      for (const code of keys) {
        const dir = KEY_DIRECTION[code];
        if (dir) {
          x += dir[0];
          y += dir[1];
        }
      }
      const len = Math.hypot(x, y);
      return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
    },
    sneaking() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight');
    },
    // One-shot tool presses, consumed by takeTools().
    takeTools() {
      const tools = { smoke: smokePressed, emp: empPressed };
      smokePressed = false;
      empPressed = false;
      return tools;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
