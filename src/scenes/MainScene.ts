import Phaser from 'phaser';
import { Pipe } from '../objects/Pipe';
import { Goal } from '../objects/Goal';
import { Cannon } from "../objects/Cannon";
import {
  Direction,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  getCellPxCenter,
  GRID_SIZE, LevelData,
  PipeType,
  StaticGameObject
} from "../utils";
import { Ball } from "../objects/Ball";
import Garden from "../objects/Garden";


const LEVELS: LevelData[] = [
  {
    cannon: { col: 1, row: 4, direction: Direction.Right },
    goal: { col: 6, row: 1 },
    pipes: [
      { col: 1, row: 3, type: PipeType.LeftUp },
    ],
    walls: [
      { col: 5, row: 2 }
    ],
  },
  {
    cannon: { col: 1, row: 4, direction: Direction.Right },
    goal: { col: 9, row: 3 },
    pipes: [
      { col: 3, row: 0, type: PipeType.RightDown },    { col: 5, row: 0, type: PipeType.LeftDown },
      { col: 3, row: 2, type: PipeType.RightUp },      { col: 5, row: 4, type: PipeType.LeftUp },
    ],
    walls: [ { col: 9, row: 4 }, { col: 9, row: 2 }],
  }
];


export class MainScene extends Phaser.Scene {
  private garden!: Garden;
  private cannon!: Cannon;
  private pipes: Pipe[] = []; // будем хранить все трубки
  private balls: Ball[] = [];
  private goal!: Goal;
  private currentLevel: number;
  private wallSet: Set<string> = new Set(); // "col,row"
  private wallsGroup: Phaser.GameObjects.Group | undefined;

  constructor() {
    super('MainScene');
    this.currentLevel = 0;
  }

  preload(): void {
    this.load.image('stone', 'assets/stone.png');
    // this.load.atlas('garden', 'assets/garden.png', 'assets/garden.json');
    this.load.spritesheet('garden', 'assets/garden.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('pipe', 'assets/pipe.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
  }

  private loadLevel(i: number) {
    this.cannon?.destroy(true);
    this.goal?.destroy();
    this.pipes.forEach(pipe => pipe.destroy(true));
    this.balls.forEach(ball => ball.destroy());
    this.wallsGroup?.clear(true, true);
    this.garden?.destroy();

    const level = LEVELS[i];
    this.garden = new Garden(this, level);
    this.drawGrid();

    this.cannon = new Cannon(this, level.cannon.col, level.cannon.row, level.cannon.direction);
    this.goal = new Goal(this, level.goal.col, level.goal.row);
    this.pipes = level.pipes.map(p =>
      new Pipe(this, p.col, p.row, p.type)
    );

    this.wallsGroup = this.add.group();
    level.walls.forEach(wall => {
      const {x, y} = getCellPxCenter(wall.col, wall.row);
      // const wallSprite = this.add.rectangle(
      //     x, y, GRID_SIZE, GRID_SIZE,
      //     0x555555 // серый цвет
      // ).setOrigin(0.5).setStrokeStyle(2, 0x000000);
      const wallSprite = this.add.image(x, y, 'stone')
          .setDisplaySize(GRID_SIZE * 1.2, GRID_SIZE * 1.2)
          .setOrigin(0.5);
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

  private isWall(col: number, row: number): boolean {
    return this.wallSet.has(`${col},${row}`);
  }

  private getGO = (col: number, row: number) => {
    if (col < 0 || col >= FIELD_WIDTH || row < 0 || row >= FIELD_HEIGHT) {
      return null;
    }
    const pipeHere = this.pipes.find(p => p.col === col && p.row === row && !p.isDragging);
    if (pipeHere) {
      return pipeHere.type;
    }

    if (this.goal.isAt(col, row)) {
      return StaticGameObject.Goal;
    }

    if (this.isWall(col, row)) {
      return StaticGameObject.Wall;
    }
    if (col === this.cannon.col && row === this.cannon.row) {
      return StaticGameObject.Cannon;
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
  }
}
