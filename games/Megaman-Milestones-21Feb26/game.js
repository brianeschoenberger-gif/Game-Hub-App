(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const healthEl = document.getElementById('health-value');
  const cannonEl = document.getElementById('cannon-mode');
  const cooldownFillEl = document.getElementById('cooldown-fill');
  const statusEl = document.getElementById('status-text');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const WORLD_WIDTH = 3600;
  const GRAVITY = 1700;
  const MAX_FALL_SPEED = 900;
  const STORAGE_KEY = 'robotCannonRapidShotUnlocked';

  const keys = new Set();
  const blocks = [
    { x: 0, y: 470, w: 620, h: 70 },
    { x: 760, y: 470, w: 520, h: 70 },
    { x: 1360, y: 470, w: 450, h: 70 },
    { x: 1930, y: 470, w: 280, h: 70 },
    { x: 2280, y: 470, w: 340, h: 70 },
    { x: 2660, y: 470, w: 760, h: 70 },
    { x: 2740, y: 360, w: 120, h: 20 },
    { x: 3020, y: 330, w: 120, h: 20 }
  ];

  const startSpawn = { x: 90, y: 380 };
  const finishGate = { x: 2580, y: 300, w: 45, h: 170 };

  const player = {
    x: startSpawn.x,
    y: startSpawn.y,
    w: 44,
    h: 58,
    vx: 0,
    vy: 0,
    speed: 300,
    jumpSpeed: 650,
    grounded: false,
    facing: 1,
    hp: 100,
    maxHp: 100,
    invulnUntil: 0,
    cannonMode: 'single_shot',
    rapidUnlocked: localStorage.getItem(STORAGE_KEY) === '1',
    lastShotAt: -9999,
    lastHitAt: -9999
  };

  if (player.rapidUnlocked) {
    player.cannonMode = 'rapid_shot';
  }

  const game = {
    state: 'start',
    now: 0,
    lastTime: 0,
    cameraX: 0,
    projectiles: [],
    enemyProjectiles: [],
    hitSparks: [],
    enemies: [],
    boss: null,
    bossActive: false,
    bossDefeated: false,
    levelComplete: false,
    gateTriggered: false,
    feedbackUntil: 0,
    feedbackText: '',
    fpsSafeDt: 1 / 30
  };

  function createEnemy(x, y, minX, maxX) {
    return {
      x,
      y,
      w: 42,
      h: 52,
      minX,
      maxX,
      vx: 90,
      hp: 3,
      alive: true,
      hitFlashUntil: 0
    };
  }

  function createBoss() {
    return {
      x: 3160,
      y: 330,
      w: 118,
      h: 130,
      hp: 60,
      maxHp: 60,
      alive: true,
      dir: -1,
      speed: 95,
      attackTimer: 0,
      moveMinX: 2860,
      moveMaxX: 3320,
      hitFlashUntil: 0
    };
  }

  function seedEnemies() {
    game.enemies = [
      createEnemy(900, 418, 790, 1210),
      createEnemy(1500, 418, 1400, 1750),
      createEnemy(2360, 418, 2310, 2570)
    ];
  }

  function resetRun() {
    player.x = startSpawn.x;
    player.y = startSpawn.y;
    player.vx = 0;
    player.vy = 0;
    player.hp = player.maxHp;
    player.grounded = false;
    player.invulnUntil = 0;
    player.lastShotAt = -9999;
    player.cannonMode = player.rapidUnlocked ? 'rapid_shot' : 'single_shot';

    game.state = 'start';
    game.cameraX = 0;
    game.projectiles.length = 0;
    game.enemyProjectiles.length = 0;
    game.hitSparks.length = 0;
    game.boss = null;
    game.bossActive = false;
    game.bossDefeated = false;
    game.levelComplete = false;
    game.gateTriggered = false;
    game.feedbackUntil = 0;
    game.feedbackText = '';
    seedEnemies();
    updateHud();
  }

  function updateHud() {
    healthEl.textContent = String(Math.max(0, Math.ceil(player.hp)));
    cannonEl.textContent = player.cannonMode === 'rapid_shot' ? 'Rapid Shot' : 'Single Shot';

    const cd = getShootCooldown();
    const elapsed = game.now - player.lastShotAt;
    const readiness = Math.max(0, Math.min(1, elapsed / cd));
    cooldownFillEl.style.transform = `scaleX(${readiness})`;

    if (game.state === 'start') {
      statusEl.textContent = 'Press Enter to Start';
    } else if (game.state === 'playing') {
      statusEl.textContent = game.bossActive
        ? `Mini-Boss HP: ${Math.max(0, Math.ceil(game.boss?.hp || 0))}`
        : 'Reach the gate and clear the mini-boss';
    } else if (game.state === 'dead') {
      statusEl.textContent = 'Destroyed. Press R to Restart';
    } else if (game.state === 'victory') {
      statusEl.textContent = player.rapidUnlocked
        ? 'Level Clear. Rapid Shot Unlocked. Press R'
        : 'Level Clear. Press R';
    }
  }

  function getShootCooldown() {
    return player.cannonMode === 'rapid_shot' ? 110 : 280;
  }

  function shootProjectile() {
    const shootDir = player.facing;
    const px = player.x + player.w * (shootDir > 0 ? 0.98 : 0.02);
    const py = player.y + 24;
    game.projectiles.push({
      x: px,
      y: py,
      vx: shootDir * 560,
      vy: 0,
      r: 6,
      from: 'player'
    });
    player.lastShotAt = game.now;
  }

  function fireBossBurst() {
    if (!game.boss || !game.boss.alive) {
      return;
    }

    const sourceX = game.boss.x + game.boss.w / 2;
    const sourceY = game.boss.y + 38;
    const targetX = player.x + player.w / 2;
    const targetY = player.y + player.h / 2;

    const baseAngle = Math.atan2(targetY - sourceY, targetX - sourceX);
    const speeds = [260, 300, 340];
    const spread = [-0.24, 0, 0.24];

    for (let i = 0; i < speeds.length; i += 1) {
      const angle = baseAngle + spread[i];
      game.enemyProjectiles.push({
        x: sourceX,
        y: sourceY,
        vx: Math.cos(angle) * speeds[i],
        vy: Math.sin(angle) * speeds[i],
        r: 7,
        from: 'boss'
      });
    }
  }

  function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleHitsRect(c, r) {
    const nearestX = Math.max(r.x, Math.min(c.x, r.x + r.w));
    const nearestY = Math.max(r.y, Math.min(c.y, r.y + r.h));
    const dx = c.x - nearestX;
    const dy = c.y - nearestY;
    return dx * dx + dy * dy <= c.r * c.r;
  }

  function spawnHitSpark(x, y, color) {
    game.hitSparks.push({ x, y, life: 0.16, maxLife: 0.16, color });
  }

  function damagePlayer(amount, sourceX) {
    if (game.now < player.invulnUntil || game.state !== 'playing') {
      return;
    }

    player.hp -= amount;
    player.invulnUntil = game.now + 0.9;
    player.lastHitAt = game.now;
    player.vx = sourceX < player.x ? 240 : -240;
    player.vy = -240;
    spawnHitSpark(player.x + player.w / 2, player.y + player.h / 2, '#ff6b87');

    if (player.hp <= 0) {
      player.hp = 0;
      game.state = 'dead';
      game.feedbackText = 'Unit Destroyed';
      game.feedbackUntil = game.now + 1.6;
    }
  }

  function processInput(dt) {
    const moveLeft = keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
    const moveRight = keys.has('ArrowRight') || keys.has('d') || keys.has('D');

    if (moveLeft && !moveRight) {
      player.vx = -player.speed;
      player.facing = -1;
    } else if (!moveLeft && moveRight) {
      player.vx = player.speed;
      player.facing = 1;
    } else {
      player.vx *= Math.max(0, 1 - dt * 10);
      if (Math.abs(player.vx) < 5) {
        player.vx = 0;
      }
    }

    const wantsShoot = keys.has('j') || keys.has('J') || keys.has('k') || keys.has('K') || keys.has('x') || keys.has('X');
    if (wantsShoot && game.now - player.lastShotAt >= getShootCooldown() / 1000) {
      shootProjectile();
    }
  }

  function updatePlayer(dt) {
    player.vy += GRAVITY * dt;
    if (player.vy > MAX_FALL_SPEED) {
      player.vy = MAX_FALL_SPEED;
    }

    player.x += player.vx * dt;
    resolveWorldHorizontal();

    player.y += player.vy * dt;
    player.grounded = false;
    resolveWorldVertical();

    player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));

    if (player.y > HEIGHT + 240) {
      player.hp = 0;
      game.state = 'dead';
      game.feedbackText = 'Fell Out of Range';
      game.feedbackUntil = game.now + 1.6;
    }

    if (!game.bossActive && !game.gateTriggered && intersects(player, finishGate)) {
      game.gateTriggered = true;
      game.bossActive = true;
      game.boss = createBoss();
      game.feedbackText = 'Mini-Boss Encounter';
      game.feedbackUntil = game.now + 1.8;
    }

    if (game.bossActive && game.boss && game.boss.alive) {
      const arenaLeft = 2625;
      const arenaRight = 3400;
      player.x = Math.max(arenaLeft, Math.min(arenaRight - player.w, player.x));
    }
  }

  function resolveWorldHorizontal() {
    for (const block of blocks) {
      if (!intersects(player, block)) {
        continue;
      }
      if (player.vx > 0) {
        player.x = block.x - player.w;
      } else if (player.vx < 0) {
        player.x = block.x + block.w;
      }
      player.vx = 0;
    }
  }

  function resolveWorldVertical() {
    for (const block of blocks) {
      if (!intersects(player, block)) {
        continue;
      }
      if (player.vy > 0) {
        player.y = block.y - player.h;
        player.vy = 0;
        player.grounded = true;
      } else if (player.vy < 0) {
        player.y = block.y + block.h;
        player.vy = 0;
      }
    }
  }

  function updateEnemies(dt) {
    for (const enemy of game.enemies) {
      if (!enemy.alive) {
        continue;
      }
      enemy.x += enemy.vx * dt;
      if (enemy.x < enemy.minX) {
        enemy.x = enemy.minX;
        enemy.vx = Math.abs(enemy.vx);
      }
      if (enemy.x + enemy.w > enemy.maxX) {
        enemy.x = enemy.maxX - enemy.w;
        enemy.vx = -Math.abs(enemy.vx);
      }

      if (intersects(player, enemy)) {
        damagePlayer(14, enemy.x + enemy.w / 2);
      }
    }
  }

  function updateBoss(dt) {
    if (!game.bossActive || !game.boss || !game.boss.alive) {
      return;
    }

    const boss = game.boss;
    boss.x += boss.dir * boss.speed * dt;
    if (boss.x < boss.moveMinX) {
      boss.x = boss.moveMinX;
      boss.dir = 1;
    }
    if (boss.x + boss.w > boss.moveMaxX) {
      boss.x = boss.moveMaxX - boss.w;
      boss.dir = -1;
    }

    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) {
      fireBossBurst();
      boss.attackTimer = 1.2;
    }

    if (intersects(player, boss)) {
      damagePlayer(22, boss.x + boss.w / 2);
    }
  }

  function updateProjectiles(dt) {
    for (const projectile of game.projectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
    }

    for (const projectile of game.enemyProjectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
    }

    for (const projectile of game.projectiles) {
      if (projectile._dead) {
        continue;
      }
      for (const enemy of game.enemies) {
        if (!enemy.alive || projectile._dead) {
          continue;
        }
        if (circleHitsRect(projectile, enemy)) {
          enemy.hp -= 1;
          enemy.hitFlashUntil = game.now + 0.08;
          projectile._dead = true;
          spawnHitSpark(projectile.x, projectile.y, '#75f3ff');
          if (enemy.hp <= 0) {
            enemy.alive = false;
            spawnHitSpark(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ffcc66');
          }
        }
      }

      if (game.boss && game.boss.alive && !projectile._dead && circleHitsRect(projectile, game.boss)) {
        game.boss.hp -= 1;
        game.boss.hitFlashUntil = game.now + 0.1;
        projectile._dead = true;
        spawnHitSpark(projectile.x, projectile.y, '#9df0ff');

        if (game.boss.hp <= 0) {
          game.boss.alive = false;
          game.bossDefeated = true;
          game.levelComplete = true;
          game.state = 'victory';
          player.rapidUnlocked = true;
          player.cannonMode = 'rapid_shot';
          localStorage.setItem(STORAGE_KEY, '1');
          game.feedbackText = 'Mini-Boss Defeated. Rapid Shot Unlocked';
          game.feedbackUntil = game.now + 2.4;
        }
      }
    }

    for (const projectile of game.enemyProjectiles) {
      if (projectile._dead) {
        continue;
      }
      if (circleHitsRect(projectile, player)) {
        projectile._dead = true;
        damagePlayer(10, projectile.x);
      }
    }

    game.projectiles = game.projectiles.filter(
      (p) => !p._dead && p.x > -120 && p.x < WORLD_WIDTH + 120 && p.y > -120 && p.y < HEIGHT + 120
    );
    game.enemyProjectiles = game.enemyProjectiles.filter(
      (p) => !p._dead && p.x > -120 && p.x < WORLD_WIDTH + 120 && p.y > -120 && p.y < HEIGHT + 120
    );
  }

  function updateSparks(dt) {
    for (const spark of game.hitSparks) {
      spark.life -= dt;
    }
    game.hitSparks = game.hitSparks.filter((spark) => spark.life > 0);
  }

  function updateCamera(dt) {
    const targetX = player.x - WIDTH * 0.36;
    const clamped = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, targetX));
    game.cameraX += (clamped - game.cameraX) * Math.min(1, dt * 8);
  }

  function update(dt) {
    if (game.state === 'start') {
      if (keys.has('Enter')) {
        game.state = 'playing';
      }
      updateHud();
      return;
    }

    if (game.state === 'dead' || game.state === 'victory') {
      updateHud();
      return;
    }

    processInput(dt);
    updatePlayer(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateProjectiles(dt);
    updateSparks(dt);
    updateCamera(dt);

    updateHud();
  }

  function drawBackground() {
    const x = game.cameraX;

    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, '#1a3353');
    sky.addColorStop(1, '#0a111f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#0e2138';
    for (let i = 0; i < 18; i += 1) {
      const px = (i * 320 - (x * 0.3) % 320) - 40;
      ctx.fillRect(px, 280, 60, 260);
    }

    ctx.fillStyle = '#173456';
    for (let i = 0; i < 25; i += 1) {
      const px = (i * 220 - (x * 0.55) % 220) - 80;
      ctx.fillRect(px, 330, 42, 210);
    }
  }

  function drawWorld() {
    const camX = game.cameraX;
    ctx.save();
    ctx.translate(-camX, 0);

    for (const block of blocks) {
      ctx.fillStyle = '#22384f';
      ctx.fillRect(block.x, block.y, block.w, block.h);
      ctx.fillStyle = '#4a799d';
      ctx.fillRect(block.x, block.y, block.w, 8);
    }

    if (!game.gateTriggered) {
      ctx.fillStyle = '#73e1ff';
      ctx.fillRect(finishGate.x, finishGate.y, finishGate.w, finishGate.h);
      ctx.fillStyle = '#c9f5ff';
      ctx.font = '15px Segoe UI';
      ctx.fillText('BOSS GATE', finishGate.x - 18, finishGate.y - 12);
    }

    for (const enemy of game.enemies) {
      if (!enemy.alive) {
        continue;
      }
      const flash = enemy.hitFlashUntil > game.now;
      drawCrawler(enemy, flash);
    }

    if (game.bossActive && game.boss && game.boss.alive) {
      drawBoss(game.boss, game.boss.hitFlashUntil > game.now);

      const barW = 260;
      const ratio = Math.max(0, game.boss.hp) / game.boss.maxHp;
      ctx.fillStyle = '#180a14';
      ctx.fillRect(game.cameraX + WIDTH - barW - 26, 20, barW, 18);
      ctx.fillStyle = '#ff4d80';
      ctx.fillRect(game.cameraX + WIDTH - barW - 26, 20, barW * ratio, 18);
      ctx.strokeStyle = '#ff94b5';
      ctx.strokeRect(game.cameraX + WIDTH - barW - 26, 20, barW, 18);
    }

    drawPlayer();
    drawProjectiles();
    drawSparks();

    ctx.restore();
  }

  function drawPlayer() {
    const hitFlash = game.now < player.invulnUntil && Math.floor(game.now * 20) % 2 === 0;

    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.fillStyle = hitFlash ? '#ff8ea8' : '#8ac9ff';
    ctx.fillRect(9, 8, 24, 22);
    ctx.fillRect(5, 28, 32, 24);

    ctx.fillStyle = '#d5ecff';
    ctx.fillRect(13, 12, 16, 8);

    ctx.fillStyle = '#4ea8ff';
    ctx.fillRect(player.facing > 0 ? 27 : -6, 30, 24, 14);

    ctx.fillStyle = '#9fd6ff';
    ctx.fillRect(8, 52, 10, 6);
    ctx.fillRect(26, 52, 10, 6);

    ctx.restore();
  }

  function drawCrawler(enemy, flash) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.fillStyle = flash ? '#ffd3a0' : '#f9b562';
    ctx.fillRect(2, 6, enemy.w - 4, 18);
    ctx.fillStyle = '#663c1f';
    ctx.fillRect(10, 24, enemy.w - 20, enemy.h - 24);
    ctx.restore();
  }

  function drawBoss(boss, flash) {
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.fillStyle = flash ? '#ffe8f0' : '#ff7a9f';
    ctx.fillRect(10, 16, boss.w - 20, boss.h - 18);
    ctx.fillStyle = '#2f1330';
    ctx.fillRect(24, 28, boss.w - 48, 30);
    ctx.fillStyle = '#ffc4d3';
    ctx.fillRect(0, 58, 36, 18);
    ctx.fillRect(boss.w - 36, 58, 36, 18);
    ctx.fillStyle = '#fff0a8';
    ctx.fillRect(38, 82, boss.w - 76, 16);
    ctx.restore();
  }

  function drawProjectiles() {
    for (const p of game.projectiles) {
      ctx.fillStyle = '#72e8ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of game.enemyProjectiles) {
      ctx.fillStyle = '#ff7899';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSparks() {
    for (const spark of game.hitSparks) {
      const alpha = spark.life / spark.maxLife;
      ctx.fillStyle = spark.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, 14 * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawOverlay() {
    if (game.feedbackUntil > game.now) {
      const alpha = Math.min(1, (game.feedbackUntil - game.now) / 0.4);
      ctx.fillStyle = `rgba(5, 10, 17, ${Math.min(0.75, alpha)})`;
      ctx.fillRect(0, 0, WIDTH, 70);
      ctx.fillStyle = '#d8efff';
      ctx.font = 'bold 24px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(game.feedbackText, WIDTH / 2, 45);
      ctx.textAlign = 'left';
    }

    if (game.state === 'start') {
      centeredMessage('Robot Cannon Platformer', 'Press Enter to Deploy');
    }

    if (game.state === 'dead') {
      centeredMessage('System Failure', 'Press R to Retry');
    }

    if (game.state === 'victory') {
      centeredMessage('Level Complete', 'Rapid Shot unlocked. Press R to replay');
    }
  }

  function centeredMessage(title, subtitle) {
    ctx.fillStyle = 'rgba(5, 10, 17, 0.66)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#f0f8ff';
    ctx.font = 'bold 46px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 20);
    ctx.font = '24px Segoe UI';
    ctx.fillStyle = '#9dd8ff';
    ctx.fillText(subtitle, WIDTH / 2, HEIGHT / 2 + 28);
    ctx.textAlign = 'left';
  }

  function render() {
    drawBackground();
    drawWorld();
    drawOverlay();
  }

  function frame(timeMs) {
    if (!game.lastTime) {
      game.lastTime = timeMs;
    }
    const rawDt = (timeMs - game.lastTime) / 1000;
    const dt = Math.min(game.fpsSafeDt, rawDt || game.fpsSafeDt);
    game.lastTime = timeMs;
    game.now += dt;

    if (keys.has('r') || keys.has('R')) {
      resetRun();
    }

    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key;
    keys.add(key);

    if ((key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') && player.grounded && game.state === 'playing') {
      player.vy = -player.jumpSpeed;
      player.grounded = false;
    }

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(key)) {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.key);
  });

  resetRun();
  requestAnimationFrame(frame);
})();
