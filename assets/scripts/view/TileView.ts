import { ANIM } from './Anim'

const { ccclass } = cc._decorator

/**
 * Visual representation of a single tile. Knows only about itself: sprite, size,
 * current cell and its own animations. Contains no logic.
 */
@ccclass
export default class TileView extends cc.Component {
  /** Domain tile id — link to the core for tracking during a fall. */
  tileId = 0
  row = 0
  col = 0

  private sprite!: cc.Sprite

  init(frame: cc.SpriteFrame, w: number, h: number, tileId: number, row: number, col: number): void {
    this.sprite = this.node.getComponent(cc.Sprite) || this.node.addComponent(cc.Sprite)
    this.sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM
    this.sprite.trim = false
    this.sprite.spriteFrame = frame
    this.node.setContentSize(w, h)
    this.tileId = tileId
    this.setCell(row, col)
  }

  setCell(row: number, col: number): void {
    this.row = row
    this.col = col
  }

  setFrame(frame: cc.SpriteFrame): void {
    this.sprite.spriteFrame = frame
  }

  /** Burn: a slight "inhale" → collapse with fade, then destroy. One timeline. */
  burn(): Promise<void> {
    return new Promise(resolve => {
      cc.tween(this.node)
        .to(ANIM.burnGrow, { scale: 1.18 }, { easing: 'quadOut' })
        .to(ANIM.burnShrink, { scale: 0, opacity: 0 }, { easing: 'backIn' })
        .call(() => {
          this.node.destroy()
          resolve()
        })
        .start()
    })
  }

  /** Fall/shift to a new position with acceleration and a soft "settle". */
  moveTo(pos: cc.Vec2 | { x: number; y: number }, dur: number): Promise<void> {
    return new Promise(resolve => {
      cc.tween(this.node)
        .to(dur, { position: cc.v3(pos.x, pos.y, 0) }, { easing: 'quadIn' })
        .call(resolve)
        .start()
    })
  }

  /** Appear from the top: place above the field and drop down with a bounce. */
  spawnDrop(fromY: number, toPos: { x: number; y: number }, dur: number): Promise<void> {
    return new Promise(resolve => {
      this.node.setPosition(toPos.x, fromY)
      cc.tween(this.node)
        .to(dur, { position: cc.v3(toPos.x, toPos.y, 0) }, { easing: 'backOut' })
        .call(resolve)
        .start()
    })
  }

  /** Promotion to a super-tile: sprite swap with a "pulse". */
  promoteToSuper(frame: cc.SpriteFrame): Promise<void> {
    return new Promise(resolve => {
      this.setFrame(frame)
      cc.tween(this.node)
        .to(ANIM.superPromoteUp, { scale: 1.3 }, { easing: 'quadOut' })
        .to(ANIM.superPromoteDown, { scale: 1 }, { easing: 'backOut' })
        .call(resolve)
        .start()
    })
  }

  /** Selection highlight (for teleport). */
  setSelected(on: boolean): void {
    this.node.color = on ? cc.color(255, 230, 120) : cc.color(255, 255, 255)
    this.node.scale = on ? 1.1 : 1
  }
}
