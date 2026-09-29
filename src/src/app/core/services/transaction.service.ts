import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, filter, map, tap, throwError } from 'rxjs';
import { Transaction, TransactionStatus } from '../models/transaction.model';
import { environment } from '../../../environments/environment';
import { ApiResponse } from 'bc-primeng-ui';

/**
 * DTO for creating a new transaction.
 */
export interface CreateTransactionDto {
  clientId: string;
  intermediaryId: string;
  sourceAmount: number;
  sourceCurrency: 'BOB' | 'PEN';
  destinationAmount: number;
  destinationCurrency: 'BOB' | 'PEN';
  appliedRate: number;
  sourceAccountId: string;
  destinationAccountId: string;
  destinationQrUrl: string;
  fileName: string;
  couponCode?: string;
}

/**
 * Valid state transitions for the transaction state machine.
 *
 * | Current State            | Action                         | Next State              |
 * |--------------------------|--------------------------------|-------------------------|
 * | pendiente_deposito       | Cliente sube comprobante       | pendiente_verificacion  |
 * | pendiente_verificacion   | Intermediario confirma         | verificado              |
 * | pendiente_verificacion   | Intermediario deniega          | denegado                |
 * | verificado               | Intermediario sube comprobante | transferido             |
 * | transferido              | Sistema finaliza               | finalizado              |
 */
const VALID_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  pendiente_deposito: ['pendiente_verificacion'],
  pendiente_verificacion: ['verificado', 'denegado'],
  verificado: ['transferido'],
  transferido: ['finalizado'],
  finalizado: [],
  denegado: [],
};

/**
 * Maps a TransactionStatus to the corresponding stepper step number.
 * Exported as a standalone function for easy testing and reuse.
 *
 * | Estado                 | Paso |
 * |------------------------|------|
 * | pendiente_deposito     | 1    |
 * | pendiente_verificacion | 2    |
 * | verificado             | 3    |
 * | transferido            | 4    |
 * | finalizado             | 5    |
 * | denegado               | -1   |
 */
export function getStepForStatus(status: TransactionStatus): number {
  const statusStepMap: Record<TransactionStatus, number> = {
    pendiente_deposito: 2,
    pendiente_verificacion: 3,
    verificado: 4,
    transferido: 4,
    finalizado: 5,
    denegado: -1,
  };
  return statusStepMap[status];
}

/**
 * Validates whether a state transition is allowed according to the state machine.
 * Returns true if the transition from `currentStatus` to `nextStatus` is valid.
 */
export function isValidTransition(
  currentStatus: TransactionStatus,
  nextStatus: TransactionStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly transactionsUrl = `${environment.apiBaseUrl}/v1/exchange-transaction`;

  /**
   * Subject that emits when a new pending transaction is added.
   * Enables optimistic updates in the intermediary dashboard
   * when both roles are simulated in the same browser session.
   */
  private newPendingTransaction$ = new BehaviorSubject<Transaction | null>(null);

  /**
   * Public observable for the IntermediaryDashboardComponent to subscribe
   * and receive immediate notifications of new transactions.
   */
  readonly onNewPendingTransaction$ = this.newPendingTransaction$.asObservable().pipe(
    filter((t): t is Transaction => t !== null)
  );

  /**
   * Creates a new transaction. The transaction starts in 'pendiente_deposito' state.
   * After creation, emits the new transaction via newPendingTransaction$.
   */
  createTransaction(data: CreateTransactionDto): Observable<Transaction> {    
    return this.http.post<ApiResponse<Transaction>>(`${this.transactionsUrl}/create-from-client`, data)
    .pipe(
      map((response) => response.data),
      tap((transaction) => {
        this.newPendingTransaction$.next(transaction);
      })
    );
  }

  /**
   * Uploads a receipt (comprobante) for a transaction.
   * Uses FormData for file upload.
   *
   * @param transactionId - The transaction ID
   * @param file - The image file to upload
   * @param type - 'cliente' for client receipt, 'intermediario' for intermediary receipt
   * @param financialAccountId - Optional financial account ID (for intermediary transfers)
   */
  uploadReceipt(transactionId: string, file: File, type: 'cliente' | 'intermediario', financialAccountId?: string): Observable<Transaction> {    
    const formData = new FormData();
    formData.append('transactionId', transactionId);
    formData.append('file', file);
    formData.append('type', type);
    if (financialAccountId) {
      formData.append('financialAccountId', financialAccountId);
    }

    return this.http
      .post<ApiResponse<Transaction>>(`${this.transactionsUrl}/${transactionId}/receipt`, formData)
      .pipe(
        map((response) => response.data),
        tap((transaction) => {
          if (type === 'cliente') {
            this.newPendingTransaction$.next(transaction);
          }
        })
      );
  }

  /**
   * Intermediary verifies (confirms) a deposit.
   * Transitions: pendiente_verificacion → verificado
   */
  verifyDeposit(transactionId: string): Observable<Transaction> {
    return this.http.post<ApiResponse<Transaction>>(
      `${this.transactionsUrl}/${transactionId}/verify`,
      {}
    )
    .pipe(map((response) => response.data));
  }

  /**
   * Intermediary denies a deposit.
   * Transitions: pendiente_verificacion → denegado
   * Requires a non-empty motivo string.
   */
  denyDeposit(transactionId: string, motivo: string): Observable<Transaction> {
    if (!motivo || motivo.trim().length === 0) {
      return throwError(
        () => new Error('El motivo de denegación es obligatorio')
      );
    }

    return this.http.post<ApiResponse<Transaction>>(
      `${this.transactionsUrl}/${transactionId}/deny`,
      { motivo: motivo.trim() })
      .pipe(map((response) => response.data));

  }

  /**
   * Intermediary completes the transfer.
   * Transitions: verificado → transferido (via receipt upload) → finalizado
   */
  completeTransfer(transactionId: string): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.transactionsUrl}/${transactionId}/complete`,
      {}
    );
  }

  /**
   * Gets all transactions for a specific client, ordered by creation date descending.
   */
  getClientTransactions(clientId: string): Observable<Transaction[]> {    
    return this.http.get<ApiResponse<Transaction[]>>(`${this.transactionsUrl}/transactions-of-customer`, {
      params: { authUserId : clientId },
    })
    .pipe(map((response) => response.data)); 
    ;
  }

  /**
   * Gets all pending transactions (for the intermediary dashboard).
   * Returns transactions in states: pendiente_verificacion, verificado.
   */
  getPendingTransactions(assignedToUserId : string): Observable<Transaction[]> {    
    //return this.http.get<Transaction[]>(`${this.transactionsUrl}/${assignedToUserId}/pending`);

    return this.http.get<ApiResponse<Transaction[]>>(`${this.transactionsUrl}/${assignedToUserId}/pending`)
    .pipe(map((response) => response.data));
  }

  /**
   * Gets a single transaction by its ID.
   */
  getTransactionById(id: string): Observable<Transaction> {    
    return this.http.get<ApiResponse<Transaction>>(`${this.transactionsUrl}/${id}/external`)
    .pipe(map((response) => response.data));
  }

  /**
   * Maps a transaction status to the corresponding stepper step number.
   * Delegates to the standalone getStepForStatus function.
   */
  getStepForStatus(status: TransactionStatus): number {
    return getStepForStatus(status);
  }
}
