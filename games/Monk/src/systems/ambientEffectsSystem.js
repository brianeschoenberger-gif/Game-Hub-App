import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { gameConfig } from '../config/gameConfig.js';

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function createAmbientEffectsSystem(scene) {
  const cfg = gameConfig.effects.dustMotes;
  const particles = [];
  const material = new StandardMaterial('dustMoteMaterial', scene);
  material.diffuseColor = new Color3(0.95, 0.89, 0.75);
  material.emissiveColor = new Color3(0.12, 0.1, 0.06);
  material.alpha = 0.5;
  material.disableLighting = true;

  for (let i = 0; i < cfg.count; i += 1) {
    const mote = MeshBuilder.CreateSphere(`dustMote${i}`, { diameter: cfg.size, segments: 6 }, scene);
    const basePos = new Vector3(
      randomRange(-cfg.radius, cfg.radius),
      randomRange(cfg.minHeight, cfg.maxHeight),
      randomRange(-cfg.radius, cfg.radius)
    );

    mote.position.copyFrom(basePos);
    mote.material = material;
    mote.isPickable = false;
    mote.checkCollisions = false;

    particles.push({
      mesh: mote,
      basePos,
      phase: Math.random() * Math.PI * 2,
      driftDir: new Vector3(randomRange(-1, 1), 0, randomRange(-1, 1)).normalize()
    });
  }

  function update(deltaTime) {
    const t = performance.now() * 0.001;
    for (const p of particles) {
      p.mesh.position.x += p.driftDir.x * cfg.driftSpeed * deltaTime;
      p.mesh.position.z += p.driftDir.z * cfg.driftSpeed * deltaTime;

      p.mesh.position.y = p.basePos.y + Math.sin(t + p.phase) * cfg.bobAmplitude;

      if (Math.abs(p.mesh.position.x) > cfg.radius) {
        p.mesh.position.x = -p.mesh.position.x * 0.9;
      }
      if (Math.abs(p.mesh.position.z) > cfg.radius) {
        p.mesh.position.z = -p.mesh.position.z * 0.9;
      }
    }
  }

  return { update };
}
