// app.js
const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Node 22+ compatible fetch import
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Proxy endpoint to Mule API
app.post("/api/table", async (req, res) => {
  const { number } = req.body;

  if (!number) {
    return res.status(400).json({ error: "Number is required" });
  }

  try {
    // Call Mule API
    const muleResponse = await fetch(
      "https://maths-table-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/api/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number })
      }
    );

    const data = await muleResponse.json();

    // Forward Mule response to frontend
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reach Mule API" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
