import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';

export function createPlayerMesh(scene) {
  const body = MeshBuilder.CreateCapsule('playerCapsule', {
    radius: 0.45,
    height: 1.8,
    tessellation: 12
  }, scene);

  const material = new StandardMaterial('playerMaterial', scene);
  material.diffuseColor = new Color3(0.89, 0.79, 0.61);
  body.material = material;
  body.ellipsoid = new Vector3(0.45, 0.9, 0.45);
  body.ellipsoidOffset = new Vector3(0, 0.9, 0);
  body.checkCollisions = true;
  body.position = new Vector3(-11.5, 1.1, 0);

  return body;
}
