import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { gameConfig } from '../config/gameConfig.js';

export function createCameraSystem(scene, canvas, playerController) {
  const config = gameConfig.camera;
  const target = new Vector3();
  const lookAhead = new Vector3();

  const camera = new ArcRotateCamera(
    'playerCamera',
    Math.PI * 1.4,
    1.1,
    config.distance,
    playerController.getPosition(),
    scene
  );

  camera.attachControl(canvas, true);
  camera.lowerBetaLimit = config.pitchMin + Math.PI / 2;
  camera.upperBetaLimit = config.pitchMax + Math.PI / 2;
  camera.lowerRadiusLimit = config.minDistance;
  camera.upperRadiusLimit = config.maxDistance;
  camera.wheelDeltaPercentage = 0.01;
  camera.angularSensibilityX = 1 / config.mouseSensitivity;
  camera.angularSensibilityY = 1 / config.mouseSensitivity;
  camera.inertia = config.inertia;
  camera.checkCollisions = true;
  camera.collisionRadius = new Vector3(config.collisionRadius, config.collisionRadius, config.collisionRadius);

  scene.activeCamera = camera;

  function activatePointerLock() {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    }
  }

  function update(deltaTime) {
    const playerPos = playerController.getPosition();
    const playerFacing = playerController.getFacingDirection();
    lookAhead.set(
      playerFacing.x * config.lookAheadDistance,
      0,
      playerFacing.z * config.lookAheadDistance
    );

    const lookAheadBlend = Math.min(1, config.lookAheadLerp * deltaTime);
    target.x += (playerPos.x + lookAhead.x - target.x) * lookAheadBlend;
    target.z += (playerPos.z + lookAhead.z - target.z) * lookAheadBlend;
    target.y = playerPos.y + config.heightOffset;

    if (playerController.getHorizontalSpeed() > config.cameraRotationMoveThreshold) {
      const desiredAlpha = playerPos ? playerController.mesh.rotation.y + Math.PI : camera.alpha;
      const deltaAlpha = Math.atan2(Math.sin(desiredAlpha - camera.alpha), Math.cos(desiredAlpha - camera.alpha));
      const alphaBlend = Math.min(1, config.cameraRotationFollowLerp * deltaTime);
      camera.alpha += deltaAlpha * alphaBlend;
    }

    const blend = Math.min(1, config.followLerp * deltaTime);
    camera.target = Vector3.Lerp(camera.target, target, blend);
  }

  return {
    camera,
    activatePointerLock,
    update
  };
}
