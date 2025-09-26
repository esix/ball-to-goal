// src/objects/Pipe.ts
import Phaser from 'phaser';
import { FIELD_HEIGHT, FIELD_WIDTH, GRID_SIZE } from "../constants";

export enum PipeType {
  RightDown = 'RightDown',
  LeftDown = 'LeftDown',
  RightUp = 'RightUp',
  LeftUp = 'LeftUp'
}

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

  public getNewDirection(dirX: number, dirY: number): { dirX: number; dirY: number } {
    let result = {dirX, dirY};

    const isFromUp = (dirX === 0 && dirY === 1);                        // пришел СВЕРХУ (↓)
    const isFromRight = (dirX === -1 && dirY === 0);                    // пришел СПРАВА (←)
    const isFromDown = (dirX === 0 && dirY === -1);                     // пришел СНИЗУ (↑)
    const isFromLeft = (dirX === 1 && dirY === 0);                      // пришел СЛЕВА (→)

    const GO_UP = {dirX: 0, dirY: -1};                                  // уйдет НАВЕРХ (↑)
    const GO_RIGHT = {dirX: 1, dirY: 0};                                // уйдет НАПРАВО (→)
    const GO_DOWN = {dirX: 0, dirY: 1};                                 // уйдет ВНИЗ (↓)
    const GO_LEFT = {dirX: -1, dirY: 0};                                // уйдет НАЛЕВО (←)

    switch (this.type) {
      case PipeType.LeftDown: // ↘: ЛЕВО ↔ НИЗ
        if (isFromLeft) result = GO_DOWN;
        else if (isFromDown) result = GO_LEFT;
        break;

      case PipeType.RightDown: // ↙: ПРАВО ↔ НИЗ
        if (isFromRight) result = GO_DOWN;
        else if (isFromDown) result = GO_RIGHT;
        break;

      case PipeType.LeftUp: // ↗: ЛЕВО ↔ ВЕРХ
        if (isFromLeft) result = GO_UP;
        else if (isFromUp) result = GO_LEFT;
        break;

      case PipeType.RightUp: // ↖: ПРАВО ↔ ВЕРХ
        if (isFromRight) result = GO_UP;
        else if (isFromUp) result = GO_RIGHT;
        break;
    }

    return result;
  }

  public destroy(fromScene?: boolean) {
    this.hitArea.off('pointerdown', this.onPointerDown);
    this.scene.input.off('pointermove', this.onPointerMove);
    this.scene.input.off('pointerup', this.onPointerUp);
    super.destroy(fromScene);
  }
}
