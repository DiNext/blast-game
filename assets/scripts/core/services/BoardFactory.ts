import { Board } from '../model/Board'
import { GameConfig } from '../model/GameConfig'
import { Tile } from '../model/Tile'
import { IRandom } from '../util/Random'

/** Creates the initial board filled with random colors. */
export class BoardFactory {
  constructor(private readonly config: GameConfig, private readonly rng: IRandom) {}

  create(): Board {
    const board = new Board(this.config.rows, this.config.cols)
    board.forEach((_, pos) => {
      board.set(pos, Tile.normal(this.rng.nextInt(this.config.colorsCount)))
    })
    return board
  }
}
