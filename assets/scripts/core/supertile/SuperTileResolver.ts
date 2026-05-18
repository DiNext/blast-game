import { Board } from '../model/Board'
import { GameConfig } from '../model/GameConfig'
import { Position, SuperTileEffect } from '../model/types'

/**
 * Computes the set of cells hit by a super-tile based on its effect.
 * Pure function over the board — does not mutate it (Strategy via switch on enum).
 */
export class SuperTileResolver {
  constructor(private readonly config: GameConfig) {}

  affectedCells(board: Board, origin: Position, effect: SuperTileEffect): Position[] {
    switch (effect) {
      case SuperTileEffect.Row:
        return this.line(board, origin, 'row')
      case SuperTileEffect.Column:
        return this.line(board, origin, 'col')
      case SuperTileEffect.Radius:
        return this.radius(board, origin, this.config.boosterRadius)
      case SuperTileEffect.Field:
        return this.field(board)
      default:
        return []
    }
  }

  private line(board: Board, origin: Position, axis: 'row' | 'col'): Position[] {
    const cells: Position[] = []
    if (axis === 'row') {
      for (let col = 0; col < board.cols; col++) {
        if (board.get({ row: origin.row, col })) cells.push({ row: origin.row, col })
      }
    } else {
      for (let row = 0; row < board.rows; row++) {
        if (board.get({ row, col: origin.col })) cells.push({ row, col: origin.col })
      }
    }
    return cells
  }

  private radius(board: Board, origin: Position, r: number): Position[] {
    const cells: Position[] = []
    for (let row = origin.row - r; row <= origin.row + r; row++) {
      for (let col = origin.col - r; col <= origin.col + r; col++) {
        const p: Position = { row, col }
        if (board.get(p)) cells.push(p)
      }
    }
    return cells
  }

  private field(board: Board): Position[] {
    const cells: Position[] = []
    board.forEach((tile, pos) => {
      if (tile) cells.push(pos)
    })
    return cells
  }
}
