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
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private victoryContainer: Phaser.GameObjects.Container | null = null;
  private wallSet: Set<string> = new Set();                                                         // "col,row"
  private pitSet: Set<string> = new Set();

  constructor() {
    super('MainScene');
    this.currentLevel = 0;
  }

  preload(): void {
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

    this.victoryContainer?.destroy(true);
    this.victoryContainer = null;
    this.cannon?.destroy(true);
    this.goal?.destroy();
    this.pipes.forEach(pipe => pipe.destroy(true));
    this.balls.forEach(ball => ball.destroy());
    this.balls = [];
    this.garden?.destroy();
    this.gridGraphics?.destroy();

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
    this.input.keyboard!.on('keydown-SPACE', () => this.launchBall());
  }

  private onHashChange = () => {
    const newLevel = getLevelFromUrlHash(this.currentLevel);
    if (newLevel !== this.currentLevel) {
      this.loadLevel(newLevel);
    }
  };

  private drawGrid() {
    this.gridGraphics = this.add.graphics();
    const graphics = this.gridGraphics;
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
        this.showVictoryScreen();
      } else {
        this.loadLevel(this.currentLevel + 1);
      }
    }
  };

  private showVictoryScreen() {
    const W = FIELD_WIDTH * GRID_SIZE;
    const H = FIELD_HEIGHT * GRID_SIZE;
    const cx = W / 2;
    const cy = H / 2;
    const pw = 860, ph = 380;

    this.victoryContainer = this.add.container(0, 0);

    // Dark overlay
    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x12122a, 0.97);
    panel.fillRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 28);
    panel.lineStyle(3, 0xf0c040, 1);
    panel.strokeRoundedRect(cx - pw / 2, cy - ph / 2, pw, ph, 28);

    // Title
    const title = this.add.text(cx, cy - 110, '🌟  All Levels Complete!  🌟', {
      fontSize: '52px',
      color: '#f0c040',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    const sub = this.add.text(cx, cy - 30, 'You mastered every pipe!', {
      fontSize: '30px',
      color: '#9090bb',
    }).setOrigin(0.5);

    // Button background (drawn via graphics so it can redraw on hover)
    const btnW = 300, btnH = 74;
    const btnCx = cx, btnCy = cy + 90;
    const btnBg = this.add.graphics();

    const drawBtn = (fill: number) => {
      btnBg.clear();
      btnBg.fillStyle(fill, 1);
      btnBg.fillRoundedRect(btnCx - btnW / 2, btnCy - btnH / 2, btnW, btnH, 18);
    };
    drawBtn(0x27ae60);

    const btnLabel = this.add.text(btnCx, btnCy, 'Play Again', {
      fontSize: '34px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Invisible interactive hit zone over the button
    const hitZone = this.add.rectangle(btnCx, btnCy, btnW, btnH, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => drawBtn(0x1e8449));
    hitZone.on('pointerout',  () => drawBtn(0x27ae60));
    hitZone.on('pointerdown', () => this.loadLevel(0));

    this.victoryContainer.add([overlay, panel, title, sub, btnBg, btnLabel, hitZone]);
  }

  private launchBall() {
    const ball = new Ball(this, this.cannon.col, this.cannon.row, this.cannon.direction, this.getGameObject, this.onBallCompleted);
    this.balls.push(ball);
  }
}
