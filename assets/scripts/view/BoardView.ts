import { ANIM } from './Anim'
import { AssetLoader } from './AssetLoader'
import { Fx, tileColor } from './Fx'
import { Layout } from './Layout'
import TileView from './TileView'
import { Board } from '../core/model/Board'
import { Position, SuperTileEffect } from '../core/model/types'

const { ccclass } = cc._decorator

/** Animation durations (sec) — see Anim.ts. */
const D = { fall: ANIM.fall, spawn: ANIM.spawn, swap: ANIM.swap }

/**
 * Grid of visual tiles. Converts domain positions into scene nodes, plays
 * primitive animations (burn/fall/spawn/swap) and accepts touch input,
 * forwarding it upward as (row,col). Contains no game rules.
 */
@ccclass
export default class BoardView extends cc.Component {
  private container!: cc.Node
  private layout!: Layout
  private assets!: AssetLoader

  private grid: Array<Array<TileView | null>> = []
  private byId = new Map<number, TileView>()
  private fx!: Fx

  /** Input callback — set by GameController. */
  onCellTap: (pos: Position) => void = () => {}

  setup(container: cc.Node, inputNode: cc.Node, layout: Layout, assets: AssetLoader): void {
    this.container = container
    this.layout = layout
    this.assets = assets
    this.grid = Array.from({ length: layout.rows }, () => new Array(layout.cols).fill(null))
    this.fx = new Fx(container, layout)
    inputNode.off(cc.Node.EventType.TOUCH_END, this.handleTouch, this)
    inputNode.on(cc.Node.EventType.TOUCH_END, this.handleTouch, this)
  }

  private handleTouch(e: cc.Event.EventTouch): void {
    const node = e.currentTarget as cc.Node
    const p = node.convertToNodeSpaceAR(e.getLocation())
    const cell = this.layout.cellAtPlayLocal(p.x, p.y)
    if (cell) this.onCellTap(cell)
  }

  // --- construction ---

  buildInitial(board: Board): void {
    board.forEach((tile, pos) => {
      if (tile) this.createTile(tile.id, this.frameFor(board, pos), pos.row, pos.col)
    })
  }

  private frameFor(board: Board, pos: Position): cc.SpriteFrame {
    const t = board.get(pos)!
    return t.isSuper ? this.assets.superTile(t.effect as SuperTileEffect) : this.assets.tile(t.color)
  }

  private createTile(id: number, frame: cc.SpriteFrame, row: number, col: number): TileView {
    const node = new cc.Node(`tile_${id}`)
    node.parent = this.container
    const view = node.addComponent(TileView)
    view.init(frame, this.layout.tileW, this.layout.tileH, id, row, col)
    const c = this.layout.cellCenter(row, col)
    node.setPosition(c.x, c.y)
    this.grid[row][col] = view
    this.byId.set(id, view)
    return view
  }

  private at(pos: Position): TileView | null {
    return this.grid[pos.row][pos.col]
  }

  /** Highlight the selected cell (used when picking a pair for teleport). */
  markSelected(pos: Position, on: boolean): void {
    const v = this.at(pos)
    if (v) v.setSelected(on)
  }

  // --- event animations ---

  async burnCells(cells: Position[], colorIndex = -1): Promise<void> {
    const views: TileView[] = []
    for (const c of cells) {
      const v = this.at(c)
      if (!v) continue
      this.grid[c.row][c.col] = null
      this.byId.delete(v.tileId)
      views.push(v)
    }
    // Shard burst per cell; sampled for large burns to keep it cheap.
    const step = views.length > 24 ? Math.ceil(views.length / 24) : 1
    views.forEach((v, i) => {
      if (i % step !== 0) return
      const col = colorIndex >= 0 ? tileColor(colorIndex) : cc.color(255, 235, 170)
      this.fx.burst(this.layout.cellCenter(v.row, v.col), col, 6)
    })
    await Promise.all(views.map(v => v.burn()))
  }

  createSuper(pos: Position, effect: SuperTileEffect, tileId: number): Promise<void> {
    this.fx.spark(this.layout.cellCenter(pos.row, pos.col))
    const view = this.createTile(tileId, this.assets.superTile(effect), pos.row, pos.col)
    return view.promoteToSuper(this.assets.superTile(effect))
  }

