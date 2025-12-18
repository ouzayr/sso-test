import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SsoProvider } from '../../models/user.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loading = false;
  error = '';
  returnUrl: string = '/home';
  SsoProvider = SsoProvider;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return;
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';

    if (window.location.pathname.includes('callback') ||
        window.location.search.includes('code=') ||
        window.location.hash.includes('access_token')) {
      this.loading = true;
      try {
        await this.authService.handleCallback();
      } catch (error: any) {
        this.error = 'Authentication failed. Please try again.';
        console.error('Login callback error:', error);
      } finally {
        this.loading = false;
      }
    }
  }

  async loginWith(provider: SsoProvider) {
    this.loading = true;
    this.error = '';

    try {
      await this.authService.login(provider);
    } catch (error: any) {
      this.error = `Failed to login with ${provider}. Please try again.`;
      console.error('Login error:', error);
      this.loading = false;
    }
  }
}
