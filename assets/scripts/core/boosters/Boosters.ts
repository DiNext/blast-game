import { Board } from '../model/Board'
import { Position } from '../model/types'

/**
 * Boosters as strategies. A booster only describes which cells it affects /
 * how it changes the board — turn orchestration (charges, gravity, events) is handled by GameEngine.
 */

/** Bomb: cells in a square of radius R (Chebyshev) around the tap point. */
export class BombBooster {
  affectedCells(board: Board, origin: Position, radius: number): Position[] {
    const cells: Position[] = []
    for (let row = origin.row - radius; row <= origin.row + radius; row++) {
      for (let col = origin.col - radius; col <= origin.col + radius; col++) {
        const p: Position = { row, col }
        if (board.get(p)) cells.push(p)
      }
    }
    return cells
  }
}

/** Teleport: swaps the tiles of two cells. */
export class TeleportBooster {
  canSwap(board: Board, a: Position, b: Position): boolean {
    if (a.row === b.row && a.col === b.col) return false
    return board.get(a) !== null && board.get(b) !== null
  }

  swap(board: Board, a: Position, b: Position): void {
    const ta = board.get(a)
    const tb = board.get(b)
    board.set(a, tb)
    board.set(b, ta)
  }
}
