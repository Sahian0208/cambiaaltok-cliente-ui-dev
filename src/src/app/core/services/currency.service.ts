import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Currency } from '../models/currency.model';
import { environment } from '../../../environments/environment';
import { ApiResponse } from 'bc-primeng-ui';

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly http = inject(HttpClient);
  private readonly currencyUrl = `${environment.apiBaseUrl}/v1/currency`;

  /**
   * Get currency by Code.
   * Currency: Code
   */
  getCurrencyByCode(code: string): Observable<Currency> {
    return this.http
      .get<ApiResponse<Currency>>(`${this.currencyUrl}/by-code/${code}`)
      .pipe(map((response) => response.data));
  }
}