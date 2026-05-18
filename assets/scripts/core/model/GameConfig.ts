/**
 * All game parameters are collected here — balancing requires no logic changes
 * (Open/Closed). Default values are agreed upon in PLAN.md.
 */
export interface GameConfig {
  /** Board size. */
  readonly rows: number
  readonly cols: number
  /** Number of tile colors. */
  readonly colorsCount: number
  /** Minimum group size that can be burned. */
  readonly minGroupSize: number
  /** Perfect line (entirely in one row/column) of size >= → rocket. */
  readonly rocketLineThreshold: number
  /** Arbitrary group of size >= → regular bomb (radius). */
  readonly bombThreshold: number
  /** Arbitrary group of size >= → big bomb (whole board). */
  readonly fieldBombThreshold: number
  /** Radius R (Chebyshev) for the bomb and the Radius super-tile. */
  readonly boosterRadius: number
  /** Target X — score to win. */
  readonly targetScore: number
  /** Limit Y — number of moves. */
  readonly maxMoves: number
  /** Max auto-shuffles on deadlock, then loss. */
  readonly maxShuffles: number
  /** Base score multiplier: score += size * (size - 1) * scoreBase. */
  readonly scoreBase: number
  /** Booster charge reserve. */
  readonly bombCharges: number
  readonly teleportCharges: number
}

export const DEFAULT_CONFIG: GameConfig = {
  rows: 9,
  cols: 9,
  colorsCount: 5,
  minGroupSize: 2,
  rocketLineThreshold: 4,
  bombThreshold: 5,
  fieldBombThreshold: 7,
  boosterRadius: 1,
  targetScore: 1000,
  maxMoves: 20,
  maxShuffles: 3,
  scoreBase: 3,
  bombCharges: 3,
  teleportCharges: 3
}

export function makeConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return { ...DEFAULT_CONFIG, ...overrides }
}
