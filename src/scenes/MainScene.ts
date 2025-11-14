import Phaser from 'phaser';
import { Pipe } from '../objects/Pipe';
import { Goal } from '../objects/Goal';
import { Cannon } from "../objects/Cannon";
import { FIELD_HEIGHT, FIELD_WIDTH, GameObject, GRID_SIZE, StaticGameObject } from "../utils";
import { Ball } from "../objects/Ball";
import Landscape from "../objects/Landscape";
import LEVELS from "../levels";


function getLevelFromUrlHash(defaultLevel: number = 0): number {
  const hash = window.location.hash;
  const match = hash.match(/#level=(\d+)/);
  const level = match ? parseInt(match[1], 10) : 0;
  if (Number.isInteger(level) && level >= 0 && level < LEVELS.length) {
    return level;
  }
  return defaultLevel;
}

function setLevelToUrlHash(level: number) {
  window.location.hash = `#level=${level}`;
}


export class MainScene extends Phaser.Scene {
  private garden!: Landscape;
  private cannon!: Cannon;
  private pipes: Pipe[] = [];                                                                       // all pipes
  private balls: Ball[] = [];
  private goal!: Goal;
  private currentLevel: number;
  private wallSet: Set<string> = new Set();                                                         // "col,row"
  private pitSet: Set<string> = new Set();

  constructor() {
    super('MainScene');
    this.currentLevel = 0;
  }

  preload(): void {
    this.load.image('stone', 'assets/stone.png');
    this.load.spritesheet('garden', 'assets/landscape/1.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('trees', 'assets/landscape/3.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('pipe', 'assets/pipe.png', {
      frameWidth: 128,
      frameHeight: 128,
    });
    this.load.image('ball', 'assets/bullet4.png');
    this.load.image('goal', 'assets/goal.png');
    this.load.image('cannon', 'assets/canon.png');
  }

  private loadLevel(i: number) {
    this.currentLevel = i;
    setLevelToUrlHash(this.currentLevel);

    this.cannon?.destroy(true);
    this.goal?.destroy();
    this.pipes.forEach(pipe => pipe.destroy(true));
    this.balls.forEach(ball => ball.destroy());
    this.garden?.destroy();

    const level = LEVELS[i];
    this.garden = new Landscape(this, level);
    this.drawGrid();

    this.cannon = new Cannon(this, level.cannon.col, level.cannon.row, level.cannon.direction);
    this.goal = new Goal(this, level.goal.col, level.goal.row);
    this.pipes = level.pipes.map(p =>
      new Pipe(this, p.col, p.row, p.type)
    );

    this.wallSet.clear();
    level.walls.forEach(w => this.wallSet.add(`${w.col},${w.row}`));

    this.pitSet.clear();
    level.pits.forEach(w => this.pitSet.add(`${w.col},${w.row}`));

    // Привязываем выстрел
    this.cannon.onFire(() => this.launchBall());
  }

  create(): void {
    this.currentLevel = getLevelFromUrlHash(0);
    this.loadLevel(this.currentLevel);
    window.addEventListener('hashchange', this.onHashChange);
  }

  private onHashChange = () => {
    const newLevel = getLevelFromUrlHash(this.currentLevel);
    if (newLevel !== this.currentLevel) {
      this.loadLevel(newLevel);
    }
  };

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

  /**
   * Get game object at specifiec coordinates
   * @param col
   * @param row
   */
  private getGameObject = (col: number, row: number): GameObject | null => {
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

    if (this.wallSet.has(`${col},${row}`)) {
      return StaticGameObject.Wall;
    }

    if (this.pitSet.has(`${col},${row}`)) {
      return StaticGameObject.Pit;
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
      if (this.currentLevel >= LEVELS.length - 1) {
        this.add.text(400, 300, 'Все уровни пройдены! 🌟', { fontSize: '48px', color: '#fff' }).setOrigin(0.5);
        return;
      } else {
        this.loadLevel(this.currentLevel + 1);
      }
    }
  };

  private launchBall() {
    const ball = new Ball(this, this.cannon.col, this.cannon.row, this.cannon.direction, this.getGameObject, this.onBallCompleted);
    this.balls.push(ball);
  }
}
