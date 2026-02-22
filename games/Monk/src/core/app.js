import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';

export function createAppContext() {
  const canvas = document.getElementById('renderCanvas');
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false
  });
  const scene = new Scene(engine);

  return { canvas, engine, scene };
}
