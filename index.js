// index.js
const admin = require('firebase-admin');
const serviceAccount = require('fir-b5ac2-firebase-adminsdk-fbsvc-cae38c182f.json');


// initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fir-b5ac2-default-rtdb.asia-southeast1.firebasedatabase.app/"  // แก้เป็น URL โปรเจกต์คุณ
});

const db = admin.database();

async function writeCommand(userId, command) {
  const ref = db.ref(`commands/${userId}`);
  await ref.set({
    boardId: "esp01",
    command: command,
    timestamp: Date.now()
  });
  console.log(`Command for user ${userId} saved.`);
}

// ทดสอบเขียนคำสั่ง "on" ให้ user "user123"
writeCommand("user123", "on").catch(console.error);
