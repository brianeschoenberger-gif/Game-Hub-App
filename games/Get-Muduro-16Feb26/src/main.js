import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { buildWorld } from "./world.js";
import { PlayerController } from "./player.js";
import { createUI } from "./ui.js";
import { InteractionSystem } from "./interactions.js";
import { state, applyEffects, resetState } from "./state.js";
import { DialogueManager, buildDialogueSpec } from "./dialogue.js";

function findZoneName(position, zones) {
  for (const zone of zones) {
    if (
      position.x >= zone.min.x && position.x <= zone.max.x &&
      position.y >= zone.min.y && position.y <= zone.max.y &&
      position.z >= zone.min.z && position.z <= zone.max.z
    ) {
      return zone.name;
    }
  }
  return "OUTSIDE";
}

function isInsideAABB(position, aabb) {
  return (
    position.x >= aabb.min.x && position.x <= aabb.max.x &&
    position.y >= aabb.min.y && position.y <= aabb.max.y &&
    position.z >= aabb.min.z && position.z <= aabb.max.z
  );
}

function formatElapsed(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

const app = document.getElementById("app");

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);

const { colliders, zones, spawn, doors, terminal, gMarker, map2d, holdingTrigger } = buildWorld(scene);
const player = new PlayerController(camera, renderer.domElement, colliders);
player.setSpawn(spawn.position, spawn.yaw);

const ui = createUI();
ui.setPointerLocked(false);
ui.setStats(state);

const interactions = new InteractionSystem(ui);
const dialogue = new DialogueManager(ui);
const INTRO_VIDEO = "./20260217_1637_01khq2vmdkfp7rbjkewsqfy72j.mp4";

let elapsedSeconds = 0;
let debugEnabled = false;
let endingTriggered = false;
let holdingDeniedCooldown = 0;
let gameStarted = false;

function getObjective(zoneName) {
  if (state.gates.holdingAccess) return "Proceed to Holding Wing.";

  if (state.gates.ic2Cleared || state.gates.detourOpen) {
    if (state.gates.detourOpen && zoneName !== "COMMAND_GROUND" && zoneName !== "COMMAND_2F") {
      return "Use service route to reach Command (2F).";
    }
    return "Reach Negotiation Suite (2F).";
  }

  if (state.gates.ic1Cleared) return "Clear IC-2.";
  if (state.adminVisited) return "Optional: visit Ops terminal.";
  return "Reach Admin.";
}

function evaluateIC1() {
  const success = state.credibility >= 40 || state.calm >= 50;
  if (success) {
    doors.ic1.unlock();
    state.gates.ic1Cleared = true;
    ui.setMessage("IC-1 cleared.");
    return;
  }

  applyEffects({ tension: 10, calm: -5 });
  ui.setMessage("Denied. Try a different approach.");
}

function evaluateIC2() {
  const success = state.credibility >= 55 && state.tension < 70;
  if (success) {
    doors.ic2.unlock();
    state.gates.ic2Cleared = true;
    ui.setMessage("IC-2 cleared.");
    return;
  }

  state.escorted = true;
  state.gates.detourOpen = true;
  doors.serviceGate.unlock();
  applyEffects({ tension: 10 });
  ui.setMessage("Denied. Use the service route (escorted).");
}

function evaluateGSuite() {
  const winA = (state.credibility + state.calm) >= 140 && state.tension < 80;
  const winB = state.leverage >= 75;

  if (winA) {
    doors.holding.unlock();
    state.gates.holdingAccess = true;
    ui.setMessage("Access granted.");
    return;
  }

  if (winB) {
    doors.holding.unlock();
    state.gates.holdingAccess = true;
    state.highTensionEnding = true;
    applyEffects({ tension: 10 });
    ui.setMessage("Access granted (high tension).");
    return;
  }

  applyEffects({ tension: 10 });
  ui.setMessage("No agreement. Re-engage with a different approach.");
}

function toggleDoorForDev(label, door, onUnlock) {
  door.toggle();
  if (!door.locked && onUnlock) onUnlock();
  ui.setMessage(`${label}: ${door.locked ? "LOCKED" : "UNLOCKED"}`);
}

function summarizeRoute() {
  if (state.highTensionEnding) return "High tension outcome";
  if (state.escorted) return "Escorted route";
  return "Clean entry";
}

function triggerEnding() {
  if (endingTriggered) return;
  endingTriggered = true;

  document.exitPointerLock();

  ui.showEnding(
    {
      route: summarizeRoute(),
      intelCollected: state.intelCollected,
      credibility: state.credibility,
      leverage: state.leverage,
      calm: state.calm,
      tension: state.tension,
      elapsed: formatElapsed(elapsedSeconds),
    },
    () => restartGame()
  );
}

function restartGame() {
  resetState();
  gameStarted = false;

  doors.ic1.lock();
  doors.ic2.lock();
  doors.holding.lock();
  doors.serviceGate.lock();

  player.setSpawn(spawn.position, spawn.yaw);
  player.setPaused(false);
  player.setEscorted(false);

  elapsedSeconds = 0;
  endingTriggered = false;
  holdingDeniedCooldown = 0;

  ui.hideEnding();
  ui.showStart(() => {
    ui.hideStart();
    ui.showIntroVideo(INTRO_VIDEO, () => {
      gameStarted = true;
      renderer.domElement.requestPointerLock();
    });
  });
  ui.setMessage("Mission reset.");
}

