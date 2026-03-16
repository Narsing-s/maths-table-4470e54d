```javascript
const express = require("express")
const path = require("path")

const app = express()

app.use(express.json())

const PORT = process.env.PORT || 3000

const MULE_TABLE_URL =
process.env.MULE_TABLE_URL ||
"https://maths-table-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/table"

/* Serve UI */

app.use(express.static(path.join(__dirname,"public")))

/* Mule API Proxy */

async function safeParse(r){
const t = await r.text()
try{
return JSON.parse(t)
}catch{
return {raw:t}
}
}

app.post("/api/table", async(req,res)=>{

try{

const {num,str,end}=req.body

const r = await fetch(MULE_TABLE_URL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({num,str,end})
})

const data = await safeParse(r)

res.json(data)

}catch(e){

res.status(500).json({error:e.message})

}

})

app.listen(PORT,()=>{
console.log("Server running on port",PORT)
})
```