  /** Bomb booster: shockwave at the tap, then burn the affected cells. */
  async bombBurn(pos: Position, cells: Position[]): Promise<void> {
    this.fx.shockwave(this.layout.cellCenter(pos.row, pos.col))
    await this.burnCells(cells)
  }

  /** Super-tile activation: effect-specific FX, then burn the affected cells. */
  async superBurn(pos: Position, effect: SuperTileEffect, cells: Position[]): Promise<void> {
    if (effect === SuperTileEffect.Row) this.fx.beam('row', pos)
    else if (effect === SuperTileEffect.Column) this.fx.beam('col', pos)
    else if (effect === SuperTileEffect.Field) this.fx.flash()
    else this.fx.shockwave(this.layout.cellCenter(pos.row, pos.col))
    await this.burnCells(cells)
  }

  async applyFalls(moves: Array<{ from: Position; to: Position }>): Promise<void> {
    const moving: Array<{ view: TileView; to: Position }> = []
    for (const m of moves) {
      const v = this.grid[m.from.row][m.from.col]
      if (!v) continue
      this.grid[m.from.row][m.from.col] = null
      moving.push({ view: v, to: m.to })
    }
    for (const m of moving) {
      this.grid[m.to.row][m.to.col] = m.view
      m.view.setCell(m.to.row, m.to.col)
    }
    await Promise.all(
      moving.map(m => m.view.moveTo(this.layout.cellCenter(m.to.row, m.to.col), D.fall))
    )
  }

  async spawnTiles(spawns: Array<{ pos: Position; color: number }>, board: Board): Promise<void> {
    const tasks: Array<Promise<void>> = []
    for (const s of spawns) {
      const tile = board.get(s.pos)!
      const node = new cc.Node(`tile_${tile.id}`)
      node.parent = this.container
      const view = node.addComponent(TileView)
      view.init(this.assets.tile(s.color), this.layout.tileW, this.layout.tileH, tile.id, s.pos.row, s.pos.col)
      this.grid[s.pos.row][s.pos.col] = view
      this.byId.set(tile.id, view)
      const c = this.layout.cellCenter(s.pos.row, s.pos.col)
      tasks.push(view.spawnDrop(this.layout.spawnPoint(s.pos.col).y, c, D.spawn))
    }
    await Promise.all(tasks)
  }

  async swapTiles(a: Position, b: Position): Promise<void> {
    const va = this.at(a)
    const vb = this.at(b)
    if (!va || !vb) return
    this.grid[a.row][a.col] = vb
    this.grid[b.row][b.col] = va
    va.setCell(b.row, b.col)
    vb.setCell(a.row, a.col)
    const ca = this.layout.cellCenter(a.row, a.col)
    const cb = this.layout.cellCenter(b.row, b.col)
    this.fx.spark(ca, cc.color(150, 210, 255))
    this.fx.spark(cb, cc.color(150, 210, 255))
    await Promise.all([va.moveTo(cb, D.swap), vb.moveTo(ca, D.swap)])
  }

  /** Shuffle: redistribute existing nodes to the core's new positions. */
  async reshuffleTo(board: Board): Promise<void> {
    this.grid = Array.from({ length: this.layout.rows }, () => new Array(this.layout.cols).fill(null))
    const tasks: Array<Promise<void>> = []
    board.forEach((tile, pos) => {
      if (!tile) return
      const v = this.byId.get(tile.id)
      if (!v) return
      this.grid[pos.row][pos.col] = v
      v.setCell(pos.row, pos.col)
      tasks.push(v.moveTo(this.layout.cellCenter(pos.row, pos.col), D.fall))
    })
    await Promise.all(tasks)
  }

  /**
   * Safety reconciliation of nodes with the core state — eliminates drift after a
   * series of animations (creates missing ones, removes extras, snaps positions).
   */
  reconcile(board: Board): void {
    const expected = new Set<number>()
    board.forEach((tile, pos) => {
      if (!tile) return
      expected.add(tile.id)
      let v = this.byId.get(tile.id)
      if (!v) {
        v = this.createTile(tile.id, this.frameFor(board, pos), pos.row, pos.col)
      }
      this.grid[pos.row][pos.col] = v
      v.setCell(pos.row, pos.col)
      const c = this.layout.cellCenter(pos.row, pos.col)
      v.node.setPosition(c.x, c.y)
    })
    for (const [id, v] of Array.from(this.byId.entries())) {
      if (!expected.has(id)) {
        v.node.destroy()
        this.byId.delete(id)
      }
    }
  }
}
