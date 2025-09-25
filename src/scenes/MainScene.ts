// src/scenes/MainScene.ts
import Phaser from 'phaser';
import { Pipe, PipeType } from '../objects/Pipe';
import { Goal } from '../objects/Goal';
import { Cannon } from "../objects/Cannon";

const level1 = {
  cannon: { col: 1, row: 4 },
  goal: { col: 9, row: 3 },
  pipes: [
    { col: 0, row: 0, type: PipeType.RightDown },    { col: 3, row: 0, type: PipeType.LeftDown },
    { col: 0, row: 3, type: PipeType.RightUp },      { col: 3, row: 3, type: PipeType.LeftUp },

  ]
};

export class MainScene extends Phaser.Scene {
  private gridSize = 80;
  private gridWidth = 10;  // 10 клеток → 800px
  private gridHeight = 8;  // 8 клеток → 640px (немного обрежется, но ок)
  private cannon!: Cannon;
  private pipes: Pipe[] = []; // будем хранить все трубки
  private balls: Phaser.GameObjects.Arc[] = [];
  private goal!: Goal;

  constructor() {
    super('MainScene');
  }

  preload(): void {
  }

  create(): void {
    this.cannon = new Cannon(this, level1.cannon.col, level1.cannon.row, this.gridSize);
    this.goal = new Goal(this, level1.goal.col, level1.goal.row, this.gridSize);
    this.pipes = level1.pipes.map(p =>
      new Pipe(this, p.col, p.row, p.type, this.gridSize, this.gridWidth, this.gridHeight)
    );

    // Привязываем выстрел
    this.cannon.onFire(() => this.launchBall());

    const body = this.add.rectangle(0, 0, 50, 40, 0xff4444).setOrigin(0.5);
    const barrel = this.add.rectangle(30, 0, 40, 20, 0xffff00).setOrigin(0, 0.5);

    this.cannon.add([body, barrel]);

    // Делаем пушку интерактивной
    const hitArea = this.add.rectangle(0, 0, 60, 50, 0x000000, 0).setOrigin(0.5);
    hitArea.setInteractive({useHandCursor: true});
    this.cannon.add(hitArea);
    hitArea.on('pointerover', () => {
      this.cannon.setScale(1.1);
    });
    hitArea.on('pointerout', () => {
      this.cannon.setScale(1);
    });
    hitArea.on('pointerdown', () => {
      this.launchBall();
    });

    this.drawGrid();
  }

  private drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xffffff, 0.3);

    // Вертикальные линии
    for (let x = 0; x <= this.gridWidth; x++) {
      const px = x * this.gridSize;
      graphics.lineBetween(px, 0, px, this.gridHeight * this.gridSize);
    }

    // Горизонтальные линии
    for (let y = 0; y <= this.gridHeight; y++) {
      const py = y * this.gridSize;
      graphics.lineBetween(0, py, this.gridWidth * this.gridSize, py);
    }
  }

  private launchBall() {
    const startCol = this.cannon.col;
    const startRow = this.cannon.row;
    let dirX = 1;
    let dirY = 0;

    // Создаём мячик один раз
    const startX = (startCol + 0.5) * this.gridSize;
    const startY = (startRow + 0.5) * this.gridSize;
    const ball = this.add.circle(startX, startY, 12, 0xff5500);
    ball.setDepth(10);

    this.tweens.add({
      targets: this.cannon,
      x: '+=-10', // сдвинуть на -10 от текущего x
      duration: 50,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    const moveStep = (col: number, row: number) => {
      const nextCol = col + dirX;
      const nextRow = row + dirY;

      if (
        nextCol < 0 || nextCol >= this.gridWidth ||
        nextRow < 0 || nextRow >= this.gridHeight
      ) {
        ball.destroy();
        return;
      }

      const toX = (nextCol + 0.5) * this.gridSize;
      const toY = (nextRow + 0.5) * this.gridSize;

      this.tweens.add({
        targets: ball,
        x: toX,
        y: toY,
        duration: 300,
        ease: 'Linear',
        onComplete: () => {
          if (this.goal.isAt(nextCol, nextRow)) {
            this.tweens.add({                                                                       // Ура! Попал в ворота
              targets: ball,
              scaleX: 1.5,
              scaleY: 1.5,
              duration: 300,
              yoyo: true,
              onComplete: () => ball.destroy()
            });
            // Можно добавить звук или частицы позже
            return;
          }

          // Проверка трубки в клетке (nextCol, nextRow)
          const pipeHere = this.pipes.find(p => p.col === nextCol && p.row === nextRow);

          if (pipeHere) {
            const newDir = pipeHere.getNewDirection(dirX, dirY);
            dirX = newDir.dirX;
            dirY = newDir.dirY;
          }

          moveStep(nextCol, nextRow);
        }
      });
    };

    moveStep(startCol, startRow);
  }


}
