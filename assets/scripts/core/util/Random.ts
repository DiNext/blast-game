/**
 * Deterministic seedable generator (mulberry32).
 *
 * Kept as a dedicated abstraction on purpose: tests pass a fixed seed and get a
 * reproducible board/shuffle, while the core does not depend on Math.random.
 */
export interface IRandom {
  /** [0, 1) */
  nextFloat(): number
  /** Integer in [0, maxExclusive). */
  nextInt(maxExclusive: number): number
  /** Random element of an array. */
  pick<T>(items: ReadonlyArray<T>): T
  /** In-place Fisher–Yates shuffle. */
  shuffleInPlace<T>(items: T[]): T[]
}

export class Random implements IRandom {
  private state: number

  constructor(seed = Date.now()) {
    this.state = seed >>> 0
  }

  nextFloat(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) throw new Error('maxExclusive must be > 0')
    return Math.floor(this.nextFloat() * maxExclusive)
  }

  pick<T>(items: ReadonlyArray<T>): T {
    if (items.length === 0) throw new Error('cannot pick from empty array')
    return items[this.nextInt(items.length)]
  }

  shuffleInPlace<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1)
      const tmp = items[i]
      items[i] = items[j]
      items[j] = tmp
    }
    return items
  }
}
