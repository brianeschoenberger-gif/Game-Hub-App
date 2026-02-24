import * as BabylonLegacy from '@babylonjs/core/Legacy/legacy';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';

const ASSET_ROOT = new URL('../../Assets/Medieval Village MegaKit[Standard]/glTF/', import.meta.url).href;
const GLTF_LOADER_URL = 'https://cdn.jsdelivr.net/npm/babylonjs-loaders@7.54.3/babylonjs.loaders.min.js';

let gltfLoaderScriptPromise = null;

function ensureGltfLoaderScript() {
  if (SceneLoader.IsPluginForExtensionAvailable('.gltf')) {
    return Promise.resolve();
  }

  if (!gltfLoaderScriptPromise) {
    gltfLoaderScriptPromise = new Promise((resolve, reject) => {
      globalThis.BABYLON = globalThis.BABYLON ?? BabylonLegacy;

      const script = document.createElement('script');
      script.src = GLTF_LOADER_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Babylon glTF loader script.'));
      document.head.appendChild(script);
    });
  }

  return gltfLoaderScriptPromise;
}

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
  const url = new URL(fileName, ASSET_ROOT).href;
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
    wallWood: 'Wall_Plaster_WoodGrid.gltf',
    wallBrick: 'Wall_UnevenBrick_Straight.gltf',
    roofHouse: 'Roof_RoundTiles_8x10.gltf',
    roofTower: 'Roof_Tower_RoundTiles.gltf',
    stairs: 'Stairs_Exterior_Straight.gltf',
    fence: 'Prop_WoodenFence_Single.gltf',
    wagon: 'Prop_Wagon.gltf',
    crate: 'Prop_Crate.gltf',
    vine: 'Prop_Vine2.gltf'
  };

  const templateEntries = await Promise.all(
    Object.entries(templateFiles).map(async ([key, fileName]) => [key, await loadTemplateContainer(scene, fileName)])
  );

  const templates = Object.fromEntries(templateEntries);

  const houseBlocks = [
    { name: 'houseWestA', pos: new Vector3(-22, 0, -8), size: new Vector3(11, 10, 10), rot: 0.08 },
    { name: 'houseWestB', pos: new Vector3(-27, 0, 9), size: new Vector3(13, 11, 12), rot: -0.1 },
    { name: 'houseWestC', pos: new Vector3(-12, 0, 15), size: new Vector3(10, 9, 9), rot: 0.04 },
    { name: 'houseEastA', pos: new Vector3(18, 0, -10), size: new Vector3(12, 10, 11), rot: -0.05 },
    { name: 'houseEastB', pos: new Vector3(24, 0, 7), size: new Vector3(14, 11, 12), rot: 0.1 },
    { name: 'houseEastC', pos: new Vector3(11, 0, 17), size: new Vector3(10, 9, 9), rot: -0.04 }
  ];

  houseBlocks.forEach((house) => {
    instantiateTemplate(scene, templates.wallWood, `${house.name}_wallA`, {
      size: new Vector3(house.size.x, house.size.y * 0.62, 1.4),
      position: new Vector3(house.pos.x, 0, house.pos.z - house.size.z * 0.45),
      rotationY: house.rot
    });

    instantiateTemplate(scene, templates.wallBrick, `${house.name}_wallB`, {
      size: new Vector3(house.size.x * 0.9, house.size.y * 0.55, 1.2),
      position: new Vector3(house.pos.x, 0, house.pos.z + house.size.z * 0.44),
      rotationY: house.rot + Math.PI
    });

    instantiateTemplate(scene, templates.roofHouse, `${house.name}_roof`, {
      size: new Vector3(house.size.x * 1.1, house.size.y * 0.55, house.size.z * 1.05),
      position: new Vector3(house.pos.x, house.size.y * 0.46, house.pos.z),
      rotationY: house.rot
    });

    instantiateTemplate(scene, templates.stairs, `${house.name}_stairs`, {
      size: new Vector3(4.2, 2.8, 3.5),
      position: new Vector3(house.pos.x + 1.2, 0, house.pos.z - house.size.z * 0.57),
      rotationY: house.rot
    });
  });

  instantiateTemplate(scene, templates.roofTower, 'towerCenter', {
    size: new Vector3(10, 15, 10),
    position: new Vector3(0, 0, -19),
    rotationY: 0
  });

  const fenceRows = [
    { startX: -30, z: -2.2, count: 8, dir: 1 },
    { startX: -30, z: 2.2, count: 8, dir: 1 },
    { startX: 6, z: -2.2, count: 8, dir: 1 },
    { startX: 6, z: 2.2, count: 8, dir: 1 }
  ];

  fenceRows.forEach((row, rowIndex) => {
    for (let i = 0; i < row.count; i += 1) {
      instantiateTemplate(scene, templates.fence, `fence_${rowIndex}_${i}`, {
        size: new Vector3(3.2, 1.8, 0.7),
        position: new Vector3(row.startX + row.dir * i * 4.1, 0, row.z),
        rotationY: 0
      });
    }
  });

  instantiateTemplate(scene, templates.wagon, 'wagonCenter', {
    size: new Vector3(4.2, 2.5, 2.8),
    position: new Vector3(-3.5, 0, -1.2),
    rotationY: 0.34
  });

  const cratePositions = [
    new Vector3(-6.6, 0, -0.8),
    new Vector3(-7.5, 0, -1.8),
    new Vector3(-6.3, 0, -2.1)
  ];

  cratePositions.forEach((position, index) => {
    instantiateTemplate(scene, templates.crate, `crate_${index}`, {
      size: new Vector3(1.1, 1.1, 1.1),
      position,
      rotationY: index * 0.4
    });
  });

  const vineSpots = [
    new Vector3(-22, 0.3, -13.2),
    new Vector3(24, 0.3, 1.5),
    new Vector3(11, 0.3, 12.2)
  ];

  vineSpots.forEach((position, index) => {
    instantiateTemplate(scene, templates.vine, `vine_${index}`, {
      size: new Vector3(2.2, 4.2, 1.5),
      position,
      rotationY: index * 1.1
    });
  });
}

