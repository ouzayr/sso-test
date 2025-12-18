import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { environment } from '../../../environments/environment.template';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  currentUser: User | null = null;
  apiResponse: any = null;
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  async testApiConnection() {
    this.loading = true;
    this.error = '';
    this.apiResponse = null;

    try {
      const response = await this.http.get(`${environment.apiUrl}/auth/validate`).toPromise();
      this.apiResponse = response;
    } catch (error: any) {
      this.error = error.error?.message || 'Failed to connect to API';
      console.error('API error:', error);
    } finally {
      this.loading = false;
    }
  }

  async logout() {
    await this.authService.logout();
  }

  getProviderDisplayName(): string {
    switch (this.currentUser?.provider) {
      case 'azure':
        return 'Azure AD';
      case 'okta':
        return 'Okta';
      case 'auth0':
        return 'Auth0';
      default:
        return 'Unknown';
    }
  }
}
