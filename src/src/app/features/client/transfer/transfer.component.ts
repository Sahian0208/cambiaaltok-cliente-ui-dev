import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import jsQR from 'jsqr';

// Shared components
import { StepperComponent } from '../../../shared/components/stepper/stepper.component';
import { FileUploadComponent, FileUploadEvent } from '../../../shared/components/file-upload/file-upload.component';
import { AccountsSelectionComponent } from './accounts-selection/accounts-selection.component';

// Services
import { TransactionService, CreateTransactionDto } from '../../../core/services/transaction.service';
import { BankAccountService, CreateAccountDto } from '../../../core/services/bank-account.service';
import { RateService } from '../../../core/services/rate.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CouponService } from '../../../core/services/coupon.service';

// Models
import { BankAccount, AccountType } from '../../../core/models/bank-account.model';
import { Bank } from '../../../core/models/bank.model';
import { Transaction } from '../../../core/models/transaction.model';
import { AppliedCoupon } from '../../../core/models/coupon.model';
import { CalculatorTransferData } from '../../../core/models/calculator-transfer-data.model';
import { environment } from '../../../../environments/environment';
import { BankAccountInfoComponent } from "../../../shared/components/bank-account-info/bank-account-info.component";

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    Select,
    InputNumber,
    InputText,
    ToggleSwitch,
    Dialog,
    ConfirmDialog,
    ProgressSpinner,
    StepperComponent,
    FileUploadComponent,
    AccountsSelectionComponent,
    BankAccountInfoComponent,
],
  providers: [ConfirmationService],
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss'],
})
export class TransferComponent implements OnInit, OnDestroy {
  private static readonly MAX_QR_PAYLOAD_LENGTH = 4096;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transactionService = inject(TransactionService);
  private readonly bankAccountService = inject(BankAccountService);
  private readonly rateService = inject(RateService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly couponService = inject(CouponService);
  private readonly confirmationService = inject(ConfirmationService);

  // State
  currentStep = 1;
  transaction: Transaction | null = null;
  loading = false;
  isExistingTransaction = false;

  // Step 1 data
  transferForm!: FormGroup;
  sourceAccounts: BankAccount[] = [];
  destinationAccounts: BankAccount[] = [];
  convertedAmount = 0;
  appliedRate = 0;
  updatingQrAccountId: string | null = null;

  // Step 2 data
  comprobanteFile: File | null = null;
  comprobantePreview: string | null = null;
  intermediaryAccount: BankAccount | null = null;

  // Inline account creation
  showAccountDialog = false;
  accountDialogType: AccountType = 'origen';
  newAccountForm!: FormGroup;
  availableBanks: Bank[] = [];
  savingAccount = false;

  // Coupon state
  showCouponInput = false;
  couponCode = '';
  couponLoading = false;
  couponError = '';
  appliedCoupon: AppliedCoupon | null = null;

  // Calculator pre-filled data (from home page)
  calculatorData: CalculatorTransferData | null = null;
  isFromCalculator = false;

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.initForm();
    this.initAccountForm();
    this.loadAccounts();
    this.loadBanks();

    // Check if navigated from home calculator with pre-filled data
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;
    if (state?.calculatorData) {
      this.calculatorData = state.calculatorData as CalculatorTransferData;
      this.isFromCalculator = true;
      this.applyCalculatorData();
    }

    // Check if we're loading an existing transaction
    const transactionId = this.route.snapshot.paramMap.get('id');
    if (transactionId) {
      this.isExistingTransaction = true;
      this.loadTransaction(transactionId);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  buildAttachUrl(attachmentId: any) {
     return `${environment.apiBaseUrl}/v1/attachment/${attachmentId}/preview`;
    }

  // --- Step 1: Form initialization and account loading ---

  private initForm(): void {
    this.transferForm = this.fb.group({
      sourceAmount: [null, [Validators.required, Validators.min(1)]],
      sourceCurrency: ['BOB', Validators.required],
      sourceAccountId: [null, Validators.required],
      destinationAccountId: [null, Validators.required],
    });

    // Listen to amount changes to update conversion
    this.subscriptions.add(
      this.transferForm.get('sourceAmount')!.valueChanges.subscribe(() => this.updateConversion())
    );
    // Currency change swaps origen/destino countries, so refresh accounts and clear stale selections
    this.subscriptions.add(
      this.transferForm.get('sourceCurrency')!.valueChanges.subscribe(() => {
        this.transferForm.patchValue(
          { sourceAccountId: null, destinationAccountId: null },
          { emitEvent: false }
        );
        this.loadAccounts();
        this.updateConversion();
      })
    );
  }

  private loadAccounts(): void {
    const user = this.authService.getCurrentUser()();
    if (!user) return;

    const sourceCountry = this.getRequiredCountry('origen');
    const destinationCountry = this.getRequiredCountry('destino');

    this.subscriptions.add(
      this.bankAccountService.getAccountsByTypeAndCountry(user.id, 'origen', sourceCountry).subscribe({
        next: (accounts) => (this.sourceAccounts = accounts),
        error: () => this.notificationService.error('Error', 'No se pudieron cargar las cuentas de origen'),
      })
    );

    this.subscriptions.add(
      this.bankAccountService.getAccountsByTypeAndCountry(user.id, 'destino', destinationCountry).subscribe({
        next: (accounts) => (this.destinationAccounts = accounts),
        error: () => this.notificationService.error('Error', 'No se pudieron cargar las cuentas de destino'),
      })
    );
  }

  private loadTransaction(id: string): void {
    this.loading = true;
    this.subscriptions.add(
      this.transactionService.getTransactionById(id).subscribe({
        next: (transaction) => {
          this.transaction = transaction;
          this.currentStep = this.transactionService.getStepForStatus(transaction.status);
          this.loading = false;
          // Load intermediary account if at step 2
          if (this.currentStep === 2) {
            this.loadIntermediaryAccount();
          }
        },
        error: () => {
          this.notificationService.error('Error', 'No se pudo cargar la transacción');
          this.loading = false;
          this.router.navigate(['/cliente']);
        },
      })
    );
  }

  updateConversion(): void {
    const monto = this.transferForm.get('sourceAmount')?.value;
    const moneda = this.transferForm.get('sourceCurrency')?.value as 'BOB' | 'PEN';
    if (monto && monto > 0) {
      this.appliedRate = this.rateService.getConversionRate(moneda);
      this.convertedAmount = this.rateService.convertAmount(monto, moneda);
    } else {
      this.convertedAmount = 0;
      this.appliedRate = 0;
    }
  }

  /**
   * Pre-fill the transfer form with data from the home calculator.
   * Sets the form to read-only for the amount section.
   */
  private applyCalculatorData(): void {
    if (!this.calculatorData) return;

    this.transferForm.patchValue({
      sourceAmount: this.calculatorData.sourceAmount,
      sourceCurrency: this.calculatorData.sourceCurrency,
    }, { emitEvent: false });

    this.convertedAmount = this.calculatorData.destinationAmount;
    this.appliedRate = this.calculatorData.appliedRate;

    if (this.calculatorData.coupon) {
      this.appliedCoupon = {
        code: this.calculatorData.coupon.code,
        bonusAmount: this.calculatorData.coupon.bonusAmount,
        bonusCurrency: this.calculatorData.coupon.bonusCurrency,
        reason: this.calculatorData.coupon.reason,
        spreadPercent: this.calculatorData.coupon.spreadPercent,
      };
    }

    // Reload accounts based on the calculator's currency (may differ from default 'BOB')
    this.loadAccounts();
  }

  get destinationCurrency(): 'BOB' | 'PEN' {
    const sourceCurrency = this.transferForm.get('sourceCurrency')?.value;
    return sourceCurrency === 'BOB' ? 'PEN' : 'BOB';
  }

  /**
   * Total amount the client will receive = converted amount + coupon bonus.
   * Coupon bonus only applies if the coupon's currency matches the destination currency.
   */
  get totalToReceive(): number {
    let total = this.convertedAmount;
    if (this.appliedCoupon && this.appliedCoupon.bonusCurrency === this.destinationCurrency) {
      total += this.appliedCoupon.bonusAmount;
    }
    return Math.round(total * 100) / 100;
  }

  get couponBonusApplicable(): boolean {
    return !!this.appliedCoupon && this.appliedCoupon.bonusCurrency === this.destinationCurrency;
  }

  get currencyOptions() {
    return [
      { label: 'BOB (Bolivianos)', value: 'BOB' },
      { label: 'PEN (Soles)', value: 'PEN' },
    ];
  }

  get hasNoAccounts(): boolean {
    return false; //this.sourceAccounts.length === 0 || this.destinationAccounts.length === 0;
  }

  /**
   * Resolve bank name for a given account to display in selects.
   */
  getBankName(account: BankAccount): string {
    if (account.isYape) return 'Yape';
    const bank = this.availableBanks.find((b) => b.externalId === account.bankId);
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

  // --- File upload handlers ---

  onComprobanteSelected(event: FileUploadEvent): void {
    this.comprobanteFile = event.file;
    this.comprobantePreview = event.previewUrl;
  }

  // --- Step 1: Submit transfer ---

  submitTransfer(): void {
    if (this.transferForm.invalid) {
      this.notificationService.warn('Formulario incompleto', 'Complete todos los campos requeridos.');
      return;
    }

    this.loading = true;
    const user = this.authService.getCurrentUser()();
    if (!user) return;

    const formValue = this.transferForm.value;
    const sourceCurrency = formValue.sourceCurrency as 'BOB' | 'PEN';
    const destinationCurrency = this.destinationCurrency;

    const dto: CreateTransactionDto = {
      clientId: user.id,
      intermediaryId: 'intermediario-001', // Assigned by system in real scenario
      sourceAmount: formValue.sourceAmount,
      sourceCurrency,
      destinationAmount: this.totalToReceive,
      destinationCurrency,
      appliedRate: this.appliedRate,
      sourceAccountId: formValue.sourceAccountId,
      destinationAccountId: formValue.destinationAccountId,
      destinationQrUrl: '',
      fileName: '',
      couponCode: this.appliedCoupon?.code ?? undefined,
    };

    this.subscriptions.add(
      this.transactionService.createTransaction(dto).subscribe({
        next: (transaction) => {
          this.transaction = transaction;
          this.currentStep = 2;
          this.loading = false;
          // Mark coupon as used if one was applied
          if (this.appliedCoupon) {
            this.couponService.markAsUsed(this.appliedCoupon.code);
          }
          this.notificationService.success('Operación registrada', 'Su transferencia ha sido creada exitosamente.');
          // Load the intermediary account for the client to deposit
          this.loadIntermediaryAccount();
        },
        error: (err) => {          
          this.loading = false;
          this.notificationService.error('Error', err.error.messages[0]);
          //this.notificationService.error('Error', 'No se pudo crear la transferencia.');
        },
      })
    );
  }

  // --- Step 2: Upload receipt ---

  submitReceipt(): void {
    if (!this.comprobanteFile || !this.transaction) {
      this.notificationService.warn('Comprobante requerido', 'Suba el comprobante de depósito.');
      return;
    }
   
    if(!this.intermediaryAccount){
      this.notificationService.warn('Aviso', 'Cuenta bancaria de Fazilito no seleccionado');
      return;
    }

    this.loading = true;
    this.subscriptions.add(
      this.transactionService.uploadReceipt(this.transaction.id, this.comprobanteFile, 'cliente', this.intermediaryAccount.id).subscribe({
        next: (transaction) => {
          this.transaction = transaction;
          this.currentStep = this.transactionService.getStepForStatus(transaction.status);
          this.loading = false;
          this.notificationService.success('Comprobante enviado', 'Su comprobante ha sido enviado para verificación.');
        },
        error: () => {
          this.loading = false;
          this.notificationService.error('Error', 'No se pudo subir el comprobante.');
        },
      })
    );
  }

  // --- Step 5: Download receipt ---

  downloadReceipt(): void {
    if (!this.transaction?.intermediaryReceiptUrl) return;

    const link = document.createElement('a');
    link.href = this.transaction.intermediaryReceiptUrl;
    link.download = `comprobante-transferencia-${this.transaction.id}.png`;
    link.click();
  }

  // --- Navigation ---

  goToAccounts(): void {
    this.router.navigate(['/cliente/cuentas']);
  }

  goToDashboard(): void {
    this.router.navigate(['/cliente/dashboard']);
  }

  // --- Intermediary Account (Step 2) ---

  /**
   * Load the intermediary (CambiaAltok) account where the client must deposit.
   * Uses the transaction's sourceAccountId to get the matching intermediary account.
   */
  private loadIntermediaryAccount(): void {
    if (!this.transaction?.sourceAccountId) return;

    this.subscriptions.add(
      this.bankAccountService.getIntermediarAccountForClient(this.transaction.sourceAccountId).subscribe({
        next: (account) => {
          this.intermediaryAccount = account;
        },
        error: () => {
          this.notificationService.error('Error', 'No se pudo cargar la cuenta de depósito.');
        },
      })
    );
  }

  // --- Coupon ---

  toggleCouponInput(): void {
    this.showCouponInput = !this.showCouponInput;
    if (!this.showCouponInput) {
      this.couponCode = '';
      this.couponError = '';
    }
  }

  validateCoupon(): void {
    if (!this.couponCode.trim()) {
      this.couponError = 'Ingresa un código de cupón';
      return;
    }

    const user = this.authService.getCurrentUser()();
    if (!user) return;

    this.couponLoading = true;
    this.couponError = '';

    this.subscriptions.add(
      this.couponService.validateCoupon({
        code: this.couponCode.trim(),
        userId: user.id,
        amount : 0,
        currencyFrom: this.transferForm.get('sourceCurrency')?.value,     
        currencyTo: this.destinationCurrency,
      }).subscribe({
        next: (response) => {
          this.couponLoading = false;
          if (response.isValid) {
            this.appliedCoupon = {
              code: response.code,
              bonusAmount: response.bonusAmount,
              bonusCurrency: response.bonusCurrency,
              reason: response.reason,
              message: response.message,
              spreadPercent : response.spreadPercent,
            };
            this.couponError = '';
            this.notificationService.success('¡Cupón aplicado!', response.message);
          } else {
            this.couponError = response.message;
            this.appliedCoupon = null;
          }
        },
        error: () => {
          this.couponLoading = false;
          this.couponError = 'Error al validar el cupón. Intenta de nuevo.';
        },
      })
    );
  }

  removeCoupon(): void {
    this.appliedCoupon = null;
    this.couponCode = '';
    this.couponError = '';
    this.showCouponInput = false;
  }

  // --- Inline Account Creation ---

  readonly qrImportMessage = signal<string | null>(null);
  readonly isQrImporting = signal(false);

  private initAccountForm(): void {
    this.newAccountForm = this.fb.group({
      bankId: [null, Validators.required],
      accountNumber: ['', Validators.required],
      holderName: ['', Validators.required],
      country: ['Bolivia', Validators.required],
      isYape: [false],
      isQR: [false],
      otherAccountValue: [''],
    });

    this.newAccountForm.get('country')!.valueChanges.subscribe((country: 'Bolivia' | 'Peru') => {
      this.selectedPais.set(country);
      this.resetQrFieldsIfNeeded();
    });

    this.newAccountForm.get('isQR')!.valueChanges.subscribe((enabled: boolean) => {
      if (!enabled) {
        this.newAccountForm.patchValue({ otherAccountValue: '' }, { emitEvent: false });
        this.qrImportMessage.set(null);
      }
    });
  }

  private loadBanks(): void {
    this.subscriptions.add(
      this.bankAccountService.getAvailableBanks('Bolivia').subscribe({
        next: (banks) => (this.availableBanks = [...this.availableBanks, ...banks]),
      })
    );
    this.subscriptions.add(
      this.bankAccountService.getAvailableBanks('Peru').subscribe({
        next: (banks) => (this.availableBanks = [...this.availableBanks, ...banks]),
      })
    );
  }

  get banksForSelectedCountry(): Bank[] {
    const country = this.newAccountForm.get('country')?.value;
    return this.availableBanks.filter((b) => b.country === country && b.active);
  }

  get countryOptions() {
    return [
      { label: 'Bolivia', value: 'Bolivia' },
      { label: 'Perú', value: 'Peru' },
    ];
  }

  readonly accounts = signal<BankAccount[]>([]);

  readonly selectedPais = signal<'' | 'Bolivia' | 'Peru'>('');
  
  readonly selectedTipo = signal<AccountType>('origen');

  // Según la moneda de origen, cada tipo de cuenta solo puede ser de un país
  private getRequiredCountry(type: AccountType): 'Bolivia' | 'Peru' {
    const sourceCurrency = this.transferForm.get('sourceCurrency')?.value as 'BOB' | 'PEN';
    const sourceCountry: 'Bolivia' | 'Peru' = sourceCurrency === 'BOB' ? 'Bolivia' : 'Peru';
    const destinationCountry: 'Bolivia' | 'Peru' = sourceCountry === 'Bolivia' ? 'Peru' : 'Bolivia';
    return type === 'origen' ? sourceCountry : destinationCountry;
  }

  openAccountDialog(type: AccountType): void {
    this.accountDialogType = type;
    this.selectedTipo.set(type);

    const requiredCountry = this.getRequiredCountry(type);
    this.selectedPais.set(requiredCountry);
    this.newAccountForm.reset({ country: requiredCountry, isYape: false, isQR: false, otherAccountValue: '' });
    this.newAccountForm.get('country')!.disable({ emitEvent: false });
    this.qrImportMessage.set(null);
    this.showAccountDialog = true;
  }

  closeAccountDialog(): void {
    this.showAccountDialog = false;
  }

  // Solo las cuentas destino en Bolivia permiten importar QR (igual que en accounts.component)
  readonly canShowQRToggle = computed(() => {
    return this.selectedPais() === 'Bolivia' && this.selectedTipo() === 'destino';
  });

  private resetQrFieldsIfNeeded(): void {
    if (!this.canShowQRToggle()) {
      this.newAccountForm.patchValue({ isQR: false, otherAccountValue: '' }, { emitEvent: false });
      this.qrImportMessage.set(null);
    }
  }

  triggerQRImport(fileInput: HTMLInputElement): void {
    const selectedBankId = this.newAccountForm.get('bankId')!.value;
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
        this.newAccountForm.patchValue({ isQR: false, otherAccountValue: '' }, { emitEvent: false });
        this.qrImportMessage.set(null);
        return;
      }

      const validationError = this.validateBolivianQr();
      if (validationError) {
        this.notificationService.warn('QR no válido', validationError);
        this.newAccountForm.patchValue({ isQR: false, otherAccountValue: '' }, { emitEvent: false });
        return;
      }

      const expirationDate = await this.extractExpirationDate(qrContent, file);
      if (!expirationDate) {
        const shouldContinue = await this.confirmImportWithoutVisibleDate();
        if (!shouldContinue) {
          this.newAccountForm.patchValue({ isQR: false, otherAccountValue: '' }, { emitEvent: false });
          this.qrImportMessage.set(null);
          return;
        }

        this.newAccountForm.patchValue({ isQR: true, otherAccountValue: qrContent }, { emitEvent: false });
        this.qrImportMessage.set('QR importado con advertencia: no se detectó fecha visible en el texto.');
        this.notificationService.warn(
          'QR importado con advertencia',
          'No se encontró fecha visible en el texto del QR. Se guardará bajo tu confirmación.'
        );
        return;
      }

      this.newAccountForm.patchValue({ isQR: true, otherAccountValue: qrContent }, { emitEvent: false });
      this.qrImportMessage.set('QR importado y validado correctamente.');
      this.notificationService.success('QR válido', 'El QR fue validado y quedará asociado a la cuenta.');
    } catch {
      this.newAccountForm.patchValue({ isQR: false, otherAccountValue: '' }, { emitEvent: false });
      this.notificationService.error('Error QR', 'No se pudo leer el QR de la imagen seleccionada.');
    } finally {
      this.isQrImporting.set(false);
    }
  }

  // Permite reemplazar el QR de una cuenta destino ya guardada, actualizándola de inmediato
  async onDestinationQrFileSelected({ account, file }: { account: BankAccount; file: File }): Promise<void> {
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      this.notificationService.warn('Formato no válido', 'Solo se permiten imágenes PNG o JPG para el QR.');
      return;
    }

    this.updatingQrAccountId = account.id;

    try {
      const qrContent = await this.decodeQrFromImage(file);
      const securityError = this.validateQrSecurity(qrContent);
      if (securityError) {
        this.notificationService.error('QR bloqueado por seguridad', securityError);
        return;
      }

      this.subscriptions.add(
        this.bankAccountService
          .updateAccount(account.id, {
            userId: account.userId,
            bankId: account.bankId,
            accountNumber: account.accountNumber,
            holderName: account.holderName,
            type: account.type,
            country: account.country,
            isYape: account.isYape,
            isQR: true,
            otherAccountValue: qrContent,
          })
          .subscribe({
            next: (updated) => {
              this.destinationAccounts = this.destinationAccounts.map((a) =>
                a.id === account.id ? { ...a, ...updated, otherAccountValue: updated.otherAccountValue ?? qrContent } : a
              );
              this.notificationService.success('QR actualizado', 'El nuevo QR fue guardado para esta cuenta.');
              this.updatingQrAccountId = null;
            },
            error: () => {
              this.notificationService.error('Error', 'No se pudo actualizar el QR de la cuenta.');
              this.updatingQrAccountId = null;
            },
          })
      );
    } catch {
      this.notificationService.error('Error QR', 'No se pudo leer el QR de la imagen seleccionada.');
      this.updatingQrAccountId = null;
    }
  }

