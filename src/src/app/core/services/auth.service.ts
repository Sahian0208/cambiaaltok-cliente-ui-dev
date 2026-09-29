import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { User, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { ApiResponse } from 'bc-primeng-ui';

export interface RegisterDto {
  firstName: string;
  lastName: string;
  phone: string;
  documentType: 'DNI' | 'CI';
  documentNumber: string;
  birthDate: string;
  email: string;
  password: string;
  country: string;
}

const TOKEN_KEY = 'current_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly currentUser = signal<User | null>(null);
  private readonly naturalPersonUrl = `${environment.apiBaseUrl}/v1/natural-person`;

  readonly isAuthenticated = computed(() => this.currentUser() !== null && this.hasValidToken());
  readonly userRole = computed(() => this.currentUser()?.role ?? null);

  /**
   * Login using the legacy mock flow (for development with mocks).
   */
  login(email: string, password: string): Observable<User> {
    return this.http.post<User>('/api/auth/login', { email, password }).pipe(
      tap((user) => this.currentUser.set(user))
    );
  }

  /**
   * Initiate OAuth login redirect via angular-auth-oidc-client.
   */
  loginWithOAuth(): void {
    this.oidcSecurityService.authorize();
  }

  /**
   * Register using the legacy mock flow (for development).
   */
  // register(data: RegisterDto): Observable<User> {
  //   debugger;
  //   // return this.http.post<User>('/api/auth/register', data).pipe(
  //   //   tap((user) => this.currentUser.set(user))
  //   // );
  //    return this.http
  //     .post<User>(`${this.naturalPersonUrl}/create-np-user`, data)
  //     .pipe(tap((user) => this.currentUser.set(user)));
  // }

  register(data: RegisterDto): Observable<number> {
    return this.http
      .post<
        ApiResponse<number>
      >(`${this.naturalPersonUrl}/create-np-user`, data)
      .pipe(map((response) => response.data));
  }

  registerPerson(data: FormData): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${environment.apiBaseUrl}/v1/public/register-person`, data);
  }

  registerCompany(data: FormData): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${environment.apiBaseUrl}/v1/public/register-company`, data);
  }



  /**
   * Handle OAuth callback: persist token and populate currentUser from user data.
   */
  handleOAuthCallback(userData: any, accessToken: string): void {
    // Persist token in session storage
    sessionStorage.setItem(TOKEN_KEY, accessToken);

    // Map OAuth user data to our User model
    const user = this.mapOAuthUserToUser(userData);
    this.currentUser.set(user);
  }

  /**
   * Logout: clear token, destroy currentUser, and revoke tokens via OIDC.
   * The OIDC library handles the redirect to postLogoutRedirectUri.
   */
  logout(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this.currentUser.set(null);
    

    this.oidcSecurityService.logoffAndRevokeTokens().subscribe({
      next: () => {
        // OIDC library handles the post-logout redirect to postLogoutRedirectUri
      },
      error: () => {
        // If revoke fails, redirect manually to home
        window.location.href = '/';
      },
    });
  }

  /**
   * Check if the stored token is still valid.
   */
  hasValidToken(): boolean {    
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    // Check token expiry by decoding JWT payload
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to ms
      return Date.now() < exp;
    } catch {
      return false;
    }
  }

  /**
   * Get the stored access token.
   */
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  getCurrentUser(): Signal<User | null> {
    return this.currentUser.asReadonly();
  }

  /**
   * Set currentUser directly (used during app initialization from stored session).
   */
  setCurrentUser(user: User): void {
    this.currentUser.set(user);
  }

  getRedirectUrlForRole(role: UserRole): string {
    switch (role) {
      case 'cliente':
        return '/cliente';
      case 'intermediario':
        return '/intermediario';
      case 'administrador':
        return '/';
    }
  }

  /**
   * Map the OAuth user data to our application User model.
   * Roles from the token determine the UserRole.
   */
  private mapOAuthUserToUser(userData: any): User {
    const roles: string[] = userData?.role
      ? (Array.isArray(userData.role) ? userData.role : [userData.role])
      : [];

    const resolvedRole = this.resolveRole(roles);

    return {
      id: userData?.sub ?? '',
      firstName: userData?.given_name ?? userData?.name ?? userData?.email?.split('@')[0] ?? '',
      lastName: userData?.family_name ?? '',
      phone: '',
      documentType: 'CI',
      documentNumber: '',
      birthDate: '',
      email: userData?.email ?? '',
      passwordHash: '',
      role: resolvedRole,
      registeredAt: new Date().toISOString(),
    };
  }

  /**
   * Resolve the application role from OAuth roles array.
   * Priority: administrador > intermediario > cliente (default).
   */
  private resolveRole(roles: string[]): UserRole {
    const lowerRoles = roles.map((r) => r.toLowerCase());

    if (lowerRoles.includes('administrador') || lowerRoles.includes('admin')) {
      return 'administrador';
    }
    if (lowerRoles.includes('intermediario') || lowerRoles.includes('intermediary')) {
      return 'intermediario';
    }
    return 'cliente';
  }
}
