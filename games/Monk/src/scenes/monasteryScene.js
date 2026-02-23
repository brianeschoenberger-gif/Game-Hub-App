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

function createWalls(scene, walls, material) {
  walls.forEach((wall) => {
    createStaticBox(scene, wall.name, wall.size, wall.pos, material);
  });
}

function addRoom(scene, room, wallMaterial) {
  const wallHeight = 3;
  const wallThickness = 0.6;
  const halfWidth = room.width / 2;
  const halfDepth = room.depth / 2;

  createWalls(scene, [
    {
      name: `${room.name}WallNorth`,
      size: { width: room.width + wallThickness, height: wallHeight, depth: wallThickness },
      pos: new Vector3(room.center.x, wallHeight / 2, room.center.z - halfDepth)
    },
    {
      name: `${room.name}WallSouth`,
      size: { width: room.width + wallThickness, height: wallHeight, depth: wallThickness },
      pos: new Vector3(room.center.x, wallHeight / 2, room.center.z + halfDepth)
    },
    {
      name: `${room.name}WallWest`,
      size: { width: wallThickness, height: wallHeight, depth: room.depth + wallThickness },
      pos: new Vector3(room.center.x - halfWidth, wallHeight / 2, room.center.z)
    },
    {
      name: `${room.name}WallEast`,
      size: { width: wallThickness, height: wallHeight, depth: room.depth + wallThickness },
      pos: new Vector3(room.center.x + halfWidth, wallHeight / 2, room.center.z)
    }
  ], wallMaterial);
}