  private validateBolivianQr(): string | null {
    const bankId = this.newAccountForm.get('bankId')!.value;
    const bank = this.availableBanks.find((item) => item.externalId === bankId);

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

    if (value.length > TransferComponent.MAX_QR_PAYLOAD_LENGTH) {
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

  saveNewAccount(): void {
    if (this.newAccountForm.invalid) {
      this.newAccountForm.markAllAsTouched();
      return;
    }

    const user = this.authService.getCurrentUser()();
    if (!user) return;

    this.savingAccount = true;
    const formValue = this.newAccountForm.getRawValue();

    if ((formValue.isQR ?? false) && !formValue.otherAccountValue) {
      this.savingAccount = false;
      this.notificationService.warn('QR requerido', 'Debes importar un QR válido antes de guardar esta cuenta.');
      return;
    }

    const dto: CreateAccountDto = {
      userId: user.id,
      bankId: formValue.isYape ? 'yape' : formValue.bankId,
      accountNumber: formValue.accountNumber,
      holderName: formValue.holderName,
      type: this.accountDialogType,
      country: formValue.country,
      isYape: formValue.isYape ?? false,
      isQR: formValue.isQR ?? false,
      otherAccountValue: formValue.otherAccountValue ?? '',
    };

    this.subscriptions.add(
      this.bankAccountService.createAccount(dto).subscribe({
        next: (account) => {
          // Add to the corresponding list and select it
          if (this.accountDialogType === 'origen') {
            this.sourceAccounts = [...this.sourceAccounts, account];
            this.transferForm.get('sourceAccountId')?.setValue(account.id);
          } else {
            this.destinationAccounts = [...this.destinationAccounts, account];
            this.transferForm.get('destinationAccountId')?.setValue(account.id);
          }

          this.savingAccount = false;
          this.showAccountDialog = false;
          this.notificationService.success('Cuenta creada', 'La cuenta fue registrada y seleccionada exitosamente.');
        },
        error: () => {
          this.savingAccount = false;
          this.notificationService.error('Error', 'No se pudo crear la cuenta bancaria.');
        },
      })
    );
  }
}
