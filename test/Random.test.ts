import { Random } from '../assets/scripts/core/util/Random'

describe('Random', () => {
  it('is deterministic for the same seed', () => {
    const a = new Random(12345)
    const b = new Random(12345)
    const seqA = Array.from({ length: 10 }, () => a.nextInt(100))
    const seqB = Array.from({ length: 10 }, () => b.nextInt(100))
    expect(seqA).toEqual(seqB)
  })

  it('diverges for different seeds', () => {
    const a = Array.from({ length: 20 }, (_, i) => i)
    const b = [...a]
    new Random(1).shuffleInPlace(a)
    new Random(2).shuffleInPlace(b)
    expect(a).not.toEqual(b)
  })

  it('nextInt stays within range', () => {
    const r = new Random(7)
    for (let i = 0; i < 1000; i++) {
      const v = r.nextInt(5)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(5)
    }
  })

  it('shuffleInPlace preserves elements', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8]
    new Random(99).shuffleInPlace(arr)
    expect([...arr].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('nextInt throws on a non-positive bound', () => {
    expect(() => new Random(1).nextInt(0)).toThrow()
  })
})
