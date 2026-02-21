(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const healthEl = document.getElementById('health-value');
  const cannonEl = document.getElementById('cannon-mode');
  const cooldownFillEl = document.getElementById('cooldown-fill');
  const statusEl = document.getElementById('status-text');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const HUB_WIDTH = 960;
  const HUB_HEIGHT = 540;

  const GRAVITY = 1700;
  const MAX_FALL_SPEED = 900;

  const LEGACY_RAPID_KEY = 'robotCannonRapidShotUnlocked';
  const PROFILE_KEY = 'robotCannonProfileM2';

  const LEVEL_1_ID = 'reactor_sweep';
  const LEVEL_2_ID = 'sky_foundry';

  const keys = new Set();
  const justPressed = new Set();

  const LEVEL_CONFIGS = {
    [LEVEL_1_ID]: {
      name: 'Level 1 - Reactor Sweep',
      worldWidth: 3600,
      spawn: { x: 90, y: 380 },
      finishGate: { x: 2580, y: 300, w: 45, h: 170 },
      blocks: [
        { x: 0, y: 470, w: 620, h: 70 },
        { x: 760, y: 470, w: 520, h: 70 },
        { x: 1360, y: 470, w: 450, h: 70 },
        { x: 1930, y: 470, w: 280, h: 70 },
        { x: 2280, y: 470, w: 340, h: 70 },
        { x: 2660, y: 470, w: 760, h: 70 },
        { x: 2740, y: 360, w: 120, h: 20 },
        { x: 3020, y: 330, w: 120, h: 20 }
      ],
      enemySpawns: [
        { x: 900, y: 418, minX: 790, maxX: 1210, hp: 3, speed: 90 },
        { x: 1500, y: 418, minX: 1400, maxX: 1750, hp: 3, speed: 90 },
        { x: 2360, y: 418, minX: 2310, maxX: 2570, hp: 3, speed: 95 }
      ],
      boss: {
        x: 3160,
        y: 330,
        w: 118,
        h: 130,
        hp: 60,
        speed: 95,
        moveMinX: 2860,
        moveMaxX: 3320,
        attackInterval: 1.2,
        projectileSpeeds: [260, 300, 340],
        spread: [-0.24, 0, 0.24],
        contactDamage: 22,
        projectileDamage: 10
      }
    },
    [LEVEL_2_ID]: {
      name: 'Level 2 - Sky Foundry',
      worldWidth: 4300,
      spawn: { x: 110, y: 340 },
      finishGate: { x: 3320, y: 250, w: 48, h: 220 },
      blocks: [
        { x: 0, y: 470, w: 560, h: 70 },
        { x: 620, y: 430, w: 300, h: 28 },
        { x: 980, y: 470, w: 420, h: 70 },
        { x: 1460, y: 390, w: 260, h: 24 },
        { x: 1760, y: 470, w: 420, h: 70 },
        { x: 2240, y: 360, w: 220, h: 20 },
        { x: 2520, y: 420, w: 220, h: 20 },
        { x: 2820, y: 470, w: 560, h: 70 },
        { x: 3460, y: 470, w: 760, h: 70 },
        { x: 3600, y: 360, w: 130, h: 20 },
        { x: 3900, y: 330, w: 130, h: 20 }
      ],
      enemySpawns: [
        { x: 760, y: 378, minX: 640, maxX: 880, hp: 4, speed: 115 },
        { x: 1210, y: 418, minX: 1020, maxX: 1370, hp: 4, speed: 110 },
        { x: 1880, y: 418, minX: 1800, maxX: 2150, hp: 5, speed: 120 },
        { x: 2900, y: 418, minX: 2860, maxX: 3370, hp: 5, speed: 122 }
      ],
      boss: {
        x: 3820,
        y: 300,
        w: 128,
        h: 142,
        hp: 92,
        speed: 125,
        moveMinX: 3500,
        moveMaxX: 4150,
        attackInterval: 0.9,
        projectileSpeeds: [290, 330, 370, 410],
        spread: [-0.33, -0.12, 0.12, 0.33],
        contactDamage: 26,
        projectileDamage: 14
      }
    }
  };

  const hub = {
    walls: [
      { x: 0, y: 0, w: HUB_WIDTH, h: 44 },
      { x: 0, y: HUB_HEIGHT - 34, w: HUB_WIDTH, h: 34 },
      { x: 0, y: 0, w: 30, h: HUB_HEIGHT },
      { x: HUB_WIDTH - 30, y: 0, w: 30, h: HUB_HEIGHT }
    ],
    commander: { x: 215, y: 248, w: 44, h: 66, name: 'Commander Rho' },
    engineer: { x: 572, y: 238, w: 44, h: 66, name: 'Engineer Vale' },
    missionLift: { x: 834, y: 172, w: 90, h: 168, name: 'Mission Lift' },
    dataTerminal: { x: 412, y: 136, w: 110, h: 72, name: 'Log Terminal' },
    spawn: { x: 100, y: 420 }
  };

  const player = {
    x: hub.spawn.x,
    y: hub.spawn.y,
    w: 44,
    h: 58,
    vx: 0,
    vy: 0,
    speed: 300,
    hubSpeed: 230,
    jumpSpeed: 650,
    grounded: false,
    facing: 1,
    hp: 100,
    maxHp: 100,
    invulnUntil: 0,
    cannonMode: 'single_shot',
    cooldownSeconds: 0.28,
    lastShotAt: -9999,
    lastHitAt: -9999,
    chargeUnlocked: false,
    isCharging: false,
    chargeStartedAt: 0,
    currentCharge: 0
  };

  function createDefaultProfile() {
    return {
      rapidUnlocked: localStorage.getItem(LEGACY_RAPID_KEY) === '1',
      chargeUnlocked: false,
      credits: 0,
      xp: 0,
      level: 1,
      clears: 0,
      missions: {
        [LEVEL_1_ID]: { accepted: false, completed: false, turnedIn: false, deaths: 0 },
        [LEVEL_2_ID]: { accepted: false, completed: false, turnedIn: false, deaths: 0 }
      }
    };
  }

  function loadProfile() {
    const fallback = createDefaultProfile();
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) {
        return fallback;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return fallback;
      }

      const merged = {
        ...fallback,
        ...parsed,
        missions: {
          ...fallback.missions,
          ...(parsed.missions || {})
        }
      };

      merged.rapidUnlocked = Boolean(merged.rapidUnlocked || localStorage.getItem(LEGACY_RAPID_KEY) === '1');
      merged.chargeUnlocked = Boolean(merged.chargeUnlocked);
      return merged;
    } catch {
      return fallback;
    }
  }

  const profile = loadProfile();

  function saveProfile() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    if (profile.rapidUnlocked) {
      localStorage.setItem(LEGACY_RAPID_KEY, '1');
    }
  }

  const game = {
    phase: 'intro',
    scene: 'hub',
    now: 0,
    lastTime: 0,
    cameraX: 0,
    feedbackUntil: 0,
    feedbackText: '',
    dialogueUntil: 0,
    dialogueSpeaker: '',
    dialogueText: '',
    mission: null,
    activeMissionId: LEVEL_1_ID,
    fpsSafeDt: 1 / 30
  };

  function missionState(missionId) {
    return profile.missions[missionId];
  }

  function missionName(missionId) {
    return LEVEL_CONFIGS[missionId]?.name || missionId;
  }

  function nextMissionId() {
    if (!missionState(LEVEL_1_ID).completed) {
      return LEVEL_1_ID;
    }
    if (!missionState(LEVEL_2_ID).completed) {
      return LEVEL_2_ID;
    }
    return null;
  }

  function createEnemy(spawn) {
    return {
      x: spawn.x,
      y: spawn.y,
      w: 42,
      h: 52,
      minX: spawn.minX,
      maxX: spawn.maxX,
      vx: spawn.speed,
      hp: spawn.hp,
      alive: true,
      contactDamage: spawn.contactDamage || 14,
      hitFlashUntil: 0
    };
  }

  function createBoss(config) {
    return {
      x: config.x,
      y: config.y,
      w: config.w,
      h: config.h,
      hp: config.hp,
      maxHp: config.hp,
      alive: true,
      dir: -1,
      speed: config.speed,
      attackTimer: 0,
      moveMinX: config.moveMinX,
      moveMaxX: config.moveMaxX,
      attackInterval: config.attackInterval,
      projectileSpeeds: config.projectileSpeeds,
      spread: config.spread,
      contactDamage: config.contactDamage,
      projectileDamage: config.projectileDamage,
      hitFlashUntil: 0
    };
  }

  function createMissionRun(missionId) {
    const config = LEVEL_CONFIGS[missionId];
    return {
      id: missionId,
      name: config.name,
      worldWidth: config.worldWidth,
      spawn: { ...config.spawn },
      finishGate: { ...config.finishGate },
      blocks: config.blocks.map((b) => ({ ...b })),
      bossTemplate: { ...config.boss },
      cameraX: 0,
      projectiles: [],
      enemyProjectiles: [],
      hitSparks: [],
      enemies: config.enemySpawns.map((spawn) => createEnemy(spawn)),
      boss: null,
      bossActive: false,
      bossDefeated: false,
      levelComplete: false,
      gateTriggered: false
    };
  }

  function setDialogue(speaker, text, duration = 3.6) {
    game.dialogueSpeaker = speaker;
    game.dialogueText = text;
    game.dialogueUntil = game.now + duration;
  }

  function setFeedback(text, duration = 1.8) {
    game.feedbackText = text;
    game.feedbackUntil = game.now + duration;
  }

  function giveXp(amount) {
    profile.xp += amount;
    let leveled = false;
    while (profile.xp >= profile.level * 120) {
      profile.xp -= profile.level * 120;
      profile.level += 1;
      leveled = true;
    }
    return leveled;
  }

  function enterHub(message) {
    game.scene = 'hub';
    game.phase = 'hub';
    game.mission = null;

    player.x = hub.spawn.x;
    player.y = hub.spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.hp = player.maxHp;
    player.invulnUntil = 0;
    player.isCharging = false;
    player.currentCharge = 0;

    if (message) {
      setFeedback(message, 2.2);
    }
  }

  function startMissionRun(missionId) {
    game.scene = 'mission';
    game.phase = 'mission';
    game.activeMissionId = missionId;
    game.mission = createMissionRun(missionId);

    player.x = game.mission.spawn.x;
    player.y = game.mission.spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.hp = player.maxHp;
    player.invulnUntil = 0;
    player.lastShotAt = -9999;
    player.cooldownSeconds = 0.28;
    player.isCharging = false;
    player.currentCharge = 0;
    player.cannonMode = profile.rapidUnlocked ? 'rapid_shot' : 'single_shot';

    setFeedback(`Mission Start: ${missionName(missionId)}`, 2.1);
  }

  function resetMissionAfterDeath() {
    if (game.scene !== 'mission') {
      return;
    }
    startMissionRun(game.activeMissionId);
    setFeedback(`Re-deploying ${missionName(game.activeMissionId)}`, 1.8);
  }

  function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function rectDistance(a, b) {
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    return Math.hypot(ax - bx, ay - by);
  }

  function circleHitsRect(c, r) {
    const nearestX = Math.max(r.x, Math.min(c.x, r.x + r.w));
    const nearestY = Math.max(r.y, Math.min(c.y, r.y + r.h));
    const dx = c.x - nearestX;
    const dy = c.y - nearestY;
    return dx * dx + dy * dy <= c.r * c.r;
  }

  function spawnHitSpark(x, y, color, scale = 1) {
    if (!game.mission) {
      return;
    }
    game.mission.hitSparks.push({ x, y, life: 0.16, maxLife: 0.16, color, scale });
  }

  function getShootHeld() {
    return keys.has('j') || keys.has('J') || keys.has('k') || keys.has('K') || keys.has('x') || keys.has('X');
  }

  function canShootNow() {
    return game.now - player.lastShotAt >= player.cooldownSeconds;
  }

  function fireProjectile(power = 0, forcedDamage = null) {
    if (!game.mission) {
      return;
    }

    const shootDir = player.facing;
    const normalizedPower = Math.max(0, Math.min(1, power));
    const damage = forcedDamage ?? (1 + normalizedPower * 3.2);
    const radius = 5 + normalizedPower * 9;
    const speed = 540 + normalizedPower * 240;

    const px = player.x + player.w * (shootDir > 0 ? 0.98 : 0.02);
    const py = player.y + 24;

    game.mission.projectiles.push({
      x: px,
      y: py,
      vx: shootDir * speed,
      vy: 0,
      r: radius,
      damage,
      power: normalizedPower,
      color: normalizedPower > 0.45 ? '#9ff9ff' : '#72e8ff'
    });

    player.lastShotAt = game.now;
    player.cooldownSeconds = 0.2 + normalizedPower * 0.3;
  }

  function fireBossBurst(boss) {
    if (!game.mission || !boss || !boss.alive) {
      return;
    }

    const sourceX = boss.x + boss.w / 2;
    const sourceY = boss.y + 38;
    const targetX = player.x + player.w / 2;
    const targetY = player.y + player.h / 2;

    const baseAngle = Math.atan2(targetY - sourceY, targetX - sourceX);

    for (let i = 0; i < boss.projectileSpeeds.length; i += 1) {
      const angle = baseAngle + boss.spread[i % boss.spread.length];
      game.mission.enemyProjectiles.push({
        x: sourceX,
        y: sourceY,
        vx: Math.cos(angle) * boss.projectileSpeeds[i],
        vy: Math.sin(angle) * boss.projectileSpeeds[i],
        r: 7,
        damage: boss.projectileDamage
      });
    }
  }

  function damagePlayer(amount, sourceX) {
    if (game.phase !== 'mission' || game.now < player.invulnUntil) {
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
      game.phase = 'mission_failed';
      missionState(game.activeMissionId).deaths += 1;
      saveProfile();
      setFeedback('Mission failed. Press R to retry or H for Hub.', 2.8);
    }
  }

  function isMoveLeft() {
    return keys.has('ArrowLeft') || keys.has('a') || keys.has('A');
  }

  function isMoveRight() {
    return keys.has('ArrowRight') || keys.has('d') || keys.has('D');
  }

  function wantsJumpPress() {
    return justPressed.has(' ') || justPressed.has('ArrowUp') || justPressed.has('w') || justPressed.has('W');
  }

  function wantsInteractPress() {
    return justPressed.has('e') || justPressed.has('E');
  }

  function updateMissionInput(dt) {
    const moveLeft = isMoveLeft();
    const moveRight = isMoveRight();

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

    const shootHeld = getShootHeld();

    if (!profile.chargeUnlocked) {
      if (shootHeld && canShootNow()) {
        fireProjectile(0, 1);
      }
      return;
    }

    if (shootHeld && !player.isCharging && canShootNow()) {
      player.isCharging = true;
      player.chargeStartedAt = game.now;
      player.currentCharge = 0;
    }

    if (player.isCharging && shootHeld) {
      player.currentCharge = Math.max(0, Math.min(1, (game.now - player.chargeStartedAt) / 1.15));
    }

    if (player.isCharging && !shootHeld) {
      fireProjectile(player.currentCharge);
      spawnHitSpark(player.x + player.w / 2 + player.facing * 14, player.y + 24, '#8df6ff', 1 + player.currentCharge * 0.8);
      player.isCharging = false;
      player.currentCharge = 0;
    }
  }

  function updateHubInput() {
    let moveX = 0;
    let moveY = 0;

    if (isMoveLeft()) {
      moveX -= 1;
      player.facing = -1;
    }
    if (isMoveRight()) {
      moveX += 1;
      player.facing = 1;
    }
    if (keys.has('w') || keys.has('W') || keys.has('ArrowUp')) {
      moveY -= 1;
    }
    if (keys.has('s') || keys.has('S') || keys.has('ArrowDown')) {
      moveY += 1;
    }

    const mag = Math.hypot(moveX, moveY) || 1;
    player.x += (moveX / mag) * player.hubSpeed * game.fpsSafeDt;
    player.y += (moveY / mag) * player.hubSpeed * game.fpsSafeDt;

    player.x = Math.max(36, Math.min(HUB_WIDTH - 36 - player.w, player.x));
    player.y = Math.max(52, Math.min(HUB_HEIGHT - 40 - player.h, player.y));

    if (wantsInteractPress()) {
      interactInHub();
    }
  }

  function interactInHub() {
    const m1 = missionState(LEVEL_1_ID);
    const m2 = missionState(LEVEL_2_ID);

    if (rectDistance(player, hub.commander) < 90) {
      if (!m1.accepted) {
        m1.accepted = true;
        saveProfile();
        setDialogue(hub.commander.name, 'Mission approved: Reactor Sweep. Reach the lift and deploy.');
      } else if (m1.accepted && !m1.completed) {
        setDialogue(hub.commander.name, 'Reactor Sweep is active. Clear the mini-boss and report in.');
      } else if (m1.completed && !m1.turnedIn) {
        setDialogue(hub.commander.name, 'Engineer Vale needs your Reactor Sweep report before reassignment.');
      } else if (!m2.accepted) {
        m2.accepted = true;
        saveProfile();
        setDialogue(hub.commander.name, 'Level 2 unlocked: Sky Foundry. Expect heavier resistance.');
      } else if (m2.accepted && !m2.completed) {
        setDialogue(hub.commander.name, 'Sky Foundry is live. Hold your cannon charge for bigger impact.');
      } else if (m2.completed && !m2.turnedIn) {
        setDialogue(hub.commander.name, 'Turn in your Sky Foundry clear at engineering for final sync.');
      } else {
        setDialogue(hub.commander.name, 'Sector clear confirmed. Awaiting Milestone 3 expansion orders.');
      }
      return;
    }

    if (rectDistance(player, hub.engineer) < 90) {
      if (m1.completed && !m1.turnedIn) {
        m1.turnedIn = true;
        profile.credits += 120;
        const leveled = giveXp(90);
        saveProfile();

        if (leveled) {
          setDialogue(hub.engineer.name, `Reactor payout delivered. +120 credits, +90 XP. Level ${profile.level} reached.`);
        } else {
          setDialogue(hub.engineer.name, 'Reactor payout delivered. +120 credits and +90 XP synced.');
        }
      } else if (m2.completed && !m2.turnedIn) {
        m2.turnedIn = true;
        profile.credits += 180;
        const leveled = giveXp(140);
        saveProfile();

        if (leveled) {
          setDialogue(hub.engineer.name, `Sky Foundry payout complete. +180 credits, +140 XP. Level ${profile.level} reached.`);
        } else {
          setDialogue(hub.engineer.name, 'Sky Foundry payout complete. Charge cannon calibration finalized.');
        }
      } else if (m2.completed && m2.turnedIn) {
        setDialogue(hub.engineer.name, 'All systems tuned. Charged blast profile is stable.');
      } else {
        setDialogue(hub.engineer.name, 'Bring me completed mission logs and I can issue upgrades.');
      }
      return;
    }

    if (rectDistance(player, hub.missionLift) < 110) {
      const next = nextMissionId();
      if (!next) {
        setDialogue(hub.missionLift.name, 'No pending mission. Hub standing by.');
      } else if (!missionState(next).accepted) {
        setDialogue(hub.missionLift.name, 'Mission lock active. Talk to Commander Rho first.', 3.2);
      } else {
        startMissionRun(next);
      }
      return;
    }

    if (rectDistance(player, hub.dataTerminal) < 110) {
      const missionText1 = missionState(LEVEL_1_ID).turnedIn
        ? 'L1 archived'
        : missionState(LEVEL_1_ID).completed
          ? 'L1 complete, pending turn-in'
          : missionState(LEVEL_1_ID).accepted
            ? 'L1 in progress'
            : 'L1 locked';

      const missionText2 = missionState(LEVEL_2_ID).turnedIn
        ? 'L2 archived'
        : missionState(LEVEL_2_ID).completed
          ? 'L2 complete, pending turn-in'
          : missionState(LEVEL_2_ID).accepted
            ? 'L2 in progress'
            : 'L2 locked';

      const upgrades = profile.chargeUnlocked ? 'Rapid + Charge online' : profile.rapidUnlocked ? 'Rapid online' : 'Base cannon';
      setDialogue(hub.dataTerminal.name, `Lvl ${profile.level} | Cr ${profile.credits} | ${missionText1} | ${missionText2} | ${upgrades}`);
    }
  }

  function resolveMissionHorizontal() {
    if (!game.mission) {
      return;
    }

    for (const block of game.mission.blocks) {
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

  function resolveMissionVertical() {
    if (!game.mission) {
      return;
    }

    for (const block of game.mission.blocks) {
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

  function updateMissionPlayer(dt) {
    const mission = game.mission;
    if (!mission) {
      return;
    }

    player.vy += GRAVITY * dt;
    if (player.vy > MAX_FALL_SPEED) {
      player.vy = MAX_FALL_SPEED;
    }

    player.x += player.vx * dt;
    resolveMissionHorizontal();

    player.y += player.vy * dt;
    player.grounded = false;
    resolveMissionVertical();

    player.x = Math.max(0, Math.min(mission.worldWidth - player.w, player.x));

    if (player.y > HEIGHT + 240) {
      player.hp = 0;
      game.phase = 'mission_failed';
      missionState(game.activeMissionId).deaths += 1;
      saveProfile();
      setFeedback('Fell out of range. Press R to retry or H for Hub.', 2.8);
      return;
    }

    if (!mission.bossActive && !mission.gateTriggered && intersects(player, mission.finishGate)) {
      mission.gateTriggered = true;
      mission.bossActive = true;
      mission.boss = createBoss(mission.bossTemplate);
      setFeedback('Mini-Boss Encounter', 1.8);
    }

    if (mission.bossActive && mission.boss && mission.boss.alive) {
      player.x = Math.max(mission.boss.moveMinX, Math.min(mission.boss.moveMaxX - player.w, player.x));
    }
  }

  function updateMissionEnemies(dt) {
    const mission = game.mission;
    if (!mission) {
      return;
    }

    for (const enemy of mission.enemies) {
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
        damagePlayer(enemy.contactDamage, enemy.x + enemy.w / 2);
      }
    }
  }

  function updateMissionBoss(dt) {
    const mission = game.mission;
    if (!mission || !mission.bossActive || !mission.boss || !mission.boss.alive) {
      return;
    }

    const boss = mission.boss;
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
      fireBossBurst(boss);
      boss.attackTimer = boss.attackInterval;
    }

    if (intersects(player, boss)) {
      damagePlayer(boss.contactDamage, boss.x + boss.w / 2);
    }
  }

  function completeMissionRun() {
    const missionId = game.activeMissionId;
    const ms = missionState(missionId);
    ms.completed = true;
    profile.clears += 1;

    if (missionId === LEVEL_1_ID && !profile.rapidUnlocked) {
      profile.rapidUnlocked = true;
      player.cannonMode = 'rapid_shot';
      setFeedback('Rapid Shot unlocked', 2.4);
    }

    if (missionId === LEVEL_2_ID && !profile.chargeUnlocked) {
      profile.chargeUnlocked = true;
      player.chargeUnlocked = true;
      setFeedback('Charge Blast unlocked: hold fire, release for power', 2.6);
    }

    saveProfile();
    enterHub(`${missionName(missionId)} complete. Report to Engineer Vale.`);
  }

  function updateMissionProjectiles(dt) {
    const mission = game.mission;
    if (!mission) {
      return;
    }

    for (const projectile of mission.projectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
    }

    for (const projectile of mission.enemyProjectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
    }

    for (const projectile of mission.projectiles) {
      if (projectile._dead) {
        continue;
      }
      for (const enemy of mission.enemies) {
        if (!enemy.alive || projectile._dead) {
          continue;
        }
        if (circleHitsRect(projectile, enemy)) {
          enemy.hp -= projectile.damage;
          enemy.hitFlashUntil = game.now + 0.08;
          projectile._dead = true;
          spawnHitSpark(projectile.x, projectile.y, '#75f3ff', 1 + projectile.power * 0.8);
          if (enemy.hp <= 0) {
            enemy.alive = false;
            spawnHitSpark(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ffcc66', 1.1);
          }
        }
      }

      if (mission.boss && mission.boss.alive && !projectile._dead && circleHitsRect(projectile, mission.boss)) {
        mission.boss.hp -= projectile.damage;
        mission.boss.hitFlashUntil = game.now + 0.1;
        projectile._dead = true;
        spawnHitSpark(projectile.x, projectile.y, '#9df0ff', 1 + projectile.power);

        if (mission.boss.hp <= 0) {
          mission.boss.alive = false;
          mission.bossDefeated = true;
          mission.levelComplete = true;
          completeMissionRun();
          return;
        }
      }
    }

    for (const projectile of mission.enemyProjectiles) {
      if (projectile._dead) {
        continue;
      }
      if (circleHitsRect(projectile, player)) {
        projectile._dead = true;
        damagePlayer(projectile.damage || 10, projectile.x);
      }
    }

    mission.projectiles = mission.projectiles.filter(
      (p) => !p._dead && p.x > -120 && p.x < mission.worldWidth + 120 && p.y > -120 && p.y < HEIGHT + 120
    );
    mission.enemyProjectiles = mission.enemyProjectiles.filter(
      (p) => !p._dead && p.x > -120 && p.x < mission.worldWidth + 120 && p.y > -120 && p.y < HEIGHT + 120
    );
  }

  function updateMissionSparks(dt) {
    const mission = game.mission;
    if (!mission) {
      return;
    }

    for (const spark of mission.hitSparks) {
      spark.life -= dt;
    }
    mission.hitSparks = mission.hitSparks.filter((spark) => spark.life > 0);
  }

  function updateMissionCamera(dt) {
    const mission = game.mission;
    if (!mission) {
      return;
    }

    const targetX = player.x - WIDTH * 0.36;
    const clamped = Math.max(0, Math.min(mission.worldWidth - WIDTH, targetX));
    mission.cameraX += (clamped - mission.cameraX) * Math.min(1, dt * 8);
    game.cameraX = mission.cameraX;
  }

  function updateHud() {
    const m1 = missionState(LEVEL_1_ID);
    const m2 = missionState(LEVEL_2_ID);

    if (game.scene === 'mission') {
      healthEl.textContent = String(Math.max(0, Math.ceil(player.hp)));

      if (profile.chargeUnlocked) {
        cannonEl.textContent = 'Rapid + Charge';
      } else if (profile.rapidUnlocked) {
        cannonEl.textContent = 'Rapid Shot';
      } else {
        cannonEl.textContent = 'Single Shot';
      }

      let readiness;
      if (player.isCharging) {
        readiness = player.currentCharge;
      } else {
        const elapsed = game.now - player.lastShotAt;
        readiness = Math.max(0, Math.min(1, elapsed / player.cooldownSeconds));
      }
      cooldownFillEl.style.transform = `scaleX(${readiness})`;

      if (game.phase === 'mission_failed') {
        statusEl.textContent = 'Mission failed. Press R to retry or H for Hub';
      } else if (game.mission?.bossActive && game.mission?.boss?.alive) {
        statusEl.textContent = `${game.mission.name} | Mini-Boss HP: ${Math.max(0, Math.ceil(game.mission.boss.hp))}`;
      } else if (player.isCharging) {
        statusEl.textContent = `${game.mission?.name || 'Mission'} | Charging ${Math.round(player.currentCharge * 100)}%`;
      } else {
        statusEl.textContent = `${game.mission?.name || 'Mission'} active: reach and clear mini-boss gate`;
      }
      return;
    }

    healthEl.textContent = '--';
    cannonEl.textContent = profile.chargeUnlocked ? 'Rapid + Charge' : profile.rapidUnlocked ? 'Rapid Shot' : 'Single Shot';
    cooldownFillEl.style.transform = 'scaleX(1)';

    if (game.phase === 'intro') {
      statusEl.textContent = 'Press Enter to activate hub';
      return;
    }

    if (!m1.accepted) {
      statusEl.textContent = 'Talk to Commander Rho to accept Level 1';
    } else if (!m1.completed) {
      statusEl.textContent = 'Level 1 accepted. Use lift to deploy';
    } else if (!m1.turnedIn) {
      statusEl.textContent = 'Turn in Level 1 report with Engineer Vale';
    } else if (!m2.accepted) {
      statusEl.textContent = 'Talk to Commander Rho to unlock Level 2';
    } else if (!m2.completed) {
      statusEl.textContent = 'Level 2 accepted. Use lift to deploy';
    } else if (!m2.turnedIn) {
      statusEl.textContent = 'Turn in Level 2 report with Engineer Vale';
    } else {
      statusEl.textContent = `Campaign complete. Lvl ${profile.level} | Credits ${profile.credits}`;
    }
  }

  function update(dt) {
    if (game.phase === 'intro') {
      if (justPressed.has('Enter')) {
        enterHub('Hub online. Press E near NPCs to interact.');
      }
      updateHud();
      return;
    }

    if (game.scene === 'hub') {
      updateHubInput();
      updateHud();
      return;
    }

    if (game.phase === 'mission_failed') {
      if (justPressed.has('r') || justPressed.has('R')) {
        resetMissionAfterDeath();
      }
      if (justPressed.has('h') || justPressed.has('H')) {
        enterHub('Returned to hub after failed sortie.');
      }
      updateHud();
      return;
    }

    updateMissionInput(dt);
    updateMissionPlayer(dt);
    updateMissionEnemies(dt);
    updateMissionBoss(dt);
    updateMissionProjectiles(dt);
    updateMissionSparks(dt);
    updateMissionCamera(dt);
    updateHud();
  }

  function drawMissionBackground() {
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

  function drawHubBackground() {
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, '#10253f');
    bg.addColorStop(1, '#091524');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = 'rgba(100, 150, 190, 0.18)';
    for (let x = 0; x <= WIDTH; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    for (const wall of hub.walls) {
      ctx.fillStyle = '#1d2f4a';
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = '#5178a4';
      ctx.fillRect(wall.x, wall.y, wall.w, 5);
    }

    drawHubMarker(hub.commander, '#6fd3ff', 'Commander Rho');
    drawHubMarker(hub.engineer, '#ffbe7d', 'Engineer Vale');
    drawHubMarker(hub.dataTerminal, '#7cf7d6', 'Log Terminal');

    ctx.fillStyle = '#73e1ff';
    ctx.fillRect(hub.missionLift.x, hub.missionLift.y, hub.missionLift.w, hub.missionLift.h);
    ctx.fillStyle = '#d8f6ff';
    ctx.font = 'bold 18px Segoe UI';
    ctx.fillText('MISSION LIFT', hub.missionLift.x - 8, hub.missionLift.y - 12);

    drawHubObjectives();
  }

  function drawHubMarker(rect, color, label) {
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = '#e8f3ff';
    ctx.font = '16px Segoe UI';
    ctx.fillText(label, rect.x - 6, rect.y - 10);
  }

  function drawHubObjectives() {
    const m1 = missionState(LEVEL_1_ID);
    const m2 = missionState(LEVEL_2_ID);
    let objective;

    if (!m1.accepted) {
      objective = 'Objective: Talk to Commander Rho to accept Level 1';
    } else if (!m1.completed) {
      objective = 'Objective: Use Mission Lift (E) to clear Level 1';
    } else if (!m1.turnedIn) {
      objective = 'Objective: Turn in Level 1 mission with Engineer Vale';
    } else if (!m2.accepted) {
      objective = 'Objective: Talk to Commander Rho to unlock Level 2';
    } else if (!m2.completed) {
      objective = 'Objective: Use Mission Lift (E) to clear Level 2';
    } else if (!m2.turnedIn) {
      objective = 'Objective: Turn in Level 2 mission with Engineer Vale';
    } else {
      objective = `Objective: Campaign complete | Level ${profile.level} | Credits ${profile.credits}`;
    }

    ctx.fillStyle = 'rgba(7, 16, 28, 0.7)';
    ctx.fillRect(24, 20, WIDTH - 48, 36);
    ctx.fillStyle = '#bfe2ff';
    ctx.font = 'bold 18px Segoe UI';
    ctx.fillText(objective, 36, 44);
  }

  function drawMissionWorld() {
    const mission = game.mission;
    if (!mission) {
      return;
    }

    const camX = mission.cameraX;
    ctx.save();
    ctx.translate(-camX, 0);

    for (const block of mission.blocks) {
      ctx.fillStyle = '#22384f';
      ctx.fillRect(block.x, block.y, block.w, block.h);
      ctx.fillStyle = '#4a799d';
      ctx.fillRect(block.x, block.y, block.w, 8);
    }

    if (!mission.gateTriggered) {
      ctx.fillStyle = '#73e1ff';
      ctx.fillRect(mission.finishGate.x, mission.finishGate.y, mission.finishGate.w, mission.finishGate.h);
      ctx.fillStyle = '#c9f5ff';
      ctx.font = '15px Segoe UI';
      ctx.fillText('BOSS GATE', mission.finishGate.x - 18, mission.finishGate.y - 12);
    }

    for (const enemy of mission.enemies) {
      if (!enemy.alive) {
        continue;
      }
      drawCrawler(enemy, enemy.hitFlashUntil > game.now);
    }

    if (mission.bossActive && mission.boss && mission.boss.alive) {
      drawBoss(mission.boss, mission.boss.hitFlashUntil > game.now);

      const barW = 290;
      const ratio = Math.max(0, mission.boss.hp) / mission.boss.maxHp;
      ctx.fillStyle = '#180a14';
      ctx.fillRect(camX + WIDTH - barW - 26, 20, barW, 18);
      ctx.fillStyle = '#ff4d80';
      ctx.fillRect(camX + WIDTH - barW - 26, 20, barW * ratio, 18);
      ctx.strokeStyle = '#ff94b5';
      ctx.strokeRect(camX + WIDTH - barW - 26, 20, barW, 18);

      ctx.fillStyle = '#ffd2df';
      ctx.font = 'bold 15px Segoe UI';
      ctx.fillText(mission.name, camX + WIDTH - barW - 24, 14);
    }

    drawPlayer();
    drawProjectiles();
    drawSparks();

    ctx.restore();
  }

  function drawHubWorld() {
    drawPlayer();

    const interactables = [hub.commander, hub.engineer, hub.dataTerminal, hub.missionLift];
    let nearest = null;
    let nearestDist = 9999;

    for (const item of interactables) {
      const d = rectDistance(player, item);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = item;
      }
    }

    if (nearest && nearestDist < 110) {
      ctx.fillStyle = 'rgba(7, 16, 28, 0.75)';
      ctx.fillRect(302, 468, 356, 44);
      ctx.fillStyle = '#d4efff';
      ctx.font = 'bold 20px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(`Press E to interact: ${nearest.name}`, WIDTH / 2, 496);
      ctx.textAlign = 'left';
    }
  }

  function drawPlayer() {
    const hitFlash = game.scene === 'mission' && game.now < player.invulnUntil && Math.floor(game.now * 20) % 2 === 0;

    ctx.save();
    ctx.translate(player.x, player.y);

    ctx.fillStyle = hitFlash ? '#ff8ea8' : '#8ac9ff';
    ctx.fillRect(9, 8, 24, 22);
    ctx.fillRect(5, 28, 32, 24);

    ctx.fillStyle = '#d5ecff';
    ctx.fillRect(13, 12, 16, 8);

    ctx.fillStyle = '#4ea8ff';
    ctx.fillRect(player.facing > 0 ? 27 : -6, 30, 24, 14);

    if (player.isCharging) {
      ctx.fillStyle = '#9ef6ff';
      ctx.globalAlpha = 0.4 + player.currentCharge * 0.6;
      ctx.beginPath();
      ctx.arc(player.facing > 0 ? 52 : -6, 37, 10 + player.currentCharge * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

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
    if (!game.mission) {
      return;
    }

    for (const p of game.mission.projectiles) {
      ctx.fillStyle = p.color || '#72e8ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of game.mission.enemyProjectiles) {
      ctx.fillStyle = '#ff7899';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSparks() {
    if (!game.mission) {
      return;
    }

    for (const spark of game.mission.hitSparks) {
      const alpha = spark.life / spark.maxLife;
      ctx.fillStyle = spark.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, 14 * alpha * (spark.scale || 1), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function centeredMessage(title, subtitle) {
    ctx.fillStyle = 'rgba(5, 10, 17, 0.66)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#f0f8ff';
    ctx.font = 'bold 44px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 24);
    ctx.font = '23px Segoe UI';
    ctx.fillStyle = '#9dd8ff';
    ctx.fillText(subtitle, WIDTH / 2, HEIGHT / 2 + 20);
    ctx.textAlign = 'left';
  }

  function drawOverlay() {
    if (game.feedbackUntil > game.now) {
      const alpha = Math.min(1, (game.feedbackUntil - game.now) / 0.4);
      ctx.fillStyle = `rgba(5, 10, 17, ${Math.min(0.78, alpha)})`;
      ctx.fillRect(0, 0, WIDTH, 74);
      ctx.fillStyle = '#d8efff';
      ctx.font = 'bold 24px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(game.feedbackText, WIDTH / 2, 47);
      ctx.textAlign = 'left';
    }

    if (game.dialogueUntil > game.now) {
      ctx.fillStyle = 'rgba(5, 10, 17, 0.8)';
      ctx.fillRect(28, HEIGHT - 128, WIDTH - 56, 94);
      ctx.strokeStyle = '#5a87b4';
      ctx.lineWidth = 2;
      ctx.strokeRect(28, HEIGHT - 128, WIDTH - 56, 94);
      ctx.fillStyle = '#ffdca4';
      ctx.font = 'bold 20px Segoe UI';
      ctx.fillText(game.dialogueSpeaker, 44, HEIGHT - 96);
      ctx.fillStyle = '#d6ebff';
      ctx.font = '19px Segoe UI';
      ctx.fillText(game.dialogueText, 44, HEIGHT - 62);
    }

    if (game.phase === 'intro') {
      centeredMessage('Robot Cannon Platformer', 'Milestone 2: Press Enter to open the Hub');
    }

    if (game.phase === 'mission_failed') {
      centeredMessage('Mission Failed', 'Press R to retry or H to return to Hub');
    }

    if (game.scene === 'mission' && profile.chargeUnlocked) {
      ctx.fillStyle = 'rgba(10, 18, 30, 0.7)';
      ctx.fillRect(24, HEIGHT - 40, 280, 16);
      ctx.fillStyle = '#6adfff';
      ctx.fillRect(24, HEIGHT - 40, 280 * (player.isCharging ? player.currentCharge : 0), 16);
      ctx.strokeStyle = '#98dfff';
      ctx.strokeRect(24, HEIGHT - 40, 280, 16);
      ctx.fillStyle = '#bdeeff';
      ctx.font = '14px Segoe UI';
      ctx.fillText('Charge Blast (hold fire, release to blast)', 24, HEIGHT - 46);
    }
  }

  function render() {
    if (game.scene === 'hub' || game.phase === 'intro') {
      drawHubBackground();
      drawHubWorld();
    } else {
      drawMissionBackground();
      drawMissionWorld();
    }

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

    if ((justPressed.has('r') || justPressed.has('R')) && game.scene === 'hub') {
      enterHub('Hub state refreshed.');
    }

    update(dt);
    render();

    justPressed.clear();
    requestAnimationFrame(frame);
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key;
    if (!keys.has(key)) {
      justPressed.add(key);
    }
    keys.add(key);

    if (wantsJumpPress() && player.grounded && game.phase === 'mission') {
      player.vy = -player.jumpSpeed;
      player.grounded = false;
    }

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(key)) {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.key);
  });

  player.cannonMode = profile.rapidUnlocked ? 'rapid_shot' : 'single_shot';
  player.chargeUnlocked = profile.chargeUnlocked;
  saveProfile();
  updateHud();
  requestAnimationFrame(frame);
})();
