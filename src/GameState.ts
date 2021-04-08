import {
  CommandPayload,
  IBulletState,
  ICommand,
  IEnemyState,
  IGameState,
  IMoveCommandPayload,
  IPlayerState,
  IShootCommandPayload,
  IVector2,
} from ".";
import { socket } from "./client/socket";
import {
  CommandType,
  BULLET_MOVE_SPEED,
  SERVER_STATE_UPDATE_RATE,
  GAME_W,
  GAME_H,
  ENEMY_SPAWN_COOLDOWN,
  ENEMY_MOVE_SPEED,
  PLAYER_COLORS,
} from "./constants";
import { AABBIntersects, random, randomId, randomInt } from "./utils";
import Vector2 from "./Vector2";

export class GameState {
  players: Record<string, Player> = {};
  bullets: Record<string, Bullet> = {};
  deletedBullets: string[];
  enemies: Record<string, Enemy> = {};
  commands: Record<string, ICommand<CommandPayload>[]> = {};
  lastProcessedCommand: Record<string, number> = {};
  lastServerUpdate: number;
  lastEnemySpawn: number;

  prevState: IGameState | null = null;

  constructor() {}

  onServerState(serverState: IGameState) {
    this.prevState = this.snapshot();
    // console.log("prev state", this.prevState, "new state", serverState);

    this.lastServerUpdate = Date.now();

    this.players = {};

    for (const socketId in serverState.players) {
      const serverPlayer = serverState.players[socketId];

      if (socket.id === socketId) {
        const clientPlayer = this.prevState.players[socketId];

        this.players[socketId] = Player.fromSnapshot(serverPlayer);
        this.players[socketId].score = serverPlayer.score;

        if (this.commands[socketId]) {
          this.commands[socketId] = this.commands[socketId].filter(
            (command) => command.id > serverState.lastProcessedCommand[socketId]
          );
          this.commands[socketId].forEach((command) => {
            this.applyCommand(socketId, command);
          });
        } else {
          this.players[socketId] = Player.fromSnapshot(clientPlayer);
          this.players[socketId].score = serverPlayer.score;
        }
      } else {
        this.players[socketId] = Player.fromSnapshot(serverPlayer);
        this.players[socketId].score = serverPlayer.score;
      }
    }

    // this.bullets = {};

    for (const bulletId in serverState.bullets) {
      const prevBullet = this.prevState.bullets[bulletId];
      // console.log("bullet from server", serverState.bullets[bulletId]);
      // console.log("bullet existed", prevBullet);
      if (prevBullet && prevBullet.owner === socket.id) {
        this.bullets[bulletId] = Bullet.fromSnapshot(prevBullet);
      } else {
        this.bullets[bulletId] = Bullet.fromSnapshot(
          serverState.bullets[bulletId]
        );
      }
    }

    for (const bulletId of serverState.deletedBullets) {
      console.log("deletedBullet", bulletId);
      delete this.bullets[bulletId];
    }

    this.enemies = {};

    for (const enemyId in serverState.enemies) {
      this.enemies[enemyId] = Enemy.fromSnapshot(serverState.enemies[enemyId]);
    }
  }

  update(deltaTime: number, server: boolean): void {
    const now = Date.now();

    Object.values(this.bullets).forEach((bullet) => {
      if (!server && bullet.owner === socket.id) {
        const moveBy = deltaTime * BULLET_MOVE_SPEED;
        bullet.position.x += moveBy * bullet.direction.x;
        bullet.position.y += moveBy * bullet.direction.y;
      }

      if (server) {
        const moveBy = deltaTime * BULLET_MOVE_SPEED;
        bullet.position.x += moveBy * bullet.direction.x;
        bullet.position.y += moveBy * bullet.direction.y;

        if (
          bullet.position.x < -GAME_W / 2 ||
          bullet.position.x > GAME_W / 2 ||
          bullet.position.y < -GAME_H / 2 ||
          bullet.position.y > GAME_H / 2
        ) {
          bullet.destroy = true;
        }

        Object.values(this.enemies).forEach((enemy) => {
          if (!bullet.destroy && AABBIntersects(enemy, bullet)) {
            bullet.destroy = true;
            enemy.destroy = true;
            const p = this.players[bullet.owner];
            if (p) {
              p.score += 1;
            }
          }
        });
      }
    });

    Object.values(this.enemies).forEach((enemy) => {
      if (server) {
        enemy.position.x += deltaTime * ENEMY_MOVE_SPEED * enemy.direction.x;
        enemy.position.y += deltaTime * ENEMY_MOVE_SPEED * enemy.direction.y;
        if (enemy.position.x < -GAME_W / 2) {
          enemy.direction.x *= -1;
          enemy.position.x = -GAME_W / 2;
        } else if (enemy.position.x > GAME_W / 2) {
          enemy.direction.x *= -1;
          enemy.position.x = GAME_W / 2;
        }
        if (enemy.position.y < -GAME_H / 2) {
          enemy.direction.y *= -1;
          enemy.position.y = -GAME_H / 2;
        } else if (enemy.position.y > GAME_H / 2) {
          enemy.direction.y *= -1;
          enemy.position.y = GAME_H / 2;
        }
      }
    });

    Object.keys(this.bullets).forEach((bulletId) => {
      if (server) {
        if (this.bullets[bulletId].destroy) {
          this.deletedBullets.push(bulletId);
          delete this.bullets[bulletId];
        }
      }
    });

    Object.keys(this.enemies).forEach((enemyId) => {
      if (server) {
        if (this.enemies[enemyId].destroy) {
          delete this.enemies[enemyId];
        }
      }
    });

    if (server) {
      // spawn enemy
      if (
        Object.keys(this.enemies).length < 10 &&
        (!this.lastEnemySpawn ||
          now - this.lastEnemySpawn > ENEMY_SPAWN_COOLDOWN)
      ) {
        const enemy = new Enemy(
          randomId(),
          new Vector2(
            randomInt(-GAME_W / 2, GAME_W / 2),
            randomInt(-GAME_H / 2, GAME_H / 2)
          ),
          new Vector2(random(-1, 1), random(-1, 1)).normalize()
        );
        this.enemies[enemy.id] = enemy;
        this.lastEnemySpawn = now;
      }
    }
  }

