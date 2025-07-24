const express = require('express');
const app = express();
app.use(express.json()); 

const PORT = process.env.PORT || 3000;

app.post('/webhook', (req, res) => {
  const events = req.body.events;

  events.forEach(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      console.log('User sent message:', event.message.text);
    }
  });

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
