import { BombBooster, TeleportBooster } from './boosters/Boosters'
import { EventBus, GameEvent } from './events/GameEvents'
import { Board } from './model/Board'
import { GameConfig, DEFAULT_CONFIG } from './model/GameConfig'
import { GameState } from './model/GameState'
import { Tile } from './model/Tile'
import { GameStatus, Position, SuperTileEffect } from './model/types'
import { BoardFactory } from './services/BoardFactory'
import { DeadlockDetector } from './services/DeadlockDetector'
import { GravityService } from './services/GravityService'
import { GroupFinder } from './services/GroupFinder'
import { RefillService } from './services/RefillService'
import { ScoreService } from './services/ScoreService'
import { ShuffleService } from './services/ShuffleService'
import { SuperTileResolver } from './supertile/SuperTileResolver'
import { IRandom, Random } from './util/Random'

/**
 * Game core facade. Accepts player commands, runs the deterministic turn
 * pipeline and returns an ordered list of domain events (and also publishes
 * them to the EventBus for the view). Renders nothing itself.
 */
export class GameEngine {
  readonly config: GameConfig
  readonly bus = new EventBus()

  private readonly rng: IRandom
  private readonly board: Board
  private readonly state: GameState

  private readonly groupFinder = new GroupFinder()
  private readonly gravity = new GravityService()
  private readonly scoring: ScoreService
  private readonly refill: RefillService
  private readonly deadlock: DeadlockDetector
  private readonly shuffler: ShuffleService
  private readonly superResolver: SuperTileResolver
  private readonly bomb = new BombBooster()
  private readonly teleport = new TeleportBooster()

