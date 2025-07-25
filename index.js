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

const FIREBASE_BASE_URL = "https://fir-b5ac2-default-rtdb.asia-southeast1.firebasedatabase.app";

app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue;

    const userMessage = event.message.text.toLowerCase();
    const userId = event.source.userId;

    if (userMessage.startsWith("connect ")) {
      const deviceId = userMessage.split(" ")[1];
      if (!deviceId) {
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'กรุณาพิมพ์ว่า connect <deviceId>',
        });
        continue;
      }

      // บันทึก deviceId ให้ userId
      const userUrl = `${FIREBASE_BASE_URL}/users/${userId}.json`;
      await fetch(userUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: deviceId }),
      });

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `เชื่อมต่อกับบอร์ด ${deviceId} เรียบร้อยแล้ว ✅`,
      });
      continue;
    }

    if (userMessage === "disconnect") {
      // ลบ deviceId mapping ของ user
      const userUrl = `${FIREBASE_BASE_URL}/users/${userId}.json`;
      await fetch(userUrl, { method: 'DELETE' });

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ตัดการเชื่อมต่อกับบอร์ดเรียบร้อยแล้ว',
      });
      continue;
    }

    // เช็ค deviceId ที่เชื่อมของ user
    const userUrl = `${FIREBASE_BASE_URL}/users/${userId}.json`;
    const userRes = await fetch(userUrl);
    const userData = await userRes.json();
    const deviceId = userData?.deviceId;

    if (deviceId) {
      // PUT คำสั่งลง Firebase
      const msgUrl = `${FIREBASE_BASE_URL}/messages/${deviceId}.json`;
      const body = {
        status: userMessage,
        userId: userId,
        timestamp: Date.now(),
      };

      await fetch(msgUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let reply = '';
      if (userMessage === 'on') reply = 'ไฟเปิดแล้ว ✅';
      else if (userMessage === 'off') reply = 'ไฟปิดแล้ว ❌';
      else reply = `ส่งคำสั่ง "${userMessage}" ไปยังบอร์ด ${deviceId}`;

      await client.replyMessage(event.replyToken, { type: 'text', text: reply });

    } else {
      // ยังไม่ได้เชื่อมต่อ
      const unlinkedUrl = `${FIREBASE_BASE_URL}/unlinked/${userId}.json`;
      const body = {
        message: userMessage,
        timestamp: Date.now(),
      };

      await fetch(unlinkedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'คุณยังไม่ได้เชื่อมบอร์ด พิมพ์ connect <deviceId> ก่อนใช้งาน',
      });
    }
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
