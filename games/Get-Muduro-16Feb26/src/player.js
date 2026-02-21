import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function horizontalCircleAABBOverlap(cx, cz, radius, box) {
  const nearestX = clamp(cx, box.min.x, box.max.x);
  const nearestZ = clamp(cz, box.min.z, box.max.z);
  const dx = cx - nearestX;
  const dz = cz - nearestZ;
  const distSq = dx * dx + dz * dz;

  if (distSq >= radius * radius) return null;

  const dist = Math.sqrt(distSq);
  if (dist > 1e-6) {
    const penetration = radius - dist;
    return {
      normalX: dx / dist,
      normalZ: dz / dist,
      penetration,
    };
  }

  const left = Math.abs(cx - box.min.x);
  const right = Math.abs(box.max.x - cx);
  const back = Math.abs(cz - box.min.z);
  const front = Math.abs(box.max.z - cz);
  const minAxis = Math.min(left, right, back, front);

  if (minAxis === left) return { normalX: -1, normalZ: 0, penetration: radius + left };
  if (minAxis === right) return { normalX: 1, normalZ: 0, penetration: radius + right };
  if (minAxis === back) return { normalX: 0, normalZ: -1, penetration: radius + back };
  return { normalX: 0, normalZ: 1, penetration: radius + front };
}

export class PlayerController {
  constructor(camera, domElement, colliders) {
    this.camera = camera;
    this.domElement = domElement;
    this.colliders = colliders;

    this.radius = 0.35;
    this.height = 1.7;
    this.eyeOffset = 1.55;
    this.stepHeight = 0.36;

    this.gravity = -18;
    this.jumpVelocity = 11.5;
    this.moveSpeed = 11.5;
    this.sprintMultiplier = 1.85;
    this.escortSpeedMultiplier = 0.75;

    this.position = new THREE.Vector3(0, this.height, 0);
    this.velocity = new THREE.Vector3();

    this.yaw = 0;
    this.pitch = 0;

    this.pointerLocked = false;
    this.onGround = false;
    this.paused = false;
    this.escorted = false;

    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false,
    };

