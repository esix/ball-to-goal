import Phaser from 'phaser';
import { GRID_SIZE } from "../utils";

export class Goal {
  public col: number;
  public row: number;
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, col: number, row: number) {
    this.scene = scene;
    this.col = col;
    this.row = row;

    // this.graphics = scene.add.graphics();
    const x = (this.col + 0.5) * GRID_SIZE;
    const y = (this.row + 0.5) * GRID_SIZE;
    this.graphics = this.scene.add.sprite(x, y, 'goal', 0);
    this.graphics.setDisplaySize(GRID_SIZE, GRID_SIZE);

    this.draw();
  }

  private draw() {
    const x = (this.col + 0.5) * GRID_SIZE;
    const y = (this.row + 0.5) * GRID_SIZE;
    const size = GRID_SIZE * 0.8;

    // // Рамка ворот — зелёная
    // this.graphics.lineStyle(6, 0x00cc00);
    // this.graphics.strokeRect(x - size / 2, y - size / 2, size, size);
    //
    // // Перекладина
    // this.graphics.lineStyle(4, 0x008800);
    // this.graphics.lineBetween(x - size / 2, y - size / 4, x + size / 2, y - size / 4);
    //
    // // Фон (опционально)
    // this.graphics.fillStyle(0x00ff00, 0.1);
    // this.graphics.fillRect(x - size / 2, y - size / 2, size, size);
  }

  public isAt(col: number, row: number): boolean {
    return this.col === col && this.row === row;
  }

  public destroy(fromScene?: boolean) {
    this.graphics.destroy(fromScene);
  }
}

