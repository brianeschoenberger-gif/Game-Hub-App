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
    stairs: 'Stairs_Exterior_Straight.gltf',
    fence: 'Prop_WoodenFence_Single.gltf',
    crate: 'Prop_Crate.gltf'
  };

  const templateEntries = await Promise.all(
    Object.entries(templateFiles).map(async ([key, fileName]) => [key, await loadTemplateContainer(scene, fileName)])
  );

  const templates = Object.fromEntries(templateEntries);

  const buildingCenter = new Vector3(0, 0, -8);
  const buildingSize = new Vector3(18, 12, 14);

  instantiateTemplate(scene, templates.wallWood, 'mainBuildingFront', {
    size: new Vector3(buildingSize.x, 7, 1.6),
    position: new Vector3(buildingCenter.x, 0, buildingCenter.z - 6.6),
    rotationY: 0
  });
  instantiateTemplate(scene, templates.wallBrick, 'mainBuildingBack', {
    size: new Vector3(buildingSize.x, 7, 1.6),
    position: new Vector3(buildingCenter.x, 0, buildingCenter.z + 6.6),
    rotationY: Math.PI
  });
  instantiateTemplate(scene, templates.wallWood, 'mainBuildingLeft', {
    size: new Vector3(buildingSize.z, 7, 1.6),
    position: new Vector3(buildingCenter.x - 8.6, 0, buildingCenter.z),
    rotationY: -Math.PI / 2
  });
  instantiateTemplate(scene, templates.wallBrick, 'mainBuildingRight', {
    size: new Vector3(buildingSize.z, 7, 1.6),
    position: new Vector3(buildingCenter.x + 8.6, 0, buildingCenter.z),
    rotationY: Math.PI / 2
  });

  instantiateTemplate(scene, templates.roofHouse, 'mainBuildingRoof', {
    size: new Vector3(20, 6.2, 16),
    position: new Vector3(buildingCenter.x, 6, buildingCenter.z),
    rotationY: 0
  });

  instantiateTemplate(scene, templates.stairs, 'mainBuildingStairs', {
    size: new Vector3(6, 3, 4),
    position: new Vector3(buildingCenter.x, 0, buildingCenter.z + 8.8),
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
    { width: 17.6, height: 7.5, depth: 13.4 },
    new Vector3(0, 3.75, -8),
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
  await ensureGltfLoaderScript();

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
