export const keysPressed: Record<string, boolean> = {};

export const KEYS: Record<string, string> = {
  UP: "KeyW",
  LEFT: "KeyA",
  DOWN: "KeyS",
  RIGHT: "KeyD",
};

window.addEventListener("keydown", (e) => {
  console.info(`keydown: ${e.code}`);
  keysPressed[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  keysPressed[e.code] = false;
});
