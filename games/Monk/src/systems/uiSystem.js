export function createUiSystem() {
  const startScreen = document.getElementById('startScreen');
  const playButton = document.getElementById('playButton');
  const hud = document.getElementById('hud');
  const objectiveText = document.getElementById('objectiveText');
  const storyBox = document.getElementById('storyBox');
  const interactPrompt = document.getElementById('interactPrompt');
  let playing = false;
  let interactPressed = false;

  function beginPlay(onBegin) {
    if (playing) {
      return;
    }

    playing = true;

    setTimeout(() => {
      startScreen.classList.remove('visible');
      hud.classList.remove('hidden');
      onBegin?.();
    }, 120);
  }

  function bindStart(onBegin) {
    playButton.addEventListener('click', () => beginPlay(onBegin));
  }

  function showStory(message) {
    storyBox.textContent = message;
    storyBox.classList.remove('hidden');
  }

  function setObjective(message) {
    objectiveText.textContent = `Objective: ${message}`;
  }

  function showInteractPrompt(message) {
    interactPrompt.textContent = message;
    interactPrompt.classList.remove('hidden');
  }

  function hideInteractPrompt() {
    interactPrompt.classList.add('hidden');
  }

  function onKeyDown(event) {
    if (event.code === 'KeyE' && !event.repeat) {
      interactPressed = true;
    }
  }

  window.addEventListener('keydown', onKeyDown);

  return {
    bindStart,
    showStory,
    setObjective,
    showInteractPrompt,
    hideInteractPrompt,
    consumeInteractPressed() {
      const consumed = interactPressed;
      interactPressed = false;
      return consumed;
    },
    isPlaying: () => playing,
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
    }
  };
}
