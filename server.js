// ===== PUBG Report Bot (for LINE) =====
const express = require("express");
const axios = require("axios");
const vision = require("@google-cloud/vision");

const app = express();
app.use(express.json());

// ===== Google Vision 設定 =====
const client = new vision.ImageAnnotatorClient({
  keyFilename: '/etc/secrets/key.json' // ← 修正版（Render用）
});

// ===== 環境変数から読み込み =====
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

// ===== Webhook受信 =====
app.post("/callback", async (req, res) => {
  try {
    const events = req.body.events || [];

    for (const event of events) {
      // ===== テキストメッセージ処理 =====
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text.trim();
        let replyText = "";

        // コマンド判定
        if (userMessage === "戦績") {
          replyText = "📊 戦績データを取得中...";
        } else if (userMessage.startsWith("K/")) {
          const kills = userMessage.split("/")[1];
          replyText = `🔥 ${kills}キル！ナイスファイト！`;
        } else if (userMessage === "help") {
          replyText =
            "📘 コマンド一覧:\n戦績 → 戦績データ取得\nK/数字 → キル報告\nhelp → コマンド一覧";
        } else {
          replyText = `受け取りました: ${userMessage}`;
        }

        // LINEに返信
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

        console.log("✅ テキスト返信成功！");
      }

      // ===== 画像メッセージ処理 =====
      if (event.type === "message" && event.message.type === "image") {
        try {
          // LINEサーバーから画像取得
          const url = `https://api-data.line.me/v2/bot/message/${event.message.id}/content`;
          const response = await axios.get(url, {
            responseType: "arraybuffer",
            headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
          });

          // Google Vision OCR
          const [result] = await client.textDetection(response.data);
          const detections = result.textAnnotations;

          const replyText =
            detections.length > 0
              ? `📸 読み取り結果:\n${detections[0].description}`
              : "画像から文字を検出できませんでした。";

          // OCR結果を返信
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

          console.log("📷 画像読み取り成功！");
        } catch (err) {
          console.error("❌ 画像処理エラー:", err.message);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ 全体エラー:", err.message);
    res.sendStatus(500);
  }
});

// ===== サーバー起動 =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`PUBG Bot server running on ${PORT}`);
});
