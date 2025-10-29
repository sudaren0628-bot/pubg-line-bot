// ===== PUBG Report Bot (for LINE + OCR.Space) =====
const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ===== 環境変数から読み込み =====
const CHANNEL_ACCESS_TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

// ===== OCR.Space 設定 =====
const OCR_API_KEY = "K88193345788957"; // ← あなたのOCR.Space APIキー

// ===== Webhook受信 =====
app.post("/callback", async (req, res) => {
  try {
    const events = req.body.events || [];

    for (const event of events) {
      // ===== テキストメッセージ =====
      if (event.type === "message" && event.message.type === "text") {
        const userMessage = event.message.text.trim();
        let replyText = "";

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

      // ===== 画像メッセージ =====
      if (event.message.type === "image") {
        try {
          // 1️⃣ LINEサーバーから画像取得
          const url = `https://api-data.line.me/v2/bot/message/${event.message.id}/content`;
          const imageResponse = await axios.get(url, {
            responseType: "arraybuffer",
            headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
          });

          // 2️⃣ OCR.Spaceに送信
          const ocrResponse = await axios.post(
            "https://api.ocr.space/parse/image",
            {
              apikey: OCR_API_KEY,
              base64Image: `data:image/jpeg;base64,${Buffer.from(
                imageResponse.data
              ).toString("base64")}`,
              language: "jpn",
            },
            { headers: { "Content-Type": "application/json" } }
          );

          // 3️⃣ 結果抽出
          const parsedText =
            ocrResponse.data?.ParsedResults?.[0]?.ParsedText || "文字を検出できませんでした。";

          // 4️⃣ 結果返信
          await axios.post(
            "https://api.line.me/v2/bot/message/reply",
            {
              replyToken: event.replyToken,
              messages: [
                { type: "text", text: `📸 OCR読み取り結果:\n${parsedText}` },
              ],
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
              },
            }
          );

          console.log("✅ 画像OCR処理成功！");
        } catch (err) {
          console.error("❌ 画像処理エラー:", err.message);
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ 全体エラー:", error.message);
    res.status(500).send("Error");
  }
});

// ===== サーバー起動 =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`PUBG Bot server running on ${PORT}`);
});
