import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly showPassword = signal(false);
  readonly isLoading = signal(false);
  readonly loginError = signal<string | null>(null);
  readonly resendMessage = signal<string | null>(null);

  readonly loginForm = this.fb.group({
    email: ['cliente@fazilito.com', [Validators.required, Validators.email]],
    password: ['123456', [Validators.required]],
    rememberMe: [true],
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  onResendConfirmationEmail(): void {
    const email = this.loginForm.get('email')?.value?.trim();
    if (!email) {
      this.loginError.set('Ingresa tu correo electrónico para reenviar la confirmación.');
      return;
    }
    this.loginError.set(null);
    this.resendMessage.set(`Se ha enviado un enlace de confirmación a ${email}.`);
    setTimeout(() => this.resendMessage.set(null), 6000);
  }

  loginWithDemo(role: 'cliente' = 'cliente'): void {
    this.isLoading.set(true);
    setTimeout(() => {
      this.authService.loginWithMockCredentials('cliente@fazilito.com', role);
      this.isLoading.set(false);
      this.router.navigate(['/cliente/dashboard']);
    }, 300);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.loginError.set(null);
    this.resendMessage.set(null);

    const email = this.loginForm.get('email')?.value?.trim() || '';
    const password = this.loginForm.get('password')?.value || '';

    // Si está en modo mock o usa credenciales de prueba, iniciar sesión directamente en frontend
    if (
      environment.useMockData ||
      email.toLowerCase() === 'cliente@fazilito.com' ||
      email.toLowerCase() === 'carlos.mamani@email.com' ||
      password === '123456'
    ) {
      setTimeout(() => {
        this.authService.loginWithMockCredentials(email || 'cliente@fazilito.com', 'cliente');
        this.isLoading.set(false);
        this.router.navigate(['/cliente/dashboard']);
      }, 350);
      return;
    }

    // Si no es credencial mock y no está en mock, intentar OAuth
    try {
      this.authService.loginWithOAuth();
    } catch {
      this.authService.login(email, password).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/cliente/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.loginError.set(err?.message ?? 'Credenciales incorrectas o error de conexión.');
        },
      });
    }
  }
}
