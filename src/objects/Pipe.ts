// src/objects/Pipe.ts
import Phaser from 'phaser';

export enum PipeType {
  RightDown = 'RightDown',
  LeftDown = 'LeftDown',
  RightUp = 'RightUp',
  LeftUp = 'LeftUp'
}

export class Pipe extends Phaser.GameObjects.Container {
  public col: number;
  public row: number;
  public type: PipeType;
  private gridSize: number;
  private gridWidth: number;
  private gridHeight: number;

  constructor(
    scene: Phaser.Scene,
    col: number,
    row: number,
    type: PipeType = PipeType.RightDown,
    gridSize: number = 80,
    gridWidth: number = 10,
    gridHeight: number = 8
  ) {
    // Вычисляем позицию по центру клетки
    const x = (col + 0.5) * gridSize;
    const y = (row + 0.5) * gridSize;

    super(scene, x, y);
    this.col = col;
    this.row = row;
    this.type = type;
    this.gridSize = gridSize;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;

    this.createGraphics();
    this.makeInteractive();
    scene.add.existing(this);
  }

  private createGraphics() {
    const graphics = this.scene.add.graphics();
    const S = this.gridSize;
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

  private makeInteractive() {
    const hitArea = this.scene.add.rectangle(0, 0, this.gridSize, this.gridSize, 0x000000, 0);
    hitArea.setOrigin(0.5);
    hitArea.setInteractive({ draggable: true });
    this.add(hitArea);

    hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dragOffset.x = pointer.x - this.x;
      this.dragOffset.y = pointer.y - this.y;
    });

    hitArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.x = pointer.x - this.dragOffset.x;
        this.y = pointer.y - this.dragOffset.y;
      }
    });

    hitArea.on('pointerup', () => {
      this.snapToGrid();
    });
  }

  private dragOffset = { x: 0, y: 0 };

  private snapToGrid() {
    const col = Phaser.Math.Clamp(
      Math.floor(this.x / this.gridSize),
      0,
      this.gridWidth - 1
    );
    const row = Phaser.Math.Clamp(
      Math.floor(this.y / this.gridSize),
      0,
      this.gridHeight - 1
    );

    // Обновляем логические координаты
    this.col = col;
    this.row = row;

    // Перемещаем в центр клетки
    this.x = (col + 0.5) * this.gridSize;
    this.y = (row + 0.5) * this.gridSize;
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
}
