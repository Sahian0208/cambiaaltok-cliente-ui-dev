import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models/user.model';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let currentUserSignal: WritableSignal<User | null>;

  const mockUser: User = {
    id: '1',
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+59172237251',
    documentType: 'CI',
    documentNumber: '12345678',
    birthDate: '1990-01-01',
    email: 'juan@test.com',
    passwordHash: 'hash',
    role: 'cliente',
    registeredAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    currentUserSignal = signal<User | null>(null);

    mockAuthService = jasmine.createSpyObj('AuthService', ['logout', 'getCurrentUser'], {
      isAuthenticated: signal(false),
      userRole: signal<UserRole | null>(null),
    });
    mockAuthService.getCurrentUser.and.returnValue(currentUserSignal.asReadonly());

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have public navigation items', () => {
    expect(component.publicNavItems.length).toBe(4);
    expect(component.publicNavItems[0].label).toBe('Inicio');
    expect(component.publicNavItems[1].label).toBe('Quiénes Somos');
    expect(component.publicNavItems[2].label).toBe('Políticas');
    expect(component.publicNavItems[3].label).toBe('Contactos');
  });

  it('should have auth navigation items for unauthenticated users', () => {
    expect(component.authNavItems.length).toBe(2);
    expect(component.authNavItems[0].label).toBe('Login');
    expect(component.authNavItems[1].label).toBe('Registro');
  });

  it('should toggle mobile menu', () => {
    expect(component.mobileMenuOpen).toBeFalse();
    component.toggleMobileMenu();
    expect(component.mobileMenuOpen).toBeTrue();
    component.toggleMobileMenu();
    expect(component.mobileMenuOpen).toBeFalse();
  });

  it('should close mobile menu', () => {
    component.mobileMenuOpen = true;
    component.closeMobileMenu();
    expect(component.mobileMenuOpen).toBeFalse();
  });

  it('should call authService.logout on logout', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should render the brand name CambiaAltok', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.navbar-logo-text')?.textContent).toContain('CambiaAltok');
  });

  it('should show public nav links in the DOM', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('.navbar-nav .nav-link');
    expect(navLinks.length).toBeGreaterThanOrEqual(4);
  });
});
