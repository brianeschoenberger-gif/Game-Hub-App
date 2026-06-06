import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#1d3426");

    const graphics = this.add.graphics();
    graphics.fillStyle(0x8fcf62);
    graphics.fillRoundedRect(0, height * 0.54, width, height * 0.46, 0);
    graphics.fillStyle(0xc8924e);
    graphics.fillRoundedRect(width * 0.12, height * 0.6, width * 0.76, 92, 42);
    graphics.fillStyle(0x53615c);
    graphics.fillRoundedRect(width * 0.68, height * 0.27, 92, 210, 18);
    graphics.fillStyle(0xffcc5b, 0.6);
    graphics.fillCircle(width * 0.7, height * 0.21, 42);

    this.add
      .text(width / 2, 120, "The Goblin Road", {
        fontFamily: "Georgia, serif",
        fontSize: "58px",
        color: "#fff1ba",
        stroke: "#422e20",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        205,
        "Leave Brindlebrook, recover the Sunstone Key, and open the old forest road.",
        {
          fontFamily: "system-ui, sans-serif",
          fontSize: "20px",
          color: "#f9f1db",
          align: "center",
          wordWrap: { width: 720 },
        },
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 150, "Press Enter or Click to Begin", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        color: "#2b2115",
        backgroundColor: "#f9d66f",
        padding: { x: 22, y: 12 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 82, "WASD / Arrows move    Space / Click attack    Shift dash    P pause    F fullscreen", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "17px",
        color: "#fdf8df",
      })
      .setOrigin(0.5);

    this.input.keyboard?.once("keydown-ENTER", () => this.scene.start("GameScene"));
    this.input.once("pointerdown", () => this.scene.start("GameScene"));
  }
}
