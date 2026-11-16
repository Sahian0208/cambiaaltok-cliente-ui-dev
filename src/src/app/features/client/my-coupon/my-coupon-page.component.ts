import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyCouponSummaryComponent } from '../../../shared/components/my-coupon-summary/my-coupon-summary.component';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-my-coupon-page',
  standalone: true,
  imports: [CommonModule, MyCouponSummaryComponent],
  templateUrl: './my-coupon-page.component.html',
  styleUrls: ['./my-coupon-page.component.scss'],
})
export class MyCouponPageComponent {
  readonly themeService = inject(ThemeService);
  readonly isDarkMode = this.themeService.isDarkMode;
}
