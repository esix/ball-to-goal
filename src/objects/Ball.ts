import Phaser from 'phaser';
import {
  BALL_SPEED,
  Direction,
  GameObject,
  getCellPxCenter,
  getOppositeDirection,
  getPipedDirection,
  getPipeDrawing,
  getVelocity,
  GRID_SIZE,
  isPipe,
  StaticGameObject
} from "../utils";

type FnGetGO = (col: number, row: number) => GameObject | null;
type FnDead = (ball: Ball, win: boolean) => unknown;


export class Ball extends Phaser.GameObjects.Container {
  private activeTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene,
              public col: number,
              public row: number,
              public direction: Direction,
              private getGO: FnGetGO,
              private onCompeted: FnDead) {
    const {x, y} = getCellPxCenter(col, row);
    super(scene, x, y);

    this.createGraphics();
    scene.add.existing(this);

    this.run();
  }

  private createGraphics() {
    // const circle = this.scene.add.circle(0, 0, 12, 0xff5500);
    const circle = this.scene.add.sprite(0, 0, 'ball', 0);
    circle.setDisplaySize(GRID_SIZE / 3, GRID_SIZE / 3);
    circle.setOrigin(0.5);
    this.add([circle]);
  }

  private setTween(opts: {[p: string]: any}) {
    return new Promise<void>((resolve, reject) => {
      if (this.activeTween) {
        this.activeTween.stop();
      }
      this.activeTween = this.scene.tweens.add({
        targets: this,
        duration: BALL_SPEED / 2,
        ease: 'Linear',
        ...opts,
        onComplete: () => {
          this.activeTween = null;
          resolve();
        },
        onStop: () => {
          reject();
        }
      });
    });
  }

  private moveToRealCoords(x: number, y: number): Promise<void> {
    return this.setTween({x, y, duration: BALL_SPEED / 2});
  }

  private winAnimation(): Promise<void> {
    return this.setTween({scaleX: 1.5, scaleY: 1.5, duration: BALL_SPEED, yoyo: true});
  }

  private async moveToNextBorder(): Promise<{ col: number, row: number}> {
    const {dirX, dirY} = getVelocity(this.direction);
    const go = this.getGO(this.col, this.row);                                                      // GameObject in current cell

    if (isPipe(go)) {
      // current cell is PIPE, and we are continuing moving through that pipe
      // So we take params like if we were moving to the pipe from opposite
      // but negate angles
      const {x, y} = getCellPxCenter(this.col, this.row);
      const {cx, cy, a1, a2} = getPipeDrawing(go, getOppositeDirection(this.direction));
      await this.arcAnimation(x + cx, y + cy, GRID_SIZE / 2, (a1 + a2) / 2, a1);
      return {col: this.col + dirX, row: this.row + dirY};
    }

    await this.moveToRealCoords(
      (this.col + dirX / 2 + 0.5) * GRID_SIZE,                                                      // To next border of cell
      (this.row + dirY / 2 + 0.5) * GRID_SIZE)
    return {col: this.col + dirX, row: this.row + dirY};
  }

  /**
   * Move ball to the center of the cell
   * @param col cell column to move ball in
   * @param row cell row
   * @private
   */
  private moveToCenter(col: number, row: number): Promise<void> {
    return this.moveToRealCoords(
      (col + 0.5) * GRID_SIZE,                                                                      // To next border of cell
      (row + 0.5) * GRID_SIZE)
  }

  /**
   * Animate ball movements as arc
   * @param centerX
   * @param centerY
   * @param radius
   * @param startAngle
   * @param endAngle
   * @private
   */
  private async arcAnimation(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
    const startX = centerX + Math.cos(startAngle) * radius;
    const startY = centerY + Math.sin(startAngle) * radius;
    this.setPosition(startX, startY);
    const arcLen = Math.abs(startAngle - endAngle) * radius;
    const SPEED = Math.round(BALL_SPEED * arcLen / GRID_SIZE);

    const fakeTarget = { progress: 0 };

    await this.setTween({
      targets: fakeTarget,
      progress: 1,
      duration: SPEED,
      onUpdate: (tween: any) => {
        const progress = tween.progress; // 0 → 1
        const angle = startAngle * (1 - progress) + endAngle * progress;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        this.setPosition(x, y);
      },
    });
  }

  private async run() {
    try {
      while (true) {
        if (!(await this.moveStep())) {
          break;
        }
      }
    } catch (err) {
      // The animation was cancelled - next level
    }
  }

  /**
   * Move ball from current cell to the next cell
   * @private
   */
  private async moveStep(): Promise<boolean> {
    const {col, row} = await this.moveToNextBorder();
    const go = this.getGO(col, row);

    if (go === null || go === StaticGameObject.Cannon || go === StaticGameObject.Pit) {             // Out of screen or impassable objects
      this.onCompeted(this, false);
      return false;
    }

    if (isPipe(go)) {
      const newDirection = getPipedDirection(go, this.direction);
      if (newDirection === null) {                                                                  // Into the edge of pipe
        this.onCompeted(this, false);
        return false;
      }
      // Moving to center of pipe
      const {x, y} = getCellPxCenter(col, row);
      const {cx, cy, a1, a2} = getPipeDrawing(go, this.direction);
      await this.arcAnimation(x + cx, y + cy, GRID_SIZE / 2, a1, (a1 + a2) / 2);

      this.col = col;
      this.row = row;
      this.direction = newDirection;

      return true;
    }

    if (go === StaticGameObject.Goal) {
      await this.moveToCenter(col, row);
      await this.winAnimation();
      this.onCompeted(this, true);
      return false;
    }

    if (go === StaticGameObject.Wall) {
      const currentGo = this.getGO(this.col, this.row);
      if (isPipe(currentGo)) {
        const newDirection = getPipedDirection(currentGo, getOppositeDirection(this.direction));
        if (newDirection === null) {
          this.onCompeted(this, false);
          return false
        }
        this.direction = newDirection;

        // Moving to center of pipe
        const {x, y} = getCellPxCenter(this.col, this.row);
        const {cx, cy, a1, a2} = getPipeDrawing(currentGo, this.direction);
        await this.arcAnimation(x + cx, y + cy, GRID_SIZE / 2, a1, (a1 + a2) / 2);

      } else {
        this.direction = getOppositeDirection(this.direction);
        await this.moveToCenter(this.col, this.row);
      }

      return true;
    }
    // EMPTY
    await this.moveToCenter(col, row);
    this.col = col;
    this.row = row;
    return true;
  };

  public destroy(fromScene?: boolean) {
    if (this.activeTween) {
      this.activeTween.stop();
      this.activeTween = null;
    }
    super.destroy(fromScene);
  }
}
