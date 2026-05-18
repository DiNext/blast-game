import { GameConfig } from '../model/GameConfig'

/**
 * Score calculation. The formula is non-linear — bigger groups are more rewarding:
 *   score += size * (size - 1) * scoreBase
 */
export class ScoreService {
  constructor(private readonly config: GameConfig) {}

  scoreFor(groupSize: number): number {
    if (groupSize <= 0) return 0
    return groupSize * (groupSize - 1) * this.config.scoreBase
  }
}
