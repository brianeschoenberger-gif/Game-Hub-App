import '@babylonjs/core/Helpers/sceneHelpers';
import '@babylonjs/core/Collisions/collisionCoordinator';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { createAppContext } from './app.js';
import { createMonasteryScene } from '../scenes/monasteryScene.js';
import { createPlayerController } from '../entities/player/playerController.js';
import { createPlayerInput } from '../entities/player/playerInput.js';
import { createCameraSystem } from '../systems/cameraSystem.js';
import { createUiSystem } from '../systems/uiSystem.js';
import { createTriggerSystem } from '../systems/triggerSystem.js';
import { createAmbientEffectsSystem } from '../systems/ambientEffectsSystem.js';
import { createAudioSystem } from '../systems/audioSystem.js';
import { setupDebugOverlay } from '../utils/debug.js';

export function createGame() {
  const { canvas, engine, scene } = createAppContext();
  scene.clearColor.set(0.56, 0.62, 0.72, 1);

  const hemi = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.68;
  hemi.groundColor = new Color3(0.26, 0.22, 0.16);

  const sun = new DirectionalLight('sunLight', new Vector3(-0.4, -1, 0.35), scene);
  sun.intensity = 1.6;
  sun.position = new Vector3(15, 30, -10);

  const world = createMonasteryScene(scene);
  const playerInput = createPlayerInput(canvas);
  const playerController = createPlayerController(scene, world, playerInput);
  const cameraSystem = createCameraSystem(scene, canvas, playerController);
  const uiSystem = createUiSystem();
  const triggerSystem = createTriggerSystem(world, playerController, uiSystem);
  const ambientEffects = createAmbientEffectsSystem(scene);
  const audioSystem = createAudioSystem();
  const debug = setupDebugOverlay();

  uiSystem.bindStart(() => {
    canvas.focus();
    cameraSystem.activatePointerLock();
    audioSystem.start();
  });

  triggerSystem.setOnShrineTriggered(() => {
    audioSystem.playShrineBell();
  });

  scene.onBeforeRenderObservable.add(() => {
    if (!uiSystem.isPlaying()) {
      return;
    }

    const dt = scene.getEngine().getDeltaTime() / 1000;
    playerController.update(dt);
    cameraSystem.update(dt);
    ambientEffects.update(dt);
    triggerSystem.update();
    debug.update(scene.getEngine().getFps());
  });

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });

  let disposed = false;
  const cleanup = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    playerInput.dispose?.();
  };

  scene.onDisposeObservable.add(cleanup);
  window.addEventListener('beforeunload', cleanup, { once: true });
}
