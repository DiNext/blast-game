import BoardView from './BoardView'
import EndModal from './EndModal'
import HudView from './HudView'
import { GameEvent } from '../core/events/GameEvents'
import { Board } from '../core/model/Board'

/**
 * Turns an ordered list of domain events into an animation timeline.
 * A pure "player": all game logic lives in the core, here it's only the
 * event → visual reaction mapping. This is the logic/rendering boundary.
 */
export class AnimationSequencer {
  constructor(
    private readonly board: BoardView,
    private readonly hud: HudView,
    private readonly endModal: EndModal,
    private readonly getBoard: () => Board,
    private readonly target: number
  ) {}

  async play(events: GameEvent[]): Promise<void> {
    for (const e of events) {
      await this.handle(e)
    }
    // Safety: after a series of animations, reconcile the scene with the core state.
    this.board.reconcile(this.getBoard())
  }

  private async handle(e: GameEvent): Promise<void> {
    switch (e.type) {
      case 'ScoreChanged':
        this.hud.setScore(e.score, this.target)
        return
      case 'MovesChanged':
        this.hud.setMoves(e.movesLeft)
        return
      case 'GroupBurned':
        await this.board.burnCells(e.cells, e.color)
        return
      case 'SuperTileCreated':
        await this.board.createSuper(e.pos, e.effect, e.tileId)
        return
      case 'SuperTileActivated':
        await this.board.superBurn(e.pos, e.effect, e.cells)
        return
      case 'BombUsed':
        await this.board.bombBurn(e.pos, e.cells)
        return
      case 'TeleportUsed':
        await this.board.swapTiles(e.a, e.b)
        return
      case 'TilesFell':
        await this.board.applyFalls(e.moves)
        return
      case 'TilesSpawned':
        await this.board.spawnTiles(e.spawns, this.getBoard())
        return
      case 'BoardShuffled':
        await this.board.reshuffleTo(this.getBoard())
        return
      case 'GameWon':
        this.endModal.show(true, e.score, this.target)
        return
      case 'GameLost':
        this.endModal.show(false, e.score, this.target)
        return
      default:
        return
    }
  }
}
