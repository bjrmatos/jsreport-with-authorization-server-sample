const createOIDCServer = require('./authServer')

createOIDCServer({
  issuer: 'http://jsreport-sample.com:5005',
  port: 5005,
  studioClient: {
    clientId: 'jsreport-studio',
    clientSecret: 'secret',
    redirectUri: 'http://jsreport-sample.com:5004/auth-server/callback'
  },
  apiResource: {
    clientId: 'jsreport-api',
    clientSecret: 'secret'
  },
  webAppClient: {
    clientId: 'js_oidc',
    clientSecret: 'secret',
    redirectUri: 'http://jsreport-sample.com:5006/callback.html',
    logoutRedirectUri: 'http://jsreport-sample.com:5006/index.html'
  }
})
