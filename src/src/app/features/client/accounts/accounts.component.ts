import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ProgressSpinner } from 'primeng/progressspinner';
import { ConfirmationService } from 'primeng/api';
import jsQR from 'jsqr';

import { BankAccountService, CreateAccountDto } from '../../../core/services/bank-account.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BankAccount, AccountType } from '../../../core/models/bank-account.model';
import { Bank } from '../../../core/models/bank.model';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    Dialog,
    Button,
    Select,
    InputText,
    Tag,
    ToggleSwitch,
    ConfirmDialog,
    ProgressSpinner,
  ],
  providers: [ConfirmationService],
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.scss'],
})
export class AccountsComponent implements OnInit {
  private static readonly MAX_QR_PAYLOAD_LENGTH = 4096;

  private readonly fb = inject(FormBuilder);
  private readonly bankAccountService = inject(BankAccountService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly accounts = signal<BankAccount[]>([]);
  readonly banks = signal<Bank[]>([]);
  readonly isLoading = signal(false);
  readonly showDialog = signal(false);
  readonly isEditing = signal(false);
  readonly editingAccountId = signal<string | null>(null);

  readonly paisOptions = [
    { label: 'Bolivia', value: 'Bolivia' as const },
    { label: 'Perú', value: 'Peru' as const },
  ];

  readonly tipoOptions = [
    { label: 'Origen', value: 'origen' as const },
    { label: 'Destino', value: 'destino' as const },
  ];

  readonly accountForm: FormGroup = this.fb.group({
    country: ['' as '' | 'Bolivia' | 'Peru', [Validators.required]],
    bankId: ['', [Validators.required]],
    accountNumber: ['', [Validators.required, Validators.minLength(5)]],
    holderName: ['', [Validators.required, Validators.minLength(3)]],
    type: ['origen' as AccountType, [Validators.required]],
    isYape: [false],
    isQR: [false],
    otherAccountValue: [''],
  });

  readonly selectedPais = signal<'' | 'Bolivia' | 'Peru'>('');

  // El backend no distingue país por banco en este endpoint (siempre repite el país solicitado
  // en cada registro), así que no hay forma confiable de filtrar el catálogo; se muestra completo.
  readonly filteredBanks = computed(() => {
    console.log(this.banks());
    return this.banks();
  });

  readonly selectedTipo = signal<AccountType>('origen');

  readonly canBeYape = computed(() => {
    return this.selectedPais() === 'Peru' && this.selectedTipo() === 'destino';
  });

  readonly canShowQRToggle = computed(() => {
    return this.selectedPais() === 'Bolivia' && this.selectedTipo() === 'destino';
  });

  readonly qrImportMessage = signal<string | null>(null);
  readonly isQrImporting = signal(false);

  private get userId(): string {
    return this.authService.getCurrentUser()()?.id ?? '';
  }

  ngOnInit(): void {
    this.loadAccounts();
    this.loadBanks();

    // Listen for country changes to reload banks and reset bank selection
    this.accountForm.get('country')!.valueChanges.subscribe((country: 'Bolivia' | 'Peru') => {
      this.selectedPais.set(country);
      this.accountForm.patchValue({ bankId: '', isYape: false });
      this.resetQrFieldsIfNeeded();
      this.loadBanks(country);
    });

    // Track type changes for Yape toggle visibility
    this.accountForm.get('type')!.valueChanges.subscribe((tipo: AccountType) => {
      this.selectedTipo.set(tipo);
      if (!this.canBeYape()) {
        this.accountForm.patchValue({ isYape: false });
      }
      this.resetQrFieldsIfNeeded();
    });

    this.accountForm.get('isQR')!.valueChanges.subscribe((enabled: boolean) => {
      if (!enabled) {
        this.accountForm.patchValue({ otherAccountValue: '' }, { emitEvent: false });
        this.qrImportMessage.set(null);
      }
    });
  }

  loadAccounts(): void {
    this.isLoading.set(true);
    this.bankAccountService.getAccounts(this.userId).subscribe({
      next: (accounts) => {        
        this.accounts.set(accounts);
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudieron cargar las cuentas bancarias.');
        this.isLoading.set(false);
      },
    });
  }

  loadBanks(country?: 'Bolivia' | 'Peru'): void {
    // El backend siempre devuelve el catálogo completo (Bolivia + Perú) sin importar el país enviado,
    // pero el campo country de cada banco sí es correcto, así que basta una sola llamada y filtramos en el cliente.
    this.bankAccountService.getAvailableBanks(country ?? 'Bolivia').subscribe({
      next: (list) => this.banks.set(list),
      error: () => {
        this.notificationService.error('Error', 'No se pudieron cargar los bancos.');
      },
    });
  }

  getBankName(bankId: string): string {
    const bank = this.banks().find((b) => b.externalId === bankId);
    return bank ? bank.name : bankId;
  }

  openNewDialog(): void {
    this.isEditing.set(false);
    this.editingAccountId.set(null);
    this.accountForm.reset({
      country: '',
      bankId: '',
      accountNumber: '',
      holderName: '',
      type: 'origen',
      isYape: false,
      isQR: false,
      otherAccountValue: '',
    });
    this.qrImportMessage.set(null);
    this.selectedPais.set('');
    this.showDialog.set(true);
  }

  openEditDialog(account: BankAccount): void {
    this.isEditing.set(true);
    this.editingAccountId.set(account.id);
    this.selectedPais.set(account.country);
    this.selectedTipo.set(account.type);
    this.accountForm.patchValue({
      country: account.country,
      bankId: account.bankId,
      accountNumber: account.accountNumber,
      holderName: account.holderName,
      type: account.type,
      isYape: account.isYape,
      isQR: account.isQR,
      otherAccountValue: account.otherAccountValue,
    }, { emitEvent: false });
    this.qrImportMessage.set(account.otherAccountValue ? 'QR importado y listo para guardar.' : null);
    this.showDialog.set(true);
  }

  triggerQRImport(fileInput: HTMLInputElement): void {
    const selectedBankId = this.accountForm.get('bankId')!.value;
    if (!selectedBankId) {
      this.notificationService.warn('Banco requerido', 'Selecciona primero un banco de Bolivia para validar el QR.');
      return;
    }

    fileInput.value = '';
    fileInput.click();
  }

  async onQRFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      this.notificationService.warn('Formato no válido', 'Solo se permiten imágenes PNG o JPG para importar QR.');
      return;
    }

