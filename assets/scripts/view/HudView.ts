import { ANIM } from './Anim'

const { ccclass } = cc._decorator

/** Status panel: moves and "current/target" score. Display only. */
@ccclass
export default class HudView extends cc.Component {
  private movesLabel!: cc.Label
  private scoreLabel!: cc.Label

  init(movesLabel: cc.Label, scoreLabel: cc.Label): void {
    this.movesLabel = movesLabel
    this.scoreLabel = scoreLabel
  }

  setMoves(n: number): void {
    this.movesLabel.string = `${n}`
    this.pulse(this.movesLabel.node)
  }

  setScore(score: number, target: number): void {
    this.scoreLabel.string = `${score}/${target}`
    this.pulse(this.scoreLabel.node)
  }

  private pulse(node: cc.Node): void {
    node.stopAllActions()
    node.scale = 1
    cc.tween(node)
      .to(ANIM.hudPulseUp, { scale: 1.18 }, { easing: 'quadOut' })
      .to(ANIM.hudPulseDown, { scale: 1 }, { easing: 'backOut' })
      .start()
  }
}
