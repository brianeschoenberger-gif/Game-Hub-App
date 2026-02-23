import { Animation } from '@babylonjs/core/Animations/animation';
import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { createPlayerAnimationController } from './playerAnimationController.js';

function createCharacterModel(collider, scene) {
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

function createCharacterAnimationGroups(scene, rig) {
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

export async function createPlayerCharacterVisual(collider, scene) {
  const rig = createCharacterModel(collider, scene);
  const animationGroups = createCharacterAnimationGroups(scene, rig);
  const animationController = createPlayerAnimationController(animationGroups);

  return {
    setAnimationState: animationController.setState,
    update: (dt, locomotion) => animationController.update(dt, locomotion),
    loadedFromGlb: false
  };
}
