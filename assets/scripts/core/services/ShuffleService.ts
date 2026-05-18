import { Board } from '../model/Board'
import { Tile } from '../model/Tile'
import { IRandom } from '../util/Random'

/**
 * Board shuffle. Preserves the multiset of tiles (the same objects) —
 * only their positions change. Used on deadlock.
 */
export class ShuffleService {
  constructor(private readonly rng: IRandom) {}

  shuffle(board: Board): void {
    const entries = board.allTiles()
    const tiles: Tile[] = entries.map(e => e.tile)
    this.rng.shuffleInPlace(tiles)
    entries.forEach((e, i) => board.set(e.pos, tiles[i]))
  }
}
