const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const Y_SHIFT = -700;
const sy = (y) => y + Y_SHIFT;

const WORLD = {
  width: 3000,
  height: 1200,
  gravity: 0.52,
};

const keys = {
  left: false,
  right: false,
  jump: false,
  attack: false,
  dash: false,
};

const player = {
  x: 120,
  y: sy(880),
  w: 34,
  h: 52,
  vx: 0,
  vy: 0,
  speed: 2.6,
  jumpPower: 10.8,
  onGround: false,
  facing: 1,
  hp: 5,
  invuln: 0,
  attackTimer: 0,
  dashTimer: 0,
  dashCooldown: 0,
  maxHp: 5,
};

const checkpoint = { x: 130, y: sy(860) };

const platforms = [
  { x: 0, y: sy(980), w: 900, h: 220 },
  { x: 1000, y: sy(980), w: 500, h: 220 },
  { x: 1600, y: sy(920), w: 540, h: 280 },
  { x: 2240, y: sy(980), w: 760, h: 220 },
  { x: 460, y: sy(860), w: 130, h: 24 },
  { x: 680, y: sy(790), w: 130, h: 24 },
  { x: 870, y: sy(720), w: 90, h: 24 },
  { x: 1120, y: sy(860), w: 120, h: 24 },
  { x: 1320, y: sy(770), w: 120, h: 24 },
  { x: 1750, y: sy(800), w: 120, h: 24 },
  { x: 1970, y: sy(740), w: 120, h: 24 },
  { x: 2360, y: sy(860), w: 140, h: 24 },
  { x: 2580, y: sy(780), w: 120, h: 24 },
];

const spikes = [
  { x: 910, y: sy(970), w: 90, h: 10 },
  { x: 1510, y: sy(970), w: 90, h: 10 },
  { x: 2140, y: sy(910), w: 70, h: 10 },
];

const enemies = [
  { x: 560, y: sy(828), w: 30, h: 32, minX: 500, maxX: 760, vx: 1, hp: 2, alive: true },
  { x: 1160, y: sy(828), w: 30, h: 32, minX: 1060, maxX: 1390, vx: -1.2, hp: 2, alive: true },
  { x: 1790, y: sy(768), w: 30, h: 32, minX: 1740, maxX: 2050, vx: 1.1, hp: 2, alive: true },
  { x: 2410, y: sy(828), w: 30, h: 32, minX: 2320, maxX: 2780, vx: -1, hp: 3, alive: true },
];

const soulOrb = { x: 2680, y: sy(740), r: 13, taken: false };
const gate = { x: 2920, y: sy(900), w: 35, h: 80 };

let cameraX = 0;
let gameOver = false;
let win = false;

