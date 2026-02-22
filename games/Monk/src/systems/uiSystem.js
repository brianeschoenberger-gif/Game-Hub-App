export function createUiSystem() {
  const startScreen = document.getElementById('startScreen');
  const playButton = document.getElementById('playButton');
  const hud = document.getElementById('hud');
  const objectiveText = document.getElementById('objectiveText');
  const storyBox = document.getElementById('storyBox');
  let playing = false;

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

  return {
    bindStart,
    showStory,
    setObjective,
    isPlaying: () => playing
  };
}
