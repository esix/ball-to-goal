import Phaser from "phaser";
import {FIELD_HEIGHT, FIELD_WIDTH, getCellPxCenter, GRID_SIZE, LevelData} from "../utils";

const sign = Math.sign;
const abs = Math.abs;

export default class Landscape extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, private level: LevelData) {
    super(scene, 0, 0);
    this.createGraphics();
    scene.add.existing(this);
  }

  private createGraphics() {
    const W = FIELD_WIDTH * 3;
    const H = FIELD_HEIGHT * 3;

    const getTxtIndex = (x: number, y: number) => y * 15 + x;

    const addSprite = (col: number, row: number, atlas: string, idx: number, opts: Partial<{alpha: number}> = {}) => {
      const x = col * GRID_SIZE / 3;
      const y = row * GRID_SIZE / 3;

      const sprite: Phaser.GameObjects.Image = this.scene.add.image(x, y, 'garden', idx)
        .setDisplaySize(GRID_SIZE / 3, GRID_SIZE / 3)
        .setOrigin(0)
        .setAlpha(opts.alpha ?? 1);
      this.add(sprite);
    };

    // grass
    for (let col = 0; col < W; col++) {
      for (let row = 0; row < H; row++) {
        addSprite(col, row, 'garden', getTxtIndex(1, 1), {alpha: 0.6});
      }
    }

    const map: number[][] = Array(FIELD_HEIGHT * 3).fill(0).map(() => Array(FIELD_WIDTH * 3).fill(null));

    const groundify = (col: number, row: number, txtJ: number, txtI: number) => {
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          // map[row + i][col + j] = getTxtIndex(txtJ + sign(j) * +(abs(j) === 2), txtI + sign(i) * +(abs(i) === 2));
          map[row + i][col + j] = getTxtIndex(txtJ, txtI);
        }
      }
    };
    groundify(this.level.cannon.col * 3 + 1, this.level.cannon.row * 3 + 1, 1, 13);
    groundify(this.level.goal.col * 3 + 1, this.level.goal.row * 3 + 1, 6, 10);
    for (let pit of this.level.pits) {
      groundify(pit.col * 3 + 1, pit.row * 3 + 1, 1, 7);
    }

    for (let col = 0; col < W; col++) {
      for (let row = 0; row < H; row++) {
        let idx = map[row][col];
        if (idx === null) continue;
        if (map[row - 1]?.[col] === null) idx -= 15;
        if (map[row]?.[col - 1] === null) idx -= 1;
        if (map[row]?.[col + 1] === null) idx += 1;
        if (map[row + 1]?.[col] === null) idx += 15;
        addSprite(col, row, 'garden', idx);
      }
    }

    // Add stones (previously walls)
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
