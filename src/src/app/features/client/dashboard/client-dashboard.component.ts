import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

import { StepperComponent } from '../../../shared/components/stepper/stepper.component';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { TransactionService } from '../../../core/services/transaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { BankAccountService } from '../../../core/services/bank-account.service';
import { Transaction, TransactionStatus } from '../../../core/models/transaction.model';
import { BankAccount } from '../../../core/models/bank-account.model';
import { Bank } from '../../../core/models/bank.model';
import { NationalFlagComponent } from "../../../shared/components/national-flag/national-flag.component";

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    TagModule,
    ButtonModule,
    StepperComponent,
    CurrencyFormatPipe,
    NationalFlagComponent
],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss'],
})
export class ClientDashboardComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly authService = inject(AuthService);
  private readonly bankAccountService = inject(BankAccountService);
  private readonly router = inject(Router);

  /** All client transactions */
  transactions: Transaction[] = [];

  /** Active transactions (not finalized or denied) */
  activeTransactions: Transaction[] = [];

  /** Map of account ID to BankAccount for resolving bank names */
  private accountsMap = new Map<string, BankAccount>();

  /** Map of bank ID to Bank for resolving bank names */
  private banksMap = new Map<string, Bank>();

  /** Loading state */
  loading = true;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser()();
    if (user) {
      this.loadBanks();
      this.loadAccounts(user.id);
      this.loadTransactions(user.id);
    }
  }

  /**
   * Load all banks to resolve bank names from IDs.
   */
  private loadBanks(): void {
    this.bankAccountService.getAvailableBanks('Bolivia').subscribe({
      next: (banks) => banks.forEach((b) => this.banksMap.set(b.id, b)),
    });
    this.bankAccountService.getAvailableBanks('Peru').subscribe({
      next: (banks) => banks.forEach((b) => this.banksMap.set(b.id, b)),
    });
  }

  /**
   * Load user accounts to resolve destination bank names.
   */
  private loadAccounts(userId: string): void {
    this.bankAccountService.getAccounts(userId).subscribe({
      next: (accounts) => {
        accounts.forEach((acc) => this.accountsMap.set(acc.id, acc));
      },
    });
  }

  /**
   * Load client transactions sorted by date descending.
   */
  private loadTransactions(clientId: string): void {
    this.transactionService.getClientTransactions(clientId).subscribe({
      next: (transactions) => {
        // Sort descending by createdAt
        this.transactions = transactions.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Active transactions: not finalized and not denied
        this.activeTransactions = this.transactions.filter(
          (t) => t.status !== 'finalizado' && t.status !== 'denegado'
        );

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  /**
   * Get the stepper step number for a transaction status.
   */
  getStep(status: TransactionStatus): number {
    return this.transactionService.getStepForStatus(status);
  }

  /**
   * Get count of completed (finalizado) transactions.
   */
  getCompletedCount(): number {
    return this.transactions.filter((t) => t.status === 'finalizado').length;
  }

  /**
   * Navigate to the transaction detail or start a new transfer.
   */
  goToDetail(transactionId: string): void {
    if (transactionId === 'new') {
      this.router.navigate(['/cliente/transferencia']);
    } else {
      this.router.navigate(['/cliente/transferencia', transactionId]);
    }
  }

  /**
   * Get a human-readable label for the transaction status.
   */
  getStatusLabel(status: TransactionStatus): string {
    const labels: Record<TransactionStatus, string> = {
      pendiente_deposito: 'Pendiente de depósito',
      pendiente_verificacion: 'Pendiente de verificación',
      verificado: 'Verificado',
      transferido: 'Transferido',
      finalizado: 'Finalizado',
      denegado: 'Denegado',
    };
    return labels[status];
  }

  /**
   * Get the PrimeNG tag severity for visual differentiation by state.
   */
  getStatusSeverity(
    status: TransactionStatus
  ): 'warn' | 'success' | 'info' | 'danger' | 'secondary' | 'contrast' | undefined {
    const severities: Record<TransactionStatus, 'warn' | 'success' | 'info' | 'danger' | 'secondary'> = {
      pendiente_deposito: 'info',
      pendiente_verificacion: 'warn',
      verificado: 'success',
      transferido: 'info',
      finalizado: 'success',
      denegado: 'danger',
    };
    return severities[status];
  }

  /**
   * Resolve the destination bank name from the transaction's destinationAccountId.
   */
  getDestinationBankName(transaction: Transaction): string {
    const account = this.accountsMap.get(transaction.destinationAccountId);
    if (!account) return '—';

    if (account.isYape) return 'Yape';

    const bank = this.banksMap.get(account.bankId);
    return bank?.name ?? '—';
  }
}
