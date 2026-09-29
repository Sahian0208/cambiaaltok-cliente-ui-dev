import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-enterprise-component',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    ButtonModule,
  ],
  templateUrl: './enterprise-component.html',
  styleUrl: './enterprise-component.scss',
})
export class EnterpriseComponent {
  enterprisePhoneCountry = signal<'PE' | 'BO'>('PE');
  enterprisePhoneDialCode = computed(() => this.enterprisePhoneCountry() === 'PE' ? '+51' : '+591');
  enterprisePhoneFlag = computed(() => this.enterprisePhoneCountry() === 'PE' ? '🇵🇪' : '🇧🇴');

  toggleEnterprisePhoneCountry() {
    this.enterprisePhoneCountry.set(this.enterprisePhoneCountry() === 'PE' ? 'BO' : 'PE');
  }
}
