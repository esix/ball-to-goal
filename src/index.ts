import "phaser";
import { MainScene } from "./scenes/MainScene";
import { FIELD_HEIGHT, FIELD_WIDTH, GRID_SIZE } from "./utils";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GRID_SIZE * FIELD_WIDTH,
  height: GRID_SIZE * FIELD_HEIGHT,
  // backgroundColor: '#4488ff',
  backgroundColor: "#ffffff",
  scene: [MainScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
