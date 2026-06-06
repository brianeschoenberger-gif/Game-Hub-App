import Phaser from "phaser";
import { createProceduralArt, TEXTURES, textureForProp as proceduralTextureForProp } from "./art";
import { goblinRoadLevel } from "./levelData";
import { SoundHooks } from "./sound";
import { assetManifest } from "./assetManifest";
import { externalAssetList, externalAssets } from "./externalAssets";
import type {
  BreakableDefinition,
  EnemyDefinition,
  EnemyKind,
  GameSnapshot,
  LevelPickup,
  PickupKind,
  PropKind,
} from "./types";

interface EnemySprite extends Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
  kind: EnemyKind;
  enemyName: string;
  hp: number;
  maxHp: number;
  speed: number;
  patrol: Phaser.Math.Vector2[];
  patrolIndex: number;
  attackCooldown: number;
  state: "patrol" | "chase" | "telegraph" | "charge" | "stunned";
  telegraphUntil: number;
  stunnedUntil: number;
  chargeUntil: number;
  chargeDirection: Phaser.Math.Vector2;
  healthBar: Phaser.GameObjects.Graphics;
}

interface PickupSprite extends Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
  kind: PickupKind;
}

interface BreakableSprite extends Phaser.Types.Physics.Arcade.SpriteWithStaticBody {
  coins: number;
  hp: number;
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
    goblinRoadGame?: Phaser.Game;
  }
}

const PLAYER_SPEED = 180;
const DASH_SPEED = 420;
const PLAYER_MAX_HP = 6;
const PLAYER_MAX_STAMINA = 100;
const ATTACK_RANGE = 72;
const ATTACK_ARC_MS = 140;

