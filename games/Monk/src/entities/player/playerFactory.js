import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { gameConfig } from '../../config/gameConfig.js';
import { createPlayerCharacterVisual } from './playerCharacterVisual.js';

export function createPlayerMesh(scene) {
  const collider = MeshBuilder.CreateCapsule('playerCapsule', {
    radius: 0.45,
    height: 1.8,
    tessellation: 12
  }, scene);

  collider.isVisible = false;
  collider.ellipsoid = new Vector3(0.45, 0.9, 0.45);
  collider.ellipsoidOffset = new Vector3(0, 0.9, 0);
  collider.checkCollisions = true;
  const spawn = gameConfig.movement.spawnPosition;
  collider.position = new Vector3(spawn.x, spawn.y, spawn.z);

  return collider;
}

export async function createPlayerVisual(collider, scene) {
  return createPlayerCharacterVisual(collider, scene);
}
