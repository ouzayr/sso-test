export const environment = {
  production: false,
  apiUrl: 'https://localhost:7001/api',

  // Azure AD Configuration
  azure: {
    clientId: 'YOUR_AZURE_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200'
  },

  // Okta Configuration
  okta: {
    clientId: 'YOUR_OKTA_CLIENT_ID',
    issuer: 'https://YOUR_OKTA_DOMAIN/oauth2/default',
    redirectUri: 'http://localhost:4200/login/callback',
    postLogoutRedirectUri: 'http://localhost:4200',
    scopes: ['openid', 'profile', 'email']
  },

  // Auth0 Configuration
  auth0: {
    domain: 'YOUR_AUTH0_DOMAIN.auth0.com',
    clientId: 'YOUR_AUTH0_CLIENT_ID',
    redirectUri: window.location.origin,
    audience: 'YOUR_AUTH0_AUDIENCE'
  }
};
