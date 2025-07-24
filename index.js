const express = require('express');
const line = require('@line/bot-sdk');
const fetch = require('node-fetch'); 

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ข้อมูลจาก LINE Developers
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

// URL Firebase Realtime Database REST API
const FIREBASE_USER_LOG = "https://fir-b5ac2-default-rtdb.asia-southeast1.firebasedatabase.app/command";

app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const messageText = event.message.text;
      const replyToken = event.replyToken;

      console.log(`User (${userId}) sent message: ${messageText}`);

      // บันทึก userId และข้อความลง Firebase
      try {
        await fetch(`${FIREBASE_USER_LOG}/${userId}.json`, {
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastMessage: messageText,
            timestamp: new Date().toISOString()
          }),
        });
        console.log('Saved user data to Firebase');
      } catch (err) {
        console.error('Error saving to Firebase:', err);
      }

      // สร้างข้อความตอบกลับ
      const replyMessage = {
        type: 'text',
        text: `คุณพิมพ์ว่า: ${messageText}`
      };

      // ส่งข้อความตอบกลับใน LINE
      try {
        await client.replyMessage(replyToken, replyMessage);
        console.log('Replied successfully');
      } catch (err) {
        console.error('Error replying:', err);
      }
    }
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
