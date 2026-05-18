/**
 * Scene layout. All boxes are exact coordinates from the Figma design
 * (the "Test" frame, local px, origin at the top-left corner, Y axis down).
 *
 * The module is pure (no `cc`): geometry is computed and tested separately.
 * Conversion to the Cocos coordinate system (center, Y axis up) is here too.
 */

export interface XY {
  x: number
  y: number
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export const DESIGN_W = 1080
export const DESIGN_H = 1920

/** Tile zone (the inner rectangle of bg_frame_play). */
export const PLAY: Box = { x: 172, y: 467, w: 735, h: 860 }

/** UI boxes — all from absolute Figma node coordinates. */
export const UI = {
  framePlay: { x: 50, y: 351, w: 980, h: 1092 } as Box,
  frameMoves: { x: 104, y: 30, w: 872, h: 321 } as Box,
  movesBadge: { x: 170, y: 63, w: 228, h: 228 } as Box,
  scoreCaption: { x: 457, y: 100, w: 393, h: 77 } as Box,
  scoreValue: { x: 475, y: 159, w: 356, h: 119 } as Box,
  slotScore: { x: 385, y: 73, w: 523, h: 209 } as Box,
  title: { x: 257, y: 1455, w: 566, h: 110 } as Box,
  slotTeleport: { x: 216, y: 1562, w: 339, h: 347 } as Box,
  slotBomb: { x: 525, y: 1562, w: 339, h: 347 } as Box,
  slonTeleport: { x: 273, y: 1748, w: 230, h: 113 } as Box,
  slonBomb: { x: 580, y: 1748, w: 230, h: 113 } as Box,
  iconTeleport: { x: 338, y: 1621, w: 95, h: 117 } as Box,
  iconBomb: { x: 647, y: 1624, w: 95, h: 117 } as Box,
  countTeleport: { x: 364, y: 1758, w: 44, h: 88 } as Box,
  countBomb: { x: 674, y: 1758, w: 43, h: 88 } as Box
}

/** Native tile sprite size (×2 export). */
const TILE_TEX = { w: 200, h: 224 }

export class Layout {
  readonly rows: number
  readonly cols: number
  readonly cellW: number
  readonly cellH: number
  readonly tileW: number
  readonly tileH: number

  constructor(rows: number, cols: number) {
    this.rows = rows
    this.cols = cols
    this.cellW = PLAY.w / cols
    this.cellH = PLAY.h / rows
    const fit = Math.min(this.cellW / TILE_TEX.w, this.cellH / TILE_TEX.h)
    this.tileW = TILE_TEX.w * fit
    this.tileH = TILE_TEX.h * fit
  }

  /** Design coordinate (top-left, Y down) → Cocos coordinate (center, Y up). */
  toCocos(designX: number, designY: number): XY {
    return { x: designX - DESIGN_W / 2, y: DESIGN_H / 2 - designY }
  }

  /** Cell center in Cocos coordinates. */
  cellCenter(row: number, col: number): XY {
    return this.toCocos(
      PLAY.x + (col + 0.5) * this.cellW,
      PLAY.y + (row + 0.5) * this.cellH
    )
  }

  /** Spawn point for a new tile — one row above the field's top edge. */
  spawnPoint(col: number): XY {
    return this.toCocos(PLAY.x + (col + 0.5) * this.cellW, PLAY.y - this.cellH)
  }

  /** Play field center in Cocos coordinates (for the input node). */
  playCenter(): XY {
    return this.toCocos(PLAY.x + PLAY.w / 2, PLAY.y + PLAY.h / 2)
  }

  /**
   * Hit-test: a point relative to the play field center (Cocos, Y up) → cell.
   * Used by the input node sized strictly to the field.
   */
  cellAtPlayLocal(localX: number, localY: number): { row: number; col: number } | null {
    const col = Math.floor((localX + PLAY.w / 2) / this.cellW)
    const row = Math.floor((PLAY.h / 2 - localY) / this.cellH)
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null
    return { row, col }
  }

  /** Box center (top-left design) in Cocos coordinates. */
  center(box: Box): XY {
    return this.toCocos(box.x + box.w / 2, box.y + box.h / 2)
  }
}
