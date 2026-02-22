import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';

export function createAppContext() {
  const canvas = document.getElementById('renderCanvas');
  if (!canvas) {
    throw new Error('Render canvas not found.');
  }

  const baseOptions = {
    preserveDrawingBuffer: true,
    stencil: true
  };

  let engine;
  try {
    engine = new Engine(canvas, true, {
      ...baseOptions,
      disableWebGL2Support: false
    });
  } catch {
    engine = new Engine(canvas, true, {
      ...baseOptions,
      disableWebGL2Support: true
    });
  }

  const scene = new Scene(engine);

  return { canvas, engine, scene };
}
