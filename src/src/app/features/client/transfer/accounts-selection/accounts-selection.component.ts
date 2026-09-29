import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

// PrimeNG
import { Select } from 'primeng/select';

// Models
import { BankAccount, AccountType } from '../../../../core/models/bank-account.model';
import { Bank } from '../../../../core/models/bank.model';
import { QrCodeComponent } from "../../../../shared/components/qr-code/qr-code.component";
import { Dialog } from "primeng/dialog";

@Component({
  selector: 'app-accounts-selection',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Select,
    QrCodeComponent,
    Dialog
],
  templateUrl: './accounts-selection.component.html',
  styleUrls: ['./accounts-selection.component.scss'],
})
export class AccountsSelectionComponent {
  @Input({ required: true }) sourceAccounts: BankAccount[] = [];
  @Input({ required: true }) destinationAccounts: BankAccount[] = [];
  @Input({ required: true }) availableBanks: Bank[] = [];
  @Input({ required: true }) transferForm!: FormGroup;
  @Input() updatingQrAccountId: string | null = null;

  @Output() addAccount = new EventEmitter<AccountType>();
  @Output() qrFileSelected = new EventEmitter<{ account: BankAccount; file: File }>();

  triggerQrEdit(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    fileInput.click();
  }

  onQrFileChange(event: Event, account: BankAccount): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.qrFileSelected.emit({ account, file });
  }

  /**
   * Resolve the Bank object for a given bankId.
   */
  getBankForAccount(bankId: string): Bank | undefined {
    return this.availableBanks.find((b) => b.id === bankId);
  }

  /**
   * Resolve bank name for a given account.
   */
  getBankName(account: BankAccount): string {    
    if (account.isYape) return 'Yape';
    const bank = this.getBankForAccount(account.bankId);
    return bank?.name ?? '';
  }

  /**
   * Get display label for an account: "BankName - AccountNumber - HolderName"
   */
  getAccountLabel(account: BankAccount): string {
    const bankName = this.getBankName(account);
    return bankName
      ? `${bankName} - ${account.accountNumber} - ${account.holderName}`
      : `${account.accountNumber} - ${account.holderName}`;
  }

  /**
   * Returns the full BankAccount object for the currently selected destination account.
   */
  getSelectedDestinationAccount(): BankAccount | undefined {
    const selectedId = this.transferForm.get('destinationAccountId')?.value;
    if (!selectedId) return undefined;
    return this.destinationAccounts.find((a) => a.id === selectedId);
  }

  /**
   * Returns the bank logo URL for a given account's bank.
   */
  getBankLogoUrl(account: BankAccount): string {
    const bank = this.getBankForAccount(account.bankId);
    return bank?.logoUrl ?? '';
  }


    // QR modal state
  showQrModal = false;
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

}
