// src/scenes/MainScene.ts
import Phaser from 'phaser';
import { Pipe } from '../objects/Pipe';
import { Goal } from '../objects/Goal';
import { Cannon } from "../objects/Cannon";
import { Direction, FIELD_HEIGHT, FIELD_WIDTH, GRID_SIZE, PipeType, StaticGameObject } from "../constants";
import { Ball } from "../objects/Ball";

interface LevelData {
  cannon: { col: number; row: number; direction: Direction };
  goal: { col: number; row: number };
  pipes: Array<{ type: PipeType; col: number; row: number }>;
  walls: Array<{ col: number; row: number }>;
}

const LEVELS: LevelData[] = [
  {
    cannon: { col: 1, row: 4, direction: Direction.Right },
    goal: { col: 6, row: 1 },
    pipes: [
      { col: 1, row: 3, type: PipeType.LeftUp },
    ],
    walls: [],
  },
  {
    cannon: { col: 1, row: 4, direction: Direction.Right },
    goal: { col: 9, row: 3 },
    pipes: [
      { col: 0, row: 0, type: PipeType.RightDown },    { col: 3, row: 0, type: PipeType.LeftDown },
      { col: 0, row: 3, type: PipeType.RightUp },      { col: 3, row: 3, type: PipeType.LeftUp },
    ],
    walls: [],
  }
];


export class MainScene extends Phaser.Scene {
  private cannon!: Cannon;
  private pipes: Pipe[] = []; // будем хранить все трубки
  // private balls: Phaser.GameObjects.Arc[] = [];
  private balls: Ball[] = [];
  private goal!: Goal;
  private currentLevel: number;

  constructor() {
    super('MainScene');
    this.currentLevel = 0;
  }

  preload(): void {
  }

  private loadLevel(i: number) {
    this.cannon?.destroy(true);
    this.goal?.destroy();
    this.pipes.forEach(pipe => pipe.destroy(true));
    this.balls.forEach(ball => ball.destroy());
    this.balls = [];

    const level = LEVELS[i];
    this.cannon = new Cannon(this, level.cannon.col, level.cannon.row, level.cannon.direction);
    this.goal = new Goal(this, level.goal.col, level.goal.row);
    this.pipes = level.pipes.map(p =>
      new Pipe(this, p.col, p.row, p.type)
    );

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

    for (let x = 0; x <= FIELD_WIDTH; x++) {                                                        // Вертикальные линии
      const px = x * GRID_SIZE;
      graphics.lineBetween(px, 0, px, FIELD_HEIGHT * GRID_SIZE);
    }

    for (let y = 0; y <= FIELD_HEIGHT; y++) {                                                       // Горизонтальные линии
      const py = y * GRID_SIZE;
      graphics.lineBetween(0, py, FIELD_WIDTH * GRID_SIZE, py);
    }
  }

  private getGO = (col: number, row: number) => {
    if (col < 0 || col >= FIELD_WIDTH - 1 || row < 0 || row >= FIELD_HEIGHT) {
      return null;
    }
    const pipeHere = this.pipes.find(p => p.col === col && p.row === row);
    if (pipeHere) {
      return pipeHere.type;
    }

    if (this.goal.isAt(col, row)) {
      return StaticGameObject.Goal;
    }

    return StaticGameObject.Empty;
  };

  private onBallCompleted = (ball: Ball, win: boolean) => {
    const idx = this.balls.indexOf(ball);
    if (idx !== -1) this.balls.splice(idx, 1);
    ball.destroy();

    if (win) {
      this.currentLevel++;

      if (this.currentLevel >= LEVELS.length) {                                                     // Конец игры
        this.add.text(400, 300, 'Все уровни пройдены! 🌟', { fontSize: '48px', color: '#fff' }).setOrigin(0.5);
        return;
      } else {
        this.loadLevel(this.currentLevel);
      }
    }
  };

  private launchBall() {
    const ball = new Ball(this, this.cannon.col, this.cannon.row, this.cannon.direction, this.getGO, this.onBallCompleted);
    this.balls.push(ball);
    //
    // const startCol = this.cannon.col;
    // const startRow = this.cannon.row;
    // let dirX = 1;
    // let dirY = 0;
    //
    // // Создаём мячик один раз
    // const startX = (startCol + 0.5) * GRID_SIZE;
    // const startY = (startRow + 0.5) * GRID_SIZE;
    // const ball = this.add.circle(startX, startY, 12, 0xff5500);
    // this.balls.push(ball);
    // ball.setDepth(10);
    //

    //
    // const moveStep = (col: number, row: number) => {
    //   const nextCol = col + dirX;
    //   const nextRow = row + dirY;
    //
    //   if (nextCol < 0 || nextCol >= FIELD_WIDTH || nextRow < 0 || nextRow >= FIELD_HEIGHT) {
    //     debugger;
    //     ball.destroy();
    //     return;
    //   }
    //
    //   const toX = (nextCol + 0.5) * GRID_SIZE;
    //   const toY = (nextRow + 0.5) * GRID_SIZE;
    //
    //   this.tweens.add({
    //     targets: ball,
    //     x: toX,
    //     y: toY,
    //     duration: 300,
    //     ease: 'Linear',
    //     onComplete: () => {
    //       if (this.goal.isAt(nextCol, nextRow)) {
    //         this.tweens.add({                                                                       // Ура! Попал в ворота
    //           targets: ball,
    //           scaleX: 1.5,
    //           scaleY: 1.5,
    //           duration: 300,
    //           yoyo: true,
    //           onComplete: () => {
    //             ball.destroy();
    //             this.currentLevel++;
    //             this.loadLevel(this.currentLevel);
    //           }
    //         });
    //         // Можно добавить звук или частицы позже
    //         return;
    //       }
    //
    //       // Проверка трубки в клетке (nextCol, nextRow)
    //       const pipeHere = this.pipes.find(p => p.col === nextCol && p.row === nextRow);
    //
    //       if (pipeHere) {
    //         const newDir = pipeHere.getNewDirection(dirX, dirY);
    //         dirX = newDir.dirX;
    //         dirY = newDir.dirY;
    //       }
    //
    //       moveStep(nextCol, nextRow);
    //     }
    //   });
    // };
    //
    // moveStep(startCol, startRow);
  }

}
