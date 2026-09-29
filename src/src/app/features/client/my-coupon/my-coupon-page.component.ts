import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyCouponSummaryComponent } from '../../../shared/components/my-coupon-summary/my-coupon-summary.component';

@Component({
  selector: 'app-my-coupon-page',
  standalone: true,
  imports: [CommonModule, MyCouponSummaryComponent],
  templateUrl: './my-coupon-page.component.html',
  styleUrls: ['./my-coupon-page.component.scss'],
})
export class MyCouponPageComponent {}