  constructor(config: Partial<GameConfig> = {}, rng?: IRandom) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.rng = rng ?? new Random()
    this.scoring = new ScoreService(this.config)
    this.refill = new RefillService(this.config, this.rng)
    this.deadlock = new DeadlockDetector(this.config)
    this.shuffler = new ShuffleService(this.rng)
    this.superResolver = new SuperTileResolver(this.config)
    this.board = new BoardFactory(this.config, this.rng).create()
    this.state = new GameState(this.config.maxMoves, this.config.bombCharges, this.config.teleportCharges)
    // The board may start in a deadlock — normalize it immediately.
    const init: GameEvent[] = []
    this.handleDeadlock(init)
    this.bus.emit(init)
  }

  getBoard(): Board {
    return this.board
  }

  getState(): GameState {
    return this.state
  }

  /** Main move — tap on a cell (regular tile or super-tile). */
  tap(pos: Position): GameEvent[] {
    if (!this.state.isPlaying) return []
    const tile = this.board.get(pos)
    if (!tile) return []

    const events: GameEvent[] = []
    if (tile.isSuper) {
      this.activateSuperTile(pos, tile, events)
    } else {
      const group = this.groupFinder.find(this.board, pos)
      if (group.length < this.config.minGroupSize) return []
      this.burn(group, events, tile.color)
      this.spendMove(events)
      const effect = this.superEffectFor(group)
      if (effect !== null) {
        const superTile = Tile.superTile(tile.color, effect)
        this.board.set(pos, superTile)
        events.push({ type: 'SuperTileCreated', pos, effect, tileId: superTile.id })
      }
      this.resolveBoard(events)
      this.finishTurn(events)
    }

    this.bus.emit(events)
    return events
  }

  /** "Bomb" booster: burn tiles within radius R around the tap. Spends a charge, not a move. */
  useBomb(pos: Position): GameEvent[] {
    if (!this.state.isPlaying || this.state.bombCharges <= 0) return []
    const cells = this.bomb.affectedCells(this.board, pos, this.config.boosterRadius)
    if (cells.length === 0) return []

    this.state.bombCharges--
    const events: GameEvent[] = [{ type: 'BombUsed', pos, cells }]
    this.removeCells(cells)
    this.addScore(this.scoring.scoreFor(cells.length), events)
    this.resolveBoard(events)
    this.finishTurn(events)

    this.bus.emit(events)
    return events
  }

  /** "Teleport" booster: swap two tiles. Spends a charge, not a move. */
  useTeleport(a: Position, b: Position): GameEvent[] {
    if (!this.state.isPlaying || this.state.teleportCharges <= 0) return []
    if (!this.teleport.canSwap(this.board, a, b)) return []

    this.state.teleportCharges--
    this.teleport.swap(this.board, a, b)
    const events: GameEvent[] = [{ type: 'TeleportUsed', a, b }]
    this.finishTurn(events)

    this.bus.emit(events)
    return events
  }

  // --- internal pipeline ---

  private activateSuperTile(pos: Position, tile: Tile, events: GameEvent[]): void {
    const effect = tile.effect!
    const cells = this.superResolver.affectedCells(this.board, pos, effect)
    events.push({ type: 'SuperTileActivated', pos, effect, cells })
    this.removeCells(cells)
    this.addScore(this.scoring.scoreFor(cells.length), events)
    this.spendMove(events)
    this.resolveBoard(events)
    this.finishTurn(events)
  }

  /**
   * Super-tile type for the burned group (by priority):
   *  1) a perfect line (entirely in one row/column) and size >= rocketLineThreshold →
   *     rocket: single row → Row, single column → Column;
   *  2) size >= fieldBombThreshold → Field (big bomb, whole board);
   *  3) size >= bombThreshold → Radius (regular bomb);
   *  4) otherwise no super-tile is created.
   */
  private superEffectFor(group: Position[]): SuperTileEffect | null {
    const size = group.length

    let minR = Infinity
    let maxR = -Infinity
    let minC = Infinity
    let maxC = -Infinity
    for (const p of group) {
      if (p.row < minR) minR = p.row
      if (p.row > maxR) maxR = p.row
      if (p.col < minC) minC = p.col
      if (p.col > maxC) maxC = p.col
    }
    const singleRow = minR === maxR
    const singleCol = minC === maxC

    if (size >= this.config.rocketLineThreshold) {
      if (singleRow) return SuperTileEffect.Row
      if (singleCol) return SuperTileEffect.Column
    }
    if (size >= this.config.fieldBombThreshold) return SuperTileEffect.Field
    if (size >= this.config.bombThreshold) return SuperTileEffect.Radius
    return null
  }

  private burn(group: Position[], events: GameEvent[], color: number): void {
    this.removeCells(group)
    this.addScore(this.scoring.scoreFor(group.length), events)
    events.push({ type: 'GroupBurned', cells: group, color })
  }

  private removeCells(cells: Position[]): void {
    for (const c of cells) this.board.set(c, null)
  }

  private addScore(delta: number, events: GameEvent[]): void {
    if (delta === 0) return
    this.state.score += delta
    events.push({ type: 'ScoreChanged', score: this.state.score, delta })
  }

  private spendMove(events: GameEvent[]): void {
    this.state.movesLeft--
    events.push({ type: 'MovesChanged', movesLeft: this.state.movesLeft })
  }

  private resolveBoard(events: GameEvent[]): void {
    const moves = this.gravity.apply(this.board)
    if (moves.length > 0) events.push({ type: 'TilesFell', moves })
    const spawns = this.refill.apply(this.board)
    if (spawns.length > 0) events.push({ type: 'TilesSpawned', spawns })
  }

  /** Win/loss by score and moves, then deadlock resolution. */
  private finishTurn(events: GameEvent[]): void {
    if (this.state.score >= this.config.targetScore) {
      this.state.status = GameStatus.Won
      events.push({ type: 'GameWon', score: this.state.score })
      return
    }
    if (this.state.movesLeft <= 0) {
      this.state.status = GameStatus.Lost
      events.push({ type: 'GameLost', reason: 'no-moves', score: this.state.score })
      return
    }
    this.handleDeadlock(events)
  }

  private handleDeadlock(events: GameEvent[]): void {
    if (!this.state.isPlaying) return
    if (!this.deadlock.isDeadlock(this.board)) return

    while (this.deadlock.isDeadlock(this.board) && this.state.shufflesUsed < this.config.maxShuffles) {
      this.shuffler.shuffle(this.board)
      this.state.shufflesUsed++
      events.push({ type: 'BoardShuffled', attempt: this.state.shufflesUsed })
    }

    if (this.deadlock.isDeadlock(this.board)) {
      this.state.status = GameStatus.Lost
      events.push({ type: 'GameLost', reason: 'shuffle-exhausted', score: this.state.score })
    }
  }
}
