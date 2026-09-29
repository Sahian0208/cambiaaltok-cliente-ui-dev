import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SharedViewPortDirective } from '../../../shared/directives';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { BetterRateUploadComponent } from '../../../shared/components/better-rate-upload/better-rate-upload.component';
import { CalculatorComponent } from '../../../shared/components/calculator/calculator.component';
import { BanksPromotionComponent } from './components/banks-promotion/banks-promotion.component';
import { CommonModule } from '@angular/common';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { ContactComponent } from "./components/contact/contact.component";
import { EnterpriseComponent } from './components/enterprise-component/enterprise-component';

@Component({
  selector: 'bc-home',
  templateUrl: './bc-home.html',
  styleUrl: './bc-home.css',
  standalone: true,
  imports: [
    CommonModule,
    SharedViewPortDirective,
    HowItWorksComponent,
    BetterRateUploadComponent,
    CalculatorComponent,
    BanksPromotionComponent,
    AboutUsComponent,
    ContactComponent,
    EnterpriseComponent,
],
})
export default class BCHome {
  private readonly router = inject(Router);

  tipoCambio = signal<'BOB_TO_PEN' | 'PEN_TO_BOB'>('BOB_TO_PEN');
  rightPanel = signal<'calculator' | 'enterprise'>('calculator');
  activePromotionIndex = signal(0);

  goToPersonRegister(): void {
    this.router.navigate(['/registro-persona']);
  }

  goToCompanyRegister(): void {
    this.router.navigate(['/registro-empresa']);
  }

  showCalculatorPanel(): void {
    this.rightPanel.set('calculator');
  }

  showEnterprisePanel(): void {
    this.rightPanel.set('enterprise');
  }
}
