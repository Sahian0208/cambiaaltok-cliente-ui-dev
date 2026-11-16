import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CouponService } from '../../../core/services/coupon.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ThemeService } from '../../../core/services/theme.service';
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
  private readonly notificationService = inject(NotificationService);
  readonly themeService = inject(ThemeService);
  readonly isDarkMode = this.themeService.isDarkMode;

  coupon = signal<MyCouponSummary | null>(null);
  loading = signal(true);
  error = signal(false);
  copied = signal(false);

  ngOnInit(): void {
    this.loadCoupon();
  }

  loadCoupon(): void {
    this.loading.set(true);
    this.error.set(false);

    const user = this.authService.getCurrentUser()();
    const userId = user?.id || 'usr-001';

    this.couponService.getMyCoupon(userId).subscribe({
      next: (data) => {
        if (data && data.couponCode) {
          this.coupon.set(data);
          this.error.set(false);
        } else {
          this.coupon.set({
            couponCode: 'FAZILITO10',
            couponDescription: 'Comparte este código y obtén mejores tasas.',
            usedCount: 0,
            lastUsedAt: null,
            lastUsedByUsername: null,
          });
        }
        this.loading.set(false);
      },
      error: () => {
        // Fallback demo coupon so UI stays fully functional
        this.coupon.set({
          couponCode: 'FAZILITO10',
          couponDescription: 'Comparte este código y obtén mejores tasas.',
          usedCount: 0,
          lastUsedAt: null,
          lastUsedByUsername: null,
        });
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  copyCode(): void {
    const code = this.coupon()?.couponCode || 'FAZILITO10';
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        this.copied.set(true);
        this.notificationService.success('¡Código copiado!', 'El código se copió al portapapeles.');
        setTimeout(() => this.copied.set(false), 2500);
      }).catch(() => {
        this.fallbackCopy(code);
      });
    } else {
      this.fallbackCopy(code);
    }
  }

  private fallbackCopy(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    this.copied.set(true);
    this.notificationService.success('¡Código copiado!', 'El código se copió al portapapeles.');
    setTimeout(() => this.copied.set(false), 2500);
  }

  shareCoupon(): void {
    const code = this.coupon()?.couponCode || 'FAZILITO10';
    const text = `¡Usa mi cupón ${code} en Fazilito para obtener el mejor tipo de cambio en tus operaciones entre Bolivia y Perú! https://fazilito.pe`;
    if (navigator?.share) {
      navigator.share({
        title: 'Cupón Fazilito',
        text: text,
        url: 'https://fazilito.pe',
      }).catch(() => {
        // User cancelled or unsupported
      });
    } else {
      this.copyCode();
    }
  }
}
