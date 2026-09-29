import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CouponService } from '../../../core/services/coupon.service';
import { AuthService } from '../../../core/services/auth.service';
import { MyCouponSummary } from '../../../core/models/coupon.model';

@Component({
  selector: 'app-my-coupon-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-coupon-summary.component.html',
  styleUrls: ['./my-coupon-summary.component.scss'],
})
export class MyCouponSummaryComponent implements OnInit {
  private readonly couponService = inject(CouponService);
  private readonly authService = inject(AuthService);

  coupon = signal<MyCouponSummary | null>(null);
  loading = signal(true);
  error = signal(false);

  ngOnInit(): void {
    const user = this.authService.getCurrentUser()();
    if (!user) {
      this.loading.set(false);
      return;
    }

    this.couponService.getMyCoupon(user.id).subscribe({
      next: (data) => {
        this.coupon.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
