import { GameEngine } from '../assets/scripts/core/GameEngine'
import { GameEvent } from '../assets/scripts/core/events/GameEvents'
import { GameStatus, SuperTileEffect } from '../assets/scripts/core/model/types'
import { ConstantRandom, IncrementingRandom, ScriptedRandom } from './helpers'

const types = (events: GameEvent[]) => events.map(e => e.type)

describe('GameEngine — main move', () => {
  it('burns a group, awards points and spends a move', () => {
    const e = new GameEngine(
      { rows: 2, cols: 2, colorsCount: 1, targetScore: 1e9, maxMoves: 5 },
      new ConstantRandom()
    )
    const events = e.tap({ row: 0, col: 0 })

    expect(types(events)).toEqual(
      expect.arrayContaining(['ScoreChanged', 'GroupBurned', 'MovesChanged', 'TilesSpawned'])
    )
    expect(e.getState().score).toBe(4 * 3 * 3) // size=4, scoreBase=3
    expect(e.getState().movesLeft).toBe(4)
    expect(e.getState().status).toBe(GameStatus.Playing)
  })

  it('ignores a tap on a group smaller than the minimum (no move spent)', () => {
    const e = new GameEngine(
      { rows: 3, cols: 3, colorsCount: 1, minGroupSize: 100, maxMoves: 5 },
      new ConstantRandom()
    )
    expect(e.tap({ row: 0, col: 0 })).toEqual([])
    expect(e.getState().movesLeft).toBe(5)
  })
})

describe('GameEngine — super-tile', () => {
  it('is created for an arbitrary group >= big-bomb threshold', () => {
    // 3×3 same color = 9 (not a line) >= fieldBombThreshold(7) → Field.
    const e = new GameEngine(
      { rows: 3, cols: 3, colorsCount: 1, targetScore: 1e9 },
      new ConstantRandom()
    )
    const events = e.tap({ row: 1, col: 1 })
    expect(types(events)).toContain('SuperTileCreated')
    expect(e.getBoard().allTiles().some(t => t.tile.isSuper)).toBe(true)
  })

  it('arbitrary group bombThreshold..fieldBombThreshold-1 → Radius (regular bomb)', () => {
    // L-shaped group of 5 (not a line): Radius.
    // 3×3: color 0 — a cross without corners (5 cells), corners — color 1.
    const e = new GameEngine(
      { rows: 3, cols: 3, colorsCount: 2, targetScore: 1e9 },
      new ScriptedRandom([1, 0, 1, 0, 0, 0, 1, 0, 1])
    )
    const sc = e.tap({ row: 1, col: 1 }).find(x => x.type === 'SuperTileCreated') as Extract<
      GameEvent,
      { type: 'SuperTileCreated' }
    >
    expect(sc.effect).toBe(SuperTileEffect.Radius)
  })

  it('group >= field threshold → bomb_max (Field), activates and burns by effect', () => {
    // 4×4 same color = 16 >= superFieldThreshold(10) → Field.
    const e = new GameEngine(
      { rows: 4, cols: 4, colorsCount: 1, targetScore: 1e9, maxMoves: 9 },
      new ConstantRandom()
    )
    const created = e.tap({ row: 1, col: 1 })
    const sc = created.find(ev => ev.type === 'SuperTileCreated')
    expect((sc as Extract<GameEvent, { type: 'SuperTileCreated' }>).effect).toBe(
      SuperTileEffect.Field
    )

    const sup = e.getBoard().allTiles().find(t => t.tile.isSuper)!
    const events = e.tap(sup.pos)
    const activated = events.find(ev => ev.type === 'SuperTileActivated')
    expect(activated).toBeDefined()
    expect((activated as Extract<GameEvent, { type: 'SuperTileActivated' }>).effect).toBe(
      SuperTileEffect.Field
    )
  })

  it('group > threshold, wider horizontally → Row (horizontal rocket)', () => {
    // 3×8, color 1 top/bottom, color 0 — an isolated horizontal strip (8).
    const row1 = new Array(8).fill(1)
    const row0 = new Array(8).fill(0)
    const e = new GameEngine(
      { rows: 3, cols: 8, colorsCount: 2, targetScore: 1e9 },
      new ScriptedRandom([...row1, ...row0, ...row1])
    )
    const sc = e.tap({ row: 1, col: 0 }).find(x => x.type === 'SuperTileCreated') as Extract<
      GameEvent,
      { type: 'SuperTileCreated' }
    >
    expect(sc.effect).toBe(SuperTileEffect.Row)
  })

  it('group > threshold, taller vertically → Column (vertical rockets)', () => {
    // 8×3: in each row color 0 in the middle column, 1 on the edges → a vertical strip (8).
    const seq: number[] = []
    for (let r = 0; r < 8; r++) seq.push(1, 0, 1)
    const e = new GameEngine(
      { rows: 8, cols: 3, colorsCount: 2, targetScore: 1e9 },
      new ScriptedRandom(seq)
    )
    const sc = e.tap({ row: 0, col: 1 }).find(x => x.type === 'SuperTileCreated') as Extract<
      GameEvent,
      { type: 'SuperTileCreated' }
    >
    expect(sc.effect).toBe(SuperTileEffect.Column)
  })
})

