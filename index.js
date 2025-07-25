const express = require('express');
const line = require('@line/bot-sdk');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// LINE Bot config
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// Firebase Realtime Database base URL (ไม่รวม .json)
const FIREBASE_BASE_URL = "https://fir-b5ac2-default-rtdb.asia-southeast1.firebasedatabase.app/messages";

app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const messageText = event.message.text.trim().toLowerCase();
      const replyToken = event.replyToken;

      console.log(`User (${userId}) sent message: ${messageText}`);

      // สร้าง object ข้อมูลที่ต้องการบันทึก
      const data = {
        message: messageText,
        timestamp: Date.now()
      };

      // URL สำหรับบันทึกข้อมูลของแต่ละผู้ใช้
      const userMessageURL = `${FIREBASE_BASE_URL}/${userId}.json`;

      try {
        // บันทึกข้อความลง Firebase (แยกตาม user และไม่เขียนทับ)
        await fetch(userMessageURL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        console.log(`Saved message "${messageText}" for user ${userId}`);
      } catch (err) {
        console.error('Error saving message to Firebase:', err);
      }

      // ตอบกลับข้อความ
      try {
        let replyText;

        if (messageText === "on") {
          replyText = "ไฟติด";
        } else if (messageText === "off") {
          replyText = "ไฟดับ";
        } else {
          replyText = `คุณพิมพ์ข้อความว่า: "${event.message.text}"`;
        }

        await client.replyMessage(replyToken, {
          type: 'text',
          text: replyText
        });

        console.log('Replied to user');
      } catch (err) {
        console.error('Error replying to LINE:', err);
        await client.replyMessage(replyToken, {
          type: 'text',
          text: "Error"
        });
      }
    }
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
