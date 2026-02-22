import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

function createStaticBox(scene, name, options, position, material) {
  const mesh = MeshBuilder.CreateBox(name, options, scene);
  mesh.position = position;
  mesh.material = material;
  mesh.checkCollisions = true;
  return mesh;
}

export function createMonasteryScene(scene) {
  scene.collisionsEnabled = true;

  const stoneMaterial = new StandardMaterial('stoneMaterial', scene);
  stoneMaterial.diffuseColor = new Color3(0.57, 0.55, 0.52);

  const woodMaterial = new StandardMaterial('woodMaterial', scene);
  woodMaterial.diffuseColor = new Color3(0.46, 0.34, 0.23);

  const clothMaterial = new StandardMaterial('clothMaterial', scene);
  clothMaterial.diffuseColor = new Color3(0.69, 0.61, 0.48);

  const ground = MeshBuilder.CreateGround('ground', { width: 42, height: 42 }, scene);
  ground.material = stoneMaterial;
  ground.checkCollisions = true;

  createStaticBox(scene, 'cellFloor', { width: 8, depth: 6, height: 0.5 }, new Vector3(-10, 0.25, 0), stoneMaterial);
  createStaticBox(scene, 'hallFloor', { width: 12, depth: 5, height: 0.5 }, new Vector3(-3.5, 0.25, 0), stoneMaterial);
  createStaticBox(scene, 'courtyardFloor', { width: 20, depth: 14, height: 0.5 }, new Vector3(7, 0.25, 0), stoneMaterial);
  createStaticBox(scene, 'shrineFloor', { width: 6, depth: 6, height: 0.5 }, new Vector3(14, 0.25, 0), stoneMaterial);

  const walls = [
    { name: 'cellWallWest', size: { width: 0.6, height: 3, depth: 6 }, pos: new Vector3(-14, 1.5, 0) },
    { name: 'cellWallNorth', size: { width: 8.6, height: 3, depth: 0.6 }, pos: new Vector3(-10, 1.5, -3.3) },
    { name: 'cellWallSouth', size: { width: 8.6, height: 3, depth: 0.6 }, pos: new Vector3(-10, 1.5, 3.3) },
    { name: 'hallWallNorth', size: { width: 12.2, height: 3, depth: 0.6 }, pos: new Vector3(-3.5, 1.5, -2.8) },
    { name: 'hallWallSouth', size: { width: 12.2, height: 3, depth: 0.6 }, pos: new Vector3(-3.5, 1.5, 2.8) },
    { name: 'courtyardWallNorth', size: { width: 20.4, height: 3, depth: 0.6 }, pos: new Vector3(7, 1.5, -7.2) },
    { name: 'courtyardWallSouth', size: { width: 20.4, height: 3, depth: 0.6 }, pos: new Vector3(7, 1.5, 7.2) },
    { name: 'courtyardWallEast', size: { width: 0.6, height: 3, depth: 14.4 }, pos: new Vector3(17.2, 1.5, 0) }
  ];

  walls.forEach((wall) => {
    createStaticBox(scene, wall.name, wall.size, wall.pos, stoneMaterial);
  });

  createStaticBox(scene, 'cellBed', { width: 2.5, depth: 1.2, height: 0.5 }, new Vector3(-12, 0.7, 1.2), woodMaterial);
  createStaticBox(scene, 'clothRoll', { width: 1.7, depth: 0.7, height: 0.25 }, new Vector3(-12, 1.08, 1.2), clothMaterial);

  createStaticBox(scene, 'altarBase', { width: 2.2, depth: 1.4, height: 1.1 }, new Vector3(14, 0.8, 0), woodMaterial);
  const shrine = createStaticBox(scene, 'shrineMarker', { width: 0.9, depth: 0.9, height: 2.1 }, new Vector3(14, 1.8, 0), clothMaterial);
  shrine.isPickable = false;

  return {
    ground,
    shrinePosition: shrine.position.clone()
  };
}
