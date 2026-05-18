import { GroupFinder } from '../assets/scripts/core/services/GroupFinder'
import { Tile } from '../assets/scripts/core/model/Tile'
import { SuperTileEffect } from '../assets/scripts/core/model/types'
import { boardFrom } from './helpers'

const finder = new GroupFinder()

describe('GroupFinder', () => {
  it('finds a connected same-color group by 4-connectivity', () => {
    const board = boardFrom([
      '0010',
      '0010',
      '1110'
    ])
    const group = finder.find(board, { row: 0, col: 0 })
    expect(group).toHaveLength(4) // top-left 2×2 block of zeros
  })

  it('does not connect tiles diagonally', () => {
    const board = boardFrom([
      '01',
      '10'
    ])
    expect(finder.find(board, { row: 0, col: 0 })).toHaveLength(1)
  })

  it('returns empty for an empty cell', () => {
    const board = boardFrom(['0.', '00'])
    expect(finder.find(board, { row: 0, col: 1 })).toHaveLength(0)
  })

  it('a super-tile is not part of a color group and breaks it', () => {
    const board = boardFrom(['000'])
    board.set({ row: 0, col: 1 }, Tile.superTile(0, SuperTileEffect.Row))
    const group = finder.find(board, { row: 0, col: 0 })
    expect(group).toHaveLength(1)
    expect(finder.find(board, { row: 0, col: 1 })).toHaveLength(0)
  })

  it('collects an entire single-colored board', () => {
    const board = boardFrom(['000', '000', '000'])
    expect(finder.find(board, { row: 1, col: 1 })).toHaveLength(9)
  })
})
