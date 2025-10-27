// ===== PUBG LINE Bot =====
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// ===== LINE Webhook =====
app.post('/callback', (req, res) => {
  const events = req.body.events;
  for (let event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;
      const replyText = `受け取りました: ${userMessage}`;

      axios.post('https://api.line.me/v2/bot/message/reply', {
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: replyText }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
        }
      })
      .then(() => console.log('返信成功'))
      .catch(err => console.error('返信失敗:', err.response ? err.response.data : err.message));
    }
  }
  res.sendStatus(200);
});

// ===== Server =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`PUBG Bot server running on ${PORT}`);
});
