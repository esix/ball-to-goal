// src/objects/Cannon.ts
import Phaser from 'phaser';
import { GRID_SIZE } from "../constants";

export class Cannon extends Phaser.GameObjects.Container {
  public col: number;
  public row: number;

  constructor(scene: Phaser.Scene, col: number, row: number) {
    // Вычисляем позицию по центру клетки
    const x = (col + 0.5) * GRID_SIZE;
    const y = (row + 0.5) * GRID_SIZE;

    super(scene, x, y);
    this.col = col;
    this.row = row;

    this.createGraphics();
    this.makeInteractive();
    scene.add.existing(this);
  }

  private createGraphics() {
    const size = GRID_SIZE * 0.6;

    // Корпус пушки — красный круг или прямоугольник
    const body = this.scene.add.rectangle(0, 0, size, size * 0.8, 0xff4444)
      .setOrigin(0.5);

    // Ствол — жёлтый прямоугольник, направлен вправо
    const barrelLength = GRID_SIZE * 0.5;
    const barrel = this.scene.add.rectangle(size / 2, 0, barrelLength, size * 0.3, 0xffff00)
      .setOrigin(0, 0.5);

    this.add([body, barrel]);
  }

  private makeInteractive() {
    // Невидимая зона для клика
    const hitArea = this.scene.add.rectangle(0, 0, GRID_SIZE, GRID_SIZE, 0x000000, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.add(hitArea);

    hitArea.on('pointerover', () => {
      this.setScale(1.1);
    });

    hitArea.on('pointerout', () => {
      this.setScale(1);
    });

    // Событие будет обрабатываться в сцене через колбэк
  }

  // Метод для установки обработчика выстрела извне
  public onFire(callback: () => void) {
    const hitArea = this.getAt(2) as Phaser.GameObjects.Rectangle; // 3-й элемент — hitArea
    hitArea.removeAllListeners('pointerdown');
    hitArea.on('pointerdown', callback);
  }
}
