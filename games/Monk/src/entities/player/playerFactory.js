import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { gameConfig } from '../../config/gameConfig.js';

function createMonkMaterials(scene) {
  const skinMaterial = new StandardMaterial('monkSkinMaterial', scene);
  skinMaterial.diffuseColor = new Color3(0.86, 0.73, 0.58);

  const robeMaterial = new StandardMaterial('monkRobeMaterial', scene);
  robeMaterial.diffuseColor = new Color3(0.71, 0.42, 0.2);

  const sashMaterial = new StandardMaterial('monkSashMaterial', scene);
  sashMaterial.diffuseColor = new Color3(0.6, 0.22, 0.18);

  return { skinMaterial, robeMaterial, sashMaterial };
}

function createMonkVisual(collider, scene) {
  const { skinMaterial, robeMaterial, sashMaterial } = createMonkMaterials(scene);

  const robe = MeshBuilder.CreateCylinder('monkRobe', {
    height: 1.05,
    diameterTop: 0.44,
    diameterBottom: 0.72,
    tessellation: 12
  }, scene);
  robe.material = robeMaterial;
  robe.parent = collider;
  robe.position = new Vector3(0, -0.16, 0);

  const head = MeshBuilder.CreateSphere('monkHead', { diameter: 0.44, segments: 16 }, scene);
  head.material = skinMaterial;
  head.parent = collider;
  head.position = new Vector3(0, 0.67, 0);

  const sash = MeshBuilder.CreateTorus('monkSash', {
    diameter: 0.48,
    thickness: 0.08,
    tessellation: 18
  }, scene);
  sash.material = sashMaterial;
  sash.parent = collider;
  sash.position = new Vector3(0, 0.09, 0);
  sash.rotation.x = Math.PI / 2;
}

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

  createMonkVisual(collider, scene);

  return collider;
}
