import type { Body } from "./GameState";

export function lerp(v0: number, v1: number, t: number): number {
  return (1 - t) * v0 + t * v1;
}

export function randomId(): string {
  return Date.now() + "-" + Math.floor(Math.random() * 1000000);
}

export function randomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function AABBIntersects(A: Body, B: Body): boolean {
  return !(A.r <= B.l || A.l >= B.r || A.t >= B.b || A.b <= B.t);
}
