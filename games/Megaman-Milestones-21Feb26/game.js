(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const healthEl = document.getElementById('health-value');
  const cannonEl = document.getElementById('cannon-mode');
  const cooldownFillEl = document.getElementById('cooldown-fill');
  const statusEl = document.getElementById('status-text');
  const statusIconEl = document.getElementById('status-icon');

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
      worldWidth: 8600,
      spawn: { x: 90, y: 380 },
      finishGate: { x: 7280, y: 150, w: 50, h: 250 },
      blocks: [
        { x: 0, y: 470, w: 700, h: 70 },
        { x: 820, y: 470, w: 640, h: 70 },
        { x: 1610, y: 470, w: 760, h: 70 },
        { x: 2520, y: 470, w: 600, h: 70 },
        { x: 3260, y: 470, w: 760, h: 70 },
        { x: 4190, y: 470, w: 680, h: 70 },
        { x: 5080, y: 470, w: 690, h: 70 },
        { x: 5940, y: 470, w: 520, h: 70 },

        { x: 1120, y: 430, w: 120, h: 20 },
        { x: 1250, y: 390, w: 120, h: 20 },
        { x: 1380, y: 350, w: 120, h: 20 },

        { x: 2750, y: 410, w: 130, h: 20 },
        { x: 2910, y: 370, w: 130, h: 20 },
        { x: 3070, y: 330, w: 130, h: 20 },

        { x: 4480, y: 410, w: 140, h: 20 },
        { x: 4650, y: 365, w: 140, h: 20 },
        { x: 4820, y: 320, w: 140, h: 20 },
        { x: 4990, y: 275, w: 140, h: 20 },

        { x: 6500, y: 420, w: 160, h: 20 },
        { x: 6700, y: 370, w: 160, h: 20 },
        { x: 6900, y: 320, w: 160, h: 20 },
        { x: 6680, y: 265, w: 190, h: 20 },
        { x: 6940, y: 220, w: 190, h: 20 },
        { x: 7210, y: 180, w: 220, h: 20 },

        { x: 7060, y: 250, w: 70, h: 220 },
        { x: 7320, y: 470, w: 1260, h: 70 }
      ],
      crates: [
        { x: 700, y: 434, w: 36, h: 36, hp: 2 },
        { x: 736, y: 434, w: 36, h: 36, hp: 2 },
        { x: 2360, y: 434, w: 36, h: 36, hp: 2 },
        { x: 3120, y: 434, w: 36, h: 36, hp: 2 },
        { x: 4020, y: 434, w: 36, h: 36, hp: 2 },
        { x: 5770, y: 434, w: 36, h: 36, hp: 2 },
        { x: 6460, y: 434, w: 36, h: 36, hp: 2 },
        { x: 7130, y: 184, w: 36, h: 36, hp: 3 },
        { x: 7168, y: 184, w: 36, h: 36, hp: 3 },
        { x: 7430, y: 434, w: 36, h: 36, hp: 3 }
      ],
      enemySpawns: [
        { x: 980, y: 418, minX: 860, maxX: 1380, hp: 3, speed: 94 },
        { x: 1700, y: 418, minX: 1640, maxX: 2330, hp: 3, speed: 95 },
        { x: 1410, y: 298, minX: 1385, maxX: 1490, hp: 3, speed: 104 },
        { x: 2985, y: 278, minX: 2925, maxX: 3160, hp: 4, speed: 106 },
        { x: 3560, y: 418, minX: 3300, maxX: 3980, hp: 4, speed: 102 },
        { x: 5000, y: 365, minX: 4860, maxX: 5150, hp: 4, speed: 109 },
        { x: 5420, y: 418, minX: 5140, maxX: 5730, hp: 4, speed: 110 },
        { x: 6750, y: 318, minX: 6690, maxX: 6880, hp: 5, speed: 114 },
        { x: 7050, y: 168, minX: 6960, maxX: 7390, hp: 5, speed: 116 },
        { x: 7840, y: 418, minX: 7540, maxX: 8480, hp: 5, speed: 118 }
      ],
      boss: {
        x: 7860,
        y: 330,
        w: 118,
        h: 130,
        hp: 60,
        speed: 108,
        moveMinX: 7320,
        moveMaxX: 8500,
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
      worldWidth: 9400,
      spawn: { x: 110, y: 340 },
      finishGate: { x: 7640, y: 130, w: 52, h: 270 },
      blocks: [
        { x: 0, y: 470, w: 620, h: 70 },
        { x: 720, y: 470, w: 640, h: 70 },
        { x: 1490, y: 470, w: 560, h: 70 },
        { x: 2360, y: 398, w: 220, h: 22 },
        { x: 2650, y: 346, w: 210, h: 22 },
        { x: 2920, y: 298, w: 210, h: 20 },
        { x: 3190, y: 252, w: 210, h: 20 },
        { x: 3460, y: 204, w: 220, h: 20 },
        { x: 3720, y: 160, w: 260, h: 20 },
        { x: 4020, y: 470, w: 660, h: 70 },
        { x: 5020, y: 430, w: 210, h: 20 },
        { x: 5310, y: 382, w: 210, h: 20 },
        { x: 5580, y: 336, w: 210, h: 20 },
        { x: 5840, y: 292, w: 220, h: 20 },
        { x: 6100, y: 248, w: 220, h: 20 },
        { x: 6360, y: 210, w: 220, h: 20 },
        { x: 6620, y: 182, w: 220, h: 20 },
        { x: 6940, y: 156, w: 220, h: 20 },
        { x: 7420, y: 145, w: 220, h: 20 },
        { x: 7900, y: 470, w: 1480, h: 70 },
        { x: 5460, y: 232, w: 140, h: 18 },
        { x: 7600, y: 250, w: 70, h: 220 }
      ],
      crates: [
        { x: 680, y: 434, w: 36, h: 36, hp: 2 },
        { x: 1360, y: 434, w: 36, h: 36, hp: 2 },
        { x: 2400, y: 362, w: 36, h: 36, hp: 2 },
        { x: 2940, y: 262, w: 36, h: 36, hp: 2 },
        { x: 3470, y: 168, w: 36, h: 36, hp: 3 },
        { x: 4640, y: 434, w: 36, h: 36, hp: 2 },
        { x: 5340, y: 346, w: 36, h: 36, hp: 2 },
        { x: 6110, y: 212, w: 36, h: 36, hp: 2 },
        { x: 6900, y: 120, w: 36, h: 36, hp: 3 },
        { x: 7970, y: 434, w: 36, h: 36, hp: 3 }
      ],
      pickups: [
        { x: 5508, y: 194, w: 24, h: 24, credits: 120, xp: 80, label: 'Hidden Air Cache' }
      ],
      hazards: [
        {
          id: 'l2_laser_combo',
          type: 'laser_gate',
          x1: 4090,
          x2: 4680,
          y: 438,
          thickness: 12,
          cycleTime: 3.2,
          warningDuration: 0.7,
          activeDuration: 0.9,
          damage: 14,
          tickInterval: 0.28,
          activeRegion: { x: 4050, y: 340, w: 720, h: 210 }
        },
        {
          id: 'l2_crusher_lane',
          type: 'conveyor_crusher',
          conveyor: { x: 4980, y: 430, w: 560, h: 40, push: 210 },
          crusher: { x: 5420, topY: 246, bottomY: 370, w: 92, h: 62 },
          cycleTime: 3.7,
          warningDuration: 0.72,
          descendDuration: 0.7,
          holdDuration: 0.5,
          retractDuration: 0.86,
          damage: 22,
          tickInterval: 0.22,
          activeRegion: { x: 5040, y: 230, w: 420, h: 260 }
        },
        {
          id: 'l2_debris_zone',
          type: 'debris_zone',
          triggerX: 6480,
          zoneX: 6480,
          zoneW: 860,
          yTop: 20,
          yBottom: 520,
          spawnInterval: 1.15,
          warningDuration: 0.65,
          damage: 16,
          fallSpeed: 540
        }
      ],
      enemySpawns: [
        { x: 890, y: 418, minX: 760, maxX: 1320, hp: 4, speed: 115 },
        { x: 1710, y: 418, minX: 1520, maxX: 2030, hp: 4, speed: 112 },
        { x: 2520, y: 344, minX: 2400, maxX: 2860, hp: 5, speed: 120 },
        { x: 3300, y: 198, minX: 3210, maxX: 3670, hp: 5, speed: 124 },
        { x: 4200, y: 418, minX: 4060, maxX: 4740, hp: 5, speed: 122 },
        { x: 5750, y: 312, minX: 5600, maxX: 6300, hp: 5, speed: 126 },
        { x: 6670, y: 158, minX: 6500, maxX: 7160, hp: 6, speed: 130 },
        { x: 8120, y: 418, minX: 7960, maxX: 9060, hp: 6, speed: 132 }
      ],
      boss: {
        x: 8500,
        y: 300,
        w: 128,
        h: 142,
        hp: 108,
        speed: 130,
        moveMinX: 7900,
        moveMaxX: 9260,
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
          '#...#.....E#.....#...#.#',
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
          { x: 3.5, y: 1.5, hp: 3 },
          { x: 2.5, y: 3.5, hp: 3 },
          { x: 3.5, y: 5.5, hp: 4 },
          { x: 7.5, y: 5.5, hp: 4 },
          { x: 3.5, y: 7.5, hp: 4 },
          { x: 9.5, y: 7.5, hp: 4 },
          { x: 3.5, y: 9.5, hp: 5 },
          { x: 8.5, y: 11.5, hp: 5 },
          { x: 7.5, y: 13.5, hp: 5 }
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
    currentCharge: 0,
    jumpCount: 0,
    maxJumps: 2,
    wallDir: 0,
    wallJumpLockUntil: 0,
    airDashUnlocked: false,
    isAirDashing: false,
    airDashDir: 1,
    airDashUntil: 0,
    airDashCooldownUntil: 0,
    airDashCharges: 0,
    airDashMaxCharges: 1,
    airDashSpeed: 820,
    airDashDuration: 0.22,
    airDashCooldown: 0.45
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
      airDashUnlocked: true,
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
      merged.airDashUnlocked = Boolean(merged.airDashUnlocked);
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

  // Migration: if Level 2 was already completed in an older build, grant air dash unlock now.
  if (!profile.airDashUnlocked) {
    profile.airDashUnlocked = true;
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
    cameraY: 0,
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
      chromaOffset: 0,
      cameraKickX: 0,
      cameraKickY: 0
    }
  };

  let audioContext = null;
  let mouseLeftDown = false;
  let mouseRightDown = false;
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
    scanline: null,
    enemySmall: null
  };
  let visualAssetsReady = false;

  function loadVisualAssets() {
    const entries = [
      ['noise', 'assets/noise.png'],
      ['grime1', 'assets/grime-decal-01.png'],
      ['grime2', 'assets/grime-decal-02.png'],
      ['panelHighlight', 'assets/panel-highlight.png'],
      ['scanline', 'assets/scanline-soft.png'],
      ['enemySmall', ['assets/Matt.jpg', 'assets/matt-enemy.png']]
    ];
    let pending = entries.length;
    if (!pending) {
      visualAssetsReady = true;
      return;
    }
    for (const [key, src] of entries) {
      const img = new Image();
      const sourceList = Array.isArray(src) ? src : [src];
      let sourceIndex = 0;
      img.onload = () => {
        visualAssets[key] = img;
        pending -= 1;
        if (pending <= 0) {
          visualAssetsReady = true;
        }
      };
      img.onerror = () => {
        sourceIndex += 1;
        if (sourceIndex < sourceList.length) {
          img.src = sourceList[sourceIndex];
          return;
        }
        pending -= 1;
        if (pending <= 0) {
          visualAssetsReady = true;
        }
      };
      img.src = sourceList[sourceIndex];
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
      y: spawn.y - 52,
      w: 84,
      h: 104,
      minX: spawn.minX,
      maxX: spawn.maxX,
      vx: spawn.speed,
      hp: (spawn.hp || 1) * 2,
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

  function nearestWalkableFpsPoint(grid, x, y) {
    if (!fpsIsWall(grid, x, y)) {
      return { x, y };
    }
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    for (let radius = 1; radius <= 4; radius += 1) {
      for (let oy = -radius; oy <= radius; oy += 1) {
        for (let ox = -radius; ox <= radius; ox += 1) {
          const nx = tx + ox + 0.5;
          const ny = ty + oy + 0.5;
          if (!fpsIsWall(grid, nx, ny)) {
            return { x: nx, y: ny };
          }
        }
      }
    }
    return { x: 1.5, y: 1.5 };
  }

  function createFpsEnemies(spawns, grid) {
    return spawns.map((spawn) => {
      const safe = nearestWalkableFpsPoint(grid, spawn.x, spawn.y);
      return {
        x: safe.x,
        y: safe.y,
      hp: spawn.hp,
      alive: true,
      lastShotAt: -999,
      hitFlashUntil: 0
      };
    });
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
        cameraY: 0,
        hitSparks: [],
        impactRings: [],
        lightFlashes: [],
        killPops: [],
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
          isCharging: false,
          chargeStartedAt: 0,
          chargePower: 0,
          enemies: createFpsEnemies(config.fps.enemySpawns, parsed.grid),
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
      crates: (config.crates || []).map((c) => ({
        ...c,
        hp: c.hp ?? 2,
        maxHp: c.hp ?? 2,
        alive: true,
        hitFlashUntil: 0
      })),
      pickups: (config.pickups || []).map((p) => ({
        ...p,
        collected: false
      })),
      bossTemplate: { ...config.boss },
      cameraX: 0,
      cameraY: 0,
      elapsed: 0,
      projectiles: [],
      enemyProjectiles: [],
      hitSparks: [],
      impactRings: [],
      lightFlashes: [],
      killPops: [],
      hazards: (config.hazards || []).map((hazard) => ({
        ...hazard,
        nextDamageAt: 0,
        triggered: false,
        spawnAccumulator: 0,
        spawnCount: 0,
        warnings: []
      })),
      debrisActors: [],
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

  function setStatusState(state, text) {
    statusEl.textContent = text;
    statusEl.dataset.state = state;
    if (!statusIconEl) {
      return;
    }
    statusIconEl.dataset.state = state;
    if (state === 'fail') {
      statusIconEl.textContent = '!';
    } else if (state === 'boss') {
      statusIconEl.textContent = 'B';
    } else if (state === 'charge') {
      statusIconEl.textContent = 'C';
    } else if (state === 'complete') {
      statusIconEl.textContent = 'OK';
    } else if (state === 'warn') {
      statusIconEl.textContent = '!';
    } else if (state === 'active') {
      statusIconEl.textContent = '>';
    } else {
      statusIconEl.textContent = 'i';
    }
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
    profile.airDashUnlocked = true;
    profile.credits = 0;
    profile.xp = 0;
    profile.level = 1;
    profile.clears = 0;
    profile.missions = createDefaultMissions();
    player.chargeUnlocked = profile.chargeUnlocked;
    player.airDashUnlocked = profile.airDashUnlocked;
    player.isAirDashing = false;
    player.airDashCharges = profile.airDashUnlocked ? player.airDashMaxCharges : 0;
    player.cannonMode = profile.rapidUnlocked ? 'rapid_shot' : 'single_shot';
    localStorage.removeItem(LEGACY_RAPID_KEY);
    saveProfile();
  }

  function enterHub(message) {
    mouseLeftDown = false;
    mouseRightDown = false;
    if (document.pointerLockElement === canvas) {
      document.exitPointerLock();
    }
    game.scene = 'hub';
    game.phase = 'hub';
    game.mission = null;
    game.cameraX = 0;
    game.cameraY = 0;

    player.x = hub.spawn.x;
    player.y = hub.spawn.y;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.hp = player.maxHp;
    player.invulnUntil = 0;
    player.isCharging = false;
    player.currentCharge = 0;
    player.jumpCount = 0;
    player.wallDir = 0;
    player.wallJumpLockUntil = 0;
    player.isAirDashing = false;
    player.airDashCharges = player.airDashUnlocked ? player.airDashMaxCharges : 0;

    if (message) {
      setFeedback(message, 2.2);
    }
  }

  function startMissionRun(missionId) {
    game.scene = 'mission';
    game.phase = 'mission';
    game.activeMissionId = missionId;
    game.mission = createMissionRun(missionId);
    game.cameraX = 0;
    game.cameraY = 0;

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
    player.jumpCount = 0;
    player.wallDir = 0;
    player.wallJumpLockUntil = 0;
    player.isAirDashing = false;
    player.airDashCharges = profile.airDashUnlocked ? player.airDashMaxCharges : 0;
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

  function spawnKillPop(x, y, color = '#ffd991', size = 1) {
    if (!game.mission) {
      return;
    }
    if (!Array.isArray(game.mission.killPops)) {
      game.mission.killPops = [];
    }
    game.mission.killPops.push({
      x,
      y,
      color,
      size,
      life: 0.24,
      maxLife: 0.24
    });
  }

  function spawnScreenFlash(color, life = 0.12, intensity = 0.2) {
    game.renderFx.flashEvents.push({ color, life, maxLife: life, intensity });
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

  function clearTransientInputState() {
    keys.clear();
    justPressed.clear();
    mouseLeftDown = false;
    mouseRightDown = false;
    player.isCharging = false;
    player.currentCharge = 0;
    if (game.mission?.mode === 'fps' && game.mission?.fps) {
      game.mission.fps.isCharging = false;
      game.mission.fps.chargePower = 0;
    }
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

  function updateRenderFx(dt) {
    for (const flash of game.renderFx.flashEvents) {
      flash.life -= dt;
    }
    game.renderFx.flashEvents = game.renderFx.flashEvents.filter((flash) => flash.life > 0);
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
    spawnScreenFlash('rgba(255, 92, 132, 0.75)', 0.12, 0.22);
    triggerCameraShake(1.6, 0.1, sourceX < player.x ? -0.9 : 0.9, -0.4);

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

  function wantsAirDashPress() {
    return justPressed.has('Shift') || justPressed.has('l') || justPressed.has('L');
  }

  function tryMissionJump() {
    if (game.scene !== 'mission' || game.mission?.mode === 'fps' || game.phase !== 'mission') {
      return false;
    }

    if (player.grounded) {
      player.vy = -player.jumpSpeed;
      player.grounded = false;
      player.jumpCount = 1;
      return true;
    }

    if (player.wallDir !== 0 && game.now >= player.wallJumpLockUntil) {
      player.vy = -player.jumpSpeed * 0.92;
      player.vx = -player.wallDir * player.speed * 0.96;
      player.wallJumpLockUntil = game.now + 0.12;
      player.jumpCount = 1;
      player.facing = player.vx >= 0 ? 1 : -1;
      return true;
    }

    if (player.jumpCount < player.maxJumps) {
      player.vy = -player.jumpSpeed * 0.9;
      player.jumpCount += 1;
      return true;
    }

    return false;
  }

  function tryMissionAirDash() {
    if (game.scene !== 'mission' || game.mission?.mode === 'fps' || game.phase !== 'mission') {
      return false;
    }
    if (!profile.airDashUnlocked || player.grounded || player.airDashCharges <= 0 || game.now < player.airDashCooldownUntil) {
      return false;
    }

    const moveLeft = isMoveLeft();
    const moveRight = isMoveRight();
    let dir = player.facing || 1;
    if (moveLeft && !moveRight) {
      dir = -1;
    } else if (moveRight && !moveLeft) {
      dir = 1;
    }

    player.isAirDashing = true;
    player.airDashDir = dir;
    player.airDashUntil = game.now + player.airDashDuration;
    player.airDashCooldownUntil = game.now + player.airDashCooldown;
    player.airDashCharges -= 1;
    player.vx = dir * player.airDashSpeed;
    player.vy = Math.min(player.vy, 25);
    player.facing = dir;
    setFeedback('Air Dash', 0.4);
    return true;
  }

  function updateMissionInput(dt) {
    if (wantsJumpPress()) {
      tryMissionJump();
    }
    if (wantsAirDashPress()) {
      tryMissionAirDash();
    }

    const moveLeft = isMoveLeft();
    const moveRight = isMoveRight();
    const dashing = player.isAirDashing && game.now < player.airDashUntil;

    if (dashing) {
      player.vx = player.airDashDir * player.airDashSpeed;
    } else if (moveLeft && !moveRight) {
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
      spawnScreenFlash('rgba(109, 221, 255, 0.6)', 0.08 + chargePower * 0.07, 0.12 + chargePower * 0.12);
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
        setDialogue(hub.commander.name, 'Level 2 unlocked: Sky Foundry. Air Dash online, use Shift/L midair to cross wide gaps.');
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
        ? `Rapid + Charge + Pierce${profile.airDashUnlocked ? ' + Air Dash' : ''} online`
        : profile.chargeUnlocked
          ? `Rapid + Charge${profile.airDashUnlocked ? ' + Air Dash' : ''} online`
          : profile.rapidUnlocked
            ? `Rapid${profile.airDashUnlocked ? ' + Air Dash' : ''} online`
            : profile.airDashUnlocked
              ? 'Base cannon + Air Dash'
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
        player.wallDir = 1;
      } else if (player.vx < 0) {
        player.x = block.x + block.w;
        player.wallDir = -1;
      }
      player.vx = 0;
    }

    for (const crate of game.mission.crates || []) {
      if (!crate.alive || !intersects(player, crate)) {
        continue;
      }
      if (player.vx > 0) {
        player.x = crate.x - player.w;
        player.wallDir = 1;
      } else if (player.vx < 0) {
        player.x = crate.x + crate.w;
        player.wallDir = -1;
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

    for (const crate of game.mission.crates || []) {
      if (!crate.alive || !intersects(player, crate)) {
        continue;
      }
      if (player.vy > 0) {
        player.y = crate.y - player.h;
        player.vy = 0;
        player.grounded = true;
      } else if (player.vy < 0) {
        player.y = crate.y + crate.h;
        player.vy = 0;
      }
    }
  }

  function updateMissionPlayer(dt) {
    const mission = game.mission;
    if (!mission) {
      return;
    }

    const dashing = player.isAirDashing && game.now < player.airDashUntil;
    if (!dashing && player.isAirDashing) {
      player.isAirDashing = false;
    }

    player.vy += (dashing ? GRAVITY * 0.22 : GRAVITY) * dt;
    if (player.vy > MAX_FALL_SPEED) {
      player.vy = MAX_FALL_SPEED;
    }

    player.wallDir = 0;
    if (dashing) {
      player.vx = player.airDashDir * player.airDashSpeed;
    }
    player.x += player.vx * dt;
    resolveMissionHorizontal();
    if (player.wallDir !== 0 && player.isAirDashing) {
      player.isAirDashing = false;
      player.vx = 0;
    }

    player.y += player.vy * dt;
    player.grounded = false;
    resolveMissionVertical();

    if (player.grounded) {
      player.jumpCount = 0;
      player.wallJumpLockUntil = 0;
      player.airDashCharges = profile.airDashUnlocked ? player.airDashMaxCharges : 0;
      player.isAirDashing = false;
    } else if (player.wallDir !== 0 && player.vy > 220) {
      player.vy = 220;
    }

    player.x = Math.max(0, Math.min(mission.worldWidth - player.w, player.x));

    for (const pickup of mission.pickups || []) {
      if (pickup.collected || !intersects(player, pickup)) {
        continue;
      }
      pickup.collected = true;
      profile.credits += pickup.credits || 0;
      const leveled = giveXp(pickup.xp || 0);
      saveProfile();
      spawnHitSpark(pickup.x + pickup.w / 2, pickup.y + pickup.h / 2, '#9af5ff', 1.35);
      spawnImpactRing(pickup.x + pickup.w / 2, pickup.y + pickup.h / 2, '#a8f0ff', 1.25);
      const levelText = leveled ? ` Level ${profile.level} reached.` : '';
      setFeedback(`${pickup.label || 'Cache'} secured. +${pickup.credits || 0} Cr +${pickup.xp || 0} XP.${levelText}`, 2.8);
    }

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

  function getLaserGateState(mission, hazard) {
    const cycle = Math.max(0.2, hazard.cycleTime || 2.5);
    const warningDuration = Math.max(0.05, hazard.warningDuration || 0.5);
    const activeDuration = Math.max(0.05, hazard.activeDuration || 0.5);
    const phase = mission.elapsed % cycle;
    return {
      warning: phase < warningDuration,
      active: phase >= warningDuration && phase < warningDuration + activeDuration
    };
  }

  function getCrusherState(mission, hazard) {
    const cycle = Math.max(0.2, hazard.cycleTime || 3.2);
    const warningDuration = Math.max(0.05, hazard.warningDuration || 0.6);
    const descendDuration = Math.max(0.05, hazard.descendDuration || 0.6);
    const holdDuration = Math.max(0.05, hazard.holdDuration || 0.4);
    const retractDuration = Math.max(0.05, hazard.retractDuration || 0.8);
    const phase = mission.elapsed % cycle;
    const topY = hazard.crusher.topY;
    const bottomY = hazard.crusher.bottomY;
    const travel = bottomY - topY;

    let y = topY;
    let active = false;
    let warning = false;
    if (phase < warningDuration) {
      warning = true;
    } else if (phase < warningDuration + descendDuration) {
      const t = (phase - warningDuration) / descendDuration;
      y = topY + travel * t;
      active = true;
    } else if (phase < warningDuration + descendDuration + holdDuration) {
      y = bottomY;
      active = true;
    } else if (phase < warningDuration + descendDuration + holdDuration + retractDuration) {
      const t = (phase - warningDuration - descendDuration - holdDuration) / retractDuration;
      y = bottomY - travel * t;
    } else {
      y = topY;
    }

    return { y, active, warning };
  }

  function updateMissionHazards(dt) {
    const mission = game.mission;
    if (!mission || mission.mode === 'fps') {
      return;
    }

    for (const hazard of mission.hazards || []) {
      if (hazard.activeRegion && !intersects(player, hazard.activeRegion)) {
        continue;
      }

      if (hazard.type === 'laser_gate') {
        const state = getLaserGateState(mission, hazard);
        if (state.warning && Math.floor(game.now * 8) % 8 === 0) {
          spawnLightFlash((hazard.x1 + hazard.x2) * 0.5, hazard.y, 'rgba(255, 187, 92, 0.28)', 38, 0.08);
        }
        if (state.active) {
          const beamRect = {
            x: hazard.x1,
            y: hazard.y - (hazard.thickness || 10) * 0.5,
            w: hazard.x2 - hazard.x1,
            h: hazard.thickness || 10
          };
          if (intersects(player, beamRect) && game.now >= hazard.nextDamageAt) {
            hazard.nextDamageAt = game.now + (hazard.tickInterval || 0.25);
            damagePlayer(hazard.damage || 12, (hazard.x1 + hazard.x2) * 0.5);
            spawnHitSpark(player.x + player.w * 0.5, beamRect.y + beamRect.h * 0.5, '#ffb168', 1.1);
          }
        }
      } else if (hazard.type === 'conveyor_crusher') {
        const belt = hazard.conveyor;
        const crusherState = getCrusherState(mission, hazard);
        const crusherRect = {
          x: hazard.crusher.x,
          y: crusherState.y,
          w: hazard.crusher.w,
          h: hazard.crusher.h
        };
        const beltRect = { x: belt.x, y: belt.y, w: belt.w, h: belt.h };

        if (intersects(player, beltRect) && player.grounded) {
          const push = (belt.push || 180) * dt;
          player.x += push;
          player.x = Math.max(0, Math.min(mission.worldWidth - player.w, player.x));
          resolveMissionHorizontal();
        }

        if (crusherState.warning && Math.floor(game.now * 10) % 10 === 0) {
          spawnLightFlash(
            crusherRect.x + crusherRect.w * 0.5,
            crusherRect.y + crusherRect.h * 0.5,
            'rgba(255, 144, 104, 0.26)',
            44,
            0.08
          );
        }
        if (crusherState.active && intersects(player, crusherRect) && game.now >= hazard.nextDamageAt) {
          hazard.nextDamageAt = game.now + (hazard.tickInterval || 0.2);
          damagePlayer(hazard.damage || 20, crusherRect.x + crusherRect.w * 0.5);
          spawnImpactRing(player.x + player.w * 0.5, player.y + player.h * 0.5, '#ffb37a', 1);
        }
      } else if (hazard.type === 'debris_zone') {
        if (!hazard.triggered && player.x + player.w * 0.5 >= hazard.triggerX) {
          hazard.triggered = true;
          setFeedback('Hazard zone detected: falling debris incoming.', 2.2);
        }
        if (!hazard.triggered) {
          continue;
        }

        hazard.spawnAccumulator += dt;
        while (hazard.spawnAccumulator >= (hazard.spawnInterval || 1.2)) {
          hazard.spawnAccumulator -= hazard.spawnInterval || 1.2;
          const n = hazard.spawnCount + 1;
          const frac = Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
          const x = hazard.zoneX + 40 + frac * Math.max(40, hazard.zoneW - 80);
          hazard.spawnCount += 1;
          hazard.warnings.push({
            x,
            y: (hazard.yBottom || 520) - 16,
            life: hazard.warningDuration || 0.6,
            maxLife: hazard.warningDuration || 0.6
          });
        }

        for (const warning of hazard.warnings) {
          warning.life -= dt;
          if (warning.life <= 0 && !warning.spawned) {
            warning.spawned = true;
            mission.debrisActors.push({
              x: warning.x,
              y: hazard.yTop || 20,
              r: 14,
              vy: hazard.fallSpeed || 520,
              damage: hazard.damage || 14,
              _dead: false
            });
            spawnLightFlash(warning.x, warning.y, 'rgba(255, 201, 145, 0.28)', 28, 0.11);
          }
        }
        hazard.warnings = hazard.warnings.filter((w) => !w.spawned);
      }
    }

    for (const debris of mission.debrisActors || []) {
      if (debris._dead) {
        continue;
      }
      debris.y += debris.vy * dt;
      if (circleHitsRect(debris, player)) {
        debris._dead = true;
        damagePlayer(debris.damage || 14, debris.x);
        spawnHitSpark(debris.x, debris.y, '#ffad7a', 1.2);
        spawnImpactRing(debris.x, debris.y, '#ffd1a6', 1);
      } else if (debris.y > HEIGHT + 80) {
        debris._dead = true;
      }
    }
    mission.debrisActors = (mission.debrisActors || []).filter((d) => !d._dead);
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
    const appendUnlockBanner = (text) => {
      unlockBanner = unlockBanner ? `${unlockBanner} ${text}` : text;
    };

    if (missionId === LEVEL_1_ID && !profile.rapidUnlocked) {
      profile.rapidUnlocked = true;
      player.cannonMode = 'rapid_shot';
      setFeedback('Rapid Shot unlocked', 2.4);
    }

    if (missionId === LEVEL_1_ID && !profile.chargeUnlocked) {
      profile.chargeUnlocked = true;
      player.chargeUnlocked = true;
      appendUnlockBanner('Charge Shot Unlocked! Hold K and release to fire.');
    }

    if (missionId === LEVEL_2_ID && !m3.accepted) {
      m3.accepted = true;
      appendUnlockBanner('Level 3 Unlocked! Launch Black Site Breach from the lift.');
    }

    if (missionId === LEVEL_3_ID && !profile.pierceUnlocked) {
      profile.pierceUnlocked = true;
      appendUnlockBanner('Tier-3 Unlock: Piercing Rapid Shot online.');
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
      for (const crate of mission.crates || []) {
        if (!crate.alive || projectile._dead) {
          continue;
        }
        if (circleHitsRect(projectile, crate)) {
          crate.hp -= projectile.damage;
          crate.hitFlashUntil = game.now + 0.07;
          spawnHitSpark(projectile.x, projectile.y, '#d8b98f', 0.9 + projectile.power * 0.6);
          spawnImpactRing(projectile.x, projectile.y, '#d7ad7f', 0.7 + projectile.power * 0.4);
          if (projectile.piercing && projectile.pierceRemaining > 0) {
            projectile.pierceRemaining -= 1;
            projectile.damage *= 0.84;
            if (projectile.pierceRemaining <= 0) {
              projectile._dead = true;
            }
          } else {
            projectile._dead = true;
          }

          if (crate.hp <= 0) {
            crate.alive = false;
            spawnHitSpark(crate.x + crate.w / 2, crate.y + crate.h / 2, '#f2cf96', 1.2);
            spawnImpactRing(crate.x + crate.w / 2, crate.y + crate.h / 2, '#e8be86', 1.05);
          }
        }
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
            spawnLightFlash(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 'rgba(255, 204, 114, 0.8)', 54, 0.17);
            spawnKillPop(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ffd279', 1.05);
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
          spawnKillPop(mission.boss.x + mission.boss.w / 2, mission.boss.y + mission.boss.h / 2, '#ffd1e2', 2.2);
          spawnLightFlash(
            mission.boss.x + mission.boss.w / 2,
            mission.boss.y + mission.boss.h / 2,
            'rgba(255, 151, 190, 0.78)',
            120,
            0.24
          );
          completeMissionRun();
          return;
        }
      }
    }

    for (const projectile of mission.enemyProjectiles) {
      if (projectile._dead) {
        continue;
      }
      for (const crate of mission.crates || []) {
        if (!crate.alive || projectile._dead) {
          continue;
        }
        if (circleHitsRect(projectile, crate)) {
          projectile._dead = true;
          crate.hp -= 0.8;
          crate.hitFlashUntil = game.now + 0.06;
          if (crate.hp <= 0) {
            crate.alive = false;
            spawnHitSpark(crate.x + crate.w / 2, crate.y + crate.h / 2, '#f2cf96', 1.15);
          }
        }
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

    for (const pop of mission.killPops || []) {
      pop.life -= dt;
      pop.size += dt * 3.5;
    }
    mission.killPops = (mission.killPops || []).filter((pop) => pop.life > 0);

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

    const targetY = Math.min(0, player.y - HEIGHT * 0.62);
    const clampedY = Math.max(-260, Math.min(0, targetY));
    mission.cameraY += (clampedY - mission.cameraY) * Math.min(1, dt * 7);
    game.cameraY = mission.cameraY;
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

  function spawnFpsBolt(fps, power = 0) {
    const clamped = Math.max(0, Math.min(1, power));
    const speed = 11.5 + clamped * 2.6;
    fps.bolts.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(fps.yaw) * speed,
      vy: Math.sin(fps.yaw) * speed,
      life: 0.8 + clamped * 0.2,
      radius: 0.17 + clamped * 0.16,
      damage: 1 + clamped * 3
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
          enemy.hp -= bolt.damage || 1;
          enemy.hitFlashUntil = game.now + 0.08;
          playEnemyHitSfx(0.95 + (bolt.damage || 1) * 0.15);
          spawnHitSpark(bolt.x, bolt.y, '#a7f7ff', 1.1 + (bolt.damage || 1) * 0.2);
          spawnImpactRing(bolt.x, bolt.y, '#9cf7ff', 0.8 + (bolt.damage || 1) * 0.22);
          spawnLightFlash(bolt.x, bolt.y, 'rgba(127, 233, 255, 0.74)', 28 + (bolt.damage || 1) * 8, 0.1);
          bolt.life = -1;
          if (enemy.hp <= 0) {
            enemy.alive = false;
            spawnHitSpark(enemy.x, enemy.y, '#ffd184', 1.3);
            spawnKillPop(enemy.x, enemy.y, '#ffd98f', 1.05 + (bolt.damage || 1) * 0.12);
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

    const rapidHeld = isRapidShootHeld() || mouseLeftDown;
    const chargeHeld = isChargeShootHeld() || mouseRightDown;

    if (rapidHeld && game.now - fps.lastFireAt >= fps.fireCooldown) {
      fps.lastFireAt = game.now;
      spawnFpsBolt(fps, 0);
    }

    if (chargeHeld && !fps.isCharging && profile.chargeUnlocked && game.now - fps.lastFireAt >= fps.fireCooldown) {
      fps.isCharging = true;
      fps.chargeStartedAt = game.now;
      fps.chargePower = 0;
    }

    if (fps.isCharging && chargeHeld) {
      fps.chargePower = Math.max(0, Math.min(1, (game.now - fps.chargeStartedAt) / 1.05));
    }

    if (fps.isCharging && !chargeHeld) {
      const power = Math.max(0.35, fps.chargePower);
      fps.lastFireAt = game.now;
      spawnFpsBolt(fps, power);
      playChargeShotSfx(power);
      triggerCameraShake(2.4 + power * 4.2, 0.13 + power * 0.15, -0.9, -0.55);
      spawnScreenFlash('rgba(112, 231, 255, 0.6)', 0.08 + power * 0.08, 0.12 + power * 0.12);
      fps.isCharging = false;
      fps.chargePower = 0;
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
        if (game.mission?.fps?.isCharging) {
          readiness = game.mission?.fps?.chargePower || 0;
        } else {
          const elapsed = game.now - (game.mission?.fps?.lastFireAt || 0);
          const cd = game.mission?.fps?.fireCooldown || 0.2;
          readiness = Math.max(0, Math.min(1, elapsed / cd));
        }
      } else if (player.isCharging) {
        readiness = player.currentCharge;
      } else {
        const elapsed = game.now - player.lastShotAt;
        readiness = Math.max(0, Math.min(1, elapsed / player.cooldownSeconds));
      }
      cooldownFillEl.style.transform = `scaleX(${readiness})`;
      cooldownFillEl.dataset.ready = readiness >= 0.995 ? 'true' : 'false';

      const dashReady =
        profile.airDashUnlocked &&
        game.mission?.mode !== 'fps' &&
        !player.grounded &&
        player.airDashCharges > 0 &&
        game.now >= player.airDashCooldownUntil;
      const dashStateText = !profile.airDashUnlocked
        ? 'Dash offline'
        : player.grounded
          ? `Dash ${player.airDashMaxCharges}/${player.airDashMaxCharges}`
          : dashReady
            ? 'Dash ready'
            : `Dash cd ${Math.max(0, player.airDashCooldownUntil - game.now).toFixed(1)}s`;

      if (game.phase === 'mission_failed') {
        setStatusState('fail', 'Mission failed. Press R to retry or H for Hub');
      } else if (game.mission?.mode === 'fps') {
        const alive = game.mission.fps.enemies.filter((enemy) => enemy.alive).length;
        if (game.mission.fps.isCharging) {
          setStatusState('charge', `${game.mission.name} | Charge ${(game.mission.fps.chargePower * 100).toFixed(0)}% (RMB release)`);
        } else {
          setStatusState(
            alive > 0 ? 'active' : 'complete',
            alive > 0 ? `${game.mission.name} | Eliminate hostiles (${alive} left)` : `${game.mission.name} | Reach extraction`
          );
        }
      } else if (game.mission?.bossActive && game.mission?.boss?.alive) {
        setStatusState('boss', `${game.mission.name} | Mini-Boss HP: ${Math.max(0, Math.ceil(game.mission.boss.hp))} | ${dashStateText}`);
      } else if (player.isCharging) {
        setStatusState('charge', `${game.mission?.name || 'Mission'} | Charging ${Math.round(player.currentCharge * 100)}% | ${dashStateText}`);
      } else {
        const isDashCourse = game.activeMissionId === LEVEL_2_ID && !game.mission?.bossActive;
        setStatusState(
          'active',
          isDashCourse
            ? `${game.mission?.name || 'Mission'} | Hazard course active: time lasers, crusher lane, and debris zone | ${dashStateText}`
            : `${game.mission?.name || 'Mission'} active: reach and clear mini-boss gate | ${dashStateText}`
        );
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
    cooldownFillEl.dataset.ready = 'true';

    if (game.phase === 'intro') {
      setStatusState('hub', 'Press Enter to activate hub');
      return;
    }

    if (!m1.accepted) {
      setStatusState('warn', 'Talk to Commander Rho to accept Level 1');
    } else if (!m1.completed) {
      setStatusState('active', 'Level 1 accepted. Use lift to deploy');
    } else if (!m1.turnedIn) {
      setStatusState('warn', 'Turn in Level 1 report with Engineer Vale');
    } else if (!m2.accepted) {
      setStatusState('warn', 'Talk to Commander Rho to unlock Level 2');
    } else if (!m2.completed) {
      setStatusState('active', 'Level 2 accepted. Use lift to deploy');
    } else if (!m2.turnedIn) {
      setStatusState('warn', 'Turn in Level 2 report with Engineer Vale');
    } else if (!m3.accepted) {
      setStatusState('warn', 'Talk to Commander Rho to unlock Level 3');
    } else if (!m3.completed) {
      setStatusState('active', 'Level 3 accepted. Use lift to deploy');
    } else if (!m3.turnedIn) {
      setStatusState('warn', 'Turn in Level 3 report with Engineer Vale');
    } else {
      setStatusState('complete', `Campaign complete. Lvl ${profile.level} | Credits ${profile.credits}`);
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
      updateRenderFx(dt);
      updateHud();
      return;
    }

    if (game.scene === 'hub') {
      updateHubInput();
      updateCameraShake(dt);
      updateRenderFx(dt);
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
      updateRenderFx(dt);
      updateHud();
      return;
    }

    if (game.mission?.mode === 'fps') {
      updateFpsMission(dt);
    } else {
      if (game.mission) {
        game.mission.elapsed = (game.mission.elapsed || 0) + dt;
      }
      updateMissionInput(dt);
      updateMissionPlayer(dt);
      updateMissionHazards(dt);
      updateMissionEnemies(dt);
      updateMissionBoss(dt);
      updateMissionProjectiles(dt);
      updateMissionSparks(dt);
      updateMissionCamera(dt);
    }
    updateCameraShake(dt);
    updateRenderFx(dt);
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
    const y = game.cameraY;
    const theme = activeTheme();
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, theme.skyTop);
    sky.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = theme.haze;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawTextureOverlay(visualAssets.noise, 0.07, 3.6, -x * 0.18, game.now * 10 - y * 0.4);

    ctx.fillStyle = 'rgba(14, 40, 58, 0.9)';
    for (let i = 0; i < 16; i += 1) {
      const px = (i * 360 - (x * 0.22) % 360) - 50;
      ctx.fillRect(px, 214 - y * 0.2, 82, 340);
      ctx.fillStyle = 'rgba(42, 92, 111, 0.35)';
      ctx.fillRect(px + 10, 230 - y * 0.22, 14, 280);
      ctx.fillStyle = 'rgba(14, 40, 58, 0.9)';
    }

    ctx.fillStyle = 'rgba(32, 90, 114, 0.76)';
    for (let i = 0; i < 22; i += 1) {
      const px = (i * 248 - (x * 0.52) % 248) - 70;
      ctx.fillRect(px, 290 - y * 0.32, 52, 250);
      ctx.fillRect(px + 8, 318 - y * 0.32, 36, 8);
    }

    ctx.strokeStyle = 'rgba(111, 209, 255, 0.21)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i += 1) {
      const py = 160 + i * 40 - y * 0.16;
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
    const camY = mission.cameraY || 0;
    ctx.save();
    ctx.translate(-camX, -camY);

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

    for (const crate of mission.crates || []) {
      if (!crate.alive) {
        continue;
      }
      const crateFlash = crate.hitFlashUntil > game.now;
      const crateGrad = ctx.createLinearGradient(crate.x, crate.y, crate.x, crate.y + crate.h);
      crateGrad.addColorStop(0, crateFlash ? '#efcf9c' : '#9a6e3f');
      crateGrad.addColorStop(1, crateFlash ? '#d3a86f' : '#6a4526');
      ctx.fillStyle = crateGrad;
      ctx.fillRect(crate.x, crate.y, crate.w, crate.h);
      ctx.strokeStyle = crateFlash ? '#f8ddb0' : '#b98a56';
      ctx.lineWidth = 2;
      ctx.strokeRect(crate.x + 1, crate.y + 1, crate.w - 2, crate.h - 2);
      ctx.strokeStyle = crateFlash ? 'rgba(120, 81, 38, 0.45)' : 'rgba(45, 28, 14, 0.5)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(crate.x + 4, crate.y + crate.h * 0.5);
      ctx.lineTo(crate.x + crate.w - 4, crate.y + crate.h * 0.5);
      ctx.moveTo(crate.x + crate.w * 0.5, crate.y + 4);
      ctx.lineTo(crate.x + crate.w * 0.5, crate.y + crate.h - 4);
      ctx.stroke();
    }

    drawMissionHazards();

    for (const pickup of mission.pickups || []) {
      if (pickup.collected) {
        continue;
      }
      const pulse = Math.sin(game.now * 6 + pickup.x * 0.01) * 0.5 + 0.5;
      const cx = pickup.x + pickup.w / 2;
      const cy = pickup.y + pickup.h / 2;
      ctx.globalAlpha = 0.4 + pulse * 0.35;
      ctx.fillStyle = '#6eeeff';
      ctx.beginPath();
      ctx.arc(cx, cy, pickup.w * (0.72 + pulse * 0.15), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#bdf6ff';
      ctx.beginPath();
      ctx.arc(cx, cy, pickup.w * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e9fdff';
      ctx.lineWidth = 2;
      ctx.strokeRect(pickup.x, pickup.y, pickup.w, pickup.h);
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
      ctx.fillRect(camX + WIDTH - barW - 26, camY + 20, barW, 18);
      ctx.fillStyle = '#ff4d80';
      ctx.fillRect(camX + WIDTH - barW - 26, camY + 20, barW * ratio, 18);
      ctx.strokeStyle = '#ff94b5';
      ctx.strokeRect(camX + WIDTH - barW - 26, camY + 20, barW, 18);

      ctx.fillStyle = '#ffd2df';
      ctx.font = 'bold 15px Segoe UI';
      ctx.fillText(mission.name, camX + WIDTH - barW - 24, camY + 14);
    }

    drawPlayer();
    drawProjectiles();
    drawSparks();
    drawMissionLights();

    ctx.restore();
  }

  function drawMissionHazards() {
    const mission = game.mission;
    if (!mission || mission.mode === 'fps') {
      return;
    }

    for (const hazard of mission.hazards || []) {
      if (hazard.type === 'laser_gate') {
        const state = getLaserGateState(mission, hazard);
        const thickness = hazard.thickness || 10;
        ctx.fillStyle = '#5f6777';
        ctx.fillRect(hazard.x1 - 10, hazard.y - 18, 8, 36);
        ctx.fillRect(hazard.x2 + 2, hazard.y - 18, 8, 36);
        if (state.warning) {
          const pulse = Math.sin(game.now * 18) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255, 188, 108, ${0.25 + pulse * 0.45})`;
          ctx.fillRect(hazard.x1, hazard.y - thickness * 0.5, hazard.x2 - hazard.x1, thickness);
        }
        if (state.active) {
          ctx.fillStyle = 'rgba(255, 98, 84, 0.9)';
          ctx.fillRect(hazard.x1, hazard.y - thickness * 0.5, hazard.x2 - hazard.x1, thickness);
          ctx.strokeStyle = '#ffd0a8';
          ctx.lineWidth = 2;
          ctx.strokeRect(hazard.x1, hazard.y - thickness * 0.5, hazard.x2 - hazard.x1, thickness);
        }
      } else if (hazard.type === 'conveyor_crusher') {
        const belt = hazard.conveyor;
        const crusherState = getCrusherState(mission, hazard);
        const crusherRect = { x: hazard.crusher.x, y: crusherState.y, w: hazard.crusher.w, h: hazard.crusher.h };

        ctx.fillStyle = '#2a3448';
        ctx.fillRect(belt.x, belt.y, belt.w, belt.h);
        ctx.fillStyle = '#4a81a0';
        ctx.fillRect(belt.x, belt.y, belt.w, 5);
        for (let x = belt.x + 10; x < belt.x + belt.w - 8; x += 26) {
          ctx.strokeStyle = 'rgba(184, 230, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, belt.y + belt.h - 8);
          ctx.lineTo(x + 12, belt.y + 8);
          ctx.stroke();
        }

        ctx.fillStyle = '#1b2535';
        ctx.fillRect(crusherRect.x, hazard.crusher.topY - 54, crusherRect.w, 54);
        ctx.fillStyle = crusherState.active ? '#ff9d72' : '#7f8da2';
        ctx.fillRect(crusherRect.x, crusherRect.y, crusherRect.w, crusherRect.h);
        ctx.strokeStyle = '#d7e0ee';
        ctx.strokeRect(crusherRect.x + 1, crusherRect.y + 1, crusherRect.w - 2, crusherRect.h - 2);
        if (crusherState.warning) {
          ctx.fillStyle = `rgba(255, 167, 113, ${0.3 + (Math.sin(game.now * 16) * 0.5 + 0.5) * 0.45})`;
          ctx.fillRect(crusherRect.x - 8, hazard.crusher.bottomY + crusherRect.h - 10, crusherRect.w + 16, 10);
        }
      } else if (hazard.type === 'debris_zone') {
        if (!hazard.triggered) {
          ctx.strokeStyle = 'rgba(255, 210, 145, 0.55)';
          ctx.setLineDash([8, 7]);
          ctx.strokeRect(hazard.zoneX, 80, hazard.zoneW, 380);
          ctx.setLineDash([]);
        }
        for (const warning of hazard.warnings || []) {
          const alpha = warning.life / warning.maxLife;
          ctx.fillStyle = `rgba(255, 186, 120, ${0.2 + alpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(warning.x, warning.y, 12 + (1 - alpha) * 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    for (const debris of mission.debrisActors || []) {
      ctx.fillStyle = '#b4bcca';
      ctx.beginPath();
      ctx.arc(debris.x, debris.y, debris.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e7edf7';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
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
    const moving = Math.abs(player.vx) > 35 && (game.scene === 'hub' || game.mission?.mode !== 'fps');
    const speedNorm = Math.max(0.25, Math.min(1.4, Math.abs(player.vx) / Math.max(1, player.speed)));
    const walkT = game.now * (moving ? (8 + speedNorm * 4) : 2.2);
    const legSwing = moving ? Math.sin(walkT) * 8.5 : Math.sin(walkT) * 1.1;
    const legLift = moving ? Math.abs(Math.sin(walkT)) * 3.2 : 0;
    const armSwing = moving ? Math.cos(walkT) * 2.2 : Math.cos(walkT) * 0.45;
    const breath = Math.sin(game.now * 3.4) * 1.1;
    const chargePulse = player.isCharging ? Math.sin(game.now * 20) * 0.5 + 0.5 : 0;
    const shotKick = Math.max(0, 1 - (game.now - player.lastShotAt) * 10);

    const baseX = player.x + player.w / 2;
    const baseY = player.y + 7 + breath;

    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.scale(player.facing, 1);

    ctx.fillStyle = 'rgba(4, 10, 18, 0.42)';
    ctx.beginPath();
    ctx.ellipse(0, 50, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(-8, 34 + legLift * 0.35);
    ctx.rotate((-0.2 - legSwing * 0.022) * 0.8);
    const backLegGrad = ctx.createLinearGradient(0, -2, 0, 28);
    backLegGrad.addColorStop(0, '#8f9aa8');
    backLegGrad.addColorStop(1, '#4b5868');
    ctx.fillStyle = backLegGrad;
    ctx.fillRect(-7, -2, 13, 16);
    ctx.fillStyle = '#7f8d9d';
    ctx.fillRect(-6, 13, 11, 13);
    ctx.fillStyle = '#0e1823';
    ctx.fillRect(-10, 20, 18, 8);
    ctx.restore();

    ctx.save();
    ctx.translate(8, 33 - legLift * 0.55);
    ctx.rotate(0.1 + legSwing * 0.03);
    const frontLegGrad = ctx.createLinearGradient(0, 0, 0, 31);
    frontLegGrad.addColorStop(0, '#2f8df1');
    frontLegGrad.addColorStop(1, '#11418d');
    ctx.fillStyle = frontLegGrad;
    ctx.fillRect(-8, 0, 16, 15);
    ctx.fillStyle = '#2366bb';
    ctx.fillRect(-7, 13, 14, 16);
    ctx.fillStyle = '#0b1725';
    ctx.fillRect(-11, 24, 22, 9);
    ctx.fillStyle = '#8dd4ff';
    ctx.fillRect(-6, 3, 12, 4);
    ctx.restore();

    const coreGrad = ctx.createLinearGradient(0, 0, 0, 30);
    coreGrad.addColorStop(0, hitFlash ? '#ffc4d1' : '#56aaf8');
    coreGrad.addColorStop(1, hitFlash ? '#e7869e' : '#2053a7');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(-13, 10, 26, 20);
    ctx.fillStyle = '#8a98a8';
    ctx.fillRect(-6, 22, 12, 10);
    ctx.fillStyle = '#d2ecff';
    ctx.fillRect(-8, 13, 16, 4);

    const shoulderGrad = ctx.createLinearGradient(-18, 7, -2, 23);
    shoulderGrad.addColorStop(0, '#61b7ff');
    shoulderGrad.addColorStop(1, '#1f5daa');
    ctx.fillStyle = shoulderGrad;
    ctx.beginPath();
    ctx.ellipse(-12, 16, 9, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(15, 18);
    ctx.rotate(0.2 + armSwing * 0.02);
    const armGrad = ctx.createLinearGradient(0, -4, 0, 20);
    armGrad.addColorStop(0, '#a5b4c6');
    armGrad.addColorStop(1, '#5a6878');
    ctx.fillStyle = armGrad;
    ctx.fillRect(-3, -4, 9, 20);
    ctx.fillStyle = '#111d2a';
    ctx.fillRect(-4, 14, 11, 8);
    ctx.restore();

    ctx.save();
    const cannonY = 19 - armSwing * 0.3 + shotKick * 1.1;
    ctx.translate(-30 - shotKick * 4.1, cannonY);
    ctx.rotate(0);
    const cannonGrad = ctx.createLinearGradient(-8, -8, 24, 8);
    cannonGrad.addColorStop(0, '#2f8ced');
    cannonGrad.addColorStop(1, '#163f88');
    ctx.fillStyle = cannonGrad;
    ctx.fillRect(-10, -8, 31, 16);
    ctx.beginPath();
    ctx.ellipse(-10, 0, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(21, 0, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6e7b8c';
    ctx.beginPath();
    ctx.ellipse(25, 0, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#171e2a';
    ctx.beginPath();
    ctx.ellipse(27, 0, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (player.isCharging || shotKick > 0) {
      ctx.globalAlpha = 0.35 + player.currentCharge * 0.4 + shotKick * 0.2;
      ctx.fillStyle = '#86f0ff';
      ctx.beginPath();
      ctx.ellipse(27, 0, 10 + player.currentCharge * 8 + shotKick * 5, 10 + player.currentCharge * 8 + shotKick * 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (player.isCharging) {
      ctx.strokeStyle = '#d8ffff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.45 + chargePulse * 0.45;
      ctx.beginPath();
      ctx.arc(27, 0, 13 + player.currentCharge * 10 + chargePulse * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    ctx.save();
    ctx.translate(0, 8 + breath * 0.25);
    ctx.fillStyle = '#f0c39f';
    ctx.fillRect(-5, -8, 10, 11);
    ctx.fillStyle = '#1a1f26';
    ctx.fillRect(0, -8, 5, 11);
    ctx.fillStyle = '#a2b4c8';
    ctx.fillRect(0, -10, 7, 14);
    ctx.fillStyle = '#7f90a3';
    ctx.fillRect(2, -8, 4, 10);
    ctx.fillStyle = '#2e1b14';
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(-1, -14);
    ctx.lineTo(4, -12);
    ctx.lineTo(0, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#14181f';
    ctx.fillRect(-2, -4, 2, 1);
    ctx.fillRect(2, -4, 2, 1);
    ctx.fillStyle = '#ff4e4e';
    ctx.fillRect(2, -4, 2, 1);
    ctx.restore();

    ctx.fillStyle = '#29558f';
    ctx.fillRect(-7, 31, 14, 5);
    ctx.fillStyle = '#5ea9ff';
    ctx.fillRect(-5, 31, 10, 2);

    if (hitFlash) {
      ctx.fillStyle = 'rgba(255, 142, 168, 0.32)';
      ctx.fillRect(-16, -6, 40, 58);
    }

    ctx.restore();
  }

  function drawCrawler(enemy, flash) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    const img = visualAssets.enemySmall;
    if (img) {
      const bob = Math.sin(game.now * 7 + enemy.x * 0.01) * 1.2;
      const drawY = 2 + bob;
      ctx.drawImage(img, 0, drawY, enemy.w, enemy.h - 4);
      ctx.strokeStyle = flash ? 'rgba(255, 203, 203, 0.95)' : 'rgba(128, 186, 255, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, drawY + 1, enemy.w - 2, enemy.h - 6);
      if (flash) {
        ctx.fillStyle = 'rgba(255, 182, 182, 0.25)';
        ctx.fillRect(1, drawY + 1, enemy.w - 2, enemy.h - 6);
      }
      ctx.fillStyle = 'rgba(5, 12, 19, 0.45)';
      ctx.fillRect(4, enemy.h - 6, enemy.w - 8, 5);
    } else {
      ctx.fillStyle = flash ? '#ffd1a0' : '#e89a57';
      ctx.fillRect(2, 6, enemy.w - 4, 18);
      ctx.fillStyle = '#5e351f';
      ctx.fillRect(10, 24, enemy.w - 20, enemy.h - 24);
      ctx.strokeStyle = flash ? 'rgba(255, 221, 176, 0.9)' : 'rgba(255, 183, 111, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 6, enemy.w - 4, enemy.h - 8);
    }
    ctx.restore();
  }

  function drawBossArc(cx, cy, radius, phase, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    const points = 7;
    for (let i = 0; i < points; i += 1) {
      const t = i / (points - 1);
      const angle = phase + t * Math.PI * 1.2;
      const wobble = Math.sin(phase * 2 + i * 1.4) * 5;
      const x = cx + Math.cos(angle) * (radius + wobble);
      const y = cy + Math.sin(angle) * (radius * 0.45 + wobble * 0.3);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawBoss(boss, flash) {
    ctx.save();
    ctx.translate(boss.x, boss.y);
    const t = game.now * 2.8;
    const idleBob = Math.sin(t) * 2.4;
    const surge = Math.max(0, 1 - (boss.attackTimer / Math.max(0.001, boss.attackInterval)));
    const energy = 0.55 + Math.sin(game.now * 9.5) * 0.15 + surge * 0.35;

    ctx.translate(0, idleBob);

    const armor = ctx.createLinearGradient(0, 12, 0, boss.h);
    armor.addColorStop(0, flash ? '#d8cfff' : '#3e2b69');
    armor.addColorStop(0.45, flash ? '#a8a0d9' : '#2a214c');
    armor.addColorStop(1, flash ? '#8c84b8' : '#171a31');
    ctx.fillStyle = armor;
    ctx.fillRect(11, 20, boss.w - 22, boss.h - 24);

    const steel = ctx.createLinearGradient(0, 18, 0, boss.h);
    steel.addColorStop(0, '#aab1bf');
    steel.addColorStop(1, '#505866');
    ctx.fillStyle = steel;
    ctx.fillRect(30, 35, boss.w - 60, 54);

    ctx.fillStyle = '#4a3b7c';
    ctx.fillRect(5, 46, 34, 26);
    ctx.fillRect(boss.w - 39, 46, 34, 26);
    ctx.fillStyle = '#1a1f30';
    ctx.fillRect(3, 70, 40, 20);
    ctx.fillRect(boss.w - 43, 70, 40, 20);

    const coreX = boss.w / 2;
    const coreY = 62;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255, 70, 82, ${0.45 + energy * 0.35})`;
    ctx.beginPath();
    ctx.arc(coreX, coreY, 10 + energy * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffddd8';
    ctx.beginPath();
    ctx.arc(coreX, coreY, 5 + energy * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#4f5982';
    ctx.fillRect(40, 8, boss.w - 80, 22);
    ctx.fillStyle = '#272d40';
    ctx.fillRect(44, 12, boss.w - 88, 14);
    ctx.fillStyle = '#ff2f36';
    ctx.fillRect(coreX - 3, -4, 6, 18);
    ctx.fillStyle = '#1b1f2d';
    ctx.fillRect(46, 22, boss.w - 92, 22);

    const eyeGlow = `rgba(255, 61, 61, ${0.5 + energy * 0.4})`;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = eyeGlow;
    ctx.fillRect(coreX - 20, 29, 10, 3);
    ctx.fillRect(coreX + 10, 29, 10, 3);
    ctx.restore();

    ctx.fillStyle = '#192034';
    ctx.fillRect(20, boss.h - 34, 28, 18);
    ctx.fillRect(boss.w - 48, boss.h - 34, 28, 18);
    ctx.fillStyle = '#444f70';
    ctx.fillRect(16, boss.h - 22, 36, 10);
    ctx.fillRect(boss.w - 52, boss.h - 22, 36, 10);

    const arcColor = flash ? 'rgba(230, 194, 255, 0.95)' : 'rgba(184, 112, 255, 0.9)';
    drawBossArc(18, 58, 16 + energy * 2, game.now * 5.8, arcColor);
    drawBossArc(boss.w - 18, 58, 16 + energy * 2, game.now * 5.8 + 0.9, arcColor);
    drawBossArc(coreX, boss.h - 16, 24 + energy * 4, game.now * 4.5 + 1.2, arcColor);

    ctx.strokeStyle = flash ? 'rgba(243, 233, 255, 0.9)' : 'rgba(149, 126, 208, 0.55)';
    ctx.lineWidth = 2.4;
    ctx.strokeRect(11, 20, boss.w - 22, boss.h - 24);
    ctx.restore();
  }

  function drawProjectiles() {
    if (!game.mission) {
      return;
    }

    for (const p of game.mission.projectiles) {
      const core = p.color || '#72e8ff';
      const isCharge = (p.power || 0) > 0.35;
      if (VISUAL_FLAGS.enableBloomLikeGlow) {
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = isCharge ? '#c6ffff' : '#8ff4ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (isCharge ? 3.1 : 2.6), 0, Math.PI * 2);
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
      ctx.strokeStyle = isCharge ? '#f2ffff' : '#b8f8ff';
      ctx.lineWidth = isCharge ? 2.4 : 1.6;
      ctx.stroke();
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
      ctx.strokeStyle = '#ffd1df';
      ctx.lineWidth = 1.7;
      ctx.stroke();
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

    for (const pop of game.mission.killPops || []) {
      const alpha = pop.life / pop.maxLife;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = pop.color;
      ctx.beginPath();
      ctx.arc(pop.x, pop.y, 14 * pop.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#fff2cf';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pop.x, pop.y, 20 * pop.size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
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
    for (const p of game.mission.projectiles || []) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(18, p.r * 4.2));
      grad.addColorStop(0, 'rgba(126, 241, 255, 0.26)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(18, p.r * 4.2), 0, Math.PI * 2);
      ctx.fill();
    }
    for (const p of game.mission.enemyProjectiles || []) {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(16, p.r * 3.6));
      grad.addColorStop(0, 'rgba(255, 129, 167, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(16, p.r * 3.6), 0, Math.PI * 2);
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
      const txt = game.feedbackText || '';
      const isUnlock = /unlock/i.test(txt);
      const isFail = /failed/i.test(txt);
      const isComplete = /complete/i.test(txt);
      const icon = isUnlock ? 'UNLOCK' : isFail ? '!' : isComplete ? 'OK' : 'INFO';
      const badgeW = Math.min(WIDTH - 20, Math.max(380, Math.min(760, txt.length * 10.2)));
      const badgeX = (WIDTH - badgeW) / 2;
      const badgeY = 12;

      ctx.fillStyle = `rgba(8, 16, 28, ${Math.min(0.86, alpha)})`;
      ctx.fillRect(badgeX, badgeY, badgeW, 58);
      ctx.strokeStyle = isUnlock
        ? `rgba(130, 245, 204, ${0.66 * alpha})`
        : isFail
          ? `rgba(255, 142, 171, ${0.66 * alpha})`
          : `rgba(124, 216, 255, ${0.6 * alpha})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(badgeX, badgeY, badgeW, 58);

      const iconW = 72;
      ctx.fillStyle = isUnlock ? 'rgba(20, 63, 43, 0.78)' : isFail ? 'rgba(66, 21, 32, 0.78)' : 'rgba(20, 42, 63, 0.78)';
      ctx.fillRect(badgeX + 8, badgeY + 9, iconW, 40);
      ctx.fillStyle = isUnlock ? '#d9ffe8' : isFail ? '#ffd4df' : '#d9f7ff';
      ctx.font = 'bold 13px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(icon, badgeX + 8 + iconW / 2, badgeY + 33);

      ctx.fillStyle = '#e7f6ff';
      ctx.font = 'bold 20px Segoe UI';
      ctx.textAlign = 'left';
      ctx.fillText(txt, badgeX + 90, badgeY + 36);
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
        game.renderFx.chromaOffset = Math.min(1, game.renderFx.chromaOffset + 0.08);
      } else {
        game.renderFx.lowHpPulse *= 0.9;
        game.renderFx.chromaOffset *= 0.88;
      }
    } else {
      game.renderFx.lowHpPulse = 0;
      game.renderFx.chromaOffset = 0;
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

    if (game.renderFx.chromaOffset > 0.02) {
      const n = game.renderFx.chromaOffset;
      const left = ctx.createLinearGradient(0, 0, WIDTH * 0.3, 0);
      left.addColorStop(0, `rgba(80, 224, 255, ${0.06 + n * 0.07})`);
      left.addColorStop(1, 'rgba(80, 224, 255, 0)');
      ctx.fillStyle = left;
      ctx.fillRect(0, 0, WIDTH * 0.3, HEIGHT);

      const right = ctx.createLinearGradient(WIDTH * 0.7, 0, WIDTH, 0);
      right.addColorStop(0, 'rgba(255, 121, 170, 0)');
      right.addColorStop(1, `rgba(255, 121, 170, ${0.06 + n * 0.07})`);
      ctx.fillStyle = right;
      ctx.fillRect(WIDTH * 0.7, 0, WIDTH * 0.3, HEIGHT);
    }

    for (const flash of game.renderFx.flashEvents) {
      const alpha = (flash.life / flash.maxLife) * flash.intensity;
      ctx.fillStyle = flash.color.replace(/[\d.]+\)$/, `${alpha})`);
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

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(key)) {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.key);
  });

  window.addEventListener('blur', () => {
    clearTransientInputState();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') {
      clearTransientInputState();
    }
  });

  window.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
      mouseLeftDown = true;
      if (game.scene === 'mission' && game.mission?.mode === 'fps' && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    } else if (event.button === 2) {
      mouseRightDown = true;
      if (game.scene === 'mission' && game.mission?.mode === 'fps') {
        event.preventDefault();
        if (document.pointerLockElement !== canvas) {
          canvas.requestPointerLock?.();
        }
      }
    }
  });

  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) {
      mouseLeftDown = false;
    } else if (event.button === 2) {
      mouseRightDown = false;
    }
  });

  canvas.addEventListener('contextmenu', (event) => {
    if (game.scene === 'mission' && game.mission?.mode === 'fps') {
      event.preventDefault();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    if (game.scene === 'mission' && game.mission?.mode === 'fps' && document.pointerLockElement !== canvas) {
      clearTransientInputState();
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
  player.airDashUnlocked = profile.airDashUnlocked;
  player.airDashCharges = profile.airDashUnlocked ? player.airDashMaxCharges : 0;
  loadVisualAssets();
  saveProfile();
  updateHud();
  requestAnimationFrame(frame);
})();
