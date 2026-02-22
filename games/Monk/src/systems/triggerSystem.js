import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { gameConfig } from '../config/gameConfig.js';

export function createTriggerSystem(world, playerController, uiSystem) {
  let shrineTriggered = false;

  function update() {
    if (shrineTriggered) {
      return;
    }

    const playerPos = playerController.getPosition();
    const dist = Vector3.Distance(playerPos, world.shrinePosition);

    if (dist <= gameConfig.world.shrineTriggerRadius) {
      shrineTriggered = true;
      uiSystem.showStory('A distant bell rings. Something calls you beyond the monastery.');
      uiSystem.setObjective('Prototype complete');
    }
  }

  return {
    update,
    isShrineTriggered: () => shrineTriggered
  };
}
