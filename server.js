// server.js
const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Mule endpoint for tables (no /api here, per your example)
const MULE_TABLE_URL =
  process.env.MULE_TABLE_URL ||
  "https://maths-table-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/table";

/* ---------- Diagnostics ---------- */
app.use((req, res, next) => {
  res.setHeader("X-App", "Maths-UI");
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/* ---------- Health ---------- */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    node: process.version,
    muleTableUrl: MULE_TABLE_URL
  });
});

/* ---------- Inline UI (Android-like) ---------- */
const UI_HTML = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <title>Maths Table — Android-like UI</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root{
      --bg:#0b1020; --bg2:#0e1530; --card:#121a2f; --text:#eef3ff; --muted:#9aa7cc;
      --accent:#4ae387; --accent2:#5aa1ff; --danger:#ff7a7a;
      --shadow:0 20px 40px rgba(0,0,0,.45); --ring:0 0 0 3px rgba(74,227,135,.22);
      --mono: ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      --radius:16px; --radius-sm:12px; --nav-h:72px;
    }
    [data-theme="light"]{
      --bg:#eaf0ff; --bg2:#f7f9ff; --card:#fff; --text:#0e1440; --muted:#5a648a;
      --accent:#1fb170; --accent2:#2a62ff; --danger:#d93025;
      --shadow:0 16px 32px rgba(0,0,0,.08); --ring:0 0 0 3px rgba(42,98,255,.18);
    }

    *{box-sizing:border-box}
    html,body{height:100%}
    body{
      margin:0; color:var(--text);
      background:
        radial-gradient(1100px 600px at -10% -30%, #1b2b65 0%, transparent 55%),
        radial-gradient(800px 500px at 110% -10%, #142b52 0%, transparent 55%),
        linear-gradient(180deg, var(--bg) 0%, var(--bg2) 100%);
      font:16px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Noto Sans";
      -webkit-font-smoothing: antialiased;
      padding:16px 16px calc(var(--nav-h) + 24px);
    }

    .appbar{
      display:flex; align-items:center; justify-content:space-between; gap:12px;
      margin:0 auto 16px; max-width:980px;
    }
    .brand{display:flex; align-items:center; gap:12px}
    .logo{width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg, var(--accent), var(--accent2)); box-shadow:0 6px 16px rgba(0,0,0,.25)}
    .brand h1{margin:0; font-size:18px}
    .brand small{color:var(--muted)}

    .theme-toggle{display:inline-flex; align-items:center; gap:10px; padding:8px 12px; border-radius:999px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); cursor:pointer}
    .theme-toggle input{display:none}
    .knob{width:44px; height:24px; border-radius:999px; background:#172048; border:1px solid rgba(255,255,255,.16); position:relative}
    .knob::after{content:""; position:absolute; top:50%; left:3px; transform:translateY(-50%); width:18px; height:18px; border-radius:50%; background:var(--accent); transition:left .22s ease; box-shadow:0 2px 10px rgba(0,0,0,.25)}
    input:checked + .knob::after{left:23px}

    .wrap{max-width:980px; margin:0 auto; display:grid; gap:16px}
    .card{background:var(--card); border:1px solid rgba(255,255,255,.08); border-radius:var(--radius); box-shadow:var(--shadow); padding:16px}

    .screen{display:none}
    .screen.active{display:block}

    .panel{display:grid; grid-template-columns:1.2fr .8fr; gap:16px}
    @media (max-width:860px){.panel{grid-template-columns:1fr}}

    .fields{display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px}
    .field{display:flex; flex-direction:column; gap:6px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.1); border-radius:var(--radius-sm); padding:10px 12px; cursor:text}
    .field.active{outline:var(--ring); border-color:transparent}
    .field label{font-size:12px; color:var(--muted)}
    .value{font-size:20px; min-height:26px; letter-spacing:.2px}

    .chips{display:flex; flex-wrap:wrap; gap:8px; margin:10px 0 12px}
    .chip{padding:8px 12px; border-radius:999px; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.06); color:var(--text); cursor:pointer; user-select:none}
    .chip:hover{background:rgba(255,255,255,.12)}
    .chip.active{background:linear-gradient(135deg, var(--accent), var(--accent2)); border:none; color:#071225}

    .request-box, .result-box{
      border:1px dashed rgba(255,255,255,.16); background:rgba(255,255,255,.04);
      border-radius:var(--radius-sm); padding:12px; font-family:var(--mono); white-space:pre-wrap; word-break:break-word
    }
    .result-box.error{color:var(--danger); border-color:rgba(255,0,0,.25); background:rgba(255,0,0,.06)}

    .actions{display:flex; gap:8px; flex-wrap:wrap; margin-top:10px}
    .btn{padding:10px 14px; border-radius:12px; border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.06); color:var(--text); cursor:pointer}
    .btn.primary{background:linear-gradient(135deg, var(--accent), var(--accent2)); border:none; color:#081226}
    .btn.ghost{background:transparent}

    .keypad{display:grid; gap:10px; grid-template-columns:repeat(3, minmax(0, 1fr)); grid-auto-rows:56px; user-select:none}
    .key{display:grid; place-items:center; border-radius:14px; font-weight:700; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); cursor:pointer}
    .key:hover{background:rgba(255,255,255,.12)}
    .key:active{transform:translateY(1px)}
    .key.accent{background:linear-gradient(135deg, var(--accent), var(--accent2)); border:none; color:#061127}
    .key.wide{grid-column:span 2}
    .muted{color:var(--muted)}

    .foot{display:flex; align-items:center; justify-content:space-between; margin-top:10px; color:var(--muted); font-size:13px}

    /* History */
    .history-list{display:grid; gap:10px}
    .history-item{display:flex; align-items:center; justify-content:space-between; gap:10px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:10px 12px; font-family:var(--mono)}
    .history-item button{padding:6px 10px; border-radius:10px; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.06); color:var(--text); cursor:pointer}
    .history-empty{color:var(--muted)}

    /* Settings */
    .form-row{display:grid; gap:8px; margin-bottom:12px}
    .input{width:100%; padding:12px 14px; border-radius:10px; color:var(--text); background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.18); outline:none}

    /* Bottom watermark */
    .watermark{
      position:fixed; left:50%; transform:translateX(-50%);
      bottom: calc(var(--nav-h, 72px) + 8px);
      font-size:12px; color:var(--muted); opacity:.85; letter-spacing:.3px; z-index:11;
      text-decoration:none
    }
    .watermark:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div class="appbar">
    <div class="brand">
      <div class="logo"></div>
      <div>
        <h1>Maths Table</h1>
        <small>Android-like • Fast • Clean</small>
      </div>
    </div>
    <label class="theme-toggle" title="Toggle theme">
      <span>Theme</span>
      <input id="theme" type="checkbox" />
      <span class="knob"></span>
    </label>
  </div>

  <div class="wrap">
    <!-- Screen: Table -->
    <div id="screen-table" class="screen active">
      <div class="panel card">
        <!-- Left: Inputs & Result -->
        <div>
          <div class="fields">
            <div id="f-num" class="field active" data-target="num">
              <label>Number (num)</label>
              <div id="num" class="value" contenteditable="false"></div>
            </div>
            <div id="f-str" class="field" data-target="str">
              <label>Start (str)</label>
              <div id="str" class="value" contenteditable="false"></div>
            </div>
            <div id="f-end" class="field" data-target="end">
              <label>End (end)</label>
              <div id="end" class="value" contenteditable="false"></div>
            </div>
          </div>

          <div class="chips" id="chipRange">
            <div class="chip" data-str="1" data-end="10">1–10</div>
            <div class="chip" data-str="1" data-end="20">1–20</div>
            <div class="chip active" data-str="1" data-end="50">1–50</div>
            <div class="chip" data-str="1" data-end="100">1–100</div>
          </div>

          <div class="request-box" id="reqJson">Request body will appear here.</div>

          <div class="actions">
            <button class="btn primary" id="computeBtn">Compute</button>
            <button class="btn" id="copyBtn">Copy Result</button>
            <button class="btn" id="dlJsonBtn">Download JSON</button>
            <button class="btn" id="dlTxtBtn">Download TXT</button>
            <button class="btn ghost" id="clearBtn">Clear Fields</button>
          </div>

          <div style="height:10px"></div>
          <div class="result-box" id="resultBox">Result will appear here.</div>

          <div class="foot">
            <div>Base: <code id="baseVal">/api</code></div>
            <div>© <span id="year"></span></div>
          </div>
        </div>

        <!-- Right: Keypad -->
        <div class="card">
          <div style="margin-bottom:8px; color:var(--muted); font-size:13px">Tap a field, then use keypad:</div>
          <div class="keypad" id="pad">
            <div class="key">7</div><div class="key">8</div><div class="key">9</div>
            <div class="key">4</div><div class="key">5</div><div class="key">6</div>
            <div class="key">1</div><div class="key">2</div><div class="key">3</div>
            <div class="key">0</div><div class="key">.</div><div class="key muted" data-act="back">⌫</div>
            <div class="key muted wide" data-act="clear">Clear</div>
            <div class="key accent wide" data-act="compute">Compute</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Screen: History -->
    <div id="screen-history" class="screen">
      <div class="card">
        <h3 style="margin:8px 0 12px">History</h3>
        <div class="history-list" id="historyList"></div>
        <div class="history-empty" id="historyEmpty" style="display:none">No history yet.</div>
      </div>
    </div>

    <!-- Screen: Settings -->
    <div id="screen-settings" class="screen">
      <div class="card">
        <h3 style="margin:8px 0 12px">Settings</h3>
        <div class="form-row">
          <label for="baseInput">Proxy Base (usually <code>/api</code>)</label>
          <input id="baseInput" class="input" type="text" placeholder="/api" />
        </div>
        <div class="form-row">
          <label for="muleInput">Mule Table URL (server forwards here)</label>
          <input id="muleInput" class="input" type="text" />
        </div>
        <div class="actions">
          <button class="btn primary" id="saveSettings">Save Settings</button>
          <button class="btn" id="resetSettings">Reset Defaults</button>
          <button class="btn" id="clearHistory">Clear History</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom watermark -->
  <a class="watermark" href="https://github.com/Narsing-s" target="_blank" rel="noopener" aria-label="Created by Narsing-s">#CreatedByNarsing-s</a>

  <!-- Bottom nav -->
  <nav class="bottom-nav" style="position:fixed; left:0; right:0; bottom:0; height:var(--nav-h); background:rgba(10,14,30,.85); border-top:1px solid rgba(255,255,255,.08); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:space-around">
    <a href="#" data-screen="table" class="nav-item" style="text-decoration:none; color:var(--text)">
      <div style="text-align:center">
        <div style="font-size:20px">🧮</div>
        <div style="font-size:12px">Table</div>
      </div>
    </a>
    <a href="#" data-screen="history" class="nav-item" style="text-decoration:none; color:var(--muted)">
      <div style="text-align:center">
        <div style="font-size:20px">🕘</div>
        <div style="font-size:12px">History</div>
      </div>
    </a>
    <a href="#" data-screen="settings" class="nav-item" style="text-decoration:none; color:var(--muted)">
      <div style="text-align:center">
        <div style="font-size:20px">⚙️</div>
        <div style="font-size:12px">Settings</div>
      </div>
    </a>
  </nav>

  <script>
    const $ = (id) => document.getElementById(id);
    $("year").textContent = new Date().getFullYear();

    /* Theme */
    const THEME_KEY = "maths-ui-theme";
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
    $("theme").checked = (document.documentElement.getAttribute("data-theme") === "light");
    $("theme").addEventListener("change", () => {
      const mode = $("theme").checked ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", mode);
      localStorage.setItem(THEME_KEY, mode);
    });

    /* Settings */
    const BASE_KEY = "maths-ui-base";
    const MULE_KEY = "maths-ui-mule";
    const HIST_KEY = "maths-ui-history";

    function normBase(b){ b=(b||"").trim().replace(/\\s+/g,""); b=b.replace(/\\/+$/,""); return b || "/api"; }

    let base = normBase(localStorage.getItem(BASE_KEY) || "/api");
    $("baseVal").textContent = base;
    $("baseInput").value = base;

    // The visible Mule URL in settings is just for your reference; server uses env var.
    $("muleInput").value = "${MULE_TABLE_URL}";

    $("saveSettings").onclick = () => {
      base = normBase($("baseInput").value);
      localStorage.setItem(BASE_KEY, base);
      $("baseVal").textContent = base;
      alert("Settings saved");
      buildRequest();
    };
    $("resetSettings").onclick = () => {
      base = "/api";
      localStorage.setItem(BASE_KEY, base);
      $("baseInput").value = base;
      $("baseVal").textContent = base;
      alert("Settings reset");
      buildRequest();
    };

    /* Screen Navigation */
    function setScreen(name){
      ["table","history","settings"].forEach(s => {
        $("screen-"+s)?.classList.toggle("active", s === name);
      });
      document.querySelectorAll(".nav-item").forEach(a => {
        const s = a.getAttribute("data-screen") || a.href.split("#").pop();
        a.style.color = (s===name) ? "var(--text)" : "var(--muted)";
      });
      if (name === "history") renderHistory();
    }
    document.querySelectorAll(".nav-item").forEach(a => a.addEventListener("click", e => {
      e.preventDefault();
      setScreen(a.getAttribute("data-screen"));
    }));

    /* Field focus */
    let active = "num";
    function setActive(id){
      active = id;
      ["num","str","end"].forEach(f => $("f-"+f).classList.toggle("active", f===id));
    }
    $("f-num").addEventListener("click", ()=>setActive("num"));
    $("f-str").addEventListener("click", ()=>setActive("str"));
    $("f-end").addEventListener("click", ()=>setActive("end"));

    /* Range chips */
    document.querySelectorAll("#chipRange .chip").forEach(c => c.addEventListener("click", () => {
      document.querySelectorAll("#chipRange .chip").forEach(e => e.classList.remove("active"));
      c.classList.add("active");
      $("str").textContent = c.getAttribute("data-str");
      $("end").textContent = c.getAttribute("data-end");
      buildRequest();
    }));

    /* Keypad */
    $("pad").addEventListener("click", (e)=>{
      const key = e.target.closest(".key");
      if (!key) return;
      const act = key.getAttribute("data-act");
      const label = key.textContent.trim();
      if (act === "back") backspace();
      else if (act === "clear") clearActive();
      else if (act === "compute") compute();
      else if (/^[0-9.]$/.test(label)) append(label);
    });

    function getVal(id){ return $(id).textContent.trim(); }
    function setVal(id,v){ $(id).textContent = v; }

    function append(ch){
      const cur = getVal(active);
      if (active !== "num" && ch === "." ) return; // str/end are integers
      if (ch === "." && cur.includes(".")) return;
      setVal(active, cur + ch);
      buildRequest();
    }
    function backspace(){
      const cur = getVal(active);
      setVal(active, cur.slice(0,-1));
      buildRequest();
    }
    function clearActive(){
      setVal(active, "");
      buildRequest();
    }

    $("clearBtn").onclick = () => {
      setVal("num","");
      setVal("str","");
      setVal("end","");
      buildRequest();
    };

    /* Build request JSON preview */
    function buildRequest(){
      const body = { num: getVal("num"), str: getVal("str"), end: getVal("end") };
      const pretty = JSON.stringify(body, null, 2);
      $("reqJson").textContent = pretty;
      return body;
    }
    // default range 1–50
    if (!$("str").textContent && !$("end").textContent){
      $("str").textContent = "1";
      $("end").textContent = "50";
    }
    buildRequest();

    /* Compute */
    $("computeBtn").onclick = compute;

    async function compute(){
      try{
        const body = buildRequest();

        // validate client-side
        const N = Number(body.num), S = Number(body.str), E = Number(body.end);
        if ([body.num, body.str, body.end].some(v => v==="" || v==null)) {
          return showError("Please fill Number, Start and End.");
        }
        if ([N,S,E].some(v => Number.isNaN(v) || !Number.isFinite(v))){
          return showError("num, str, end must be valid numbers.");
        }
        if (!Number.isInteger(S) || !Number.isInteger(E)) {
          return showError("str and end should be integers.");
        }
        if (S > E) {
          return showError("Start must be <= End.");
        }

        const res = await fetch(base + "/table", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ num: N, str: S, end: E })
        });
        const text = await res.text();

        let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }

        if (!res.ok) {
          const msg = (data && (data.message || data.error || data.details)) || \`HTTP \${res.status}\`;
          return showError(msg);
        }

        // data is expected to be an array of strings like ["4 x 1 = 4", ...]
        showResult(data);
        pushHistory({ ts: new Date().toLocaleString(), num: N, str: S, end: E, result: data });

      } catch (e) {
        showError(e.message || "Unexpected error");
      }
    }

    /* Render result + actions */
    function showResult(data){
      const box = $("resultBox");
      box.className = "result-box";
      if (Array.isArray(data)) {
        box.textContent = data.join("\\n");
        $("copyBtn").onclick = () => copyText(data.join("\\n"));
        $("dlJsonBtn").onclick = () => downloadFile("table.json", JSON.stringify(data, null, 2), "application/json");
        $("dlTxtBtn").onclick = () => downloadFile("table.txt", data.join("\\n"), "text/plain");
      } else {
        box.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
      }
    }
    function showError(msg){
      const box = $("resultBox");
      box.className = "result-box error";
      box.textContent = msg;
    }
    function copyText(t){
      navigator.clipboard?.writeText(t).then(()=>alert("Copied!")).catch(()=>alert("Copy failed."));
    }
    function downloadFile(name, content, type){
      const blob = new Blob([content], { type }); const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
    }

    /* History */
    function pushHistory(item){
      try {
        const arr = JSON.parse(localStorage.getItem(HIST_KEY) || "[]");
        arr.unshift(item);
        localStorage.setItem(HIST_KEY, JSON.stringify(arr.slice(0,50)));
      } catch {}
    }
    function renderHistory(){
      const list = $("historyList"), empty = $("historyEmpty");
      list.innerHTML = "";
      let arr = [];
      try { arr = JSON.parse(localStorage.getItem(HIST_KEY) || "[]"); } catch {}
      if (!arr.length){ empty.style.display="block"; return; }
      empty.style.display = "none";
      arr.forEach((h, idx)=>{
        const row = document.createElement("div");
        row.className = "history-item";
        row.innerHTML = \`
          <div>\${h.ts} • num=\${h.num}, str=\${h.str}, end=\${h.end}</div>
          <div>
            <button data-act="rerun" data-idx="\${idx}">Re-run</button>
          </div>\`;
        row.querySelector("[data-act='rerun']").onclick = ()=>{
          setVal("num", String(h.num)); setVal("str", String(h.str)); setVal("end", String(h.end));
          setScreen("table"); buildRequest(); compute();
        };
        list.appendChild(row);
      });
    }

    // Default to TABLE screen
    setScreen("table");
  </script>
</body>
</html>`;

/* ---------- Serve UI ---------- */
app.get("/", (_req, res) => res.type("html").send(UI_HTML));
app.get("/ui", (_req, res) => res.type("html").send(UI_HTML));

/* ---------- Proxy to Mule: POST /api/table ---------- */
async function safeParse(resp) {
  const text = await resp.text();
  try { return { ok: true, data: JSON.parse(text), raw: text }; }
  catch { return { ok: false, data: null, raw: text }; }
}

app.post("/api/table", async (req, res) => {
  try {
    const { num, str, end } = req.body || {};
    if (num === undefined || str === undefined || end === undefined) {
      return res.status(400).json({ error: "Body must include num, str, end" });
    }

    // Forward to Mule
    const upstream = await fetch(MULE_TABLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ num, str, end })
    });
    const parsed = await safeParse(upstream);

    if (!upstream.ok) {
      return res.status(upstream.status).json(parsed.ok ? parsed.data : { rawResponse: parsed.raw });
    }
    return res.json(parsed.ok ? parsed.data : { raw: parsed.raw });
  } catch (e) {
    res.status(500).json({ error: "Proxy error", details: e.message });
  }
});

/* ---------- Catch-all to UI (non-API) ---------- */
app.get(/^\/(?!api|health).*$/, (_req, res) => res.type("html").send(UI_HTML));

/* ---------- 404 (should rarely hit) ---------- */
app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.path }));

app.listen(PORT, () => console.log("Maths UI running on port " + PORT));
