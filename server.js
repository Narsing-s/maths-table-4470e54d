// server.js
const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Mule endpoint
const MULE_TABLE_URL = process.env.MULE_TABLE_URL || "https://maths-table-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/table";

/* ---------- Diagnostics ---------- */
app.use((req, res, next) => {
  res.setHeader("X-App", "Maths-UI");
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/* ---------- Health ---------- */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", node: process.version, muleTableUrl: MULE_TABLE_URL });
});

/* ---------- UI ---------- */

const UI_HTML = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<title>Maths Table — Android UI</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />

<style>

:root{
--bg:#0b1020;
--bg2:#0e1530;
--card:#121a2f;
--text:#eef3ff;
--accent:#4ae387;
--accent2:#5aa1ff;
--muted:#9aa7cc;
--radius:16px;
}

*{box-sizing:border-box}

body{
margin:0;
color:var(--text);
font-family:system-ui;
background:linear-gradient(270deg,#0b1020,#162a63,#0e1530,#1b2b65);
background-size:600% 600%;
animation:gradientMove 12s ease infinite;
padding:20px 20px 100px;
}

@keyframes gradientMove{
0%{background-position:0% 50%}
50%{background-position:100% 50%}
100%{background-position:0% 50%}
}

.card{
background:var(--card);
border-radius:var(--radius);
padding:20px;
box-shadow:0 20px 40px rgba(0,0,0,.4);
animation:glow 6s infinite alternate;
}

@keyframes glow{
from{box-shadow:0 10px 30px rgba(0,0,0,.4)}
to{box-shadow:0 10px 40px rgba(74,227,135,.3)}
}

.wrap{max-width:900px;margin:auto}

.fields{
display:grid;
grid-template-columns:1fr auto 1fr auto 1fr;
gap:12px;
margin-bottom:15px
}

.field{
background:#1a2342;
padding:12px;
border-radius:12px;
border:1px solid rgba(255,255,255,.1);
}

.value{
font-size:22px;
min-height:26px
}

.symbol{
display:flex;
align-items:center;
justify-content:center;
font-size:26px;
font-weight:bold
}

.result-box{
background:#111a33;
padding:12px;
border-radius:10px;
font-family:monospace;
white-space:pre-wrap;
margin-top:10px;
max-height:300px;
overflow:auto;
}

.keypad{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:10px;
margin-top:20px
}

.key{
height:60px;
background:#1a2342;
border-radius:14px;
display:flex;
align-items:center;
justify-content:center;
font-size:20px;
cursor:pointer;
transition:.15s;
position:relative;
overflow:hidden
}

.key:hover{background:#25305c}

.key:active{transform:scale(.96)}

.btn{
margin-top:10px;
padding:10px 16px;
border-radius:12px;
border:none;
cursor:pointer;
background:linear-gradient(135deg,var(--accent),var(--accent2));
font-weight:bold
}

/* ripple */
.key::after{
content:"";
position:absolute;
width:10px;
height:10px;
background:white;
opacity:.3;
border-radius:50%;
transform:scale(0);
transition:transform .4s,opacity .4s
}

.key:active::after{
transform:scale(15);
opacity:0
}

.neon{
color:#8df7c0;
text-shadow:0 0 8px #4ae387,0 0 14px #4ae387;
}

</style>
</head>

<body>

<div class="wrap">

<div class="card">

<h2>Math Table Generator</h2>

<div class="fields">

<div class="field">
<label>Number</label>
<div id="num" class="value"></div>
</div>

<div class="symbol">×</div>

<div class="field">
<label>Start</label>
<div id="str" class="value"></div>
</div>

<div class="symbol">=</div>

<div class="field">
<label>End</label>
<div id="end" class="value"></div>
</div>

</div>

<button class="btn" id="compute">Compute</button>

<div id="result" class="result-box neon">Result will appear here</div>

<div class="keypad" id="pad">
<div class="key">7</div>
<div class="key">8</div>
<div class="key">9</div>
<div class="key">4</div>
<div class="key">5</div>
<div class="key">6</div>
<div class="key">1</div>
<div class="key">2</div>
<div class="key">3</div>
<div class="key">0</div>
<div class="key">⌫</div>
<div class="key">C</div>
</div>

</div>

</div>

<script>

let active="num"

const clickSound=()=>{
const ctx=new(window.AudioContext||window.webkitAudioContext)()
const osc=ctx.createOscillator()
const gain=ctx.createGain()
osc.connect(gain)
gain.connect(ctx.destination)
osc.frequency.value=220
gain.gain.setValueAtTime(.1,ctx.currentTime)
osc.start()
osc.stop(ctx.currentTime+.05)
}

function setVal(id,v){document.getElementById(id).textContent=v}
function getVal(id){return document.getElementById(id).textContent}

const keys=document.querySelectorAll(".key")

keys.forEach(k=>{

k.onclick=()=>{
clickSound()

let t=k.textContent

if(t==="C"){
setVal("num","")
setVal("str","")
setVal("end","")
return
}

if(t==="⌫"){
let v=getVal(active)
setVal(active,v.slice(0,-1))
return
}

if(/[0-9]/.test(t)){
setVal(active,getVal(active)+t)
}

}

})

document.getElementById("num").onclick=()=>active="num"
document.getElementById("str").onclick=()=>active="str"
document.getElementById("end").onclick=()=>active="end"

async function compute(){

clickSound()

const num=Number(getVal("num"))
const str=Number(getVal("str"))
const end=Number(getVal("end"))

const res=await fetch("/api/table",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({num,str,end})
})

const data=await res.json()

let out=""

if(Array.isArray(data)){

data.forEach(l=>{
out+=l+"\n"
})

}

const box=document.getElementById("result")
box.textContent=""

out.split("\n").forEach(line=>{

const div=document.createElement("div")
div.textContent=line
box.appendChild(div)

box.scrollTop=box.scrollHeight

})

}


document.getElementById("compute").onclick=compute

</script>

</body>
</html>`;

/* ---------- Serve UI ---------- */
app.get("/", (_req, res) => res.type("html").send(UI_HTML));
app.get("/ui", (_req, res) => res.type("html").send(UI_HTML));

/* ---------- Proxy to Mule ---------- */

async function safeParse(resp) {
  const text = await resp.text();
  try {
    return { ok: true, data: JSON.parse(text), raw: text };
  } catch {
    return { ok: false, data: null, raw: text };
  }
}

app.post("/api/table", async (req, res) => {
  try {
    const { num, str, end } = req.body || {};

    if (num === undefined || str === undefined || end === undefined) {
      return res.status(400).json({ error: "Body must include num, str, end" });
    }

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

/* ---------- Catch-all ---------- */
app.get(/^\/(?!api|health).*$/, (_req, res) => res.type("html").send(UI_HTML));

app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.path }));

app.listen(PORT, () => console.log("Maths UI running on port " + PORT));
