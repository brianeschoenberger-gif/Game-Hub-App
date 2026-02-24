import { Animation } from '@babylonjs/core/Animations/animation';
import * as BabylonLegacy from '@babylonjs/core/Legacy/legacy';
import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { createPlayerAnimationController } from './playerAnimationController.js';

const GLTF_LOADER_URL = 'https://cdn.jsdelivr.net/npm/babylonjs-loaders@7.54.3/babylonjs.loaders.min.js';
const CHARACTER_MODEL_URL = new URL('../../../Assets/Monk/Meshy_AI_Monastic_Contemplatio_0223043241_texture.glb', import.meta.url).href;
const WALK_ANIMATION_URL = new URL('../../../Assets/Monk/Meshy_AI_Animation_Walking_withSkin.glb', import.meta.url).href;
const RUN_ANIMATION_URL = new URL('../../../Assets/Monk/Meshy_AI_Animation_Running_withSkin.glb', import.meta.url).href;

let gltfLoaderScriptPromise = null;

function ensureGltfLoaderScript() {
  if (SceneLoader.IsPluginForExtensionAvailable('.glb')) {
    return Promise.resolve();
  }

  if (!gltfLoaderScriptPromise) {
    gltfLoaderScriptPromise = new Promise((resolve, reject) => {
      globalThis.BABYLON = globalThis.BABYLON ?? BabylonLegacy;

      const script = document.createElement('script');
      script.src = GLTF_LOADER_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Babylon UMD loaders script.'));
      document.head.appendChild(script);
    });
  }

  return gltfLoaderScriptPromise;
}

function createFallbackCharacterModel(collider, scene) {
  const skinMaterial = new StandardMaterial('monkSkinMaterial', scene);
  skinMaterial.diffuseColor = new Color3(0.86, 0.73, 0.58);

  const robeMaterial = new StandardMaterial('monkRobeMaterial', scene);
  robeMaterial.diffuseColor = new Color3(0.71, 0.42, 0.2);

  const sashMaterial = new StandardMaterial('monkSashMaterial', scene);
  sashMaterial.diffuseColor = new Color3(0.6, 0.22, 0.18);

  const root = MeshBuilder.CreateBox('monkRoot', { size: 0.01 }, scene);
  root.parent = collider;
  root.position = new Vector3(0, -0.1, 0);
  root.isVisible = false;

  const robe = MeshBuilder.CreateCylinder('monkRobe', {
    height: 1.14,
    diameterTop: 0.42,
    diameterBottom: 0.76,
    tessellation: 18
  }, scene);
  robe.material = robeMaterial;
  robe.parent = root;
  robe.position = new Vector3(0, 0.32, 0);

  const head = MeshBuilder.CreateSphere('monkHead', { diameter: 0.42, segments: 20 }, scene);
  head.material = skinMaterial;
  head.parent = root;
  head.position = new Vector3(0, 1.05, 0);

  const sash = MeshBuilder.CreateTorus('monkSash', {
    diameter: 0.5,
    thickness: 0.08,
    tessellation: 24
  }, scene);
  sash.material = sashMaterial;
  sash.parent = root;
  sash.position = new Vector3(0, 0.45, 0);
  sash.rotation.x = Math.PI / 2;

  const armLeft = MeshBuilder.CreateCapsule('monkArmLeft', { radius: 0.08, height: 0.65, tessellation: 12 }, scene);
  armLeft.material = robeMaterial;
  armLeft.parent = root;
  armLeft.position = new Vector3(-0.28, 0.63, 0);
  armLeft.rotation.z = 0.22;

  const armRight = MeshBuilder.CreateCapsule('monkArmRight', { radius: 0.08, height: 0.65, tessellation: 12 }, scene);
  armRight.material = robeMaterial;
  armRight.parent = root;
  armRight.position = new Vector3(0.28, 0.63, 0);
  armRight.rotation.z = -0.22;

  return { root, armLeft, armRight };
}