export function createMonasteryScene(scene) {
  scene.collisionsEnabled = true;

  const stoneMaterial = new StandardMaterial('stoneMaterial', scene);
  stoneMaterial.diffuseColor = new Color3(0.57, 0.55, 0.52);

  const woodMaterial = new StandardMaterial('woodMaterial', scene);
  woodMaterial.diffuseColor = new Color3(0.46, 0.34, 0.23);

  const clothMaterial = new StandardMaterial('clothMaterial', scene);
  clothMaterial.diffuseColor = new Color3(0.69, 0.61, 0.48);

  const gardenMaterial = new StandardMaterial('gardenMaterial', scene);
  gardenMaterial.diffuseColor = new Color3(0.35, 0.43, 0.33);

  const waterMaterial = new StandardMaterial('waterMaterial', scene);
  waterMaterial.diffuseColor = new Color3(0.35, 0.53, 0.62);

  const ground = MeshBuilder.CreateGround('ground', { width: 78, height: 58 }, scene);
  ground.material = stoneMaterial;
  ground.checkCollisions = true;

  addRoom(scene, { name: 'northCellA', center: new Vector3(-30, 0, -13), width: 8, depth: 8 }, stoneMaterial);
  addRoom(scene, { name: 'northCellB', center: new Vector3(-21, 0, -13), width: 8, depth: 8 }, stoneMaterial);
  addRoom(scene, { name: 'kitchen', center: new Vector3(-30, 0, 2), width: 8, depth: 8 }, stoneMaterial);
  addRoom(scene, { name: 'startCell', center: new Vector3(-21, 0, 2), width: 8, depth: 8 }, stoneMaterial);

  const courtyardFloor = createStaticBox(
    scene,
    'courtyardFloor',
    { width: 31, depth: 26, height: 0.5 },
    new Vector3(-1, 0.25, -4),
    gardenMaterial
  );
  courtyardFloor.checkCollisions = false;

  createStaticBox(scene, 'northArchWall', { width: 15, depth: 0.6, height: 4 }, new Vector3(-1, 2, -17), stoneMaterial);
  createStaticBox(scene, 'northArchPillarLeft', { width: 0.9, depth: 0.9, height: 4 }, new Vector3(-8.2, 2, -17), stoneMaterial);
  createStaticBox(scene, 'northArchPillarRight', { width: 0.9, depth: 0.9, height: 4 }, new Vector3(6.2, 2, -17), stoneMaterial);

  createStaticBox(scene, 'bookshelfUpper', { width: 14, depth: 0.8, height: 1.6 }, new Vector3(-14.5, 0.8, -17), woodMaterial);
  createStaticBox(scene, 'bookshelfLower', { width: 14, depth: 0.8, height: 1.6 }, new Vector3(-14.5, 0.8, 6), woodMaterial);

  createStaticBox(scene, 'northBedAFrame', { width: 2.5, depth: 1.4, height: 0.55 }, new Vector3(-31, 0.72, -14.8), woodMaterial);
  createStaticBox(scene, 'northBedAMat', { width: 1.8, depth: 1, height: 0.2 }, new Vector3(-31, 1.08, -14.8), clothMaterial);
  createStaticBox(scene, 'northBedBFrame', { width: 2.5, depth: 1.4, height: 0.55 }, new Vector3(-22, 0.72, -14.8), woodMaterial);
  createStaticBox(scene, 'northBedBMat', { width: 1.8, depth: 1, height: 0.2 }, new Vector3(-22, 1.08, -14.8), clothMaterial);
  createStaticBox(scene, 'startBedFrame', { width: 2.5, depth: 1.4, height: 0.55 }, new Vector3(-22, 0.72, 3.8), woodMaterial);
  createStaticBox(scene, 'startBedMat', { width: 1.8, depth: 1, height: 0.2 }, new Vector3(-22, 1.08, 3.8), clothMaterial);

  createStaticBox(scene, 'statueBase', { width: 3, depth: 2, height: 1 }, new Vector3(-7, 0.6, -4), stoneMaterial);
  const shrine = createStaticBox(scene, 'shrineMarker', { width: 0.9, depth: 0.9, height: 2.2 }, new Vector3(-7, 1.8, -4), clothMaterial);
  shrine.isPickable = false;

  const fountain = MeshBuilder.CreateCylinder('fountain', { height: 0.9, diameter: 6, tessellation: 28 }, scene);
  fountain.position = new Vector3(4.5, 0.45, -4);
  fountain.material = waterMaterial;
  fountain.checkCollisions = true;

  const eastTopWalls = [
    { name: 'eastTopOuterNorth', size: { width: 16, height: 3, depth: 0.6 }, pos: new Vector3(23, 1.5, -17) },
    { name: 'eastTopOuterSouth', size: { width: 16, height: 3, depth: 0.6 }, pos: new Vector3(23, 1.5, -6.5) },
    { name: 'eastTopOuterEast', size: { width: 0.6, height: 3, depth: 10.5 }, pos: new Vector3(31, 1.5, -11.8) },
    { name: 'eastTopOuterWestA', size: { width: 0.6, height: 3, depth: 4 }, pos: new Vector3(15, 1.5, -15) },
    { name: 'eastTopOuterWestB', size: { width: 0.6, height: 3, depth: 4.5 }, pos: new Vector3(15, 1.5, -8.8) },
    { name: 'eastTopMazeA', size: { width: 6, height: 3, depth: 0.6 }, pos: new Vector3(20, 1.5, -13.2) },
    { name: 'eastTopMazeB', size: { width: 0.6, height: 3, depth: 5 }, pos: new Vector3(24, 1.5, -14.5) },
    { name: 'eastTopMazeC', size: { width: 4.2, height: 3, depth: 0.6 }, pos: new Vector3(26.8, 1.5, -10.6) },
    { name: 'eastTopMazeD', size: { width: 0.6, height: 3, depth: 4 }, pos: new Vector3(19.2, 1.5, -9.5) }
  ];
  createWalls(scene, eastTopWalls, stoneMaterial);

  const eastBottomWalls = [
    { name: 'eastBottomOuterNorth', size: { width: 16, height: 3, depth: 0.6 }, pos: new Vector3(23, 1.5, 6.5) },
    { name: 'eastBottomOuterSouth', size: { width: 16, height: 3, depth: 0.6 }, pos: new Vector3(23, 1.5, 22) },
    { name: 'eastBottomOuterWest', size: { width: 0.6, height: 3, depth: 15.5 }, pos: new Vector3(15, 1.5, 14.2) },
    { name: 'eastBottomOuterEastA', size: { width: 0.6, height: 3, depth: 5.5 }, pos: new Vector3(31, 1.5, 9.2) },
    { name: 'eastBottomOuterEastB', size: { width: 0.6, height: 3, depth: 8 }, pos: new Vector3(31, 1.5, 18) },
    { name: 'eastBottomMazeA', size: { width: 9.6, height: 3, depth: 0.6 }, pos: new Vector3(21.4, 1.5, 11.5) },
    { name: 'eastBottomMazeB', size: { width: 0.6, height: 3, depth: 7 }, pos: new Vector3(19, 1.5, 16.8) },
    { name: 'eastBottomMazeC', size: { width: 4.5, height: 3, depth: 0.6 }, pos: new Vector3(27.7, 1.5, 14.6) },
    { name: 'eastBottomMazeD', size: { width: 0.6, height: 3, depth: 6 }, pos: new Vector3(26, 1.5, 18.9) }
  ];
  createWalls(scene, eastBottomWalls, stoneMaterial);

  createStaticBox(scene, 'southBlockWest', { width: 17, depth: 11, height: 3 }, new Vector3(-13, 1.5, 18), stoneMaterial);
  createStaticBox(scene, 'southBlockCenter', { width: 10, depth: 11, height: 3 }, new Vector3(2.5, 1.5, 18), stoneMaterial);

  createStaticBox(scene, 'mapBoundaryWest', { width: 0.6, depth: 48, height: 3 }, new Vector3(-34.8, 1.5, 3), stoneMaterial);
  createStaticBox(scene, 'mapBoundaryNorth', { width: 48, depth: 0.6, height: 3 }, new Vector3(-10.5, 1.5, -20.5), stoneMaterial);
  createStaticBox(scene, 'mapBoundarySouth', { width: 66, depth: 0.6, height: 3 }, new Vector3(-2, 1.5, 24.2), stoneMaterial);

  return {
    ground,
    shrinePosition: shrine.position.clone()
  };
}
