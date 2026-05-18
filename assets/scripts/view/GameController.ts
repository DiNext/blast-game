import { AnimationSequencer } from './AnimationSequencer'
import { AssetLoader, UI_TEXTURE } from './AssetLoader'
import BoardView from './BoardView'
import BoosterBar, { BoosterKind } from './BoosterBar'
import EndModal from './EndModal'
import HudView from './HudView'
import { Box, DESIGN_H, DESIGN_W, Layout, PLAY, UI } from './Layout'
import { GameEngine } from '../core/GameEngine'
import { GameConfig } from '../core/model/GameConfig'
import { GameStatus, Position } from '../core/model/types'

const { ccclass, property } = cc._decorator

/**
 * Entry point. Builds the scene programmatically (minimal manual setup in the
 * editor: a single Canvas node with this component is enough), owns the game core,
 * routes input by mode and plays events through the sequencer.
 *
 * The core knows nothing about Cocos; the controller knows nothing about the game rules.
 */
@ccclass
export default class GameController extends cc.Component {
  /** Optional balance overrides (everything else from DEFAULT_CONFIG). */
  @property
  rows = 9
  @property
  cols = 9
  @property
  targetScore = 1000
  @property
  maxMoves = 20

  private assets = new AssetLoader()
  private layout!: Layout
  private engine!: GameEngine
  private boardView!: BoardView
  private hud!: HudView
  private boosterBar!: BoosterBar
  private endModal!: EndModal
  private sequencer!: AnimationSequencer

  private container!: cc.Node
  private inputNode!: cc.Node
  private busy = false
  private armed: BoosterKind | null = null
  private teleportFirst: Position | null = null

  onLoad(): void {
    const canvas = this.getComponent(cc.Canvas) || this.node.getComponent(cc.Canvas)
    if (canvas) {
      canvas.designResolution = cc.size(DESIGN_W, DESIGN_H)
      canvas.fitHeight = true
      canvas.fitWidth = true
    } else {
      cc.view.setDesignResolutionSize(DESIGN_W, DESIGN_H, cc.ResolutionPolicy.SHOW_ALL)
    }

    this.assets
      .load()
      .then(() => this.build())
      .catch(err => cc.error('asset load failed', err))
  }

  private get config(): Partial<GameConfig> {
    return {
      rows: this.rows,
      cols: this.cols,
      targetScore: this.targetScore,
      maxMoves: this.maxMoves
    }
  }

  // --- scene construction ---

  private build(): void {
    this.layout = new Layout(this.rows, this.cols)
    this.buildBackground()
    this.buildFrames()
    // Tile container — full screen, WITHOUT a listener (does not intercept touches).
    this.container = this.addNode('board', 0, 0, DESIGN_W, DESIGN_H, 50)
    // Input node — strictly the play field size, catches touches only over the grid.
    const pc = this.layout.playCenter()
    this.inputNode = this.addNode('input', pc.x, pc.y, PLAY.w, PLAY.h, 60)
    this.buildHud()
    this.buildBoosterBar()
    this.buildEndModal()
    this.startNewGame()
  }

  private buildBackground(): void {
    // bg position from Figma: img abs x=239, frame abs x=1757 → the offset yields the same crop.
    const n = this.addSprite(UI_TEXTURE.bg, -351.5, 0, 3413, 1920, 0)
    n.name = 'bg'
  }

  private buildFrames(): void {
    // Exact instances from Figma, placed 1:1 as plain sprites.
    this.addBox(UI_TEXTURE.framePlay, UI.framePlay, 10)
    this.addBox(UI_TEXTURE.frameMoves, UI.frameMoves, 10)
    this.addBox(UI_TEXTURE.slotScore, UI.slotScore, 12)
  }

  private buildHud(): void {
    this.addBox(UI_TEXTURE.badgeMoves, UI.movesBadge, 14)
    const badgeC = this.layout.center(UI.movesBadge)
    const movesLabel = this.addLabel('', badgeC.x, badgeC.y, 88, 30)

    const capC = this.layout.center(UI.scoreCaption)
    this.addLabel('очки:', capC.x, capC.y, 48, 30)
    const valC = this.layout.center(UI.scoreValue)
    const scoreLabel = this.addLabel('', valC.x, valC.y, 60, 30)

    this.hud = this.node.addComponent(HudView)
    this.hud.init(movesLabel, scoreLabel)
  }

  private buildBoosterBar(): void {
    const titleC = this.layout.center(UI.title)
    this.addLabel('Бустеры', titleC.x, titleC.y, 56, 15)

    this.addBox(UI_TEXTURE.slotBonus, UI.slotTeleport, 12)
    this.addBox(UI_TEXTURE.slotBonus, UI.slotBomb, 12)
    this.addBox(UI_TEXTURE.slonBonus, UI.slonTeleport, 13)
    this.addBox(UI_TEXTURE.slonBonus, UI.slonBomb, 13)

    const tpNode = this.addBox(UI_TEXTURE.boosterTeleport, UI.iconTeleport, 18)
    const bombNode = this.addBox(UI_TEXTURE.boosterBomb, UI.iconBomb, 18)

    const ct = this.layout.center(UI.countTeleport)
    const cb = this.layout.center(UI.countBomb)
    const tpCount = this.addLabel('', ct.x, ct.y, 52, 20)
    const bombCount = this.addLabel('', cb.x, cb.y, 52, 20)

    this.boosterBar = this.node.addComponent(BoosterBar)
    this.boosterBar.init(bombNode, tpNode, bombCount, tpCount)
    this.boosterBar.onArm = kind => {
      this.armed = kind
      this.clearTeleportPick()
    }
  }

