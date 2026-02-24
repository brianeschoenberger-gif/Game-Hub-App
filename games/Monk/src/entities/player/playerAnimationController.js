import { AnimationGroup } from '@babylonjs/core/Animations/animationGroup';
import { Scalar } from '@babylonjs/core/Maths/math.scalar';

const CLIP_HINTS = {
  idle: ['idle', 'breath', 'stand'],
  walk: ['walk', 'stride'],
  run: ['run', 'sprint', 'jog'],
  jump: ['jump', 'fall']
};

function resolveClip(animationGroups, hints) {
  const lowerHints = hints.map((hint) => hint.toLowerCase());
  return animationGroups.find((group) => {
    const name = group.name?.toLowerCase() ?? '';
    return lowerHints.some((hint) => name.includes(hint));
  }) ?? null;
}

function createJumpProxy(runGroup) {
  if (!runGroup) {
    return null;
  }

  const jumpGroup = runGroup.clone('jumpProxyGroup');
  jumpGroup.speedRatio = 0.7;
  jumpGroup.stop();
  return jumpGroup;
}

export function createPlayerAnimationController(animationGroups = []) {
  const idle = resolveClip(animationGroups, CLIP_HINTS.idle);
  const walk = resolveClip(animationGroups, CLIP_HINTS.walk);
  const run = resolveClip(animationGroups, CLIP_HINTS.run);
  const jump = resolveClip(animationGroups, CLIP_HINTS.jump) ?? createJumpProxy(run ?? walk);

  const clips = { idle, walk, run, jump };
  const weights = { idle: 0, walk: 0, run: 0, jump: 0 };
  let activeState = 'idle';
  let ready = false;

  Object.values(clips).forEach((clip) => {
    if (!clip || !(clip instanceof AnimationGroup)) {
      return;
    }

    clip.play(true);
    clip.setWeightForAllAnimatables(0);
    clip.enableBlending = true;
    clip.blendingSpeed = 0.08;
    ready = true;
  });

  if (ready && clips.idle) {
    weights.idle = 1;
    clips.idle.setWeightForAllAnimatables(1);
  }

  function setState(stateName) {
    if (!ready) {
      return;
    }
    activeState = stateName;
  }

  function update(dt, locomotion) {
    if (!ready) {
      return;
    }

    const targets = {
      idle: activeState === 'idle' ? 1 : 0,
      walk: activeState === 'walk' ? 1 : 0,
      run: activeState === 'run' ? 1 : 0,
      jump: activeState === 'jump' ? 1 : 0
    };

    const blendLerp = Scalar.Clamp(dt * 10, 0, 1);

    if (clips.idle) {
      weights.idle = Scalar.Lerp(weights.idle, targets.idle, blendLerp);
      clips.idle.setWeightForAllAnimatables(weights.idle);
    }

    if (clips.walk) {
      weights.walk = Scalar.Lerp(weights.walk, targets.walk, blendLerp);
      clips.walk.speedRatio = Scalar.Lerp(0.8, 1.1, Scalar.Clamp(locomotion.normalizedSpeed, 0, 0.75) / 0.75);
      clips.walk.setWeightForAllAnimatables(weights.walk);
    }

    if (clips.run) {
      weights.run = Scalar.Lerp(weights.run, targets.run, blendLerp);
      clips.run.speedRatio = Scalar.Lerp(0.9, 1.35, Scalar.Clamp(locomotion.normalizedSpeed, 0, 1));
      clips.run.setWeightForAllAnimatables(weights.run);
    }

    if (clips.jump) {
      weights.jump = Scalar.Lerp(weights.jump, targets.jump, blendLerp);
      clips.jump.setWeightForAllAnimatables(weights.jump);
    }
  }

  return {
    isReady: () => ready,
    setState,
    update
  };
}
