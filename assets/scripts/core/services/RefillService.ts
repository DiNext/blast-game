import { Board } from '../model/Board'
import { GameConfig } from '../model/GameConfig'
import { Tile } from '../model/Tile'
import { Position, TileColor } from '../model/types'
import { IRandom } from '../util/Random'

/** Refill: every empty cell (after gravity — from the top) is filled with a new tile. */
export class RefillService {
  constructor(private readonly config: GameConfig, private readonly rng: IRandom) {}

  apply(board: Board): Array<{ pos: Position; color: TileColor }> {
    const spawns: Array<{ pos: Position; color: TileColor }> = []
    board.forEach((tile, pos) => {
      if (tile) return
      const color = this.rng.nextInt(this.config.colorsCount)
      board.set(pos, Tile.normal(color))
      spawns.push({ pos, color })
    })
    return spawns
  }
}
