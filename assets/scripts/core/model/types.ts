/**
 * Core game types. Pure TypeScript, no Cocos dependencies.
 */

/** Tile color. Stored as a palette index (0..colorsCount-1) for configurability. */
export type TileColor = number

/** Tile type: normal or super-tile. */
export enum TileType {
  Normal = 'Normal',
  Super = 'Super'
}

/** Super-tile effect on activation. */
export enum SuperTileEffect {
  Row = 'Row',
  Column = 'Column',
  Radius = 'Radius',
  Field = 'Field'
}

/** Game session status. */
export enum GameStatus {
  Playing = 'Playing',
  Won = 'Won',
  Lost = 'Lost'
}

/** Cell coordinate. row — top to bottom (0 = top), col — left to right. */
export interface Position {
  readonly row: number
  readonly col: number
}

export function posEquals(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col
}

export function posKey(p: Position): string {
  return `${p.row}:${p.col}`
}
