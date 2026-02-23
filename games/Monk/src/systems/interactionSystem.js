import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { gameConfig } from '../config/gameConfig.js';

const upOffset = new Vector3(0, 1, 0);

export function createInteractionSystem(world, playerController, uiSystem) {
  let hasInteracted = false;

  function update() {
    if (!world.interactablePosition || hasInteracted) {
      return;
    }

    const playerPos = playerController.getPosition();
    const distance = Vector3.Distance(playerPos, world.interactablePosition);

    if (distance > gameConfig.world.interactRange) {
      uiSystem.hideInteractPrompt();
      return;
    }

    uiSystem.showInteractPrompt('Press E to light incense');

    if (!uiSystem.consumeInteractPressed()) {
      return;
    }

    hasInteracted = true;
    uiSystem.hideInteractPrompt();
    uiSystem.showStory('You light the incense bowl. Smoke curls upward, and the silence deepens.');

    if (world.interactableFlame) {
      world.interactableFlame.isVisible = true;
      world.interactableFlame.position.copyFrom(world.interactablePosition).addInPlace(upOffset);
    }
  }

  return {
    update,
    isCompleted: () => hasInteracted
  };
}
