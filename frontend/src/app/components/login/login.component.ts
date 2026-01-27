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
    console.log('Login component initialized');
    console.log('Current URL:', window.location.href);
    console.log('Is authenticated:', this.authService.isAuthenticated());

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';

    // Check if this is an OAuth callback (code in URL or hash)
    const hasCallback = window.location.pathname.includes('callback') ||
                       window.location.search.includes('code=') ||
                       window.location.search.includes('state=') ||
                       window.location.hash.includes('access_token');

    console.log('Has callback params:', hasCallback);

    if (hasCallback) {
      // Handle OAuth callback
      this.loading = true;
      try {
        console.log('Handling OAuth callback...');
        await this.authService.handleCallback();
        console.log('Callback handled successfully');
        // Navigation will happen in auth service
      } catch (error: any) {
        this.error = 'Authentication failed: ' + (error.message || 'Please try again.');
        console.error('Login callback error:', error);
        this.loading = false;
      }
    } else if (this.authService.isAuthenticated()) {
      // User already authenticated, redirect to home
      console.log('User already authenticated, redirecting to home');
      this.router.navigate(['/home']);
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
