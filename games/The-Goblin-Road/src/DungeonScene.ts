import Phaser from "phaser";
import { TEXTURES, createProceduralArt } from "./art";
import { externalAssetList, externalAssets } from "./externalAssets";
import { SoundHooks } from "./sound";

type RoomId =
  | "entrance"
  | "storage"
  | "guard"
  | "puzzle"
  | "flooded"
  | "hub"
  | "secret"
  | "chapel"
  | "antechamber"
  | "boss"
  | "exit";

type DoorRequirement = "none" | "smallKey" | "bossKey" | "puzzle" | "enemies" | "secret" | "boss";

interface DoorDef {
  id: string;
  room: RoomId;
  to: RoomId;
  x: number;
  y: number;
  width: number;
  height: number;
  requirement: DoorRequirement;
  targetX: number;
  targetY: number;
}

interface DungeonEnemy extends Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
  room: RoomId;
  hp: number;
  maxHp: number;
  speed: number;
  name: string;
  kind: "goblin" | "boss" | "minion";
  cooldown: number;
  healthBar: Phaser.GameObjects.Graphics;
}

interface DungeonChest extends Phaser.Types.Physics.Arcade.SpriteWithStaticBody {
  id: string;
  reward: "smallKey" | "bossKey" | "coins" | "heart";
  opened: boolean;
}

const ROOM_W = 640;
const ROOM_H = 420;
const WORLD_W = ROOM_W * 4;
const WORLD_H = ROOM_H * 3;
const PLAYER_MAX_HP = 8;
const DUNGEON_MAX_STAMINA = 100;
const DUNGEON_PLAYER_SPEED = 175;
const DUNGEON_DASH_SPEED = 365;
const VIEW_W = 1280;
const VIEW_H = 720;

const roomOrigins: Record<RoomId, { x: number; y: number; title: string }> = {
  storage: { x: 0, y: 0, title: "Cracked Storage" },
  entrance: { x: ROOM_W, y: 0, title: "Entrance Hall" },
  guard: { x: ROOM_W * 2, y: 0, title: "Goblin Guard Room" },
  secret: { x: 0, y: ROOM_H, title: "Secret Treasury" },
  puzzle: { x: ROOM_W, y: ROOM_H, title: "Waterwheel Puzzle" },
  hub: { x: ROOM_W * 2, y: ROOM_H, title: "Map Room" },
  chapel: { x: ROOM_W * 3, y: ROOM_H, title: "Ruined Chapel" },
  flooded: { x: ROOM_W, y: ROOM_H * 2, title: "Flooded Corridor" },
  antechamber: { x: ROOM_W * 2, y: ROOM_H * 2, title: "Boss Door" },
  boss: { x: ROOM_W * 3, y: ROOM_H * 2, title: "Bellkeeper's Ring" },
  exit: { x: ROOM_W * 3, y: 0, title: "Watchtower Summit" },
};

const doors: DoorDef[] = [
  door("entrance-storage", "entrance", "storage", 650, 176, 24, 80, "none", 570, 210),
  door("storage-entrance", "storage", "entrance", 630, 176, 24, 80, "none", 710, 210),
  door("entrance-guard", "entrance", "guard", 1250, 176, 24, 80, "none", 1375, 210),
  door("guard-entrance", "guard", "entrance", 1288, 176, 24, 80, "none", 1210, 210),
  door("entrance-puzzle", "entrance", "puzzle", 932, 390, 100, 24, "smallKey", 960, 500),
  door("puzzle-entrance", "puzzle", "entrance", 932, 420, 100, 24, "none", 960, 320),
  door("puzzle-flooded", "puzzle", "flooded", 932, 810, 100, 24, "puzzle", 960, 930),
  door("flooded-puzzle", "flooded", "puzzle", 932, 840, 100, 24, "none", 960, 730),
  door("flooded-hub", "flooded", "hub", 1250, 1020, 24, 86, "none", 1345, 1040),
  door("hub-flooded", "hub", "flooded", 1288, 1020, 24, 86, "none", 1210, 1040),
  door("hub-secret", "hub", "secret", 1288, 595, 24, 82, "secret", 570, 630),
  door("secret-hub", "secret", "hub", 630, 595, 24, 82, "none", 1350, 630),
  door("hub-chapel", "hub", "chapel", 1890, 596, 24, 82, "smallKey", 1995, 630),
  door("chapel-hub", "chapel", "hub", 1928, 596, 24, 82, "none", 1850, 630),
  door("hub-antechamber", "hub", "antechamber", 1572, 810, 100, 24, "none", 1600, 930),
  door("antechamber-hub", "antechamber", "hub", 1572, 840, 100, 24, "none", 1600, 730),
  door("antechamber-boss", "antechamber", "boss", 1890, 1020, 24, 86, "bossKey", 1995, 1040),
  door("boss-antechamber", "boss", "antechamber", 1928, 1020, 24, 86, "none", 1850, 1040),
  door("boss-exit", "boss", "exit", 2212, 840, 100, 24, "boss", 2240, 320),
];

function door(
  id: string,
  room: RoomId,
  to: RoomId,
  x: number,
  y: number,
  width: number,
  height: number,
  requirement: DoorRequirement,
  targetX: number,
  targetY: number,
): DoorDef {
  return { id, room, to, x, y, width, height, requirement, targetX, targetY };
}

