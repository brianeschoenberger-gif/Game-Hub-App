import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Ray } from '@babylonjs/core/Culling/ray';
import { gameConfig } from '../../config/gameConfig.js';
import { createPlayerMesh, createPlayerVisual } from './playerFactory.js';

const flatForward = new Vector3();
const flatRight = new Vector3();
const desiredDirection = new Vector3();
const moveDelta = new Vector3();
const groundRayOrigin = new Vector3();
const downDir = new Vector3(0, -1, 0);
const facingDirection = new Vector3(0, 0, 1);

export function createPlayerController(scene, world, playerInput) {
  const player = createPlayerMesh(scene);
  const playerVisual = {
    setAnimationState: () => {},
    update: () => {},
    loadedFromGlb: false
  };
  createPlayerVisual(player, scene).then((visual) => {
    playerVisual.setAnimationState = visual.setAnimationState;
    playerVisual.update = visual.update;
    playerVisual.loadedFromGlb = visual.loadedFromGlb;
  });

  const velocity = new Vector3(0, 0, 0);
  const halfHeight = gameConfig.movement.playerHeight / 2;
  const groundSnap = 0.03;
  const groundedThreshold = 0.14;
  const groundRay = new Ray(groundRayOrigin, downDir, halfHeight + 0.3);
  let isGrounded = false;
  let elapsedTime = 0;
  let coyoteTimer = 0;
  let jumpBufferTimer = 0;

  function refreshGroundedState() {
    groundRayOrigin.set(player.position.x, player.position.y + 0.05, player.position.z);
    groundRay.length = halfHeight + 0.35;
    const hit = scene.pickWithRay(groundRay, (mesh) => mesh !== player && mesh.checkCollisions === true);
    if (!hit?.hit || !hit.pickedPoint) {
      isGrounded = false;
      return;
    }

    const footY = player.position.y - halfHeight;
    const groundY = hit.pickedPoint.y;
    const distToGround = footY - groundY;
    isGrounded = distToGround <= groundedThreshold;

    if (isGrounded && velocity.y <= 0) {
      velocity.y = 0;
      player.position.y = groundY + halfHeight + groundSnap;
    }
  }

  function update(deltaTime) {
    elapsedTime += deltaTime;
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

    let accel = hasInput ? gameConfig.movement.acceleration : gameConfig.movement.deceleration;
    if (!isGrounded && hasInput) {
      accel = gameConfig.movement.airAcceleration;
    }
    const blend = Math.min(1, accel * deltaTime);

    velocity.x += (targetVelocityX - velocity.x) * blend;
    velocity.z += (targetVelocityZ - velocity.z) * blend;

    refreshGroundedState();

    if (isGrounded) {
      coyoteTimer = gameConfig.movement.coyoteTime;
    } else {
      coyoteTimer = Math.max(0, coyoteTimer - deltaTime);
    }

    if (playerInput.consumeJumpPress()) {
      jumpBufferTimer = gameConfig.movement.jumpBufferTime;
    } else {
      jumpBufferTimer = Math.max(0, jumpBufferTimer - deltaTime);
    }

    if (jumpBufferTimer > 0 && (isGrounded || coyoteTimer > 0)) {
      velocity.y = gameConfig.movement.jumpSpeed;
      isGrounded = false;
      coyoteTimer = 0;
      jumpBufferTimer = 0;
    }

    let gravityScale = 1;
    if (velocity.y < 0) {
      gravityScale = gameConfig.movement.fallGravityMultiplier;
    } else if (velocity.y > 0 && !playerInput.keys.jump) {
      gravityScale = gameConfig.movement.lowJumpGravityMultiplier;
    }

    velocity.y += gameConfig.movement.gravity * gravityScale * deltaTime;

    moveDelta.set(velocity.x * deltaTime, velocity.y * deltaTime, velocity.z * deltaTime);
    player.moveWithCollisions(moveDelta);
    refreshGroundedState();

    const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
    const normalizedSpeed = horizontalSpeed / gameConfig.movement.sprintSpeed;
    const moveAnimationThreshold = 0.35;
    let animationState = 'idle';
    if (!isGrounded) {
      animationState = 'jump';
    } else if (horizontalSpeed > moveAnimationThreshold) {
      animationState = playerInput.keys.sprint ? 'run' : 'walk';
    }
    playerVisual.setAnimationState(animationState);
    playerVisual.update(deltaTime, {
      elapsedTime,
      normalizedSpeed,
      isGrounded
    });

    if (hasInput) {
      const targetRotationY = Math.atan2(desiredDirection.x, desiredDirection.z);
      const rotationBlend = Math.min(1, gameConfig.movement.rotationLerp * deltaTime);
      const deltaYaw = Math.atan2(Math.sin(targetRotationY - player.rotation.y), Math.cos(targetRotationY - player.rotation.y));
      player.rotation.y += deltaYaw * rotationBlend;
      facingDirection.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y));
    }
  }

  return {
    mesh: player,
    update,
    getPosition: () => player.position,
    setPosition: (nextPosition) => {
      player.position.copyFrom(nextPosition);
      velocity.set(0, 0, 0);
      isGrounded = false;
    },
    isGrounded: () => isGrounded,
    getFacingDirection: () => facingDirection,
    getHorizontalSpeed: () => Math.hypot(velocity.x, velocity.z),
    usesGlbCharacter: () => playerVisual.loadedFromGlb
  };
}
