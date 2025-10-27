// ---------- PUBG Report Bot (for LINE) ----------
const express = require("express");
const app = express();
app.use(express.json());
const axios = require("axios");

const LINE_ACCESS_TOKEN = "ここにあなたのチャネルアクセストークンを貼る";

app.post("/callback", async (req, res) => {
  const events = req.body.events || [];
  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const replyMessage = {
        replyToken: event.replyToken,
        messages: [
          { type: "text", text: `📊 PUBGレポートBot起動中！受信内容：${event.message.text}` },
        ],
      };
      await axios.post("https://api.line.me/v2/bot/message/reply", replyMessage, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
        },
      });
    }
  }
  res.status(200).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ PUBG Bot server running on ${PORT}`));
