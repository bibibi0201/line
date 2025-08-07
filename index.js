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

    // ---------- CONNECT ----------
    if (userMessage.startsWith("connect ")) {
      const deviceId = userMessage.split(" ")[1];
      if (!deviceId) {
        await client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'กรุณาพิมพ์ว่า connect <deviceId>',
        });
        continue;
      }

      const userUrl = `${FIREBASE_BASE_URL}/users/${userId}.json`;
      await fetch(userUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `เชื่อมต่อกับบอร์ด ${deviceId} เรียบร้อยแล้ว ✅`,
      });
      continue;
    }

    // ---------- DISCONNECT ----------
    if (userMessage.trim().toLowerCase() === "disconnect") {
      const userUrl = `${FIREBASE_BASE_URL}/users/${userId}.json`;
      await fetch(userUrl, { method: 'DELETE' });

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ตัดการเชื่อมต่อกับบอร์ดเรียบร้อยแล้ว',
      });
      continue;
    }

    // ---------- ตรวจสอบการเชื่อมต่อ ----------
    const userUrl = `${FIREBASE_BASE_URL}/users/${userId}.json`;
    const userRes = await fetch(userUrl);
    const userData = await userRes.json();

    if (!userData || !userData.deviceId) {
      const unlinkedUrl = `${FIREBASE_BASE_URL}/noconnect/${userId}.json`;
      const body = {
        message: userMessage,
        timestamp: Date.now(),
      };

      await fetch(unlinkedUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'คุณยังไม่ได้เชื่อมบอร์ด พิมพ์ connect <deviceId> ก่อนใช้งาน',
      });

      continue;
    }

    const deviceId = userData.deviceId;
    const msgUrl = `${FIREBASE_BASE_URL}/messages/${deviceId}.json`;
    let reply = '';

    // ---------- STATUS ----------
    if (userMessage.trim().toLowerCase() === 'status') {
      const statusRes = await fetch(msgUrl);
      const statusData = await statusRes.json();

      if (statusData && statusData.status) {
        const currentStatus = statusData.status.toLowerCase();
        if (currentStatus === "on") {
          reply = "สถานะปัจจุบัน: ไฟเปิดอยู่ ✅";
        } else if (currentStatus === "off") {
          reply = "สถานะปัจจุบัน: ไฟปิดอยู่ ❌";
        } else {
          reply = `สถานะปัจจุบัน: ${currentStatus}`;
        }
      } else {
        reply = "ยังไม่มีสถานะของไฟ";
      }

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: reply,
      });
      continue;
    }

    // ---------- ON / OFF ----------
    if (userMessage === 'on' || userMessage === 'off') {
      const body = {
        status: userMessage,
        userId,
        timestamp: Date.now(),
      };

      await fetch(msgUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      reply = userMessage === 'on' ? 'ไฟเปิดแล้ว ✅' : 'ไฟปิดแล้ว ❌';
    }

    // ---------- คำสั่งอื่น (ข้อความทั่วไป) ----------
    else {
      const timestamp = Date.now();

      // 1) บันทึกข้อความย้อนหลัง
      const textUrl = `${msgUrl}/texts/${timestamp}.json`;
      const textBody = {
        message: userMessage,
        userId,
      };

      await fetch(textUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(textBody),
      });

      // 2) อัปเดตข้อความล่าสุดใน Realtime Database
      const body = {
        message: userMessage,
        userId,
        timestamp: timestamp,
      };

      await fetch(msgUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      reply = `บันทึกข้อความ "${userMessage}" แล้ว`;
    }

    // ---------- ส่งข้อความตอบกลับ ----------
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: reply,
    });
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});






