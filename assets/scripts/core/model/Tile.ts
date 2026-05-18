import { SuperTileEffect, TileColor, TileType } from './types'

/**
 * Game board tile. Immutable by id — the view uses it to track a specific
 * sprite between moves (important for falling animations).
 */
export class Tile {
  private static counter = 0

  readonly id: number
  readonly color: TileColor
  readonly type: TileType
  /** Set only for super-tiles. */
  readonly effect: SuperTileEffect | null

  constructor(color: TileColor, type: TileType = TileType.Normal, effect: SuperTileEffect | null = null) {
    this.id = ++Tile.counter
    this.color = color
    this.type = type
    this.effect = type === TileType.Super ? effect : null
  }

  static normal(color: TileColor): Tile {
    return new Tile(color, TileType.Normal)
  }

  static superTile(color: TileColor, effect: SuperTileEffect): Tile {
    return new Tile(color, TileType.Super, effect)
  }

  get isSuper(): boolean {
    return this.type === TileType.Super
  }
}
