import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

/**
 * LoginComponent — No longer renders a form.
 * Immediately redirects to the external OAuth login page at cambiaaltok-auth.premiumasp.net.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 1rem;">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #1E3A5F;"></i>
      <p style="color: #6B7280; font-size: 0.875rem;">Redirigiendo al inicio de sesión...</p>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    // Redirect immediately to the OAuth provider login page
    this.authService.loginWithOAuth();
  }
}
