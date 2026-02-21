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
  const FPS_MAX_PITCH = 0.75;
  const VISUAL_FLAGS = {
    enableBloomLikeGlow: true,
    enableDecalOverlay: true,
    enableVignettePulse: true
  };

  const LEVEL_1_ID = 'reactor_sweep';
  const LEVEL_2_ID = 'sky_foundry';
  const LEVEL_3_ID = 'black_site_breach';

  const keys = new Set();
  const justPressed = new Set();

  const LEVEL_CONFIGS = {
    [LEVEL_1_ID]: {
      name: 'Level 1 - Reactor Sweep',
      mode: '2d',
      visualThemeId: 'level1',
      worldWidth: 4300,
      spawn: { x: 90, y: 380 },
      finishGate: { x: 2580, y: 300, w: 45, h: 170 },
      blocks: [
        { x: 0, y: 470, w: 620, h: 70 },
        { x: 760, y: 470, w: 520, h: 70 },
        { x: 1360, y: 470, w: 450, h: 70 },
        { x: 1720, y: 390, w: 130, h: 20 },
        { x: 1930, y: 470, w: 280, h: 70 },
        { x: 2100, y: 360, w: 120, h: 20 },
        { x: 2280, y: 470, w: 340, h: 70 },
        { x: 2440, y: 340, w: 140, h: 20 },
        { x: 2660, y: 470, w: 1320, h: 70 },
        { x: 2740, y: 360, w: 120, h: 20 },
        { x: 3020, y: 330, w: 120, h: 20 },
        { x: 3330, y: 310, w: 130, h: 20 },
        { x: 3600, y: 340, w: 130, h: 20 }
      ],
      enemySpawns: [
        { x: 900, y: 418, minX: 790, maxX: 1210, hp: 3, speed: 90 },
        { x: 1500, y: 418, minX: 1400, maxX: 1750, hp: 3, speed: 90 },
        { x: 1825, y: 338, minX: 1730, maxX: 1860, hp: 3, speed: 96 },
        { x: 2140, y: 418, minX: 1980, maxX: 2240, hp: 4, speed: 102 },
        { x: 2480, y: 288, minX: 2440, maxX: 2565, hp: 4, speed: 106 },
        { x: 2360, y: 418, minX: 2310, maxX: 2570, hp: 3, speed: 95 }
      ],
      boss: {
        x: 3430,
        y: 330,
        w: 118,
        h: 130,
        hp: 60,
        speed: 95,
        moveMinX: 2860,
        moveMaxX: 3780,
        attackInterval: 1.2,
        projectileSpeeds: [260, 300, 340],
        spread: [-0.24, 0, 0.24],
        contactDamage: 22,
        projectileDamage: 10
      }
    },
    [LEVEL_2_ID]: {
      name: 'Level 2 - Sky Foundry',
      mode: '2d',
      visualThemeId: 'level2',
      worldWidth: 4700,
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
        { x: 3460, y: 470, w: 1200, h: 70 },
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
        x: 4040,
        y: 300,
        w: 128,
        h: 142,
        hp: 92,
        speed: 125,
        moveMinX: 3460,
        moveMaxX: 4560,
        attackInterval: 0.9,
        projectileSpeeds: [290, 330, 370, 410],
        spread: [-0.33, -0.12, 0.12, 0.33],
        contactDamage: 26,
        projectileDamage: 14
      }
    },
    [LEVEL_3_ID]: {
      name: 'Level 3 - Black Site Breach',
      mode: 'fps',
      visualThemeId: 'fps',
      fps: {
        map: [
          '########################',
          '#S...#.................#',
          '#.##.#.#####.#########.#',
          '#....#.....#.....#....##',
          '####.#####.#####.#.##..#',
          '#....#...#.....#.#..#..#',
          '#.####.#.#####.#.##.#..#',
          '#......#...#...#....#..#',
          '#.########.#.########..#',
          '#.....#....#......#....#',
          '#.###.#.#########.#.##.#',
          '#.#...#....#......#..#.#',
          '#.#.######.#.#######.#.#',
          '#...#......#.....#...#E#',
          '########################'
        ],
        moveSpeed: 3.6,
        sprintMultiplier: 1.55,
        lookSpeed: 0.0026,
        fireCooldown: 0.2,
        enemyDamage: 14,
        enemyAggroRange: 6.5,
        enemyShootInterval: 1.1,
        enemySpawns: [
          { x: 5.5, y: 2.5, hp: 3 },
          { x: 10.5, y: 4.5, hp: 4 },
          { x: 16.5, y: 6.5, hp: 4 },
          { x: 20.5, y: 10.5, hp: 5 }
        ]
      }
    }
  };

  const hub = {
    visualThemeId: 'hub',
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

  function createDefaultMissions() {
    return {
      [LEVEL_1_ID]: { accepted: false, completed: false, turnedIn: false, deaths: 0 },
      [LEVEL_2_ID]: { accepted: false, completed: false, turnedIn: false, deaths: 0 },
      [LEVEL_3_ID]: { accepted: false, completed: false, turnedIn: false, deaths: 0 }
    };
  }

  function createDefaultProfile() {
    return {
      rapidUnlocked: localStorage.getItem(LEGACY_RAPID_KEY) === '1',
      chargeUnlocked: false,
      pierceUnlocked: false,
      credits: 0,
      xp: 0,
      level: 1,
      clears: 0,
      missions: createDefaultMissions()
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
        missions: createDefaultMissions()
      };

      const parsedMissions =
        parsed.missions && typeof parsed.missions === 'object' && !Array.isArray(parsed.missions)
          ? parsed.missions
          : {};

      for (const missionId of Object.keys(fallback.missions)) {
        const rawState = parsedMissions[missionId];
        const state = rawState && typeof rawState === 'object' ? rawState : {};
        merged.missions[missionId] = {
          accepted: Boolean(state.accepted),
          completed: Boolean(state.completed),
          turnedIn: Boolean(state.turnedIn),
          deaths: Number.isFinite(Number(state.deaths)) ? Number(state.deaths) : 0
        };
      }

      merged.rapidUnlocked = Boolean(merged.rapidUnlocked || localStorage.getItem(LEGACY_RAPID_KEY) === '1');
      merged.chargeUnlocked = Boolean(merged.chargeUnlocked);
      merged.pierceUnlocked = Boolean(merged.pierceUnlocked);
      return merged;
    } catch {
      return fallback;
    }
  }

  const profile = loadProfile();

  // Migration: if a player already cleared Level 1 in an older build, grant the charge unlock now.
  if (profile.missions?.[LEVEL_1_ID]?.completed && !profile.chargeUnlocked) {
    profile.chargeUnlocked = true;
  }

  // Migration: if Level 2 was already completed in an older build, ensure Level 3 is unlocked.
  if (profile.missions?.[LEVEL_2_ID]?.completed && !profile.missions?.[LEVEL_3_ID]?.accepted) {
    profile.missions[LEVEL_3_ID].accepted = true;
  }

  function saveProfile() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    if (profile.rapidUnlocked) {
      localStorage.setItem(LEGACY_RAPID_KEY, '1');
    } else {
      localStorage.removeItem(LEGACY_RAPID_KEY);
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
    shakeTime: 0,
    shakeMagnitude: 0,
    shakeX: 0,
    shakeY: 0,
    fpsSafeDt: 1 / 30,
    renderFx: {
      vignetteIntensity: 0.28,
      lowHpPulse: 0,
      flashEvents: [],
      cameraKickX: 0,
      cameraKickY: 0
    }
  };

  let audioContext = null;
  let mouseLeftDown = false;
  const shellEl = document.querySelector('.game-shell');

  const VISUAL_THEME = {
    hub: {
      skyTop: '#123451',
      skyBottom: '#08111d',
      haze: 'rgba(76, 162, 177, 0.09)',
      panelTop: '#1a3553',
      panelBottom: '#0a1526',
      edge: '#6db6df',
      floorAccent: '#2a6074',
      vignette: 0.32
    },
    level1: {
      skyTop: '#1a3b5b',
      skyBottom: '#080f1c',
      haze: 'rgba(85, 214, 180, 0.08)',
      panelTop: '#20496a',
      panelBottom: '#101d30',
      edge: '#76d5db',
      floorAccent: '#275f77',
      vignette: 0.3
    },
    level2: {
      skyTop: '#163754',
      skyBottom: '#090f1a',
      haze: 'rgba(100, 206, 255, 0.08)',
      panelTop: '#214767',
      panelBottom: '#0f1b2d',
      edge: '#6fd1ff',
      floorAccent: '#2b6f87',
      vignette: 0.34
    },
    fps: {
      skyTop: '#3d5885',
      skyBottom: '#14243f',
      haze: 'rgba(106, 197, 255, 0.06)',
      panelTop: '#20334f',
      panelBottom: '#101a2c',
      edge: '#88dbff',
      floorAccent: '#2f5368',
      vignette: 0.26
    }
  };

  const visualAssets = {
    noise: null,
    grime1: null,
    grime2: null,
    panelHighlight: null,
    scanline: null
  };
  let visualAssetsReady = false;

  function loadVisualAssets() {
    const entries = [
      ['noise', 'assets/noise.png'],
      ['grime1', 'assets/grime-decal-01.png'],
      ['grime2', 'assets/grime-decal-02.png'],
      ['panelHighlight', 'assets/panel-highlight.png'],
      ['scanline', 'assets/scanline-soft.png']
    ];
    let pending = entries.length;
    if (!pending) {
      visualAssetsReady = true;
      return;
    }
    for (const [key, src] of entries) {
      const img = new Image();
      img.onload = () => {
        visualAssets[key] = img;
        pending -= 1;
        if (pending <= 0) {
          visualAssetsReady = true;
        }
      };
      img.onerror = () => {
        pending -= 1;
        if (pending <= 0) {
          visualAssetsReady = true;
        }
      };
      img.src = src;
    }
  }

  function activeTheme() {
    if (game.scene === 'hub' || game.phase === 'intro') {
      return VISUAL_THEME[hub.visualThemeId];
    }
    const missionId = game.activeMissionId;
    const themeId = LEVEL_CONFIGS[missionId]?.visualThemeId || 'level1';
    return VISUAL_THEME[themeId] || VISUAL_THEME.level1;
  }

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
    if (!missionState(LEVEL_3_ID).completed) {
      return LEVEL_3_ID;
    }
    return null;
  }

  function tryLaunchMissionById(missionId, lockMessage = true) {
    const state = missionState(missionId);
    if (missionId === LEVEL_3_ID && missionState(LEVEL_2_ID).completed && !state?.accepted) {
      state.accepted = true;
      saveProfile();
    }
    if (!state?.accepted) {
      if (lockMessage) {
        setDialogue('Mission Lift', 'Mission lock active. Talk to Commander Rho first.', 3.2);
      }
      return false;
    }
    startMissionRun(missionId);
    return true;
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

  function parseFpsMap(mapRows) {
    const grid = mapRows.map((row) => row.split(''));
    let spawn = { x: 1.5, y: 1.5 };
    let exit = { x: 2.5, y: 2.5 };

    for (let y = 0; y < grid.length; y += 1) {
      for (let x = 0; x < grid[y].length; x += 1) {
        if (grid[y][x] === 'S') {
          spawn = { x: x + 0.5, y: y + 0.5 };
          grid[y][x] = '.';
        } else if (grid[y][x] === 'E') {
          exit = { x: x + 0.5, y: y + 0.5 };
          grid[y][x] = '.';
        }
      }
    }

    return { grid, spawn, exit, width: grid[0]?.length || 0, height: grid.length };
  }

  function createFpsEnemies(spawns) {
    return spawns.map((spawn) => ({
      x: spawn.x,
      y: spawn.y,
      hp: spawn.hp,
      alive: true,
      lastShotAt: -999,
      hitFlashUntil: 0
    }));
  }

  function createMissionRun(missionId) {
    const config = LEVEL_CONFIGS[missionId];
    if (config.mode === 'fps') {
      const parsed = parseFpsMap(config.fps.map);
      return {
        id: missionId,
        name: config.name,
        mode: 'fps',
        cameraX: 0,
        hitSparks: [],
        impactRings: [],
        lightFlashes: [],
        fps: {
          grid: parsed.grid,
          mapWidth: parsed.width,
          mapHeight: parsed.height,
          spawn: parsed.spawn,
          exit: parsed.exit,
          yaw: 0,
          pitch: 0,
          fireCooldown: config.fps.fireCooldown,
          lastFireAt: -999,
          moveSpeed: config.fps.moveSpeed,
          sprintMultiplier: config.fps.sprintMultiplier,
          lookSpeed: config.fps.lookSpeed,
          enemyDamage: config.fps.enemyDamage,
          enemyAggroRange: config.fps.enemyAggroRange,
          enemyShootInterval: config.fps.enemyShootInterval,
          enemies: createFpsEnemies(config.fps.enemySpawns),
          bolts: []
        }
      };
    }

    return {
      id: missionId,
      name: config.name,
      mode: '2d',
      worldWidth: config.worldWidth,
      spawn: { ...config.spawn },
      finishGate: { ...config.finishGate },
      blocks: config.blocks.map((b) => ({ ...b })),
      bossTemplate: { ...config.boss },
      cameraX: 0,
      projectiles: [],
      enemyProjectiles: [],
      hitSparks: [],
      impactRings: [],
      lightFlashes: [],
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

  function resetProgressProfile() {
    profile.rapidUnlocked = false;
    profile.chargeUnlocked = false;
    profile.pierceUnlocked = false;
    profile.credits = 0;
    profile.xp = 0;
    profile.level = 1;
    profile.clears = 0;
    profile.missions = createDefaultMissions();
    player.chargeUnlocked = profile.chargeUnlocked;
    player.cannonMode = profile.rapidUnlocked ? 'rapid_shot' : 'single_shot';
    localStorage.removeItem(LEGACY_RAPID_KEY);
    saveProfile();
  }

  function enterHub(message) {
    mouseLeftDown = false;
    if (document.pointerLockElement === canvas) {
      document.exitPointerLock();
    }
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

    if (game.mission.mode === 'fps') {
      player.x = game.mission.fps.spawn.x;
      player.y = game.mission.fps.spawn.y;
    } else {
      player.x = game.mission.spawn.x;
      player.y = game.mission.spawn.y;
    }
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
    mouseLeftDown = false;

    setFeedback(`Mission Start: ${missionName(missionId)}`, 2.1);

    if (game.mission.mode === 'fps') {
      canvas.requestPointerLock?.();
    }
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
    if (!Array.isArray(game.mission.hitSparks)) {
      game.mission.hitSparks = [];
    }
    game.mission.hitSparks.push({ x, y, life: 0.16, maxLife: 0.16, color, scale });
  }

  function spawnImpactRing(x, y, color, size = 1) {
    if (!game.mission) {
      return;
    }
    if (!Array.isArray(game.mission.impactRings)) {
      game.mission.impactRings = [];
    }
    game.mission.impactRings.push({
      x,
      y,
      life: 0.2,
      maxLife: 0.2,
      radius: 8 * size,
      color
    });
  }

  function spawnLightFlash(x, y, color, radius = 64, life = 0.2) {
    if (!game.mission) {
      return;
    }
    if (!Array.isArray(game.mission.lightFlashes)) {
      game.mission.lightFlashes = [];
    }
    game.mission.lightFlashes.push({ x, y, color, radius, life, maxLife: life });
  }

  function isRapidShootHeld() {
    return keys.has('j') || keys.has('J');
  }

  function isChargeShootHeld() {
    return keys.has('k') || keys.has('K');
  }

  function canShootNow() {
    return game.now - player.lastShotAt >= player.cooldownSeconds;
  }

  function ensureAudioContext() {
    if (!audioContext) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioContextCtor) {
        audioContext = new AudioContextCtor();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  }

  function triggerCameraShake(magnitude = 0, duration = 0.18, dirX = 0, dirY = 0) {
    game.shakeMagnitude = Math.max(game.shakeMagnitude, magnitude);
    game.shakeTime = Math.max(game.shakeTime, duration);
    game.renderFx.cameraKickX += dirX;
    game.renderFx.cameraKickY += dirY;
  }

  function updateCameraShake(dt) {
    if (game.shakeTime <= 0) {
      game.shakeTime = 0;
      game.shakeMagnitude = 0;
      game.shakeX = 0;
      game.shakeY = 0;
      game.renderFx.cameraKickX *= 0.82;
      game.renderFx.cameraKickY *= 0.82;
      return;
    }

    game.shakeTime = Math.max(0, game.shakeTime - dt);
    game.shakeMagnitude *= 0.88;
    game.shakeX = (Math.random() * 2 - 1) * game.shakeMagnitude;
    game.shakeY = (Math.random() * 2 - 1) * game.shakeMagnitude;
    game.renderFx.cameraKickX *= 0.82;
    game.renderFx.cameraKickY *= 0.82;
  }

  function playChargeShotSfx(power) {
    const ctxAudio = ensureAudioContext();
    if (!ctxAudio) {
      return;
    }

    const now = ctxAudio.currentTime;
    const safePower = Math.max(0.35, Math.min(1, power));
    const duration = 0.16 + safePower * 0.16;

    const master = ctxAudio.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22 + safePower * 0.22, now + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    master.connect(ctxAudio.destination);

    const oscA = ctxAudio.createOscillator();
    oscA.type = 'sawtooth';
    oscA.frequency.setValueAtTime(220 + safePower * 180, now);
    oscA.frequency.exponentialRampToValueAtTime(520 + safePower * 520, now + duration * 0.9);
    oscA.connect(master);
    oscA.start(now);
    oscA.stop(now + duration);

    const oscB = ctxAudio.createOscillator();
    oscB.type = 'square';
    oscB.frequency.setValueAtTime(140 + safePower * 130, now);
    oscB.frequency.exponentialRampToValueAtTime(320 + safePower * 280, now + duration);
    oscB.detune.value = 9;
    oscB.connect(master);
    oscB.start(now);
    oscB.stop(now + duration * 0.9);
  }

  function playEnemyHitSfx(intensity = 1) {
    const ctxAudio = ensureAudioContext();
    if (!ctxAudio) {
      return;
    }

    const now = ctxAudio.currentTime;
    const safe = Math.max(0.6, Math.min(1.5, intensity));
    const duration = 0.09 + safe * 0.04;

    const gain = ctxAudio.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.1 * safe, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    gain.connect(ctxAudio.destination);

    const osc = ctxAudio.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480 + safe * 120, now);
    osc.frequency.exponentialRampToValueAtTime(240 + safe * 80, now + duration);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + duration);
  }

  function fireProjectile(power = 0, forcedDamage = null, forcedCooldown = null) {
    if (!game.mission) {
      return;
    }

    const shootDir = player.facing;
    const normalizedPower = Math.max(0, Math.min(1, power));
    const damage = forcedDamage ?? (normalizedPower > 0 ? 2.2 + normalizedPower * 5.5 : 1);
    const radius = 5 + normalizedPower * 11;
    const speed = 540 + normalizedPower * 280;

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
      color: normalizedPower > 0.35 ? '#b8ffff' : '#72e8ff',
      piercing: forcedDamage === 1 && profile.pierceUnlocked,
      pierceRemaining: forcedDamage === 1 && profile.pierceUnlocked ? 3 : 0,
      trail: []
    });

    player.lastShotAt = game.now;
    player.cooldownSeconds = forcedCooldown ?? (0.2 + normalizedPower * 0.3);
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
        damage: boss.projectileDamage,
        trail: []
      });
    }
    spawnLightFlash(sourceX, sourceY, 'rgba(255, 123, 169, 0.7)', 78, 0.2);
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

    const rapidHeld = isRapidShootHeld();
    const chargeHeld = isChargeShootHeld();

    if (rapidHeld) {
      if (player.isCharging) {
        player.isCharging = false;
        player.currentCharge = 0;
      }
      if (canShootNow()) {
        const rapidCooldown = profile.rapidUnlocked ? 0.11 : 0.22;
        fireProjectile(0, 1, rapidCooldown);
      }
      return;
    }

    if (!profile.chargeUnlocked) {
      if (player.isCharging) {
        player.isCharging = false;
        player.currentCharge = 0;
      }
      return;
    }

    if (chargeHeld && !player.isCharging && canShootNow()) {
      player.isCharging = true;
      player.chargeStartedAt = game.now;
      player.currentCharge = 0;
    }

    if (player.isCharging && chargeHeld) {
      player.currentCharge = Math.max(0, Math.min(1, (game.now - player.chargeStartedAt) / 1.15));
    }

    if (player.isCharging && !chargeHeld) {
      const chargePower = Math.max(0.35, player.currentCharge);
      fireProjectile(chargePower, null, 0.3);
      const muzzleX = player.x + player.w / 2 + player.facing * 14;
      const muzzleY = player.y + 24;
      spawnHitSpark(muzzleX, muzzleY, '#8df6ff', 1 + player.currentCharge * 0.8);
      spawnImpactRing(muzzleX, muzzleY, '#93eeff', 0.9 + chargePower * 1.4);
      spawnLightFlash(muzzleX, muzzleY, 'rgba(124, 242, 255, 0.85)', 55 + chargePower * 70, 0.18);
      playChargeShotSfx(chargePower);
      triggerCameraShake(3 + chargePower * 7, 0.15 + chargePower * 0.2, player.facing * (1.4 + chargePower * 2.1), -0.8);
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

    if (justPressed.has('1')) {
      tryLaunchMissionById(LEVEL_1_ID);
    } else if (justPressed.has('2')) {
      tryLaunchMissionById(LEVEL_2_ID);
    } else if (justPressed.has('3')) {
      tryLaunchMissionById(LEVEL_3_ID);
    } else if (justPressed.has('t') || justPressed.has('T')) {
      if (rectDistance(player, hub.dataTerminal) < 120) {
        resetProgressProfile();
        setFeedback('Profile reset complete. Missions and unlocks cleared.', 2.6);
      }
    }
  }

  function interactInHub() {
    const m1 = missionState(LEVEL_1_ID);
    const m2 = missionState(LEVEL_2_ID);
    const m3 = missionState(LEVEL_3_ID);

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
      } else if (!m3.accepted) {
        m3.accepted = true;
        saveProfile();
        setDialogue(hub.commander.name, 'Level 3 unlocked: Black Site Breach. Switch to first-person and clear hostiles.');
      } else if (m3.accepted && !m3.completed) {
        setDialogue(hub.commander.name, 'Black Site Breach active. Eliminate all hostiles and reach extraction.');
      } else if (m3.completed && !m3.turnedIn) {
        setDialogue(hub.commander.name, 'Report to Engineer Vale for Tier-3 cannon sync.');
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
      } else if (m3.completed && !m3.turnedIn) {
        m3.turnedIn = true;
        profile.credits += 240;
        const leveled = giveXp(170);
        saveProfile();

        if (leveled) {
          setDialogue(hub.engineer.name, `Tier-3 sync complete. +240 credits, +170 XP. Level ${profile.level} reached.`);
        } else {
          setDialogue(hub.engineer.name, 'Tier-3 sync complete. Piercing rapid shots are now online.');
        }
      } else if (m3.completed && m3.turnedIn) {
        setDialogue(hub.engineer.name, 'All systems tuned. Piercing cannon profile is stable.');
      } else if (m2.completed && m2.turnedIn && !m3.completed) {
        setDialogue(hub.engineer.name, 'Black Site package is queued. Complete Level 3 for Tier-3 unlock.');
      } else {
        setDialogue(hub.engineer.name, 'Bring me completed mission logs and I can issue upgrades.');
      }
      return;
    }

    if (rectDistance(player, hub.missionLift) < 110) {
      const next = nextMissionId();
      if (!next) {
        setDialogue(hub.missionLift.name, 'No pending mission. Hub standing by.');
      } else {
        tryLaunchMissionById(next, true);
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
      const missionText3 = missionState(LEVEL_3_ID).turnedIn
        ? 'L3 archived'
        : missionState(LEVEL_3_ID).completed
          ? 'L3 complete, pending turn-in'
          : missionState(LEVEL_3_ID).accepted
            ? 'L3 in progress'
            : 'L3 locked';

      const upgrades = profile.pierceUnlocked
        ? 'Rapid + Charge + Pierce online'
        : profile.chargeUnlocked
          ? 'Rapid + Charge online'
          : profile.rapidUnlocked
            ? 'Rapid online'
            : 'Base cannon';
      setDialogue(
        hub.dataTerminal.name,
        `Lvl ${profile.level} | Cr ${profile.credits} | ${missionText1} | ${missionText2} | ${missionText3} | ${upgrades} | Press T to reset save`
      );
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
    const m3 = missionState(LEVEL_3_ID);
    ms.completed = true;
    profile.clears += 1;
    let unlockBanner = '';

    if (missionId === LEVEL_1_ID && !profile.rapidUnlocked) {
      profile.rapidUnlocked = true;
      player.cannonMode = 'rapid_shot';
      setFeedback('Rapid Shot unlocked', 2.4);
    }

    if (missionId === LEVEL_1_ID && !profile.chargeUnlocked) {
      profile.chargeUnlocked = true;
      player.chargeUnlocked = true;
      unlockBanner = 'Charge Shot Unlocked! Hold K and release to fire.';
    }

    if (missionId === LEVEL_2_ID && !m3.accepted) {
      m3.accepted = true;
      unlockBanner = 'Level 3 Unlocked! Launch Black Site Breach from the lift.';
    }

    if (missionId === LEVEL_3_ID && !profile.pierceUnlocked) {
      profile.pierceUnlocked = true;
      unlockBanner = 'Tier-3 Unlock: Piercing Rapid Shot online.';
    }

    saveProfile();
    enterHub(`${missionName(missionId)} complete. Report to Engineer Vale.`);

    if (unlockBanner) {
      setFeedback(unlockBanner, 3.2);
    }
  }

  function updateMissionProjectiles(dt) {
    const mission = game.mission;
    if (!mission) {
      return;
    }

    for (const projectile of mission.projectiles) {
      projectile.trail ||= [];
      projectile.trail.push({ x: projectile.x, y: projectile.y });
      if (projectile.trail.length > 7) {
        projectile.trail.shift();
      }
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
    }

    for (const projectile of mission.enemyProjectiles) {
      projectile.trail ||= [];
      projectile.trail.push({ x: projectile.x, y: projectile.y });
      if (projectile.trail.length > 6) {
        projectile.trail.shift();
      }
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
          playEnemyHitSfx(1 + projectile.power * 0.7);
          if (projectile.piercing && projectile.pierceRemaining > 0) {
            projectile.pierceRemaining -= 1;
            projectile.damage *= 0.86;
            if (projectile.pierceRemaining <= 0) {
              projectile._dead = true;
            }
          } else {
            projectile._dead = true;
          }
          spawnHitSpark(projectile.x, projectile.y, '#75f3ff', 1 + projectile.power * 0.8);
          spawnImpactRing(projectile.x, projectile.y, '#9bfbff', 0.8 + projectile.power * 0.9);
          spawnLightFlash(projectile.x, projectile.y, 'rgba(117, 243, 255, 0.72)', 34 + projectile.power * 22, 0.13);
          if (enemy.hp <= 0) {
            enemy.alive = false;
            spawnHitSpark(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ffcc66', 1.1);
            spawnImpactRing(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ffbe6d', 1.15);
          }
        }
      }

      if (mission.boss && mission.boss.alive && !projectile._dead && circleHitsRect(projectile, mission.boss)) {
        mission.boss.hp -= projectile.damage;
        mission.boss.hitFlashUntil = game.now + 0.1;
        playEnemyHitSfx(1.15 + projectile.power * 0.85);
        projectile._dead = true;
        spawnHitSpark(projectile.x, projectile.y, '#9df0ff', 1 + projectile.power);
        spawnImpactRing(projectile.x, projectile.y, '#9df0ff', 1.2 + projectile.power * 1.1);
        spawnLightFlash(projectile.x, projectile.y, 'rgba(127, 230, 255, 0.75)', 48 + projectile.power * 40, 0.16);

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
        spawnImpactRing(projectile.x, projectile.y, '#ff97b2', 0.85);
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

    for (const ring of mission.impactRings || []) {
      ring.life -= dt;
      ring.radius += dt * 110;
    }
    mission.impactRings = (mission.impactRings || []).filter((ring) => ring.life > 0);

    for (const flash of mission.lightFlashes || []) {
      flash.life -= dt;
    }
    mission.lightFlashes = (mission.lightFlashes || []).filter((flash) => flash.life > 0);

    for (const flash of game.renderFx.flashEvents) {
      flash.life -= dt;
    }
    game.renderFx.flashEvents = game.renderFx.flashEvents.filter((flash) => flash.life > 0);
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

  function fpsTileAt(grid, x, y) {
    const mx = Math.floor(x);
    const my = Math.floor(y);
    if (my < 0 || my >= grid.length || mx < 0 || mx >= grid[0].length) {
      return '#';
    }
    return grid[my][mx];
  }

  function fpsIsWall(grid, x, y) {
    return fpsTileAt(grid, x, y) === '#';
  }

  function fpsCanOccupy(grid, x, y) {
    const r = 0.2;
    const points = [
      [x - r, y - r],
      [x + r, y - r],
      [x - r, y + r],
      [x + r, y + r]
    ];
    for (const [px, py] of points) {
      if (fpsIsWall(grid, px, py)) {
        return false;
      }
    }
    return true;
  }

  function fpsMoveWithCollision(grid, nextX, nextY) {
    if (fpsCanOccupy(grid, nextX, player.y)) {
      player.x = nextX;
    }
    if (fpsCanOccupy(grid, player.x, nextY)) {
      player.y = nextY;
    }
  }

  function castFpsRay(grid, ox, oy, angle, maxDepth = 20) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    let depth = 0;
    while (depth < maxDepth) {
      depth += 0.03;
      const rx = ox + cos * depth;
      const ry = oy + sin * depth;
      if (fpsIsWall(grid, rx, ry)) {
        return depth;
      }
    }
    return maxDepth;
  }

  function hasFpsLineOfSight(grid, fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.0001) {
      return true;
    }
    const angle = Math.atan2(dy, dx);
    const ray = castFpsRay(grid, fromX, fromY, angle, dist + 0.2);
    return ray >= dist - 0.1;
  }

  function spawnFpsBolt(fps) {
    const speed = 11.5;
    fps.bolts.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(fps.yaw) * speed,
      vy: Math.sin(fps.yaw) * speed,
      life: 0.8,
      radius: 0.17
    });
  }

  function updateFpsBolts(dt, fps) {
    for (const bolt of fps.bolts) {
      bolt.x += bolt.vx * dt;
      bolt.y += bolt.vy * dt;
      bolt.life -= dt;

      if (fpsIsWall(fps.grid, bolt.x, bolt.y)) {
        bolt.life = -1;
        continue;
      }

      for (const enemy of fps.enemies) {
        if (!enemy.alive || bolt.life <= 0) {
          continue;
        }
        const dist = Math.hypot(enemy.x - bolt.x, enemy.y - bolt.y);
        if (dist <= bolt.radius + 0.23) {
          enemy.hp -= 1;
          enemy.hitFlashUntil = game.now + 0.08;
          playEnemyHitSfx(0.95);
          spawnHitSpark(bolt.x, bolt.y, '#a7f7ff', 1.1);
          bolt.life = -1;
          if (enemy.hp <= 0) {
            enemy.alive = false;
            spawnHitSpark(enemy.x, enemy.y, '#ffd184', 1.3);
          }
        }
      }
    }
    fps.bolts = fps.bolts.filter((bolt) => bolt.life > 0);
  }

  function updateFpsMission(dt) {
    const mission = game.mission;
    if (!mission || mission.mode !== 'fps') {
      return;
    }

    const fps = mission.fps;
    const forward = (keys.has('w') || keys.has('W') ? 1 : 0) - (keys.has('s') || keys.has('S') ? 1 : 0);
    const strafe = (keys.has('d') || keys.has('D') ? 1 : 0) - (keys.has('a') || keys.has('A') ? 1 : 0);
    const speed = fps.moveSpeed * (keys.has('Shift') ? fps.sprintMultiplier : 1);

    if (forward || strafe) {
      const norm = 1 / Math.hypot(forward || 0, strafe || 0);
      const f = forward * norm;
      const s = strafe * norm;
      const vx = (Math.cos(fps.yaw) * f + Math.cos(fps.yaw + Math.PI / 2) * s) * speed * dt;
      const vy = (Math.sin(fps.yaw) * f + Math.sin(fps.yaw + Math.PI / 2) * s) * speed * dt;
      fpsMoveWithCollision(fps.grid, player.x + vx, player.y + vy);
    }

    if (keys.has('q') || keys.has('Q')) {
      fps.yaw -= fps.lookSpeed * 36;
    }
    if (keys.has('e') || keys.has('E')) {
      fps.yaw += fps.lookSpeed * 36;
    }
    if (keys.has('ArrowUp')) {
      fps.pitch = Math.min(FPS_MAX_PITCH, fps.pitch + fps.lookSpeed * 30);
    }
    if (keys.has('ArrowDown')) {
      fps.pitch = Math.max(-FPS_MAX_PITCH, fps.pitch - fps.lookSpeed * 30);
    }

    const wantsShoot = isRapidShootHeld() || isChargeShootHeld() || mouseLeftDown;
    if (wantsShoot && game.now - fps.lastFireAt >= fps.fireCooldown) {
      fps.lastFireAt = game.now;
      spawnFpsBolt(fps);
    }

    updateFpsBolts(dt, fps);

    for (const enemy of fps.enemies) {
      if (!enemy.alive) {
        continue;
      }
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.7) {
        damagePlayer(18, enemy.x);
      } else if (
        dist < fps.enemyAggroRange &&
        game.now - enemy.lastShotAt >= fps.enemyShootInterval &&
        hasFpsLineOfSight(fps.grid, enemy.x, enemy.y, player.x, player.y)
      ) {
        enemy.lastShotAt = game.now;
        damagePlayer(fps.enemyDamage, enemy.x);
      }
    }

    const allDefeated = fps.enemies.every((enemy) => !enemy.alive);
    const exitDist = Math.hypot(player.x - fps.exit.x, player.y - fps.exit.y);
    if (allDefeated && exitDist < 0.9) {
      completeMissionRun();
    }
  }

  function updateHud() {
    const m1 = missionState(LEVEL_1_ID);
    const m2 = missionState(LEVEL_2_ID);
    const m3 = missionState(LEVEL_3_ID);

    if (game.scene === 'mission') {
      healthEl.textContent = String(Math.max(0, Math.ceil(player.hp)));
      if (shellEl) {
        const state = player.hp <= 25 ? 'critical' : player.hp <= 55 ? 'warning' : 'normal';
        shellEl.dataset.healthState = state;
      }

      if (profile.pierceUnlocked) {
        cannonEl.textContent = 'Rapid + Charge + Pierce';
      } else if (profile.chargeUnlocked) {
        cannonEl.textContent = 'Rapid + Charge';
      } else if (profile.rapidUnlocked) {
        cannonEl.textContent = 'Rapid Shot';
      } else {
        cannonEl.textContent = 'Single Shot';
      }

      let readiness;
      if (game.mission?.mode === 'fps') {
        const elapsed = game.now - (game.mission?.fps?.lastFireAt || 0);
        const cd = game.mission?.fps?.fireCooldown || 0.2;
        readiness = Math.max(0, Math.min(1, elapsed / cd));
      } else if (player.isCharging) {
        readiness = player.currentCharge;
      } else {
        const elapsed = game.now - player.lastShotAt;
        readiness = Math.max(0, Math.min(1, elapsed / player.cooldownSeconds));
      }
      cooldownFillEl.style.transform = `scaleX(${readiness})`;

      if (game.phase === 'mission_failed') {
        statusEl.textContent = 'Mission failed. Press R to retry or H for Hub';
        statusEl.dataset.state = 'fail';
      } else if (game.mission?.mode === 'fps') {
        const alive = game.mission.fps.enemies.filter((enemy) => enemy.alive).length;
        statusEl.textContent =
          alive > 0
            ? `${game.mission.name} | Eliminate hostiles (${alive} left)`
            : `${game.mission.name} | Reach extraction`;
        statusEl.dataset.state = 'active';
      } else if (game.mission?.bossActive && game.mission?.boss?.alive) {
        statusEl.textContent = `${game.mission.name} | Mini-Boss HP: ${Math.max(0, Math.ceil(game.mission.boss.hp))}`;
        statusEl.dataset.state = 'boss';
      } else if (player.isCharging) {
        statusEl.textContent = `${game.mission?.name || 'Mission'} | Charging ${Math.round(player.currentCharge * 100)}%`;
        statusEl.dataset.state = 'charge';
      } else {
        statusEl.textContent = `${game.mission?.name || 'Mission'} active: reach and clear mini-boss gate`;
        statusEl.dataset.state = 'active';
      }
      return;
    }

    healthEl.textContent = '--';
    cannonEl.textContent = profile.pierceUnlocked
      ? 'Rapid + Charge + Pierce'
      : profile.chargeUnlocked
        ? 'Rapid + Charge'
        : profile.rapidUnlocked
          ? 'Rapid Shot'
          : 'Single Shot';
    cooldownFillEl.style.transform = 'scaleX(1)';
    statusEl.dataset.state = 'hub';

    if (game.phase === 'intro') {
      statusEl.textContent = 'Press Enter to activate hub';
      statusEl.dataset.state = 'hub';
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
    } else if (!m3.accepted) {
      statusEl.textContent = 'Talk to Commander Rho to unlock Level 3';
    } else if (!m3.completed) {
      statusEl.textContent = 'Level 3 accepted. Use lift to deploy';
    } else if (!m3.turnedIn) {
      statusEl.textContent = 'Turn in Level 3 report with Engineer Vale';
    } else {
      statusEl.textContent = `Campaign complete. Lvl ${profile.level} | Credits ${profile.credits}`;
      statusEl.dataset.state = 'complete';
    }
    if (shellEl) {
      shellEl.dataset.healthState = 'normal';
    }
  }

  function update(dt) {
    if (game.phase === 'intro') {
      if (justPressed.has('Enter')) {
        enterHub('Hub online. Press E near NPCs to interact.');
      }
      updateCameraShake(dt);
      updateHud();
      return;
    }

    if (game.scene === 'hub') {
      updateHubInput();
      updateCameraShake(dt);
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
      updateCameraShake(dt);
      updateHud();
      return;
    }

    if (game.mission?.mode === 'fps') {
      updateFpsMission(dt);
    } else {
      updateMissionInput(dt);
      updateMissionPlayer(dt);
      updateMissionEnemies(dt);
      updateMissionBoss(dt);
      updateMissionProjectiles(dt);
      updateMissionSparks(dt);
      updateMissionCamera(dt);
    }
    updateCameraShake(dt);
    updateHud();
  }

  function drawTextureOverlay(img, alpha = 0.16, scale = 1, scrollX = 0, scrollY = 0) {
    if (!img || !VISUAL_FLAGS.enableDecalOverlay || !visualAssetsReady) {
      return;
    }
    const iw = Math.max(8, Math.floor(img.width * scale));
    const ih = Math.max(8, Math.floor(img.height * scale));
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let y = -ih; y < HEIGHT + ih; y += ih) {
      for (let x = -iw; x < WIDTH + iw; x += iw) {
        ctx.drawImage(img, x + (scrollX % iw), y + (scrollY % ih), iw, ih);
      }
    }
    ctx.restore();
  }

  function drawMissionBackground() {
    const x = game.cameraX;
    const theme = activeTheme();
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, theme.skyTop);
    sky.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = theme.haze;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawTextureOverlay(visualAssets.noise, 0.07, 3.6, -x * 0.18, game.now * 10);

    ctx.fillStyle = 'rgba(14, 40, 58, 0.9)';
    for (let i = 0; i < 16; i += 1) {
      const px = (i * 360 - (x * 0.22) % 360) - 50;
      ctx.fillRect(px, 214, 82, 340);
      ctx.fillStyle = 'rgba(42, 92, 111, 0.35)';
      ctx.fillRect(px + 10, 230, 14, 280);
      ctx.fillStyle = 'rgba(14, 40, 58, 0.9)';
    }

    ctx.fillStyle = 'rgba(32, 90, 114, 0.76)';
    for (let i = 0; i < 22; i += 1) {
      const px = (i * 248 - (x * 0.52) % 248) - 70;
      ctx.fillRect(px, 290, 52, 250);
      ctx.fillRect(px + 8, 318, 36, 8);
    }

    ctx.strokeStyle = 'rgba(111, 209, 255, 0.21)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i += 1) {
      const py = 160 + i * 40;
      ctx.beginPath();
      ctx.moveTo(-30 - (x * 0.12) % 120, py);
      ctx.lineTo(WIDTH + 40, py + 34);
      ctx.stroke();
    }
  }

  function drawHubBackground() {
    const theme = activeTheme();
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, theme.skyTop);
    bg.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawTextureOverlay(visualAssets.noise, 0.09, 3.8, 0, game.now * 6);
    ctx.fillStyle = theme.haze;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = 'rgba(125, 185, 207, 0.12)';
    for (let x = 0; x <= WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    for (const wall of hub.walls) {
      const wallGrad = ctx.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.h);
      wallGrad.addColorStop(0, theme.panelTop);
      wallGrad.addColorStop(1, theme.panelBottom);
      ctx.fillStyle = wallGrad;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = 'rgba(184, 237, 255, 0.26)';
      ctx.fillRect(wall.x, wall.y, wall.w, 4);
      if (visualAssets.panelHighlight) {
        ctx.globalAlpha = 0.14;
        ctx.drawImage(visualAssets.panelHighlight, wall.x, wall.y, wall.w, wall.h);
        ctx.globalAlpha = 1;
      }
    }

    drawHubMarker(hub.commander, '#67d7ff', 'Commander Rho');
    drawHubMarker(hub.engineer, '#ffc175', 'Engineer Vale');
    drawHubMarker(hub.dataTerminal, '#75ffd8', 'Log Terminal');

    const liftGrad = ctx.createLinearGradient(hub.missionLift.x, hub.missionLift.y, hub.missionLift.x, hub.missionLift.y + hub.missionLift.h);
    liftGrad.addColorStop(0, '#7eefff');
    liftGrad.addColorStop(1, '#1b6b8a');
    ctx.fillStyle = liftGrad;
    ctx.fillRect(hub.missionLift.x, hub.missionLift.y, hub.missionLift.w, hub.missionLift.h);
    ctx.fillStyle = '#e7fbff';
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
    const m3 = missionState(LEVEL_3_ID);
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
    } else if (!m3.accepted) {
      objective = 'Objective: Talk to Commander Rho to unlock Level 3';
    } else if (!m3.completed) {
      objective = 'Objective: Use Mission Lift (E) to clear Level 3 (FPS)';
    } else if (!m3.turnedIn) {
      objective = 'Objective: Turn in Level 3 mission with Engineer Vale';
    } else {
      objective = `Objective: Campaign complete | Level ${profile.level} | Credits ${profile.credits}`;
    }

    ctx.fillStyle = 'rgba(7, 16, 28, 0.7)';
    ctx.fillRect(24, 20, WIDTH - 48, 36);
    ctx.fillStyle = '#bfe2ff';
    ctx.font = 'bold 18px Segoe UI';
    ctx.fillText(objective, 36, 44);
  }

  function drawFpsMissionWorld() {
    const mission = game.mission;
    if (!mission || mission.mode !== 'fps') {
      return;
    }

    const fps = mission.fps;
    const grid = fps.grid;
    const fov = Math.PI / 3;
    const maxDepth = 18;
    const w = WIDTH;
    const h = HEIGHT;
    const pitchOffset = fps.pitch * (h * 0.42);
    const horizon = h * 0.5 + pitchOffset;

    const sky = ctx.createLinearGradient(0, 0, 0, Math.max(0, horizon));
    sky.addColorStop(0, '#42608f');
    sky.addColorStop(1, '#1b2e4c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, Math.max(0, horizon));

    const floor = ctx.createLinearGradient(0, Math.min(h, horizon), 0, h);
    floor.addColorStop(0, '#1a1d28');
    floor.addColorStop(1, '#0b0e14');
    ctx.fillStyle = floor;
    ctx.fillRect(0, Math.min(h, horizon), w, h - Math.min(h, horizon));

    for (let x = 0; x < w; x += 1) {
      const camX = (x / w - 0.5) * fov;
      const angle = fps.yaw + camX;
      const depth = castFpsRay(grid, player.x, player.y, angle, maxDepth);
      const corrected = depth * Math.cos(camX);
      const wallH = Math.min(h, (h / Math.max(0.001, corrected)) * 0.85);
      const y1 = (h - wallH) / 2 + pitchOffset;
      const shade = Math.max(0.16, 1 - corrected / 11);
      const c = Math.floor(125 * shade);
      ctx.fillStyle = `rgb(${c}, ${Math.floor(c * 1.18)}, ${Math.floor(c * 1.52)})`;
      ctx.fillRect(x, y1, 1, wallH);
    }

    const aliveEnemies = fps.enemies.filter((enemy) => enemy.alive);
    for (const enemy of aliveEnemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      const rel = Math.atan2(dy, dx) - fps.yaw;
      const wrapped = Math.atan2(Math.sin(rel), Math.cos(rel));
      if (Math.abs(wrapped) > fov / 2) {
        continue;
      }
      if (!hasFpsLineOfSight(grid, player.x, player.y, enemy.x, enemy.y)) {
        continue;
      }
      const screenX = (wrapped / fov + 0.5) * w;
      const size = Math.min(h * 0.55, h / Math.max(0.6, dist));
      const y = h / 2 - size * 0.55 + pitchOffset;
      ctx.fillStyle = enemy.hitFlashUntil > game.now ? '#ffe0ae' : '#ffb36a';
      ctx.fillRect(screenX - size * 0.22, y, size * 0.44, size * 0.68);
      ctx.fillStyle = '#401f12';
      ctx.fillRect(screenX - size * 0.11, y + size * 0.2, size * 0.22, size * 0.26);
    }

    for (const bolt of fps.bolts) {
      const dx = bolt.x - player.x;
      const dy = bolt.y - player.y;
      const dist = Math.hypot(dx, dy);
      const rel = Math.atan2(dy, dx) - fps.yaw;
      const wrapped = Math.atan2(Math.sin(rel), Math.cos(rel));
      if (Math.abs(wrapped) > fov / 2 || dist < 0.15) {
        continue;
      }
      if (!hasFpsLineOfSight(grid, player.x, player.y, bolt.x, bolt.y)) {
        continue;
      }
      const sx = (wrapped / fov + 0.5) * w;
      const s = Math.min(h * 0.2, h / Math.max(0.6, dist * 2.3));
      const y = h / 2;
      ctx.fillStyle = '#8ef5ff';
      ctx.beginPath();
      ctx.arc(sx, y, Math.max(2.5, s * 0.18), 0, Math.PI * 2);
      ctx.fill();
    }

    const canExit = aliveEnemies.length === 0;
    const exdx = fps.exit.x - player.x;
    const exdy = fps.exit.y - player.y;
    const exDist = Math.hypot(exdx, exdy);
    const exRel = Math.atan2(exdy, exdx) - fps.yaw;
    const exWrapped = Math.atan2(Math.sin(exRel), Math.cos(exRel));
    if (Math.abs(exWrapped) < fov / 2 && hasFpsLineOfSight(grid, player.x, player.y, fps.exit.x, fps.exit.y)) {
      const sx = (exWrapped / fov + 0.5) * w;
      const s = Math.min(h * 0.3, h / Math.max(0.8, exDist));
      ctx.fillStyle = canExit ? 'rgba(115, 255, 196, 0.9)' : 'rgba(255, 146, 107, 0.85)';
      ctx.fillRect(sx - s * 0.13, h / 2 - s * 0.5 + pitchOffset, s * 0.26, s);
    }
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
      const blockGrad = ctx.createLinearGradient(block.x, block.y, block.x, block.y + block.h);
      blockGrad.addColorStop(0, '#274b63');
      blockGrad.addColorStop(1, '#162b3f');
      ctx.fillStyle = blockGrad;
      ctx.fillRect(block.x, block.y, block.w, block.h);
      ctx.fillStyle = '#6dbbcb';
      ctx.fillRect(block.x, block.y, block.w, 8);
      ctx.fillStyle = 'rgba(32, 67, 87, 0.55)';
      for (let tx = block.x + 12; tx < block.x + block.w - 8; tx += 24) {
        ctx.fillRect(tx, block.y + 11, 14, 2);
      }
      if (VISUAL_FLAGS.enableDecalOverlay) {
        if (visualAssets.grime1) {
          ctx.globalAlpha = 0.12;
          ctx.drawImage(visualAssets.grime1, block.x, block.y, block.w, block.h);
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = 'rgba(52, 83, 97, 0.23)';
          ctx.fillRect(block.x + 4, block.y + 16, Math.max(10, block.w * 0.35), 8);
        }
      }
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
    drawMissionLights();

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
      ctx.fillRect(112, 468, 736, 44);
      ctx.fillStyle = '#d4efff';
      ctx.font = 'bold 20px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(`Press E to interact: ${nearest.name} | Launch: 1=L1,2=L2,3=L3 | T at Terminal=Reset`, WIDTH / 2, 496);
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
    ctx.fillStyle = flash ? '#ffd1a0' : '#e89a57';
    ctx.fillRect(2, 6, enemy.w - 4, 18);
    ctx.fillStyle = '#5e351f';
    ctx.fillRect(10, 24, enemy.w - 20, enemy.h - 24);
    ctx.strokeStyle = flash ? 'rgba(255, 221, 176, 0.9)' : 'rgba(255, 183, 111, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 6, enemy.w - 4, enemy.h - 8);
    ctx.restore();
  }

  function drawBoss(boss, flash) {
    ctx.save();
    ctx.translate(boss.x, boss.y);
    const body = ctx.createLinearGradient(0, 10, 0, boss.h);
    body.addColorStop(0, flash ? '#ffe8f0' : '#ff7a9f');
    body.addColorStop(1, flash ? '#f5b5c7' : '#b84868');
    ctx.fillStyle = body;
    ctx.fillRect(10, 16, boss.w - 20, boss.h - 18);
    ctx.fillStyle = '#2f1330';
    ctx.fillRect(24, 28, boss.w - 48, 30);
    ctx.fillStyle = '#ffc4d3';
    ctx.fillRect(0, 58, 36, 18);
    ctx.fillRect(boss.w - 36, 58, 36, 18);
    ctx.fillStyle = '#fff0a8';
    ctx.fillRect(38, 82, boss.w - 76, 16);
    ctx.strokeStyle = flash ? 'rgba(255, 232, 244, 0.95)' : 'rgba(255, 135, 173, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 16, boss.w - 20, boss.h - 18);
    ctx.restore();
  }

  function drawProjectiles() {
    if (!game.mission) {
      return;
    }

    for (const p of game.mission.projectiles) {
      const core = p.color || '#72e8ff';
      if (VISUAL_FLAGS.enableBloomLikeGlow) {
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = '#8ff4ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (Array.isArray(p.trail)) {
        for (let i = 0; i < p.trail.length; i += 1) {
          const t = p.trail[i];
          const ratio = (i + 1) / p.trail.length;
          ctx.globalAlpha = ratio * 0.25;
          ctx.fillStyle = core;
          ctx.beginPath();
          ctx.arc(t.x, t.y, Math.max(1, p.r * ratio * 0.8), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e9ffff';
      ctx.beginPath();
      ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.25, Math.max(1.5, p.r * 0.32), 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of game.mission.enemyProjectiles) {
      if (VISUAL_FLAGS.enableBloomLikeGlow) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#ff95bc';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (Array.isArray(p.trail)) {
        for (let i = 0; i < p.trail.length; i += 1) {
          const t = p.trail[i];
          const ratio = (i + 1) / p.trail.length;
          ctx.globalAlpha = ratio * 0.24;
          ctx.fillStyle = '#ff91af';
          ctx.beginPath();
          ctx.arc(t.x, t.y, Math.max(1, p.r * ratio * 0.7), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#ff7899';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd3de';
      ctx.beginPath();
      ctx.arc(p.x - p.r * 0.25, p.y - p.r * 0.25, Math.max(1.2, p.r * 0.26), 0, Math.PI * 2);
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

    for (const ring of game.mission.impactRings || []) {
      const alpha = ring.life / ring.maxLife;
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = 2 + alpha * 2.2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawMissionLights() {
    if (!game.mission || !Array.isArray(game.mission.lightFlashes)) {
      return;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const flash of game.mission.lightFlashes) {
      const alpha = flash.life / flash.maxLife;
      const grad = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, flash.radius);
      grad.addColorStop(0, flash.color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
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
      ctx.fillStyle = `rgba(6, 13, 23, ${Math.min(0.82, alpha)})`;
      ctx.fillRect(0, 0, WIDTH, 78);
      ctx.strokeStyle = `rgba(124, 216, 255, ${0.55 * alpha})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 6, WIDTH - 12, 66);
      ctx.fillStyle = '#d9f7ff';
      ctx.font = 'bold 24px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(game.feedbackText, WIDTH / 2, 49);
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
      centeredMessage('Robot Cannon Platformer', 'Milestone 3: Press Enter to open the Hub');
    }

    if (game.phase === 'mission_failed') {
      centeredMessage('Mission Failed', 'Press R to retry or H to return to Hub');
    }

    if (game.scene === 'mission' && game.mission?.mode === 'fps') {
      ctx.fillStyle = 'rgba(220, 240, 255, 0.85)';
      ctx.fillRect(WIDTH / 2 - 12, HEIGHT / 2 - 1, 24, 2);
      ctx.fillRect(WIDTH / 2 - 1, HEIGHT / 2 - 12, 2, 24);
    }

    if (game.scene === 'mission' && game.mission?.mode !== 'fps' && profile.chargeUnlocked) {
      const chargePct = player.isCharging ? player.currentCharge : 0;
      const chargeX = 24;
      const chargeY = HEIGHT - 40;
      const chargeW = 280;
      const chargeH = 16;
      ctx.fillStyle = 'rgba(10, 18, 30, 0.76)';
      ctx.fillRect(chargeX, chargeY, chargeW, chargeH);
      const chargeGrad = ctx.createLinearGradient(chargeX, chargeY, chargeX + chargeW, chargeY);
      chargeGrad.addColorStop(0, '#3fb4ff');
      chargeGrad.addColorStop(0.5, '#6be8ff');
      chargeGrad.addColorStop(1, '#b2fff4');
      ctx.fillStyle = chargeGrad;
      ctx.fillRect(chargeX, chargeY, chargeW * chargePct, chargeH);
      ctx.strokeStyle = '#98dfff';
      ctx.strokeRect(chargeX, chargeY, chargeW, chargeH);
      ctx.strokeStyle = 'rgba(196, 236, 255, 0.28)';
      for (let sx = chargeX + 20; sx < chargeX + chargeW; sx += 20) {
        ctx.beginPath();
        ctx.moveTo(sx, chargeY + 1);
        ctx.lineTo(sx, chargeY + chargeH - 1);
        ctx.stroke();
      }
      ctx.fillStyle = '#bdeeff';
      ctx.font = '14px Segoe UI';
      ctx.fillText('Charge Blast (hold fire, release to blast)', chargeX, HEIGHT - 46);
    }
  }

  function drawMidgroundPass() {
    if (game.scene === 'mission' && game.mission?.mode !== 'fps') {
      const x = game.cameraX;
      ctx.save();
      ctx.globalAlpha = 0.26;
      ctx.fillStyle = '#183145';
      for (let i = 0; i < 18; i += 1) {
        const px = (i * 220 - (x * 0.66) % 220) - 60;
        ctx.fillRect(px, 360, 120, 110);
      }
      ctx.restore();
    }
  }

  function drawForegroundPass() {
    if (game.scene === 'hub' || game.phase === 'intro') {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 20, 31, 0.16)';
      ctx.fillRect(0, HEIGHT - 94, WIDTH, 94);
      ctx.restore();
      return;
    }
    if (game.mission?.mode === 'fps') {
      return;
    }
    const x = game.cameraX;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#0d2031';
    for (let i = 0; i < 14; i += 1) {
      const px = (i * 190 - (x * 1.1) % 190) - 40;
      ctx.fillRect(px, 418, 34, 130);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(117, 196, 215, 0.18)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 422);
    ctx.lineTo(WIDTH, 422);
    ctx.stroke();
    ctx.restore();
  }

  function drawPostFxPass() {
    const theme = activeTheme();
    game.renderFx.vignetteIntensity = theme.vignette;
    if (VISUAL_FLAGS.enableVignettePulse) {
      if (game.scene === 'mission' && player.hp > 0 && player.hp <= 35) {
        game.renderFx.lowHpPulse += 0.1;
      } else {
        game.renderFx.lowHpPulse *= 0.9;
      }
    } else {
      game.renderFx.lowHpPulse = 0;
    }

    const vignette = ctx.createRadialGradient(
      WIDTH / 2,
      HEIGHT / 2,
      HEIGHT * 0.18,
      WIDTH / 2,
      HEIGHT / 2,
      HEIGHT * 0.82
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, `rgba(0, 0, 0, ${game.renderFx.vignetteIntensity})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (visualAssets.scanline) {
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.drawImage(visualAssets.scanline, 0, 0, WIDTH, HEIGHT);
      ctx.restore();
    }

    if (game.renderFx.lowHpPulse > 0.01) {
      const pulse = 0.08 + Math.sin(game.now * 8) * 0.04;
      ctx.fillStyle = `rgba(255, 64, 112, ${Math.max(0.04, pulse)})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  function drawBackdropPass() {
    if (game.scene === 'hub' || game.phase === 'intro') {
      drawHubBackground();
      return;
    }
    if (game.mission?.mode === 'fps') {
      drawFpsMissionWorld();
      return;
    }
    drawMissionBackground();
  }

  function drawGameplayPass() {
    if (game.scene === 'hub' || game.phase === 'intro') {
      drawHubWorld();
      return;
    }
    if (game.mission?.mode === 'fps') {
      return;
    }
    drawMissionWorld();
  }

  function render() {
    ctx.save();
    if (game.scene === 'mission' && game.shakeTime > 0) {
      ctx.translate(game.shakeX + game.renderFx.cameraKickX, game.shakeY + game.renderFx.cameraKickY);
    }
    drawBackdropPass();
    drawMidgroundPass();
    drawGameplayPass();
    drawForegroundPass();
    drawPostFxPass();
    drawOverlay();
    ctx.restore();
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
    ensureAudioContext();
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

  window.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
      mouseLeftDown = true;
      if (game.scene === 'mission' && game.mission?.mode === 'fps' && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    }
  });

  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) {
      mouseLeftDown = false;
    }
  });

  window.addEventListener('mousemove', (event) => {
    if (game.scene === 'mission' && game.mission?.mode === 'fps' && document.pointerLockElement === canvas) {
      game.mission.fps.yaw += event.movementX * game.mission.fps.lookSpeed;
      game.mission.fps.pitch -= event.movementY * game.mission.fps.lookSpeed;
      game.mission.fps.pitch = Math.max(-FPS_MAX_PITCH, Math.min(FPS_MAX_PITCH, game.mission.fps.pitch));
    }
  });

  canvas.addEventListener('click', () => {
    if (game.scene === 'mission' && game.mission?.mode === 'fps' && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    }
  });

  player.cannonMode = profile.rapidUnlocked ? 'rapid_shot' : 'single_shot';
  player.chargeUnlocked = profile.chargeUnlocked;
  loadVisualAssets();
  saveProfile();
  updateHud();
  requestAnimationFrame(frame);
})();
