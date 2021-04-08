import { CommandPayload, ICommand } from "..";
import { SERVER_TICK_RATE } from "../constants";
import { GameState } from "../GameState";
import express from "express";
import path from "path";

const app = express();

app.use(express.static(path.resolve(__dirname, "../client/")));

app.use("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/index.html"));
});

const httpServer = require("http").createServer(app);
const options = {
  cors: {
    origin: "*",
  },
};
const io = require("socket.io")(httpServer, options);

const serverState = new GameState();

io.on("connection", (socket) => {
  socket.on("joinGame", () => {
    serverState.addPlayer(socket.id);
    socket.emit("connected", serverState.snapshot());
  });

  socket.on("command", (command: ICommand<CommandPayload>) => {
    serverState.applyCommand(socket.id, command);
  });

  socket.on("disconnect", () => {
    serverState.removePlayer(socket.id);
  });
});

let lastUpdate = Date.now();
const gameLoop = setInterval(function () {
  const now = Date.now();
  const deltaTime = now - lastUpdate;
  lastUpdate = now;

  serverState.update(deltaTime, true);

  const snapshot = serverState.snapshot();

  io.emit("snapshot", snapshot);
}, 1000 / SERVER_TICK_RATE);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`game server is running at http://localhost:${PORT}`);
});
