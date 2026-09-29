import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bank } from '../models/bank.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BankService {
  private readonly http = inject(HttpClient);
  private readonly banksUrl = `${environment.apiBaseUrl}/v1/financial-entity`;

  /**
   * Retrieves all banks, optionally filtered by country.
   */
  getAllBanks(country?: 'Bolivia' | 'Peru'): Observable<Bank[]> {    
    let params = new HttpParams().set('includeInactive', 'true');
    if (country) {
      params = params.set('pais', country);
    }
    return this.http.get<Bank[]>(this.banksUrl+"/by-country", { params });
  }
}
