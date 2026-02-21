import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function createBox(scene, colliders, {
  x,
  y,
  z,
  w,
  h,
  d,
  color = 0x4b5a6a,
  solid = true,
}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color })
  );
  mesh.position.set(x, y, z);
  scene.add(mesh);

  let collider = null;
  if (solid) {
    collider = {
      min: new THREE.Vector3(x - w * 0.5, y - h * 0.5, z - d * 0.5),
      max: new THREE.Vector3(x + w * 0.5, y + h * 0.5, z + d * 0.5),
      enabled: true,
    };
    colliders.push(collider);
  }

  return { mesh, collider };
}

function createDoor(scene, colliders, { id, x, y, z, w, h, d, color = 0x8e2f2f }) {
  const result = createBox(scene, colliders, { x, y, z, w, h, d, color, solid: true });
  const closedY = y;
  const openY = y + h + 0.4;

  const door = {
    id,
    mesh: result.mesh,
    collider: result.collider,
    locked: true,
    unlock() {
      door.locked = false;
      door.collider.enabled = false;
      door.mesh.position.y = openY;
      door.mesh.material.color.setHex(0x2f8e46);
    },
    lock() {
      door.locked = true;
      door.collider.enabled = true;
      door.mesh.position.y = closedY;
      door.mesh.material.color.setHex(color);
    },
    toggle() {
      if (door.locked) door.unlock();
      else door.lock();
    },
  };

  door.lock();
  return door;
}

function createLabelSprite(text, scale = 4.5) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(8, 14, 22, 0.75)";
  ctx.fillRect(0, 8, 512, 112);
  ctx.strokeStyle = "rgba(127, 167, 208, 0.95)";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 12, 504, 104);
  ctx.fillStyle = "#e8f2ff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 44px Segoe UI";
  ctx.fillText(text, 256, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sprite.scale.set(scale, scale * 0.25, 1);
  return sprite;
}

function addZone(zones, name, minX, minY, minZ, maxX, maxY, maxZ) {
  zones.push({
    name,
    min: new THREE.Vector3(minX, minY, minZ),
    max: new THREE.Vector3(maxX, maxY, maxZ),
  });
}

