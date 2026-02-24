import '@babylonjs/loaders/glTF';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

const ASSET_ROOT = '/Assets/Medieval%20Village%20MegaKit%5BStandard%5D/glTF/';

function createStaticBox(scene, name, options, position, material, isVisible = true) {
  const mesh = MeshBuilder.CreateBox(name, options, scene);
  mesh.position = position;
  mesh.material = material;
  mesh.isVisible = isVisible;
  mesh.checkCollisions = true;
  return mesh;
}

function getHierarchyBounds(root) {
  const meshes = root.getChildMeshes(false);
  if (meshes.length === 0) {
    return null;
  }

  let min = meshes[0].getBoundingInfo().boundingBox.minimumWorld.clone();
  let max = meshes[0].getBoundingInfo().boundingBox.maximumWorld.clone();

  for (let i = 1; i < meshes.length; i += 1) {
    const bounds = meshes[i].getBoundingInfo().boundingBox;
    min = Vector3.Minimize(min, bounds.minimumWorld);
    max = Vector3.Maximize(max, bounds.maximumWorld);
  }

  const size = max.subtract(min);
  const center = min.add(max).scale(0.5);

  return { min, max, size, center };
}

function fitRootToPlacement(root, targetSize, targetPosition, rotationY = 0) {
  root.rotation.set(0, rotationY, 0);
  root.scaling.set(1, 1, 1);
  root.position.set(0, 0, 0);
  root.computeWorldMatrix(true);

  let bounds = getHierarchyBounds(root);
  if (!bounds) {
    return;
  }

  const safeSize = new Vector3(
    Math.max(bounds.size.x, 0.001),
    Math.max(bounds.size.y, 0.001),
    Math.max(bounds.size.z, 0.001)
  );

  const scaleFactor = Math.min(
    targetSize.x / safeSize.x,
    targetSize.y / safeSize.y,
    targetSize.z / safeSize.z
  );

  root.scaling.setAll(scaleFactor);
  root.computeWorldMatrix(true);
  bounds = getHierarchyBounds(root);

  if (!bounds) {
    return;
  }

  const anchor = new Vector3(bounds.center.x, bounds.min.y, bounds.center.z);
  root.position.copyFrom(targetPosition.subtract(anchor));
  root.computeWorldMatrix(true);
}

async function loadTemplateContainer(scene, fileName) {
  const url = `${ASSET_ROOT}${fileName}`;
  const container = await SceneLoader.LoadAssetContainerAsync('', url, scene, undefined, '.gltf');
  container.removeAllFromScene();
  return container;
}

function instantiateTemplate(scene, container, name, placement, collisions = false) {
  const instance = container.instantiateModelsToScene((sourceName) => `${name}_${sourceName}`, false);
  const root = new TransformNode(`${name}_root`, scene);

  instance.rootNodes.forEach((node) => {
    if (!node.parent) {
      node.parent = root;
    }
  });

  fitRootToPlacement(root, placement.size, placement.position, placement.rotationY ?? 0);

  if (collisions) {
    root.getChildMeshes(false).forEach((mesh) => {
      mesh.checkCollisions = true;
    });
  }

  return root;
}

