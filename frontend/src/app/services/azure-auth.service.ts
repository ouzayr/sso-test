import { Injectable } from '@angular/core';
import { PublicClientApplication, InteractionType, AuthenticationResult } from '@azure/msal-browser';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment.template';

@Injectable({
  providedIn: 'root'
})
export class AzureAuthService {
  private msalInstance: PublicClientApplication;

  constructor() {
    this.msalInstance = new PublicClientApplication({
      auth: {
        clientId: environment.azure.clientId,
        authority: environment.azure.authority,
        redirectUri: environment.azure.redirectUri,
        postLogoutRedirectUri: environment.azure.postLogoutRedirectUri
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: false
      }
    });
  }

  async login(): Promise<void> {
    try {
      await this.msalInstance.loginRedirect({
        scopes: ['openid', 'profile', 'email', 'User.Read']
      });
    } catch (error) {
      console.error('Azure login error:', error);
      throw error;
    }
  }

  async handleCallback(): Promise<User | null> {
    try {
      const response = await this.msalInstance.handleRedirectPromise();

      if (response) {
        const account = response.account;
        localStorage.setItem('accessToken', response.accessToken);

        return {
          id: account.localAccountId,
          email: account.username,
          name: account.name || account.username,
          provider: 'azure' as any
        };
      }

      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        const tokenResponse = await this.msalInstance.acquireTokenSilent({
          scopes: ['openid', 'profile', 'email', 'User.Read'],
          account: account
        });

        localStorage.setItem('accessToken', tokenResponse.accessToken);

        return {
          id: account.localAccountId,
          email: account.username,
          name: account.name || account.username,
          provider: 'azure' as any
        };
      }

      return null;
    } catch (error) {
      console.error('Azure callback error:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      await this.msalInstance.logoutRedirect({
        account: accounts[0]
      });
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        return null;
      }

      const response = await this.msalInstance.acquireTokenSilent({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        account: accounts[0]
      });

      return response.accessToken;
    } catch (error) {
      console.error('Azure token error:', error);
      return null;
    }
  }
}
