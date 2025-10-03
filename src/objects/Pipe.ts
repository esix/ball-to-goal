// src/objects/Pipe.ts
import Phaser from 'phaser';
import { FIELD_HEIGHT, FIELD_WIDTH, GRID_SIZE, PipeType } from "../constants";

let id: number = 0;

export class Pipe extends Phaser.GameObjects.Container {
  public col: number;
  public row: number;
  public type: PipeType;
  private id;
  private hitArea: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, col: number, row: number, type: PipeType) {
    // Вычисляем позицию по центру клетки
    const x = (col + 0.5) * GRID_SIZE;
    const y = (row + 0.5) * GRID_SIZE;

    super(scene, x, y);
    this.col = col;
    this.row = row;
    this.type = type;

    this.createGraphics();

    this.hitArea = this.scene.add.rectangle(0, 0, GRID_SIZE, GRID_SIZE, 0x000000, 0);
    this.hitArea.setOrigin(0.5);
    this.hitArea.setInteractive({ draggable: true });
    this.add(this.hitArea);

    this.hitArea.on('pointerdown', this.onPointerDown);
    this.scene.input.on('pointermove', this.onPointerMove);
    this.scene.input.on('pointerup', this.onPointerUp);

    scene.add.existing(this);
    this.id = id++;
  }

  private createGraphics() {
    const graphics = this.scene.add.graphics();
    const S = GRID_SIZE;
    const half = S / 2;
    const lineWidth = S * 0.5;
    const R = half; // радиус средней линии
    const color = 0x00aaff;

    graphics.lineStyle(lineWidth, color, 1);

    switch (this.type) {
      case PipeType.LeftDown: // ↘: соединяет ЛЕВО и НИЗ
        // Центр дуги — в НИЖНЕМ ЛЕВОМ углу клетки
        graphics.arc(-half, half, R, -Math.PI / 2, 0);
        break;

      case PipeType.RightDown: // ↙: соединяет ПРАВО и НИЗ
        // Центр — в НИЖНЕМ ПРАВОМ углу
        graphics.arc(half, half, R, Math.PI * 1, Math.PI * 1.5);
        break;

      case PipeType.LeftUp: // ↗: соединяет ЛЕВО и ВЕРХ
        // Центр — в ВЕРХНЕМ ЛЕВОМ углу
        graphics.arc(-half, -half, R, Math.PI / 2, 0, true);
        break;

      case PipeType.RightUp: // ↖: соединяет ПРАВО и ВЕРХ
        // Центр — в ВЕРХНЕМ ПРАВОМ углу
        graphics.arc(half, -half, R, -3 * Math.PI / 2, -Math.PI);
        break;
    }

    graphics.strokePath();
    this.add(graphics);
  }

  private isDragging: boolean = false;
  private dragOffset = { x: 0, y: 0 };

  private onPointerDown = (pointer: Phaser.Input.Pointer) => {
    this.dragOffset.x = pointer.x - this.x;
    this.dragOffset.y = pointer.y - this.y;
    this.isDragging = true;
  };

  private onPointerMove = (pointer: Phaser.Input.Pointer) => {
    if (this.isDragging) {
      this.x = pointer.x - this.dragOffset.x;
      this.y = pointer.y - this.dragOffset.y;
      if (!pointer.isDown) {
        this.isDragging = false;
        this.snapToGrid();
      }
    }
  };

  private onPointerUp = () => {
    this.isDragging = false;
    this.snapToGrid();
  };

  private snapToGrid() {
    const col = Phaser.Math.Clamp(
      Math.floor(this.x / GRID_SIZE),
      0,
      FIELD_WIDTH - 1
    );
    const row = Phaser.Math.Clamp(
      Math.floor(this.y / GRID_SIZE),
      0,
      FIELD_HEIGHT - 1
    );

    // Обновляем логические координаты
    this.col = col;
    this.row = row;

    // Перемещаем в центр клетки
    this.x = (col + 0.5) * GRID_SIZE;
    this.y = (row + 0.5) * GRID_SIZE;
  }

  public destroy(fromScene?: boolean) {
    this.hitArea.off('pointerdown', this.onPointerDown);
    this.scene.input.off('pointermove', this.onPointerMove);
    this.scene.input.off('pointerup', this.onPointerUp);
    super.destroy(fromScene);
  }
}
