import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { gameConfig } from '../config/gameConfig.js';

export function createTriggerSystem(world, playerController, uiSystem) {
  let shrineTriggered = false;
  let gateTriggered = false;
  let checkpointPosition = playerController.getPosition().clone();
  let resetCooldown = 0;
  let resetPressed = false;
  let onShrineTriggered = () => {};

  function setOnShrineTriggered(callback) {
    onShrineTriggered = callback;
  }

  function update(deltaTime) {
    if (resetCooldown > 0) {
      resetCooldown = Math.max(0, resetCooldown - deltaTime);
    }

    const playerPos = playerController.getPosition();

    if (!shrineTriggered) {
      const shrineDist = Vector3.Distance(playerPos, world.shrinePosition);
      if (shrineDist <= gameConfig.world.shrineTriggerRadius) {
        shrineTriggered = true;
        checkpointPosition = world.shrinePosition.clone();
        checkpointPosition.y = playerPos.y;
        uiSystem.showStory('A distant bell rings. Something calls you beyond the monastery.');
        uiSystem.setObjective('Find the sealed gate');
        onShrineTriggered();
      }
    }

    if (!gateTriggered && world.gatePosition) {
      const gateDist = Vector3.Distance(playerPos, world.gatePosition);
      if (gateDist <= gameConfig.world.gateTriggerRadius) {
        gateTriggered = true;
        checkpointPosition = world.gatePosition.clone();
        checkpointPosition.y = playerPos.y;
        uiSystem.showStory('Beyond the gate, mountain winds carry distant chanting. The world is waiting.');
        uiSystem.setObjective('Offer incense (E) and continue your journey');
      }
    }

    if (resetPressed && resetCooldown <= 0) {
      resetPressed = false;
      resetCooldown = gameConfig.world.checkpointResetCooldown;
      playerController.setPosition(checkpointPosition);
      uiSystem.showStory('You center your breath and return to your last point of calm.');
      uiSystem.showInteractPrompt('Checkpoint restored');
      window.setTimeout(() => {
        uiSystem.hideInteractPrompt();
      }, 900);
    }
  }

  function onKeyDown(event) {
    if (event.code === 'KeyR' && !event.repeat) {
      resetPressed = true;
    }
  }

  window.addEventListener('keydown', onKeyDown);

  return {
    update,
    setOnShrineTriggered,
    isShrineTriggered: () => shrineTriggered,
    isGateTriggered: () => gateTriggered,
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
    }
  };
}