function createFallbackAnimationGroups(scene, rig) {
  const idleBob = new Animation('idle-bob', 'position.y', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
  idleBob.setKeys([
    { frame: 0, value: rig.root.position.y },
    { frame: 15, value: rig.root.position.y + 0.03 },
    { frame: 30, value: rig.root.position.y }
  ]);

  const runBob = new Animation('run-bob', 'position.y', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
  runBob.setKeys([
    { frame: 0, value: rig.root.position.y - 0.04 },
    { frame: 8, value: rig.root.position.y + 0.06 },
    { frame: 15, value: rig.root.position.y - 0.04 },
    { frame: 22, value: rig.root.position.y + 0.06 },
    { frame: 30, value: rig.root.position.y - 0.04 }
  ]);

  const runArmLeft = new Animation('run-arm-left', 'rotation.x', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
  runArmLeft.setKeys([
    { frame: 0, value: -0.6 },
    { frame: 15, value: 0.6 },
    { frame: 30, value: -0.6 }
  ]);

  const runArmRight = new Animation('run-arm-right', 'rotation.x', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
  runArmRight.setKeys([
    { frame: 0, value: 0.6 },
    { frame: 15, value: -0.6 },
    { frame: 30, value: 0.6 }
  ]);

  const jumpLift = new Animation('jump-lift', 'position.y', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
  jumpLift.setKeys([
    { frame: 0, value: rig.root.position.y },
    { frame: 12, value: rig.root.position.y + 0.24 },
    { frame: 22, value: rig.root.position.y + 0.16 },
    { frame: 30, value: rig.root.position.y }
  ]);

  const jumpArms = new Animation('jump-arms', 'rotation.x', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
  jumpArms.setKeys([
    { frame: 0, value: 0 },
    { frame: 12, value: -0.8 },
    { frame: 30, value: 0 }
  ]);

  const idle = new AnimationGroup('idle');
  idle.addTargetedAnimation(idleBob, rig.root);

  const run = new AnimationGroup('run');
  run.addTargetedAnimation(runBob, rig.root);
  run.addTargetedAnimation(runArmLeft, rig.armLeft);
  run.addTargetedAnimation(runArmRight, rig.armRight);

  const jump = new AnimationGroup('jump');
  jump.addTargetedAnimation(jumpLift, rig.root);
  jump.addTargetedAnimation(jumpArms, rig.armLeft);
  jump.addTargetedAnimation(jumpArms.clone(), rig.armRight);

  return [idle, run, jump];
}



function hasValidAnimationTargets(group) {
  return group.targetedAnimations.every((entry) => Boolean(entry.target));
}

function getActiveAnimationGroups(scene, existingGroupNames) {
  return scene.animationGroups.filter((group) => !existingGroupNames.has(group.name));
}

async function createGlbCharacterModel(collider, scene) {
  await ensureGltfLoaderScript();
  if (!SceneLoader.IsPluginForExtensionAvailable('.glb')) {
    throw new Error('GLTF loader script did not register a .glb plugin.');
  }

  const existingNames = new Set(scene.animationGroups.map((group) => group.name));
  const result = await SceneLoader.ImportMeshAsync('', '', CHARACTER_MODEL_URL, scene, undefined, '.glb');

  const modelRoot = result.meshes.find((mesh) => !mesh.parent) ?? result.meshes[0];
  if (!modelRoot) {
    throw new Error('Unable to find GLB model root mesh for monk character.');
  }

  modelRoot.parent = collider;
  modelRoot.position = new Vector3(0, -0.9, 0);
  modelRoot.scaling = new Vector3(0.9, 0.9, 0.9);
  modelRoot.rotationQuaternion = null;

  const byName = new Map();
  result.meshes.forEach((mesh) => byName.set(mesh.name, mesh));
  result.transformNodes.forEach((node) => byName.set(node.name, node));
  result.skeletons.forEach((skeleton) => byName.set(skeleton.name, skeleton));

  const targetConverter = (target) => byName.get(target.name) ?? null;

  await SceneLoader.ImportAnimationsAsync('', WALK_ANIMATION_URL, scene, false, undefined, targetConverter, undefined, undefined, undefined, '.glb');
  await SceneLoader.ImportAnimationsAsync('', RUN_ANIMATION_URL, scene, false, undefined, targetConverter, undefined, undefined, undefined, '.glb');

  const importedGroups = getActiveAnimationGroups(scene, existingNames);
  const validGroups = importedGroups.filter(hasValidAnimationTargets);

  if (validGroups.length === 0) {
    throw new Error('Imported GLB animations could not be retargeted to the loaded character rig.');
  }

  return validGroups;
}

export async function createPlayerCharacterVisual(collider, scene) {
  try {
    const animationGroups = await createGlbCharacterModel(collider, scene);
    const animationController = createPlayerAnimationController(animationGroups);

    return {
      setAnimationState: animationController.setState,
      update: (dt, locomotion) => animationController.update(dt, locomotion),
      loadedFromGlb: true
    };
  } catch (error) {
    console.warn('Falling back to procedural monk character.', error);
    const rig = createFallbackCharacterModel(collider, scene);
    const animationGroups = createFallbackAnimationGroups(scene, rig);
    const animationController = createPlayerAnimationController(animationGroups);

    return {
      setAnimationState: animationController.setState,
      update: (dt, locomotion) => animationController.update(dt, locomotion),
      loadedFromGlb: false
    };
  }
}