    this.isQrImporting.set(true);
    this.qrImportMessage.set(null);

    try {
      const qrContent = await this.decodeQrFromImage(file);
      const securityError = this.validateQrSecurity(qrContent);
      if (securityError) {
        this.notificationService.error('QR bloqueado por seguridad', securityError);
        this.accountForm.patchValue({ isQR: false, otherAccountValue: '' }, { emitEvent: false });
        this.qrImportMessage.set(null);
        return;
      }

      const validationError = this.validateBolivianQr(qrContent);

      if (validationError) {
        this.notificationService.warn('QR no válido', validationError);
        this.accountForm.patchValue({ isQR: false, otherAccountValue: '' }, { emitEvent: false });
        return;
      }

      const expirationDate = await this.extractExpirationDate(qrContent, file);
      if (!expirationDate) {
        const shouldContinue = await this.confirmImportWithoutVisibleDate();
        if (!shouldContinue) {
          this.accountForm.patchValue({ isQR: false, otherAccountValue: '' }, { emitEvent: false });
          this.qrImportMessage.set(null);
          return;
        }

        this.accountForm.patchValue({ isQR: true, otherAccountValue: qrContent }, { emitEvent: false });
        this.qrImportMessage.set('QR importado con advertencia: no se detectó fecha visible en el texto.');
        this.notificationService.warn(
          'QR importado con advertencia',
          'No se encontró fecha visible en el texto del QR. Se guardará bajo tu confirmación.'
        );
        return;
      }

      this.accountForm.patchValue({ isQR: true, otherAccountValue: qrContent }, { emitEvent: false });
      this.qrImportMessage.set('QR importado y validado correctamente.');
      this.notificationService.success('QR válido', 'El QR fue validado y quedará asociado a la cuenta.');
    } catch {
      this.accountForm.patchValue({ isQR: false, otherAccountValue: '' }, { emitEvent: false });
      this.notificationService.error('Error QR', 'No se pudo leer el QR de la imagen seleccionada.');
    } finally {
      this.isQrImporting.set(false);
    }
  }

  saveAccount(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const formValue = this.accountForm.value;

    if ((formValue.isQR ?? false) && !formValue.otherAccountValue) {
      this.notificationService.warn('QR requerido', 'Debes importar un QR válido antes de guardar esta cuenta.');
      return;
    }

    if (this.isEditing()) {
      const id = this.editingAccountId()!;
      this.bankAccountService.updateAccount(id, {
        userId: this.userId,
        bankId: formValue.bankId,
        accountNumber: formValue.accountNumber,
        holderName: formValue.holderName,
        type: formValue.type,
        country: formValue.country,
        isYape: formValue.isYape ?? false,
        isQR: formValue.isQR ?? false,
        otherAccountValue: formValue.otherAccountValue ?? '',
      }).subscribe({
        next: () => {
          this.notificationService.success('Éxito', 'Cuenta actualizada correctamente.');
          this.showDialog.set(false);
          this.loadAccounts();
        },
        error: () => {
          this.notificationService.error('Error', 'No se pudo actualizar la cuenta.');
        },
      });
    } else {
      const dto: CreateAccountDto = {
        userId: this.userId,
        bankId: formValue.bankId,
        accountNumber: formValue.accountNumber,
        holderName: formValue.holderName,
        type: formValue.type,
        country: formValue.country,
        isYape: formValue.isYape ?? false,
        isQR: formValue.isQR ?? false,
        otherAccountValue: formValue.otherAccountValue ?? '',
      };
      debugger;
      this.bankAccountService.createAccount(dto).subscribe({
        next: () => {
          this.notificationService.success('Éxito', 'Cuenta creada correctamente.');
          this.showDialog.set(false);
          this.loadAccounts();
        },
        error: () => {
          this.notificationService.error('Error', 'No se pudo crear la cuenta.');
        },
      });
    }
  }

  confirmDelete(account: BankAccount): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar la cuenta ${account.accountNumber} de ${account.bankName || this.getBankName(account.bankId)}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.deleteAccount(account.id);
      },
    });
  }

  private deleteAccount(id: string): void {
    this.bankAccountService.deleteAccount(id).subscribe({
      next: () => {
        this.notificationService.success('Éxito', 'Cuenta eliminada correctamente.');
        this.loadAccounts();
      },
      error: () => {
        this.notificationService.error('Error', 'No se pudo eliminar la cuenta.');
      },
    });
  }

  getTipoSeverity(tipo: AccountType): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return tipo === 'origen' ? 'info' : 'success';
  }

  getTipoLabel(tipo: AccountType): string {
    return tipo === 'origen' ? 'Origen' : 'Destino';
  }

  getAccountsByType(type: AccountType): BankAccount[] {
    return this.accounts().filter((a) => a.type === type);
  }

  getCountByType(type: AccountType): number {
    return this.accounts().filter((a) => a.type === type).length;
  }

  private resetQrFieldsIfNeeded(): void {
    if (!this.canShowQRToggle()) {
      this.accountForm.patchValue({ isQR: false, otherAccountValue: '' }, { emitEvent: false });
      this.qrImportMessage.set(null);
    }
  }

  private async decodeQrFromImage(file: File): Promise<string> {
    const dataUrl = await this.readFileAsDataUrl(file);
    const image = await this.loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('No se pudo crear el contexto de imagen');
    }

    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

    if (!qrCode?.data) {
      throw new Error('No se encontró un QR en la imagen');
    }

    return qrCode.data.trim();
  }

  private validateBolivianQr(qrContent: string): string | null {
    const bankId = this.accountForm.get('bankId')!.value;
    const bank = this.banks().find((item) => item.externalId === bankId);

    if (!bank || bank.country !== 'Bolivia') {
      return 'El QR debe pertenecer a una cuenta de un banco de Bolivia.';
    }

    if (!bank.active) {
      return 'El banco seleccionado no está activo para operar con QR.';
    }

    return null;
  }

  private confirmImportWithoutVisibleDate(): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmationService.confirm({
        header: 'Confirmar QR sin fecha visible',
        message:
          'No se detectó una fecha visible en el contenido del QR. Te recomendamos verificar su vigencia con tu banco. ¿Deseas incluirlo de todas formas?',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, incluir QR',
        rejectLabel: 'No incluir',
        accept: () => resolve(true),
        reject: () => resolve(false),
      });
    });
  }

  private validateQrSecurity(payload: string): string | null {
    const value = payload.trim();
    if (!value) {
      return 'El contenido del QR está vacío.';
    }

    if (value.length > AccountsComponent.MAX_QR_PAYLOAD_LENGTH) {
      return 'El QR supera el tamaño permitido para ser procesado de forma segura.';
    }

    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value)) {
      return 'El QR contiene caracteres de control no permitidos.';
    }

    const lowerValue = value.toLowerCase();
    const blockedPatterns = [
      '<script',
      '</script',
      'javascript:',
      'vbscript:',
      'data:text/html',
      'file://',
      '<iframe',
      '<img',
      'onerror=',
      'onload=',
    ];

    if (blockedPatterns.some((pattern) => lowerValue.includes(pattern))) {
      return 'Se detectó contenido potencialmente malicioso en el QR.';
    }

    return null;
  }

  private async extractExpirationDate(qrContent: string, file: File): Promise<Date | null> {
    const qrPayloadDate = this.extractDateFromQrContent(qrContent);
    if (qrPayloadDate) {
      return qrPayloadDate;
    }

    const printedText = await this.extractTextFromImage(file);
    if (!printedText) {
      return null;
    }

    return this.extractDateFromPrintedText(printedText);
  }

  private extractDateFromPrintedText(rawText: string): Date | null {
    const normalized = rawText
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');

    const dateAfterLabel = normalized.match(
      /(?:valido\s*hasta|vigente\s*hasta|vigencia|fecha\s*(?:de\s*)?(?:expiracion|vencimiento))\s*[:\-]?\s*(\d{1,2}[\/.\-]\d{1,2}[\/.\-](?:\d{2}|\d{4})|\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4})/i
    );

    if (dateAfterLabel?.[1]) {
      const parsedFromLabel = this.parseDate(dateAfterLabel[1]) ?? this.parseSpanishLiteralDate(dateAfterLabel[1]);
      if (parsedFromLabel) {
        return parsedFromLabel;
      }
    }

    const anyNumericDate = normalized.match(/(\d{1,2}[\/.\-]\d{1,2}[\/.\-](?:\d{2}|\d{4}))/);
    if (anyNumericDate?.[1]) {
      const parsedAny = this.parseDate(anyNumericDate[1]);
      if (parsedAny) {
        return parsedAny;
      }
    }

    const anyLiteralDate = normalized.match(/(\d{1,2}\s+de\s+[a-z]+\s+de\s+\d{4})/);
    if (anyLiteralDate?.[1]) {
      return this.parseSpanishLiteralDate(anyLiteralDate[1]);
    }

    return null;
  }

  private extractDateFromQrContent(content: string): Date | null {
    const dateByLabelPattern =
      /(?:fecha(?:[_\s-]?(?:expiracion|vencimiento|validez|expira)?)|expiration(?:[_\s-]?date)?|valid(?:[_\s-]?(?:until|to))?|expires?(?:[_\s-]?at)?)\s*[:=]\s*([0-3]?\d[\/.-][01]?\d[\/.-](?:\d{2}|\d{4})|\d{4}[\/.-][01]?\d[\/.-][0-3]?\d|\d{10,13})/i;
    const genericDatePattern = /(\d{4}[\/.-][01]?\d[\/.-][0-3]?\d|[0-3]?\d[\/.-][01]?\d[\/.-](?:\d{2}|\d{4}))/;
    const isoDateTimePattern = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?\b/;
    const slashedDateTimePattern = /\b[0-3]?\d[\/.-][01]?\d[\/.-](?:\d{2}|\d{4})[ T]\d{1,2}:\d{2}(?::\d{2})?\b/;
    const compactDatePattern = /\b(?:19|20)\d{6}\b/;
    const compactDateTimePattern = /\b(?:19|20)\d{12}\b/;
    const epochPattern = /\b(1\d{9}|1\d{12})\b/;

    const candidates = this.buildQrPayloadCandidates(content);
    for (const candidate of candidates) {
      const normalized = candidate.trim();

      const labeledMatch = normalized.match(dateByLabelPattern);
      if (labeledMatch?.[1]) {
        const fromLabel = this.parseDate(labeledMatch[1]);
        if (fromLabel) {
          return fromLabel;
        }

        const epochFromLabel = this.parseEpochDate(labeledMatch[1]);
        if (epochFromLabel) {
          return epochFromLabel;
        }
      }

      const genericMatch = normalized.match(genericDatePattern);
      if (genericMatch?.[1]) {
        const genericDate = this.parseDate(genericMatch[1]);
        if (genericDate) {
          return genericDate;
        }
      }

      const isoDateTimeMatch = normalized.match(isoDateTimePattern);
      if (isoDateTimeMatch?.[0]) {
        const isoDate = this.parseIsoDateTime(isoDateTimeMatch[0]);
        if (isoDate) {
          return isoDate;
        }
      }

      const slashedDateTimeMatch = normalized.match(slashedDateTimePattern);
      if (slashedDateTimeMatch?.[0]) {
        const slashedDateTime = this.parseSlashedDateTime(slashedDateTimeMatch[0]);
        if (slashedDateTime) {
          return slashedDateTime;
        }
      }

      const compactDateTimeMatch = normalized.match(compactDateTimePattern);
      if (compactDateTimeMatch?.[0]) {
        const compactDateTime = this.parseCompactDateTime(compactDateTimeMatch[0]);
        if (compactDateTime) {
          return compactDateTime;
        }
      }

      const compactDateMatch = normalized.match(compactDatePattern);
      if (compactDateMatch?.[0]) {
        const compactDate = this.parseCompactDate(compactDateMatch[0]);
        if (compactDate) {
          return compactDate;
        }
      }

      const epochMatch = normalized.match(epochPattern);
      if (epochMatch?.[1]) {
        const epochDate = this.parseEpochDate(epochMatch[1]);
        if (epochDate) {
          return epochDate;
        }
      }
    }

    return null;
  }

  private buildQrPayloadCandidates(content: string): string[] {
    const queue: string[] = [content];
    const visited = new Set<string>();

    for (let index = 0; index < queue.length && index < 40; index += 1) {
      const current = queue[index].trim();
      if (!current || visited.has(current)) {
        continue;
      }
      visited.add(current);

      if (current.includes('|')) {
        for (const part of current.split('|')) {
          const value = part.trim();
          if (value) {
            queue.push(value);
          }
        }
      }

      const urlDecoded = this.tryDecodeURIComponent(current);
      if (urlDecoded && urlDecoded !== current) {
        queue.push(urlDecoded);
      }

      const base64DecodedUtf8 = this.tryDecodeBase64(current, 'utf8');
      if (base64DecodedUtf8) {
        queue.push(base64DecodedUtf8);
      }

      const base64DecodedLatin1 = this.tryDecodeBase64(current, 'latin1');
      if (base64DecodedLatin1) {
        queue.push(base64DecodedLatin1);
      }

      if (current.includes('.')) {
        const jwtLike = current.split('.');
        if (jwtLike.length >= 2) {
          for (const segment of jwtLike) {
            const normalized = this.normalizeBase64Url(segment);
            if (normalized) {
              const decoded = this.tryDecodeBase64(normalized, 'utf8');
              if (decoded) {
                queue.push(decoded);
              }
            }
          }
        }
      }
    }

    return [...visited];
  }

  private tryDecodeURIComponent(value: string): string | null {
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  private normalizeBase64Url(value: string): string {
    const replaced = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = replaced.length % 4;
    if (padding === 0) {
      return replaced;
    }
    return replaced.padEnd(replaced.length + (4 - padding), '=');
  }

  private tryDecodeBase64(value: string, encoding: 'utf8' | 'latin1'): string | null {
    if (!/^[A-Za-z0-9+/=_-]{16,}$/.test(value)) {
      return null;
    }

    try {
      const normalized = this.normalizeBase64Url(value);
      const decoded = atob(normalized);
      if (!decoded) {
        return null;
      }

      if (encoding === 'latin1') {
        return decoded;
      }

      const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
      return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    } catch {
      return null;
    }
  }

  private parseEpochDate(rawValue: string): Date | null {
    if (!/^\d{10,13}$/.test(rawValue)) {
      return null;
    }

    const timestamp = Number(rawValue.length === 10 ? `${rawValue}000` : rawValue);
    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  private parseIsoDateTime(rawValue: string): Date | null {
    const parsed = new Date(rawValue);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }

  private parseSlashedDateTime(rawValue: string): Date | null {
    const parts = rawValue.trim().split(/[ T]/);
    if (parts.length < 2) {
      return null;
    }

    const datePart = this.parseDate(parts[0]);
    if (!datePart) {
      return null;
    }

    const timeMatch = parts[1].match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!timeMatch) {
      return datePart;
    }

    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const seconds = Number(timeMatch[3] ?? '0');
    if (hours > 23 || minutes > 59 || seconds > 59) {
      return null;
    }

    const parsed = new Date(
      datePart.getFullYear(),
      datePart.getMonth(),
      datePart.getDate(),
      hours,
      minutes,
      seconds
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private parseCompactDate(rawValue: string): Date | null {
    if (!/^\d{8}$/.test(rawValue)) {
      return null;
    }

    const year = Number(rawValue.slice(0, 4));
    const month = Number(rawValue.slice(4, 6));
    const day = Number(rawValue.slice(6, 8));

    const parsed = new Date(year, month - 1, day);
    const valid =
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day;

    return valid ? parsed : null;
  }

  private parseCompactDateTime(rawValue: string): Date | null {
    if (!/^\d{14}$/.test(rawValue)) {
      return null;
    }

    const year = Number(rawValue.slice(0, 4));
    const month = Number(rawValue.slice(4, 6));
    const day = Number(rawValue.slice(6, 8));
    const hour = Number(rawValue.slice(8, 10));
    const minute = Number(rawValue.slice(10, 12));
    const second = Number(rawValue.slice(12, 14));

    if (hour > 23 || minute > 59 || second > 59) {
      return null;
    }

    const parsed = new Date(year, month - 1, day, hour, minute, second);
    const valid =
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day;

    return valid ? parsed : null;
  }

  private parseDate(rawDate: string): Date | null {
    const normalized = rawDate.replace(/[.]/g, '/').replace(/-/g, '/');
    const parts = normalized.split('/').map((segment) => Number(segment));
    if (parts.length !== 3 || parts.some((segment) => Number.isNaN(segment))) {
      return null;
    }

    let year: number;
    let month: number;
    let day: number;

    if (parts[0] > 31) {
      year = parts[0];
      month = parts[1];
      day = parts[2];
    } else {
      day = parts[0];
      month = parts[1];
      year = parts[2] < 100 ? 2000 + parts[2] : parts[2];
    }

    const parsedDate = new Date(year, month - 1, day);
    const isValidDate =
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === month - 1 &&
      parsedDate.getDate() === day;

    return isValidDate ? parsedDate : null;
  }

  private parseSpanishLiteralDate(rawDate: string): Date | null {
    const match = rawDate
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .match(/(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})/);

    if (!match) {
      return null;
    }

    const day = Number(match[1]);
    const month = this.getSpanishMonthIndex(match[2]);
    const year = Number(match[3]);

    if (month === null) {
      return null;
    }

    const parsed = new Date(year, month, day);
    const valid =
      parsed.getFullYear() === year &&
      parsed.getMonth() === month &&
      parsed.getDate() === day;

    return valid ? parsed : null;
  }

  private getSpanishMonthIndex(monthName: string): number | null {
    const map: Record<string, number> = {
      enero: 0,
      febrero: 1,
      marzo: 2,
      abril: 3,
      mayo: 4,
      junio: 5,
      julio: 6,
      agosto: 7,
      septiembre: 8,
      setiembre: 8,
      octubre: 9,
      noviembre: 10,
      diciembre: 11,
    };

    return map[monthName] ?? null;
  }

  private async extractTextFromImage(file: File): Promise<string | null> {
    try {
      const tesseract = await import('tesseract.js');
      const result = await tesseract.recognize(file, 'spa+eng');
      return result.data.text ?? null;
    } catch {
      return null;
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      image.src = dataUrl;
    });
  }
}
