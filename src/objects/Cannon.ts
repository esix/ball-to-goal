import Phaser from 'phaser';
import {Direction, getCellPxCenter, GRID_SIZE} from "../utils";

export class Cannon extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene,
                     public col: number,
                     public row: number, public direction: Direction) {
    const {x, y} = getCellPxCenter(col, row);
    super(scene, x, y);
    this.createGraphics();
    this.makeInteractive();
    scene.add.existing(this);
  }

  private createGraphics() {
    const body = this.scene.add.sprite(0, 0, 'cannon', 0);
    body.setDisplaySize(GRID_SIZE , GRID_SIZE);
    body.setOrigin(0.5, 0.6);
    this.add([body]);
  }

  private makeInteractive() {
    // Невидимая зона для клика
    const hitArea = this.scene.add.rectangle(0, 0, GRID_SIZE, GRID_SIZE, 0x000000, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.add(hitArea);

    hitArea.on('pointerover', () => {
      this.setScale(1.1);
    });

    hitArea.on('pointerout', () => {
      this.setScale(1);
    });
  }

  // Метод для установки обработчика выстрела извне
  public onFire(callback: () => void) {
    const hitArea = this.getAt(1) as Phaser.GameObjects.Rectangle;                                  // 3-й элемент — hitArea
    hitArea.removeAllListeners('pointerdown');
    hitArea.on('pointerdown', () => {
      this.scene.tweens.add({
        targets: this,
        x: '+=-10',                                                                                 // сдвинуть на -10 от текущего x
        duration: 50,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });

      callback();
    });
  }
}
