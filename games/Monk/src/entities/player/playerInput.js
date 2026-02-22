export function createPlayerInput(targetElement) {
  const keys = {
    forward: false,
    back: false,
    left: false,
    right: false,
    sprint: false,
    jump: false
  };
  let jumpJustPressed = false;

  const keyMap = new Map([
    ['KeyW', 'forward'],
    ['KeyS', 'back'],
    ['KeyA', 'left'],
    ['KeyD', 'right'],
    ['ShiftLeft', 'sprint'],
    ['ShiftRight', 'sprint']
  ]);

  function resetState() {
    keys.forward = false;
    keys.back = false;
    keys.left = false;
    keys.right = false;
    keys.sprint = false;
    keys.jump = false;
    jumpJustPressed = false;
  }

  function handleKeyDown(event) {
    if (keyMap.has(event.code)) {
      keys[keyMap.get(event.code)] = true;
    }

    if (event.code === 'Space') {
      if (!event.repeat) {
        jumpJustPressed = true;
      }
      keys.jump = true;
      event.preventDefault();
    }
  }

  function handleKeyUp(event) {
    if (keyMap.has(event.code)) {
      keys[keyMap.get(event.code)] = false;
    }

    if (event.code === 'Space') {
      keys.jump = false;
      event.preventDefault();
    }
  }

  function handleBlur() {
    resetState();
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleBlur);

  targetElement.setAttribute('tabindex', '0');

  return {
    keys,
    consumeJumpPress() {
      const pressed = jumpJustPressed;
      jumpJustPressed = false;
      return pressed;
    },
    dispose() {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      resetState();
    }
  };
}
