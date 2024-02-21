'use strict';

const express = require('express');
const app = express();

app.use('/', express.static(__dirname + '/static'));

app.listen(5006, () => {
  console.log('listening on port 5006');
});