  snapshot(): IGameState {
    return {
      players: this.players,
      bullets: this.bullets,
      enemies: this.enemies,
      lastProcessedCommand: this.lastProcessedCommand,
      deletedBullets: this.deletedBullets,
    };
  }

  addPlayer(socketId: string) {
    const player = new Player(socketId);

    player.color =
      PLAYER_COLORS[Object.keys(this.players).length % PLAYER_COLORS.length];

    this.players[socketId] = player;
    this.commands[socketId] = [];
    this.lastProcessedCommand[socketId] = -1;

    console.log("adding player", socketId, Object.keys(this.players).length);
  }

  removePlayer(socketId: string) {
    delete this.players[socketId];
    delete this.commands[socketId];
    delete this.lastProcessedCommand[socketId];

    console.log("removing player", socketId, Object.keys(this.players).length);
  }

  addBullet(socketId: string, command: ICommand<IShootCommandPayload>) {
    const { position, direction, id } = command.payload;

    const bullet = new Bullet(
      id,
      socketId,
      new Vector2(position.x, position.y),
      new Vector2(direction.x, direction.y)
    );

    this.bullets[bullet.id] = bullet;
  }

  addCommand(socketId: string, command: ICommand<CommandPayload>) {
    if (!this.commands[socketId]) {
      this.commands[socketId] = [];
    }
    this.commands[socketId].push(command);
  }

  applyCommand(socketId: string, command: ICommand<CommandPayload>) {
    switch (command.type) {
      case CommandType.Move:
        {
          const p = this.players[socketId];
          const payload = command.payload as IMoveCommandPayload;
          if (p) {
            p.position.add(payload.velocity);
          }
        }
        break;
      case CommandType.Shoot:
        {
          const payload = command.payload as IShootCommandPayload;
          const bullet = new Bullet(
            payload.id,
            socketId,
            new Vector2(payload.position.x, payload.position.y),
            new Vector2(payload.direction.x, payload.direction.y)
          );
          this.bullets[bullet.id] = bullet;
        }
        break;
    }
  }
}

export class Body {
  position: IVector2 = {
    x: 0,
    y: 0,
  };
  size: IVector2 = {
    x: 0,
    y: 0,
  };
  constructor(x: number, y: number, w: number, h: number) {
    this.position.x = x;
    this.position.y = y;
    this.size.x = w;
    this.size.y = h;
  }
  get t(): number {
    return this.position.y - this.size.y / 2;
  }
  get l(): number {
    return this.position.x - this.size.x / 2;
  }
  get b(): number {
    return this.position.y + this.size.y / 2;
  }
  get r(): number {
    return this.position.x + this.size.x / 2;
  }
}

class Player extends Body implements IPlayerState {
  socketId: string;
  position: Vector2;
  score: number = 0;
  color: string;

  constructor(socketId: string, position: Vector2 = new Vector2()) {
    super(position.x, position.y, 32, 32);

    this.socketId = socketId;
    this.position = position;
  }

  static fromSnapshot(p: IPlayerState): Player {
    const player = new Player(
      p.socketId,
      new Vector2(p.position.x, p.position.y)
    );
    player.score = p.score;
    player.color = p.color;
    return player;
  }
}

class Bullet extends Body implements IBulletState {
  id: string;
  owner: string;
  position: Vector2;
  direction: Vector2;

  destroy: boolean = false;

  constructor(
    id: string,
    socketId: string,
    position: Vector2,
    direction: Vector2
  ) {
    super(position.x, position.y, 6, 6);

    this.id = id;
    this.owner = socketId;
    this.position = position;
    this.direction = direction;
  }

  static fromSnapshot(snapshot: IBulletState): Bullet {
    return new Bullet(
      snapshot.id,
      snapshot.owner,
      new Vector2(snapshot.position.x, snapshot.position.y),
      new Vector2(snapshot.direction.x, snapshot.direction.y)
    );
  }
}

class Enemy extends Body implements IEnemyState {
  id: string;
  position: Vector2;
  direction: Vector2;

  destroy: boolean = false;

  constructor(id: string, position: Vector2, direction: Vector2) {
    super(position.x, position.y, 40, 40);

    this.id = id;
    this.position = position;
    this.direction = direction;
  }

  static fromSnapshot(snapshot: IEnemyState): Enemy {
    return new Enemy(
      snapshot.id,
      new Vector2(snapshot.position.x, snapshot.position.y),
      new Vector2(snapshot.direction.x, snapshot.direction.y)
    );
  }
}
