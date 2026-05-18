import { GameStatus } from './types'

/** Mutable game state (score, moves, shuffles, status). */
export class GameState {
  score = 0
  movesLeft: number
  shufflesUsed = 0
  status: GameStatus = GameStatus.Playing
  bombCharges: number
  teleportCharges: number

  constructor(maxMoves: number, bombCharges: number, teleportCharges: number) {
    this.movesLeft = maxMoves
    this.bombCharges = bombCharges
    this.teleportCharges = teleportCharges
  }

  get isPlaying(): boolean {
    return this.status === GameStatus.Playing
  }
}
