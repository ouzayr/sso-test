export interface User {
  id: string;
  email: string;
  name: string;
  provider: SsoProvider;
  roles?: string[];
}

export enum SsoProvider {
  Azure = 'azure',
  Okta = 'okta',
  Auth0 = 'auth0'
}

export interface AuthToken {
  accessToken: string;
  idToken?: string;
  expiresAt: number;
  provider: SsoProvider;
}
