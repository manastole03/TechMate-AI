/**
 * Llama Chat — OpenRouter proxy + minimal web UI
 * Works with any OpenRouter model, defaulting to Llama 3.3 70B Instruct (free tier).
 *
 * .env:
 *   OPENROUTER_API_KEY=your_key_here
 *   OPENROUTER_REFERER=https://your-site-or-localhost  (optional but recommended)
 *   OPENROUTER_TITLE=Your App Name                      (optional)
 *   OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
 *   PORT=3000
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";


const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
const OPENROUTER_REFERER =
  process.env.OPENROUTER_REFERER || "http://localhost:" + PORT;
const OPENROUTER_TITLE = process.env.OPENROUTER_TITLE || "Llama Chat (Local)";

if (!OPENROUTER_API_KEY) {
  console.error("❌ Missing OPENROUTER_API_KEY in .env");
  process.exit(1);

}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    provider: OPENROUTER_BASE,
    model: OPENROUTER_MODEL,
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const {
      messages = [],
      temperature = 0.3,
      max_tokens = 1024,
      model = OPENROUTER_MODEL,
      stream = false,
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] required" });
    }

    const upstream = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": OPENROUTER_REFERER,
        "X-Title": OPENROUTER_TITLE,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        stream,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return res
        .status(upstream.status)
        .json({ error: "Upstream error", detail });
    }

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Pipe the stream directly to the client
      // Node 18+ fetch returns a Web ReadableStream, but Express res is a Node Writable.
      // We can use a simple reader loop or convert it.
      // For simplicity in Node 18+, we can iterate the body.
      if (upstream.body && upstream.body.getReader) {
        // Web Streams API (Node 18+ native fetch)
        const reader = upstream.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } else if (upstream.body && typeof upstream.body.pipe === 'function') {
        // Node-fetch style (if using node-fetch polyfill)
        upstream.body.pipe(res);
      } else {
        // Fallback for Node 18+ if body is an async iterator
        for await (const chunk of upstream.body) {
          res.write(Buffer.from(chunk));
        }
        res.end();
      }
      return;
    }

    const data = await upstream.json();
    // OpenAI-compatible shape
    const content = data.choices?.[0]?.message?.content ?? "";
    const usage = data.usage ?? null;

    res.json({ content, usage });
  } catch (e) {
    console.error("Proxy failed:", e);
    if (!res.headersSent) {
      res.status(500).json({ error: "Proxy failed", detail: String(e) });
    }
  }
});

// --- Collaborative rooms ---
// Each room shares the same AI chat; server receives user messages and
// responds with AI, broadcasting both to room participants.
io.on("connection", (socket) => {
  const { userId = `user-${Math.random().toString(36).slice(2, 8)}`, name = "Guest" } = socket.handshake.query || {};

  socket.on("join_room", ({ roomId }) => {
    if (!roomId) return;
    socket.join(roomId);
    io.to(roomId).emit("presence", { type: "join", user: { id: userId, name } });
  });

  socket.on("leave_room", ({ roomId }) => {
    if (!roomId) return;
    socket.leave(roomId);
    io.to(roomId).emit("presence", { type: "leave", user: { id: userId, name } });
  });

  socket.on("user_message", async ({ roomId, content, history = [], model = OPENROUTER_MODEL }) => {
    if (!roomId || !content) return;
    // broadcast user message immediately
    io.to(roomId).emit("message", { role: "user", content, userId });
    try {
      const upstream = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": OPENROUTER_REFERER,
          "X-Title": OPENROUTER_TITLE,
        },
        body: JSON.stringify({ model, messages: history.concat([{ role: "user", content }]), temperature: 0.3, max_tokens: 1024, stream: false }),
      });
      const data = await upstream.json();
      const reply = data.choices?.[0]?.message?.content ?? "";
      io.to(roomId).emit("message", { role: "assistant", content: reply });
    } catch (e) {
      io.to(roomId).emit("message", { role: "assistant", content: `Error: ${String(e)}` });
    }
  });

  socket.on("disconnect", () => {
    // presence events handled on leave_room; optionally emit disconnect
  });
});

/** Minimal UI */
app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Llama Chat — OpenRouter</title>
  <style>
    :root{--bg:#0b1020;--card:#121835;--text:#e6e9f2;--muted:#9aa3b2;--accent:#7c9cff}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,Segoe UI,Roboto}
    .app{max-width:900px;margin:40px auto;padding:0 16px}
    .card{background:linear-gradient(180deg,var(--card),#0f1530);border:1px solid #20284e;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.35)}
    header{display:flex;gap:12px;align-items:center;padding:18px 20px;border-bottom:1px solid #1c2347}
    .dot{width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 12px var(--accent)}
    h1{font-size:18px;margin:0}
    #chat{height:60vh;overflow:auto;padding:20px;display:flex;flex-direction:column;gap:14px}
    .msg{padding:12px 14px;border-radius:14px;max-width:80%;white-space:pre-wrap}
    .me{align-self:flex-end;background:#1b2352}
    .bot{align-self:flex-start;background:#0e1330}
    .muted{color:var(--muted);font-size:13px}
    form{display:flex;gap:10px;padding:14px;border-top:1px solid #1c2347}
    textarea{flex:1;background:#0b1020;color:var(--text);border:1px solid #293163;border-radius:12px;padding:12px;min-height:52px;max-height:180px;resize:vertical}
    button{background:var(--accent);color:#0b1020;border:0;border-radius:12px;padding:12px 16px;font-weight:600;cursor:pointer}
    button:disabled{opacity:.6;cursor:not-allowed}
    .row{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:0 4px 10px}
    .pill{font-size:12px;padding:6px 10px;border:1px solid #263063;border-radius:999px}
  </style>
</head>
<body>
  <div class="app">
    <div class="card">
      <header>
        <div class="dot"></div>
        <div>
          <h1>Llama Chat — OpenRouter</h1>
          <div class="muted" id="meta">Checking…</div>
        </div>
      </header>
      <div id="chat"></div>
      <form id="composer">
        <textarea id="input" placeholder="Ask me anything…"></textarea>
        <button id="send">Send</button>
      </form>
    </div>
    <div class="row">
      <div class="pill">Model: <span id="model-pill"></span></div>
      <div class="pill">Provider: <span id="provider-pill"></span></div>
    </div>
  </div>

<script type="module">
const elChat = document.getElementById('chat');
const elForm = document.getElementById('composer');
const elInput = document.getElementById('input');
const elSend = document.getElementById('send');
const elMeta = document.getElementById('meta');
const elModel = document.getElementById('model-pill');
const elProvider = document.getElementById('provider-pill');

let history = [{ role: 'system', content: 'You are a helpful, concise assistant.' }];

async function health() {
  try {
    const r = await fetch('/health');
    const j = await r.json();
    elMeta.textContent = 'Ready';
    elModel.textContent = j.model || 'unknown';
    elProvider.textContent = (j.provider||'').replace(/^https?:\\/\\//,'');
  } catch {
    elMeta.textContent = 'Provider not configured. Set .env and restart server.';
    elModel.textContent = '-';
    elProvider.textContent = '-';
  }
}
health();

function addMessage(role, content) {
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'me' : 'bot');
  div.textContent = content;
  elChat.appendChild(div);
  elChat.scrollTop = elChat.scrollHeight;
}

function thinking() {
  const d = document.createElement('div');
  d.className = 'msg bot muted';
  d.textContent = 'Thinking…';
  elChat.appendChild(d);
  elChat.scrollTop = elChat.scrollHeight;
  return () => d.remove();
}

elForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = elInput.value.trim();
  if (!content) return;

  addMessage('user', content);
  history.push({ role: 'user', content });
  elInput.value = '';
  elSend.disabled = true;
  const stopThinking = thinking();

  try {
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, temperature: 0.3 })
    });
    const j = await r.json();
    stopThinking();
    if (!r.ok) throw new Error(j.detail || j.error || 'Upstream error');
    const reply = (j.content || '').trim();
    history.push({ role: 'assistant', content: reply });
    addMessage('assistant', reply);
  } catch (err) {
    stopThinking();
    addMessage('assistant', '❌ ' + (err.message || String(err)));
  } finally {
    elSend.disabled = false;
    elInput.focus();
  }
});
</script>
</body>
</html>`);
});

// Serve built React app if available
app.use(express.static("client/dist"));
app.get("/app", (_req, res) => {
  res.sendFile(path.resolve("client/dist/index.html"));
});

httpServer.listen(PORT, () => {
  console.log(`\nLlama Chat (OpenRouter) on http://localhost:${PORT}`);
  console.log(`Model: ${OPENROUTER_MODEL}`);
});
