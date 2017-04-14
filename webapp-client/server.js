'use strict';

const express = require('express');
const app = express();
const HOST_IP = process.env.HOST_IP;

if (!HOST_IP) {
  throw new Error('HOST_IP env var not found, please try setting HOST_IP env var before starting the server');
}

app.use('/', express.static(__dirname + '/static'));

app.get('/constants', (req, res) => {
  res.send(`var HOST_IP = '${HOST_IP}'`);
})

app.listen(5005, () => {
  console.log('HOST_IP: ', HOST_IP);
  console.log('listening on port 5005');
});
