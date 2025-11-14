import { Direction, LevelData, PipeType } from "./utils";

const level1 = `
...╭.╮.......
.............
...╰.╯.......

`;


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
    pits: [
      { col: 10, row: 2 }, { col: 11, row: 2 }, { col: 12, row: 2 }, { col: 13, row: 2 },
      { col: 10, row: 3 }, { col: 11, row: 3 },
      { col: 10, row: 4 }, { col: 11, row: 4 },
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
    pits: [],
  },
  {
    cannon: { col: 4, row: 4, direction: Direction.Left },
    goal: { col: 9, row: 4 },
    pipes: [
      { col: 6, row: 3, type: PipeType.RightDown },    { col: 7, row: 3, type: PipeType.LeftDown },
      { col: 7, row: 4, type: PipeType.RightUp },      { col: 6, row: 4, type: PipeType.LeftUp },
    ],
    walls: [],
    pits: [],
  },
];

export default LEVELS;
