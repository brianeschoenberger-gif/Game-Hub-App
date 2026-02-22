import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { gameConfig } from '../../config/gameConfig.js';
import { createPlayerMesh } from './playerFactory.js';

const flatForward = new Vector3();
const flatRight = new Vector3();
const desiredDirection = new Vector3();
const moveDelta = new Vector3();

export function createPlayerController(scene, world, playerInput) {
  const player = createPlayerMesh(scene);
  const velocity = new Vector3(0, 0, 0);
  let isGrounded = false;

  function update(deltaTime) {
    const camera = scene.activeCamera;
    if (!camera) {
      return;
    }

    flatForward.copyFrom(camera.getForwardRay().direction);
    flatForward.y = 0;
    flatForward.normalize();

    Vector3.CrossToRef(Vector3.UpReadOnly, flatForward, flatRight);
    flatRight.normalize();

    desiredDirection.setAll(0);

    if (playerInput.keys.forward) desiredDirection.addInPlace(flatForward);
    if (playerInput.keys.back) desiredDirection.subtractInPlace(flatForward);
    if (playerInput.keys.left) desiredDirection.subtractInPlace(flatRight);
    if (playerInput.keys.right) desiredDirection.addInPlace(flatRight);

    const hasInput = desiredDirection.lengthSquared() > 0;
    if (hasInput) desiredDirection.normalize();

    const speed = playerInput.keys.sprint ? gameConfig.movement.sprintSpeed : gameConfig.movement.walkSpeed;
    const targetVelocityX = hasInput ? desiredDirection.x * speed : 0;
    const targetVelocityZ = hasInput ? desiredDirection.z * speed : 0;

    const accel = hasInput ? gameConfig.movement.acceleration : gameConfig.movement.deceleration;
    const blend = Math.min(1, accel * deltaTime);

    velocity.x += (targetVelocityX - velocity.x) * blend;
    velocity.z += (targetVelocityZ - velocity.z) * blend;

    isGrounded = player.position.y <= gameConfig.movement.playerHeight / 2 + 0.16;
    if (isGrounded && velocity.y < 0) {
      velocity.y = 0;
      player.position.y = gameConfig.movement.playerHeight / 2 + 0.1;
    }

    if (isGrounded && playerInput.keys.jump) {
      velocity.y = gameConfig.movement.jumpSpeed;
    }

    velocity.y += gameConfig.movement.gravity * deltaTime;

    moveDelta.set(velocity.x * deltaTime, velocity.y * deltaTime, velocity.z * deltaTime);
    player.moveWithCollisions(moveDelta);

    if (hasInput) {
      const targetRotationY = Math.atan2(desiredDirection.x, desiredDirection.z);
      const rotationBlend = Math.min(1, gameConfig.movement.rotationLerp * deltaTime);
      player.rotation.y += (targetRotationY - player.rotation.y) * rotationBlend;
    }
  }

  return {
    mesh: player,
    update,
    getPosition: () => player.position,
    isGrounded: () => isGrounded
  };
}
