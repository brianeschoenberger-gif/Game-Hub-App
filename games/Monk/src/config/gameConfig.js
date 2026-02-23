export const gameConfig = {
  movement: {
    walkSpeed: 6,
    sprintSpeed: 9.5,
    acceleration: 28,
    deceleration: 20,
    jumpSpeed: 7.2,
    gravity: -18,
    rotationLerp: 10,
    playerRadius: 0.45,
    playerHeight: 1.8,
    spawnPosition: {
      x: -6.5,
      y: 1.1,
      z: 0
    }
  },
  camera: {
    distance: 3.6,
    minDistance: 1.8,
    maxDistance: 6.5,
    heightOffset: 2.2,
    mouseSensitivity: 0.0011,
    pitchMin: -0.7,
    pitchMax: 0.95,
    followLerp: 14,
    obstructionLerp: 22
  },
  world: {
    groundY: 0,
    shrineTriggerRadius: 2.4
  }
};
