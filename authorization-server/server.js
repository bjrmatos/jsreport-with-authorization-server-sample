const createOIDCServer = require('./authServer')

createOIDCServer({
  issuer: 'http://jsreport-sample.com:5000',
  port: 5000,
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
    redirectUri: 'http://jsreport-sample.com:5005/callback.html',
    logoutRedirectUri: 'http://jsreport-sample.com:5005/index.html'
  }
})
