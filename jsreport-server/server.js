'use strict';

const path = require('path');
const fs = require('fs');

const jsreport = require('jsreport')(
  Object.assign({
    rootDirectory: path.resolve(__dirname, '../'),
    dataDirectory: path.join(__dirname, 'data')
  }, JSON.parse(
    fs.readFileSync(path.join(__dirname, 'dev.config.json').toString()
  ))));

const HOST_IP = process.env.HOST_IP;

if (!HOST_IP) {
  throw new Error('HOST_IP env var not found, please try setting HOST_IP env var before starting the server');
}

jsreport.init().then(function () {
  console.log('jsreport started')
}).catch(function (err) {
  throw new Error('jsreport could not start..,' + err.message)
})
