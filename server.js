const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* Mule API URL */
const MULE_TABLE_URL =
process.env.MULE_TABLE_URL ||
"https://maths-table-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/table";

/* Serve UI */
app.use(express.static(path.join(__dirname,"public")));

/* Safe JSON parser */
async function safeParse(response){
const text = await response.text();

try{
return JSON.parse(text);
}catch{
return {raw:text};
}

}

/* Proxy API */
app.post("/api/table", async (req,res)=>{

try{

const {num,str,end} = req.body;

const muleRes = await fetch(MULE_TABLE_URL,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({num,str,end})
});

const data = await safeParse(muleRes);

res.json(data);

}catch(error){

res.status(500).json({
error:"Server Error",
message:error.message
});

}

});

/* Start Server */
app.listen(PORT, ()=>{
console.log("Server running on port "+PORT);
});
