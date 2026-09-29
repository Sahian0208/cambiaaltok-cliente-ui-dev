import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalculatorComponent } from '../../../shared/components/calculator/calculator.component';
import { MyCouponSummaryComponent } from '../../../shared/components/my-coupon-summary/my-coupon-summary.component';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, CalculatorComponent, MyCouponSummaryComponent],
  templateUrl: './client-home.component.html',
  styleUrls: ['./client-home.component.scss'],
})
export class ClientHomeComponent {
  tipoCambio = signal<'BOB_TO_PEN' | 'PEN_TO_BOB'>('BOB_TO_PEN');
}
