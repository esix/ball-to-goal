export const GRID_SIZE = 80;
export const FIELD_WIDTH = 10;
export const FIELD_HEIGHT = 8;
export const BALL_SPEED = 2000;

export enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}


export enum PipeType {
  RightDown = 'RightDown',
  LeftDown = 'LeftDown',
  RightUp = 'RightUp',
  LeftUp = 'LeftUp'
}

export enum StaticGameObject {
  Wall = 'Wall',
  Empty = 'Empty',
  Goal = 'Goal',
}


export type GameObject = PipeType | StaticGameObject | null;