  private buildEndModal(): void {
    const node = new cc.Node('endModal')
    this.endModal = node.addComponent(EndModal)
    this.endModal.build(this.node, this.assets.getFont())
    this.endModal.onRestart = () => this.startNewGame()
  }

  // --- game loop ---

  private startNewGame(): void {
    this.container.removeAllChildren()
    this.busy = false
    this.armed = null
    this.teleportFirst = null
    this.endModal.hide()

    this.engine = new GameEngine(this.config)
    this.boardView =
      this.boardView || this.node.addComponent(BoardView)
    this.boardView.setup(this.container, this.inputNode, this.layout, this.assets)
    this.boardView.buildInitial(this.engine.getBoard())
    this.boardView.onCellTap = pos => this.onCellTap(pos)

    this.sequencer = new AnimationSequencer(
      this.boardView,
      this.hud,
      this.endModal,
      () => this.engine.getBoard(),
      this.engine.config.targetScore
    )

    const s = this.engine.getState()
    this.hud.setMoves(s.movesLeft)
    this.hud.setScore(s.score, this.engine.config.targetScore)
    this.boosterBar.setCounts(s.bombCharges, s.teleportCharges)

    // The engine may already be terminal after construction (e.g. an unsolvable
    // initial deadlock exhausts shuffles). Those events fire before any listener,
    // so surface the outcome here instead of leaving a dead board.
    if (!s.isPlaying) {
      this.endModal.show(s.status === GameStatus.Won, s.score, this.engine.config.targetScore)
    }
  }

  private onCellTap(pos: Position): void {
    if (this.busy || !this.engine.getState().isPlaying) return

    let events
    if (this.armed === 'bomb') {
      events = this.engine.useBomb(pos)
      this.disarmBooster()
    } else if (this.armed === 'teleport') {
      if (!this.teleportFirst) {
        this.teleportFirst = pos
        this.boardView.markSelected(pos, true)
        return
      }
      const first = this.teleportFirst
      this.boardView.markSelected(first, false)
      events = this.engine.useTeleport(first, pos)
      this.disarmBooster()
    } else {
      events = this.engine.tap(pos)
    }

    if (!events || events.length === 0) return
    this.runTurn(events)
  }

  private async runTurn(events: ReturnType<GameEngine['tap']>): Promise<void> {
    this.busy = true
    try {
      await this.sequencer.play(events)
      const s = this.engine.getState()
      this.boosterBar.setCounts(s.bombCharges, s.teleportCharges)
    } catch (err) {
      cc.error('animation error', err)
    } finally {
      this.busy = false
    }
  }

  private disarmBooster(): void {
    this.armed = null
    this.clearTeleportPick()
    this.boosterBar.disarm()
  }

  private clearTeleportPick(): void {
    if (this.teleportFirst) {
      this.boardView.markSelected(this.teleportFirst, false)
      this.teleportFirst = null
    }
  }

  // --- node-building helpers ---

  private addNode(
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    z: number
  ): cc.Node {
    const n = new cc.Node(name)
    n.parent = this.node
    n.setPosition(x, y)
    n.setContentSize(w, h)
    n.zIndex = z
    return n
  }

  private addSprite(
    frameName: string,
    x: number,
    y: number,
    w: number,
    h: number,
    z: number
  ): cc.Node {
    const n = this.addNode(frameName, x, y, w, h, z)
    const s = n.addComponent(cc.Sprite)
    s.sizeMode = cc.Sprite.SizeMode.CUSTOM
    s.trim = false
    s.spriteFrame = this.assets.get(frameName)
    n.setContentSize(w, h)
    return n
  }

  /** Plain sprite exactly matching the Figma box (size = box×1, position = box center). */
  private addBox(frameName: string, box: Box, z: number): cc.Node {
    const c = this.layout.center(box)
    return this.addSprite(frameName, c.x, c.y, box.w, box.h, z)
  }

  private addLabel(
    text: string,
    x: number,
    y: number,
    size: number,
    z: number
  ): cc.Label {
    const n = this.addNode('label', x, y, 10, 10, z)
    const l = n.addComponent(cc.Label)
    l.string = text
    l.fontSize = size
    l.lineHeight = size + 6
    l.horizontalAlign = cc.Label.HorizontalAlign.CENTER
    l.verticalAlign = cc.Label.VerticalAlign.CENTER
    const font = this.assets.getFont()
    if (font) {
      l.font = font
      l.useSystemFont = false
    }
    return l
  }
}
