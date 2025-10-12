import Phaser from "phaser";
import {FIELD_HEIGHT, FIELD_WIDTH, getCellPxCenter, GRID_SIZE, LevelData} from "../utils";

export default class Garden extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, private level: LevelData) {
    super(scene, 0, 0);
    this.createGraphics();
    scene.add.existing(this);
  }

  private createGraphics() {
    const getTxtIndex = (y: number, x: number) => y * 16 + x;
    const grass = getTxtIndex(9, 11);
    const map: number[][] = Array(FIELD_HEIGHT).fill(0).map(() => Array(FIELD_WIDTH).fill(grass));

    const groundify = (row: number, col: number) => {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          map[row + i][col + j] = getTxtIndex(9 + i, 14 + j);
        }
      }
    };
    groundify(this.level.cannon.row, this.level.cannon.col);
    groundify(this.level.goal.row, this.level.goal.col);


    for (let row = 0; row < FIELD_HEIGHT; row++) {
      for (let col = 0; col < FIELD_WIDTH; col++) {
        const {x, y} = getCellPxCenter(col, row);

        const sprite = this.scene.add.image(x, y, 'garden', map[row][col])
                                            .setDisplaySize(GRID_SIZE, GRID_SIZE)
                                            .setOrigin(0.5)
                                            .setAlpha(0.6);
        this.add(sprite);
      }
    }
  }

  public destroy(fromScene?: boolean) {
    super.destroy(fromScene);
  }
}