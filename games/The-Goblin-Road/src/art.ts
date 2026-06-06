import Phaser from "phaser";
import type { PropKind } from "./types";

export const TEXTURES = {
  player: "hero-adventurer",
  goblin: "goblin-scout",
  captain: "goblin-captain",
  coin: "coin-glow",
  heart: "heart-glow",
  key: "sunstone-key",
  sword: "sword-swing",
  gateClosed: "gate-closed",
  gateOpen: "gate-open",
  chest: "treasure-chest",
  barrel: "breakable-barrel",
  crate: "breakable-crate",
  shadow: "soft-shadow",
} as const;

export function createProceduralArt(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURES.player)) return;

  makeShadow(scene);
  makeHero(scene);
  makeGoblin(scene, TEXTURES.goblin, 0x64a63c, 0xf0d165);
  makeGoblin(scene, TEXTURES.captain, 0x4e8530, 0xd95743);
  makeCoin(scene);
  makeHeart(scene);
  makeKey(scene);
  makeSword(scene);
  makeGate(scene);
  makeChest(scene);
  makeBreakables(scene);
  makeProps(scene);
}

function g(scene: Phaser.Scene, width: number, height: number): Phaser.GameObjects.Graphics {
  return scene.make.graphics({ x: 0, y: 0 }, false).setDefaultStyles({
    lineStyle: { width: 0, color: 0xffffff },
    fillStyle: { color: 0xffffff },
  });
}

