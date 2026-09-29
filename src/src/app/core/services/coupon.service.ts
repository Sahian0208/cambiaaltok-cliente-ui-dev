import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MyCouponSummary, ValidateCouponRequest, ValidateCouponResponse } from '../models/coupon.model';
import { ApiResponse } from 'bc-primeng-ui';


@Injectable({ providedIn: 'root' })
export class CouponService {
  private readonly http = inject(HttpClient);
  private readonly couponApiUrl = `${environment.apiBaseUrl}/v1/coupon`;

  private usedCoupons = new Set<string>();

  validateCoupon(payload: ValidateCouponRequest): Observable<ValidateCouponResponse> {
    return this.http.post<ApiResponse<ValidateCouponResponse>>(`${this.couponApiUrl}/validate`, payload)
      .pipe(map((response) => response.data));
  }

  markAsUsed(code: string): void {
    this.usedCoupons.add(code.toUpperCase());
  }

  /**
   * Retrieves the coupon summary assigned to the authenticated user.
   */
  getMyCoupon(userId: string): Observable<MyCouponSummary> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<ApiResponse<MyCouponSummary>>(`${this.couponApiUrl}/my`, { params })
      .pipe(map((response) => response.data));
  }
}
