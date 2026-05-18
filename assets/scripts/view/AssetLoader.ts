import { SuperTileEffect, TileColor } from '../core/model/types'

/**
 * Preloads sprites from assets/resources/textures by name — to avoid binding
 * 18 SpriteFrames manually in the editor. Names match the files (see ASSETS.md).
 */

export const TILE_TEXTURE: Record<TileColor, string> = {
  0: 'tile_0_blue',
  1: 'tile_1_red',
  2: 'tile_2_purple',
  3: 'tile_3_green',
  4: 'tile_4_yellow'
}

export const SUPER_TEXTURE: Record<SuperTileEffect, string> = {
  [SuperTileEffect.Radius]: 'super_radius_bomb',
  [SuperTileEffect.Field]: 'super_field_bombmax',
  [SuperTileEffect.Column]: 'super_column_rocket',
  [SuperTileEffect.Row]: 'super_row_rocket'
}

export const UI_TEXTURE = {
  bg: 'bg',
  framePlay: 'frame_play',
  frameMoves: 'frame_moves',
  slotScore: 'slot_score',
  badgeMoves: 'badge_moves',
  slotBonus: 'slot_bonus',
  slonBonus: 'slon_bonus',
  boosterBomb: 'booster_bomb',
  boosterTeleport: 'booster_teleport'
}

const ALL = [
  ...Object.values(TILE_TEXTURE),
  ...Object.values(SUPER_TEXTURE),
  ...Object.values(UI_TEXTURE)
]

export class AssetLoader {
  private frames = new Map<string, cc.SpriteFrame>()
  private font: cc.Font | null = null

  load(): Promise<void> {
    return new Promise((resolve, reject) => {
      const paths = ALL.map(n => `textures/${n}`)
      cc.resources.load(paths, cc.SpriteFrame, (err: Error | null, items: cc.SpriteFrame[]) => {
        if (err) {
          reject(err)
          return
        }
        ALL.forEach((name, i) => this.frames.set(name, items[i]))
        this.loadFont().then(resolve)
      })
    })
  }

  /** Marvin font from the design. Optional: no file — system fallback. */
  private loadFont(): Promise<void> {
    return new Promise(resolve => {
      cc.resources.load('fonts/Marvin', cc.Font, (err: Error | null, font: cc.Font) => {
        if (err || !font) {
          cc.warn('Marvin font not found — using system font. Put it at resources/fonts/Marvin.*')
        } else {
          this.font = font
        }
        resolve()
      })
    })
  }

  getFont(): cc.Font | null {
    return this.font
  }

  get(name: string): cc.SpriteFrame {
    const f = this.frames.get(name)
    if (!f) throw new Error(`sprite frame not loaded: ${name}`)
    return f
  }

  tile(color: TileColor): cc.SpriteFrame {
    return this.get(TILE_TEXTURE[color])
  }

  superTile(effect: SuperTileEffect): cc.SpriteFrame {
    return this.get(SUPER_TEXTURE[effect])
  }
}