function save(graphics: Phaser.GameObjects.Graphics, key: string, width: number, height: number): void {
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

function makeShadow(scene: Phaser.Scene): void {
  const graphics = g(scene, 72, 36);
  graphics.fillStyle(0x122016, 0.26);
  graphics.fillEllipse(36, 18, 64, 24);
  save(graphics, TEXTURES.shadow, 72, 36);
}

function makeHero(scene: Phaser.Scene): void {
  const graphics = g(scene, 64, 72);
  graphics.fillStyle(0x172033, 0.28);
  graphics.fillEllipse(32, 63, 42, 12);
  graphics.fillStyle(0x2d73c9);
  graphics.fillRoundedRect(20, 25, 25, 30, 9);
  graphics.fillStyle(0xffd8a8);
  graphics.fillCircle(32, 20, 14);
  graphics.fillStyle(0x8b542e);
  graphics.fillRoundedRect(22, 9, 21, 11, 6);
  graphics.fillStyle(0xd9e5ec);
  graphics.fillRoundedRect(42, 28, 15, 22, 7);
  graphics.lineStyle(3, 0x55717d, 1);
  graphics.strokeRoundedRect(42, 28, 15, 22, 7);
  graphics.lineStyle(4, 0xf1c85b, 1);
  graphics.lineBetween(17, 33, 7, 47);
  graphics.fillStyle(0xf1c85b);
  graphics.fillTriangle(7, 47, 2, 55, 14, 52);
  graphics.fillStyle(0x203c78);
  graphics.fillRoundedRect(19, 52, 10, 12, 4);
  graphics.fillRoundedRect(36, 52, 10, 12, 4);
  save(graphics, TEXTURES.player, 64, 72);
}

function makeGoblin(scene: Phaser.Scene, key: string, skin: number, cap: number): void {
  const graphics = g(scene, 58, 58);
  graphics.fillStyle(0x142015, 0.25);
  graphics.fillEllipse(29, 50, 39, 11);
  graphics.fillStyle(skin);
  graphics.fillRoundedRect(17, 20, 25, 25, 9);
  graphics.fillCircle(29, 18, 14);
  graphics.fillTriangle(16, 15, 4, 8, 16, 24);
  graphics.fillTriangle(42, 15, 54, 8, 42, 24);
  graphics.fillStyle(cap);
  graphics.fillRoundedRect(15, 7, 28, 8, 4);
  graphics.fillStyle(0x191615);
  graphics.fillCircle(24, 18, 2);
  graphics.fillCircle(34, 18, 2);
  graphics.lineStyle(2, 0x3d2415, 1);
  graphics.lineBetween(23, 31, 35, 31);
  graphics.fillStyle(0x7a5d45);
  graphics.fillRoundedRect(10, 30, 9, 17, 3);
  graphics.fillRoundedRect(39, 30, 9, 17, 3);
  save(graphics, key, 58, 58);
}

function makeCoin(scene: Phaser.Scene): void {
  const graphics = g(scene, 36, 36);
  graphics.fillStyle(0xffd86b, 0.22);
  graphics.fillCircle(18, 18, 17);
  graphics.fillStyle(0xf7b733);
  graphics.fillCircle(18, 18, 11);
  graphics.lineStyle(3, 0xffed9a, 1);
  graphics.strokeCircle(18, 18, 8);
  save(graphics, TEXTURES.coin, 36, 36);
}

function makeHeart(scene: Phaser.Scene): void {
  const graphics = g(scene, 40, 36);
  graphics.fillStyle(0xff6b72, 0.22);
  graphics.fillCircle(20, 19, 18);
  graphics.fillStyle(0xe83951);
  graphics.fillCircle(14, 13, 9);
  graphics.fillCircle(26, 13, 9);
  graphics.fillTriangle(6, 17, 34, 17, 20, 33);
  save(graphics, TEXTURES.heart, 40, 36);
}

function makeKey(scene: Phaser.Scene): void {
  const graphics = g(scene, 54, 32);
  graphics.fillStyle(0xffe58a, 0.25);
  graphics.fillEllipse(27, 16, 52, 28);
  graphics.lineStyle(6, 0xf8bc2e, 1);
  graphics.strokeCircle(15, 16, 8);
  graphics.lineBetween(23, 16, 45, 16);
  graphics.lineBetween(38, 16, 38, 24);
  graphics.lineBetween(45, 16, 45, 23);
  save(graphics, TEXTURES.key, 54, 32);
}

function makeSword(scene: Phaser.Scene): void {
  const graphics = g(scene, 72, 72);
  graphics.fillStyle(0xf8f2cf, 0.34);
  graphics.slice(36, 36, 34, Phaser.Math.DegToRad(-42), Phaser.Math.DegToRad(42), false);
  graphics.fillPath();
  graphics.lineStyle(8, 0xf8d261, 0.75);
  graphics.lineBetween(36, 36, 66, 36);
  save(graphics, TEXTURES.sword, 72, 72);
}

function makeGate(scene: Phaser.Scene): void {
  const closed = g(scene, 86, 202);
  closed.fillStyle(0x6f7376);
  closed.fillRoundedRect(6, 10, 74, 182, 12);
  closed.fillStyle(0x4a4f52);
  closed.fillRoundedRect(18, 27, 18, 148, 7);
  closed.fillRoundedRect(50, 27, 18, 148, 7);
  closed.lineStyle(5, 0xb48b43, 1);
  closed.strokeCircle(43, 101, 17);
  save(closed, TEXTURES.gateClosed, 86, 202);

  const open = g(scene, 120, 202);
  open.fillStyle(0x6f7376);
  open.fillRoundedRect(2, 10, 32, 182, 10);
  open.fillRoundedRect(86, 10, 32, 182, 10);
  open.fillStyle(0xffdd7a, 0.18);
  open.fillRoundedRect(37, 22, 46, 158, 18);
  save(open, TEXTURES.gateOpen, 120, 202);
}

function makeChest(scene: Phaser.Scene): void {
  const graphics = g(scene, 60, 44);
  graphics.fillStyle(0x3f2317);
  graphics.fillRoundedRect(7, 15, 46, 23, 6);
  graphics.fillStyle(0xb45b2b);
  graphics.fillRoundedRect(6, 8, 48, 20, 9);
  graphics.lineStyle(4, 0xf0c75e, 1);
  graphics.lineBetween(30, 9, 30, 39);
  graphics.strokeRoundedRect(6, 8, 48, 30, 8);
  save(graphics, TEXTURES.chest, 60, 44);
}

function makeBreakables(scene: Phaser.Scene): void {
  const crate = g(scene, 48, 48);
  crate.fillStyle(0xb9783e);
  crate.fillRoundedRect(7, 7, 34, 34, 5);
  crate.lineStyle(4, 0x734423, 1);
  crate.strokeRoundedRect(7, 7, 34, 34, 5);
  crate.lineBetween(9, 10, 39, 38);
  crate.lineBetween(39, 10, 9, 38);
  save(crate, TEXTURES.crate, 48, 48);

  const barrel = g(scene, 42, 48);
  barrel.fillStyle(0x9c5c2e);
  barrel.fillRoundedRect(8, 4, 26, 40, 12);
  barrel.lineStyle(3, 0x5c3620, 1);
  barrel.strokeRoundedRect(8, 4, 26, 40, 12);
  barrel.lineBetween(9, 16, 33, 16);
  barrel.lineBetween(9, 33, 33, 33);
  save(barrel, TEXTURES.barrel, 42, 48);
}

function makeProps(scene: Phaser.Scene): void {
  makeTree(scene);
  makeRock(scene);
  makeFence(scene);
  makeBanner(scene);
  makeTorch(scene);
  makeRuin(scene);
  makeBush(scene);
  makeSign(scene);
}

function makeTree(scene: Phaser.Scene): void {
  const graphics = g(scene, 96, 118);
  graphics.fillStyle(0x5b3a24);
  graphics.fillRoundedRect(41, 62, 15, 43, 6);
  graphics.fillStyle(0x2c7a3e);
  graphics.fillCircle(34, 58, 28);
  graphics.fillCircle(58, 54, 31);
  graphics.fillCircle(48, 32, 31);
  graphics.fillStyle(0x58a54c);
  graphics.fillCircle(36, 39, 16);
  save(graphics, "prop-tree", 96, 118);
}

function makeRock(scene: Phaser.Scene): void {
  const graphics = g(scene, 62, 42);
  graphics.fillStyle(0x7b8580);
  graphics.fillRoundedRect(8, 9, 45, 24, 10);
  graphics.fillStyle(0xa5aea4);
  graphics.fillRoundedRect(17, 7, 20, 10, 5);
  save(graphics, "prop-rock", 62, 42);
}

function makeFence(scene: Phaser.Scene): void {
  const graphics = g(scene, 64, 30);
  graphics.fillStyle(0x8b5a34);
  graphics.fillRoundedRect(2, 11, 60, 7, 3);
  graphics.fillRoundedRect(8, 3, 8, 24, 3);
  graphics.fillRoundedRect(48, 3, 8, 24, 3);
  save(graphics, "prop-fence", 64, 30);
}

function makeBanner(scene: Phaser.Scene): void {
  const graphics = g(scene, 44, 82);
  graphics.fillStyle(0x674221);
  graphics.fillRoundedRect(18, 6, 6, 70, 2);
  graphics.fillStyle(0xd64c4c);
  graphics.fillRoundedRect(22, 10, 18, 34, 4);
  graphics.fillTriangle(22, 44, 40, 44, 31, 56);
  graphics.fillStyle(0xf4d36b);
  graphics.fillCircle(31, 26, 5);
  save(graphics, "prop-banner", 44, 82);
}

function makeTorch(scene: Phaser.Scene): void {
  const graphics = g(scene, 40, 70);
  graphics.fillStyle(0x644227);
  graphics.fillRoundedRect(17, 22, 7, 43, 3);
  graphics.fillStyle(0xffb347, 0.28);
  graphics.fillCircle(20, 17, 18);
  graphics.fillStyle(0xffcf5d);
  graphics.fillCircle(20, 16, 9);
  graphics.fillStyle(0xff6d3a);
  graphics.fillCircle(20, 20, 5);
  save(graphics, "prop-torch", 40, 70);
}

function makeRuin(scene: Phaser.Scene): void {
  const graphics = g(scene, 80, 68);
  graphics.fillStyle(0x777f7a);
  graphics.fillRoundedRect(10, 18, 24, 38, 5);
  graphics.fillRoundedRect(46, 9, 24, 47, 5);
  graphics.fillStyle(0x59615d);
  graphics.fillRoundedRect(5, 53, 70, 10, 4);
  save(graphics, "prop-ruin", 80, 68);
}

function makeBush(scene: Phaser.Scene): void {
  const graphics = g(scene, 58, 42);
  graphics.fillStyle(0x3c8b45);
  graphics.fillCircle(17, 25, 14);
  graphics.fillCircle(30, 18, 17);
  graphics.fillCircle(43, 26, 13);
  graphics.fillStyle(0x6cbf5d);
  graphics.fillCircle(27, 17, 7);
  save(graphics, "prop-bush", 58, 42);
}

function makeSign(scene: Phaser.Scene): void {
  const graphics = g(scene, 78, 58);
  graphics.fillStyle(0x6b4427);
  graphics.fillRoundedRect(35, 24, 8, 30, 3);
  graphics.fillStyle(0xc58a4a);
  graphics.fillRoundedRect(4, 5, 70, 28, 6);
  graphics.lineStyle(3, 0x6b4427, 1);
  graphics.strokeRoundedRect(4, 5, 70, 28, 6);
  save(graphics, "prop-sign", 78, 58);
}

export function textureForProp(kind: PropKind): string {
  return `prop-${kind}`;
}
