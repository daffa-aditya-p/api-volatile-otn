// =============================================
// Bisa jalan di Node lokal ATAU di Vercel
// =============================================

const http = require("http");
const url = require("url");

// Data terakhir dari ESP32
let lastData = {
  moisture1: 0,
  moisture2: 0,
  moisture3: 0,
  pump: 0,
  servo: 0,
  updatedAt: null
};

// Perintah ke ESP32
let command = {
  pump: null,        // 1 = ON, 0 = OFF
  water_pot: null    // 0,1,2
};

// Fungsi handler utama (bisa dipakai oleh server http atau Vercel)
function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // === POST /  → ESP32 kirim data sensor ===
  if (req.method === "POST" && (pathname === "/" || pathname === "/api")) {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        lastData = { ...data, updatedAt: new Date().toISOString() };
        console.log("📩 Data diterima dari ESP32:", lastData);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", received: lastData }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  }

  // === GET /  → ESP32 ambil perintah ===
  else if (req.method === "GET" && (pathname === "/" || pathname === "/api")) {
    if (query.pump !== undefined) {
      command.pump = parseInt(query.pump);
      console.log("⚙️  Perintah pump diubah jadi:", command.pump);
    }
    if (query.water_pot !== undefined) {
      command.water_pot = parseInt(query.water_pot);
      console.log("⚙️  Perintah siram pot:", command.water_pot);
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(command));

    // Reset biar gak diulang
    command = { pump: null, water_pot: null };
  }

  // === GET /status  → buat debug di browser ===
  else if (req.method === "GET" && (pathname === "/status" || pathname === "/api/status")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(lastData, null, 2));
  }

  // === default 404 ===
  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
}

// =============================================
// Mode A: dijalankan lokal pakai node server.js
// =============================================
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const server = http.createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`🚀 Server lokal jalan di http://localhost:${PORT}`);
  });
}

// =============================================
// Mode B: dijalankan di Vercel
// =============================================
module.exports = (req, res) => handleRequest(req, res);
