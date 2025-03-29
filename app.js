const express = require('express');
const bodyParser = require('body-parser');
const { ResponseService } = require('./service/ResponseServices');
const cors = require('cors');

const app = express();
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/test", (req, res) => {
  res.json({ message: 'Success' });
});

// ✅ Facebook Webhook Verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      console.log("❌ Invalid VERIFY_TOKEN");
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// ✅ Webhook POST handler
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    try {
      const responseService = new ResponseService();
      await responseService.handleReceivedMessage(body);
      res.status(200).send("EVENT_RECEIVED");
    } catch (err) {
      console.error("❌ Error in POST /webhook:", err);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(404);
  }
});

app.listen(3000, () => {
  console.log("✅ Server is running on port 3000");
});
