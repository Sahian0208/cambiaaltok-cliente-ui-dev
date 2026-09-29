import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, interval, switchMap } from 'rxjs';

import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

import { TransactionService } from '../../../core/services/transaction.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import {
  Transaction,
  TransactionStatus,
} from '../../../core/models/transaction.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { SignalrService as SignalRService } from '../../../core/services/signalr.service';

interface FilterOption {
  label: string;
  value: TransactionStatus | 'all';
}

@Component({
  selector: 'app-intermediary-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TagModule, ButtonModule],
  templateUrl: './intermediary-dashboard.component.html',
  styleUrls: ['./intermediary-dashboard.component.scss'],
})
export class IntermediaryDashboardComponent implements OnInit, OnDestroy {
  private readonly transactionService = inject(TransactionService);
  private readonly notificationService = inject(NotificationService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly signalrService = inject(SignalRService);

  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  selectedFilter: TransactionStatus | 'all' = 'all';
  searchQuery = '';

  /** Map of userId → full name for client resolution */
  //private clientsMap = new Map<string, string>();

  filterOptions: FilterOption[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Por verificar', value: 'pendiente_verificacion' },
    { label: 'Por transferir', value: 'verificado' },
  ];

  private pollingSub: Subscription | null = null;
  private newTransactionSub: Subscription | null = null;

  /** Track known transaction IDs to detect truly new ones */
  private knownTransactionIds = new Set<string>();

  constructor() {
    this.listenForNewTransactions();
  }

  ngOnInit(): void {
    //this.loadClients();
    this.loadTransactions();
    //this.startPolling();
    //this.subscribeToNewTransactions();
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
    this.newTransactionSub?.unsubscribe();
  }

  // --- Client Name Resolution ---

  // private loadClients(): void {
  //   this.userService.getUsers().subscribe({
  //     next: (users: User[]) => {
  //       users.forEach((u) => {
  //         this.clientsMap.set(u.id, `${u.firstName} ${u.lastName}`);
  //       });
  //       // Re-apply filter to update display names
  //       this.applyFilter();
  //     },
  //   });
  // }

  // getClientName(clientId: string): string {
  //   return this.clientsMap.get(clientId) || 'Cliente';
  // }

  private listenForNewTransactions(): void {
    effect(() => {
      const notification =
        this.signalrService.liveIntermediaryShouldVerifyNotification();

      if (!notification) {
        return;
      }
      this.loadTransactions();
    });
  }

  private loadTransactions(): void {
    const user = this.authService.getCurrentUser()();
    this.transactionService.getPendingTransactions(user!.id).subscribe({
      next: (transactions) => {
        this.updateTransactionList(transactions, false);
      },
    });
  }

  private startPolling(): void {
    const user = this.authService.getCurrentUser()();
    this.pollingSub = interval(5000)
      .pipe(
        switchMap(() =>
          this.transactionService.getPendingTransactions(user!.id),
        ),
      )
      .subscribe({
        next: (transactions) => {
          const newOnes = transactions.filter(
            (t) => !this.knownTransactionIds.has(t.id),
          );
          if (newOnes.length > 0) {
            this.notificationService.info(
              'Nueva transacción',
              `${newOnes.length} nueva(s) transacción(es) detectada(s)`,
            );
          }
          this.updateTransactionList(transactions, false);
        },
      });
  }

  // private subscribeToNewTransactions(): void {
  //   this.newTransactionSub =
  //     this.transactionService.onNewPendingTransaction$.subscribe({
  //       next: (transaction) => {
  //         if (!this.knownTransactionIds.has(transaction.id)) {
  //           this.transactions = [transaction, ...this.transactions];
  //           this.knownTransactionIds.add(transaction.id);
  //           this.applyFilter();
  //           this.notificationService.info(
  //             'Nueva transacción',
  //             `Transacción de ${this.getClientName(transaction.clientId)} recibida`,
  //           );
  //         }
  //       },
  //     });
  // }

  private updateTransactionList(
    transactions: Transaction[],
    notify: boolean,
  ): void {
    if (notify) {
      const newOnes = transactions.filter(
        (t) => !this.knownTransactionIds.has(t.id),
      );
      if (newOnes.length > 0) {
        this.notificationService.info(
          'Nueva transacción',
          `${newOnes.length} nueva(s) transacción(es)`,
        );
      }
    }
    this.transactions = transactions;
    this.knownTransactionIds = new Set(transactions.map((t) => t.id));
    this.applyFilter();
  }

  // --- Filtering ---

  setFilter(value: TransactionStatus | 'all'): void {
    this.selectedFilter = value;
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilter();
  }

  applyFilter(): void {
    let result = [...this.transactions];

    // Filter by status
    if (this.selectedFilter !== 'all') {
      result = result.filter((t) => t.status === this.selectedFilter);
    }

    // Filter by client name search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const clientName = t.clientName.toLowerCase();
        return clientName.includes(query);
      });
    }

    this.filteredTransactions = result;
  }

  // --- Stats ---

  getCountByStatus(status: TransactionStatus): number {
    return this.transactions.filter((t) => t.status === status).length;
  }

  // --- Navigation ---

  goToVerify(transactionId: string): void {
    this.router.navigate(['/intermediario/verificar', transactionId]);
  }

  // --- Status Display ---

  getStatusLabel(status: TransactionStatus): string {
    const labels: Record<string, string> = {
      pendiente_verificacion: 'Por verificar',
      verificado: 'Por transferir',
      pendiente_deposito: 'Pendiente depósito',
      transferido: 'Transferido',
      finalizado: 'Finalizado',
      denegado: 'Denegado',
    };
    return labels[status] ?? status;
  }

  getStatusSeverity(
    status: TransactionStatus,
  ):
    | 'warn'
    | 'success'
    | 'info'
    | 'danger'
    | 'secondary'
    | 'contrast'
    | undefined {
    const severities: Record<
      string,
      'warn' | 'success' | 'info' | 'danger' | 'secondary'
    > = {
      pendiente_verificacion: 'warn',
      verificado: 'info',
      pendiente_deposito: 'secondary',
      transferido: 'info',
      finalizado: 'success',
      denegado: 'danger',
    };
    return severities[status] ?? 'secondary';
  }
}
