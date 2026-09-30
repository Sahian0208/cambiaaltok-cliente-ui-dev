import { Component, computed, effect, inject, signal, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { RateService } from '../../../core/services/rate.service';
import { CouponService } from '../../../core/services/coupon.service';
import { AppliedCoupon } from '../../../core/models/coupon.model';
import { AuthService } from '../../../core/services/auth.service';
import { CalculatorTransferData } from '../../../core/models/calculator-transfer-data.model';

interface CurrencyOption {
  label: string;
  value: 'BOB' | 'PEN';
}

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculator.component.html',
})
export class CalculatorComponent {
  @Output() swapped = new EventEmitter<'BOB_TO_PEN' | 'PEN_TO_BOB'>();

  private readonly router = inject(Router);
  private readonly rateService = inject(RateService);
  private readonly couponService = inject(CouponService);
   private readonly authService = inject(AuthService);

  readonly currencyOptions: CurrencyOption[] = [
    { label: 'BOB', value: 'BOB' },
    { label: 'PEN', value: 'PEN' },
  ];

  readonly amount = signal<number | null>(null);
  readonly amountInput = signal('');
  readonly destinationAmountInput = signal('');
  readonly isEditingDestination = signal(false);
  readonly selectedCurrency = signal<CurrencyOption>(this.currencyOptions[0]);
  readonly swapRotation = signal(0);
  readonly couponCode = signal('');
  readonly isApplyingCoupon = signal(false);
  readonly couponError = signal<string | null>(null);
  readonly appliedCoupon = signal<AppliedCoupon | null>(null);

  readonly effectiveRate = computed(() => {
    // Re-read the rate signal to trigger reactivity
    this.rateService.rate();
    return this.rateService.getEffectiveRate();
  });

  readonly convertedAmount = computed(() => {
    const amt = this.amount();
    if (amt === null || amt <= 0) return 0;
    const from = this.selectedCurrency().value;
    return this.rateService.convertAmount(amt, from);
  });

  readonly currentSpreadPercent = computed(() =>
    this.rateService.spreadPercent(),
  );

  readonly convertedAmountDisplay = computed(() =>
    this.convertedAmount().toFixed(2),
  );

  readonly targetCurrency = computed(() => {
    return this.selectedCurrency().value === 'BOB' ? 'PEN' : 'BOB';
  });

  readonly tipoCambio = computed<'BOB_TO_PEN' | 'PEN_TO_BOB'>(() => {
    return this.selectedCurrency().value === 'BOB'
      ? 'BOB_TO_PEN'
      : 'PEN_TO_BOB';
  });

  readonly monedaBaseLabel = computed(() =>
    this.tipoCambio() === 'BOB_TO_PEN' ? 'boliviano' : 'sol',
  );

  readonly compraMostrada = computed(() => {
    const rate = this.effectiveRate();
    if (!rate) return 0;
    return rate.exchangeRateBuy;
  });

  readonly ventaMostrada = computed(() => {
    const rate = this.effectiveRate();
    if (!rate) return 0;
    return rate.exchangeRateSell;
  });

  readonly solesABolivianosCompra = computed(() => this.compraMostrada());
  readonly solesABolivianosVenta = computed(() => this.ventaMostrada());
  
  readonly bolivianosASolesCompra = computed(() => {
    const v = this.ventaMostrada();
    return v > 0 ? Number((1 / v).toFixed(3)) : 0;
  });

  readonly bolivianosASolesVenta = computed(() => {
    const c = this.compraMostrada();
    return c > 0 ? Number((1 / c).toFixed(3)) : 0;
  });

  readonly appliedRate = computed(() => {
    const rate = this.effectiveRate();
    if (!rate) return null;
    const from = this.selectedCurrency().value;
    return this.rateService.getConversionRate(from);
  });

  readonly lastUpdated = computed(() => {
    const rate = this.effectiveRate();
    if (!rate) return null;
    return rate.updatedAt;
  });

