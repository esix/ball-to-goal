export const GRID_SIZE = 80;
export const FIELD_WIDTH = 10;
export const FIELD_HEIGHT = 8;
export const MAX_STEPS = 100;
export const BALL_SPEED = 300;

export enum Direction {
  Right = 0,
  Up = 1,
  Left = 2,
  Down = 3,
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
  Cannon = 'Cannon',
}


export type GameObject = PipeType | StaticGameObject | null;

/**
 * Вычисляет позицию по центру клетки
 * @param col
 * @param row
 */
export function getCellPxCenter(col: number, row: number): {x: number, y: number} {
  const x = (col + 0.5) * GRID_SIZE;
  const y = (row + 0.5) * GRID_SIZE;
  return {x, y};
}

/**
 * Return velocity of the ball - dirX, dirY = 0, 1 or -1 based on direction
 *
 * @param d direction of ball
 */
export function getVelocity(d: Direction): {dirX: 0 | 1 | -1, dirY: 0 | 1 | -1} {
  if (d === Direction.Right) return {dirX: 1, dirY: 0};
  if (d === Direction.Left) return {dirX: -1, dirY: 0};
  if (d === Direction.Up) return {dirX: 0, dirY: -1};
  if (d === Direction.Down) return {dirX: 0, dirY: 1};
  throw new Error('Unknown direction');
}

export function isPipe(go: GameObject): go is PipeType {
  return go === PipeType.RightDown || go === PipeType.LeftDown || go === PipeType.RightUp || go === PipeType.LeftUp;
}

export function getPipedDirection(pipeType: PipeType, direction: Direction): Direction | null {
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
      throw new Error(`Unknown type '${pipeType}'`);
  }

  return null;
}


/**
 * Возвращает значенния для рисования PIPE
 * - `cx`, `cy` - координаты центра четвертьокружности
 * - `a1`, `a2` - углы, с которых начинается и кончается четвертьокружности
 * @param pipeType
 * @param enterDirection
 */
export function getPipeDrawing(pipeType: PipeType, enterDirection?: Direction): {cx: number, cy: number, a1: number, a2: number} {
  const half = GRID_SIZE >> 1, PI = Math.PI;
  const cx = (pipeType === PipeType.LeftDown || pipeType === PipeType.LeftUp) ? -half : +half;
  const cy = (pipeType === PipeType.LeftUp || pipeType === PipeType.RightUp) ? -half : +half;
  const a=
      (pipeType === PipeType.LeftDown) ? -PI / 2 :
      (pipeType === PipeType.RightDown) ? PI :
      (pipeType === PipeType.LeftUp) ? 0 :
      /* PipeType.RightUp */ PI / 2;

  if (enterDirection !== undefined) {
    const newDirection = getPipedDirection(pipeType, enterDirection)!;
    if ((4 + newDirection - enterDirection) % 4 === 1) {
      return {cx, cy, a1: a + PI / 2, a2: a};
    }
  }
  return {cx, cy, a1: a, a2: a + PI / 2};
}

export function getOppositeDirection(direction: Direction): Direction {
  if (direction === Direction.Up) return Direction.Down;
  if (direction === Direction.Down) return Direction.Up;
  if (direction === Direction.Left) return Direction.Right;
  if (direction === Direction.Right) return Direction.Left;
  throw new Error(`Unknown direction '${direction}'`);
}
