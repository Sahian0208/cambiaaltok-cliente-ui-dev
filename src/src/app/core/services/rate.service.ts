import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, interval, of, map, tap, timeout, catchError } from 'rxjs';
import { ExchangeRate } from '../models/rate.model';
import { environment } from '../../../environments/environment';
import { ApiResponse } from 'bc-primeng-ui';

interface ExchangeRateClientDto {
  exchangeRateValue: number;
  exchangeRateBuy: number;
  exchangeRateSell: number;
  source: string;
  updatedAt: string;
}

/**
 * Pure function for currency conversion.
 * Converts an amount from one currency to another using the provided rate.
 */
export function convertCurrency(
  amount: number,
  from: 'BOB' | 'PEN',
  rate: ExchangeRate
): number {
  if (amount <= 0) return 0;
  if (from === 'BOB') {
    if (!rate.exchangeRateSell) return 0;
    return Math.round((amount / rate.exchangeRateSell) * 100) / 100;
  }

  return Math.round((amount * rate.exchangeRateBuy) * 100) / 100;
}

@Injectable({ providedIn: 'root' })
export class RateService {
  private readonly http = inject(HttpClient);
  private readonly defaultSpreadPercent = 0.02;
  private readonly spreadPercentValue = signal(this.defaultSpreadPercent);

  private currentRate = signal<ExchangeRate | null>(null);
  private cachedRate: ExchangeRate | null = null;
  private pollingSubscription: Subscription | null = null;

  readonly rate = this.currentRate.asReadonly();
  readonly spreadPercent = this.spreadPercentValue.asReadonly();

  /**
   * Fetches current PEN->BOB exchange rates from backend (buy/sell values).
   * Applies a 5-second timeout; on timeout or error, falls back to cached rate.
   */
  fetchRateFromApi(): Observable<ExchangeRate> {
    const rateApiUrl = `${environment.apiBaseUrl}/v1/exchange-rate/current/PEN/BOB`;

    return this.http.get<ApiResponse<ExchangeRateClientDto>>(rateApiUrl).pipe(
      timeout(5000),
      map(response => {
        const apiRate = response.data;
        const parsedUpdatedAt = new Date(apiRate.updatedAt);
        const rate: ExchangeRate = {
          exchangeRateBuy: apiRate.exchangeRateBuy,
          exchangeRateSell: apiRate.exchangeRateSell,
          source: apiRate.source ?? 'api',
          updatedAt: Number.isNaN(parsedUpdatedAt.getTime())
            ? new Date().toISOString()
            : parsedUpdatedAt.toISOString()
        };
        return rate;
      }),
      tap(rate => {
        this.currentRate.set(rate);
        this.cachedRate = rate;
      }),
      catchError(() => {
        if (this.cachedRate) {
          this.currentRate.set(this.cachedRate);
          return of(this.cachedRate);
        }
        return of(null as unknown as ExchangeRate);
      })
    );
  }

  private roundTo4(value: number): number {
    return Math.round(value * 10000) / 10000;
  }

  setCouponSpreadPercent(spreadPercent: number): void {
    if (!Number.isFinite(spreadPercent) || spreadPercent <= 0) {
      this.spreadPercentValue.set(this.defaultSpreadPercent);
      return;
    }
    this.spreadPercentValue.set(spreadPercent);
  }

  resetSpreadPercent(): void {
    this.spreadPercentValue.set(this.defaultSpreadPercent);
  }

  /**
   * Returns the effective rate with spread applied.
   * The spread reduces the platform's margin, benefiting the client.
   * A lower spread (from a coupon) means a better rate for the client:
   * - Buy rate (PEN→BOB): increased → client gets more BOB per PEN.
   * - Sell rate (BOB→PEN): decreased → client needs fewer BOB to get PEN.
   */
  getEffectiveRate(): ExchangeRate {
    const baseRate = this.currentRate() ?? this.cachedRate;
    if (!baseRate) {
      return { exchangeRateBuy: 0, exchangeRateSell: 0, source: 'api', updatedAt: new Date().toISOString() };
    }

    const spread = this.spreadPercentValue();
    // A lower spread benefits the client: buy goes UP, sell goes DOWN
    const adjustedBuy = this.roundTo4(baseRate.exchangeRateBuy * (1 + spread));
    const adjustedSell = this.roundTo4(baseRate.exchangeRateSell * (1 - spread));

    return {
      exchangeRateBuy: adjustedBuy,
      exchangeRateSell: adjustedSell,
      source: baseRate.source,
      updatedAt: baseRate.updatedAt,
    };
  }

  /**
   * Converts an amount using the effective rate.
   */
  convertAmount(amount: number, from: 'BOB' | 'PEN'): number {
    const rate = this.getEffectiveRate();
    return convertCurrency(amount, from, rate);
  }

  /**
   * Conversion rate to apply based on origin currency.
   */
  getConversionRate(from: 'BOB' | 'PEN'): number {
    const rate = this.getEffectiveRate();
    if (from === 'BOB') {
      return rate.exchangeRateSell ? 1 / rate.exchangeRateSell : 0;
    }
    return rate.exchangeRateBuy;
  }

  /**
   * Starts polling the API at the specified interval.
   * Performs an immediate fetch, then polls at the given interval.
   */
  startPolling(intervalMs: number = environment.ratePollingInterval): void {
    this.stopPolling();
    this.fetchRateFromApi().subscribe();
    this.pollingSubscription = interval(intervalMs).subscribe(() => {
      this.fetchRateFromApi().subscribe();
    });
  }

  /**
   * Stops the polling subscription.
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }
}
