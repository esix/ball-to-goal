import Phaser from 'phaser';
import {Direction, getCellPxCenter, GRID_SIZE} from "../utils";

export class Cannon extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene,
                     public col: number,
                     public row: number,
                     public direction: Direction) {
    const {x, y} = getCellPxCenter(col, row);
    super(scene, x, y);
    this.createGraphics();
    this.makeInteractive();
    scene.add.existing(this);
  }

  private createGraphics() {
    const body = this.scene.add.sprite(0, 0, 'cannon', 0)
        //.setDisplaySize(GRID_SIZE, GRID_SIZE)
        .setOrigin(0.5, 0.6)
        .setScale(GRID_SIZE / 32, GRID_SIZE / 32)
        .setBlendMode(Phaser.BlendModes.HARD_LIGHT);


    if (this.direction === Direction.Left) {
      body.setScale(-GRID_SIZE / 32, GRID_SIZE / 32);
    } else if (this.direction === Direction.Up) {
      body.setAngle(-90);
    } else if (this.direction === Direction.Down) {
      body.setAngle(90);
    }
    this.add([body]);
  }

  private makeInteractive() {
    // Invisible zone for click
    const hitArea = this.scene.add.rectangle(0, 0, GRID_SIZE, GRID_SIZE, 0x000000, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.add(hitArea);

    hitArea.on('pointerover', () => {
      this.setScale(1.1, 1.1);
    });

    hitArea.on('pointerout', () => {
      this.setScale(1, 1);
    });
  }

  // Метод для установки обработчика выстрела извне
  public onFire(callback: () => void) {
    const hitArea = this.getAt(1) as Phaser.GameObjects.Rectangle;                                  // 2nd element (index 1) — hitArea
    hitArea.removeAllListeners('pointerdown');
    hitArea.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: this,
        x: '+=-10%',                                                                                // move by -10%
        duration: 50,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });

      callback();
    });
  }
}