describe('GameEngine — win and loss', () => {
  it('win when the target score is reached', () => {
    const e = new GameEngine(
      { rows: 9, cols: 9, colorsCount: 1, targetScore: 1000 },
      new ConstantRandom()
    )
    const events = e.tap({ row: 0, col: 0 })
    expect(types(events)).toContain('GameWon')
    expect(e.getState().status).toBe(GameStatus.Won)
  })

  it('loss when moves run out', () => {
    const e = new GameEngine(
      { rows: 2, cols: 2, colorsCount: 1, targetScore: 1e9, maxMoves: 1 },
      new ConstantRandom()
    )
    const events = e.tap({ row: 0, col: 0 })
    const lost = events.find(ev => ev.type === 'GameLost')
    expect(lost).toBeDefined()
    expect((lost as Extract<GameEvent, { type: 'GameLost' }>).reason).toBe('no-moves')
    expect(e.getState().status).toBe(GameStatus.Lost)
  })

  it('moves are rejected once the game has ended', () => {
    const e = new GameEngine(
      { rows: 9, cols: 9, colorsCount: 1, targetScore: 1000 },
      new ConstantRandom()
    )
    e.tap({ row: 0, col: 0 })
    expect(e.tap({ row: 1, col: 1 })).toEqual([])
  })
})

describe('GameEngine — boosters', () => {
  it('the bomb burns a radius, spends a charge but not a move', () => {
    const e = new GameEngine(
      { rows: 3, cols: 3, colorsCount: 1, boosterRadius: 1, targetScore: 1e9, maxMoves: 5 },
      new ConstantRandom()
    )
    const events = e.useBomb({ row: 1, col: 1 })
    const bomb = events.find(ev => ev.type === 'BombUsed') as Extract<
      GameEvent,
      { type: 'BombUsed' }
    >
    expect(bomb.cells).toHaveLength(9)
    expect(e.getState().bombCharges).toBe(2)
    expect(e.getState().movesLeft).toBe(5) // move not spent
  })

  it('the bomb does nothing without charges', () => {
    const e = new GameEngine(
      { rows: 3, cols: 3, colorsCount: 1, bombCharges: 0, targetScore: 1e9 },
      new ConstantRandom()
    )
    expect(e.useBomb({ row: 1, col: 1 })).toEqual([])
  })

  it('teleport swaps tiles and spends a charge', () => {
    const e = new GameEngine(
      { rows: 2, cols: 2, colorsCount: 1, targetScore: 1e9 },
      new ConstantRandom()
    )
    const a = { row: 0, col: 0 }
    const b = { row: 1, col: 1 }
    const idA = e.getBoard().get(a)!.id
    const idB = e.getBoard().get(b)!.id
    const events = e.useTeleport(a, b)
    expect(types(events)).toContain('TeleportUsed')
    expect(e.getBoard().get(a)!.id).toBe(idB)
    expect(e.getBoard().get(b)!.id).toBe(idA)
    expect(e.getState().teleportCharges).toBe(2)
  })

  it('teleport does nothing without charges', () => {
    const e = new GameEngine(
      { rows: 2, cols: 2, colorsCount: 1, teleportCharges: 0, targetScore: 1e9 },
      new ConstantRandom()
    )
    expect(e.useTeleport({ row: 0, col: 0 }, { row: 1, col: 1 })).toEqual([])
  })
})

describe('GameEngine — deadlock and shuffle', () => {
  it('running out of shuffles on an unsolvable deadlock → loss', () => {
    // All colors are different, shuffling preserves uniqueness → the deadlock stays.
    const e = new GameEngine(
      { rows: 3, cols: 3, colorsCount: 9, minGroupSize: 2, maxShuffles: 3 },
      new IncrementingRandom()
    )
    expect(e.getState().shufflesUsed).toBe(3)
    expect(e.getState().status).toBe(GameStatus.Lost)
  })
})
