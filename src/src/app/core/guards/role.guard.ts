import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.userRole();

    if (!userRole || !allowedRoles.includes(userRole)) {
      // If user has a role but it's not allowed, redirect to their correct dashboard
      if (userRole) {
        const redirectUrl = authService.getRedirectUrlForRole(userRole);
        router.navigate([redirectUrl]);
      } else {
        router.navigate(['/login']);
      }
      return false;
    }

    return true;
  };
};
