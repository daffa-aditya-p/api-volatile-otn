// api/index.js
import http from "http";
import url from "url";

let lastData = {
  moisture1: 0,
  moisture2: 0,
  moisture3: 0,
  pump: 0,
  servo: 0,
  updatedAt: null
};

let command = {
  pump: null,
  water_pot: null
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  if (req.method === "POST" && pathname === "/") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        lastData = { ...data, updatedAt: new Date().toISOString() };
        console.log("📩 Data diterima:", lastData);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", received: lastData }));
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  } else if (req.method === "GET" && pathname === "/") {
    if (query.pump !== undefined)
      command.pump = parseInt(query.pump);
    if (query.water_pot !== undefined)
      command.water_pot = parseInt(query.water_pot);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(command));
    command = { pump: null, water_pot: null };
  } else if (req.method === "GET" && pathname === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(lastData, null, 2));
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

export default function handler(req, res) {
  server.emit("request", req, res);
}
