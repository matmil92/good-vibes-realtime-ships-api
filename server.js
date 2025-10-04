const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// === AISStream connection ===
const ais = new WebSocket("wss://stream.aisstream.io/v0/stream");

ais.on("open", () => {
  console.log("✅ Connected to AISStream");
  ais.send(JSON.stringify({
    Apikey: "c5d0b93872e481128d0f65f9c7c2b47a61e8ff15",
    BoundingBoxes: [[[53.0, 9.5], [66.0, 30.0]]],
    FilterMessageTypes: ["PositionReport", "StaticDataReport"]
  }));
});

ais.on("message", (msg) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
});

// === WebSocket for your frontend / colleagues ===
wss.on("connection", (wsClient) => {
  console.log("👥 Client connected");
  wsClient.send(JSON.stringify({ msg: "Connected to AIS bridge" }));
});

// Optional HTTP endpoint (for health checks)
app.get("/", (req, res) => res.send("AIS WebSocket bridge is running ✅"));

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🌐 Listening on port ${PORT}`));
