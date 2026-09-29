import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FinancialAccount } from '../models/financial-account.model';
import { environment } from '../../../environments/environment';
import { ApiResponse } from 'bc-primeng-ui';

@Injectable({ providedIn: 'root' })
export class FinancialAccountService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/v1/person-financial-entity-account/all-for-client`;

  getAvailableAccounts(country?: 'Bolivia' | 'Peru'): Observable<FinancialAccount[]> {
    let params = new HttpParams();
    if (country) {
      params = params.set('country', country);
    }
    return this.http.get<ApiResponse<FinancialAccount[]>>(this.url, { params })
      .pipe(map(response => response.data));
  }
}
