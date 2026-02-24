import '@babylonjs/loaders/glTF';
import { Animation } from '@babylonjs/core/Animations/animation';
import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { Bone } from '@babylonjs/core/Bones/bone';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { createPlayerAnimationController } from './playerAnimationController.js';

const CHARACTER_MODEL_URL = new URL('../../../Assets/Monk/Meshy_AI_Monastic_Contemplatio_0223043241_texture.glb', import.meta.url).href;
const WALK_ANIMATION_URL = new URL('../../../Assets/Monk/Meshy_AI_Animation_Walking_withSkin.glb', import.meta.url).href;
const RUN_ANIMATION_URL = new URL('../../../Assets/Monk/Meshy_AI_Animation_Running_withSkin.glb', import.meta.url).href;

let hasLoggedGlbFallbackWarning = false;

function logGlbFallbackWarning(reason) {
  if (hasLoggedGlbFallbackWarning) {
    return;
  }

  hasLoggedGlbFallbackWarning = true;
  const detail = reason instanceof Error ? reason.message : String(reason ?? 'unknown reason');
  console.warn(`Falling back to procedural monk character: ${detail}`);
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

function createIdleJumpProxyGroups(scene, modelRoot) {
  const baseY = modelRoot.position.y;

  const idleBob = new Animation('idle-bob-proxy', 'position.y', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
  idleBob.setKeys([
    { frame: 0, value: baseY },
    { frame: 15, value: baseY + 0.025 },
    { frame: 30, value: baseY }
  ]);

  const jumpLift = new Animation('jump-lift-proxy', 'position.y', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
  jumpLift.setKeys([
    { frame: 0, value: baseY },
    { frame: 12, value: baseY + 0.16 },
    { frame: 22, value: baseY + 0.08 },
    { frame: 30, value: baseY }
  ]);

  const idle = new AnimationGroup('idle');
  idle.addTargetedAnimation(idleBob, modelRoot);

  const jump = new AnimationGroup('jump');
  jump.addTargetedAnimation(jumpLift, modelRoot);

  return [idle, jump];
}

function createRunProxyGroup(scene, modelRoot) {
  const baseY = modelRoot.position.y;

  const runBob = new Animation('run-bob-proxy', 'position.y', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
  runBob.setKeys([
    { frame: 0, value: baseY - 0.03 },
    { frame: 8, value: baseY + 0.045 },
    { frame: 15, value: baseY - 0.03 },
    { frame: 22, value: baseY + 0.045 },
    { frame: 30, value: baseY - 0.03 }
  ]);

  const runSway = new Animation('run-sway-proxy', 'rotation.y', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
  runSway.setKeys([
    { frame: 0, value: -0.03 },
    { frame: 15, value: 0.03 },
    { frame: 30, value: -0.03 }
  ]);

  const run = new AnimationGroup('run');
  run.addTargetedAnimation(runBob, modelRoot);
  run.addTargetedAnimation(runSway, modelRoot);
  return run;
}

function getActiveAnimationGroups(scene, existingGroupNames) {
  return scene.animationGroups.filter((group) => !existingGroupNames.has(group.name));
}

function alignModelToColliderFeet(collider, modelRoot, footOffset = 0.02) {
  const childMeshes = modelRoot.getChildMeshes(false);
  if (childMeshes.length === 0) {
    return;
  }

  modelRoot.computeWorldMatrix(true);
  let minY = Number.POSITIVE_INFINITY;
  childMeshes.forEach((mesh) => {
    const meshMinY = mesh.getBoundingInfo().boundingBox.minimumWorld.y;
    if (meshMinY < minY) {
      minY = meshMinY;
    }
  });

  const desiredMinY = collider.position.y - 0.9 + footOffset;
  modelRoot.position.y += desiredMinY - minY;
  modelRoot.computeWorldMatrix(true);
}

function disposeImportResult(result) {
  if (!result) {
    return;
  }

  result.meshes?.forEach((mesh) => {
    if (mesh && !mesh.isDisposed()) {
      mesh.dispose(false, true);
    }
  });

  result.transformNodes?.forEach((node) => {
    if (node && !node.isDisposed()) {
      node.dispose(false, true);
    }
  });

  result.skeletons?.forEach((skeleton) => {
    if (skeleton && !skeleton.isDisposed()) {
      skeleton.dispose();
    }
  });
}

function createNodeLookup(result) {
  const byName = new Map();
  result.meshes.forEach((mesh) => byName.set(mesh.name, mesh));
  result.transformNodes.forEach((node) => byName.set(node.name, node));
  result.skeletons.forEach((skeleton) => byName.set(skeleton.name, skeleton));
  return byName;
}

function pickSourceAnimationGroup(groups, clipHint) {
  const hint = clipHint.toLowerCase();
  return groups.find((group) => group.name?.toLowerCase().includes(hint))
    ?? groups.find((group) => group.targetedAnimations.length > 0)
    ?? null;
}

function cloneGroupToTargetRig(scene, sourceGroup, groupName, targetNodesByName, targetSkeleton) {
  const cloned = new AnimationGroup(groupName, scene);
  const targetBonesByName = new Map((targetSkeleton?.bones ?? []).map((bone) => [bone.name, bone]));

  sourceGroup.targetedAnimations.forEach((entry) => {
    const sourceTarget = entry.target;
    let mappedTarget = null;

    if (sourceTarget instanceof Bone || sourceTarget?.getClassName?.() === 'Bone') {
      mappedTarget = targetBonesByName.get(sourceTarget.name) ?? null;
    } else if (sourceTarget?.name) {
      mappedTarget = targetNodesByName.get(sourceTarget.name) ?? null;
    }

    if (mappedTarget) {
      cloned.addTargetedAnimation(entry.animation.clone(`${groupName}_${entry.animation.name || 'anim'}`), mappedTarget);
    }
  });

  if (cloned.targetedAnimations.length === 0) {
    cloned.dispose();
    return null;
  }

  return cloned;
}

async function importRetargetedGroup(scene, animationUrl, clipName, targetNodesByName, targetSkeleton) {
  const existingGroupNames = new Set(scene.animationGroups.map((group) => group.name));
  let animationResult = null;

  try {
    animationResult = await SceneLoader.ImportMeshAsync('', '', animationUrl, scene, undefined, '.glb');
    const newGroups = getActiveAnimationGroups(scene, existingGroupNames);
    const sourceGroup = pickSourceAnimationGroup(newGroups, clipName);
    const retargeted = sourceGroup
      ? cloneGroupToTargetRig(scene, sourceGroup, clipName, targetNodesByName, targetSkeleton)
      : null;

    newGroups.forEach((group) => group.dispose());
    disposeImportResult(animationResult);
    return retargeted;
  } catch (error) {
    const newGroups = getActiveAnimationGroups(scene, existingGroupNames);
    newGroups.forEach((group) => group.dispose());
    disposeImportResult(animationResult);
    console.warn(`Failed to import/retarget ${clipName} clip. ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function createGlbCharacterModel(collider, scene) {
  if (!SceneLoader.IsPluginForExtensionAvailable('.glb')) {
    throw new Error('GLTF loader plugin is not available.');
  }

  let result = null;

  try {
    result = await SceneLoader.ImportMeshAsync('', '', CHARACTER_MODEL_URL, scene, undefined, '.glb');

    const modelRoot = result.meshes.find((mesh) => !mesh.parent) ?? result.meshes[0];
    if (!modelRoot) {
      throw new Error('Unable to find GLB model root mesh for monk character.');
    }

    modelRoot.parent = collider;
    modelRoot.position = new Vector3(0, 0, 0);
    modelRoot.scaling = new Vector3(0.9, 0.9, 0.9);
    modelRoot.rotationQuaternion = null;
    alignModelToColliderFeet(collider, modelRoot);

    const targetNodesByName = createNodeLookup(result);
    const targetSkeleton = result.skeletons[0] ?? null;

    const [walkGroup, runGroup] = await Promise.all([
      importRetargetedGroup(scene, WALK_ANIMATION_URL, 'walk', targetNodesByName, targetSkeleton),
      importRetargetedGroup(scene, RUN_ANIMATION_URL, 'run', targetNodesByName, targetSkeleton)
    ]);

    const [idleProxy, jumpProxy] = createIdleJumpProxyGroups(scene, modelRoot);
    const resolvedRun = runGroup ?? walkGroup ?? createRunProxyGroup(scene, modelRoot);
    resolvedRun.name = 'run';

    return [idleProxy, resolvedRun, jumpProxy];
  } catch (error) {
    disposeImportResult(result);
    throw error;
  }
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
    logGlbFallbackWarning(error);
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
