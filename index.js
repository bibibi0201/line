    const express = require('express');
    const line = require('@line/bot-sdk');

    const app = express();
    app.use(express.json());

    const PORT = process.env.PORT || 3000;

    // ข้อมูลจาก LINE Developers
    const config = {
    channelAccessToken: '/j8guPJYAmr+gtl9azccHox1XKGUw7e2H4QULHFaE8zDc4pprcWRGu4P0T8yFphoyzpBCxC1e/RH0jaq0o0chNuOZ2Jdn2h8ZxgCpgvFK5KbI30sXzpC7ogJhiyOf2C6FvG9v/5wo3Cxi8qkUU6HOAdB04t89/1O/w1cDnyilFU=', // ใส่ Token จริงจาก LINE
    channelSecret: '2a510e00f9c37e7f870b51a931af955a',          
    };

    const client = new line.Client(config);

    app.post('/webhook', (req, res) => {
    const events = req.body.events;

    events.forEach(event => {
        if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId;
        const messageText = event.message.text;
        const replyToken = event.replyToken;

        console.log(`User (${userId}) sent message: ${messageText}`);

        // ตัวอย่าง: ตอบกลับข้อความที่พิมพ์มา
        const replyMessage = {
            type: 'text',
            text: `คุณพิมพ์ว่า: ${messageText}`
        };

        client.replyMessage(replyToken, replyMessage)
            .then(() => {
            console.log('Replied successfully');
            })
            .catch(err => {
            console.error('Error replying:', err);
            });
        }
    });

    res.sendStatus(200);
    });

    app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    });
