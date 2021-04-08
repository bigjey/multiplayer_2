import { AABBIntersects } from "./src/utils";
import { Body } from "./src/GameState";
import { strict as assert } from "assert";

const a = new Body(0, 0, 10, 10);
const b = new Body(10, 0, 10, 10);

const c = new Body(9, 0, 10, 10);
const d = new Body(-9, 0, 10, 10);
const e = new Body(-9, 10, 10, 10);

const pulka = new Body(-2, -2, 4, 4);
const pulka2 = new Body(-2, -4, 4, 4);
const pulka3 = new Body(-4, -2, 4, 4);
const pulka21 = new Body(-2, -3, 4, 4);

assert(AABBIntersects(a, b) === false, "a b dont intersect");
assert(AABBIntersects(a, c) === true, "a c intersect");
assert(AABBIntersects(a, d) === true, "a d intersect");

assert(AABBIntersects(a, pulka) === true, "a pulka intersect");
assert(AABBIntersects(a, pulka2) === false, "a pulka2 dont intersect");
assert(AABBIntersects(a, pulka3) === false, "a pulka2 dont intersect");
assert(AABBIntersects(a, pulka21) === true, "a pulka21 intersect");

console.log("OK");
