const express = require('express');
const line = require('@line/bot-sdk');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fir-b5ac2-default-rtdb.asia-southeast1.firebasedatabase.app/"
});

const db = admin.database();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post('/webhook', (req, res) => {
  const events = req.body.events;

  events.forEach(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const messageText = event.message.text;
      const replyToken = event.replyToken;

      const messagesRef = db.ref('messages').child(userId);
      messagesRef.push({
        text: messageText,
        timestamp: Date.now()
      }).catch(console.error);

      const replyMessage = {
        type: 'text',
        text: `คุณพิมพ์ว่า: ${messageText}`
      };

      client.replyMessage(replyToken, replyMessage)
        .catch(console.error);
    }
  });

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
