// src/scenes/MainScene.ts
import Phaser from 'phaser';
import { Pipe, PipeType } from '../objects/Pipe';
import { Goal } from '../objects/Goal';
import { Cannon } from "../objects/Cannon";
import {FIELD_HEIGHT, FIELD_WIDTH, GRID_SIZE, MAX_STEPS} from "../constants";

interface LevelData {
  cannon: { col: number; row: number };
  goal: { col: number; row: number };
  pipes: Array<{ type: PipeType; col: number; row: number }>;
  walls: Array<{ col: number; row: number }>;
}

const LEVELS: LevelData[] = [
  {
    cannon: { col: 1, row: 4 },
    goal: { col: 6, row: 1 },
    pipes: [
      { col: 1, row: 3, type: PipeType.LeftUp },
    ],
    walls: [
      { col: 5, row: 2 }
    ],
  },
  {
    cannon: { col: 1, row: 4 },
    goal: { col: 9, row: 3 },
    pipes: [
      { col: 0, row: 0, type: PipeType.RightDown },    { col: 3, row: 0, type: PipeType.LeftDown },
      { col: 0, row: 3, type: PipeType.RightUp },      { col: 3, row: 3, type: PipeType.LeftUp },
    ],
    walls: [ { col: 9, row: 4 }],
  }
];


export class MainScene extends Phaser.Scene {
  private cannon!: Cannon;
  private pipes: Pipe[] = []; // будем хранить все трубки
  private balls: Phaser.GameObjects.Arc[] = [];
  private goal!: Goal;
  private currentLevel: number;
  private wallSet: Set<string> = new Set(); // "col,row"
  private wallsGroup: Phaser.GameObjects.Group | undefined;

  constructor() {
    super('MainScene');
    this.currentLevel = 0;
  }

  preload(): void {
  }

  private destroyBall = (ball: Phaser.GameObjects.Arc) => {
    const index = this.balls.indexOf(ball);
    if (index !== -1) {
      this.balls.splice(index, 1);
    }
    ball.destroy();
  };

  private loadLevel(i: number) {
    this.cannon?.destroy(true);
    this.goal?.destroy();
    this.pipes.forEach(pipe => pipe.destroy(true));
    this.tweens.killTweensOf(this.balls);
    this.balls.forEach(this.destroyBall);
    this.wallsGroup?.clear(true, true);

    const level = LEVELS[i];
    this.cannon = new Cannon(this, level.cannon.col, level.cannon.row);
    this.goal = new Goal(this, level.goal.col, level.goal.row);
    this.pipes = level.pipes.map(p =>
      new Pipe(this, p.col, p.row, p.type)
    );

    this.wallsGroup = this.add.group();
    level.walls.forEach(wall => {
      const wallSprite = this.add.rectangle(
          (wall.col + 0.5) * GRID_SIZE,
          (wall.row + 0.5) * GRID_SIZE,
          GRID_SIZE, GRID_SIZE,
          0x555555 // серый цвет
      ).setOrigin(0.5).setStrokeStyle(2, 0x000000);
      this.wallsGroup!.add(wallSprite);
    });
    this.wallSet.clear();
    level.walls.forEach(w => {
      this.wallSet.add(`${w.col},${w.row}`);
    });

    // Привязываем выстрел
    this.cannon.onFire(() => this.launchBall());
  }

  create(): void {
    this.drawGrid();
    this.loadLevel(this.currentLevel);
  }

  private drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xffffff, 0.3);

    // Вертикальные линии
    for (let x = 0; x <= FIELD_WIDTH; x++) {
      const px = x * GRID_SIZE;
      graphics.lineBetween(px, 0, px, FIELD_HEIGHT * GRID_SIZE);
    }

    // Горизонтальные линии
    for (let y = 0; y <= FIELD_HEIGHT; y++) {
      const py = y * GRID_SIZE;
      graphics.lineBetween(0, py, FIELD_WIDTH * GRID_SIZE, py);
    }
  }

  private isWall(col: number, row: number): boolean {
    return this.wallSet.has(`${col},${row}`);
  }

  private launchBall() {
    const startCol = this.cannon.col;
    const startRow = this.cannon.row;
    let dirX = 1;
    let dirY = 0;

    // Создаём мячик один раз
    const startX = (startCol + 0.5) * GRID_SIZE;
    const startY = (startRow + 0.5) * GRID_SIZE;
    const ball = this.add.circle(startX, startY, 12, 0xff5500);
    this.balls.push(ball);
    ball.setDepth(10);

    this.tweens.add({
      targets: this.cannon,
      x: '+=-10', // сдвинуть на -10 от текущего x
      duration: 50,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    let steps = 0;

    const moveStep = (col: number, row: number) => {
      steps++;
      if (steps > MAX_STEPS) {
        this.destroyBall(ball);
        return;
      }

      const nextCol = col + dirX;
      const nextRow = row + dirY;

      if (
        nextCol < 0 || nextCol >= FIELD_WIDTH ||
        nextRow < 0 || nextRow >= FIELD_HEIGHT
      ) {
        this.destroyBall(ball);
        return;
      }

      if (this.isWall(nextCol, nextRow)) {
        // Меняем направление на противоположное
        dirX = -dirX;
        dirY = -dirY;

        // Теперь летим в ОБРАТНУЮ клетку (откуда прилетели)
        const backCol = col + dirX; // теперь dirX уже изменён!
        const backRow = row + dirY;

        // Проверим, не вылетим ли за поле назад?
        if (
            backCol < 0 || backCol >= FIELD_WIDTH ||
            backRow < 0 || backRow >= FIELD_HEIGHT
        ) {
          this.destroyBall(ball);
          return;
        }

        const toX = (backCol + 0.5) * GRID_SIZE;
        const toY = (backRow + 0.5) * GRID_SIZE;

        this.tweens.add({
          targets: ball,
          x: toX,
          y: toY,
          duration: 300,
          ease: 'Linear',
          onComplete: () => {
            // После отскока — продолжаем из новой позиции
            moveStep(backCol, backRow);
          }
        });
        return;
      }

      const toX = (nextCol + 0.5) * GRID_SIZE;
      const toY = (nextRow + 0.5) * GRID_SIZE;

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
              onComplete: () => {
                ball.destroy();
                this.currentLevel++;
                this.loadLevel(this.currentLevel);
              }
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
