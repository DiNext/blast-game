import { Position, SuperTileEffect, TileColor } from '../model/types'

/**
 * Domain events. For each action the core returns an ordered list —
 * the view plays it as an animation timeline and contains no game logic.
 */
export type GameEvent =
  | { type: 'GroupBurned'; cells: Position[]; color: TileColor }
  | { type: 'SuperTileCreated'; pos: Position; effect: SuperTileEffect; tileId: number }
  | { type: 'SuperTileActivated'; pos: Position; effect: SuperTileEffect; cells: Position[] }
  | { type: 'BombUsed'; pos: Position; cells: Position[] }
  | { type: 'TeleportUsed'; a: Position; b: Position }
  | { type: 'TilesFell'; moves: Array<{ from: Position; to: Position }> }
  | { type: 'TilesSpawned'; spawns: Array<{ pos: Position; color: TileColor }> }
  | { type: 'BoardShuffled'; attempt: number }
  | { type: 'ScoreChanged'; score: number; delta: number }
  | { type: 'MovesChanged'; movesLeft: number }
  | { type: 'GameWon'; score: number }
  | { type: 'GameLost'; reason: 'no-moves' | 'shuffle-exhausted'; score: number }

export type GameEventType = GameEvent['type']

/** Minimal typed bus (Observer) for the view layer. */
export class EventBus {
  private listeners: Array<(e: GameEvent) => void> = []

  on(listener: (e: GameEvent) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  emit(events: GameEvent[]): void {
    for (const e of events) {
      for (const l of this.listeners) l(e)
    }
  }
}
