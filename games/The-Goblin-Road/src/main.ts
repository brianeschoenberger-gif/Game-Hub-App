import Phaser from "phaser";
import "./styles.css";
import { DungeonScene } from "./DungeonScene";
import { GameScene } from "./GameScene";
import { TitleScene } from "./TitleScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: "game-container",
  width: 1280,
  height: 720,
  backgroundColor: "#77b85c",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  scene: [TitleScene, GameScene, DungeonScene],
};

const game = new Phaser.Game(config);
window.goblinRoadGame = game;
