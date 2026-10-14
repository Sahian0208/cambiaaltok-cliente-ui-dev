import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { NationalFlagComponent } from '../../../shared/components/national-flag/national-flag.component';

export interface CalendarDayItem {
  label: string | number;
  isToday: boolean;
  hasEvent: boolean;
  isEmpty: boolean;
}

export interface OnlineAdvisor {
  name: string;
  role: string;
  code: string;
  phone: string;
  avatar: string;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    StepperComponent,
    CurrencyFormatPipe,
    NationalFlagComponent,
  ],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss'],
})
export class ClientDashboardComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  readonly authService = inject(AuthService);
  private readonly bankAccountService = inject(BankAccountService);
  readonly router = inject(Router);

  readonly currentUser = this.authService.getCurrentUser();

  /** All client transactions */
  transactions: Transaction[] = [];

  /** Active transactions (not finalized or denied) */
  activeTransactions: Transaction[] = [];

  /** Map of account ID to BankAccount for resolving bank names */
  accountsMap = new Map<string, BankAccount>();

  /** Map of bank ID to Bank for resolving bank names */
  banksMap = new Map<string, Bank>();

  /** Loading state */
  loading = true;

  /** Filter & Search state */
  searchQuery = '';
  selectedCurrencyFilter = 'ALL';
  selectedStatusFilter = 'ALL';

  /** Calendar Widget state */
  currentCalendarDate = new Date();
  calendarDays: CalendarDayItem[] = [];

  /** Asesores en Línea (WhatsApp 24/7) */
  readonly onlineAdvisors: OnlineAdvisor[] = [
    {
      name: 'Maren Maureen',
      role: 'Mesa de Cambio',
      code: '1094882001',
      phone: '59172237251',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Jenniffer Jane',
      role: 'Atención Perú',
      code: '1094672000',
      phone: '51994790996',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Ryan Herwinds',
      role: 'Validación & Pagos',
      code: '1094342003',
      phone: '59172237251',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Kierra Culhane',
      role: 'Soporte Fazilito',
      code: '1094662002',
      phone: '51994790996',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
  ];

  get currentMonthName(): string {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return `${months[this.currentCalendarDate.getMonth()]} ${this.currentCalendarDate.getFullYear()}`;
  }

  get filteredTransactions(): Transaction[] {
    return this.transactions.filter((t) => {
      const matchesCurrency =
        this.selectedCurrencyFilter === 'ALL' ||
        t.sourceCurrency === this.selectedCurrencyFilter ||
        t.destinationCurrency === this.selectedCurrencyFilter;

      const matchesStatus =
        this.selectedStatusFilter === 'ALL' ||
        (this.selectedStatusFilter === 'ACTIVE'
          ? t.status !== 'finalizado' && t.status !== 'denegado'
          : t.status === this.selectedStatusFilter);

      const query = this.searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        t.id.toLowerCase().includes(query) ||
        this.getDestinationBankName(t).toLowerCase().includes(query) ||
        t.sourceAmount.toString().includes(query) ||
        t.destinationAmount.toString().includes(query);

      return matchesCurrency && matchesStatus && matchesSearch;
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser()();
    if (user) {
      this.loadBanks();
      this.loadAccounts(user.id);
      this.loadTransactions(user.id);
    } else {
      this.loadBanks();
      this.loadAccounts('usr-001');
      this.loadTransactions('usr-001');
    }
    this.buildCalendarDays();
  }

  setCurrencyFilter(currency: string): void {
    this.selectedCurrencyFilter = currency;
  }

  setStatusFilter(status: string): void {
    this.selectedStatusFilter = status;
  }

  buildCalendarDays(): void {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();
    const today = new Date();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon = 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: CalendarDayItem[] = [];

    // Empty spaces before first day of month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ label: '', isToday: false, hasEvent: false, isEmpty: true });
    }

    // Days of month
    for (let d = 1; d <= totalDays; d++) {
      const isToday =
        today.getDate() === d &&
        today.getMonth() === month &&
        today.getFullYear() === year;

      // Highlight active transaction days (for visual feel matching reference)
      const hasEvent = d === 9 || d === 13 || d === 18;

      days.push({ label: d, isToday, hasEvent, isEmpty: false });
    }

    this.calendarDays = days;
  }

  prevMonth(): void {
    this.currentCalendarDate = new Date(
      this.currentCalendarDate.getFullYear(),
      this.currentCalendarDate.getMonth() - 1,
      1
    );
    this.buildCalendarDays();
  }

  nextMonth(): void {
    this.currentCalendarDate = new Date(
      this.currentCalendarDate.getFullYear(),
      this.currentCalendarDate.getMonth() + 1,
      1
    );
    this.buildCalendarDays();
  }

  private loadBanks(): void {
    this.bankAccountService.getAvailableBanks('Bolivia').subscribe({
      next: (banks) => banks.forEach((b) => this.banksMap.set(b.id, b)),
    });
    this.bankAccountService.getAvailableBanks('Peru').subscribe({
      next: (banks) => banks.forEach((b) => this.banksMap.set(b.id, b)),
    });
  }

  private loadAccounts(userId: string): void {
    this.bankAccountService.getAccounts(userId).subscribe({
      next: (accounts) => {
        accounts.forEach((acc) => this.accountsMap.set(acc.id, acc));
      },
    });
  }

  private loadTransactions(clientId: string): void {
    this.transactionService.getClientTransactions(clientId).subscribe({
      next: (transactions) => {
        this.transactions = transactions.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

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

  getStep(status: TransactionStatus): number {
    return this.transactionService.getStepForStatus(status);
  }

  getCompletedCount(): number {
    return this.transactions.filter((t) => t.status === 'finalizado').length;
  }

  goToDetail(transactionId: string): void {
    if (transactionId === 'new') {
      this.router.navigate(['/cliente/transferencia']);
    } else {
      this.router.navigate(['/cliente/transferencia', transactionId]);
    }
  }

  getStatusLabel(status: TransactionStatus): string {
    const labels: Record<TransactionStatus, string> = {
      pendiente_deposito: 'Pendiente depósito',
      pendiente_verificacion: 'En verificación',
      verificado: 'Verificado',
      transferido: 'Transferido',
      finalizado: 'Completado',
      denegado: 'Denegado',
    };
    return labels[status] ?? status;
  }

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

  getDestinationBankName(transaction: Transaction): string {
    const account = this.accountsMap.get(transaction.destinationAccountId);
    if (!account) return '—';

    if (account.isYape) return 'Yape';

    const bank = this.banksMap.get(account.bankId);
    return bank?.name ?? '—';
  }
}
