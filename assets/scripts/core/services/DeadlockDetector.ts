import { Board } from '../model/Board'
import { GameConfig } from '../model/GameConfig'

/**
 * Deadlock — no valid move at all: neither a color group of size >= minGroupSize,
 * nor any super-tile (tapping it is always a move).
 *
 * The check is cheap: it's enough to find any pair of same-color neighbors.
 */
export class DeadlockDetector {
  constructor(private readonly config: GameConfig) {}

  hasMove(board: Board): boolean {
    for (let row = 0; row < board.rows; row++) {
      for (let col = 0; col < board.cols; col++) {
        const tile = board.get({ row, col })
        if (!tile) continue
        if (tile.isSuper) return true
        if (this.config.minGroupSize <= 1) return true

        const right = board.get({ row, col: col + 1 })
        if (right && !right.isSuper && right.color === tile.color) return true
        const down = board.get({ row: row + 1, col })
        if (down && !down.isSuper && down.color === tile.color) return true
      }
    }
    return false
  }

  isDeadlock(board: Board): boolean {
    return !this.hasMove(board)
  }
}