export class GameScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerShadow!: Phaser.GameObjects.Image;
  private shieldAura!: Phaser.GameObjects.Graphics;
  private swordArc!: Phaser.GameObjects.Sprite;
  private gateSprite!: Phaser.Physics.Arcade.Sprite;
  private gateCollider?: Phaser.Physics.Arcade.Collider;
  private arenaWalls: Phaser.Types.Physics.Arcade.SpriteWithStaticBody[] = [];
  private arenaLocked = false;
  private arenaResolved = false;
  private exitZone!: Phaser.GameObjects.Zone;
  private enemies!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private obstacles!: Phaser.Physics.Arcade.StaticGroup;
  private breakables!: Phaser.Physics.Arcade.StaticGroup;
  private chest!: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
  private hud!: Phaser.GameObjects.Container;
  private heartHud!: Phaser.GameObjects.Graphics;
  private staminaHud!: Phaser.GameObjects.Graphics;
  private objectiveText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private centerText!: Phaser.GameObjects.Text;
  private tooltipText!: Phaser.GameObjects.Text;
  private helpText!: Phaser.GameObjects.Text;
  private zoneText!: Phaser.GameObjects.Text;
  private bossBar!: Phaser.GameObjects.Container;
  private bossBarFill!: Phaser.GameObjects.Graphics;
  private objectiveArrow!: Phaser.GameObjects.Graphics;
  private minimap!: Phaser.GameObjects.Graphics;
  private dialoguePrompts: Array<{ label: Phaser.GameObjects.Text; x: number; y: number; range: number }> = [];
  private soundHooks = new SoundHooks();
  private playerHp = PLAYER_MAX_HP;
  private stamina = PLAYER_MAX_STAMINA;
  private coins = 0;
  private hasKey = false;
  private gateOpen = false;
  private won = false;
  private pausedByPlayer = false;
  private attacking = false;
  private lastAttackAt = -999;
  private lastPlayerHitAt = -999;
  private invincibleUntil = 0;
  private dashUntil = 0;
  private dashCooldownUntil = 0;
  private blocking = false;
  private pointerBlocking = false;
  private facing = new Phaser.Math.Vector2(1, 0);
  private captainDefeated = false;
  private objective = "Find the stolen Sunstone Key.";

  constructor() {
    super("GameScene");
  }

  preload(): void {
    for (const asset of externalAssetList) {
      this.load.image(asset.key, asset.path);
    }
  }

  create(): void {
    createProceduralArt(this);
    this.physics.world.setBounds(0, 0, goblinRoadLevel.world.width, goblinRoadLevel.world.height);
    this.cameras.main.setBounds(0, 0, goblinRoadLevel.world.width, goblinRoadLevel.world.height);
    this.cameras.main.setBackgroundColor("#77b85c");

    this.drawGround();
    this.obstacles = this.physics.add.staticGroup();
    this.breakables = this.physics.add.staticGroup();
    this.pickups = this.physics.add.group();
    this.enemies = this.physics.add.group();

    this.createAssetDiorama();
    this.createProps();
    this.createVillageEntrance();
    this.createArenaWalls();
    this.createBreakables();
    this.createPickups();
    this.createGate();
    this.createExit();
    this.createPlayer();
    this.createEnemies();
    this.createChest();
    this.createHud();
    this.createInput();
    this.createCollisions();
    this.installTestHooks();

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.updateObjective("Find the stolen Sunstone Key.");
  }

  update(time: number, delta: number): void {
    if (this.won || this.pausedByPlayer) return;
    this.updatePlayer(time);
    this.updateEnemies(time, delta / 1000);
    this.updateEnemyHealthBars();
    this.checkArenaLock();
    this.checkDialoguePrompts();
    this.checkGate();
    this.updateBossBar();
    this.updateHud();
  }

  private drawGround(): void {
    this.add
      .tileSprite(
        goblinRoadLevel.world.width / 2,
        goblinRoadLevel.world.height / 2,
        goblinRoadLevel.world.width,
        goblinRoadLevel.world.height,
        externalAssets.grass.key,
      )
      .setDepth(-130);

    const graphics = this.add.graphics();
    graphics.setDepth(-110);
    graphics.fillStyle(0x6f9f4c);
    graphics.fillRect(0, 0, goblinRoadLevel.world.width, goblinRoadLevel.world.height).setAlpha(0.32);

    for (let y = 0; y < goblinRoadLevel.world.height; y += 64) {
      for (let x = 0; x < goblinRoadLevel.world.width; x += 64) {
        if ((x / 64 + y / 64) % 2 === 0) {
          graphics.fillStyle(0x87ca66, 0.28);
          graphics.fillRect(x, y, 64, 64);
        }
        if ((x * 17 + y * 11) % 5 === 0) {
          graphics.fillStyle(0xf4d36b, 0.55);
          graphics.fillCircle(x + 18, y + 22, 3);
          graphics.fillStyle(0xffffff, 0.5);
          graphics.fillCircle(x + 28, y + 39, 2);
        }
        if ((x * 7 + y * 13) % 7 === 0) {
          graphics.fillStyle(0x5a8d50, 0.42);
          graphics.fillRoundedRect(x + 42, y + 17, 18, 8, 4);
        }
      }
    }

    graphics.lineStyle(112, 0xc98e4e, 1);
    const path = new Phaser.Curves.Path(goblinRoadLevel.paths[0].x, goblinRoadLevel.paths[0].y);
    for (let i = 1; i < goblinRoadLevel.paths.length; i += 1) {
      const prev = goblinRoadLevel.paths[i - 1];
      const point = goblinRoadLevel.paths[i];
      path.quadraticBezierTo((prev.x + point.x) / 2, point.y, point.x, point.y);
    }
    path.draw(graphics);
    graphics.lineStyle(78, 0xd9a360, 1);
    path.draw(graphics);
    graphics.lineStyle(8, 0xb8763f, 0.24);
    path.draw(graphics);

    graphics.fillStyle(0x92d071, 0.62);
    for (const clearing of goblinRoadLevel.clearings) {
      graphics.fillCircle(clearing.x, clearing.y, clearing.radius);
      graphics.lineStyle(8, 0xb7b067, 0.45);
      graphics.strokeCircle(clearing.x, clearing.y, clearing.radius - 12);
    }

    graphics.fillStyle(0x5f7962, 0.34);
    graphics.fillRoundedRect(1700, 450, 500, 420, 42);
    graphics.fillStyle(0x787f79, 0.48);
    graphics.fillRoundedRect(1970, 485, 175, 330, 28);

    this.add
      .tileSprite(190, 1120, 620, 300, externalAssets.water.key)
      .setDepth(-125)
      .setAlpha(0.96);
    this.add
      .tileSprite(2110, 1030, 410, 260, externalAssets.water.key)
      .setDepth(-125)
      .setAlpha(0.96);
    this.add.rectangle(1150, -40, 2400, 190, 0x11131c, 0.36).setDepth(-70);
    this.add.rectangle(1150, 1365, 2400, 250, 0x11131c, 0.28).setDepth(-70);
    this.add.rectangle(-45, 660, 130, 1360, 0x11131c, 0.24).setDepth(-70);
    this.add.rectangle(2350, 660, 150, 1360, 0x11131c, 0.3).setDepth(-70);
    this.add.rectangle(1150, 660, 2300, 1320, 0x7a4b22, 0.08).setDepth(-65);
  }

  private createAssetDiorama(): void {
    const addAsset = (
      key: string,
      x: number,
      y: number,
      scale: number,
      depthOffset = 0,
      alpha = 1,
    ): Phaser.GameObjects.Image => {
      const image = this.add.image(x, y, key).setScale(scale).setDepth(y + depthOffset).setAlpha(alpha);
      image.setOrigin(0.5, 1);
      return image;
    };

    addAsset(externalAssets.house1.key, 255, 492, 2.1, 10);
    addAsset(externalAssets.house2.key, 500, 540, 1.9, 12);
    addAsset(externalAssets.church.key, 790, 420, 1.45, 8);
    addAsset(externalAssets.house2.key, 1845, 505, 1.55, 8, 0.92).setTint(0xd7c6a6);

    for (const [x, y, key, scale] of [
      [108, 960, externalAssets.terrain4.key, 1.85],
      [272, 1030, externalAssets.terrain3.key, 1.85],
      [1965, 945, externalAssets.terrain4.key, 1.95],
      [2145, 895, externalAssets.terrain3.key, 1.9],
    ] as const) {
      addAsset(key, x, y, scale, -20);
    }

    addAsset(externalAssets.bridge.key, 238, 900, 2.1, 4);
    addAsset(externalAssets.bridge.key, 2050, 850, 2.0, 4);
    addAsset(externalAssets.stairs.key, 1738, 807, 1.8, 2);

    this.createFarmPatch(480, 835, 4, 3);
    this.createFarmPatch(870, 880, 5, 3);
    this.createFarmPatch(1245, 515, 3, 2);

    const forest = [
      [250, 245, externalAssets.tree1.key],
      [390, 310, externalAssets.tree2.key],
      [575, 250, externalAssets.tree3.key],
      [950, 270, externalAssets.tree1.key],
      [1370, 250, externalAssets.tree2.key],
      [1580, 330, externalAssets.tree3.key],
      [1910, 300, externalAssets.tree1.key],
      [2110, 330, externalAssets.tree2.key],
      [380, 1085, externalAssets.tree1.key],
      [590, 1110, externalAssets.tree2.key],
      [900, 1080, externalAssets.tree3.key],
      [1470, 1090, externalAssets.tree1.key],
      [1850, 1035, externalAssets.tree2.key],
      [2160, 1030, externalAssets.tree3.key],
    ] as const;
    for (const [x, y, key] of forest) {
      addAsset(key, x, y, 1.95, 8);
    }

    for (const [x, y, key] of [
      [615, 822, externalAssets.grassDetail1.key],
      [720, 895, externalAssets.grassDetail2.key],
      [1010, 520, externalAssets.grassDetail1.key],
      [1315, 782, externalAssets.groundDetail1.key],
      [1515, 655, externalAssets.groundDetail2.key],
      [2020, 645, externalAssets.waterDetail1.key],
      [2105, 725, externalAssets.waterDetail2.key],
    ] as const) {
      addAsset(key, x, y, 2.4, -30, 0.9);
    }
  }

  private createFarmPatch(x: number, y: number, columns: number, rows: number): void {
    const graphics = this.add.graphics().setDepth(y - 16);
    const width = columns * 54;
    const height = rows * 46;
    graphics.fillStyle(0x8f6238, 0.55);
    graphics.fillRoundedRect(x - width / 2, y - height, width, height, 8);
    graphics.lineStyle(5, 0x7b4a27, 0.5);
    for (let row = 0; row < rows; row += 1) {
      graphics.lineBetween(x - width / 2 + 10, y - height + row * 46 + 23, x + width / 2 - 10, y - height + row * 46 + 23);
    }
    for (let col = 0; col < columns; col += 1) {
      for (let row = 0; row < rows; row += 1) {
        const sproutX = x - width / 2 + 27 + col * 54;
        const sproutY = y - height + 24 + row * 46;
        const crop = this.add.image(sproutX, sproutY, externalAssets.grassDetail2.key).setScale(2.1).setDepth(sproutY);
        crop.setOrigin(0.5, 1);
      }
    }
  }

  private createVillageEntrance(): void {
    const g = this.add.graphics();
    g.fillStyle(0x8b5a34);
    g.fillRoundedRect(22, 545, 78, 260, 16);
    g.fillRoundedRect(98, 545, 60, 45, 12);
    g.fillRoundedRect(98, 760, 60, 45, 12);
    g.fillStyle(0xc64d41);
    g.fillTriangle(22, 545, 61, 500, 100, 545);
    g.fillStyle(0xf4d36b);
    g.fillCircle(61, 610, 10);
    g.setDepth(1);
  }

  private createProps(): void {
    for (const prop of goblinRoadLevel.props) {
      const texture = this.textureForProp(prop.kind);
      const sprite = this.add.image(prop.x, prop.y, texture).setDepth(prop.y);
      sprite.setOrigin(0.5, prop.kind === "tree" || prop.kind === "ruin" ? 1 : 0.5);
      if (this.isExternalPropTexture(texture)) {
        sprite.setScale(prop.kind === "tree" ? 1.75 : prop.kind === "fence" ? 2.0 : prop.kind === "rock" || prop.kind === "ruin" ? 1.25 : 1.7);
      }
      if (prop.width && prop.height) {
        sprite.setDisplaySize(prop.width, prop.height);
      }
      if (prop.kind === "torch") {
        this.tweens.add({
          targets: sprite,
          alpha: 0.68,
          yoyo: true,
          repeat: -1,
          duration: 360,
        });
      } else if (prop.kind === "banner") {
        this.tweens.add({
          targets: sprite,
          angle: 3,
          yoyo: true,
          repeat: -1,
          duration: 980,
          ease: "sine.inOut",
        });
      }
      if (prop.text) {
        const label = this.add
          .text(prop.x, prop.y - 64, prop.text, {
            fontFamily: "system-ui, sans-serif",
            fontSize: "16px",
            color: "#fff6d9",
            backgroundColor: "rgba(46, 34, 22, 0.72)",
            padding: { x: 10, y: 8 },
            align: "center",
          })
          .setOrigin(0.5)
          .setDepth(2000)
          .setVisible(false);
        label.setScrollFactor(1);
        this.dialoguePrompts.push({ label, x: prop.x, y: prop.y, range: 135 });
      }
      if (prop.collides) {
        const zone = this.add.zone(prop.x, prop.y + 12, prop.width ?? 52, prop.height ?? 42);
        this.physics.add.existing(zone, true);
        this.obstacles.add(zone);
      }
    }
  }

  private textureForProp(kind: PropKind): string {
    if (kind === "tree") return Phaser.Math.Between(0, 2) === 0 ? externalAssets.tree1.key : Phaser.Math.Between(0, 1) === 0 ? externalAssets.tree2.key : externalAssets.tree3.key;
    if (kind === "fence") return Phaser.Math.Between(0, 1) === 0 ? externalAssets.fence1.key : externalAssets.fence2.key;
    if (kind === "rock" || kind === "ruin") return externalAssets.terrain3.key;
    if (kind === "bush") return externalAssets.grassDetail1.key;
    return proceduralTextureForProp(kind);
  }

  private isExternalPropTexture(texture: string): boolean {
    return externalAssetList.some((asset) => asset.key === texture);
  }

  private createBreakables(): void {
    for (const entry of goblinRoadLevel.breakables) {
      const sprite = this.breakables
        .create(entry.x, entry.y, entry.kind === "crate" ? TEXTURES.crate : TEXTURES.barrel)
        .setDepth(entry.y) as BreakableSprite;
      sprite.coins = entry.coins ?? 0;
      sprite.hp = 1;
      sprite.refreshBody();
    }
  }

  private createArenaWalls(): void {
    const wallDefs = [
      { x: 930, y: 660, width: 46, height: 290, angle: -4 },
      { x: 1395, y: 660, width: 46, height: 290, angle: 4 },
    ];
    for (const def of wallDefs) {
      const wall = this.physics.add.staticSprite(def.x, def.y, "prop-ruin") as Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
      wall.setDisplaySize(def.width, def.height).setAngle(def.angle).setDepth(def.y + 160).setAlpha(0);
      wall.refreshBody();
      wall.disableBody(true, true);
      this.obstacles.add(wall);
      this.arenaWalls.push(wall);
    }
  }

  private createPickups(): void {
    for (const pickup of goblinRoadLevel.pickups) {
      this.spawnPickup(pickup);
    }
  }

  private spawnPickup(pickup: LevelPickup): PickupSprite {
    const key = pickup.kind === "coin" ? TEXTURES.coin : pickup.kind === "heart" ? TEXTURES.heart : TEXTURES.key;
    const sprite = this.pickups.create(pickup.x, pickup.y, key) as PickupSprite;
    sprite.kind = pickup.kind;
    sprite.setDepth(pickup.y);
    sprite.body.setCircle(15);
    this.tweens.add({ targets: sprite, y: pickup.y - 8, duration: 760, yoyo: true, repeat: -1, ease: "sine.inOut" });
    return sprite;
  }

  private createGate(): void {
    this.gateSprite = this.physics.add
      .sprite(goblinRoadLevel.gate.x, goblinRoadLevel.gate.y, TEXTURES.gateClosed)
      .setImmovable(true)
      .setDepth(goblinRoadLevel.gate.y + 120);
    this.gateSprite.body?.setSize(goblinRoadLevel.gate.width, goblinRoadLevel.gate.height);
  }

  private createExit(): void {
    const { x, y, radius } = goblinRoadLevel.exit;
    const glow = this.add.graphics();
    glow.fillStyle(0xffd86b, 0.18);
    glow.fillCircle(x, y, radius + 34);
    glow.fillStyle(0xfff0a4, 0.45);
    glow.fillCircle(x, y, radius);
    glow.setDepth(y - 20);
    this.tweens.add({ targets: glow, alpha: 0.45, duration: 760, yoyo: true, repeat: -1 });

    this.add
      .text(x, y - 118, "Ancient Watchtower", {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#fff2ba",
        stroke: "#3b2a1c",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(3000);
    this.exitZone = this.add.zone(x, y, radius * 2, radius * 2);
    this.physics.add.existing(this.exitZone, true);
  }

  private createPlayer(): void {
    const { x, y } = goblinRoadLevel.playerStart;
    this.playerShadow = this.add.image(x, y + 19, TEXTURES.shadow).setDepth(y - 1);
    this.player = this.physics.add.sprite(x, y, TEXTURES.player).setDepth(y);
    this.player.body.setCircle(18, 14, 28);
    this.player.setCollideWorldBounds(true);

    this.shieldAura = this.add.graphics().setDepth(4999).setVisible(false);
    this.swordArc = this.add.sprite(x, y, TEXTURES.sword).setVisible(false).setDepth(5000);
  }

  private createEnemies(): void {
    for (const def of goblinRoadLevel.enemies) {
      this.spawnEnemy(def);
    }
  }

  private spawnEnemy(def: EnemyDefinition): EnemySprite {
    const texture = def.kind === "captain" ? TEXTURES.captain : TEXTURES.goblin;
    const enemy = this.enemies.create(def.x, def.y, texture) as EnemySprite;
    enemy.kind = def.kind;
    enemy.enemyName = def.name;
    enemy.hp = def.kind === "captain" ? 5 : 2;
    enemy.maxHp = enemy.hp;
    enemy.speed = def.kind === "captain" ? 92 : 76;
    enemy.patrol = def.patrol;
    enemy.patrolIndex = 0;
    enemy.attackCooldown = 0;
    enemy.state = "patrol";
    enemy.telegraphUntil = 0;
    enemy.stunnedUntil = 0;
    enemy.chargeUntil = 0;
    enemy.chargeDirection = new Phaser.Math.Vector2(0, 0);
    enemy.healthBar = this.add.graphics().setDepth(6000);
    enemy.body.setCircle(17, 12, 22);
    enemy.setDepth(def.y);
    return enemy;
  }

  private createChest(): void {
    this.chest = this.physics.add.staticSprite(1355, 642, TEXTURES.chest).setDepth(642);
    this.chest.refreshBody();
  }

  private createInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,E,SPACE,SHIFT,P,F,R,M,ENTER") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard?.on("keydown-P", () => this.togglePause());
    this.input.keyboard?.on("keydown-F", () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });
    this.input.keyboard?.on("keydown-M", () => {
      const muted = this.soundHooks.toggleMute();
      this.floatText(this.player.x, this.player.y - 52, muted ? "Sound off" : "Sound on", "#fff8dc");
    });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.won || this.pausedByPlayer) return;
      if (pointer.rightButtonDown()) {
        this.pointerBlocking = true;
        return;
      }
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.facing = new Phaser.Math.Vector2(world.x - this.player.x, world.y - this.player.y).normalize();
      this.attack(this.time.now);
    });
    this.input.on("pointerup", () => {
      this.pointerBlocking = false;
    });
  }

  private createCollisions(): void {
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.player, this.breakables);
    this.gateCollider = this.physics.add.collider(this.player, this.gateSprite);
    this.physics.add.collider(this.enemies, this.obstacles);
    this.physics.add.collider(this.enemies, this.breakables);
    this.physics.add.collider(this.enemies, this.gateSprite);
    this.physics.add.overlap(this.player, this.pickups, (_, pickup) => this.collectPickup(pickup as PickupSprite));
    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => this.damagePlayer(enemy as EnemySprite));
    this.physics.add.overlap(this.player, this.exitZone, () => this.tryWin());
  }

  private createHud(): void {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(10000);
    const bg = this.add.graphics();
    bg.fillStyle(0x241c16, 0.76);
    bg.fillRoundedRect(14, 12, 590, 108, 8);
    bg.lineStyle(2, 0xffd86b, 0.72);
    bg.strokeRoundedRect(14, 12, 590, 108, 8);
    bg.fillStyle(0x0e1017, 0.84);
    bg.fillRoundedRect(28, 25, 72, 72, 6);
    bg.lineStyle(4, 0xb96f38, 1);
    bg.strokeRoundedRect(28, 25, 72, 72, 6);
    const portrait = this.add.image(64, 64, TEXTURES.player).setScale(0.8);
    this.heartHud = this.add.graphics();
    this.staminaHud = this.add.graphics();
    this.statsText = this.add.text(118, 72, "", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: "#fff8dc",
    });
    this.objectiveText = this.add.text(118, 92, "", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: "#f4d777",
      wordWrap: { width: 455 },
    });
    this.tooltipText = this.add
      .text(640, 640, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        color: "#fff8dc",
        backgroundColor: "rgba(36, 28, 22, 0.78)",
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.helpText = this.add
      .text(640, 24, "E / Right-click block   Shift dash   P pause   F fullscreen   R restart   M mute", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "15px",
        color: "#fff8dc",
        backgroundColor: "rgba(36, 28, 22, 0.56)",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.88);
    this.zoneText = this.add
      .text(30, 127, "", {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#fff1ba",
        stroke: "#342418",
        strokeThickness: 4,
      })
      .setAlpha(0.95);
    this.centerText = this.add
      .text(640, 360, "", {
        fontFamily: "Georgia, serif",
        fontSize: "44px",
        color: "#fff3b8",
        stroke: "#342418",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.objectiveArrow = this.add.graphics();
    this.minimap = this.add.graphics();
    this.createBossBar();
    this.hud.add([
      bg,
      this.statsText,
      this.objectiveText,
      this.zoneText,
      this.helpText,
      this.tooltipText,
      this.centerText,
      this.objectiveArrow,
      this.minimap,
      this.bossBar,
      portrait,
      this.heartHud,
      this.staminaHud,
    ]);
    this.updateHud();
  }

  private createBossBar(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x241c16, 0.82);
    bg.fillRoundedRect(0, 0, 360, 34, 8);
    bg.lineStyle(2, 0xffd86b, 0.72);
    bg.strokeRoundedRect(0, 0, 360, 34, 8);
    this.bossBarFill = this.add.graphics();
    const label = this.add
      .text(180, 17, "Goblin Captain", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "15px",
        color: "#fff8dc",
      })
      .setOrigin(0.5);
    this.bossBar = this.add.container(460, 665, [bg, this.bossBarFill, label]).setVisible(false);
  }

  private updatePlayer(time: number): void {
    const body = this.player.body;
    const direction = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left?.isDown || this.keys.A.isDown) direction.x -= 1;
    if (this.cursors.right?.isDown || this.keys.D.isDown) direction.x += 1;
    if (this.cursors.up?.isDown || this.keys.W.isDown) direction.y -= 1;
    if (this.cursors.down?.isDown || this.keys.S.isDown) direction.y += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.facing = direction.clone();
    }

    this.blocking = this.keys.E.isDown || this.pointerBlocking;
    const staminaRegen = this.blocking ? 0.18 : 0.38;
    this.stamina = Math.min(PLAYER_MAX_STAMINA, this.stamina + staminaRegen);

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) &&
      time > this.dashCooldownUntil &&
      direction.lengthSq() > 0 &&
      this.stamina >= 28
    ) {
      this.dashUntil = time + 160;
      this.dashCooldownUntil = time + 720;
      this.stamina -= 28;
      this.soundHooks.play("dash");
    }

    const speed = time < this.dashUntil ? DASH_SPEED : this.blocking ? PLAYER_SPEED * 0.52 : PLAYER_SPEED;
    body.setVelocity(direction.x * speed, direction.y * speed);
    if (direction.x !== 0) this.player.setFlipX(direction.x < 0);
    this.player.setAngle(direction.lengthSq() > 0 ? Math.sin(time / 90) * 1.8 : 0);
    this.player.setDepth(this.player.y);
    this.playerShadow.setPosition(this.player.x, this.player.y + 19).setDepth(this.player.y - 1);
    this.drawShieldAura();

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.attack(time);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
      this.scene.restart();
    }
  }

  private drawShieldAura(): void {
    this.shieldAura.clear();
    this.shieldAura.setVisible(this.blocking && this.stamina > 0);
    if (!this.shieldAura.visible) return;
    const angle = this.facing.angle();
    const x = this.player.x + Math.cos(angle) * 24;
    const y = this.player.y + Math.sin(angle) * 24;
    this.shieldAura.fillStyle(0xd8edf4, 0.22);
    this.shieldAura.fillCircle(x, y, 24);
    this.shieldAura.lineStyle(4, 0xfff1a8, 0.85);
    this.shieldAura.beginPath();
    this.shieldAura.arc(x, y, 24, angle - 0.9, angle + 0.9);
    this.shieldAura.strokePath();
  }

  private attack(time: number): void {
    if (time - this.lastAttackAt < 260 || this.attacking) return;
    this.lastAttackAt = time;
    this.attacking = true;
    this.soundHooks.play("attack");

    const angle = this.facing.angle();
    const swingX = this.player.x + Math.cos(angle) * 30;
    const swingY = this.player.y + Math.sin(angle) * 30;
    this.swordArc
      .setVisible(true)
      .setPosition(swingX, swingY)
      .setRotation(angle)
      .setScale(1)
      .setAlpha(1);
    this.tweens.add({
      targets: this.swordArc,
      scale: 1.18,
      alpha: 0,
      duration: ATTACK_ARC_MS,
      onComplete: () => {
        this.swordArc.setVisible(false);
        this.attacking = false;
      },
    });

    this.damageEnemiesInFront();
    this.hitBreakablesInFront();
    this.hitChestInFront();
  }

  private isInAttackRange(target: Phaser.GameObjects.Components.Transform): boolean {
    const toTarget = new Phaser.Math.Vector2(target.x - this.player.x, target.y - this.player.y);
    const distance = toTarget.length();
    if (distance > ATTACK_RANGE) return false;
    if (distance < 28) return true;
    return this.facing.dot(toTarget.normalize()) > 0.22;
  }

  private damageEnemiesInFront(): void {
    this.enemies.children.each((child) => {
      const enemy = child as EnemySprite;
      if (!enemy.active || !this.isInAttackRange(enemy)) return true;
      enemy.hp -= 1;
      this.soundHooks.play("enemyHit");
      this.floatText(enemy.x, enemy.y - 36, "-1", "#fff0a6");
      enemy.state = "stunned";
      enemy.stunnedUntil = this.time.now + 240;
      const knock = new Phaser.Math.Vector2(enemy.x - this.player.x, enemy.y - this.player.y).normalize().scale(190);
      enemy.body.setVelocity(knock.x, knock.y);
      enemy.setTintFill(0xffffff);
      this.time.delayedCall(80, () => enemy.clearTint());
      this.hitStop(42);
      if (enemy.hp <= 0) this.defeatEnemy(enemy);
      return true;
    });
  }

  private hitBreakablesInFront(): void {
    this.breakables.children.each((child) => {
      const prop = child as BreakableSprite;
      if (!prop.active || !this.isInAttackRange(prop)) return true;
      this.breakProp(prop);
      return true;
    });
  }

  private hitChestInFront(): void {
    if (!this.chest.active || !this.isInAttackRange(this.chest)) return;
    this.chest.disableBody(true, true);
    this.floatText(this.chest.x, this.chest.y - 30, "+5 coins", "#ffe083");
    for (let i = 0; i < 5; i += 1) {
      this.spawnPickup({ kind: "coin", x: this.chest.x + i * 18 - 36, y: this.chest.y + Phaser.Math.Between(-18, 18) });
    }
  }

  private breakProp(prop: BreakableSprite): void {
    prop.disableBody(true, true);
    this.floatText(prop.x, prop.y - 25, "crack", "#f4d1a0");
    for (let i = 0; i < prop.coins; i += 1) {
      this.spawnPickup({ kind: "coin", x: prop.x + Phaser.Math.Between(-18, 18), y: prop.y + Phaser.Math.Between(-18, 18) });
    }
  }

  private defeatEnemy(enemy: EnemySprite): void {
    const wasCaptain = enemy.kind === "captain";
    enemy.healthBar.destroy();
    enemy.disableBody(true, true);
    if (Phaser.Math.Between(0, 100) > 45) {
      this.spawnPickup({ kind: "coin", x: enemy.x, y: enemy.y });
    }
    if (wasCaptain && !this.captainDefeated) {
      this.captainDefeated = true;
      this.spawnPickup({ kind: "key", x: enemy.x + 28, y: enemy.y });
      this.updateObjective("Claim the Sunstone Key.");
      this.unlockArena();
      this.cameras.main.pan(enemy.x + 28, enemy.y, 420, "Sine.easeInOut", false, (_camera, progress) => {
        if (progress === 1) this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      });
      this.particles(enemy.x, enemy.y, 0xffd86b);
    }
  }

  private updateEnemies(time: number, dt: number): void {
    this.enemies.children.each((child) => {
      const enemy = child as EnemySprite;
      if (!enemy.active) return true;
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (time < enemy.stunnedUntil) {
        enemy.body.velocity.scale(0.88);
        enemy.setDepth(enemy.y);
        return true;
      }
      if (enemy.state === "telegraph") {
        enemy.body.setVelocity(0, 0);
        enemy.setTint(enemy.kind === "captain" ? 0xff7a4c : 0xffd36a);
        if (time >= enemy.telegraphUntil) {
          enemy.clearTint();
          if (enemy.kind === "captain") {
            enemy.state = "charge";
            enemy.chargeUntil = time + 380;
            enemy.chargeDirection = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y).normalize();
          } else if (distance < 52) {
            enemy.state = "chase";
            this.damagePlayer(enemy);
          } else {
            enemy.state = "chase";
          }
        }
        return true;
      }
      if (enemy.state === "charge") {
        enemy.body.setVelocity(enemy.chargeDirection.x * 245, enemy.chargeDirection.y * 245);
        enemy.setDepth(enemy.y);
        if (distance < 42) this.damagePlayer(enemy);
        if (time >= enemy.chargeUntil) {
          enemy.state = "stunned";
          enemy.stunnedUntil = time + 320;
          enemy.attackCooldown = time + 1100;
          enemy.body.setVelocity(0, 0);
        }
        return true;
      }
      const target = new Phaser.Math.Vector2(enemy.x, enemy.y);
      if (distance < 285) {
        enemy.state = "chase";
        target.set(this.player.x, this.player.y);
      } else {
        enemy.state = "patrol";
        const patrolTarget = enemy.patrol[enemy.patrolIndex];
        target.copy(patrolTarget);
        if (Phaser.Math.Distance.Between(enemy.x, enemy.y, patrolTarget.x, patrolTarget.y) < 16) {
          enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrol.length;
        }
      }
      const velocity = target.subtract(new Phaser.Math.Vector2(enemy.x, enemy.y)).normalize().scale(enemy.speed);
      enemy.body.velocity.lerp(velocity, Math.min(1, dt * 4));
      enemy.setDepth(enemy.y);
      if (distance < (enemy.kind === "captain" ? 135 : 46) && time > enemy.attackCooldown) {
        enemy.attackCooldown = time + (enemy.kind === "captain" ? 1500 : 850);
        enemy.state = "telegraph";
        enemy.telegraphUntil = time + (enemy.kind === "captain" ? 520 : 300);
      }
      return true;
    });
  }

  private damagePlayer(enemy: EnemySprite): void {
    const time = this.time.now;
    if (time < this.invincibleUntil || time - this.lastPlayerHitAt < 720 || !enemy.active) return;
    this.lastPlayerHitAt = time;
    this.invincibleUntil = time + 980;
    const incoming = enemy.kind === "captain" ? 2 : 1;
    const blocked = this.blocking && this.stamina >= 12 && this.isFacing(enemy);
    if (blocked) {
      this.stamina = Math.max(0, this.stamina - 18);
      this.soundHooks.play("enemyHit");
      this.floatText(this.player.x, this.player.y - 38, "Blocked", "#bff3ff");
      this.cameras.main.shake(55, 0.002);
      return;
    }
    this.playerHp = Math.max(0, this.playerHp - incoming);
    this.soundHooks.play("playerHit");
    this.cameras.main.shake(90, 0.006);
    this.floatText(this.player.x, this.player.y - 38, "Ouch!", "#ff9b91");
    const knock = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y).normalize().scale(220);
    this.player.body.setVelocity(knock.x, knock.y);
    this.tweens.add({
      targets: this.player,
      alpha: 0.35,
      yoyo: true,
      repeat: 5,
      duration: 70,
      onComplete: () => this.player.setAlpha(1),
    });
    if (this.playerHp <= 0) this.gameOver();
  }

  private isFacing(target: Phaser.GameObjects.Components.Transform): boolean {
    const toTarget = new Phaser.Math.Vector2(target.x - this.player.x, target.y - this.player.y);
    if (toTarget.lengthSq() === 0) return true;
    return this.facing.dot(toTarget.normalize()) > 0.2;
  }

  private checkArenaLock(): void {
    if (this.arenaResolved || this.arenaLocked || this.captainDefeated) return;
    if (this.player.x > 965 && this.player.x < 1375 && this.player.y > 430 && this.player.y < 880) {
      this.arenaLocked = true;
      for (const wall of this.arenaWalls) {
        wall.enableBody(false, wall.x, wall.y, true, true).setAlpha(0.95);
        wall.refreshBody();
      }
      this.updateObjective("Defeat the captain and recover the Sunstone Key.");
      this.tooltipText.setText("The clearing seals behind you. Defeat the captain.").setVisible(true);
      this.time.delayedCall(1800, () => this.tooltipText.setVisible(false));
      this.cameras.main.shake(120, 0.004);
    }
  }

  private unlockArena(): void {
    if (!this.arenaLocked) return;
    this.arenaResolved = true;
    this.arenaLocked = false;
    for (const wall of this.arenaWalls) {
      this.tweens.add({
        targets: wall,
        alpha: 0,
        y: wall.y + 24,
        duration: 360,
        onComplete: () => wall.disableBody(true, true),
      });
    }
  }

  private collectPickup(pickup: PickupSprite): void {
    if (!pickup.active) return;
    if (pickup.kind === "coin") {
      this.coins += 1;
      this.soundHooks.play("coin");
      this.particles(pickup.x, pickup.y, 0xffd86b);
    }
    if (pickup.kind === "heart") {
      this.playerHp = Math.min(PLAYER_MAX_HP, this.playerHp + 2);
      this.soundHooks.play("heart");
      this.particles(pickup.x, pickup.y, 0xff6b72);
    }
    if (pickup.kind === "key") {
      this.hasKey = true;
      this.soundHooks.play("key");
      this.updateObjective("Open the locked ruin gate.");
      this.particles(pickup.x, pickup.y, 0xfff0a4);
    }
    pickup.disableBody(true, true);
  }

  private checkGate(): void {
    if (this.gateOpen) return;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, goblinRoadLevel.gate.x, goblinRoadLevel.gate.y);
    this.tooltipText.setVisible(false);
    if (distance < 120) {
      if (this.hasKey) {
        this.openGate();
      } else {
        this.tooltipText.setText("The Sunstone Gate is locked. Find the key.");
        this.tooltipText.setVisible(true);
      }
    }
  }

  private openGate(): void {
    this.gateOpen = true;
    this.gateSprite.setTexture(TEXTURES.gateOpen).setPosition(goblinRoadLevel.gate.x + 18, goblinRoadLevel.gate.y);
    this.gateCollider?.destroy();
    this.gateSprite.disableBody(false, false);
    this.soundHooks.play("gateOpen");
    this.updateObjective("Reach the ancient watchtower.");
    this.particles(this.gateSprite.x, this.gateSprite.y, 0xffd86b);
    this.cameras.main.flash(220, 255, 224, 126, false);
  }

  private tryWin(): void {
    if (!this.gateOpen || this.won) return;
    this.won = true;
    this.player.body.setVelocity(0, 0);
    this.soundHooks.play("victory");
    this.updateObjective("Enter the Sunken Watchtower.");
    this.centerText.setText("The road is open.\nEntering The Sunken Watchtower...").setVisible(true);
    this.cameras.main.flash(280, 255, 238, 164, false);
    this.time.delayedCall(900, () => this.scene.start("DungeonScene"));
  }

  private gameOver(): void {
    this.won = true;
    this.player.body.setVelocity(0, 0);
    this.centerText.setText("You were driven back.\nPress R to try again.").setVisible(true);
    this.input.keyboard?.once("keydown-R", () => this.scene.restart());
  }

  private togglePause(): void {
    if (this.won) return;
    this.pausedByPlayer = !this.pausedByPlayer;
    this.centerText.setText(this.pausedByPlayer ? "Paused" : "").setVisible(this.pausedByPlayer);
    if (!this.pausedByPlayer) this.updateHud();
  }

  private updateObjective(text: string): void {
    this.objective = text;
    if (this.objectiveText) this.objectiveText.setText(`Objective: ${text}`);
  }

  private checkDialoguePrompts(): void {
    for (const prompt of this.dialoguePrompts) {
      const near = Phaser.Math.Distance.Between(this.player.x, this.player.y, prompt.x, prompt.y) < prompt.range;
      prompt.label.setVisible(near);
    }
  }

  private updateHud(): void {
    const hpPips = "#".repeat(this.playerHp).padEnd(PLAYER_MAX_HP, "-");
    const staminaPips = "|".repeat(Math.round(this.stamina / 12.5)).padEnd(8, ".");
    const mute = this.soundHooks.isMuted() ? "Muted" : "Sound";
    this.statsText.setText(`Coins ${this.coins}   Key ${this.hasKey ? "Sunstone" : "None"}   ${mute}`);
    this.objectiveText.setText(`Objective: ${this.objective}`);
    this.drawStatusPips(hpPips, staminaPips);
    this.zoneText.setText(this.currentZoneName());
    this.drawObjectiveArrow();
    this.drawMinimap();
  }

  private drawStatusPips(hpPips: string, staminaPips: string): void {
    this.heartHud.clear();
    this.staminaHud.clear();
    for (let i = 0; i < PLAYER_MAX_HP; i += 1) {
      const x = 120 + i * 26;
      const y = 36;
      this.heartHud.fillStyle(hpPips[i] === "#" ? 0xe53642 : 0x3d4046, 1);
      this.heartHud.fillCircle(x - 5, y - 3, 7);
      this.heartHud.fillCircle(x + 5, y - 3, 7);
      this.heartHud.fillTriangle(x - 12, y, x + 12, y, x, y + 15);
      this.heartHud.lineStyle(2, 0x1c1010, 0.7);
      this.heartHud.strokeCircle(x - 5, y - 3, 7);
      this.heartHud.strokeCircle(x + 5, y - 3, 7);
    }
    for (let i = 0; i < 8; i += 1) {
      this.staminaHud.fillStyle(staminaPips[i] === "|" ? 0x2aa7ff : 0x24374b, 1);
      this.staminaHud.fillRoundedRect(120 + i * 22, 55, 16, 14, 2);
      this.staminaHud.lineStyle(2, 0x101923, 0.75);
      this.staminaHud.strokeRoundedRect(120 + i * 22, 55, 16, 14, 2);
    }
  }

  private currentZoneName(): string {
    if (this.player.x < 520) return "Brindlebrook Gate";
    if (this.player.x < 985) return "Goblin Road";
    if (this.player.x < 1465) return "Forest Ruins";
    if (this.player.x < 1800) return "Sunstone Gate";
    return "Ancient Watchtower";
  }

  private drawObjectiveArrow(): void {
    const target = this.hasKey
      ? this.gateOpen
        ? goblinRoadLevel.exit
        : goblinRoadLevel.gate
      : this.captainDefeated
        ? this.findActivePickup("key") ?? { x: 1165, y: 685 }
        : { x: 1165, y: 685 };
    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    const angle = Math.atan2(dy, dx);
    const x = 1005;
    const y = 64;
    this.objectiveArrow.clear();
    this.objectiveArrow.fillStyle(0x241c16, 0.72);
    this.objectiveArrow.fillCircle(x, y, 24);
    this.objectiveArrow.fillStyle(0xffd86b, 1);
    const tip = new Phaser.Math.Vector2(Math.cos(angle) * 16, Math.sin(angle) * 16);
    const left = new Phaser.Math.Vector2(Math.cos(angle + 2.45) * 11, Math.sin(angle + 2.45) * 11);
    const right = new Phaser.Math.Vector2(Math.cos(angle - 2.45) * 11, Math.sin(angle - 2.45) * 11);
    this.objectiveArrow.fillTriangle(x + tip.x, y + tip.y, x + left.x, y + left.y, x + right.x, y + right.y);
  }

  private findActivePickup(kind: PickupKind): { x: number; y: number } | undefined {
    let found: { x: number; y: number } | undefined;
    this.pickups.children.each((child) => {
      const pickup = child as PickupSprite;
      if (!found && pickup.active && pickup.kind === kind) found = { x: pickup.x, y: pickup.y };
      return true;
    });
    return found;
  }

  private updateEnemyHealthBars(): void {
    this.enemies.children.each((child) => {
      const enemy = child as EnemySprite;
      enemy.healthBar.clear();
      if (!enemy.active || enemy.hp >= enemy.maxHp) return true;
      const pct = Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1);
      enemy.healthBar.fillStyle(0x241c16, 0.72);
      enemy.healthBar.fillRoundedRect(enemy.x - 22, enemy.y - 42, 44, 7, 3);
      enemy.healthBar.fillStyle(enemy.kind === "captain" ? 0xff6b4f : 0xffd86b, 0.95);
      enemy.healthBar.fillRoundedRect(enemy.x - 20, enemy.y - 40, 40 * pct, 3, 2);
      return true;
    });
  }

  private updateBossBar(): void {
    const captain = this.enemies
      .getChildren()
      .find((child) => (child as EnemySprite).enemyName === "Goblin Captain") as EnemySprite | undefined;
    const visible =
      !!captain &&
      captain.active &&
      (this.arenaLocked || Phaser.Math.Distance.Between(this.player.x, this.player.y, captain.x, captain.y) < 360);
    this.bossBar.setVisible(visible);
    this.bossBarFill.clear();
    if (!visible || !captain) return;
    const pct = Phaser.Math.Clamp(captain.hp / captain.maxHp, 0, 1);
    this.bossBarFill.fillStyle(0xd95743, 0.95);
    this.bossBarFill.fillRoundedRect(8, 8, 344 * pct, 18, 6);
    this.bossBarFill.fillStyle(0xffb36a, 0.55);
    this.bossBarFill.fillRoundedRect(8, 8, 344 * pct, 6, 4);
  }

  private drawMinimap(): void {
    const x = 1070;
    const y = 18;
    const w = 190;
    const h = 92;
    this.minimap.clear();
    this.minimap.fillStyle(0x241c16, 0.72);
    this.minimap.fillRoundedRect(x, y, w, h, 8);
    this.minimap.lineStyle(2, 0xffd86b, 0.64);
    this.minimap.strokeRoundedRect(x, y, w, h, 8);
    const sx = w / goblinRoadLevel.world.width;
    const sy = h / goblinRoadLevel.world.height;
    this.minimap.fillStyle(0xc98e4e, 1);
    for (const point of goblinRoadLevel.paths) {
      this.minimap.fillCircle(x + point.x * sx, y + point.y * sy, 2.8);
    }
    this.minimap.fillStyle(0x2d73c9, 1);
    this.minimap.fillCircle(x + this.player.x * sx, y + this.player.y * sy, 4);
    this.minimap.fillStyle(this.gateOpen ? 0x80d66f : 0xff6b72, 1);
    this.minimap.fillRect(x + goblinRoadLevel.gate.x * sx - 2, y + goblinRoadLevel.gate.y * sy - 8, 4, 16);
    this.minimap.fillStyle(0xffe58a, 1);
    this.minimap.fillCircle(x + goblinRoadLevel.exit.x * sx, y + goblinRoadLevel.exit.y * sy, 4);
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "17px",
        color,
        stroke: "#2c1d15",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(7000);
    this.tweens.add({
      targets: label,
      y: y - 32,
      alpha: 0,
      duration: 650,
      onComplete: () => label.destroy(),
    });
  }

  private particles(x: number, y: number, color: number): void {
    for (let i = 0; i < 10; i += 1) {
      const dot = this.add.circle(x, y, Phaser.Math.Between(3, 6), color, 0.8).setDepth(6500);
      this.tweens.add({
        targets: dot,
        x: x + Phaser.Math.Between(-42, 42),
        y: y + Phaser.Math.Between(-42, 42),
        alpha: 0,
        duration: Phaser.Math.Between(360, 640),
        ease: "sine.out",
        onComplete: () => dot.destroy(),
      });
    }
  }

  private hitStop(ms: number): void {
    this.physics.world.pause();
    this.time.delayedCall(ms, () => {
      if (!this.won && !this.pausedByPlayer) this.physics.world.resume();
    });
  }

  private installTestHooks(): void {
    window.render_game_to_text = () => this.snapshotText();
    window.advanceTime = (ms: number) => {
      const game = this.game as Phaser.Game & { step?: (time: number, delta: number) => void };
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let i = 0; i < steps; i += 1) {
        game.step?.(performance.now(), 1000 / 60);
      }
    };
  }

  private snapshotText(): string {
    const pickups: GameSnapshot["pickups"] = [];
    this.pickups.children.each((child) => {
      const pickup = child as PickupSprite;
      if (pickup.active) pickups.push({ kind: pickup.kind, x: Math.round(pickup.x), y: Math.round(pickup.y) });
      return true;
    });
    const enemies: GameSnapshot["enemies"] = [];
    this.enemies.children.each((child) => {
      const enemy = child as EnemySprite;
      if (enemy.active) {
        enemies.push({
          name: enemy.enemyName,
          kind: enemy.kind,
          x: Math.round(enemy.x),
          y: Math.round(enemy.y),
          hp: enemy.hp,
        });
      }
      return true;
    });
    const snapshot: GameSnapshot = {
      mode: this.won ? "ended" : this.pausedByPlayer ? "paused" : "playing",
      note: `Coordinates use world pixels with origin at top-left; x increases right, y increases down. Replaceable assets: ${assetManifest.proceduralSprites.length} sprite keys, ${assetManifest.audioCues.length} audio cues.`,
      level: goblinRoadLevel.name,
      objective: this.objective,
      player: {
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        hp: this.playerHp,
        maxHp: PLAYER_MAX_HP,
        stamina: Math.round(this.stamina),
        blocking: this.blocking,
        coins: this.coins,
        hasKey: this.hasKey,
      },
      gate: { open: this.gateOpen, x: goblinRoadLevel.gate.x, y: goblinRoadLevel.gate.y },
      arenaLocked: this.arenaLocked,
      enemies,
      pickups,
    };
    return JSON.stringify(snapshot);
  }
}
