export function createUiSystem() {
  const startScreen = document.getElementById('startScreen');
  const playButton = document.getElementById('playButton');
  const hud = document.getElementById('hud');
  const objectiveText = document.getElementById('objectiveText');
  const storyBox = document.getElementById('storyBox');
  const fadeLayer = document.getElementById('fadeLayer');

  let playing = false;

  function beginPlay(onBegin) {
    if (playing) {
      return;
    }

    playing = true;
    fadeLayer.classList.add('active');

    setTimeout(() => {
      startScreen.classList.remove('visible');
      hud.classList.remove('hidden');
      fadeLayer.classList.remove('active');
      onBegin?.();
    }, 450);
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