export class DungeonScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private playerShadow!: Phaser.GameObjects.Image;
  private swordArc!: Phaser.GameObjects.Sprite;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private doors!: Phaser.Physics.Arcade.StaticGroup;
  private chests!: Phaser.Physics.Arcade.StaticGroup;
  private pickups!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private pushBlock!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private pressurePlate!: Phaser.GameObjects.Rectangle;
  private bossDoorSprite?: Phaser.GameObjects.Rectangle;
  private bossBar!: Phaser.GameObjects.Graphics;
  private roomFog!: Phaser.GameObjects.Graphics;
  private torchLights: Phaser.GameObjects.Arc[] = [];
  private hudText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private staminaHud!: Phaser.GameObjects.Graphics;
  private minimap!: Phaser.GameObjects.Graphics;
  private roomText!: Phaser.GameObjects.Text;
  private centerText!: Phaser.GameObjects.Text;
  private soundHooks = new SoundHooks();
  private facing = new Phaser.Math.Vector2(1, 0);
  private currentRoom: RoomId = "entrance";
  private hp = PLAYER_MAX_HP;
  private stamina = DUNGEON_MAX_STAMINA;
  private coins = 0;
  private smallKeys = 0;
  private bossKey = false;
  private attacking = false;
  private lastAttackAt = -999;
  private dashUntil = 0;
  private dashCooldownUntil = 0;
  private roomGraceUntil = 0;
  private invincibleUntil = 0;
  private doorCooldownUntil = 0;
  private completed = false;
  private solved = {
    guard: false,
    puzzle: false,
    secret: false,
    chapel: false,
    boss: false,
  };
  private openedChests = new Set<string>();
  private openedDoors = new Set<string>();
  private visitedRooms = new Set<RoomId>(["entrance"]);
  private objective = "Small Key: go east, defeat the guard goblins, then touch the chest.";
  private hint = "Walk into the right-hand doorway to reach the Goblin Guard Room. Chests open when you touch them.";

  constructor() {
    super("DungeonScene");
  }

  preload(): void {
    for (const asset of externalAssetList) {
      this.load.image(asset.key, asset.path);
    }
  }

  create(): void {
    createProceduralArt(this);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBackgroundColor("#24333a");
    this.cameras.main.setZoom(1);

    this.walls = this.physics.add.staticGroup();
    this.doors = this.physics.add.staticGroup();
    this.chests = this.physics.add.staticGroup();
    this.pickups = this.physics.add.group();
    this.enemies = this.physics.add.group();

    this.drawDungeon();
    this.createRoomFog();
    this.createDoors();
    this.createPuzzle();
    this.createChests();
    this.createEnemies();
    this.createPlayer();
    this.createHud();
    this.createInput();
    this.createCollisions();
    this.installHooks();

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.updateRoom();
    this.updateHud();
  }

  update(time: number): void {
    if (this.completed) return;
    this.updatePlayer(time);
    this.updateEnemies(time);
    this.updateEnemyHealthBars();
    this.updatePuzzle();
    this.updateRoom();
    this.updateRoomFog();
    this.updateBossBar();
    this.updateHud();
  }

  private drawDungeon(): void {
    this.add.tileSprite(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, externalAssets.dirt.key).setDepth(-100);
    const g = this.add.graphics().setDepth(-90);
    for (const [id, room] of Object.entries(roomOrigins) as Array<[RoomId, (typeof roomOrigins)[RoomId]]>) {
      const isWater = id === "flooded";
      g.fillStyle(isWater ? 0x276a70 : id === "boss" ? 0x3b2630 : 0x4e5d48, 0.78);
      g.fillRoundedRect(room.x + 28, room.y + 28, ROOM_W - 56, ROOM_H - 56, 18);
      g.lineStyle(18, 0x1f2528, 1);
      g.strokeRoundedRect(room.x + 28, room.y + 28, ROOM_W - 56, ROOM_H - 56, 18);
      g.lineStyle(5, 0x9a8d68, 0.72);
      g.strokeRoundedRect(room.x + 45, room.y + 45, ROOM_W - 90, ROOM_H - 90, 10);
      this.drawStoneFloor(room.x, room.y, id);
      this.drawRoomShadows(room.x, room.y, id);

      this.add.text(room.x + 64, room.y + 58, room.title, {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#fff1ba",
        stroke: "#1b1712",
        strokeThickness: 4,
      }).setDepth(10);

      this.addWall(room.x + 20, room.y + 12, ROOM_W - 40, 28);
      this.addWall(room.x + 20, room.y + ROOM_H - 40, ROOM_W - 40, 28);
      this.addWall(room.x + 12, room.y + 20, 28, ROOM_H - 40);
      this.addWall(room.x + ROOM_W - 40, room.y + 20, 28, ROOM_H - 40);
      this.decorateRoom(id);
    }
  }

  private createRoomFog(): void {
    this.roomFog = this.add.graphics().setDepth(8800);
    this.updateRoomFog();
  }

  private updateRoomFog(): void {
    if (!this.roomFog) return;
    const room = roomOrigins[this.currentRoom];
    const margin = 34;
    const left = Math.max(0, room.x + margin);
    const top = Math.max(0, room.y + margin);
    const right = Math.min(WORLD_W, room.x + ROOM_W - margin);
    const bottom = Math.min(WORLD_H, room.y + ROOM_H - margin);

    this.roomFog.clear();
    this.roomFog.fillStyle(0x07100f, 0.93);
    this.roomFog.fillRect(0, 0, WORLD_W, top);
    this.roomFog.fillRect(0, bottom, WORLD_W, WORLD_H - bottom);
    this.roomFog.fillRect(0, top, left, bottom - top);
    this.roomFog.fillRect(right, top, WORLD_W - right, bottom - top);
    this.roomFog.fillStyle(0x000000, 0.2);
    this.roomFog.fillRect(left, top, right - left, 28);
    this.roomFog.fillRect(left, bottom - 32, right - left, 32);
  }

  private decorateRoom(id: RoomId): void {
    const room = roomOrigins[id];
    const add = (key: string, x: number, y: number, scale = 2, depthOffset = 0) => {
      this.add.image(room.x + x, room.y + y, key).setOrigin(0.5, 1).setScale(scale).setDepth(room.y + y + depthOffset);
    };
    this.addDoorFrames(id);
    if (id === "entrance") {
      add(externalAssets.stairs.key, 320, 110, 2);
      add(externalAssets.terrain3.key, 130, 335, 1.5);
      add(externalAssets.terrain4.key, 500, 330, 1.5);
      this.addBanner(room.x + 180, room.y + 96, 0xc85a3a);
      this.addBanner(room.x + 460, room.y + 96, 0xc85a3a);
      this.addRuneCircle(room.x + 320, room.y + 216, 58, 0xffd86b, 0.22);
      this.addRoomHint(room.x + 456, room.y + 174, "Small Key ->\nGuard Room");
      this.addRoomHint(room.x + 320, room.y + 342, "Locked lower door\nneeds Small Key");
      this.addRubble(room.x + 120, room.y + 260, 5);
      this.addRubble(room.x + 510, room.y + 180, 4);
    }
    if (id === "storage") {
      for (const point of [[150, 160], [240, 255], [390, 190], [500, 310]]) add(TEXTURES.crate, point[0], point[1], 1.2);
      this.add.rectangle(room.x + 548, room.y + 210, 46, 108, 0x2b2725, 0.7).setDepth(room.y + 200);
      this.addCrackedWall(room.x + 548, room.y + 210);
      this.addRubble(room.x + 520, room.y + 265, 8);
      this.addBarrels(room.x + 110, room.y + 315);
      this.addShelf(room.x + 330, room.y + 112);
    }
    if (id === "puzzle") {
      add(externalAssets.bridge.key, 335, 380, 2);
      add(externalAssets.waterDetail1.key, 120, 175, 2.5, -20);
      this.addWaterChannel(room.x + 80, room.y + 118, 145, 245);
      this.addGear(room.x + 142, room.y + 210);
      this.addPressurePlateGlow(room.x + 455, room.y + 220);
      this.addRoomHint(room.x + 455, room.y + 168, "Stand on blue plate\nor push crate here");
      this.addRoomHint(room.x + 142, room.y + 282, "Waterwheel gate");
      this.addRubble(room.x + 518, room.y + 310, 6);
    }
    if (id === "flooded") {
      this.add.tileSprite(room.x + 320, room.y + 210, 510, 270, externalAssets.water.key).setDepth(-80).setAlpha(0.82);
      for (const point of [[160, 180], [330, 260], [480, 155]]) add(externalAssets.waterDetail2.key, point[0], point[1], 2.2, -20);
      this.addWaterEdges(room.x + 66, room.y + 78, 510, 270);
      this.addRoomHint(room.x + 318, room.y + 122, "Flooded Corridor\nDash helps in water");
      this.addRoomHint(room.x + 515, room.y + 236, "Exit east ->\nMap Room");
      this.addCurrentArrow(room.x + 510, room.y + 210, 0);
      this.addSpikeRow(room.x + 235, room.y + 205, 5);
      this.addRubble(room.x + 480, room.y + 320, 5);
    }
    if (id === "hub") {
      add(externalAssets.church.key, 320, 220, 1.3);
      this.add.text(room.x + 255, room.y + 280, "Map: keys open marked doors", { fontSize: "15px", color: "#fff1ba" }).setDepth(5000);
      this.addMapPedestal(room.x + 320, room.y + 285);
      this.addCrackedWall(room.x + 58, room.y + 210);
      this.addBanner(room.x + 112, room.y + 108, 0x3569a8);
      this.addBanner(room.x + 528, room.y + 108, 0x3569a8);
    }
    if (id === "guard") {
      this.addRoomHint(room.x + 320, room.y + 318, "Defeat guards,\nthen touch chest");
      this.addSpikeRow(room.x + 142, room.y + 305, 4);
      this.addRubble(room.x + 102, room.y + 132, 6);
    }
    if (id === "chapel") {
      for (const point of [[135, 180], [505, 180], [250, 305], [390, 305]]) this.addTorch(room.x + point[0], room.y + point[1]);
      add(externalAssets.church.key, 320, 215, 1.7);
      this.addStatue(room.x + 170, room.y + 285);
      this.addStatue(room.x + 470, room.y + 285);
      this.addRuneCircle(room.x + 320, room.y + 238, 80, 0x7df0ff, 0.16);
      this.addRubble(room.x + 320, room.y + 340, 7);
    }
    if (id === "boss") {
      this.add.circle(room.x + 320, room.y + 210, 132, 0x1d1318, 0.62).setDepth(-75);
      for (const point of [[125, 130], [515, 130], [125, 330], [515, 330]]) this.addTorch(room.x + point[0], room.y + point[1]);
      this.addRuneCircle(room.x + 320, room.y + 210, 132, 0xd95743, 0.18);
      this.addBell(room.x + 320, room.y + 118);
      this.addSpikeRow(room.x + 210, room.y + 335, 4);
      this.addSpikeRow(room.x + 360, room.y + 335, 4);
    }
    if (id === "exit") {
      this.add.circle(room.x + 320, room.y + 225, 70, 0xffe58a, 0.35).setDepth(room.y + 200);
      add(externalAssets.stairs.key, 320, 250, 2.2);
      this.addRuneCircle(room.x + 320, room.y + 225, 95, 0xffe58a, 0.26);
      this.addBanner(room.x + 180, room.y + 126, 0xffd86b);
      this.addBanner(room.x + 460, room.y + 126, 0xffd86b);
    }
  }

  private drawStoneFloor(x: number, y: number, id: RoomId): void {
    const g = this.add.graphics().setDepth(-84);
    const color = id === "flooded" ? 0x315e62 : id === "boss" ? 0x493039 : 0x626247;
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 10; col += 1) {
        const tx = x + 68 + col * 52 + ((row % 2) * 18);
        const ty = y + 82 + row * 42;
        if (tx > x + ROOM_W - 80 || ty > y + ROOM_H - 74) continue;
        g.lineStyle(1, 0x211e1c, 0.18);
        g.strokeRoundedRect(tx, ty, 42, 30, 4);
        if ((row + col) % 4 === 0) {
          g.fillStyle(color, 0.2);
          g.fillRoundedRect(tx + 4, ty + 4, 34, 22, 4);
        }
      }
    }
  }

  private drawRoomShadows(x: number, y: number, id: RoomId): void {
    const g = this.add.graphics().setDepth(-60);
    g.fillStyle(id === "boss" ? 0x150c10 : 0x101515, id === "boss" ? 0.3 : 0.18);
    g.fillRect(x + 36, y + 36, ROOM_W - 72, 38);
    g.fillRect(x + 36, y + ROOM_H - 82, ROOM_W - 72, 40);
    g.fillRect(x + 36, y + 36, 42, ROOM_H - 72);
    g.fillRect(x + ROOM_W - 78, y + 36, 42, ROOM_H - 72);
  }

  private addDoorFrames(roomId: RoomId): void {
    const roomDoors = doors.filter((doorDef) => doorDef.room === roomId);
    for (const doorDef of roomDoors) {
      const cx = doorDef.x + doorDef.width / 2;
      const cy = doorDef.y + doorDef.height / 2;
      const horizontal = doorDef.width > doorDef.height;
      const frame = this.add.graphics().setDepth(cy + 90);
      frame.fillStyle(0x161b1d, 0.9);
      frame.fillRoundedRect(cx - doorDef.width / 2 - 8, cy - doorDef.height / 2 - 8, doorDef.width + 16, doorDef.height + 16, 4);
      frame.fillStyle(doorDef.requirement === "bossKey" ? 0xc96b32 : doorDef.requirement === "smallKey" ? 0x6e7478 : 0xb89a5a, 0.92);
      frame.fillRoundedRect(cx - doorDef.width / 2, cy - doorDef.height / 2, doorDef.width, doorDef.height, 3);
      if (horizontal) {
        frame.fillStyle(0xf0c75e, 0.75);
        frame.fillCircle(cx, cy, 5);
      } else {
        frame.fillStyle(0xf0c75e, 0.75);
        frame.fillCircle(cx, cy - 14, 4);
        frame.fillCircle(cx, cy + 14, 4);
      }
    }
  }

  private addTorch(x: number, y: number): void {
    this.add.image(x, y, "prop-torch").setScale(1.45).setOrigin(0.5, 1).setDepth(y);
    const glow = this.add.circle(x, y - 46, 42, 0xffb347, 0.18).setDepth(y - 10);
    this.torchLights.push(glow);
    this.tweens.add({ targets: glow, alpha: 0.32, scale: 1.08, yoyo: true, repeat: -1, duration: 420 });
  }

  private addBanner(x: number, y: number, color: number): void {
    const g = this.add.graphics().setDepth(y);
    g.fillStyle(0x4d3524, 1);
    g.fillRoundedRect(x - 4, y - 32, 8, 70, 3);
    g.fillStyle(color, 0.92);
    g.fillRoundedRect(x + 4, y - 28, 26, 46, 4);
    g.fillTriangle(x + 4, y + 18, x + 30, y + 18, x + 17, y + 34);
    g.fillStyle(0xffe58a, 0.75);
    g.fillCircle(x + 17, y - 6, 5);
  }

  private addRubble(x: number, y: number, count: number): void {
    const g = this.add.graphics().setDepth(y - 2);
    for (let i = 0; i < count; i += 1) {
      g.fillStyle(i % 2 === 0 ? 0x7b8580 : 0x59615d, 0.9);
      g.fillRoundedRect(x + Phaser.Math.Between(-38, 38), y + Phaser.Math.Between(-20, 20), Phaser.Math.Between(8, 18), Phaser.Math.Between(5, 12), 3);
    }
  }

  private addCrackedWall(x: number, y: number): void {
    const g = this.add.graphics().setDepth(y + 10);
    g.fillStyle(0x1b1818, 0.65);
    g.fillRoundedRect(x - 26, y - 58, 52, 116, 4);
    g.lineStyle(3, 0xa99b7b, 0.78);
    g.lineBetween(x - 12, y - 38, x + 6, y - 18);
    g.lineBetween(x + 6, y - 18, x - 8, y + 8);
    g.lineBetween(x - 8, y + 8, x + 14, y + 38);
  }

  private addBarrels(x: number, y: number): void {
    this.add.image(x - 22, y, TEXTURES.barrel).setScale(1.1).setDepth(y);
    this.add.image(x + 22, y + 8, TEXTURES.barrel).setScale(1.1).setDepth(y + 8);
  }

  private addShelf(x: number, y: number): void {
    const g = this.add.graphics().setDepth(y);
    g.fillStyle(0x6b4427, 0.9);
    g.fillRoundedRect(x - 70, y - 12, 140, 22, 6);
    g.fillRoundedRect(x - 64, y + 18, 128, 18, 5);
    g.fillStyle(0xf0c75e, 0.78);
    g.fillCircle(x - 42, y - 1, 5);
    g.fillCircle(x + 8, y + 27, 5);
    g.fillCircle(x + 48, y - 1, 5);
  }

  private addWaterChannel(x: number, y: number, width: number, height: number): void {
    this.add.tileSprite(x + width / 2, y + height / 2, width, height, externalAssets.water.key).setDepth(-76).setAlpha(0.76);
    this.add.rectangle(x + width / 2, y, width, 8, 0x1a3035, 0.55).setDepth(-70);
    this.add.rectangle(x + width / 2, y + height, width, 8, 0x1a3035, 0.55).setDepth(-70);
  }

  private addWaterEdges(x: number, y: number, width: number, height: number): void {
    const g = this.add.graphics().setDepth(-66);
    g.lineStyle(6, 0x9fd6c7, 0.3);
    g.strokeRoundedRect(x, y, width, height, 8);
    g.lineStyle(2, 0xd8fff4, 0.25);
    for (let i = 0; i < 6; i += 1) {
      g.lineBetween(x + 42 + i * 72, y + 34 + (i % 2) * 40, x + 82 + i * 72, y + 34 + (i % 2) * 40);
    }
  }

  private addGear(x: number, y: number): void {
    const g = this.add.graphics().setDepth(y);
    g.lineStyle(7, 0x8d7857, 0.95);
    g.strokeCircle(x, y, 28);
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      g.lineBetween(x + Math.cos(a) * 12, y + Math.sin(a) * 12, x + Math.cos(a) * 34, y + Math.sin(a) * 34);
    }
  }

  private addPressurePlateGlow(x: number, y: number): void {
    const glow = this.add.circle(x, y, 44, 0x2aa7ff, 0.12).setDepth(y - 4);
    this.tweens.add({ targets: glow, alpha: 0.24, scale: 1.06, yoyo: true, repeat: -1, duration: 700 });
  }

  private addSpikeRow(x: number, y: number, count: number): void {
    const g = this.add.graphics().setDepth(y);
    for (let i = 0; i < count; i += 1) {
      const sx = x + i * 28;
      g.fillStyle(0xc7c0a8, 0.95);
      g.fillTriangle(sx, y, sx + 12, y - 26, sx + 24, y);
      g.lineStyle(2, 0x4e4a42, 0.7);
      g.strokeTriangle(sx, y, sx + 12, y - 26, sx + 24, y);
    }
  }

  private addMapPedestal(x: number, y: number): void {
    const g = this.add.graphics().setDepth(y);
    g.fillStyle(0x7b5a34, 0.95);
    g.fillRoundedRect(x - 54, y - 28, 108, 44, 6);
    g.fillStyle(0xe7d6a4, 0.95);
    g.fillRoundedRect(x - 38, y - 42, 76, 32, 4);
    g.lineStyle(2, 0x4d3824, 0.8);
    g.lineBetween(x - 25, y - 27, x + 18, y - 30);
    g.lineBetween(x - 28, y - 19, x + 28, y - 18);
  }

  private addStatue(x: number, y: number): void {
    const g = this.add.graphics().setDepth(y);
    g.fillStyle(0x8d8a7c, 0.95);
    g.fillRoundedRect(x - 18, y - 58, 36, 52, 8);
    g.fillCircle(x, y - 68, 14);
    g.fillStyle(0x5f625d, 0.95);
    g.fillRoundedRect(x - 28, y - 8, 56, 12, 4);
    g.lineStyle(3, 0x4e504c, 0.8);
    g.lineBetween(x - 10, y - 50, x + 10, y - 30);
  }

  private addRuneCircle(x: number, y: number, radius: number, color: number, alpha: number): void {
    const g = this.add.graphics().setDepth(y - 20);
    g.lineStyle(4, color, alpha);
    g.strokeCircle(x, y, radius);
    g.lineStyle(2, color, alpha * 1.25);
    g.strokeCircle(x, y, radius * 0.72);
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      g.lineBetween(x + Math.cos(a) * radius * 0.78, y + Math.sin(a) * radius * 0.78, x + Math.cos(a) * radius, y + Math.sin(a) * radius);
    }
  }

  private addBell(x: number, y: number): void {
    const g = this.add.graphics().setDepth(y);
    g.fillStyle(0xb9843f, 0.95);
    g.fillRoundedRect(x - 38, y - 34, 76, 50, 16);
    g.fillStyle(0xe4bd66, 0.9);
    g.fillRoundedRect(x - 48, y + 8, 96, 16, 8);
    g.fillCircle(x, y + 28, 9);
    g.lineStyle(5, 0x4d3824, 0.9);
    g.lineBetween(x, y + 24, x, y + 48);
  }

  private addRoomHint(x: number, y: number, text: string): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        color: "#fff3b8",
        align: "center",
        backgroundColor: "rgba(32,22,16,0.78)",
        padding: { x: 8, y: 5 },
        stroke: "#201714",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(y + 20);
    label.setLineSpacing(1);
  }

  private addCurrentArrow(x: number, y: number, rotation: number): void {
    const arrow = this.add.graphics().setDepth(y + 30);
    arrow.fillStyle(0xffd86b, 0.88);
    arrow.fillTriangle(x + 26, y, x - 18, y - 22, x - 18, y + 22);
    arrow.lineStyle(3, 0x3a2414, 0.8);
    arrow.strokeTriangle(x + 26, y, x - 18, y - 22, x - 18, y + 22);
    arrow.setRotation(rotation);
    this.tweens.add({ targets: arrow, x: x + 10, yoyo: true, repeat: -1, duration: 520 });
  }

  private addWall(x: number, y: number, width: number, height: number): void {
    const wall = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0x172022, 0.01);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  private createDoors(): void {
    for (const def of doors) {
      const locked = def.requirement !== "none";
      const color = def.requirement === "bossKey" ? 0xc96b32 : locked ? 0x53605f : 0xb89a5a;
      const visual = this.add.rectangle(def.x + def.width / 2, def.y + def.height / 2, def.width, def.height, color, 0.86);
      visual.setDepth(def.y + def.height + 100);
      if (def.id === "antechamber-boss") this.bossDoorSprite = visual;

      const trigger = this.doorTriggerBounds(def);
      const rect = this.add.rectangle(trigger.x + trigger.width / 2, trigger.y + trigger.height / 2, trigger.width, trigger.height, color, 0.01);
      rect.setData("door", def);
      rect.setDepth(def.y + def.height + 50);
      this.physics.add.existing(rect, true);
      this.doors.add(rect);
    }
  }

  private doorTriggerBounds(def: DoorDef): Phaser.Geom.Rectangle {
    const verticalDoor = def.height > def.width;
    const paddingAlongDoor = 18;
    const approachDepth = 42;
    if (verticalDoor) {
      return new Phaser.Geom.Rectangle(def.x - approachDepth / 2, def.y - paddingAlongDoor, def.width + approachDepth, def.height + paddingAlongDoor * 2);
    }
    return new Phaser.Geom.Rectangle(def.x - paddingAlongDoor, def.y - approachDepth / 2, def.width + paddingAlongDoor * 2, def.height + approachDepth);
  }

  private createPuzzle(): void {
    const room = roomOrigins.puzzle;
    this.pressurePlate = this.add.rectangle(room.x + 455, room.y + 220, 86, 60, 0x2aa7ff, 0.55).setDepth(room.y + 190);
    this.physics.add.existing(this.pressurePlate, true);
    this.pushBlock = this.physics.add.sprite(room.x + 270, room.y + 220, TEXTURES.crate).setImmovable(false);
    this.pushBlock.setDepth(room.y + 220);
    this.pushBlock.body.setSize(46, 46);
    this.pushBlock.setDrag(650, 650);
  }

  private createChests(): void {
    this.addChest("guard-key", "guard", 320, 210, "smallKey");
    this.addChest("secret-reward", "secret", 330, 210, "heart");
    this.addChest("chapel-boss-key", "chapel", 320, 318, "bossKey");
    this.addChest("storage-coins", "storage", 470, 285, "coins");
  }

  private addChest(id: string, roomId: RoomId, x: number, y: number, reward: DungeonChest["reward"]): void {
    const room = roomOrigins[roomId];
    const chest = this.chests.create(room.x + x, room.y + y, TEXTURES.chest) as DungeonChest;
    chest.id = id;
    chest.reward = reward;
    chest.opened = false;
    chest.setDepth(room.y + y);
    chest.refreshBody();
  }

  private createEnemies(): void {
    this.addEnemy("storage", 250, 180, "goblin", "Storage Goblin");
    for (const point of [[210, 160], [330, 240], [470, 165]]) this.addEnemy("guard", point[0], point[1], "goblin", "Guard Goblin");
    for (const point of [[210, 190], [430, 190], [320, 285]]) this.addEnemy("chapel", point[0], point[1], "goblin", "Chapel Ambusher");
    this.addEnemy("boss", 320, 210, "boss", "Goblin Bellkeeper");
  }

  private addEnemy(roomId: RoomId, x: number, y: number, kind: DungeonEnemy["kind"], name: string): void {
    const room = roomOrigins[roomId];
    const enemy = this.enemies.create(room.x + x, room.y + y, kind === "boss" ? TEXTURES.captain : TEXTURES.goblin) as DungeonEnemy;
    enemy.room = roomId;
    enemy.kind = kind;
    enemy.name = name;
    enemy.hp = kind === "boss" ? 14 : 2;
    enemy.maxHp = enemy.hp;
    enemy.speed = kind === "boss" ? 95 : 70;
    enemy.cooldown = 0;
    enemy.setDepth(room.y + y);
    enemy.body.setCircle(17, 12, 22);
    enemy.healthBar = this.add.graphics().setDepth(7200);
  }

  private createPlayer(): void {
    this.playerShadow = this.add.image(960, 215, TEXTURES.shadow).setDepth(200);
    this.player = this.physics.add.sprite(960, 215, TEXTURES.player).setDepth(215);
    this.player.body.setCircle(18, 14, 28);
    this.player.setCollideWorldBounds(true);
    this.swordArc = this.add.sprite(960, 215, TEXTURES.sword).setVisible(false).setDepth(5000);
  }

  private createHud(): void {
    this.hudText = this.add
      .text(18, 18, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        color: "#fff8dc",
        backgroundColor: "rgba(20,16,14,0.72)",
        padding: { x: 12, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(10000);
    this.objectiveText = this.add
      .text(18, 68, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: "#f4d777",
        backgroundColor: "rgba(20,16,14,0.62)",
        padding: { x: 12, y: 8 },
        wordWrap: { width: 560 },
      })
      .setScrollFactor(0)
      .setDepth(10000);
    this.hintText = this.add
      .text(18, 118, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        color: "#c8f1ff",
        backgroundColor: "rgba(20,16,14,0.58)",
        padding: { x: 12, y: 7 },
        wordWrap: { width: 560 },
      })
      .setScrollFactor(0)
      .setDepth(10000);
    this.roomText = this.add
      .text(VIEW_W / 2, 18, "", {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#fff1ba",
        stroke: "#1b1712",
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10000);
    this.centerText = this.add
      .text(VIEW_W / 2, VIEW_H / 2, "", {
        fontFamily: "Georgia, serif",
        fontSize: "42px",
        color: "#fff3b8",
        stroke: "#342418",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setVisible(false)
      .setDepth(10000);
    this.staminaHud = this.add.graphics().setScrollFactor(0).setDepth(10000);
    this.minimap = this.add.graphics().setScrollFactor(0).setDepth(10000);
    this.bossBar = this.add.graphics().setScrollFactor(0).setDepth(10000);
  }

  private createInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,SPACE,SHIFT,R") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.facing = new Phaser.Math.Vector2(world.x - this.player.x, world.y - this.player.y).normalize();
      this.attack(this.time.now);
    });
  }

  private createCollisions(): void {
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.pushBlock);
    this.physics.add.collider(this.pushBlock, this.walls);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.collider(this.player, this.doors, (_, doorObj) => this.tryDoor(doorObj as Phaser.GameObjects.Rectangle));
    this.physics.add.overlap(this.player, this.chests, (_, chest) => this.tryChest(chest as DungeonChest));
    this.physics.add.overlap(this.player, this.pickups, (_, pickup) => this.collectPickup(pickup as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody));
    this.physics.add.overlap(this.player, this.enemies, (_, enemy) => this.damagePlayer(enemy as DungeonEnemy));
  }

  private updatePlayer(time: number): void {
    const direction = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left?.isDown || this.keys.A.isDown) direction.x -= 1;
    if (this.cursors.right?.isDown || this.keys.D.isDown) direction.x += 1;
    if (this.cursors.up?.isDown || this.keys.W.isDown) direction.y -= 1;
    if (this.cursors.down?.isDown || this.keys.S.isDown) direction.y += 1;
    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.facing = direction.clone();
    }
    this.stamina = Math.min(DUNGEON_MAX_STAMINA, this.stamina + 0.42);
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) &&
      direction.lengthSq() > 0 &&
      time > this.dashCooldownUntil &&
      this.stamina >= 26
    ) {
      this.dashUntil = time + 155;
      this.dashCooldownUntil = time + 680;
      this.stamina -= 26;
      this.soundHooks.play("dash");
      this.addDashBurst(this.player.x, this.player.y);
    }
    const waterSlow = this.currentRoom === "flooded" ? 0.68 : 1;
    const dashSlow = this.currentRoom === "flooded" ? 0.86 : 1;
    const speed = time < this.dashUntil ? DUNGEON_DASH_SPEED * dashSlow : DUNGEON_PLAYER_SPEED * waterSlow;
    this.player.body.setVelocity(direction.x * speed, direction.y * speed);
    if (direction.x !== 0) this.player.setFlipX(direction.x < 0);
    this.player.setDepth(this.player.y);
    this.playerShadow.setPosition(this.player.x, this.player.y + 19).setDepth(this.player.y - 1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.attack(time);
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.scene.start("GameScene");
  }

  private attack(time: number): void {
    if (time - this.lastAttackAt < 260 || this.attacking) return;
    this.lastAttackAt = time;
    this.attacking = true;
    this.soundHooks.play("attack");
    const angle = this.facing.angle();
    this.swordArc.setVisible(true).setPosition(this.player.x + Math.cos(angle) * 30, this.player.y + Math.sin(angle) * 30).setRotation(angle).setAlpha(1);
    this.tweens.add({
      targets: this.swordArc,
      alpha: 0,
      duration: 140,
      onComplete: () => {
        this.swordArc.setVisible(false);
        this.attacking = false;
      },
    });
    this.damageEnemies();
    this.checkSecretWall();
  }

  private damageEnemies(): void {
    this.enemies.children.each((child) => {
      const enemy = child as DungeonEnemy;
      if (!enemy.active || Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) > 75) return true;
      const toEnemy = new Phaser.Math.Vector2(enemy.x - this.player.x, enemy.y - this.player.y).normalize();
      if (this.facing.dot(toEnemy) < 0.1) return true;
      enemy.hp -= 1;
      enemy.body.velocity.add(toEnemy.scale(220));
      enemy.setTintFill(0xffffff);
      this.time.delayedCall(80, () => enemy.clearTint());
      this.floatText(enemy.x, enemy.y - 34, "-1", "#fff0a6");
      if (enemy.hp <= 0) this.defeatEnemy(enemy);
      return true;
    });
  }

  private defeatEnemy(enemy: DungeonEnemy): void {
    const room = enemy.room;
    enemy.healthBar?.destroy();
    enemy.disableBody(true, true);
    if (enemy.kind !== "boss" && Phaser.Math.Between(0, 100) > 50) this.spawnPickup("coin", enemy.x, enemy.y);
    if (room === "guard" && this.roomEnemies("guard") === 0 && !this.solved.guard) {
      this.solved.guard = true;
      this.objective = "Open the guard chest for a Small Key.";
      this.hint = "Stand on the chest in the Guard Room to pick up the Small Key.";
      this.floatText(enemy.x, enemy.y - 54, "Doors unsealed", "#bff3ff");
    }
    if (room === "chapel" && this.roomEnemies("chapel") === 0 && !this.solved.chapel) {
      this.solved.chapel = true;
      this.objective = "Claim the Boss Key in the chapel.";
    }
    if (enemy.kind === "boss") {
      this.solved.boss = true;
      this.objective = "The Bellkeeper fell. Take the summit stairs.";
      this.spawnPickup("heart", enemy.x, enemy.y);
      this.floatText(enemy.x, enemy.y - 58, "Exit opened", "#ffe58a");
      this.cameras.main.flash(280, 255, 238, 164, false);
    }
  }

  private updateEnemies(time: number): void {
    this.enemies.children.each((child) => {
      const enemy = child as DungeonEnemy;
      if (!enemy.active) return true;
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (enemy.room === this.currentRoom && distance < (enemy.kind === "boss" ? 420 : 270)) {
        const direction = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y).normalize();
        enemy.body.velocity.lerp(direction.scale(enemy.speed), 0.04);
        if (enemy.kind === "boss" && time > enemy.cooldown) {
          enemy.cooldown = time + 2200;
          this.summonMinions();
        }
      } else {
        enemy.body.velocity.scale(0.9);
      }
      enemy.setDepth(enemy.y);
      return true;
    });
  }

  private updateEnemyHealthBars(): void {
    this.enemies.children.each((child) => {
      const enemy = child as DungeonEnemy;
      if (!enemy.healthBar) return true;
      enemy.healthBar.clear();
      if (!enemy.active || enemy.room !== this.currentRoom || enemy.hp >= enemy.maxHp) return true;
      const width = enemy.kind === "boss" ? 58 : 34;
      const pct = Phaser.Math.Clamp(enemy.hp / enemy.maxHp, 0, 1);
      enemy.healthBar.fillStyle(0x1d1412, 0.82);
      enemy.healthBar.fillRoundedRect(enemy.x - width / 2, enemy.y - 34, width, 6, 3);
      enemy.healthBar.fillStyle(enemy.kind === "boss" ? 0xd95743 : 0xffd86b, 0.95);
      enemy.healthBar.fillRoundedRect(enemy.x - width / 2 + 1, enemy.y - 33, (width - 2) * pct, 4, 2);
      return true;
    });
  }

  private summonMinions(): void {
    if (this.roomEnemies("boss") > 4) return;
    const room = roomOrigins.boss;
    this.addEnemy("boss", 210 + Phaser.Math.Between(-20, 20), 180 + Phaser.Math.Between(-30, 30), "minion", "Bell Minion");
    this.addEnemy("boss", 430 + Phaser.Math.Between(-20, 20), 250 + Phaser.Math.Between(-30, 30), "minion", "Bell Minion");
    this.floatText(room.x + 320, room.y + 135, "The bell calls guards!", "#ffb36a");
  }

  private damagePlayer(enemy: DungeonEnemy): void {
    if (!enemy.active || this.completed) return;
    if (this.time.now < this.roomGraceUntil) return;
    if (this.time.now < this.invincibleUntil) return;
    if (this.time.now < enemy.cooldown) return;
    enemy.cooldown = this.time.now + 900;
    this.invincibleUntil = this.time.now + 820;
    this.hp = Math.max(0, this.hp - (enemy.kind === "boss" ? 2 : 1));
    this.soundHooks.play("playerHit");
    const knockback = new Phaser.Math.Vector2(this.player.x - enemy.x, this.player.y - enemy.y).normalize().scale(enemy.kind === "boss" ? 260 : 190);
    this.player.body.velocity.add(knockback);
    this.player.setTintFill(0xffffff);
    this.time.delayedCall(90, () => this.player.clearTint());
    this.cameras.main.shake(70, 0.004);
    if (this.hp <= 0) {
      this.completed = true;
      this.centerText.setText("You were driven back.\nPress R to return to the road.").setVisible(true);
      this.input.keyboard?.once("keydown-R", () => this.scene.start("GameScene"));
    }
  }

  private tryDoor(rect: Phaser.GameObjects.Rectangle): void {
    if (this.time.now < this.doorCooldownUntil) return;
    const def = rect.getData("door") as DoorDef;
    if (this.currentRoom !== def.room) return;
    if (!this.canOpenDoor(def)) return;
    if (def.requirement === "smallKey" && !this.openedDoors.has(def.id)) {
      this.smallKeys -= 1;
      this.openedDoors.add(def.id);
      this.openedDoors.add(`${def.to}-${def.room}`);
    }
    this.player.setPosition(def.targetX, def.targetY);
    this.player.body.reset(def.targetX, def.targetY);
    this.player.body.setVelocity(0, 0);
    this.roomGraceUntil = this.time.now + 700;
    this.doorCooldownUntil = this.time.now + 550;
    this.currentRoom = def.to;
    this.visitedRooms.add(def.to);
    this.showRoomToast(def.to);
    this.cameras.main.pan(roomOrigins[def.to].x + ROOM_W / 2, roomOrigins[def.to].y + ROOM_H / 2, 220);
  }

  private canOpenDoor(def: DoorDef): boolean {
    if (def.requirement === "none" || this.openedDoors.has(def.id)) return true;
    if (def.requirement === "smallKey") {
      if (this.smallKeys > 0) return true;
      this.objective = "This door needs a Small Key from the Guard Room.";
      this.hint = "From the Entrance Hall, go right/east, defeat the guard goblins, then touch their chest.";
      return false;
    }
    if (def.requirement === "bossKey") {
      if (this.bossKey) return true;
      this.objective = "The Boss Door needs the Boss Key.";
      return false;
    }
    if (def.requirement === "puzzle") return this.solved.puzzle;
    if (def.requirement === "secret") return this.solved.secret;
    if (def.requirement === "boss") return this.solved.boss;
    return false;
  }

  private tryChest(chest: DungeonChest): void {
    if (chest.opened || Phaser.Math.Distance.Between(this.player.x, this.player.y, chest.x, chest.y) > 54) return;
    if (chest.id === "guard-key" && !this.solved.guard) {
      this.objective = "Defeat every guard before opening this chest.";
      return;
    }
    if (chest.id === "chapel-boss-key" && !this.solved.chapel) {
      this.objective = "Clear the chapel ambush first.";
      return;
    }
    chest.opened = true;
    this.openedChests.add(chest.id);
    chest.setTint(0x777777);
    if (chest.reward === "smallKey") {
      this.smallKeys += 1;
      this.objective = "Return to the Entrance Hall and walk into the lower silver door.";
      this.hint = "The Small Key is collected automatically. The locked lower door will spend it when you enter.";
    }
    if (chest.reward === "bossKey") {
      this.bossKey = true;
      this.objective = "Open the Boss Door.";
    }
    if (chest.reward === "coins") this.coins += 12;
    if (chest.reward === "heart") this.hp = PLAYER_MAX_HP;
    this.soundHooks.play(chest.reward === "bossKey" ? "key" : "coin");
    this.floatText(chest.x, chest.y - 34, chest.reward === "bossKey" ? "Boss Key" : chest.reward === "smallKey" ? "Small Key" : "Treasure", "#ffe58a");
  }

  private updatePuzzle(): void {
    if (this.solved.puzzle) return;
    const plateBounds = Phaser.Geom.Rectangle.Inflate(this.pressurePlate.getBounds(), 18, 16);
    const solvedByCrate = Phaser.Geom.Rectangle.Overlaps(plateBounds, this.pushBlock.getBounds());
    const solvedByPlayer = this.currentRoom === "puzzle" && Phaser.Geom.Rectangle.Contains(plateBounds, this.player.x, this.player.y);
    const solved = solvedByCrate || solvedByPlayer;
    if (solved) {
      this.solved.puzzle = true;
      this.pressurePlate.setFillStyle(0x58d66d, 0.75);
      this.objective = "The water gate opened. Take the flooded corridor.";
      this.hint = "The blue plate powered the waterwheel. Use the lower doorway to continue.";
      this.floatText(this.pressurePlate.x, this.pressurePlate.y - 38, "Waterwheel unlocked", "#bff3ff");
      this.cameras.main.flash(180, 180, 255, 210, false);
    }
  }

  private checkSecretWall(): void {
    if (this.solved.secret || this.currentRoom !== "hub") return;
    const room = roomOrigins.hub;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, room.x + 58, room.y + 210) < 90) {
      this.solved.secret = true;
      this.objective = "A cracked wall opened to a secret room.";
      this.floatText(room.x + 85, room.y + 210, "Secret opened", "#bff3ff");
    }
  }

  private collectPickup(pickup: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody): void {
    const kind = pickup.getData("kind") as string;
    if (kind === "coin") this.coins += 1;
    if (kind === "heart") this.hp = Math.min(PLAYER_MAX_HP, this.hp + 2);
    pickup.disableBody(true, true);
  }

  private spawnPickup(kind: "coin" | "heart", x: number, y: number): void {
    const sprite = this.pickups.create(x, y, kind === "coin" ? TEXTURES.coin : TEXTURES.heart) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    sprite.setData("kind", kind);
    sprite.body.setCircle(14);
    sprite.setDepth(y);
  }

  private addDashBurst(x: number, y: number): void {
    const burst = this.add.circle(x, y + 8, 20, 0x9fe8ff, 0.24).setDepth(y - 2);
    this.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 2.1,
      duration: 220,
      onComplete: () => burst.destroy(),
    });
  }

  private updateRoom(): void {
    const found = (Object.entries(roomOrigins) as Array<[RoomId, (typeof roomOrigins)[RoomId]]>).find(([, room]) =>
      Phaser.Geom.Rectangle.Contains(new Phaser.Geom.Rectangle(room.x, room.y, ROOM_W, ROOM_H), this.player.x, this.player.y),
    );
    if (found) {
      this.currentRoom = found[0];
      this.visitedRooms.add(found[0]);
    }
    if (this.currentRoom === "exit" && this.solved.boss && !this.completed) {
      this.completed = true;
      this.centerText.setText("Dungeon Complete -\nThe Sunken Watchtower is restored.").setVisible(true);
      this.soundHooks.play("victory");
    }
  }

  private updateHud(): void {
    this.updateGuidance();
    this.hudText.setText(`HP ${this.hp}/${PLAYER_MAX_HP}   Coins ${this.coins}   Keys ${this.smallKeys}   Boss Key ${this.bossKey ? "Yes" : "No"}`);
    this.objectiveText.setText(`Objective: ${this.objective}`);
    this.hintText.setText(`Hint: ${this.hint}`);
    this.roomText.setText(roomOrigins[this.currentRoom].title);
    this.drawStaminaHud();
    this.drawMinimap();
  }

  private drawStaminaHud(): void {
    this.staminaHud.clear();
    this.staminaHud.fillStyle(0x111923, 0.78);
    this.staminaHud.fillRoundedRect(18, 158, 226, 22, 6);
    this.staminaHud.fillStyle(0x2aa7ff, 0.92);
    this.staminaHud.fillRoundedRect(24, 164, 214 * (this.stamina / DUNGEON_MAX_STAMINA), 10, 4);
    this.staminaHud.lineStyle(2, 0xa9dfff, 0.42);
    this.staminaHud.strokeRoundedRect(18, 158, 226, 22, 6);
  }

  private drawMinimap(): void {
    const scale = 0.08;
    const x = 1048;
    const y = 22;
    this.minimap.clear();
    this.minimap.fillStyle(0x11110e, 0.72);
    this.minimap.fillRoundedRect(x - 12, y - 10, 206, 132, 8);
    for (const [id, room] of Object.entries(roomOrigins) as Array<[RoomId, (typeof roomOrigins)[RoomId]]>) {
      const rx = x + room.x * scale;
      const ry = y + room.y * scale;
      const visible = this.visitedRooms.has(id);
      const current = id === this.currentRoom;
      this.minimap.fillStyle(current ? 0xffd86b : visible ? 0x5db7d8 : 0x2a3234, current ? 0.95 : visible ? 0.72 : 0.42);
      this.minimap.fillRoundedRect(rx, ry, ROOM_W * scale - 8, ROOM_H * scale - 8, 4);
      if (current) {
        this.minimap.lineStyle(3, 0xffffff, 0.78);
        this.minimap.strokeRoundedRect(rx - 1, ry - 1, ROOM_W * scale - 6, ROOM_H * scale - 6, 4);
      }
    }
  }

  private updateGuidance(): void {
    if (this.currentRoom === "puzzle" && !this.solved.puzzle) {
      this.objective = "Power the waterwheel to open the lower water gate.";
      this.hint = "Stand on the glowing blue plate, or push the crate onto it.";
      return;
    }
    if (this.currentRoom === "flooded") {
      this.objective = "Cross the Flooded Corridor and reach the east door.";
      this.hint = "Water slows you down, but Shift dash still works. Avoid the spikes and follow the east exit.";
      return;
    }
    if (this.currentRoom === "hub" && !this.bossKey) {
      this.objective = "Explore from the Map Room and find the Boss Key.";
      this.hint = "Check marked doors from this room. The chapel path eventually leads to the Boss Key.";
      return;
    }
    if (this.currentRoom === "antechamber" && !this.bossKey) {
      this.objective = "The Boss Door is sealed.";
      this.hint = "Return to the Map Room and search the chapel route for the Boss Key.";
      return;
    }
    if (this.openedDoors.has("entrance-puzzle")) return;
    if (!this.solved.guard) {
      if (this.currentRoom === "guard") {
        this.objective = "Defeat the guard goblins, then touch the chest for the Small Key.";
        this.hint = "Use Space or left click to attack. The chest opens automatically after the guards are gone.";
      } else if (this.currentRoom === "entrance") {
        this.objective = "Small Key: go east, defeat the guard goblins, then touch the chest.";
        this.hint = "Walk into the right-hand doorway to reach the Goblin Guard Room. Chests open when you touch them.";
      }
      return;
    }
    if (!this.openedChests.has("guard-key")) {
      this.objective = "Open the guard chest for a Small Key.";
      this.hint = "Stand on the chest in the Guard Room to pick up the Small Key.";
      return;
    }
    if (this.smallKeys > 0) {
      this.objective = "Return to the Entrance Hall and walk into the lower silver door.";
      this.hint = "The Small Key is collected automatically. The locked lower door will spend it when you enter.";
    }
  }

  private updateBossBar(): void {
    this.bossBar.clear();
    const boss = this.enemies.getChildren().find((child) => (child as DungeonEnemy).kind === "boss") as DungeonEnemy | undefined;
    if (!boss || !boss.active || this.currentRoom !== "boss") return;
    this.bossBar.fillStyle(0x241c16, 0.82);
    this.bossBar.fillRoundedRect(430, 660, 420, 34, 8);
    this.bossBar.fillStyle(0xd95743, 0.95);
    this.bossBar.fillRoundedRect(438, 668, 404 * (boss.hp / boss.maxHp), 18, 6);
    this.bossBar.lineStyle(2, 0xffd86b, 0.72);
    this.bossBar.strokeRoundedRect(430, 660, 420, 34, 8);
  }

  private roomEnemies(room: RoomId): number {
    return this.enemies.getChildren().filter((child) => {
      const enemy = child as DungeonEnemy;
      return enemy.active && enemy.room === room && enemy.kind !== "minion";
    }).length;
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const label = this.add.text(x, y, text, { fontSize: "17px", color, stroke: "#201714", strokeThickness: 4 }).setOrigin(0.5).setDepth(7000);
    this.tweens.add({ targets: label, y: y - 28, alpha: 0, duration: 650, onComplete: () => label.destroy() });
  }

  private showRoomToast(roomId: RoomId): void {
    const label = this.add
      .text(VIEW_W / 2, VIEW_H - 92, `Entered: ${roomOrigins[roomId].title}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        color: "#fff7d6",
        backgroundColor: "rgba(25,18,13,0.78)",
        padding: { x: 18, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10001)
      .setAlpha(0);
    this.tweens.add({
      targets: label,
      alpha: 1,
      y: VIEW_H - 80,
      yoyo: true,
      hold: 520,
      duration: 220,
      onComplete: () => label.destroy(),
    });
  }

  private installHooks(): void {
    window.render_game_to_text = () => this.snapshot();
  }

  private snapshot(): string {
    const boss = this.enemies.getChildren().find((child) => (child as DungeonEnemy).kind === "boss") as DungeonEnemy | undefined;
    return JSON.stringify({
      mode: this.completed ? "ended" : "dungeon",
      level: "The Sunken Watchtower",
      room: this.currentRoom,
      objective: this.objective,
      hint: this.hint,
      player: {
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        hp: this.hp,
        stamina: Math.round(this.stamina),
        dashing: this.time.now < this.dashUntil,
        coins: this.coins,
        smallKeys: this.smallKeys,
        bossKey: this.bossKey,
      },
      solved: this.solved,
      visitedRooms: Array.from(this.visitedRooms),
      openedChests: Array.from(this.openedChests),
      boss: boss ? { active: boss.active, hp: boss.hp, maxHp: boss.maxHp } : null,
    });
  }
}
