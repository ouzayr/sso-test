import { Injectable } from '@angular/core';
import { OktaAuth } from '@okta/okta-auth-js';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment.template';

@Injectable({
  providedIn: 'root'
})
export class OktaAuthService {
  private oktaAuth: OktaAuth;

  constructor() {
    this.oktaAuth = new OktaAuth({
      clientId: environment.okta.clientId,
      issuer: environment.okta.issuer,
      redirectUri: environment.okta.redirectUri,
      scopes: environment.okta.scopes,
      pkce: true,
      tokenManager: {
        storage: 'localStorage'
      }
    });
  }

  async login(): Promise<void> {
    try {
      await this.oktaAuth.signInWithRedirect({
        originalUri: '/home'
      });
    } catch (error) {
      console.error('Okta login error:', error);
      throw error;
    }
  }

  async handleCallback(): Promise<User | null> {
    try {
      if (this.oktaAuth.isLoginRedirect()) {
        await this.oktaAuth.handleLoginRedirect();
      }

      const isAuthenticated = await this.oktaAuth.isAuthenticated();

      if (isAuthenticated) {
        const userInfo = await this.oktaAuth.getUser();
        const tokenResponse = await this.oktaAuth.tokenManager.get('accessToken');

        if (tokenResponse) {
          localStorage.setItem('accessToken', tokenResponse.accessToken);
        }

        return {
          id: userInfo.sub || '',
          email: userInfo.email || '',
          name: userInfo.name || userInfo.email || '',
          provider: 'okta' as any
        };
      }

      return null;
    } catch (error) {
      console.error('Okta callback error:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.oktaAuth.signOut({
        postLogoutRedirectUri: environment.okta.postLogoutRedirectUri
      });
    } catch (error) {
      console.error('Okta logout error:', error);
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const tokenResponse = await this.oktaAuth.tokenManager.get('accessToken');
      return tokenResponse ? tokenResponse.accessToken : null;
    } catch (error) {
      console.error('Okta token error:', error);
      return null;
    }
  }
}
