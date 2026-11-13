import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RateService } from '../../../core/services/rate.service';
import { AuthService } from '../../../core/services/auth.service';
import { CouponService } from '../../../core/services/coupon.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CalculatorTransferData } from '../../../core/models/calculator-transfer-data.model';

export type CurrencyCode = 'USD' | 'PEN' | 'BOB';

export interface CurrencyItem {
  code: CurrencyCode;
  label: string;
  symbol: string;
  flag: string;
}

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-home.component.html',
  styleUrls: ['./client-home.component.scss'],
})
export class ClientHomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly rateService = inject(RateService);
  private readonly authService = inject(AuthService);
  private readonly couponService = inject(CouponService);
  private readonly notificationService = inject(NotificationService);
  readonly themeService = inject(ThemeService);

  readonly currencies: CurrencyItem[] = [
    { code: 'USD', label: 'Dólares', symbol: '$', flag: '🇺🇸' },
    { code: 'PEN', label: 'Soles', symbol: 'S/', flag: '🇵🇪' },
    { code: 'BOB', label: 'Bolivianos', symbol: 'Bs', flag: '🇧🇴' },
  ];

  // Active Rate Tab
  readonly activeTab = signal<'compra' | 'venta'>('compra');

  // Currency selection
  readonly currencyFrom = signal<CurrencyItem>(this.currencies[0]); // Dólares
  readonly currencyTo = signal<CurrencyItem>(this.currencies[1]);   // Soles

  // Currency Dropdown States
  readonly fromDropdownOpen = signal<boolean>(false);
  readonly toDropdownOpen = signal<boolean>(false);

  // Amounts
  readonly amountFrom = signal<number>(100);
  readonly amountFromInput = signal<string>('100');
  readonly amountToInput = signal<string>('338.50');

  // Rates
  readonly buyRate = signal<number>(3.385);
  readonly sellRate = signal<number>(3.420);

  // Swap rotation animation
  readonly swapRotation = signal<number>(0);

  // Koinks & User
  readonly userKoinks = signal<number>(2106);
  readonly showKoinksRedemption = signal<boolean>(false);

  // Coupons
  readonly couponCodeInput = signal<string>('');
  readonly appliedCouponCode = signal<string | null>(null);
  readonly couponDiscount = signal<number>(0);
  readonly isApplyingCoupon = signal<boolean>(false);

  // Cards Accordion / Tabs
  readonly showBankDetails = signal<boolean>(true);
  readonly showDeferredDetails = signal<boolean>(false);
  readonly selectedBankCountry = signal<'peru' | 'bolivia'>('peru');

  // Current User Info
  readonly currentUser = this.authService.getCurrentUser();
  readonly userName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Carlos Alberto Mamani';
  });

  // Dynamic Savings Calculation
  readonly estimatedSavings = computed(() => {
    const amt = this.amountFrom();
    if (!amt || amt <= 0) return '0.00';
    // Approximately 1.5% saving compared to traditional retail banks
    const val = amt * (this.currencyFrom().code === 'USD' ? 0.0508 : 0.015);
    const sym = this.currencyTo().symbol;
    return `${sym} ${val.toFixed(2)}`;
  });

  // Dynamic Koinks Earned Calculation (1 Koink per $1 or ~3.5 S/)
  readonly earnedKoinks = computed(() => {
    const amt = this.amountFrom();
    if (!amt || amt <= 0) return 0;
    if (this.currencyFrom().code === 'USD') return Math.round(amt);
    if (this.currencyFrom().code === 'PEN') return Math.round(amt / 3.38);
    return Math.round(amt / 6.9);
  });

  ngOnInit(): void {
    // Attempt to load live rates from RateService if available
    this.rateService.fetchRateFromApi().subscribe({
      next: (rate) => {
        if (rate && rate.exchangeRateBuy && rate.exchangeRateSell) {
          // If available from API, use them or keep the default calibrated rates
          if (rate.exchangeRateBuy > 0) this.buyRate.set(rate.exchangeRateBuy);
          if (rate.exchangeRateSell > 0) this.sellRate.set(rate.exchangeRateSell);
          this.calculateToAmount();
        }
      },
      error: () => {
        // Fallback already pre-set to 3.385 / 3.420
        this.calculateToAmount();
      }
    });

    this.calculateToAmount();
  }

  // Set Compra or Venta tab
  setTab(tab: 'compra' | 'venta'): void {
    this.activeTab.set(tab);
    this.calculateToAmount();
  }

  // Swap currencies
  onSwapCurrencies(): void {
    this.swapRotation.update((r) => r + 180);
    const prevFrom = this.currencyFrom();
    const prevTo = this.currencyTo();

    this.currencyFrom.set(prevTo);
    this.currencyTo.set(prevFrom);

    // If swapping, also toggle Compra/Venta to match exchange direction logic
    this.activeTab.set(this.activeTab() === 'compra' ? 'venta' : 'compra');

    this.calculateToAmount();
  }

  // Select From Currency
  selectFromCurrency(c: CurrencyItem): void {
    this.currencyFrom.set(c);
    this.fromDropdownOpen.set(false);
    if (this.currencyTo().code === c.code) {
      // Pick alternative
      const alternative = this.currencies.find(x => x.code !== c.code) || this.currencies[0];
      this.currencyTo.set(alternative);
    }
    this.calculateToAmount();
  }

  // Select To Currency
  selectToCurrency(c: CurrencyItem): void {
    this.currencyTo.set(c);
    this.toDropdownOpen.set(false);
    if (this.currencyFrom().code === c.code) {
      // Pick alternative
      const alternative = this.currencies.find(x => x.code !== c.code) || this.currencies[1];
      this.currencyFrom.set(alternative);
    }
    this.calculateToAmount();
  }

  // Calculation Engine
  calculateToAmount(): void {
    const fromAmt = this.amountFrom();
    if (!fromAmt || fromAmt <= 0) {
      this.amountToInput.set('0.00');
      return;
    }

    const fromCode = this.currencyFrom().code;
    const toCode = this.currencyTo().code;
    const isCompra = this.activeTab() === 'compra';
    const rate = isCompra ? this.buyRate() : this.sellRate();

    let result = 0;

    if (fromCode === 'USD' && toCode === 'PEN') {
      result = isCompra ? fromAmt * rate : fromAmt * rate;
    } else if (fromCode === 'PEN' && toCode === 'USD') {
      result = isCompra ? fromAmt / rate : fromAmt / rate;
    } else if (fromCode === 'BOB' && toCode === 'PEN') {
      // Bolivianos a Soles (approx 0.52 - 0.53)
      const bobRate = isCompra ? 0.525 : 0.535;
      result = fromAmt * bobRate;
    } else if (fromCode === 'PEN' && toCode === 'BOB') {
      // Soles a Bolivianos (approx 1.90 - 1.93)
      const penToBobRate = isCompra ? 1.91 : 1.93;
      result = fromAmt * penToBobRate;
    } else if (fromCode === 'USD' && toCode === 'BOB') {
      // Dólares a Bolivianos (approx 6.96)
      result = fromAmt * 6.96;
    } else if (fromCode === 'BOB' && toCode === 'USD') {
      result = fromAmt / 6.96;
    } else {
      result = fromAmt;
    }

    // Apply coupon discount or bonus if present
    if (this.couponDiscount() > 0) {
      result += this.couponDiscount();
    }

    this.amountToInput.set(result.toFixed(2));
  }

  // Numeric input handler
  onFromAmountInput(value: string): void {
    const sanitized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
    this.amountFromInput.set(sanitized);

    const parsed = parseFloat(sanitized);
    if (!isNaN(parsed) && parsed >= 0) {
      this.amountFrom.set(parsed);
      this.calculateToAmount();
    } else {
      this.amountFrom.set(0);
      this.amountToInput.set('0.00');
    }
  }

  // Reverse calculation when user types in destination
  onToAmountInput(value: string): void {
    const sanitized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
    this.amountToInput.set(sanitized);

    const desired = parseFloat(sanitized);
    if (isNaN(desired) || desired <= 0) {
      this.amountFrom.set(0);
      this.amountFromInput.set('0');
      return;
    }

    const fromCode = this.currencyFrom().code;
    const toCode = this.currencyTo().code;
    const isCompra = this.activeTab() === 'compra';
    const rate = isCompra ? this.buyRate() : this.sellRate();

    let computedSource = desired;
    if (fromCode === 'USD' && toCode === 'PEN') {
      computedSource = desired / rate;
    } else if (fromCode === 'PEN' && toCode === 'USD') {
      computedSource = desired * rate;
    } else if (fromCode === 'BOB' && toCode === 'PEN') {
      computedSource = desired / 0.525;
    } else if (fromCode === 'PEN' && toCode === 'BOB') {
      computedSource = desired / 1.91;
    }

    this.amountFrom.set(parseFloat(computedSource.toFixed(2)));
    this.amountFromInput.set(computedSource.toFixed(2));
  }

  // Apply Coupon
  applyCoupon(): void {
    const code = this.couponCodeInput().trim().toUpperCase();
    if (!code) {
      this.notificationService.error('Cupón vacío', 'Ingresa un código de cupón.');
      return;
    }

    this.isApplyingCoupon.set(true);

    // Validate coupon or apply demo bonus
    setTimeout(() => {
      this.isApplyingCoupon.set(false);
      this.appliedCouponCode.set(code);
      this.couponDiscount.set(3.50); // Gives S/ 3.50 bonus
      this.calculateToAmount();
      this.notificationService.success('¡Cupón aplicado!', `El cupón ${code} te otorgó una mejora de tasa.`);
    }, 400);
  }

  removeCoupon(): void {
    this.appliedCouponCode.set(null);
    this.couponDiscount.set(0);
    this.couponCodeInput.set('');
    this.calculateToAmount();
  }

  // Redeem Koinks
  redeemKoinks(points: number): void {
    if (this.userKoinks() < points) {
      this.notificationService.error('Koinks insuficientes', `Necesitas ${points} Koinks para esta mejora.`);
      return;
    }
    this.userKoinks.update(k => k - points);
    this.couponDiscount.update(d => d + (points / 200));
    this.calculateToAmount();
    this.notificationService.success('¡Koinks canjeados!', `Se han canjeado ${points} Koinks por un descuento extra.`);
  }

  // Start Transaction -> Redirect to Transfer flow
  startOperation(): void {
    const sourceAmt = this.amountFrom();
    const destAmt = parseFloat(this.amountToInput()) || 0;

    const srcCurrency: 'BOB' | 'PEN' = this.currencyFrom().code === 'BOB' ? 'BOB' : 'PEN';
    const destCurrency: 'BOB' | 'PEN' = this.currencyTo().code === 'BOB' ? 'BOB' : 'PEN';

    const transferData: CalculatorTransferData = {
      sourceAmount: sourceAmt,
      sourceCurrency: srcCurrency,
      destinationAmount: destAmt,
      destinationCurrency: destCurrency,
      appliedRate: this.activeTab() === 'compra' ? this.buyRate() : this.sellRate(),
      sourceCountry: srcCurrency === 'BOB' ? 'Bolivia' : 'Perú',
      destinationCountry: destCurrency === 'BOB' ? 'Bolivia' : 'Perú',
      coupon: this.appliedCouponCode() ? {
        code: this.appliedCouponCode()!,
        bonusAmount: this.couponDiscount(),
        bonusCurrency: destCurrency,
        reason: 'Descuento cupón Fazilito',
        spreadPercent: 0.015,
      } : null,
    };

    this.router.navigate(['/cliente/transferencia'], { state: { calculatorData: transferData } });
  }

  // Navigation helpers
  goToCupones(): void {
    this.router.navigate(['/cliente/micupon']);
  }

  toggleKoinksSection(): void {
    this.showKoinksRedemption.update(v => !v);
  }

  toggleBankDetails(): void {
    this.showBankDetails.update(v => !v);
  }

  toggleDeferredDetails(): void {
    this.showDeferredDetails.update(v => !v);
  }

  setBankCountry(country: 'peru' | 'bolivia'): void {
    this.selectedBankCountry.set(country);
  }
}
