import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AccountType, BankAccount } from '../models/bank-account.model';
import { Bank } from '../models/bank.model';
import { environment } from '../../../environments/environment';
import { ApiResponse } from 'bc-primeng-ui';


export interface CreateAccountDto {
  userId: string;
  bankId: string;
  accountNumber: string;
  holderName: string;
  type: AccountType;
  country: 'Bolivia' | 'Peru';
  isYape: boolean;
  isQR: boolean;
  otherAccountValue: string;
}

@Injectable({ providedIn: 'root' })
export class BankAccountService {
  private readonly http = inject(HttpClient);
  private readonly accountsUrl = `${environment.apiBaseUrl}/v1/customer-favorites-account`;
  private readonly allbanksByCountryUrl = `${environment.apiBaseUrl}/v1/financial-entity/all-by-country`;

  /**
   * Retrieves all bank accounts for a given user.
   */
  getAccounts(userId: string): Observable<BankAccount[]> {    
    const params = new HttpParams()
      .set('authUseId', userId)
      .set('accountType','')
    return this.http.get<ApiResponse<BankAccount[]>>(`${this.accountsUrl}/get-all-accounts-for-client`, {params})
    .pipe(map((response) => response.data)); 
  }

  /**
   * Retrieves bank accounts for a given user filtered by account type (origen/destino).
   */
  getAccountsByType(userId: string, type: AccountType): Observable<BankAccount[]> {
    const params = new HttpParams()
      .set('authUseId', userId)
      .set('accountType',type)
    return this.http.get<ApiResponse<BankAccount[]>>(`${this.accountsUrl}/get-all-accounts-for-client`, {params})
    .pipe(map((response) => response.data)); 
  }

    /**
   * Retrieves bank accounts for a given user filtered by account type (origen/destino).
   */
  getAccountsByTypeAndCountry(userId: string, type: AccountType, country: 'Bolivia' | 'Peru'): Observable<BankAccount[]> {
    const params = new HttpParams()
      .set('authUseId', userId)
      .set('accountType',type)
      .set('country', country)
    return this.http.get<ApiResponse<BankAccount[]>>(`${this.accountsUrl}/get-accounts-by-country-for-client`, {params})
    .pipe(map((response) => response.data)); 
  }

  /**
   * Retrieves a single bank account by its ID.
   */
  getAccountById(accountId: string): Observable<BankAccount> {
    const params = new HttpParams().set('accountId', accountId);
    return this.http.get<ApiResponse<BankAccount>>(`${this.accountsUrl}/get-for-client`, { params })
      .pipe(map(response => response.data));
  }

  /**
   * Creates a new bank account.
   */
  createAccount(data: CreateAccountDto): Observable<BankAccount> {
    return this.http
      .post<ApiResponse<BankAccount>>(`${this.accountsUrl}/client`, data)
      .pipe(map((response) => response.data));
  }

  /**
   * Updates an existing bank account by id.
   */
  updateAccount(id: string, data: Partial<BankAccount>): Observable<BankAccount> {
    return this.http
      .put<ApiResponse<BankAccount>>(`${this.accountsUrl}/${id}`, data)
      .pipe(map((response) => response.data));
  }

  /**
   * Deletes a bank account by id.
   */
  deleteAccount(id: string): Observable<void> {
    return this.http.delete<void>(`${this.accountsUrl}/${id}`);
  }

  /**
   * Retrieves available (active) banks filtered by country.
   */
  getAvailableBanks(country: 'Bolivia' | 'Peru'): Observable<Bank[]> {    
    const params = new HttpParams().set('country', country);
    return this.http.get<ApiResponse<Bank[]>>(this.allbanksByCountryUrl, { params })
          .pipe(map((response) => response.data)); 
  }

  /**
   * Retrieves the intermediary (CambiaAltok) account assigned to a client's transaction source account.
   * Used in Step 2 of the transfer flow to show the client where to deposit.
   */
  getIntermediarAccountForClient(sourceAccountId: string): Observable<BankAccount> {
    const params = new HttpParams().set('accountId', sourceAccountId);
    return this.http
      .get<ApiResponse<BankAccount>>(`${this.accountsUrl}/client-should-deposit-to`, { params })
      .pipe(map((response) => response.data));
  }
}
