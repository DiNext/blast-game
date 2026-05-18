const { ccclass } = cc._decorator

export type BoosterKind = 'bomb' | 'teleport'

/**
 * Booster buttons with charge counters and an "armed" indicator.
 * Reports the booster selection upward; the mechanic itself is run by the core.
 */
@ccclass
export default class BoosterBar extends cc.Component {
  private bombNode!: cc.Node
  private teleportNode!: cc.Node
  private bombCount!: cc.Label
  private teleportCount!: cc.Label

  /** Callback: which booster is armed (or null — disarmed). Set by GameController. */
  onArm: (kind: BoosterKind | null) => void = () => {}

  private armed: BoosterKind | null = null

  init(
    bombNode: cc.Node,
    teleportNode: cc.Node,
    bombCount: cc.Label,
    teleportCount: cc.Label
  ): void {
    this.bombNode = bombNode
    this.teleportNode = teleportNode
    this.bombCount = bombCount
    this.teleportCount = teleportCount
    bombNode.on(cc.Node.EventType.TOUCH_END, () => this.toggle('bomb'), this)
    teleportNode.on(cc.Node.EventType.TOUCH_END, () => this.toggle('teleport'), this)
  }

  private toggle(kind: BoosterKind): void {
    this.armed = this.armed === kind ? null : kind
    this.refreshHighlight()
    this.onArm(this.armed)
  }

  /** Disarm (after applying a booster or making a move). */
  disarm(): void {
    if (this.armed === null) return
    this.armed = null
    this.refreshHighlight()
  }

  setCounts(bomb: number, teleport: number): void {
    this.bombCount.string = `${bomb}`
    this.teleportCount.string = `${teleport}`
    this.bombNode.opacity = bomb > 0 ? 255 : 120
    this.teleportNode.opacity = teleport > 0 ? 255 : 120
  }

  private refreshHighlight(): void {
    this.bombNode.scale = this.armed === 'bomb' ? 1.12 : 1
    this.teleportNode.scale = this.armed === 'teleport' ? 1.12 : 1
  }
}
