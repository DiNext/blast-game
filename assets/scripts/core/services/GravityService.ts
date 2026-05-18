import { Board } from '../model/Board'
import { Position } from '../model/types'

/**
 * Gravity: in each column, tiles drop down into the freed cells.
 * Returns a list of moves for the falling animation.
 */
export class GravityService {
  apply(board: Board): Array<{ from: Position; to: Position }> {
    const moves: Array<{ from: Position; to: Position }> = []

    for (let col = 0; col < board.cols; col++) {
      let writeRow = board.rows - 1
      for (let row = board.rows - 1; row >= 0; row--) {
        const from: Position = { row, col }
        const tile = board.get(from)
        if (!tile) continue
        if (row !== writeRow) {
          const to: Position = { row: writeRow, col }
          board.set(to, tile)
          board.set(from, null)
          moves.push({ from, to })
        }
        writeRow--
      }
    }

    return moves
  }
}
