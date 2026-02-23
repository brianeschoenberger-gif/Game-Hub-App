import { gameConfig } from '../config/gameConfig.js';

export function createAudioSystem() {
  let audioContext;
  let ambientOsc;
  let ambientGain;
  let started = false;

  function ensureContext() {
    if (!audioContext) {
      audioContext = new window.AudioContext();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }

  function start() {
    if (started) {
      return;
    }

    ensureContext();

    ambientOsc = audioContext.createOscillator();
    ambientGain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    ambientOsc.type = 'triangle';
    ambientOsc.frequency.value = 110;

    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.4;

    ambientGain.gain.value = gameConfig.audio.ambientVolume;

    ambientOsc.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(audioContext.destination);

    ambientOsc.start();
    started = true;
  }

  function playShrineBell() {
    if (!started) {
      return;
    }

    const now = audioContext.currentTime;
    const gain = audioContext.createGain();
    const oscA = audioContext.createOscillator();
    const oscB = audioContext.createOscillator();

    oscA.type = 'sine';
    oscB.type = 'sine';
    oscA.frequency.setValueAtTime(784, now);
    oscB.frequency.setValueAtTime(1176, now);

    gain.gain.setValueAtTime(gameConfig.audio.bellVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.1);

    oscA.connect(gain);
    oscB.connect(gain);
    gain.connect(audioContext.destination);

    oscA.start(now);
    oscB.start(now + 0.01);
    oscA.stop(now + 2.2);
    oscB.stop(now + 2.2);
  }

  return {
    start,
    playShrineBell
  };
}