  readonly rateSource = computed(() => {
    const rate = this.effectiveRate();
    if (!rate) return null;
    return rate.source;
  });

  setDirection(direction: 'PEN_TO_BOB' | 'BOB_TO_PEN'): void {
    const sourceCurrencyValue = direction === 'PEN_TO_BOB' ? 'PEN' : 'BOB';
    if (this.selectedCurrency().value !== sourceCurrencyValue) {
      const option = this.currencyOptions.find(o => o.value === sourceCurrencyValue);
      if (option) {
        this.selectedCurrency.set(option);
        this.swapped.emit(direction);
      }
    }
  }


  /** Button should only be enabled when both amounts have valid positive values */
  readonly canStartTransaction = computed(() => {
    const amt = this.amount();
    const dest = this.convertedAmount();
    return amt !== null && amt > 0 && dest > 0;
  });

  constructor() {
    effect(() => {
      if (this.isEditingDestination()) {
        return;
      }

      const sourceAmount = this.amount();
      if (sourceAmount === null || sourceAmount <= 0) {
        this.destinationAmountInput.set('');
        return;
      }

      this.destinationAmountInput.set(this.convertedAmount().toFixed(2));
    });
  }

  onAmountInput(value: string): void {
    this.isEditingDestination.set(false);
    const normalized = this.normalizeDecimalInput(value);
    this.amountInput.set(normalized);

    if (!normalized || normalized === '.') {
      this.amount.set(null);
      return;
    }

    const parsed = Number(normalized);
    this.amount.set(Number.isFinite(parsed) ? parsed : null);
  }

  onAmountBlur(): void {
    const amt = this.amount();
    if (amt === null || !Number.isFinite(amt)) {
      this.amountInput.set('');
      return;
    }

    const rounded = Number(amt.toFixed(2));
    this.amount.set(rounded);
    this.amountInput.set(rounded.toFixed(2));
  }

  onDestinationInput(value: string): void {
    this.isEditingDestination.set(true);
    const normalized = this.normalizeDecimalInput(value);
    this.destinationAmountInput.set(normalized);

    if (!normalized || normalized === '.') {
      this.amount.set(null);
      this.amountInput.set('');
      return;
    }

    const desiredAmount = Number(normalized);
    if (!Number.isFinite(desiredAmount) || desiredAmount <= 0) {
      this.amount.set(null);
      this.amountInput.set('');
      return;
    }

    const sourceCurrency = this.selectedCurrency().value;
    const conversionRate = this.rateService.getConversionRate(sourceCurrency);

    if (!Number.isFinite(conversionRate) || conversionRate <= 0) {
      this.amount.set(null);
      this.amountInput.set('');
      return;
    }

    const sourceAmount = desiredAmount / conversionRate;
    this.amount.set(sourceAmount);
    this.amountInput.set(sourceAmount.toFixed(2));
  }

  onDestinationBlur(): void {
    this.isEditingDestination.set(false);
    const desired = this.destinationAmountInput();
    if (!desired || desired === '.') {
      this.destinationAmountInput.set('');
      return;
    }

    const parsed = Number(desired);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      this.destinationAmountInput.set('');
      return;
    }

