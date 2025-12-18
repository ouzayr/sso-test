import { Injectable } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment.template';
import { firstValueFrom } from 'rxjs';

declare global {
  interface Window {
    auth0Client: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class Auth0AuthService {
  private auth0Client: any;

  constructor() {
    this.initAuth0();
  }

  private async initAuth0() {
    const { createAuth0Client } = await import('@auth0/auth0-spa-js');
    this.auth0Client = await createAuth0Client({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        redirect_uri: environment.auth0.redirectUri,
        audience: environment.auth0.audience
      },
      cacheLocation: 'localstorage',
      useRefreshTokens: true
    });
  }

  async login(): Promise<void> {
    try {
      if (!this.auth0Client) {
        await this.initAuth0();
      }
      await this.auth0Client.loginWithRedirect({
        appState: { target: '/home' }
      });
    } catch (error) {
      console.error('Auth0 login error:', error);
      throw error;
    }
  }

  async handleCallback(): Promise<User | null> {
    try {
      if (!this.auth0Client) {
        await this.initAuth0();
      }

      const query = window.location.search;
      if (query.includes('code=') && query.includes('state=')) {
        await this.auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, '/home');
      }

      const isAuthenticated = await this.auth0Client.isAuthenticated();

      if (isAuthenticated) {
        const user = await this.auth0Client.getUser();
        const token = await this.auth0Client.getTokenSilently();

        localStorage.setItem('accessToken', token);

        return {
          id: user.sub,
          email: user.email,
          name: user.name || user.email,
          provider: 'auth0' as any
        };
      }

      return null;
    } catch (error) {
      console.error('Auth0 callback error:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      if (!this.auth0Client) {
        await this.initAuth0();
      }
      await this.auth0Client.logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
    } catch (error) {
      console.error('Auth0 logout error:', error);
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      if (!this.auth0Client) {
        await this.initAuth0();
      }
      const token = await this.auth0Client.getTokenSilently();
      return token;
    } catch (error) {
      console.error('Auth0 token error:', error);
      return null;
    }
  }
}
