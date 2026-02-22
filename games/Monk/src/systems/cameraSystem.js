import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { gameConfig } from '../config/gameConfig.js';

export function createCameraSystem(scene, canvas, playerController) {
  const config = gameConfig.camera;
  const target = new Vector3();

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
  camera.checkCollisions = true;
  camera.collisionRadius = new Vector3(0.4, 0.4, 0.4);

  scene.activeCamera = camera;

  function activatePointerLock() {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    }
  }

  function update(deltaTime) {
    const playerPos = playerController.getPosition();
    target.set(playerPos.x, playerPos.y + config.heightOffset, playerPos.z);
    const blend = Math.min(1, config.followLerp * deltaTime);
    camera.target = Vector3.Lerp(camera.target, target, blend);
  }

  return {
    camera,
    activatePointerLock,
    update
  };
}
