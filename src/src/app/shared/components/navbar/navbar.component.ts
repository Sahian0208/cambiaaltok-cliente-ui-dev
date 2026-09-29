import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

interface NavItem {
  label: string;
  routerLink: string;
  icon?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly userRole = this.authService.userRole;
  readonly currentUser = this.authService.getCurrentUser();

  mobileMenuOpen = false;

  readonly publicNavItems: NavItem[] = [
    { label: 'Inicio', routerLink: '/', icon: 'pi pi-home' },
    { label: 'Quiénes Somos', routerLink: '/quienes-somos', icon: 'pi pi-users' },
    { label: 'Políticas', routerLink: '/politicas', icon: 'pi pi-shield' },
    { label: 'Contactos', routerLink: '/contacto', icon: 'pi pi-phone' },
  ];

  readonly authNavItems: NavItem[] = [
    { label: 'Login', routerLink: '/login', icon: 'pi pi-sign-in' },
    // { label: 'Registro', routerLink: '/registro', icon: 'pi pi-user-plus' },
  ];

  readonly authenticatedNavItems = computed<NavItem[]>(() => {
    const role = this.userRole();
    if (!role) return [];

    switch (role) {
      case 'cliente':
        return [
          { label: 'Inicio', routerLink: '/cliente/inicio', icon: 'pi pi-home' },
          { label: 'Dashboard', routerLink: '/cliente/dashboard', icon: 'pi pi-th-large' },
          { label: 'Cuentas', routerLink: '/cliente/cuentas', icon: 'pi pi-wallet' },
          { label: 'Transferencia', routerLink: '/cliente/transferencia', icon: 'pi pi-send' },
        ];
      case 'intermediario':
        return [
          { label: 'Dashboard', routerLink: '/intermediario', icon: 'pi pi-th-large' },
        ];
      default:
        return [];
    }
  });

  readonly userName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }
}
