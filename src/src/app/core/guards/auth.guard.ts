import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user exists and token is still valid
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Verify the token hasn't expired
  if (!authService.hasValidToken()) {
    sessionStorage.removeItem('current_token');
    router.navigate(['/login']);
    return false;
  }

  return true;
};