interactions.register({
  id: "door-ic1",
  label: "Negotiate IC-1 Gate",
  position: new THREE.Vector3(doors.ic1.mesh.position.x, 1.6, doors.ic1.mesh.position.z),
  radius: 3.2,
  onInteract() {
    if (state.gates.ic1Cleared || !doors.ic1.locked) return "IC-1 already cleared.";

    dialogue.open(buildDialogueSpec("ic1_gate"), () => {
      evaluateIC1();
    });

    return null;
  },
});

interactions.register({
  id: "door-ic2",
  label: "Negotiate IC-2 Gate",
  position: new THREE.Vector3(doors.ic2.mesh.position.x, 1.6, doors.ic2.mesh.position.z),
  radius: 3.2,
  onInteract() {
    if (state.gates.ic2Cleared || !doors.ic2.locked) return "IC-2 already cleared.";

    dialogue.open(buildDialogueSpec("ic2_gate"), () => {
      evaluateIC2();
    });

    return null;
  },
});

interactions.register({
  id: "door-holding",
  label: "Check Holding Door",
  position: new THREE.Vector3(doors.holding.mesh.position.x, 1.6, doors.holding.mesh.position.z),
  radius: 3.2,
  onInteract() {
    return doors.holding.locked ? "Locked." : "Open.";
  },
});

interactions.register({
  id: "ops-terminal",
  label: "Use Terminal",
  position: terminal.position,
  radius: 2.5,
  onInteract() {
    if (!state.intelCollected) {
      state.intelCollected = true;
      return "Intel acquired.";
    }
    return "Already downloaded.";
  },
});

interactions.register({
  id: "g-suite",
  label: "Speak to Commander",
  position: gMarker.position,
  radius: 3.0,
  onInteract() {
    if (state.gates.holdingAccess) return "Negotiation complete.";

    dialogue.open(buildDialogueSpec("g_suite"), () => {
      evaluateGSuite();
    });

    return null;
  },
});

const clock = new THREE.Clock();

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  if (event.code === "Backquote") {
    debugEnabled = !debugEnabled;
    ui.setDebugVisible(debugEnabled);
    return;
  }

  if (event.code === "KeyE") {
    interactions.handleInteract();
    return;
  }

  if (!gameStarted || dialogue.isOpen() || ui.isEndingVisible() || ui.isIntroVideoVisible()) return;

  if (event.code === "Digit1") {
    toggleDoorForDev("IC-1", doors.ic1, () => { state.gates.ic1Cleared = true; });
    return;
  }

  if (event.code === "Digit2") {
    toggleDoorForDev("IC-2", doors.ic2, () => { state.gates.ic2Cleared = true; });
    return;
  }

  if (event.code === "Digit3") {
    toggleDoorForDev("HOLDING", doors.holding, () => { state.gates.holdingAccess = true; });
  }
});

function animate() {
  const dt = clock.getDelta();

  const paused = !gameStarted || dialogue.isOpen() || ui.isEndingVisible() || ui.isIntroVideoVisible();
  player.setPaused(paused);
  player.setEscorted(state.escorted);
  interactions.setEnabled(!paused);

  if (!paused) {
    elapsedSeconds += dt;
    if (holdingDeniedCooldown > 0) holdingDeniedCooldown -= dt;
  }

  player.update(dt);

  const position = player.getPosition();
  const yawPitch = player.getYawPitch();
  const zoneName = findZoneName(position, zones);

  if (zoneName === "ADMIN") {
    state.adminVisited = true;
  }

  if (!paused && isInsideAABB(position, holdingTrigger)) {
    if (state.gates.holdingAccess) {
      triggerEnding();
    } else if (holdingDeniedCooldown <= 0) {
      ui.setMessage("Access not granted.");
      holdingDeniedCooldown = 1.2;
    }
  }

  interactions.update(position);

  const objective = getObjective(zoneName);

  ui.setZone(zoneName);
  ui.setObjective(objective);
  ui.setPointerLocked(player.isPointerLocked());
  ui.setStats(state);
  ui.updateMinimap(dt, position, yawPitch.yaw, map2d);

  if (debugEnabled) {
    ui.setDebugText(
`Pos: x ${position.x.toFixed(2)} y ${position.y.toFixed(2)} z ${position.z.toFixed(2)}
Yaw/Pitch: ${yawPitch.yaw.toFixed(3)} / ${yawPitch.pitch.toFixed(3)}
Zone: ${zoneName}
Objective: ${objective}
Flags: intel=${state.intelCollected} escorted=${state.escorted} highTension=${state.highTensionEnding}
Gates: ic1=${state.gates.ic1Cleared} ic2=${state.gates.ic2Cleared} holding=${state.gates.holdingAccess} detour=${state.gates.detourOpen}
Time: ${formatElapsed(elapsedSeconds)}`
    );
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

ui.showStart(() => {
  ui.hideStart();
  ui.showIntroVideo(INTRO_VIDEO, () => {
    gameStarted = true;
    renderer.domElement.requestPointerLock();
  });
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
