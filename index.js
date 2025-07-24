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

// Firebase Realtime Database path
const FIREBASE_URL = "https://fir-b5ac2-default-rtdb.asia-southeast1.firebasedatabase.app/command.json";

app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const messageText = event.message.text.trim().toLowerCase(); 

      const replyToken = event.replyToken;

      console.log(`User (${userId}) sent message: ${messageText}`);

      // บันทึกคำสั่ง on/off ลง Firebase
      if (messageText === "on" || messageText === "off") {
        try {
          await fetch(FIREBASE_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageText),
          });
          console.log(`LED status updated to: ${messageText}`);
        } catch (err) {
          console.error('Error updating LED status to Firebase:', err);
        }
      }

      // ตอบกลับใน LINE
      const replyMessage = {
        type: 'text',
        text: `คุณพิมพ์ว่า: ${messageText}`
      };

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
