import { KEYS, keysPressed } from "./keyboard";
import {
  ICommand,
  IGameState,
  IMoveCommandPayload,
  IShootCommandPayload,
  IVector2,
} from "..";
import {
  CommandType,
  GAME_H,
  GAME_W,
  PLAYER_MOVE_SPEED,
  SERVER_STATE_UPDATE_RATE,
} from "../constants";
import { GameState } from "../GameState";
import { socket } from "./socket";
import Vector2 from "../Vector2";
import { randomId } from "../utils";

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("no 2d context");
}

canvas.width = GAME_W;
canvas.height = GAME_H;

document.body.appendChild(canvas);

let connected = false;
const clientState = new GameState();
let inputId = 0;

let lastUpdate = Date.now();
const tick = () => {
  if (connected) {
    const now = Date.now();
    const deltaTime = now - lastUpdate;
    lastUpdate = now;

    handleInput(deltaTime);

    clientState.update(deltaTime, false);

    render();
  }

  requestAnimationFrame(tick);
};

ctx.font = "bold 30px 'Courier New'";

const render = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";

  ctx.translate(GAME_W / 2, GAME_H / 2);

  const serverInterval = 1000 / SERVER_STATE_UPDATE_RATE;
  const now = Date.now();
  const t = Math.min((now - clientState.lastServerUpdate) / serverInterval, 1);

  let i = 0;
  for (const socketId in clientState.players) {
    const player = clientState.players[socketId];
    let position: IVector2;
    if (socket.id === socketId) {
      position = player.position;
    } else {
      const prevPlayer = clientState.prevState?.players[socketId];
      if (prevPlayer) {
        position = Vector2.lerp(prevPlayer.position, player.position, t);
        // position = player.position;
      } else {
        position = player.position;
      }
    }

    ctx.fillStyle = player.color;
    ctx.fillRect(
      position.x - player.size.x / 2,
      position.y - player.size.y / 2,
      player.size.x,
      player.size.y
    );

    ctx.fillText(
      `${player.score}`,
      -GAME_W / 2 + 10,
      -GAME_H / 2 + i * 30 + 30
    );
    i++;
  }

  for (const bulletId in clientState.bullets) {
    let position: IVector2;
    const prevBullet = clientState.prevState?.bullets[bulletId];
    const bullet = clientState.bullets[bulletId];
    if (prevBullet) {
      position = Vector2.lerp(prevBullet.position, bullet.position, t);
      // position = bullet.position;
    } else {
      position = bullet.position;
    }

    ctx.fillStyle = "#000";
    ctx.fillRect(
      position.x - bullet.size.x / 2,
      position.y - bullet.size.y / 2,
      bullet.size.x,
      bullet.size.y
    );
  }

  for (const enemyId in clientState.enemies) {
    let position: IVector2;
    const prevEnemy = clientState.prevState?.enemies[enemyId];
    const enemy = clientState.enemies[enemyId];
    if (prevEnemy) {
      position = Vector2.lerp(prevEnemy.position, enemy.position, t);
      // position = enemy.position;
    } else {
      position = enemy.position;
    }

    ctx.fillStyle = "#f22f";
    ctx.fillRect(
      position.x - enemy.size.x / 2,
      position.y - enemy.size.y / 2,
      enemy.size.x,
      enemy.size.y
    );
  }

  ctx.translate(-GAME_W / 2, -GAME_H / 2);
};

const handleInput = (deltaTime: number) => {
  let dx = 0;
  let dy = 0;

  if (keysPressed[KEYS.UP]) {
    dy += -PLAYER_MOVE_SPEED * deltaTime;
  }
  if (keysPressed[KEYS.DOWN]) {
    dy += PLAYER_MOVE_SPEED * deltaTime;
  }
  if (keysPressed[KEYS.LEFT]) {
    dx = -PLAYER_MOVE_SPEED * deltaTime;
  }
  if (keysPressed[KEYS.RIGHT]) {
    dx = PLAYER_MOVE_SPEED * deltaTime;
  }

  if (dx || dy) {
    const command: ICommand<IMoveCommandPayload> = {
      id: ++inputId,
      time: Date.now(),
      type: CommandType.Move,
      payload: {
        velocity: { x: dx, y: dy },
      },
    };

    clientState.applyCommand(socket.id, command);
    clientState.commands[socket.id].push(command);

    socket.emit("command", command);
  }
};

canvas.addEventListener("click", (e) => {
  if (!connected) return;

  const clickPos = new Vector2(e.offsetX - GAME_W / 2, e.offsetY - GAME_H / 2);

  const player = clientState.players[socket.id];

  const direction = Vector2.subtract(clickPos, player.position).normalize();
  const bulletPosition = Vector2.add(
    player.position,
    Vector2.multiply(direction, 10)
  );

  const command: ICommand<IShootCommandPayload> = {
    id: ++inputId,
    time: Date.now(),
    type: CommandType.Shoot,
    payload: {
      id: randomId(),
      position: bulletPosition,
      direction: direction,
    },
  };

  // clientState.addBullet(socket.id, command);
  clientState.applyCommand(socket.id, command);
  socket.emit("command", command);

  // console.log(clientState.bullets);
});

socket.on("connected", (snapshot) => {
  connected = true;
  clientState.addPlayer(socket.id);
});

socket.on("snapshot", (snapshot: IGameState) => {
  clientState.onServerState(snapshot);
});

socket.emit("joinGame");

tick();
