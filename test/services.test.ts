import { GravityService } from '../assets/scripts/core/services/GravityService'
import { RefillService } from '../assets/scripts/core/services/RefillService'
import { ScoreService } from '../assets/scripts/core/services/ScoreService'
import { DeadlockDetector } from '../assets/scripts/core/services/DeadlockDetector'
import { ShuffleService } from '../assets/scripts/core/services/ShuffleService'
import { SuperTileResolver } from '../assets/scripts/core/supertile/SuperTileResolver'
import { BombBooster, TeleportBooster } from '../assets/scripts/core/boosters/Boosters'
import { makeConfig } from '../assets/scripts/core/model/GameConfig'
import { SuperTileEffect } from '../assets/scripts/core/model/types'
import { Random } from '../assets/scripts/core/util/Random'
import { boardFrom, colorHistogram } from './helpers'

describe('GravityService', () => {
  it('drops tiles down and records the moves', () => {
    const board = boardFrom([
      '1.',
      '..',
      '0.'
    ])
    const moves = new GravityService().apply(board)
    expect(board.get({ row: 2, col: 0 })!.color).toBe(0)
    expect(board.get({ row: 1, col: 0 })!.color).toBe(1)
    expect(board.get({ row: 0, col: 0 })).toBeNull()
    expect(moves).toEqual([{ from: { row: 0, col: 0 }, to: { row: 1, col: 0 } }])
  })
})

describe('RefillService', () => {
  it('fills all empty cells', () => {
    const cfg = makeConfig({ colorsCount: 3 })
    const board = boardFrom(['..', '0.'])
    const spawns = new RefillService(cfg, new Random(1)).apply(board)
    expect(spawns).toHaveLength(3)
    board.forEach(t => expect(t).not.toBeNull())
  })
})

describe('ScoreService', () => {
  const s = new ScoreService(makeConfig({ scoreBase: 10 }))
  it.each([
    [0, 0],
    [1, 0],
    [2, 20],
    [5, 200],
    [10, 900]
  ])('size=%i → %i points', (size, expected) => {
    expect(s.scoreFor(size)).toBe(expected)
  })
})

describe('DeadlockDetector', () => {
  const d = new DeadlockDetector(makeConfig({ minGroupSize: 2 }))
  it('sees a move when there are same-color neighbors', () => {
    expect(d.isDeadlock(boardFrom(['01', '10']))).toBe(true)
    expect(d.isDeadlock(boardFrom(['00', '12']))).toBe(false)
  })
})

describe('ShuffleService', () => {
  it('preserves the color multiset', () => {
    const board = boardFrom(['012', '120', '201'])
    const before = colorHistogram(board)
    new ShuffleService(new Random(42)).shuffle(board)
    expect(colorHistogram(board)).toEqual(before)
    board.forEach(t => expect(t).not.toBeNull())
  })
})

describe('SuperTileResolver', () => {
  const cfg = makeConfig({ boosterRadius: 1 })
  const r = new SuperTileResolver(cfg)
  const board = boardFrom(['000', '000', '000'])
  const origin = { row: 1, col: 1 }

  it('Row → the entire row', () => {
    expect(r.affectedCells(board, origin, SuperTileEffect.Row)).toHaveLength(3)
  })
  it('Column → the entire column', () => {
    expect(r.affectedCells(board, origin, SuperTileEffect.Column)).toHaveLength(3)
  })
  it('Radius=1 → 3×3', () => {
    expect(r.affectedCells(board, origin, SuperTileEffect.Radius)).toHaveLength(9)
  })
  it('Field → the entire board', () => {
    expect(r.affectedCells(board, origin, SuperTileEffect.Field)).toHaveLength(9)
  })
})

describe('Boosters', () => {
  it('Bomb hits radius R, clipped at the edge', () => {
    const board = boardFrom(['000', '000', '000'])
    const bomb = new BombBooster()
    expect(bomb.affectedCells(board, { row: 1, col: 1 }, 1)).toHaveLength(9)
    expect(bomb.affectedCells(board, { row: 0, col: 0 }, 1)).toHaveLength(4)
  })

  it('Teleport swaps tiles', () => {
    const board = boardFrom(['01'])
    const tp = new TeleportBooster()
    const a = { row: 0, col: 0 }
    const b = { row: 0, col: 1 }
    expect(tp.canSwap(board, a, b)).toBe(true)
    expect(tp.canSwap(board, a, a)).toBe(false)
    tp.swap(board, a, b)
    expect(board.get(a)!.color).toBe(1)
    expect(board.get(b)!.color).toBe(0)
  })
})
