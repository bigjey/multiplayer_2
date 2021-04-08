import { CommandType } from "./constants";

export interface IGameState {
  players: Record<string, IPlayerState>;
  bullets: Record<string, IBulletState>;
  deletedBullets: string[];
  enemies: Record<string, IEnemyState>;
  lastProcessedCommand: Record<string, number>;
}

export interface ICommand<T> {
  id: number;
  time: number;
  type: CommandType;
  payload: T;
}

export interface IPlayerState {
  socketId: string;
  position: IVector2;
  score: number;
  color: string;
}

export interface IBulletState {
  id: string;
  owner: string;
  position: IVector2;
  direction: IVector2;
}

export interface IEnemyState {
  id: string;
  position: IVector2;
  direction: IVector2;
}

export interface IVector2 {
  x: number;
  y: number;
}

export interface IMoveCommandPayload {
  velocity: IVector2;
}

export interface IShootCommandPayload {
  id: string;
  position: IVector2;
  direction: IVector2;
}

export type CommandPayload = IMoveCommandPayload | IShootCommandPayload;
