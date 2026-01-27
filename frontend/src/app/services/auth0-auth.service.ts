import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment.template';

@Injectable({
  providedIn: 'root'
})
export class Auth0AuthService {
  private auth0Client: any;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Start initialization immediately
    this.ensureInitialized();
  }

  private async ensureInitialized(): Promise<void> {
    // Return existing initialization promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.auth0Client) {
      return Promise.resolve();
    }

    // Create new initialization promise
    this.initPromise = (async () => {
      try {
        console.log('Initializing Auth0 client...');
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
        console.log('Auth0 client initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Auth0 client:', error);
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  async login(): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log('Starting Auth0 login redirect...');
      await this.auth0Client.loginWithRedirect({
        authorizationParams: {
          redirect_uri: environment.auth0.redirectUri,
          audience: environment.auth0.audience
        }
      });
    } catch (error) {
      console.error('Auth0 login error:', error);
      throw error;
    }
  }

  async handleCallback(): Promise<User | null> {
    try {
      await this.ensureInitialized();

      console.log('Handling Auth0 callback...');
      const query = window.location.search;
      console.log('Current URL:', window.location.href);
      console.log('Query params:', query);

      // Check if this is an OAuth callback
      if (query.includes('code=') && query.includes('state=')) {
        console.log('Processing Auth0 redirect callback...');

        // Handle the redirect callback - this exchanges code for tokens
        const result = await this.auth0Client.handleRedirectCallback();
        console.log('Callback handled successfully:', result);

        // Clean up URL AFTER tokens are retrieved
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Check if user is authenticated
      const isAuthenticated = await this.auth0Client.isAuthenticated();
      console.log('Is authenticated:', isAuthenticated);

      if (isAuthenticated) {
        // Get user info
        const user = await this.auth0Client.getUser();
        console.log('User info:', user);

        // Get access token
        const token = await this.auth0Client.getTokenSilently();
        console.log('Access token retrieved:', token ? 'yes' : 'no');

        // Store token
        localStorage.setItem('accessToken', token);

        return {
          id: user.sub,
          email: user.email,
          name: user.name || user.email,
          provider: 'auth0' as any
        };
      }

      console.log('User not authenticated after callback');
      return null;
    } catch (error) {
      console.error('Auth0 callback error:', error);
      // Don't swallow the error - let it propagate so user sees it
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.ensureInitialized();
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
      await this.ensureInitialized();
      const token = await this.auth0Client.getTokenSilently();
      return token;
    } catch (error) {
      console.error('Auth0 token error:', error);
      return null;
    }
  }
}
