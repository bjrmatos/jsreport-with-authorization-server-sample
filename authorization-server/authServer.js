const express = require('express')
const { Provider } = require('oidc-provider')

module.exports = function createAuthServer (options) {
  const ISSUER = options.issuer
  const PORT = options.port
  const STUDIO_CLIENT = options.studioClient
  const API_RESOURCE = options.apiResource
  const WEB_APP_CLIENT = options.webAppClient

  const studioClient = {
    client_id: STUDIO_CLIENT.clientId,
    client_secret: STUDIO_CLIENT.clientSecret,
    client_name: 'jsreport studio Web Application',
    redirect_uris: [STUDIO_CLIENT.redirectUri]
  }

  const apiResourceClient = {
    client_id: API_RESOURCE.clientId,
    client_secret: API_RESOURCE.clientSecret,
    client_name: 'jsreport HTTP API',
    redirect_uris: [],
    response_types: [],
    grant_types: []
  }

  const webAppClient = {
    client_id: WEB_APP_CLIENT.clientId,
    client_secret: WEB_APP_CLIENT.clientSecret,
    application_type: 'web',
    token_endpoint_auth_method: 'none',
    client_name: 'Sample Web App Application',
    grant_types: ['implicit'],
    response_types: [
      'id_token token'
    ],
    redirect_uris: [WEB_APP_CLIENT.redirectUri],
    post_logout_redirect_uris: [WEB_APP_CLIENT.logoutRedirectUri]
  }

  const configuration = {
    async findAccount (ctx, sub, token) {
      return {
        accountId: sub,
        async claims (use, scope, claims, rejected) {
          return {
            sub,
            username: sub
          }
        }
      }
    },
    claims: {
      authProfile: ['username']
    },
    scopes: [
      'openid',
      'offline_access',
      'jsreport'
    ],
    features: {
      introspection: {
        allowedPolicy: () => {
          return true
        },
        enabled: true
      }
    },
    clients: [studioClient, apiResourceClient, webAppClient],
    pkce: {
      required: function pkceRequired (ctx, client) {
        return false
      }
    },
    clientBasedCORS: function clientBasedCORS(ctx, origin, client) {
      return true
    },
    responseTypes: [
      'code id_token',
      'id_token token',
      'code',
      'id_token',
      'none'
    ],
    routes: {
      jwks: '/.well-known/openid-configuration/jwks',
      authorization: '/connect/authorize',
      introspection: '/connect/introspect',
      token: '/connect/token',
      userinfo: '/connect/userinfo'
    }
  }

  const oidc = new Provider(ISSUER, configuration)
  const app = express()

  const { invalidate: orig } = oidc.Client.Schema.prototype;

  // allow http for implicit grant
  // https://github.com/panva/node-oidc-provider/blob/main/recipes/implicit_http_localhost.md#allowing-http-andor-localhost-for-implicit-response-type-web-clients
  oidc.Client.Schema.prototype.invalidate = function invalidate(message, code) {
    if (code === 'implicit-force-https' || code === 'implicit-forbid-localhost') {
      return;
    }

    orig.call(this, message);
  }

  oidc.on('access_token.saved', (token) => {
    console.log(`NEW access_token "${token.jti}" saved`, token)
  })

  app.use('/', oidc.callback())

  return new Promise((resolve, reject) => {
    let isServerBound = false

    // start on random port
    app.listen(PORT, function () {
      isServerBound = true
      console.log(`oidc-provider listening on port ${PORT}, check http://jsreport-sample.com:${PORT}/.well-known/openid-configuration`)
      resolve(app)
    })

    app.on('error', (err) => {
      if (!isServerBound) {
        app.close(() => reject(err))
      }
    })
  })
}
