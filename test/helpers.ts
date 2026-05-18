import { Board } from '../assets/scripts/core/model/Board'
import { Tile } from '../assets/scripts/core/model/Tile'
import { IRandom } from '../assets/scripts/core/util/Random'

/**
 * Board from strings: each digit is a color, '.' is an empty cell.
 * boardFrom(['01', '1.']) → 2×2.
 */
export function boardFrom(rows: string[]): Board {
  const board = new Board(rows.length, rows[0].length)
  rows.forEach((line, r) => {
    line.split('').forEach((ch, c) => {
      if (ch === '.') return
      board.set({ row: r, col: c }, Tile.normal(Number(ch)))
    })
  })
  return board
}

/** Board color multiset — to verify preservation across a shuffle. */
export function colorHistogram(board: Board): Record<number, number> {
  const hist: Record<number, number> = {}
  board.allTiles().forEach(({ tile }) => {
    hist[tile.color] = (hist[tile.color] ?? 0) + 1
  })
  return hist
}

/** RNG that always returns 0 — the board comes out single-colored (determinism in tests). */
export class ConstantRandom implements IRandom {
  nextFloat(): number {
    return 0
  }
  nextInt(): number {
    return 0
  }
  pick<T>(items: ReadonlyArray<T>): T {
    return items[0]
  }
  shuffleInPlace<T>(items: T[]): T[] {
    return items
  }
}

/**
 * RNG with a predefined nextInt sequence — sets the exact board layout
 * (BoardFactory traverses cells row by row). Cycles through the array.
 */
export class ScriptedRandom implements IRandom {
  private i = 0
  constructor(private readonly seq: number[]) {}
  nextFloat(): number {
    return this.seq[this.i++ % this.seq.length] / 10
  }
  nextInt(): number {
    return this.seq[this.i++ % this.seq.length]
  }
  pick<T>(items: ReadonlyArray<T>): T {
    return items[this.nextInt() % items.length]
  }
  shuffleInPlace<T>(items: T[]): T[] {
    return items
  }
}

/** RNG with strictly increasing output — the board comes out with all different colors. */
export class IncrementingRandom implements IRandom {
  private i = 0
  nextFloat(): number {
    return (this.i++ % 97) / 97
  }
  nextInt(maxExclusive: number): number {
    return this.i++ % maxExclusive
  }
  pick<T>(items: ReadonlyArray<T>): T {
    return items[this.nextInt(items.length)]
  }
  shuffleInPlace<T>(items: T[]): T[] {
    for (let k = items.length - 1; k > 0; k--) {
      const j = this.nextInt(k + 1)
      const t = items[k]
      items[k] = items[j]
      items[j] = t
    }
    return items
  }
}