function resetToCheckpoint() {
  player.x = checkpoint.x;
  player.y = checkpoint.y;
  player.vx = 0;
  player.vy = 0;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function hurtPlayer(amount) {
  if (player.invuln > 0 || gameOver || win) return;
  player.hp -= amount;
  player.invuln = 60;
  if (player.hp <= 0) {
    gameOver = true;
  }
}

function updatePlayer() {
  if (gameOver || win) return;

  const moving = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (player.dashTimer <= 0) {
    player.vx = moving * player.speed;
  }

  if (moving !== 0) {
    player.facing = moving > 0 ? 1 : -1;
  }

  if (keys.jump && player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
  }

  if (keys.attack && player.attackTimer <= 0) {
    player.attackTimer = 15;
  }

  if (keys.dash && player.dashTimer <= 0 && player.dashCooldown <= 0) {
    player.dashTimer = 10;
    player.dashCooldown = 45;
    player.vx = player.facing * 8;
    player.vy *= 0.5;
  }

  if (player.attackTimer > 0) player.attackTimer--;
  if (player.dashTimer > 0) player.dashTimer--;
  if (player.dashCooldown > 0) player.dashCooldown--;
  if (player.invuln > 0) player.invuln--;

  player.vy += WORLD.gravity;
  if (player.vy > 12) player.vy = 12;

  player.x += player.vx;
  player.y += player.vy;
  player.onGround = false;

  for (const p of platforms) {
    if (!rectsOverlap(player, p)) continue;

    const prevY = player.y - player.vy;
    const prevBottom = prevY + player.h;
    const prevTop = prevY;

    if (prevBottom <= p.y) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (prevTop >= p.y + p.h) {
      player.y = p.y + p.h;
      player.vy = 0.2;
    } else if (player.x + player.w * 0.5 < p.x + p.w * 0.5) {
      player.x = p.x - player.w;
    } else {
      player.x = p.x + p.w;
    }
  }

  const attackBox = {
    x: player.facing > 0 ? player.x + player.w : player.x - 30,
    y: player.y + 10,
    w: 30,
    h: 24,
  };

  for (const e of enemies) {
    if (!e.alive) continue;

    if (player.attackTimer > 0 && rectsOverlap(attackBox, e)) {
      e.hp -= 1;
      e.x += player.facing * 15;
      if (e.hp <= 0) e.alive = false;
    }

    if (rectsOverlap(player, e)) {
      hurtPlayer(1);
      player.vx = -player.facing * 3;
      player.vy = -4;
    }
  }

  for (const s of spikes) {
    if (rectsOverlap(player, s)) {
      hurtPlayer(1);
      resetToCheckpoint();
      break;
    }
  }

  if (player.y > WORLD.height + 120) {
    hurtPlayer(1);
    resetToCheckpoint();
  }

  if (!soulOrb.taken) {
    const orbBox = { x: soulOrb.x - soulOrb.r, y: soulOrb.y - soulOrb.r, w: soulOrb.r * 2, h: soulOrb.r * 2 };
    if (rectsOverlap(player, orbBox)) {
      soulOrb.taken = true;
      checkpoint.x = 2500;
      checkpoint.y = sy(730);
      player.hp = Math.min(player.maxHp, player.hp + 2);
    }
  }

  if (soulOrb.taken && rectsOverlap(player, gate)) {
    win = true;
  }

  if (player.x < 0) player.x = 0;
  if (player.x + player.w > WORLD.width) player.x = WORLD.width - player.w;
}

function updateEnemies() {
  if (gameOver || win) return;

  for (const e of enemies) {
    if (!e.alive) continue;
    e.x += e.vx;
    if (e.x < e.minX || e.x + e.w > e.maxX) {
      e.vx *= -1;
    }
  }
}

function updateCamera() {
  cameraX = player.x - canvas.width * 0.42;
  cameraX = Math.max(0, Math.min(cameraX, WORLD.width - canvas.width));
}

function drawMist() {
  for (let i = 0; i < 8; i++) {
    const x = ((i * 420 - cameraX * (0.2 + i * 0.02)) % (WORLD.width + 400)) - 200;
    const y = 130 + i * 45;
    const w = 260;
    const h = 40;
    ctx.fillStyle = "rgba(230, 240, 255, 0.06)";
    ctx.beginPath();
    ctx.ellipse(x - cameraX, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWorld() {
  ctx.save();
  ctx.translate(-cameraX, 0);

  ctx.fillStyle = "#1a243d";
  for (let i = 0; i < WORLD.width; i += 180) {
    ctx.fillRect(i, 1020, 100, 180);
  }

  for (const p of platforms) {
    ctx.fillStyle = "#6f7f9c";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#95a7c7";
    ctx.fillRect(p.x, p.y, p.w, 6);
  }

  for (const s of spikes) {
    ctx.fillStyle = "#c9d9f5";
    const count = Math.floor(s.w / 10);
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.moveTo(s.x + i * 10, s.y + s.h);
      ctx.lineTo(s.x + i * 10 + 5, s.y);
      ctx.lineTo(s.x + i * 10 + 10, s.y + s.h);
      ctx.fill();
    }
  }

  if (!soulOrb.taken) {
    ctx.fillStyle = "#c8eeff";
    ctx.beginPath();
    ctx.arc(soulOrb.x, soulOrb.y, soulOrb.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = soulOrb.taken ? "#8ae8b0" : "#406086";
  ctx.fillRect(gate.x, gate.y, gate.w, gate.h);

  for (const e of enemies) {
    if (!e.alive) continue;
    ctx.fillStyle = "#d9e7ff";
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = "#29354f";
    ctx.fillRect(e.x + 4, e.y + 7, 7, 7);
    ctx.fillRect(e.x + 19, e.y + 7, 7, 7);
  }

  if (player.invuln % 6 < 3) {
    ctx.fillStyle = "#f7fbff";
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  if (player.attackTimer > 0) {
    ctx.fillStyle = "rgba(220, 240, 255, 0.5)";
    const slashX = player.facing > 0 ? player.x + player.w : player.x - 32;
    ctx.fillRect(slashX, player.y + 8, 32, 30);
  }

  ctx.restore();
}

function drawHud() {
  ctx.fillStyle = "rgba(8, 13, 25, 0.55)";
  ctx.fillRect(12, 12, 230, 72);

  ctx.fillStyle = "#eff6ff";
  ctx.font = "18px Trebuchet MS";
  ctx.fillText("Masks", 24, 38);

  for (let i = 0; i < player.maxHp; i++) {
    ctx.fillStyle = i < player.hp ? "#f5fbff" : "#4b5a79";
    ctx.fillRect(24 + i * 36, 48, 28, 20);
  }

  ctx.font = "16px Trebuchet MS";
  ctx.fillStyle = soulOrb.taken ? "#9bffc4" : "#bfd2f5";
  ctx.fillText(soulOrb.taken ? "Relic found: Gate unlocked" : "Find the relic", 24, 102);

  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "48px Trebuchet MS";
    ctx.fillText("You Fell", canvas.width / 2 - 95, canvas.height / 2 - 10);
    ctx.font = "22px Trebuchet MS";
    ctx.fillText("Press R to retry", canvas.width / 2 - 80, canvas.height / 2 + 30);
  }

  if (win) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#d8ffe9";
    ctx.font = "42px Trebuchet MS";
    ctx.fillText("Level Complete", canvas.width / 2 - 145, canvas.height / 2 - 4);
    ctx.font = "22px Trebuchet MS";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("The Hollow Path opens ahead", canvas.width / 2 - 140, canvas.height / 2 + 30);
  }
}

function tick() {
  updatePlayer();
  updateEnemies();
  updateCamera();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMist();
  drawWorld();
  drawHud();

  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  if (e.key === "a" || e.key === "ArrowLeft") keys.left = true;
  if (e.key === "d" || e.key === "ArrowRight") keys.right = true;
  if (e.key === " ") keys.jump = true;
  if (e.key.toLowerCase() === "j") keys.attack = true;
  if (e.key.toLowerCase() === "k") keys.dash = true;

  if (e.key.toLowerCase() === "r") {
    player.hp = player.maxHp;
    player.invuln = 0;
    gameOver = false;
    win = false;
    soulOrb.taken = false;
    checkpoint.x = 130;
    checkpoint.y = sy(860);
    enemies.forEach((enemy, i) => {
      const fresh = [
        { x: 560, y: sy(828), hp: 2, vx: 1 },
        { x: 1160, y: sy(828), hp: 2, vx: -1.2 },
        { x: 1790, y: sy(768), hp: 2, vx: 1.1 },
        { x: 2410, y: sy(828), hp: 3, vx: -1 },
      ][i];
      enemy.x = fresh.x;
      enemy.y = fresh.y;
      enemy.hp = fresh.hp;
      enemy.vx = fresh.vx;
      enemy.alive = true;
    });
    resetToCheckpoint();
  }

  if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
});

window.addEventListener("keyup", (e) => {
  if (e.key === "a" || e.key === "ArrowLeft") keys.left = false;
  if (e.key === "d" || e.key === "ArrowRight") keys.right = false;
  if (e.key === " ") keys.jump = false;
  if (e.key.toLowerCase() === "j") keys.attack = false;
  if (e.key.toLowerCase() === "k") keys.dash = false;
});

resetToCheckpoint();
requestAnimationFrame(tick);
