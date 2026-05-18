import { Layout, PLAY, XY } from './Layout'

/**
 * Procedural visual effects (no extra art): shards, shockwave ring, rocket
 * beams, full-field flash and sparkles, all built from cc.Graphics + tweens.
 *
 * Pure presentation. Effects are fire-and-forget transient nodes that clean
 * themselves up; they never block the turn timeline.
 */

/** Approximate tile palette (matches the 5 Figma tile colors). */
const PALETTE = [
  cc.color(79, 195, 247), // 0 blue
  cc.color(239, 83, 80), // 1 red
  cc.color(171, 71, 188), // 2 purple
  cc.color(102, 187, 106), // 3 green
  cc.color(255, 202, 40) // 4 yellow
]

export function tileColor(index: number): cc.Color {
  return PALETTE[index % PALETTE.length] || cc.Color.WHITE
}

export class Fx {
  constructor(private readonly parent: cc.Node, private readonly layout: Layout) {}

  private dot(radius: number, color: cc.Color): cc.Node {
    const n = new cc.Node('fx')
    n.parent = this.parent
    n.zIndex = 999
    const g = n.addComponent(cc.Graphics)
    g.fillColor = color
    g.circle(0, 0, radius)
    g.fill()
    return n
  }

  /** Shard burst — small dots flying outward while shrinking and fading. */
  burst(center: XY, color: cc.Color, count = 7): void {
    for (let i = 0; i < count; i++) {
      const n = this.dot(6 + Math.random() * 5, color)
      n.setPosition(center.x, center.y)
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.6
      const dist = 36 + Math.random() * 46
      const tx = center.x + Math.cos(ang) * dist
      const ty = center.y + Math.sin(ang) * dist
      cc.tween(n)
        .to(0.28 + Math.random() * 0.14, { position: cc.v3(tx, ty, 0), scale: 0, opacity: 0 }, { easing: 'quadOut' })
        .call(() => n.destroy())
        .start()
    }
  }

  /** Expanding fading ring (bomb / radius super-tile). */
  shockwave(center: XY, maxRadius = 220, color: cc.Color = cc.color(255, 230, 150)): void {
    const n = new cc.Node('fx-ring')
    n.parent = this.parent
    n.zIndex = 999
    n.setPosition(center.x, center.y)
    const g = n.addComponent(cc.Graphics)
    g.lineWidth = 14
    g.strokeColor = color
    g.circle(0, 0, maxRadius)
    g.stroke()
    n.scale = 0.1
    n.opacity = 230
    cc.tween(n)
      .to(0.34, { scale: 1, opacity: 0 }, { easing: 'quadOut' })
      .call(() => n.destroy())
      .start()
  }

  /** Glow beam along a full row or column (rocket super-tile). */
  beam(orientation: 'row' | 'col', cell: { row: number; col: number }, color = cc.color(255, 240, 180)): void {
    const c = this.layout.cellCenter(cell.row, cell.col)
    const n = new cc.Node('fx-beam')
    n.parent = this.parent
    n.zIndex = 998
    const g = n.addComponent(cc.Graphics)
    g.fillColor = color
    const thick = Math.min(this.layout.cellH, this.layout.cellW) * 0.9
    if (orientation === 'row') {
      n.setPosition(0, c.y)
      g.rect(-PLAY.w / 2, -thick / 2, PLAY.w, thick)
    } else {
      n.setPosition(c.x, 0)
      g.rect(-thick / 2, -PLAY.h / 2, thick, PLAY.h)
    }
    g.fill()
    n.opacity = 0
    cc.tween(n)
      .to(0.1, { opacity: 220 })
      .to(0.26, { opacity: 0 }, { easing: 'quadOut' })
      .call(() => n.destroy())
      .start()
  }

  /**
   * Soft field sweep (field bomb_max). Deliberately gentle: a low-opacity warm
   * tint confined to the play area plus an expanding wave from the center —
   * no harsh full-screen white flash.
   */
  flash(color: cc.Color = cc.color(255, 214, 140)): void {
    const center = this.layout.cellCenter(
      Math.floor(this.layout.rows / 2),
      Math.floor(this.layout.cols / 2)
    )

    const tint = new cc.Node('fx-field')
    tint.parent = this.parent
    tint.zIndex = 997
    tint.setPosition(center.x, center.y)
    const g = tint.addComponent(cc.Graphics)
    g.fillColor = color
    g.roundRect(-PLAY.w / 2, -PLAY.h / 2, PLAY.w, PLAY.h, 24)
    g.fill()
    tint.opacity = 0
    cc.tween(tint)
      .to(0.12, { opacity: 70 }, { easing: 'quadOut' })
      .to(0.34, { opacity: 0 }, { easing: 'quadOut' })
      .call(() => tint.destroy())
      .start()

    this.shockwave(center, Math.max(PLAY.w, PLAY.h) * 0.6, color)
  }

  /** Star-pop sparkle (super-tile creation, teleport endpoints). */
  spark(center: XY, color: cc.Color = cc.color(255, 240, 170)): void {
    const n = this.dot(10, color)
    n.setPosition(center.x, center.y)
    n.scale = 0.2
    cc.tween(n)
      .to(0.16, { scale: 1.5 }, { easing: 'quadOut' })
      .to(0.2, { scale: 0, opacity: 0 }, { easing: 'quadIn' })
      .call(() => n.destroy())
      .start()
    this.burst(center, color, 5)
  }
}
