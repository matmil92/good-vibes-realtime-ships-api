const WebSocket = require("ws");

const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

// 2. Create a local WebSocket server for Angular to connect
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (wsClient) => {
  console.log('Angular connected to local WS bridge');

  // Optional: send a welcome message
  wsClient.send(JSON.stringify({ msg: 'Connected to local WS bridge' }));
});

ws.on("open", () => {
  console.log("✅ Connected to AISStream");
  ws.send(JSON.stringify({
    Apikey: "c5d0b93872e481128d0f65f9c7c2b47a61e8ff15",
    BoundingBoxes: [[[53.0, 9.5], [66.0, 30.0]]],
    FilterMessageTypes: ["PositionReport", "StaticDataReport"]
  }));
});

ws.on("message", (msg) => {
     wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
  console.log("📡 Got AIS data:", msg.toString());
});

ws.on("error", (err) => console.error("❌ Error:", err));
ws.on("close", () => console.log("❌ Closed"));