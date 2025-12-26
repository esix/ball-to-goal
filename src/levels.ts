import { Direction, FIELD_HEIGHT, FIELD_WIDTH, LevelData, PipeType } from "./utils";

/**
 * Creates level information from multiline string
 * @param s
 */
function makeLevel(s: string): LevelData {
  const rows = s.split('\n').slice(1).filter(row => !!row);
  if (rows.length !== FIELD_HEIGHT) throw new Error('Incorrect level height');
  if (!rows.every(row => row.length === FIELD_WIDTH))  throw new Error('Incorrect level width');

  let cannon: { col: number; row: number; direction: Direction } | null = null;
  let goal: { col: number; row: number } | null = null;
  const pipes: Array<{ type: PipeType; col: number; row: number }> = [];
  const walls: Array<{ col: number; row: number }> = [];
  const pits: Array<{ col: number; row: number }> = [];

  for (let row = 0; row < FIELD_HEIGHT; row++) {
    for (let col = 0; col < FIELD_WIDTH; col++) {
      const c = rows[row][col];

      if (c === '·') {}

      else if (c === '←') cannon = { row, col, direction: Direction.Left };
      else if (c === '→') cannon = { row, col, direction: Direction.Right };
      else if (c === '↓') cannon = { row, col, direction: Direction.Down };
      else if (c === '↑') cannon = { row, col, direction: Direction.Up };

      else if (c === '╮') pipes.push({row, col, type: PipeType.LeftDown});
      else if (c === '╭') pipes.push({row, col, type: PipeType.RightDown});
      else if (c === '╯') pipes.push({row, col, type: PipeType.LeftUp});
      else if (c === '╰') pipes.push({row, col, type: PipeType.RightUp});

      else if (c === '○') goal = { row, col };

      else if (c === '▲') walls.push({ row, col });

      else if (c === '~') pits.push({ row, col });
    }
  }

  if (!cannon) throw new Error('No cannon');
  if (!goal) throw new Error('No cannon');

  return {
    cannon,
    goal,
    pipes,
    walls,
    pits,
  }
}

const X_LEVELS = [
  ` LEVEL 0
··············
······○·······
·····▲····~~~~
·╯········~~··
·→········~~··
··············
··············
··············`,

  ` LEVEL 1
···╭·╮········
··············
···╰·····▲····
·········○····
·→···╯···▲····
··············
··············
··············`,

  ` LEVEL 2
··············
··············
··············
······╭╮······
····←·╯╰·○····
··············
··············
··············`,

  ` LEVEL 3
··~~··········
·╰·~~~╭··╮·╯··
·····~~·······
·····~~·······
··○··~~···←···
·····~~~······
······~~······
····~~~~~~····`,
];

const LEVELS: LevelData[] = X_LEVELS.map(makeLevel);

export default LEVELS;
