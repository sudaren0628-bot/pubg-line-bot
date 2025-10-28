// ===== PUBG Report Bot (for LINE) =====
const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// 環境変数から読み込み
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

// ===== Webhook受信 =====
app.post("/callback", async (req, res) => {
  try {
    const events = req.body.events || [];
    for (const event of events) {
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text.trim();

        let replyText = "";

        // ===== コマンド判定 =====
        if (userMessage === "戦績") {
          replyText = "📊 戦績データを取得中...";
        } else if (userMessage.startsWith("K/")) {
          // 例: 「K/10」→ 10キルとして投稿
          const kills = userMessage.split("/")[1];
          replyText = `🔥 ${kills}キル！ナイスファイト！`;
        } else if (userMessage === "help") {
          replyText = "📘 コマンド一覧:\n戦績 → 戦績データ取得\nK/数字 → キル報告\nhelp → コマンド一覧";
        } else {
          replyText = `受け取りました: ${userMessage}`;
        }

        // ===== LINEに返信 =====
        await axios.post(
          "https://api.line.me/v2/bot/message/reply",
          {
            replyToken: event.replyToken,
            messages: [{ type: "text", text: replyText }],
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            },
          }
        );

        console.log("返信成功！");
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("返信失敗:", err.response ? err.response.data : err.message);
    res.sendStatus(500);
  }
});

// ===== サーバー起動 =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`PUBG Bot server running on ${PORT}`);
});
