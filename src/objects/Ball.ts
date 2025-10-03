import Phaser from 'phaser';
import { BALL_SPEED, Direction, GameObject, GRID_SIZE, PipeType, StaticGameObject } from "../constants";

function getVelocity(d: Direction): {dirX: number, dirY: number} {
  if (d === Direction.Right) return {dirX: 1, dirY: 0};
  if (d === Direction.Left) return {dirX: -1, dirY: 0};
  if (d === Direction.Up) return {dirX: 0, dirY: -1};
  if (d === Direction.Down) return {dirX: 0, dirY: 1};
  throw new Error('Unknown direction');
}


type FnGetGO = (col: number, row: number) => GameObject;
type FnDead = (ball: Ball, win: boolean) => unknown;

export class Ball extends Phaser.GameObjects.Container {
  private activeTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, public col: number, public row: number, public direction: Direction, private getGO: FnGetGO, private onCompeted: FnDead) {
    const x = (col + 0.5) * GRID_SIZE;                                                              // позиция по центру клетки
    const y = (row + 0.5) * GRID_SIZE;
    super(scene, x, y);

    this.createGraphics();
    scene.add.existing(this);

    this._moveStep();
  }

  private createGraphics() {
    const circle = this.scene.add.circle(0, 0, 12, 0xff5500)
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
    await this.moveToRealCoords(
      (this.col + dirX / 2 + 0.5) * GRID_SIZE,                                                      // To next border of cell
      (this.row + dirY / 2 + 0.5) * GRID_SIZE)
    return {col: this.col + dirX, row: this.row + dirY};
  }

  // move ball to the center of the cell
  private moveToCenter(col: number, row: number): Promise<void> {
    return this.moveToRealCoords(
      (col + 0.5) * GRID_SIZE,                                                      // To next border of cell
      (row + 0.5) * GRID_SIZE)
  }

  private async arcAnimation(centerX: number, centerY: number, radius: number,startAngle: number, endAngle: number) {
    const startX = centerX + Math.cos(startAngle) * radius;
    const startY = centerY + Math.sin(startAngle) * radius;
    this.setPosition(startX, startY);

    const fakeTarget = { progress: 0 };

    await this.setTween({
      targets: fakeTarget,
      progress: 1,
      duration: BALL_SPEED,
      onUpdate: (tween: any) => {
        const progress = tween.progress; // 0 → 1
        const angle = startAngle * (1 - progress) + endAngle * progress;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        this.setPosition(x, y);
      },
    });
  }

  private async _moveStep() {
    try {
      const {col, row} = await this.moveToNextBorder();
      const go = this.getGO(col, row);

      if (go === null) {
        this.onCompeted(this, false);
        return;
      }
      if (go === PipeType.LeftDown || go === PipeType.RightDown || go === PipeType.LeftUp || go === PipeType.RightUp) {
        const newDirection = this.getPipedDirection(go, this.direction);
        if (newDirection === null) {                                                              // Into the edge of pipe
          this.onCompeted(this, false);
          return;
        }
        // await this.moveToCenter(col, row);
        await this.arcAnimation((col + 0) * GRID_SIZE, (row + 0) * GRID_SIZE, GRID_SIZE / 2, Math.PI / 2, 0);

        this.col = col;
        this.row = row;
        this.direction = newDirection;
        const velocity = getVelocity(newDirection);
        this.col += velocity.dirX;
        this.row += velocity.dirY;
        await this.moveToCenter(this.col, this.row);

        this._moveStep();
        return;
      }
      if (go === StaticGameObject.Goal) {
        await this.moveToCenter(col, row);
        await this.winAnimation();
        this.onCompeted(this, true);
        return;
      }
      // EMPTY
      await this.moveToCenter(col, row);
      this.col = col;
      this.row = row;
      this._moveStep();
    } catch (err) {
      // cancelled!
    }
  };

  public getPipedDirection(pipeType: PipeType, direction: Direction): Direction | null {
    switch (pipeType) {
      case PipeType.LeftDown:                                                                       // → ╮    ← ╮
        if (direction === Direction.Right) return Direction.Down;                                   //   ↓      ↑
        else if (direction === Direction.Up) return Direction.Left;
        break;

      case PipeType.RightDown:                                                                      // ╭ ←    ╭ →
        if (direction === Direction.Left) return Direction.Down;                                    // ↓      ↑
        else if (direction === Direction.Up) return Direction.Right;
        break;

      case PipeType.LeftUp:                                                                         //   ↑      ↓
        if (direction === Direction.Right) return Direction.Up;                                     // → ╯    ← ╯
        else if (direction === Direction.Down) return Direction.Left;
        break;

      case PipeType.RightUp:                                                                        // ↑      ↓
        if (direction === Direction.Left) return Direction.Up;                                      // ╰ ←    ╰ →
        else if (direction === Direction.Down) return Direction.Right;
        break;

      default:
        throw new Error(`Unknown type '${this.type}'`);
    }

    return null;
  }

  public destroy(fromScene?: boolean) {
    if (this.activeTween) {
      this.activeTween.stop();
      this.activeTween = null;
    }
    super.destroy(fromScene);
  }
}
