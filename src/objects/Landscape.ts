import Phaser from "phaser";
import {FIELD_HEIGHT, FIELD_WIDTH, getCellPxCenter, GRID_SIZE, LevelData} from "../utils";

/**
 * Find 8 neighbours on the map of the same type as provided, up, left, right and down
 *
 * @param map map matrix
 * @param i row coordinate
 * @param j column coordinate
 */
function collectNeighboursMask(map: number[][], i: number, j: number): number {
  const texture = map[i][j];
  if (texture === null) return 0;

  const get = (i: number, j: number): 1 | 0 => i < 0 || i >= map.length || j < 0 || j >= map[i].length ? 1 : (map[i][j] === texture ? 1 : 0);

  const result =
    // diagonal
    (get(i - 1, j - 1) << 7) |
    (get(i - 1, j + 1) << 6) |
    (get(i + 1, j - 1) << 5) |
    (get(i + 1, j + 1) << 4) |
    // close
    (get(i - 1, j) << 3) |
    (get(i, j - 1) << 2) |
    (get(i, j + 1) << 1) |
    (get(i + 1, j) << 0);

  return result;
}


const TEXTURE_NEIGHBOUR_DELTA = [
  0,                              // 0000
  -15,                            // 0001
  -1,                             // 0010
  -16,                            // 0011 - top left corner
  1,                              // 0100
  -14,                            // 0101 - top right corner
  0,                              // 0110
  -15,                            // 0111 - top edge
  15,                             // 1000
  0,                              // 1001
  14,                             // 1010 - bottom-left corner
  -1,                             // 1011 - left edge
  16,                             // 1100 - bottom-right corner
  1,                              // 1101 - right edge
  15,                             // 1110 - bottom edge
  0,                              // 1111 - middle
];


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

    const GRASS = getTxtIndex(1, 1);
    const WATER = getTxtIndex(1, 7);
    const BRICK = getTxtIndex(1, 13);
    const SAND = getTxtIndex(6, 10);

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
        addSprite(col, row, 'garden', GRASS, {alpha: 0.6});
      }
    }

    const map: number[][] = Array(FIELD_HEIGHT * 3).fill(0).map(() => Array(FIELD_WIDTH * 3).fill(null));

    const groundify = (col: number, row: number, textureIndex: number, fillCorner: boolean) => {
      for (let i = row - 2; i <= row + 2; i++) {
        for (let j = col - 2; j <= col + 2; j++) {
          // map[row + i][col + j] = getTxtIndex(txtJ + sign(j) * +(abs(j) === 2), txtI + sign(i) * +(abs(i) === 2));
          if (i < 0 || i >= H || j < 0 || j >= W) continue;
          if (!fillCorner) {
            if (i === row - 2 && j === col - 2) continue;
            if (i === row - 2 && j === col + 2) continue;
            if (i === row + 2 && j === col - 2) continue;
            if (i === row + 2 && j === col + 2) continue;
          }
          map[i][j] = textureIndex;
        }
      }
    };
    groundify(this.level.cannon.col * 3 + 1, this.level.cannon.row * 3 + 1, BRICK, false);
    // ROADS
    this.level.roads.forEach(({row, col}) => {
      map[row * 3 + 1][col * 3 + 1] = BRICK;
      if (map[(row - 1) * 3 + 1]?.[col * 3 + 1] === BRICK) {
        map[row * 3][col * 3 + 1] = BRICK;
        map[row * 3 - 1][col * 3 + 1] = BRICK;
      }
      if (map[row * 3 + 1]?.[(col - 1) * 3 + 1] === BRICK) {
        map[row * 3 + 1][col * 3] = BRICK;
        map[row * 3 + 1][col * 3 - 1] = BRICK;
      }
    });

    groundify(this.level.goal.col * 3 + 1, this.level.goal.row * 3 + 1, SAND, true);
    for (let pit of this.level.pits) {
      groundify(pit.col * 3 + 1, pit.row * 3 + 1, WATER, false);
    }

    for (let i = 0; i < H; i++) {
      for (let j = 0; j < W; j++) {
        const idx = map[i][j];
        if (idx === null) continue;
        const mask = collectNeighboursMask(map, i, j);
        let correctedIdx = idx + TEXTURE_NEIGHBOUR_DELTA[mask & 0b1111];                            // texture corner correction (only for nearest neighbours)

        // Additional corrections - for corners
        if (idx === WATER) {
          // FOR water another logic
          if (mask === 0b01111111) correctedIdx = idx + 2 - 15;                                     // not the same just to the left-top
          else if (mask === 0b10111111) correctedIdx = idx + 3 - 15;
          else if (mask === 0b11011111) correctedIdx = idx + 2;                                     // not the same just to the bottom-left
          else if (mask === 0b11101111) correctedIdx = idx + 3;                                     // not the same just to the bottom-right

        } else {
          if (mask === 0b01111111) correctedIdx = idx + 3;                                          // not the same just to the left-top
          else if (mask === 0b10111111) correctedIdx = idx + 2;
          else if (mask === 0b11011111) correctedIdx = idx - 15 + 3;                                // not the same just to the bottom-left
          else if (mask === 0b11101111) correctedIdx = idx - 15 + 2;                                // not the same just to the bottom-right
        }

        addSprite(j, i, 'garden', correctedIdx);
      }
    }

    // Add stones
    for (let stone of this.level.walls) {
      const {x, y} = getCellPxCenter(stone.col, stone.row);
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
