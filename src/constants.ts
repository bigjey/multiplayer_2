export const GAME_W = 800;
export const GAME_H = 600;

export const PLAYER_MOVE_SPEED = 200 / 1000;
export const BULLET_MOVE_SPEED = 400 / 1000;

export const ENEMY_MOVE_SPEED = 150 / 1000;
export const ENEMY_SPAWN_COOLDOWN = 100;

export const SERVER_TICK_RATE = 20;

export enum CommandType {
  Move,
  Shoot,
}

export const PLAYER_COLORS = ["green", "blue", "yellow", "orange", "purple"];
