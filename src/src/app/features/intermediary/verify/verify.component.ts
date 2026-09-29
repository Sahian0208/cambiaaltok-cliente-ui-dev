import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ImageModule } from 'primeng/image';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { Select } from 'primeng/select';

import { TransactionService } from '../../../core/services/transaction.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BankAccountService } from '../../../core/services/bank-account.service';
import { FinancialAccountService } from '../../../core/services/financial-account.service';
import { Transaction } from '../../../core/models/transaction.model';
import { BankAccount } from '../../../core/models/bank-account.model';
import { FinancialAccount } from '../../../core/models/financial-account.model';
import { FileUploadComponent, FileUploadEvent } from '../../../shared/components/file-upload/file-upload.component';
import { environment } from '../../../../environments/environment';
import { BankAccountInfoComponent } from "../../../shared/components/bank-account-info/bank-account-info.component";

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    TextareaModule,
    ImageModule,
    TagModule,
    CardModule,
    Select,
    FileUploadComponent,
    BankAccountInfoComponent,
],
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss'],
})
export class VerifyComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transactionService = inject(TransactionService);
  private readonly notificationService = inject(NotificationService);
  private readonly bankAccountService = inject(BankAccountService);
  private readonly financialAccountService = inject(FinancialAccountService);

  transaction: Transaction | null = null;
  loading = true;
  processing = false;
  errorMessage: string | null = null;

  // Deny dialog state
  showDenyDialog = false;
  denyReason = '';
  denyReasonTouched = false;

  // Confirm deposit dialog state
  showConfirmDialog = false;

  // Confirm transfer dialog state
  showCompleteTransferDialog = false;

  // Transfer receipt upload
  transferReceiptFile: File | null = null;

  // Destination bank account info
  destinationBankAccount: BankAccount | null = null;

  // Financial accounts for fund source selection
  financialAccounts: FinancialAccount[] = [];
  selectedFinancialAccountId: string | null = null;

  // QR modal state
  showQrModal = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'No se proporcionó un ID de transacción.';
      this.loading = false;
      return;
    }
    this.loadTransaction(id);
  }

  buildAttachUrl(attachmentId: string) {
   return `${environment.apiBaseUrl}/v1/attachment/${attachmentId}/preview`;
  }

  /**
   * Load the transaction by ID from the service.
   */
  private loadTransaction(id: string): void {
    this.loading = true;
    this.transactionService.getTransactionById(id).subscribe({
      next: (transaction) => {
        this.transaction = transaction;
        this.loading = false;

        if (transaction.status === 'verificado') {
          this.loadDestinationAccount();
        }
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar la transacción.';
        this.loading = false;
      },
    });
  }

  /**
   * Confirm the client's deposit. Transitions to 'verificado'.
   */
  confirmDeposit(): void {
    if (!this.transaction) return;
    this.processing = true;

    this.transactionService.verifyDeposit(this.transaction.id).subscribe({
      next: (updated) => {
        this.transaction = updated;
        this.processing = false;
        this.showConfirmDialog = false;
        this.notificationService.success(
          'Depósito confirmado',
          'La transacción ha sido verificada exitosamente.'
        );

        this.loadDestinationAccount();
      },
      error: () => {
        this.processing = false;
        this.notificationService.error(
          'Error',
          'No se pudo confirmar el depósito.'
        );
      },
    });
  }

  /**
   * Deny the client's deposit. Requires a non-empty reason.
   */
  denyDeposit(): void {
    this.denyReasonTouched = true;
    if (!this.transaction || !this.denyReason?.trim()) return;
    this.processing = true;

    this.transactionService
      .denyDeposit(this.transaction.id, this.denyReason.trim())
      .subscribe({
        next: (updated) => {
          this.transaction = updated;
          this.processing = false;
          this.showDenyDialog = false;
          this.notificationService.warn(
            'Transacción denegada',
            'Se ha notificado al cliente con el motivo del rechazo.'
          );
        },
        error: () => {
          this.processing = false;
          this.notificationService.error(
            'Error',
            'No se pudo denegar la transacción.'
          );
        },
      });
  }

  /**
   * Cancel the deny dialog and reset state.
   */
  cancelDeny(): void {
    this.showDenyDialog = false;
    this.denyReason = '';
    this.denyReasonTouched = false;
  }

  /**
   * Handle transfer receipt file selection.
   */
  onTransferReceiptSelected(event: FileUploadEvent): void {
    this.transferReceiptFile = event.file;
  }

  /**
   * Handle transfer receipt file error.
   */
  onTransferReceiptError(): void {
    this.transferReceiptFile = null;
  }

  /**
   * Upload the transfer receipt and complete the transfer.
   * Transitions: verificado → transferido
   */
  completeTransfer(): void {
    if (!this.transaction || !this.transferReceiptFile) return;
    this.processing = true;

    this.transactionService
      .uploadReceipt(
        this.transaction.id,
        this.transferReceiptFile,
        'intermediario',
        this.selectedFinancialAccountId ?? undefined
      )
      .subscribe({
        next: (updated) => {
          this.transaction = updated;
          this.processing = false;
          this.showCompleteTransferDialog = false;
          this.notificationService.success(
            'Transferencia completada',
            'El comprobante ha sido subido exitosamente.'
          );
        },
        error: () => {
          this.processing = false;
          this.notificationService.error(
            'Error',
            'No se pudo completar la transferencia.'
          );
        },
      });
  }

  /**
   * Load the destination bank account info for the transaction.
   */
  private loadDestinationAccount(): void {
    if (!this.transaction?.destinationAccountId) return;

    this.bankAccountService.getAccountById(this.transaction.destinationAccountId).subscribe({
      next: (account) => {
        this.destinationBankAccount = account;
        // Load financial accounts now that we have the country
        this.loadFinancialAccounts();
      },
      error: () => {
        // Still load financial accounts without country filter
        this.loadFinancialAccounts();
      },
    });
  }

  /**
   * Load available financial accounts for fund source selection.
   */
  private loadFinancialAccounts(): void {
    if (!this.transaction?.destinationAccountId) return;

    const country = this.destinationBankAccount?.country;
    this.financialAccountService.getAvailableAccounts(country).subscribe({
      next: (accounts) => {
        this.financialAccounts = accounts;
        this.autoSelectFinancialAccount();
      },
      error: () => {
        // Silently fail
      },
    });
  }

  /**
   * Auto-select the best matching financial account based on destination country.
   */
  private autoSelectFinancialAccount(): void {
    if (!this.financialAccounts.length) return;

    const destCountry = this.destinationBankAccount?.country;
    const defaultAccount =
      this.financialAccounts.find(a => a.isDefault && a.country === destCountry) ||
      this.financialAccounts.find(a => a.isDefault) ||
      this.financialAccounts[0];

    if (defaultAccount) {
      this.selectedFinancialAccountId = defaultAccount.id;
    }
  }

  /**
   * Open the QR modal.
   */
  openQrModal(): void {
    this.showQrModal = true;
  }

  /**
   * Close the QR modal.
   */
  closeQrModal(): void {
    this.showQrModal = false;
  }

  /**
   * Navigate back to the intermediary dashboard.
   */
  goBack(): void {
    this.router.navigate(['/intermediario']);
  }

  /**
   * Get a human-readable label for the transaction status.
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pendiente_verificacion: 'Pendiente de verificación',
      verificado: 'Verificado',
      pendiente_deposito: 'Pendiente de depósito',
      transferido: 'Transferido',
      finalizado: 'Finalizado',
      denegado: 'Denegado',
    };
    return labels[status] ?? status;
  }

  /**
   * Get the PrimeNG tag severity for visual differentiation.
   */
  getStatusSeverity(status: string): 'warn' | 'success' | 'info' | 'danger' | 'secondary' | undefined {
    const severities: Record<string, 'warn' | 'success' | 'info' | 'danger' | 'secondary'> = {
      pendiente_verificacion: 'warn',
      verificado: 'success',
      pendiente_deposito: 'info',
      transferido: 'info',
      finalizado: 'success',
      denegado: 'danger',
    };
    return severities[status] ?? 'secondary';
  }
}
