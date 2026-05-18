import { Layout, PLAY } from '../assets/scripts/view/Layout'

// Layout is a pure module (no `cc`), so the Figma coordinate math is unit-testable.
describe('Layout', () => {
  const rows = 9
  const cols = 9
  const layout = new Layout(rows, cols)

  it('splits the play area evenly into cells', () => {
    expect(layout.cellW * cols).toBeCloseTo(PLAY.w)
    expect(layout.cellH * rows).toBeCloseTo(PLAY.h)
  })

  it('fits the tile sprite inside a cell preserving aspect (uniform scale)', () => {
    expect(layout.tileW).toBeGreaterThan(0)
    expect(layout.tileH).toBeGreaterThan(0)
    expect(layout.tileW).toBeLessThanOrEqual(layout.cellW + 1e-6)
    expect(layout.tileH).toBeLessThanOrEqual(layout.cellH + 1e-6)
  })

  it('cellAtPlayLocal is the inverse of a cell-center play-local point', () => {
    for (const [row, col] of [
      [0, 0],
      [4, 4],
      [8, 8],
      [2, 7],
      [8, 0]
    ]) {
      const localX = (col + 0.5) * layout.cellW - PLAY.w / 2
      const localY = PLAY.h / 2 - (row + 0.5) * layout.cellH
      expect(layout.cellAtPlayLocal(localX, localY)).toEqual({ row, col })
    }
  })

  it('returns null for points outside the grid', () => {
    expect(layout.cellAtPlayLocal(-PLAY.w, 0)).toBeNull()
    expect(layout.cellAtPlayLocal(0, PLAY.h)).toBeNull()
  })

  it('toCocos maps design top-left space to centered Y-up space', () => {
    expect(layout.toCocos(540, 960)).toEqual({ x: 0, y: 0 }) // design center → origin
  })
})
