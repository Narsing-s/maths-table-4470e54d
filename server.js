```javascript
// server.js

const express = require("express")

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000

const MULE_TABLE_URL =
process.env.MULE_TABLE_URL ||
"https://maths-table-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/table"

/* ---------------- LOGS ---------------- */

app.use((req,res,next)=>{
console.log(new Date().toISOString(),req.method,req.url)
next()
})

/* ---------------- HEALTH ---------------- */

app.get("/health",(req,res)=>{
res.json({status:"ok"})
})

/* ---------------- UI ---------------- */

const UI = `

<!DOCTYPE html>
<html lang="en" data-theme="dark">

<head>

<meta charset="UTF-8">
<title>Ultimate Maths Table App</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>

:root{
--bg:#0b1020;
--card:#121a2f;
--text:#fff;
--accent:#4ae387;
--accent2:#5aa1ff;
}

[data-theme="light"]{
--bg:#f3f6ff;
--card:#ffffff;
--text:#111;
--accent:#2563eb;
--accent2:#7c3aed;
}

[data-theme="neon"]{
--bg:#020617;
--card:#050a20;
--text:#00f7ff;
--accent:#00f7ff;
--accent2:#ff00ff;
}

[data-theme="ocean"]{
--bg:#021526;
--card:#033a5f;
--text:#bdf2ff;
--accent:#00c6ff;
--accent2:#0072ff;
}

[data-theme="sunset"]{
--bg:#2b0a0a;
--card:#441111;
--text:#ffd2b3;
--accent:#ff7e5f;
--accent2:#feb47b;
}

body{
margin:0;
background:var(--bg);
color:var(--text);
font-family:system-ui;
padding:20px;
}

.card{
background:var(--card);
max-width:600px;
margin:auto;
padding:20px;
border-radius:18px;
box-shadow:0 20px 40px rgba(0,0,0,.4);
}

.btn{
padding:10px 16px;
border:none;
border-radius:12px;
cursor:pointer;
margin:4px;
background:linear-gradient(135deg,var(--accent),var(--accent2));
}

.keypad{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:10px;
margin-top:20px;
}

.key{
background:rgba(255,255,255,.1);
padding:20px;
border-radius:14px;
text-align:center;
font-size:20px;
cursor:pointer;
}

.result{
margin-top:20px;
white-space:pre-wrap;
font-family:monospace;
background:rgba(255,255,255,.05);
padding:12px;
border-radius:10px;
}

canvas{
margin-top:20px;
}

</style>
</head>

<body>

<div class="card">

<h2>Ultimate Multiplication Table</h2>

<div>Number: <span id="num"></span></div>
<div>Start: <span id="str">1</span></div>
<div>End: <span id="end">10</span></div>

<div>

<button class="btn" id="setNum">Set Number</button>
<button class="btn" id="setStr">Set Start</button>
<button class="btn" id="setEnd">Set End</button>

</div>

<div>

<button class="btn" id="computeBtn">Compute</button>
<button class="btn" id="graphBtn">Graph</button>
<button class="btn" id="quizBtn">Quiz</button>
<button class="btn" id="downloadBtn">Download</button>
<button class="btn" id="historyBtn">History</button>
<button class="btn" id="themeBtn">Theme</button>
<button class="btn" id="clearBtn">Clear</button>

</div>

<div class="result" id="resultBox">
Result will appear here
</div>

<canvas id="chart"></canvas>

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
<div class="key">.</div>
<div class="key">-</div>

</div>

</div>

<script>

const $=id=>document.getElementById(id)

let active="num"
let table=[]

/* SOUND */

let audio

function tap(){

try{

audio=audio||new(window.AudioContext||window.webkitAudioContext)()

const o=audio.createOscillator()
const g=audio.createGain()

o.frequency.value=350

g.gain.setValueAtTime(.001,audio.currentTime)
g.gain.exponentialRampToValueAtTime(.2,audio.currentTime+.01)
g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.08)

o.connect(g)
g.connect(audio.destination)

o.start()
o.stop(audio.currentTime+.08)

}catch(e){}

}

/* SELECT INPUT */

$("setNum").onclick=()=>active="num"
$("setStr").onclick=()=>active="str"
$("setEnd").onclick=()=>active="end"

/* KEYPAD */

$("pad").onclick=e=>{

const k=e.target.closest(".key")
if(!k)return

tap()

$(active).textContent+=k.textContent

}

/* COMPUTE */

$("computeBtn").onclick=async()=>{

tap()

const num=Number($("num").textContent)
const str=Number($("str").textContent)
const end=Number($("end").textContent)

const res=await fetch("/api/table",{

method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({num,str,end})

})

const data=await res.json()

if(Array.isArray(data)){

table=data

$("resultBox").textContent=data.join("\\n").replaceAll(" x "," × ")

localStorage.setItem("lastTable",JSON.stringify(data))

}else{

$("resultBox").textContent=JSON.stringify(data,null,2)

}

}

/* GRAPH */

$("graphBtn").onclick=()=>{

if(!table.length)return

const labels=[]
const vals=[]

table.forEach((l,i)=>{

const v=l.split("=")[1]

labels.push(i+1)
vals.push(Number(v))

})

new Chart($("chart"),{

type:"line",

data:{
labels:labels,
datasets:[{
label:"Table",
data:vals
}]
}

})

}

/* QUIZ */

$("quizBtn").onclick=()=>{

const n=Number($("num").textContent)
const r=Math.floor(Math.random()*10)+1

const ans=prompt(n+" × "+r+" = ?")

if(Number(ans)===n*r)
alert("Correct!")
else
alert("Wrong! Answer: "+(n*r))

}

/* DOWNLOAD */

$("downloadBtn").onclick=()=>{

if(!table.length)return

const blob=new Blob([table.join("\\n")])

const a=document.createElement("a")

a.href=URL.createObjectURL(blob)
a.download="table.txt"
a.click()

}

/* HISTORY */

$("historyBtn").onclick=()=>{

const h=localStorage.getItem("lastTable")

if(!h)alert("No history")
else $("resultBox").textContent=JSON.parse(h).join("\\n")

}

/* CLEAR */

$("clearBtn").onclick=()=>{

tap()

$("num").textContent=""
$("str").textContent="1"
$("end").textContent="10"

$("resultBox").textContent="Result will appear here"

table=[]

}

/* THEMES */

const themes=["dark","light","neon","ocean","sunset"]

let t=0

$("themeBtn").onclick=()=>{

tap()

t=(t+1)%themes.length

document.documentElement.setAttribute("data-theme",themes[t])

}

</script>

</body>
</html>

`

/* ---------------- SERVE UI ---------------- */

app.get("/",(req,res)=>{

res.type("html").send(UI)

})

/* ---------------- MULE PROXY ---------------- */

async function safeParse(r){

const text=await r.text()

try{
return JSON.parse(text)
}catch{
return {raw:text}
}

}

app.post("/api/table",async(req,res)=>{

try{

const {num,str,end}=req.body

const r=await fetch(MULE_TABLE_URL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({num,str,end})
})

const data=await safeParse(r)

res.json(data)

}catch(e){

res.status(500).json({error:e.message})

}

})

/* ---------------- SERVER ---------------- */

app.listen(PORT,()=>{

console.log("Ultimate Maths App running on",PORT)

})
```