function createCollisionLayout(scene, hiddenCollisionMaterial) {
  const ground = MeshBuilder.CreateGround('villageGround', { width: 110, height: 90 }, scene);
  ground.material = hiddenCollisionMaterial;
  ground.isVisible = false;
  ground.checkCollisions = true;

  const buildingColliders = [
    { name: 'colliderWestA', pos: new Vector3(-22, 3.4, -8), size: new Vector3(11, 6.8, 10) },
    { name: 'colliderWestB', pos: new Vector3(-27, 3.9, 9), size: new Vector3(13, 7.8, 12) },
    { name: 'colliderWestC', pos: new Vector3(-12, 3.1, 15), size: new Vector3(10, 6.2, 9) },
    { name: 'colliderEastA', pos: new Vector3(18, 3.5, -10), size: new Vector3(12, 7, 11) },
    { name: 'colliderEastB', pos: new Vector3(24, 3.9, 7), size: new Vector3(14, 7.8, 12) },
    { name: 'colliderEastC', pos: new Vector3(11, 3.1, 17), size: new Vector3(10, 6.2, 9) },
    { name: 'colliderTower', pos: new Vector3(0, 7.5, -19), size: new Vector3(9, 15, 9) }
  ];

  buildingColliders.forEach((box) => {
    createStaticBox(
      scene,
      box.name,
      { width: box.size.x, height: box.size.y, depth: box.size.z },
      box.pos,
      hiddenCollisionMaterial,
      false
    );
  });

  const boundaries = [
    { name: 'boundWest', pos: new Vector3(-44.5, 3, 0), size: new Vector3(1, 6, 84) },
    { name: 'boundEast', pos: new Vector3(44.5, 3, 0), size: new Vector3(1, 6, 84) },
    { name: 'boundNorth', pos: new Vector3(0, 3, -36.5), size: new Vector3(89, 6, 1) },
    { name: 'boundSouth', pos: new Vector3(0, 3, 36.5), size: new Vector3(89, 6, 1) }
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
  await ensureGltfLoaderScript();

  const hiddenCollisionMaterial = new StandardMaterial('hiddenCollisionMaterial', scene);
  hiddenCollisionMaterial.diffuseColor = new Color3(0.35, 0.35, 0.35);
  hiddenCollisionMaterial.alpha = 0;

  const markerMaterial = new StandardMaterial('markerMaterial', scene);
  markerMaterial.diffuseColor = new Color3(0.84, 0.67, 0.33);

  const shrinePosition = new Vector3(-6, 0, 11);
  const gatePosition = new Vector3(0, 0, -30);
  const interactablePosition = new Vector3(-3.8, 0, -1.2);

  const ground = createCollisionLayout(scene, hiddenCollisionMaterial);
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
