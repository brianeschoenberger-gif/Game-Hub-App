import Phaser from "phaser";

export type PickupKind = "coin" | "heart" | "key";
export type EnemyKind = "goblin" | "captain";
export type PropKind =
  | "tree"
  | "rock"
  | "fence"
  | "barrel"
  | "crate"
  | "banner"
  | "torch"
  | "ruin"
  | "bush"
  | "sign";

export interface LevelPickup {
  kind: PickupKind;
  x: number;
  y: number;
}

export interface EnemyDefinition {
  kind: EnemyKind;
  name: string;
  x: number;
  y: number;
  patrol: Phaser.Math.Vector2[];
}

export interface RectDefinition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PropDefinition {
  kind: PropKind;
  x: number;
  y: number;
  width?: number;
  height?: number;
  collides?: boolean;
  text?: string;
}

export interface BreakableDefinition {
  kind: "crate" | "barrel";
  x: number;
  y: number;
  coins?: number;
}

export interface GateDefinition extends RectDefinition {
  name: string;
}

export interface ExitDefinition {
  x: number;
  y: number;
  radius: number;
}

export interface LevelDefinition {
  name: string;
  world: { width: number; height: number };
  playerStart: { x: number; y: number };
  paths: Phaser.Math.Vector2[];
  clearings: { x: number; y: number; radius: number }[];
  props: PropDefinition[];
  breakables: BreakableDefinition[];
  pickups: LevelPickup[];
  enemies: EnemyDefinition[];
  gate: GateDefinition;
  exit: ExitDefinition;
}

export interface GameSnapshot {
  mode: string;
  note: string;
  level: string;
  objective: string;
  player: {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    stamina: number;
    blocking: boolean;
    coins: number;
    hasKey: boolean;
  };
  gate: { open: boolean; x: number; y: number };
  arenaLocked: boolean;
  enemies: Array<{ name: string; kind: EnemyKind; x: number; y: number; hp: number }>;
  pickups: Array<{ kind: PickupKind; x: number; y: number }>;
}
