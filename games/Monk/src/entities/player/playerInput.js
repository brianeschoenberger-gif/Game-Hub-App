export function createPlayerInput(targetElement) {
  const keys = {
    forward: false,
    back: false,
    left: false,
    right: false,
    sprint: false,
    jump: false
  };

  const keyMap = new Map([
    ['KeyW', 'forward'],
    ['KeyS', 'back'],
    ['KeyA', 'left'],
    ['KeyD', 'right'],
    ['ShiftLeft', 'sprint'],
    ['ShiftRight', 'sprint']
  ]);

  window.addEventListener('keydown', (event) => {
    if (keyMap.has(event.code)) {
      keys[keyMap.get(event.code)] = true;
    }

    if (event.code === 'Space') {
      keys.jump = true;
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    if (keyMap.has(event.code)) {
      keys[keyMap.get(event.code)] = false;
    }

    if (event.code === 'Space') {
      keys.jump = false;
      event.preventDefault();
    }
  });

  targetElement.setAttribute('tabindex', '0');

  return {
    keys
  };
}