    this.destinationAmountInput.set(parsed.toFixed(2));
  }

  onCouponCodeChange(value: string): void {
    this.couponCode.set(value.toUpperCase());
    this.couponError.set(null);
  }

  onCurrencyChange(option: CurrencyOption): void {
    this.selectedCurrency.set(option);
  }

  toggleCurrency(): void {
    const current = this.selectedCurrency();
    const next =
      current.value === 'BOB'
        ? this.currencyOptions[1]
        : this.currencyOptions[0];
    this.selectedCurrency.set(next);
  }

  onSwapClick(): void {
    this.swapRotation.update((value) => value + 180);
    this.toggleCurrency();
    const newDir =
      this.selectedCurrency().value === 'BOB' ? 'BOB_TO_PEN' : 'PEN_TO_BOB';
    this.swapped.emit(newDir);
  }

  startTransaction(): void {
    
    if(!this.authService.isAuthenticated())
    {
      this.authService.loginWithOAuth();
      return;
    }

    const sourceAmount = this.amount()!;
    const sourceCurrency = this.selectedCurrency().value;
    const destinationCurrency = this.targetCurrency();
    const destinationAmount = this.convertedAmount();
    const rate = this.rateService.getConversionRate(sourceCurrency);
    const coupon = this.appliedCoupon();

    const transferData: CalculatorTransferData = {
      sourceAmount,
      sourceCurrency,
      destinationAmount,
      destinationCurrency,
      appliedRate: rate,
      sourceCountry: sourceCurrency === 'BOB' ? 'Bolivia' : 'Perú',
      destinationCountry: destinationCurrency === 'BOB' ? 'Bolivia' : 'Perú',
      coupon: coupon
        ? {
            code: coupon.code,
            bonusAmount: coupon.bonusAmount,
            bonusCurrency: coupon.bonusCurrency,
            reason: coupon.reason,
            spreadPercent: coupon.spreadPercent,
          }
        : null,
    };

    this.router.navigate(['/cliente/transferencia'], { state: { calculatorData: transferData } });
  }

  applyCoupon(): void {
    const code = this.couponCode().trim().toUpperCase();
    if (!code) {
      this.couponError.set('Ingresa un cupon para aplicar.');
      return;
    }

    if (this.isApplyingCoupon()) {
      return;
    }

    this.couponError.set(null);
    this.isApplyingCoupon.set(true);

    this.couponService
      .validateCoupon({
        code,
        userId: this.authService.getCurrentUser()()?.id,
        amount: this.amount() ?? 0,
        currencyFrom: this.selectedCurrency().value,
        currencyTo: this.targetCurrency(),
      })
      .pipe(
        catchError(() => {
          this.couponError.set('No se pudo validar el cupon en este momento.');
          return of(null);
        }),
        finalize(() => {
          this.isApplyingCoupon.set(false);
        }),
      )
      .subscribe((result) => {
        if (!result) {
          return;
        }        
        if (!result.isValid || result.spreadPercent <= 0) {
          this.appliedCoupon.set(null);
          this.couponError.set(
            result.message ?? 'Cupon invalido o ya utilizado.',
          );
          return;
        }

        this.rateService.setCouponSpreadPercent(result.spreadPercent);
        this.rateService.fetchRateFromApi().subscribe();

        this.appliedCoupon.set({
          code: result.code,
          bonusAmount: result.bonusAmount,
          bonusCurrency: result.bonusCurrency,
          reason: result.reason,
          spreadPercent: result.spreadPercent,
          message: result.message,
        });
        this.couponCode.set(result.code);
      });
  }

  removeCoupon(): void {
    this.appliedCoupon.set(null);
    this.couponError.set(null);
    this.rateService.resetSpreadPercent();
    this.rateService.fetchRateFromApi().subscribe();
  }

  private normalizeDecimalInput(value: string): string {
    const sanitized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const firstDotIndex = sanitized.indexOf('.');

    if (firstDotIndex === -1) {
      return sanitized;
    }

    const integerPart = sanitized.slice(0, firstDotIndex);
    const decimalPart = sanitized
      .slice(firstDotIndex + 1)
      .replace(/\./g, '')
      .slice(0, 2);
    return `${integerPart}.${decimalPart}`;
  }

  /**
   * Prevents non-numeric characters from being typed in the amount inputs.
   * Allows: digits, period, comma, Backspace, Delete, Tab, arrows, Home, End.
   */
  onNumericKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'];
    if (allowedKeys.includes(event.key)) return;

    // Allow Ctrl/Cmd combinations (copy, paste, select all)
    if (event.ctrlKey || event.metaKey) return;

    // Allow digits, period, and comma
    if (/^[\d.,]$/.test(event.key)) return;

    // Block everything else
    event.preventDefault();
  }
}
