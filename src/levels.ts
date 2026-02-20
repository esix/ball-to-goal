import { Direction, FIELD_HEIGHT, FIELD_WIDTH, LevelCoord, LevelData, PipeType } from "./utils";

const LEVEL_MAPS = [
  ` LEVEL 0
··············
······○·······
·····▲*···~~~~
······*···~~··
·→*****···~~··
·······╯······
··············
··············`,

  ` LEVEL 1
·╭·····╮······
··*****·······
··*···*··▲····
··*******○····
·╰····*··▲····
·→*****·······
·····╯········
··············`,

  ` LEVEL 2
··············
···********···
··*········*··
··*···╭╮···*··
···*←·╯╰·○····
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

  ` LEVEL 4
·········▲····
··············
··············
··············
··○···········
·········╯····
··→···········
··············`,

  ` LEVEL 5
··············
····○·········
·····▲········
·····▲········
·····▲········
·····▲········
→·······╯·····
··············`,

  ` LEVEL 6
··············
·○············
··············
··············
··············
··············
→·····╯···╮···
··············`,

  ` LEVEL 7
··············
·········○····
·~~~~~········
·~~~~~······╯·
→·············
·~~~~~········
·~~~~~······╭·
·~~~~~········`,

  ` LEVEL 8
○·······▲·····
········▲·····
········▲··╰··
········▲·····
········▲··╮··
········▲·····
········▲·····
·············←`,
];

/**
 * Creates level information from multiline string
 * @param s
 */
function makeLevel(s: string): LevelData {
  const rows = s.split('\n').slice(1).filter(row => !!row);
  if (rows.length !== FIELD_HEIGHT) throw new Error('Incorrect level height');
  if (!rows.every(row => row.length === FIELD_WIDTH))  throw new Error('Incorrect level width');

  let cannon: LevelCoord & { direction: Direction } | null = null;
  let goal: LevelCoord | null = null;
  const pipes: Array<LevelCoord & { type: PipeType }> = [];
  const walls: Array<LevelCoord> = [];
  const pits: Array<LevelCoord> = [];
  const roads: Array<LevelCoord> = [];

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

      else if (c === '*') roads.push({ row, col });
    }
  }

  if (!cannon) throw new Error('No cannon');
  if (!goal) throw new Error('No goal');

  return {
    cannon,
    goal,
    pipes,
    walls,
    pits,
    roads,
  }
}

const LEVELS: LevelData[] = LEVEL_MAPS.map(makeLevel);

export default LEVELS;
