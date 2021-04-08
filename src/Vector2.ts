import { IVector2 } from ".";
import { lerp } from "./utils";

export default class Vector2 implements IVector2 {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static lerp(A: IVector2, B: IVector2, t: number): IVector2 {
    const v = new Vector2();

    v.x = lerp(A.x, B.x, t);
    v.y = lerp(A.y, B.y, t);

    return v;
  }

  static distance(A: IVector2, B: IVector2): number {
    return Math.sqrt(Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2));
  }

  distance(V: IVector2): number {
    return Math.sqrt(Math.pow(this.x - V.x, 2) + Math.pow(this.y - V.y, 2));
  }

  magnitude(): number {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  normalize(): Vector2 {
    let m = this.magnitude();

    this.x /= m;
    this.y /= m;

    return this;
  }

  static add(A: IVector2, B: IVector2): Vector2 {
    return new Vector2(A.x + B.x, A.y + B.y);
  }

  add(V: IVector2): void {
    this.x += V.x;
    this.y += V.y;
  }

  static subtract(A: IVector2, B: IVector2): Vector2 {
    return new Vector2(A.x - B.x, A.y - B.y);
  }

  subtract(V: IVector2): IVector2 {
    return new Vector2(this.x - V.x, this.y - V.y);
  }

  static multiply(V: IVector2, value: number): IVector2 {
    return new Vector2(V.x * value, V.y * value);
  }

  multiply(V: IVector2): IVector2 {
    return new Vector2(this.x * V.x, this.y * V.y);
  }

  toJS(): IVector2 {
    return { x: this.x, y: this.y };
  }
}
