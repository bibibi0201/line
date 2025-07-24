app.post('/webhook', (req, res) => {
  const events = req.body.events;
  
  events.forEach(event => {
    if (event.type === 'message' && event.message.type === 'text') {
      console.log('User sent message:', event.message.text);
    } else {
      console.log('Event:', event);
    }
  });
  
  res.sendStatus(200);
});
