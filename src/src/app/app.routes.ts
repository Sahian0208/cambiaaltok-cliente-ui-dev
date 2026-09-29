import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

// Layouts
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';



// Client pages
import { ClientDashboardComponent } from './features/client/dashboard/client-dashboard.component';
import { ClientHomeComponent } from './features/client/client-home/client-home.component';
import { AccountsComponent } from './features/client/accounts/accounts.component';
import { TransferComponent } from './features/client/transfer/transfer.component';
import { ProfileComponent } from './features/client/profile/profile.component';
import { ChangePasswordComponent } from './features/client/change-password/change-password.component';
import { MyCouponPageComponent } from './features/client/my-coupon/my-coupon-page.component';

// Intermediary pages
import { IntermediaryDashboardComponent } from './features/intermediary/dashboard/intermediary-dashboard.component';
import { VerifyComponent } from './features/intermediary/verify/verify.component';

// Admin pages

import { CallbackComponent } from './core/components/callback.component';

import BCHome from './features/public/bc-home/bc-home';
import { LoginComponent } from './features/auth/login/login.component';

export const routes: Routes = [
  //Rutas públicas
  // {
  //   path: '',
  //   component: PublicLayoutComponent,
  //   children: [
  //     { path: '', component: HomeComponent },
  //     { path: 'quienes-somos', component: AboutComponent },
  //     { path: 'politicas', component: PrivacyComponent },
  //     { path: 'contacto', component: ContactComponent },
  //   ],
  // },

  {
    path: '',
    loadComponent: () =>
      import('./layouts/bc-public-layout/bc-public-layout.component'),

    children: [
      {
        path: '',
        component : BCHome        
      },
      {
        path: 'registro-persona',
        loadComponent: () => import('./features/public/register-person/register-person.component').then(m => m.RegisterPersonComponent),
      },
      {
        path: 'registro-empresa',
        loadComponent: () => import('./features/public/register-company/register-company.component').then(m => m.RegisterCompanyComponent),
      },
      {
        path: 'about-us',
        loadComponent: () => import('./features/public/bc-home/components/about-us/about-us.component').then(m => m.AboutUsComponent),
      },
      {
        path: 'how-it-works',
        loadComponent: () => import('./features/public/bc-home/components/how-it-works/how-it-works.component').then(m => m.HowItWorksComponent),
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/public/bc-home/components/contact/contact.component').then(m => m.ContactComponent),
      },
    ],
  },

  
 

   // Autenticación — OAuth redirect
  {
    path: 'login',
    component: LoginComponent,
  },
  

  // Dashboard Cliente
  {
    path: 'cliente',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard(['cliente'])],
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: ClientHomeComponent },
      { path: 'dashboard', component: ClientDashboardComponent },
      { path: 'cuentas', component: AccountsComponent },
      { path: 'transferencia', component: TransferComponent },
      { path: 'transferencia/:id', component: TransferComponent },
      { path: 'perfil', component: ProfileComponent },
      { path: 'cambiar-password', component: ChangePasswordComponent },
      { path: 'micupon', component: MyCouponPageComponent },
    ],
  },

  // Dashboard Intermediario
  {
    path: 'intermediario',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard(['intermediario'])],
    children: [
      { path: '', component: IntermediaryDashboardComponent },
      { path: 'verificar/:id', component: VerifyComponent },
    ],
  },



    // OAuth callback (MUST be before wildcard)
  {
    path: 'auth/callback',
    component: CallbackComponent,
  },

  // Wildcard redirect a inicio
  { path: '**', redirectTo: '' },
];
