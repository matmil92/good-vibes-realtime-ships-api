const WebSocket = require("ws");

const AIS_URL = "wss://stream.aisstream.io/v0/stream";
const API_KEY = "c5d0b93872e481128d0f65f9c7c2b47a61e8ff15";
const BOUNDING_BOX = [[[-90, -180], [90, 180]]];
const FILTERS = ["PositionReport", "StaticDataReport"];
const PORT = process.env.PORT || 8080;

// === LOCAL SERVER FOR ANGULAR ===
const wss = new WebSocket.Server({ port: PORT });
wss.on("connection", (wsClient) => {
  console.log("✅ Angular connected to local WS bridge");
  wsClient.send(JSON.stringify({ msg: "Connected to local WS bridge" }));
});

// === AIS CONNECTION WITH RECONNECT ===
let ws;
let reconnectDelay = 2000; // start from 2s
const MAX_DELAY = 60000;   // 1 min max

function connectToAisStream() {
  console.log("🌊 Connecting to AISStream...");
  ws = new WebSocket(AIS_URL);

  ws.on("open", () => {
    console.log("✅ Connected to AISStream");
    reconnectDelay = 2000; // reset delay on success

    // Subscribe
    ws.send(JSON.stringify({
      Apikey: API_KEY,
      BoundingBoxes: BOUNDING_BOX,
      FilterMessageTypes: FILTERS
    }));
  });

  ws.on("message", (msg) => {
    // Broadcast to all local clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
    console.log("📡 Got AIS data");
  });

  ws.on("error", (err) => {
    console.error("❌ AISStream error:", err.message);
  });

  ws.on("close", (code, reason) => {
    console.warn(`⚠️ AISStream closed (${code}) – will reconnect...`);
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  console.log(`⏳ Reconnecting in ${reconnectDelay / 1000}s...`);
  setTimeout(() => {
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_DELAY); // exponential backoff
    connectToAisStream();
  }, reconnectDelay);
}

// Start first connection
connectToAisStream();

console.log(`🚀 Local WS bridge running on port ${PORT}`);