async function createVillageVisuals(scene) {
  const templateFiles = {
    corner: 'Corner_ExteriorWide_Brick.gltf',
    wallBrick: 'Wall_UnevenBrick_Straight.gltf',
    wallPlain: 'Wall_Plaster_Straight.gltf',
    floor: 'Floor_WoodDark.gltf',
    roofHouse: 'Roof_RoundTiles_8x14.gltf',
    roofFront: 'Roof_Front_Brick8.gltf',
    stairs: 'Stairs_Exterior_Straight.gltf',
    fence: 'Prop_WoodenFence_Single.gltf',
    crate: 'Prop_Crate.gltf'
  };

  const templateEntries = await Promise.all(
    Object.entries(templateFiles).map(async ([key, fileName]) => [key, await loadTemplateContainer(scene, fileName)])
  );

  const templates = Object.fromEntries(templateEntries);

  const buildingCenter = new Vector3(0, 0, -10);
  const halfWidth = 7.2;
  const halfDepth = 6.2;
  const levelHeight = 3.9;

  instantiateTemplate(scene, templates.floor, 'mainBuildingFloorLower', {
    size: new Vector3(14.8, 0.6, 12.8),
    position: new Vector3(buildingCenter.x, 0.05, buildingCenter.z),
    rotationY: 0
  });
  instantiateTemplate(scene, templates.floor, 'mainBuildingFloorUpper', {
    size: new Vector3(14.8, 0.6, 12.8),
    position: new Vector3(buildingCenter.x, 4.0, buildingCenter.z),
    rotationY: 0
  });

  const storyY = [0, levelHeight];
  storyY.forEach((y, index) => {
    const suffix = index === 0 ? 'Lower' : 'Upper';
    instantiateTemplate(scene, templates.wallPlain, `mainBuildingFront${suffix}`, {
      size: new Vector3(14.6, 4.0, 1.3),
      position: new Vector3(buildingCenter.x, y, buildingCenter.z + halfDepth),
      rotationY: Math.PI
    });
    instantiateTemplate(scene, templates.wallBrick, `mainBuildingBack${suffix}`, {
      size: new Vector3(14.6, 4.0, 1.3),
      position: new Vector3(buildingCenter.x, y, buildingCenter.z - halfDepth),
      rotationY: 0
    });
    instantiateTemplate(scene, templates.wallBrick, `mainBuildingLeft${suffix}`, {
      size: new Vector3(12.8, 4.0, 1.3),
      position: new Vector3(buildingCenter.x - halfWidth, y, buildingCenter.z),
      rotationY: -Math.PI / 2
    });
    instantiateTemplate(scene, templates.wallBrick, `mainBuildingRight${suffix}`, {
      size: new Vector3(12.8, 4.0, 1.3),
      position: new Vector3(buildingCenter.x + halfWidth, y, buildingCenter.z),
      rotationY: Math.PI / 2
    });
  });

  const cornerOffsets = [
    new Vector3(-halfWidth, 0, -halfDepth),
    new Vector3(halfWidth, 0, -halfDepth),
    new Vector3(-halfWidth, 0, halfDepth),
    new Vector3(halfWidth, 0, halfDepth),
    new Vector3(-halfWidth, levelHeight, -halfDepth),
    new Vector3(halfWidth, levelHeight, -halfDepth),
    new Vector3(-halfWidth, levelHeight, halfDepth),
    new Vector3(halfWidth, levelHeight, halfDepth)
  ];
  cornerOffsets.forEach((offset, index) => {
    instantiateTemplate(scene, templates.corner, `mainBuildingCorner_${index}`, {
      size: new Vector3(1.5, 4.0, 1.5),
      position: buildingCenter.add(offset),
      rotationY: (index % 4) * (Math.PI / 2)
    });
  });

  instantiateTemplate(scene, templates.roofHouse, 'mainBuildingRoofMain', {
    size: new Vector3(18.6, 7.5, 16),
    position: new Vector3(buildingCenter.x, 7.2, buildingCenter.z),
    rotationY: 0
  });
  instantiateTemplate(scene, templates.roofFront, 'mainBuildingRoofFront', {
    size: new Vector3(8.2, 2.8, 1.2),
    position: new Vector3(buildingCenter.x, 6.3, buildingCenter.z + halfDepth + 0.45),
    rotationY: Math.PI
  });

  instantiateTemplate(scene, templates.stairs, 'mainBuildingStairs', {
    size: new Vector3(6.2, 3.2, 4.6),
    position: new Vector3(buildingCenter.x, 0, buildingCenter.z + halfDepth + 4.4),
    rotationY: Math.PI
  });

  for (let i = -5; i <= 5; i += 1) {
    instantiateTemplate(scene, templates.fence, `roadFenceLeft_${i}`, {
      size: new Vector3(3.2, 1.6, 0.7),
      position: new Vector3(-7.5, 0, i * 4),
      rotationY: Math.PI / 2
    });
    instantiateTemplate(scene, templates.fence, `roadFenceRight_${i}`, {
      size: new Vector3(3.2, 1.6, 0.7),
      position: new Vector3(7.5, 0, i * 4),
      rotationY: -Math.PI / 2
    });
  }

  instantiateTemplate(scene, templates.crate, 'roadCrateA', {
    size: new Vector3(1.2, 1.2, 1.2),
    position: new Vector3(-5.4, 0, 9.4),
    rotationY: 0.2
  });
  instantiateTemplate(scene, templates.crate, 'roadCrateB', {
    size: new Vector3(1.2, 1.2, 1.2),
    position: new Vector3(5.1, 0, 10.5),
    rotationY: -0.35
  });

}

