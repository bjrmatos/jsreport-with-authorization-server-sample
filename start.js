'use strict';

const os = require('os');
const runAll = require('npm-run-all');
const ifaces = os.networkInterfaces();

const ip = getMachineIp()[0];

if (!ip) {
  console.log('Couldn\'t detect the ip of your machine..');
}

process.env.HOST_IP = ip;

runAll(['start-webapp-client', 'start-authorization-server ' + ip, 'start-jsreport -- --authentication.authorizationServer.tokenValidation.endpoint http://' + ip + ':5000/connect/introspect'], {
  parallel: true,
  stdout: process.stdout,
  stderr: process.stderr
})
.then(() => {
  console.log('start success!');
})
.catch(err => {
  console.log('start failed!');
  console.error(err)
});

function getMachineIp () {
  let results = []

  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        results.push(iface.address);
      } else {
        // this interface has only one ipv4 adress
        results.push(iface.address);
      }
      ++alias;
    });
  });

  return results;
}
