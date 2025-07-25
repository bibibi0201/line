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

// Firebase Base URLs
const FIREBASE_BASE = "https://fir-b5ac2-default-rtdb.asia-southeast1.firebasedatabase.app";
const USER_DEVICES_PATH = FIREBASE_BASE + "/userDevices";
const MESSAGES_PATH = FIREBASE_BASE + "/messages";

app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const messageText = event.message.text.trim().toLowerCase();
      const replyToken = event.replyToken;

      console.log(`User (${userId}) sent message: ${messageText}`);

      if (messageText.startsWith("register ")) {
        // เชื่อม user กับ device
        const deviceId = messageText.split(" ")[1];

        try {
          const registerUrl = `${USER_DEVICES_PATH}/${userId}.json`;
          await fetch(registerUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deviceId),
          });

          await client.replyMessage(replyToken, {
            type: 'text',
            text: `เชื่อมกับอุปกรณ์ "${deviceId}" สำเร็จแล้ว ✅`
          });
        } catch (err) {
          console.error("Error registering device:", err);
          await client.replyMessage(replyToken, {
            type: 'text',
            text: "เกิดข้อผิดพลาดในการเชื่อมอุปกรณ์"
          });
        }
        continue;
      }

      if (messageText === "on" || messageText === "off") {
        try {
          // ดึง deviceId ของ user
          const deviceRes = await fetch(`${USER_DEVICES_PATH}/${userId}.json`);
          const deviceId = await deviceRes.json();

          if (!deviceId) {
            await client.replyMessage(replyToken, {
              type: 'text',
              text: "❌ คุณยังไม่ได้เชื่อมกับอุปกรณ์ใด\nโปรดพิมพ์: register <device_id>"
            });
            continue;
          }

          // บันทึกคำสั่งลง device ที่ user เป็นเจ้าของ
          const commandData = {
            status: messageText,
            userId: userId,
            timestamp: Date.now()
          };

          await fetch(`${MESSAGES_PATH}/${deviceId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commandData),
          });

          await client.replyMessage(replyToken, {
            type: 'text',
            text: messageText === "on" ? "✅ ไฟติดแล้ว" : "✅ ไฟดับแล้ว"
          });

        } catch (err) {
          console.error("Error in on/off command:", err);
          await client.replyMessage(replyToken, {
            type: 'text',
            text: "เกิดข้อผิดพลาดในการส่งคำสั่ง"
          });
        }

        continue;
      }

      // ข้อความทั่วไป
      await client.replyMessage(replyToken, {
        type: 'text',
        text: `คุณพิมพ์: "${messageText}"`
      });
    }
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
