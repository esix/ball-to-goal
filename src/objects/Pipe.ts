import Phaser from 'phaser';
import { FIELD_HEIGHT, FIELD_WIDTH, getCellPxCenter, getPipeDrawing, GRID_SIZE, PipeType } from "../utils";

export class Pipe extends Phaser.GameObjects.Container {
  public col: number;
  public row: number;
  /**
   * Is the pipe  moving
   */
  public isDragging: boolean = false;
  public type: PipeType;
  private hitArea: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, col: number, row: number, type: PipeType) {
    const {x, y} = getCellPxCenter(col, row);
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
  }

  private createGraphics() {
    const graphics = this.scene.add.graphics();
    const S = GRID_SIZE;
    const half = S / 2;
    const lineWidth = S * 0.5;
    const R = half; // радиус средней линии
    const color = 0x00aaff;

    graphics.lineStyle(lineWidth, color, 1);
    const {cx, cy, a1, a2} = getPipeDrawing(this.type);
    graphics.arc(cx, cy, R, a1, a2);
    graphics.strokePath();
    this.add(graphics);
  }

  private dragOffset = { x: 0, y: 0 };

  private onPointerDown = (pointer: Phaser.Input.Pointer) => {
    this.dragOffset.x = pointer.x - this.x;
    this.dragOffset.y = pointer.y - this.y;
    this.isDragging = true;
    this.setAlpha(0.6);
    this.setY(this.y - 10);
  };

  private onPointerMove = (pointer: Phaser.Input.Pointer) => {
    if (this.isDragging) {
      this.x = pointer.x - this.dragOffset.x;
      this.y = pointer.y - this.dragOffset.y - 10;
      if (!pointer.isDown) {
        this.isDragging = false;
        this.snapToGrid();
      }
    }
  };

  private onPointerUp = () => {
    this.isDragging = false;
    this.snapToGrid();
    this.setAlpha(1);
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
