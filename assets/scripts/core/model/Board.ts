import { Tile } from './Tile'
import { Position } from './types'

/**
 * Game board — a matrix of cells grid[row][col]. Empty cell = null.
 * Pure data structure: knows about tile placement, but not the game rules.
 */
export class Board {
  readonly rows: number
  readonly cols: number
  private grid: Array<Array<Tile | null>>

  constructor(rows: number, cols: number) {
    this.rows = rows
    this.cols = cols
    this.grid = Array.from({ length: rows }, () => new Array<Tile | null>(cols).fill(null))
  }

  isInside(p: Position): boolean {
    return p.row >= 0 && p.row < this.rows && p.col >= 0 && p.col < this.cols
  }

  get(p: Position): Tile | null {
    if (!this.isInside(p)) return null
    return this.grid[p.row][p.col]
  }

  set(p: Position, tile: Tile | null): void {
    if (!this.isInside(p)) throw new Error(`position out of bounds: ${p.row},${p.col}`)
    this.grid[p.row][p.col] = tile
  }

  forEach(fn: (tile: Tile | null, pos: Position) => void): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        fn(this.grid[row][col], { row, col })
      }
    }
  }

  /** All non-empty tiles with their positions. */
  allTiles(): Array<{ tile: Tile; pos: Position }> {
    const result: Array<{ tile: Tile; pos: Position }> = []
    this.forEach((tile, pos) => {
      if (tile) result.push({ tile, pos })
    })
    return result
  }
}
