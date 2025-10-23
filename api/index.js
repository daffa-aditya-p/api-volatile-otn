// file: server.js
// bisa jalan di node langsung, atau nanti tinggal taruh di /api/index.js buat vercel

const http = require("http");
const url = require("url");

let lastData = {
  moisture1: 0,
  moisture2: 0,
  moisture3: 0,
  pump: 0,
  servo: 0,
  updatedAt: null
};

let command = {
  pump: null,        // 1 = ON, 0 = OFF
  water_pot: null    // 0,1,2
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // === POST /  → ESP32 kirim data sensor ===
  if (req.method === "POST" && pathname === "/") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        lastData = {
          ...data,
          updatedAt: new Date().toISOString()
        };
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
  else if (req.method === "GET" && pathname === "/") {
    // kalau admin kirim query (contoh: ?pump=1&water_pot=2), ubah command
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

    // reset perintah setelah dikirim (biar gak diulang)
    command = { pump: null, water_pot: null };
  }

  // === GET /status  → buat debug di browser ===
  else if (req.method === "GET" && pathname === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(lastData, null, 2));
  }

  // === default 404 ===
  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

// Jalankan server (lokal)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server jalan di http://localhost:${PORT}`);
});
