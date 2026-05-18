import { Board } from '../model/Board'
import { Position, posKey } from '../model/types'

/**
 * Finds a connected group of same-color tiles (4-connectivity) from a given cell.
 * Super-tiles are not part of color groups — they are activated by a separate mechanic.
 */
export class GroupFinder {
  private static readonly NEIGHBORS: ReadonlyArray<[number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1]
  ]

  find(board: Board, start: Position): Position[] {
    const origin = board.get(start)
    if (!origin || origin.isSuper) return []

    const color = origin.color
    const visited = new Set<string>([posKey(start)])
    const group: Position[] = [start]
    const stack: Position[] = [start]

    while (stack.length > 0) {
      const cur = stack.pop() as Position
      for (const [dr, dc] of GroupFinder.NEIGHBORS) {
        const next: Position = { row: cur.row + dr, col: cur.col + dc }
        const key = posKey(next)
        if (visited.has(key)) continue
        const tile = board.get(next)
        if (!tile || tile.isSuper || tile.color !== color) continue
        visited.add(key)
        group.push(next)
        stack.push(next)
      }
    }

    return group
  }
}
