import { DESIGN_H, DESIGN_W } from './Layout'

const { ccclass } = cc._decorator

/** Game-over overlay: outcome + score + restart button. */
@ccclass
export default class EndModal extends cc.Component {
  private title!: cc.Label
  private subtitle!: cc.Label
  private font: cc.Font | null = null

  onRestart: () => void = () => {}

  /** Builds the overlay programmatically (minimal manual setup in the editor). */
  build(parent: cc.Node, font: cc.Font | null = null): void {
    this.font = font
    this.node.parent = parent
    this.node.setContentSize(DESIGN_W, DESIGN_H)
    this.node.zIndex = 1000

    const dim = new cc.Node('dim')
    dim.parent = this.node
    const g = dim.addComponent(cc.Graphics)
    g.fillColor = cc.color(0, 0, 0, 170)
    g.rect(-DESIGN_W / 2, -DESIGN_H / 2, DESIGN_W, DESIGN_H)
    g.fill()
    dim.on(cc.Node.EventType.TOUCH_END, () => {})

    this.title = this.makeLabel('', 96, 120)
    this.subtitle = this.makeLabel('', 56, 0)
    const btn = this.makeLabel('Играть снова', 52, -140)
    btn.node.color = cc.color(255, 220, 120)
    btn.node.on(cc.Node.EventType.TOUCH_END, () => this.onRestart(), this)

    this.node.active = false
  }

  private makeLabel(text: string, size: number, y: number): cc.Label {
    const n = new cc.Node('label')
    n.parent = this.node
    n.setPosition(0, y)
    const l = n.addComponent(cc.Label)
    l.string = text
    l.fontSize = size
    l.lineHeight = size + 8
    if (this.font) {
      l.font = this.font
      l.useSystemFont = false
    }
    return l
  }

  show(won: boolean, score: number, target: number): void {
    this.title.string = won ? 'Победа!' : 'Поражение'
    this.title.node.color = won ? cc.color(120, 230, 140) : cc.color(240, 120, 120)
    this.subtitle.string = `Очки: ${score} / ${target}`
    this.node.active = true
    this.node.scale = 0.7
    cc.tween(this.node).to(0.25, { scale: 1 }, { easing: 'backOut' }).start()
  }

  hide(): void {
    this.node.active = false
  }
}