    this._bindEvents();
  }

  _bindEvents() {
    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === this.domElement;
    });

    this.domElement.addEventListener("click", () => {
      if (!this.pointerLocked) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener("mousemove", (event) => {
      if (!this.pointerLocked || this.paused) return;
      const sensitivity = 0.0023;
      this.yaw -= event.movementX * sensitivity;
      this.pitch -= event.movementY * sensitivity;
      this.pitch = clamp(this.pitch, -1.45, 1.45);
    });

    document.addEventListener("keydown", (event) => {
      switch (event.code) {
        case "KeyW": this.input.forward = true; break;
        case "KeyS": this.input.backward = true; break;
        case "KeyA": this.input.left = true; break;
        case "KeyD": this.input.right = true; break;
        case "ShiftLeft":
        case "ShiftRight": this.input.sprint = true; break;
        case "Space":
          this.input.jump = true;
          event.preventDefault();
          break;
        default:
          break;
      }
    });

    document.addEventListener("keyup", (event) => {
      switch (event.code) {
        case "KeyW": this.input.forward = false; break;
        case "KeyS": this.input.backward = false; break;
        case "KeyA": this.input.left = false; break;
        case "KeyD": this.input.right = false; break;
        case "ShiftLeft":
        case "ShiftRight": this.input.sprint = false; break;
        case "Space": this.input.jump = false; break;
        default:
          break;
      }
    });
  }

  setSpawn(position, yaw = 0) {
    this.position.copy(position);
    this.yaw = yaw;
    this.pitch = 0;
    this.velocity.set(0, 0, 0);
    this._syncCamera();
  }

  setPaused(paused) {
    this.paused = paused;
  }

  setEscorted(escorted) {
    this.escorted = escorted;
  }

  _getSupportingHeightAt(x, z, feetY) {
    let supportY = 0;

    for (const box of this.colliders) {
      if (box.enabled === false) continue;

      const overlapsXZ =
        x + this.radius > box.min.x &&
        x - this.radius < box.max.x &&
        z + this.radius > box.min.z &&
        z - this.radius < box.max.z;

      if (!overlapsXZ) continue;

      const topY = box.max.y;
      if (topY <= feetY + this.stepHeight && topY > supportY) {
        supportY = topY;
      }
    }

    return supportY;
  }

  _resolveHorizontal(targetX, targetZ) {
    let x = targetX;
    let z = targetZ;

    const feetY = this.position.y - this.height;
    const headY = this.position.y;

    for (let iter = 0; iter < 3; iter += 1) {
      let hadHit = false;

      for (const box of this.colliders) {
        if (box.enabled === false) continue;

        const verticalOverlap = headY > box.min.y && feetY < box.max.y;
        if (!verticalOverlap) continue;

        const hit = horizontalCircleAABBOverlap(x, z, this.radius, box);
        if (!hit) continue;

        x += hit.normalX * (hit.penetration + 0.0005);
        z += hit.normalZ * (hit.penetration + 0.0005);
        hadHit = true;
      }

      if (!hadHit) break;
    }

    return { x, z };
  }

  _syncCamera() {
    this.camera.position.set(this.position.x, this.position.y - (this.height - this.eyeOffset), this.position.z);
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, "YXZ"));
  }

  update(dt) {
    const clampedDt = Math.min(dt, 0.033);

    if (this.paused) {
      this._syncCamera();
      return;
    }

    const inputX = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    const inputZ = (this.input.backward ? 1 : 0) - (this.input.forward ? 1 : 0);
    const inputLen = Math.hypot(inputX, inputZ);

    let moveX = 0;
    let moveZ = 0;

    if (inputLen > 0) {
      const nx = inputX / inputLen;
      const nz = inputZ / inputLen;

      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);

      const worldX = nx * cos + nz * sin;
      const worldZ = nz * cos - nx * sin;

      const escortedFactor = this.escorted ? this.escortSpeedMultiplier : 1;
      const speed = this.moveSpeed * (this.input.sprint ? this.sprintMultiplier : 1) * escortedFactor;
      moveX = worldX * speed * clampedDt;
      moveZ = worldZ * speed * clampedDt;
    }

    const feetY = this.position.y - this.height;
    const supportY = this._getSupportingHeightAt(this.position.x, this.position.z, feetY);
    this.onGround = feetY <= supportY + 0.04;

    if (this.onGround) {
      this.position.y = supportY + this.height;
      if (this.velocity.y < 0) this.velocity.y = 0;
      if (this.input.jump) {
        this.velocity.y = this.jumpVelocity;
        this.onGround = false;
      }
    }

    if (!this.onGround) {
      this.velocity.y += this.gravity * clampedDt;
      this.position.y += this.velocity.y * clampedDt;

      const nextFeet = this.position.y - this.height;
      const nextSupport = this._getSupportingHeightAt(this.position.x, this.position.z, nextFeet);
      if (nextFeet <= nextSupport) {
        this.position.y = nextSupport + this.height;
        this.velocity.y = 0;
        this.onGround = true;
      }
    }

    const resolved = this._resolveHorizontal(this.position.x + moveX, this.position.z + moveZ);
    this.position.x = resolved.x;
    this.position.z = resolved.z;

    const movedFeet = this.position.y - this.height;
    const movedSupport = this._getSupportingHeightAt(this.position.x, this.position.z, movedFeet);
    const stepDelta = movedSupport - movedFeet;
    if (stepDelta > 0 && stepDelta <= this.stepHeight + 0.02 && this.velocity.y <= 0) {
      this.position.y = movedSupport + this.height;
      this.velocity.y = 0;
      this.onGround = true;
    }

    this._syncCamera();
  }

  getPosition() {
    return this.position.clone();
  }

  getYawPitch() {
    return { yaw: this.yaw, pitch: this.pitch };
  }

  isPointerLocked() {
    return this.pointerLocked;
  }
}
