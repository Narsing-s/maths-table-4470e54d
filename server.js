const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const MULE_TABLE_URL =
  process.env.MULE_TABLE_URL ||
  "https://maths-table-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/table";

/* ---------- UI HTML ---------- */

const UI = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Multiplication Table</title>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>

body{
font-family:Arial;
background:#0b1020;
color:white;
padding:20px;
}

.card{
background:#121a2f;
padding:20px;
border-radius:15px;
max-width:500px;
margin:auto;
}

button{
padding:10px;
margin:4px;
border:none;
border-radius:8px;
cursor:pointer;
}

.keypad{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:10px;
margin-top:20px;
}

.key{
background:#333;
padding:20px;
text-align:center;
border-radius:10px;
cursor:pointer;
}

.result{
margin-top:20px;
white-space:pre-wrap;
font-family:monospace;
background:#00000040;
padding:10px;
border-radius:8px;
}

</style>

</head>

<body>

<div class="card">

<h2>Multiplication Table</h2>

<div>Number: <span id="num"></span></div>
<div>Start: <span id="str">1</span></div>
<div>End: <span id="end">10</span></div>

<div>

<button onclick="setActive('num')">Set Number</button>
<button onclick="setActive('str')">Set Start</button>
<button onclick="setActive('end')">Set End</button>

</div>

<div>

<button onclick="compute()">Compute</button>
<button onclick="graph()">Graph</button>
<button onclick="clearAll()">Clear</button>

</div>

<div class="result" id="resultBox"></div>

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

const $ = id => document.getElementById(id)

let active = "num"
let table = []

function setActive(v){
active=v
}

document.getElementById("pad").onclick=e=>{
const k=e.target.closest(".key")
if(!k) return
$(active).textContent += k.textContent
}

async function compute(){

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
$("resultBox").textContent=data.join("\\n")
}else{
$("resultBox").textContent=JSON.stringify(data,null,2)
}

}

function graph(){

if(!table.length) return

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
datasets:[{label:"Table",data:vals}]
}
})

}

function clearAll(){

$("num").textContent=""
$("str").textContent="1"
$("end").textContent="10"
$("resultBox").textContent=""
table=[]

}

</script>

</body>
</html>`;

/* ---------- Serve UI ---------- */

app.get("/", (req,res)=>{
res.send(UI)
});

/* ---------- Mule Proxy ---------- */

async function safeParse(r){
const t = await r.text()
try{
return JSON.parse(t)
}catch{
return {raw:t}
}
}

app.post("/api/table", async (req,res)=>{

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

/* ---------- Start Server ---------- */

app.listen(PORT, ()=>{
console.log("Server running on port",PORT)
});
