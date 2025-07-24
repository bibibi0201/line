const express = require('express');
const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// ฐาน URL สำหรับ Firebase
const FIREBASE_BASE_URL = "https://fir-b5ac2-default-rtdb.asia-southeast1.firebasedatabase.app";

app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const messageText = event.message.text.trim().toLowerCase();
      const replyToken = event.replyToken;

      console.log(`User (${userId}) sent message: ${messageText}`);

      // URL ของผู้ใช้ใน Firebase
      const userLedUrl = `${FIREBASE_BASE_URL}/command/${userId}/led.json`;

      let replyText = `คุณพิมพ์ว่า: ${messageText}`;

      // ถ้า user พิมพ์ on หรือ off ให้บันทึก
      if (messageText === "on" || messageText === "off") {
        try {
          await fetch(userLedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageText),
          });
          console.log(`LED status updated for ${userId} to: ${messageText}`);
          replyText = messageText === "on" ? "ไฟติดแล้ว " : "ปิดไฟเรียบร้อยแล้ว ";
        } catch (err) {
          console.error('Error updating Firebase:', err);
          replyText = "Error";
        }
      }

      const replyMessage = {
        type: 'text',
        text: replyText
      };

      try {
        await client.replyMessage(replyToken, replyMessage);
        console.log('Replied to user');
      } catch (err) {
        console.error('Error replying to LINE:', err);
      }
    }
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