export function buildWorld(scene) {
  const colliders = [];
  const zones = [];

  scene.background = new THREE.Color(0x91b8d6);
  scene.fog = new THREE.Fog(0x91b8d6, 110, 260);

  const hemi = new THREE.HemisphereLight(0xe8f4ff, 0x4f5f4f, 0.7);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 0.95);
  sun.position.set(80, 140, 20);
  scene.add(sun);

  // Ground
  createBox(scene, colliders, {
    x: 0,
    y: -0.5,
    z: 0,
    w: 220,
    h: 1,
    d: 220,
    color: 0x5f7f58,
    solid: false,
  });

  // Roads / paths / courtyard surfaces
  createBox(scene, colliders, { x: 0, y: 0.02, z: -55, w: 180, h: 0.04, d: 18, color: 0x3a4249, solid: false });
  createBox(scene, colliders, { x: -48, y: 0.02, z: -6, w: 16, h: 0.04, d: 80, color: 0x3a4249, solid: false });
  createBox(scene, colliders, { x: 14, y: 0.02, z: -4, w: 20, h: 0.04, d: 80, color: 0x3a4249, solid: false });
  createBox(scene, colliders, { x: 56, y: 0.02, z: 6, w: 14, h: 0.04, d: 58, color: 0x3a4249, solid: false });
  createBox(scene, colliders, { x: 12, y: 0.015, z: 22, w: 64, h: 0.03, d: 44, color: 0x9cae97, solid: false });

  // Perimeter fence / wall
  const fenceH = 3.2;
  const fenceT = 1.0;
  const half = 100;
  createBox(scene, colliders, { x: 0, y: fenceH * 0.5, z: -half, w: 200, h: fenceH, d: fenceT, color: 0x5f6468 });
  createBox(scene, colliders, { x: 0, y: fenceH * 0.5, z: half, w: 200, h: fenceH, d: fenceT, color: 0x5f6468 });
  createBox(scene, colliders, { x: -half, y: fenceH * 0.5, z: 0, w: fenceT, h: fenceH, d: 200, color: 0x5f6468 });
  createBox(scene, colliders, { x: half, y: fenceH * 0.5, z: 0, w: fenceT, h: fenceH, d: 200, color: 0x5f6468 });

  // Main gate markers
  createBox(scene, colliders, { x: -16, y: 2, z: -100, w: 14, h: 4, d: 1.2, color: 0x6c7176 });
  createBox(scene, colliders, { x: 16, y: 2, z: -100, w: 14, h: 4, d: 1.2, color: 0x6c7176 });
  createBox(scene, colliders, { x: -7.5, y: 2, z: -100, w: 1, h: 4, d: 2, color: 0x7d858d });
  createBox(scene, colliders, { x: 7.5, y: 2, z: -100, w: 1, h: 4, d: 2, color: 0x7d858d });

  // LZ pad
  createBox(scene, colliders, { x: -74, y: 0.03, z: 62, w: 30, h: 0.06, d: 30, color: 0x2d4f55, solid: false });
  const lzRing = new THREE.Mesh(
    new THREE.RingGeometry(7, 8, 32),
    new THREE.MeshBasicMaterial({ color: 0xe6f4ff, side: THREE.DoubleSide })
  );
  lzRing.rotation.x = -Math.PI / 2;
  lzRing.position.set(-74, 0.06, 62);
  scene.add(lzRing);

  function createBuilding({
    x,
    z,
    w,
    d,
    h,
    wall = 1,
    color = 0x6b7885,
    opening = "south",
    westOpening = null,
  }) {
    const halfW = w * 0.5;
    const halfD = d * 0.5;
    const y = h * 0.5;

    createBox(scene, colliders, { x, y: 0.12, z, w, h: 0.24, d, color: 0x7d8b96, solid: false });
    createBox(scene, colliders, { x, y, z: z - halfD, w, h, d: wall, color });

    if (opening === "south") {
      createBox(scene, colliders, { x: x - (w * 0.28), y, z: z + halfD, w: w * 0.44, h, d: wall, color });
      createBox(scene, colliders, { x: x + (w * 0.28), y, z: z + halfD, w: w * 0.44, h, d: wall, color });
    } else {
      createBox(scene, colliders, { x, y, z: z + halfD, w, h, d: wall, color });
    }

    if (westOpening) {
      const gapCenter = westOpening.centerZ ?? z;
      const gapSize = Math.min(d - 2, Math.max(2, westOpening.width ?? 8));
      const lowLen = (gapCenter - gapSize * 0.5) - (z - halfD);
      const highLen = (z + halfD) - (gapCenter + gapSize * 0.5);
      const lowCenter = (z - halfD) + lowLen * 0.5;
      const highCenter = (gapCenter + gapSize * 0.5) + highLen * 0.5;

      if (lowLen > 0.2) {
        createBox(scene, colliders, { x: x - halfW, y, z: lowCenter, w: wall, h, d: lowLen, color });
      }
      if (highLen > 0.2) {
        createBox(scene, colliders, { x: x - halfW, y, z: highCenter, w: wall, h, d: highLen, color });
      }
    } else {
      createBox(scene, colliders, { x: x - halfW, y, z, w: wall, h, d, color });
    }
    createBox(scene, colliders, { x: x + halfW, y, z, w: wall, h, d, color });
  }

  // Buildings
  createBuilding({ x: 44, z: -18, w: 24, d: 18, h: 5.2, color: 0x6f8289 }); // Ops
  createBuilding({
    x: 12,
    z: 26,
    w: 34,
    d: 24,
    h: 6.2,
    color: 0x6f7387,
    westOpening: { centerZ: 26, width: 8 },
  }); // Command
  createBuilding({ x: 44, z: 30, w: 24, d: 20, h: 5.8, color: 0x7f6f7f }); // Holding

  // Maze sector beyond IC-1
  const mazeColor = 0x4b5c66;
  const mazeH = 3.2;
  createBox(scene, colliders, { x: -41, y: 1.6, z: -50, w: 18, h: mazeH, d: 1.2, color: mazeColor });
  createBox(scene, colliders, { x: 3, y: 1.6, z: -50, w: 38, h: mazeH, d: 1.2, color: mazeColor });
  createBox(scene, colliders, { x: -17, y: 1.6, z: -96, w: 78, h: mazeH, d: 1.2, color: mazeColor });
  createBox(scene, colliders, { x: -56, y: 1.6, z: -73, w: 1.2, h: mazeH, d: 46, color: mazeColor });
  createBox(scene, colliders, { x: 22, y: 1.6, z: -73, w: 1.2, h: mazeH, d: 46, color: mazeColor });
  createBox(scene, colliders, { x: -34, y: 1.6, z: -60, w: 1.2, h: mazeH, d: 20, color: mazeColor });
  createBox(scene, colliders, { x: -20, y: 1.6, z: -86, w: 1.2, h: mazeH, d: 20, color: mazeColor });
  createBox(scene, colliders, { x: -6, y: 1.6, z: -62, w: 1.2, h: mazeH, d: 22, color: mazeColor });
  createBox(scene, colliders, { x: 8, y: 1.6, z: -84, w: 1.2, h: mazeH, d: 22, color: mazeColor });
  createBox(scene, colliders, { x: -26, y: 1.6, z: -72, w: 24, h: mazeH, d: 1.2, color: mazeColor });
  createBox(scene, colliders, { x: 2, y: 1.6, z: -72, w: 24, h: mazeH, d: 1.2, color: mazeColor });
  createBox(scene, colliders, { x: -10, y: 1.6, z: -88, w: 24, h: mazeH, d: 1.2, color: mazeColor });

  // Command 2F platform
  createBox(scene, colliders, { x: 12, y: 4, z: 26, w: 20, h: 0.5, d: 14, color: 0x8ca0b4 });
  createBox(scene, colliders, { x: 2, y: 2, z: 26, w: 1, h: 4, d: 14, color: 0x6d7381 });

  // Stepped ramp to 2F
  const stepCount = 12;
  const stepRise = 4 / stepCount;
  const stepRun = 1.35;
  const rampStartX = -14;
  const rampZ = 26;
  const stepWidth = 6.0;
  for (let i = 0; i < stepCount; i += 1) {
    const topY = stepRise * (i + 1);
    const x = rampStartX + i * stepRun + stepRun * 0.5;
    createBox(scene, colliders, {
      x,
      y: topY * 0.5,
      z: rampZ,
      w: stepRun,
      h: topY,
      d: stepWidth,
      color: 0x8797a7,
    });
  }

  // Motor pool and obstacles
  createBox(scene, colliders, { x: -66, y: 0.05, z: 6, w: 26, h: 0.1, d: 34, color: 0x585f67, solid: false });
  createBox(scene, colliders, { x: -66, y: 1.3, z: -11, w: 26, h: 2.6, d: 0.8, color: 0x63696e });
  createBox(scene, colliders, { x: -66, y: 1.3, z: 23, w: 26, h: 2.6, d: 0.8, color: 0x63696e });
  createBox(scene, colliders, { x: -79, y: 1.3, z: 6, w: 0.8, h: 2.6, d: 34, color: 0x63696e });
  // East side has an opening so motor pool is accessible.
  createBox(scene, colliders, { x: -53, y: 1.3, z: -2, w: 0.8, h: 2.6, d: 18, color: 0x63696e });
  createBox(scene, colliders, { x: -53, y: 1.3, z: 16, w: 0.8, h: 2.6, d: 14, color: 0x63696e });
  createBox(scene, colliders, { x: -61, y: 0.8, z: 8, w: 4, h: 1.6, d: 4, color: 0x74635a });
  createBox(scene, colliders, { x: -70, y: 1.0, z: 0, w: 5, h: 2.0, d: 3.5, color: 0x6a5f4f });

  // Sector barrier requiring IC-2 or service detour
  createBox(scene, colliders, { x: -47.5, y: 1.6, z: 2, w: 83, h: 3.2, d: 1.2, color: 0x56616d });
  createBox(scene, colliders, { x: 6, y: 1.6, z: 2, w: 24, h: 3.2, d: 1.2, color: 0x56616d });
  createBox(scene, colliders, { x: 60, y: 1.6, z: 2, w: 60, h: 3.2, d: 1.2, color: 0x56616d });
  createBox(scene, colliders, { x: 99, y: 1.6, z: 2, w: 2, h: 3.2, d: 1.2, color: 0x56616d });

  // Lockable blockers
  const doors = {
    ic1: createDoor(scene, colliders, {
      id: "ic1",
      x: -18,
      y: 1.6,
      z: -44,
      w: 12,
      h: 3.2,
      d: 1.2,
      color: 0x8c2f2f,
    }),
    ic2: createDoor(scene, colliders, {
      id: "ic2",
      x: 24,
      y: 1.6,
      z: 2,
      w: 12,
      h: 3.2,
      d: 1.2,
      color: 0x8c5b2f,
    }),
    serviceGate: createDoor(scene, colliders, {
      id: "serviceGate",
      x: 94,
      y: 1.6,
      z: 2,
      w: 8,
      h: 3.2,
      d: 1.2,
      color: 0x2f5d8c,
    }),
    holding: createDoor(scene, colliders, {
      id: "holding",
      x: 32,
      y: 1.6,
      z: 30,
      w: 1.2,
      h: 3.2,
      d: 8,
      color: 0x8c2f76,
    }),
  };

  // Give IC-1 a proper gate context (flanking wall sections) so it is not isolated in open field.
  createBox(scene, colliders, { x: -32, y: 1.6, z: -44, w: 16, h: 3.2, d: 1.2, color: 0x56616d });
  createBox(scene, colliders, { x: -4, y: 1.6, z: -44, w: 16, h: 3.2, d: 1.2, color: 0x56616d });

  // Ops terminal
  const terminalGeom = new THREE.BoxGeometry(1.2, 1.4, 0.8);
  const terminalMat = new THREE.MeshLambertMaterial({ color: 0x2b566e, emissive: 0x113344, emissiveIntensity: 0.7 });
  const terminalMesh = new THREE.Mesh(terminalGeom, terminalMat);
  terminalMesh.position.set(44, 0.7, -18);
  scene.add(terminalMesh);

  const terminalScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.55, 0.08),
    new THREE.MeshLambertMaterial({ color: 0x7ed8ff, emissive: 0x2f8fb0, emissiveIntensity: 0.9 })
  );
  terminalScreen.position.set(44, 1.35, -17.58);
  scene.add(terminalScreen);

  // G suite marker on 2F
  const gMarker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 1.2, 12),
    new THREE.MeshLambertMaterial({ color: 0xf2c36e, emissive: 0xa06f2a, emissiveIntensity: 0.55 })
  );
  gMarker.position.set(12, 4.9, 26);
  scene.add(gMarker);

  const labels = [
    ["LZ", -74, 2.8, 62],
    ["GATE", 0, 3.0, -96],
    ["MAZE SECTOR", -16, 3.0, -73],
    ["OPS (C)", 44, 2.9, -10],
    ["COMMAND (G)", 12, 3.1, 16],
    ["HOLDING (H)", 44, 3.0, 40],
    ["MOTOR POOL", -66, 3.0, 6],
    ["COURTYARD", 12, 2.8, 22],
    ["2F RAMP", -7, 3.3, 33],
    ["IC-1 GATE", -18, 3.0, -40],
    ["IC-2 GATE", 24, 3.0, 6],
    ["SERVICE GATE", 94, 3.0, 6],
  ];
  for (const [txt, x, y, z] of labels) {
    const sprite = createLabelSprite(txt);
    sprite.position.set(x, y, z);
    scene.add(sprite);
  }

  addZone(zones, "LZ", -90, -2, 46, -58, 8, 78);
  addZone(zones, "GATE", -20, -2, -100, 20, 8, -86);
  addZone(zones, "ADMIN", -50, -2, -80, -22, 8, -58);
  addZone(zones, "CHECKPOINT", 0, -2, -84, 20, 8, -66);
  addZone(zones, "OPS", 32, -2, -28, 56, 8, -8);
  addZone(zones, "COMMAND_GROUND", -5, -2, 14, 30, 3.7, 38);
  addZone(zones, "COMMAND_2F", 1, 3.7, 18, 23, 8, 34);
  addZone(zones, "HOLDING", 32, -2, 18, 56, 8, 42);
  addZone(zones, "MOTOR_POOL", -79, -2, -11, -53, 8, 23);
  addZone(zones, "COURTYARD", -16, -2, 4, 38, 8, 40);

  const map2d = {
    bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
    footprints: [
      { name: "Maze", minX: -56, maxX: 22, minZ: -96, maxZ: -50 },
      { name: "Ops", minX: 32, maxX: 56, minZ: -28, maxZ: -8 },
      { name: "Command", minX: -5, maxX: 30, minZ: 14, maxZ: 38 },
      { name: "Holding", minX: 32, maxX: 56, minZ: 18, maxZ: 42 },
      { name: "Motor Pool", minX: -79, maxX: -53, minZ: -11, maxZ: 23 },
    ],
    markers: [
      { name: "IC-1", x: doors.ic1.mesh.position.x, z: doors.ic1.mesh.position.z, kind: "gate" },
      { name: "IC-2", x: doors.ic2.mesh.position.x, z: doors.ic2.mesh.position.z, kind: "gate" },
      { name: "Service", x: doors.serviceGate.mesh.position.x, z: doors.serviceGate.mesh.position.z, kind: "service" },
      { name: "Holding Door", x: doors.holding.mesh.position.x, z: doors.holding.mesh.position.z, kind: "gate" },
      { name: "Terminal", x: terminalMesh.position.x, z: terminalMesh.position.z, kind: "terminal" },
      { name: "G", x: gMarker.position.x, z: gMarker.position.z, kind: "g" },
    ],
  };

  const holdingTrigger = {
    min: new THREE.Vector3(40, 0, 25),
    max: new THREE.Vector3(54, 6, 37),
  };

  return {
    colliders,
    zones,
    spawn: {
      position: new THREE.Vector3(-74, 1.8, 62),
      yaw: Math.PI,
    },
    doors,
    terminal: {
      position: terminalMesh.position.clone(),
      mesh: terminalMesh,
    },
    gMarker: {
      position: gMarker.position.clone(),
      mesh: gMarker,
    },
    map2d,
    holdingTrigger,
  };
}