function createCollisionLayout(scene, terrainMaterial, roadMaterial, hiddenCollisionMaterial) {
  const ground = MeshBuilder.CreateGround('villageGround', { width: 96, height: 96 }, scene);
  ground.material = terrainMaterial;
  ground.checkCollisions = true;

  const road = MeshBuilder.CreateGround('mainRoad', { width: 11.5, height: 88 }, scene);
  road.position.y = 0.01;
  road.material = roadMaterial;
  road.checkCollisions = false;

  createStaticBox(
    scene,
    'mainBuildingCollider',
    { width: 18.8, height: 10.6, depth: 14.8 },
    new Vector3(0, 5.3, -10),
    hiddenCollisionMaterial,
    false
  );

  const boundaries = [
    { name: 'boundWest', pos: new Vector3(-48.5, 3, 0), size: new Vector3(1, 6, 97) },
    { name: 'boundEast', pos: new Vector3(48.5, 3, 0), size: new Vector3(1, 6, 97) },
    { name: 'boundNorth', pos: new Vector3(0, 3, -48.5), size: new Vector3(97, 6, 1) },
    { name: 'boundSouth', pos: new Vector3(0, 3, 48.5), size: new Vector3(97, 6, 1) }
  ];

  boundaries.forEach((box) => {
    createStaticBox(
      scene,
      box.name,
      { width: box.size.x, height: box.size.y, depth: box.size.z },
      box.pos,
      hiddenCollisionMaterial,
      false
    );
  });

  return ground;
}

export async function createMonasteryScene(scene) {
  scene.collisionsEnabled = true;
  if (!SceneLoader.IsPluginForExtensionAvailable('.gltf')) {
    throw new Error('GLTF loader plugin is not available.');
  }

  const terrainMaterial = new StandardMaterial('terrainMaterial', scene);
  terrainMaterial.diffuseColor = new Color3(0.25, 0.5, 0.24);

  const roadMaterial = new StandardMaterial('roadMaterial', scene);
  roadMaterial.diffuseColor = new Color3(0.4, 0.28, 0.17);

  const hiddenCollisionMaterial = new StandardMaterial('hiddenCollisionMaterial', scene);
  hiddenCollisionMaterial.diffuseColor = new Color3(0.35, 0.35, 0.35);
  hiddenCollisionMaterial.alpha = 0;

  const markerMaterial = new StandardMaterial('markerMaterial', scene);
  markerMaterial.diffuseColor = new Color3(0.84, 0.67, 0.33);

  const shrinePosition = new Vector3(-4.2, 0, -16.5);
  const gatePosition = new Vector3(0, 0, 42);
  const interactablePosition = new Vector3(4.8, 0, 9.8);

  const ground = createCollisionLayout(scene, terrainMaterial, roadMaterial, hiddenCollisionMaterial);
  await createVillageVisuals(scene);

  const shrine = createStaticBox(
    scene,
    'shrineMarker',
    { width: 1.2, depth: 1.2, height: 2.8 },
    new Vector3(shrinePosition.x, 1.4, shrinePosition.z),
    markerMaterial,
    false
  );
  shrine.checkCollisions = false;
  shrine.isPickable = false;

  const incenseFlame = MeshBuilder.CreateSphere('incenseFlame', { diameter: 0.22, segments: 12 }, scene);
  incenseFlame.material = markerMaterial;
  incenseFlame.isVisible = false;
  incenseFlame.checkCollisions = false;

  return {
    ground,
    shrinePosition,
    gatePosition,
    interactablePosition,
    interactableFlame: incenseFlame
  };
}
