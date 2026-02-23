export const gameConfig = {
  movement: {
    walkSpeed: 5.8,
    sprintSpeed: 8.8,
    acceleration: 24,
    deceleration: 16,
    airAcceleration: 7,
    jumpSpeed: 7.6,
    gravity: -19,
    fallGravityMultiplier: 1.22,
    lowJumpGravityMultiplier: 1.1,
    coyoteTime: 0.08,
    jumpBufferTime: 0.12,
    rotationLerp: 11,
    playerRadius: 0.45,
    playerHeight: 1.8,
    spawnPosition: {
      x: -22,
      y: 1.1,
      z: 1.8
    }
  },
  camera: {
    distance: 3.4,
    minDistance: 1.7,
    maxDistance: 6.5,
    heightOffset: 2.2,
    mouseSensitivity: 0.0011,
    pitchMin: -0.7,
    pitchMax: 0.95,
    followLerp: 12,
    obstructionLerp: 22,
    lookAheadDistance: 0.9,
    lookAheadLerp: 6,
    cameraRotationFollowLerp: 5,
    cameraRotationMoveThreshold: 0.25,
    collisionRadius: 0.34,
    inertia: 0.62
  },
  effects: {
    dustMotes: {
      count: 24,
      radius: 20,
      minHeight: 0.7,
      maxHeight: 3.4,
      driftSpeed: 0.18,
      bobAmplitude: 0.14,
      size: 0.055
    }
  },
  audio: {
    ambientVolume: 0.06,
    bellVolume: 0.2
  },
  world: {
    groundY: 0,
    shrineTriggerRadius: 2.4,
    gateTriggerRadius: 2.8,
    interactRange: 2.2,
    checkpointResetCooldown: 0.35
  }
};
