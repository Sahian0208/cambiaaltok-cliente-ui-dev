import { Component, computed, inject, signal, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: 'bc-navbar',
  templateUrl: './bc-navbar.component.html',
  styleUrl: './bc-navbar.component.css',
  standalone: true,
  imports: [CommonModule, RouterLink],
})
export default class BCNavBar {
  mobileMenuOpen = signal(false);
  registerMenuOpen = signal(false);

  private router = inject(Router);
  authService = inject(AuthService);

  // Computed display name: firstName + lastName
  userDisplayName = computed(() => {
    const u = this.authService.getCurrentUser()();
    if (!u) return '';
    const parts = [u.firstName, u.lastName].filter(Boolean);
    return parts.join(' ') || u.email || '';
  });
  
  
  logout() {
    this.authService.logout();
  }

  toggleRegisterMenu(): void {
    this.registerMenuOpen.set(!this.registerMenuOpen());
  }

  closeRegisterMenu(): void {
    this.registerMenuOpen.set(false);
  }

  navigateToRegister(type: 'persona' | 'empresa'): void {
    this.closeRegisterMenu();
    this.closeMobileMenu();
    this.router.navigateByUrl(type === 'persona' ? '/registro-persona' : '/registro-empresa');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.register-menu-container')) {
      this.closeRegisterMenu();
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  scrollToSection(sectionId: string): void {
    this.closeMobileMenu();
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  //navigates to page or section (within home route)
  navigateToPage(sectionOrRoute : string)
  {
    if(this.isInHomeRoute())
    {
      this.scrollToSection(sectionOrRoute);
    }
    else
    {
      this.router.navigateByUrl("/"+sectionOrRoute);
    }
  }


  isInHomeRoute() : Boolean
  {    
    if(this.router)
      return this.router.url.length == 1 && this.router.url.indexOf("/") == 0;
  
    return false;

  }

}
