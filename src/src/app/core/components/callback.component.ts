import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { AuthService } from '../services/auth.service';
import { SignalrService } from '../services/signalr.service';

@Component({
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 1rem;">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #1E3A5F;"></i>
      <p style="color: #6B7280; font-size: 0.875rem;">Procesando autenticación...</p>
    </div>
  `,
})
export class CallbackComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly authService = inject(AuthService);
  private readonly signalrService = inject(SignalrService);

  ngOnInit(): void {
    this.oidcSecurityService.checkAuth().subscribe({
      next: (loginResponse) => {
        if (loginResponse?.isAuthenticated) {
          // Get access token
          this.oidcSecurityService.getAccessToken().subscribe((accessToken) => {
            // Get user data from the ID token / userinfo
            this.oidcSecurityService.getUserData().subscribe((userData) => {
              if (userData && accessToken) {
                // Persist token and set current user
                this.authService.handleOAuthCallback(userData, accessToken);

                // Start SignalR connection after successful authentication
                this.signalrService.startConnection();
                this.signalrService.receiveNotification();

                // Redirect to the appropriate dashboard based on role
                const role = this.authService.userRole();
                if (role) {
                  const redirectUrl = this.authService.getRedirectUrlForRole(role);
                  this.router.navigate([redirectUrl]);
                } else {
                  this.router.navigate(['/cliente']);
                }
              } else {
                this.router.navigate(['/login']);
              }
            });
          });
        } else {
          this.router.navigate(['/login']);
        }
      },
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
