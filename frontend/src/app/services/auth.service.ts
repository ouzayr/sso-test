import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, SsoProvider, AuthToken } from '../models/user.model';
import { AzureAuthService } from './azure-auth.service';
import { OktaAuthService } from './okta-auth.service';
import { Auth0AuthService } from './auth0-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private currentProvider: SsoProvider | null = null;

  constructor(
    private router: Router,
    private azureAuth: AzureAuthService,
    private oktaAuth: OktaAuthService,
    private auth0Auth: Auth0AuthService
  ) {
    const storedUser = localStorage.getItem('currentUser');
    const storedProvider = localStorage.getItem('ssoProvider') as SsoProvider | null;

    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
    this.currentProvider = storedProvider;

    this.initializeAuth();
  }

  private async initializeAuth() {
    if (this.currentProvider) {
      try {
        await this.handleCallback();
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  async login(provider: SsoProvider): Promise<void> {
    this.currentProvider = provider;
    localStorage.setItem('ssoProvider', provider);

    try {
      switch (provider) {
        case SsoProvider.Azure:
          await this.azureAuth.login();
          break;
        case SsoProvider.Okta:
          await this.oktaAuth.login();
          break;
        case SsoProvider.Auth0:
          await this.auth0Auth.login();
          break;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async handleCallback(): Promise<void> {
    if (!this.currentProvider) {
      this.currentProvider = localStorage.getItem('ssoProvider') as SsoProvider;
    }

    if (!this.currentProvider) {
      return;
    }

    try {
      let user: User | null = null;

      switch (this.currentProvider) {
        case SsoProvider.Azure:
          user = await this.azureAuth.handleCallback();
          break;
        case SsoProvider.Okta:
          user = await this.oktaAuth.handleCallback();
          break;
        case SsoProvider.Auth0:
          user = await this.auth0Auth.handleCallback();
          break;
      }

      if (user) {
        user.provider = this.currentProvider;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        this.router.navigate(['/home']);
      }
    } catch (error) {
      console.error('Callback handling error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    const provider = this.currentProvider;

    localStorage.removeItem('currentUser');
    localStorage.removeItem('ssoProvider');
    localStorage.removeItem('accessToken');
    this.currentUserSubject.next(null);
    this.currentProvider = null;

    try {
      switch (provider) {
        case SsoProvider.Azure:
          await this.azureAuth.logout();
          break;
        case SsoProvider.Okta:
          await this.oktaAuth.logout();
          break;
        case SsoProvider.Auth0:
          await this.auth0Auth.logout();
          break;
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    this.router.navigate(['/login']);
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.currentProvider) {
      return null;
    }

    try {
      switch (this.currentProvider) {
        case SsoProvider.Azure:
          return await this.azureAuth.getAccessToken();
        case SsoProvider.Okta:
          return await this.oktaAuth.getAccessToken();
        case SsoProvider.Auth0:
          return await this.auth0Auth.getAccessToken();
        default:
          return null;
      }
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }
}
