// app.js
const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Node 22+ compatible fetch import
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// AWS SNS setup
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// SNS helper function
async function sendSnsMessage(topicArn, message, subject = 'Notification') {
  try {
    const command = new PublishCommand({
      TopicArn: topicArn,
      Message: message,
      Subject: subject
    });
    const response = await snsClient.send(command);
    console.log('SNS message sent:', response.MessageId);
  } catch (err) {
    console.error('Error sending SNS message:', err);
  }
}

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Proxy endpoint to Mule API + SNS notification
app.post("/api/table", async (req, res) => {
  const { number } = req.body;

  if (!number) {
    return res.status(400).json({ error: "Number is required" });
  }

  try {
    // Call Mule API
    const muleResponse = await fetch("https://maths-table-jik9pb.5sc6y6-3.usa-e2.cloudhub.io/api/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number })
    });
    const data = await muleResponse.json();

    // Send SNS notification
    const topicArn = process.env.SNS_TOPIC_ARN; // Set your topic ARN as env var
    if (topicArn) {
      const message = `Table requested for number: ${number}\nResponse: ${JSON.stringify(data)}`;
      await sendSnsMessage(topicArn, message, 'Maths Table Request');
    }

    res.json(data); // Forward Mule response to frontend
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reach Mule API" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
