import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { BankAccount } from '../../../core/models/bank-account.model';
import { QrCodeComponent } from '../qr-code/qr-code.component';
import { NationalFlagComponent } from '../national-flag/national-flag.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-bank-account-info',
  standalone: true,
  imports: [CommonModule, DialogModule, QrCodeComponent, NationalFlagComponent],
  templateUrl: './bank-account-info.component.html',
  styleUrls: ['./bank-account-info.component.scss'],
})
export class BankAccountInfoComponent {
  @Input({ required: true }) account!: BankAccount;
  @Input() qrAttachmentUrl: string | null = null;
  @Input() title = 'Datos de la cuenta';
  @Input() description = '';

  showQrModal = signal(false);

  openQrModal(): void {
    this.showQrModal.set(true);
  }

  closeQrModal(): void {
    this.showQrModal.set(false);
  }

  buildAttachUrl(attachmentId: string): string {
    return `${environment.apiBaseUrl}/v1/attachment/${attachmentId}/preview`;
  }
}
