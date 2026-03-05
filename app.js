const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// basic route
app.get("/", (req, res) => {
  res.send("Hello from Maths Table app!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
