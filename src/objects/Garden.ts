import Phaser from "phaser";
import {FIELD_HEIGHT, FIELD_WIDTH, getCellPxCenter, GRID_SIZE, LevelData} from "../utils";

export default class Garden extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, private level: LevelData) {
    super(scene, 0, 0);
    this.createGraphics();
    scene.add.existing(this);
  }

  private createGraphics() {
    const getTxtIndex = (y: number, x: number) => y * 15 + x;
    const grass = getTxtIndex(1, 1);

    for (let row = 0; row < FIELD_HEIGHT; row++) {
      for (let col = 0; col < FIELD_WIDTH; col++) {
        const {x, y} = getCellPxCenter(col, row);

        const sprite: Phaser.GameObjects.Image = this.scene.add.image(x, y, 'garden', grass)
            .setDisplaySize(GRID_SIZE, GRID_SIZE)
            .setOrigin(0.5)
            .setAlpha(0.6);
        this.add(sprite);
      }
    }

    const map: number[][] = Array(FIELD_HEIGHT).fill(0).map(() => Array(FIELD_WIDTH).fill(null));

    const groundify = (row: number, col: number, txtI: number, txtJ: number) => {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          map[row + i][col + j] = getTxtIndex(txtI + i, txtJ + j);
        }
      }
    };
    groundify(this.level.cannon.row, this.level.cannon.col, 13, 1);
    groundify(this.level.goal.row, this.level.goal.col, 10, 6);

    for (let row = 0; row < FIELD_HEIGHT; row++) {
      for (let col = 0; col < FIELD_WIDTH; col++) {
        const {x, y} = getCellPxCenter(col, row);
        const txtIndex = map[row][col];
        if (txtIndex !== null) {
          const sprite = this.scene.add.image(x, y, 'garden', map[row][col])
              .setDisplaySize(GRID_SIZE, GRID_SIZE)
              .setOrigin(0.5)
              // .setAlpha(0.6);
          this.add(sprite);
        }
      }
    }

    for (let wall of this.level.walls) {
      const {x, y} = getCellPxCenter(wall.col, wall.row);
      const sprite = this.scene.add.image(x, y, 'trees', 9 )
          .setDisplaySize(GRID_SIZE * 0.8, GRID_SIZE * 0.8)
          .setOrigin(0.5)
      this.add(sprite);
    }
  }

  public destroy(fromScene?: boolean) {
    super.destroy(fromScene);
  }
}
