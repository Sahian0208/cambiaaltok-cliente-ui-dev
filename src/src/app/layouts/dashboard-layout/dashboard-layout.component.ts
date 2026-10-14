import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';
import { RateService } from '../../core/services/rate.service';
import { SignalrService } from '../../core/services/signalr.service';
import { ThemeService } from '../../core/services/theme.service';

interface SidebarItem {
  label: string;
  routerLink: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ButtonModule],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
})
export class DashboardLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly rateService = inject(RateService);
  private readonly signalrService = inject(SignalrService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  readonly currentUser = this.authService.getCurrentUser();
  readonly userRole = this.authService.userRole;
  readonly rate = this.rateService.rate;

  ngOnInit(): void {
    this.themeService.initTheme();
  }

  sidebarCollapsed = false;
  mobileSidebarOpen = false;

  readonly userName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Carlos Alberto Mamani Quispe';
  });

  readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'CM';
    const first = user.firstName ? user.firstName[0].toUpperCase() : '';
    const last = user.lastName ? user.lastName[0].toUpperCase() : '';
    return `${first}${last}` || 'CM';
  });

  readonly currentRouteTitle = computed(() => {
    const url = this.router.url;
    if (url.includes('dashboard')) return 'Dashboard';
    if (url.includes('inicio')) return 'Inicio';
    if (url.includes('cuentas')) return 'Cuentas';
    if (url.includes('transferencia')) return 'Transferencias';
    if (url.includes('micupon')) return 'Cupones';
    if (url.includes('perfil')) return 'Mis datos';
    if (url.includes('cambiar-password')) return 'Seguridad';
    return 'Dashboard';
  });

  readonly sidebarItems = computed<SidebarItem[]>(() => {
    const role = this.userRole();
    if (!role) return [];

    switch (role) {
      case 'cliente':
        return [          
          { label: 'Inicio', routerLink: '/cliente/inicio', icon: 'pi pi-home' },
          { label: 'Dashboard', routerLink: '/cliente/dashboard', icon: 'pi pi-th-large' },
          { label: 'Cuentas', routerLink: '/cliente/cuentas', icon: 'pi pi-wallet' },
          { label: 'Transferencias', routerLink: '/cliente/transferencia', icon: 'pi pi-send' },
          { label: 'Cupones', routerLink: '/cliente/micupon', icon: 'pi pi-gift' },
          { label: 'Mis datos', routerLink: '/cliente/perfil', icon: 'pi pi-user' },
          { label: 'Seguridad', routerLink: '/cliente/cambiar-password', icon: 'pi pi-shield' },
        ];
      case 'intermediario':
        return [
          { label: 'Dashboard', routerLink: '/intermediario', icon: 'pi pi-th-large' },
          { label: 'Mis datos', routerLink: '/cliente/perfil', icon: 'pi pi-user' },
          { label: 'Seguridad', routerLink: '/cliente/cambiar-password', icon: 'pi pi-shield' },
          { label: 'Ir al Portal', routerLink: '/', icon: 'pi pi-building' },
        ];
      default:
        return [];
    }
  });

  readonly rateDisplay = computed(() => {
    const rate = this.rate();
    if (!rate) return null;
    return {
      buy: rate.exchangeRateBuy,
      sell: rate.exchangeRateSell,
      lastUpdate: new Date(rate.updatedAt).toLocaleString(),
      source: rate.source,
    };
  });

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  logout(): void {
    this.signalrService.stopConnection();
    this.authService.logout();
  }
}
