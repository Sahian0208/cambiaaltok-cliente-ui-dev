import { Component, OnInit, OnDestroy, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AttachmentService } from '../../../core/services/attachment.service';
import { User } from '../../../core/models/user.model';
import { forkJoin, Observable, of, switchMap } from 'rxjs';

import { NaturalPersonService } from '../../../core/services/natural-person.service';
import { LegalPersonService } from '../../../core/services/legal-person.service';
import { NaturalPerson, NaturalPersonClientDto, LegalPersonClientDto } from '../../../core/models/natural-person.model';
import { OCCUPATION_OPTIONS, HOW_DID_YOU_FIND_US_OPTIONS, SOURCE_OF_FUNDS_OPTIONS, SelectOption } from '../../../shared/constants/select-options.constants';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputText,
    Select,
    ButtonModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild('cameraVideo') cameraVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('cameraCanvas') cameraCanvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly naturalPersonService = inject(NaturalPersonService);
  private readonly attachmentService = inject(AttachmentService);
  private readonly legalPersonService = inject(LegalPersonService);

  readonly occupations: SelectOption[] = OCCUPATION_OPTIONS;
  readonly howDidYouFindUsOptions: SelectOption[] = HOW_DID_YOU_FIND_US_OPTIONS;
  readonly sourceOfFundsOptions: SelectOption[] = SOURCE_OF_FUNDS_OPTIONS;

  profileForm!: FormGroup;
  legalPersonForm!: FormGroup;
  user: User | null = null;
  naturalPerson: NaturalPerson | null = null;
  saving = false;
  savingDocs = false;

  // Photo state
  profilePhotoUrl: string | null = null;
  documentFrontUrl: string | null = null;
  documentBackUrl: string | null = null;
  profilePhotoFile: File | null = null;
  documentFrontFile: File | null = null;
  documentBackFile: File | null = null;

  // Legal document state (Empresa)
  legalDocumentUrl: string | null = null;
  legalDocumentFile: File | null = null;

  // Camera state
  showCameraDialog = false;
  private cameraTarget: 'profile' | 'doc-front' | 'doc-back' | 'legal-document' = 'profile';
  private mediaStream: MediaStream | null = null;

  get isEmpresa(): boolean {
    return this.naturalPerson?.customerType === 'Empresa';
  }

  get isPersona(): boolean {
    return !this.isEmpresa;
  }

  readonly documentTypeOptions = [
    { label: 'CI (Bolivia)', value: 'CI' },
    { label: 'DNI (Perú)', value: 'DNI' },
  ];

  
  ngOnInit(): void {
    this.user = this.authService.getCurrentUser()();
    this.initForm();

    this.naturalPersonService.getNaturalPersonById(this.user?.id ?? '').subscribe({
      next: (person) => {
        this.naturalPerson = person;
        this.initForm();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  private initForm(): void {
    if (this.isEmpresa) {
      this.initLegalPersonForm();
    } else {
      this.initNaturalPersonForm();
    }

    this.profilePhotoUrl = this.buildAttachUrl(this.naturalPerson?.pictureFileExternalId || '');
    this.profilePhotoFile = null;
  }

  private initNaturalPersonForm(): void {
    this.profileForm = this.fb.group({
      firstName: [this.naturalPerson?.firstName || this.user?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [this.naturalPerson?.lastName || this.user?.lastName || '', [Validators.required, Validators.minLength(2)]],
      phone: [this.user?.phone ?? '', [Validators.required]],
      documentType: [this.user?.documentType ?? 'CI', [Validators.required]],
      documentNumber: [this.naturalPerson?.documentNumber || this.user?.documentNumber || '', [Validators.required]],
      birthDate: [this.formatDateForInput(this.naturalPerson?.birthDate || this.user?.birthDate), [Validators.required]],
      occupation: [this.naturalPerson?.occupation || '', []],
      referralSource: [this.naturalPerson?.referralSource || '', []],
      email: [this.naturalPerson?.email || this.user?.email || '', [Validators.required, Validators.email]],
      phoneNumber: [this.naturalPerson?.phoneNumber || '', [Validators.required]],
    });
    this.documentFrontUrl = this.buildAttachUrl(this.naturalPerson?.frontDocumentFileExternalId || '');
    this.documentBackUrl = this.buildAttachUrl(this.naturalPerson?.backDocumentFileExternalId || '');
    this.documentFrontFile = null;
    this.documentBackFile = null;
  }

  private initLegalPersonForm(): void {
    this.legalPersonForm = this.fb.group({
      name: [this.naturalPerson?.name || '', [Validators.required, Validators.minLength(2)]],
      legalRepresentativeName: [this.naturalPerson?.legalRepresentativeName || '', [Validators.required, Validators.minLength(2)]],
      documentNumber: [this.naturalPerson?.documentNumber || '', [Validators.required]],
      phoneNumber: [this.naturalPerson?.phoneNumber || '', [Validators.required]],
      webUrl: [this.naturalPerson?.webUrl || '', []],
      email: [this.naturalPerson?.email || this.user?.email || '', [Validators.required, Validators.email]],
    });
    this.legalDocumentUrl = this.buildAttachUrl(this.naturalPerson?.legalDocumentFileExternalId || '');
    this.legalDocumentFile = null;
  }

  private formatDateForInput(value?: string): string {
    return value ? value.slice(0, 10) : '';
  }

  // --- Profile Photo ---

  onProfilePhotoSelected(event: Event): void {
    const file = this.getFileFromEvent(event);
    if (file) {
      this.profilePhotoFile = file;
      this.readFileAsDataUrl(file, (url) => this.profilePhotoUrl = url);
    }
  }

  removeProfilePhoto(): void {
    this.profilePhotoUrl = null;
    this.profilePhotoFile = null;
  }

  // --- Document Photos ---

  onDocumentFrontSelected(event: Event): void {
    const file = this.getFileFromEvent(event);
    if (file) {
      this.documentFrontFile = file;
      this.readFileAsDataUrl(file, (url) => this.documentFrontUrl = url);
    }
  }

  onDocumentBackSelected(event: Event): void {
    const file = this.getFileFromEvent(event);
    if (file) {
      this.documentBackFile = file;
      this.readFileAsDataUrl(file, (url) => this.documentBackUrl = url);
    }
  }

  removeDocumentFront(): void {
    this.documentFrontUrl = null;
    this.documentFrontFile = null;
  }

  removeDocumentBack(): void {
    this.documentBackUrl = null;
    this.documentBackFile = null;
  }

  // --- Legal Document (Empresa) ---

  onLegalDocumentSelected(event: Event): void {
    const file = this.getFileFromEvent(event);
    if (file) {
      this.legalDocumentFile = file;
      this.readFileAsDataUrl(file, (url) => this.legalDocumentUrl = url);
    }
  }

  removeLegalDocument(): void {
    this.legalDocumentUrl = null;
    this.legalDocumentFile = null;
  }

  // --- Camera ---

  openCamera(target: 'profile' | 'doc-front' | 'doc-back' | 'legal-document'): void {
    this.cameraTarget = target;
    this.showCameraDialog = true;

    // Start camera after dialog is rendered
    setTimeout(() => this.startCamera(), 100);
  }

  closeCameraDialog(): void {
    this.stopCamera();
    this.showCameraDialog = false;
  }

  capturePhoto(): void {
    const video = this.cameraVideoRef?.nativeElement;
    const canvas = this.cameraCanvasRef?.nativeElement;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) {
        this.notificationService.error('Error', 'No se pudo generar la imagen capturada.');
        return;
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      switch (this.cameraTarget) {
        case 'profile': {
          const profileFile = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
          this.profilePhotoFile = profileFile;
          this.profilePhotoUrl = dataUrl;
          break;
        }
        case 'doc-front': {
          const frontFile = new File([blob], 'document-front.jpg', { type: 'image/jpeg' });
          this.documentFrontFile = frontFile;
          this.documentFrontUrl = dataUrl;
          break;
        }
        case 'doc-back': {
          const backFile = new File([blob], 'document-back.jpg', { type: 'image/jpeg' });
          this.documentBackFile = backFile;
          this.documentBackUrl = dataUrl;
          break;
        }
        case 'legal-document': {
          const legalFile = new File([blob], 'legal-document.jpg', { type: 'image/jpeg' });
          this.legalDocumentFile = legalFile;
          this.legalDocumentUrl = dataUrl;
          break;
        }
      }

      this.closeCameraDialog();
      this.notificationService.success('Foto capturada', 'La fotografía se guardó correctamente.');
    }, 'image/jpeg', 0.85);
  }

  private async startCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.cameraTarget === 'profile' ? 'user' : 'environment' },
      });
      const video = this.cameraVideoRef?.nativeElement;
      if (video) {
        video.srcObject = this.mediaStream;
      }
    } catch {
      this.notificationService.error('Cámara no disponible', 'No se pudo acceder a la cámara. Verifica los permisos.');
      this.closeCameraDialog();
    }
  }

  private stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  buildAttachUrl(attachmentId: string): string {
    if (!attachmentId) return '';
    return this.attachmentService.getAttachmentPreviewUrl(attachmentId);
  }

  // --- Save Profile Data ---

  saveProfile(): void {
    if (this.isEmpresa) {
      this.saveLegalPersonProfile();
      return;
    }
    this.saveNaturalPersonProfile();
  }

  private saveNaturalPersonProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formValue = this.profileForm.value;

    if (this.user) {
      const updatedUser: User = {
        ...this.user,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
        documentType: formValue.documentType,
        documentNumber: formValue.documentNumber,
        birthDate: formValue.birthDate,
      };

      this.authService.setCurrentUser(updatedUser);
      this.user = updatedUser;
    }

    if (this.naturalPerson) {
      const updatedNaturalPerson: NaturalPersonClientDto = {
        id: this.naturalPerson.id,
        personId: this.naturalPerson.personId,
        email: this.naturalPerson.email,
        countryOfBirthId: this.naturalPerson.countryOfBirthId,
        genderId: this.naturalPerson.genderId,
        creationDate: this.naturalPerson.creationDate,
        livesInCountryId: this.naturalPerson.livesInCountryId,
        isPEP: this.naturalPerson.isPEP,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        documentNumber: formValue.documentNumber,
        birthDate: formValue.birthDate,
        occupation: formValue.occupation,
        referralSource: formValue.referralSource,

        lastUpdate: new Date().toISOString(), // Update the lastUpdate field to the current date and time
        pictureFileExternalId: this.naturalPerson.pictureFileExternalId,
        signatureFileExternalId: this.naturalPerson.signatureFileExternalId,
        frontDocumentFileExternalId: this.naturalPerson.frontDocumentFileExternalId,
        backDocumentFileExternalId: this.naturalPerson.backDocumentFileExternalId,
        identityVideoFileExternalId: this.naturalPerson.videoDocumentFileExternalId,
        phoneNumber: this.naturalPerson.phoneNumber
      };

      this.naturalPersonService.updateNaturalPerson(this.naturalPerson.id, updatedNaturalPerson).subscribe({
        next: () => {
          this.notificationService.success('Éxito', 'Cuenta actualizada correctamente.');
        },
        error: () => {
          this.notificationService.error('Error', 'No se pudo actualizar la cuenta.');
        },
      });

      //this.naturalPerson = updatedNaturalPerson;

    }
    setTimeout(() => {
      this.saving = false;
      this.notificationService.success('Datos actualizados', 'Tus datos personales han sido guardados correctamente.');
    }, 500);
  }

  private saveLegalPersonProfile(): void {
    if (this.legalPersonForm.invalid) {
      this.legalPersonForm.markAllAsTouched();
      return;
    }

    if (!this.naturalPerson) {
      return;
    }

    this.saving = true;
    const formValue = this.legalPersonForm.value;

    const updatedLegalPerson: LegalPersonClientDto = {
      id: this.naturalPerson.id,
      personId: this.naturalPerson.personId,
      livesInCountryId: this.naturalPerson.livesInCountryId,
      name: formValue.name,
      legalRepresentativeName: formValue.legalRepresentativeName,
      documentNumber: formValue.documentNumber,
      phoneNumber: formValue.phoneNumber,
      webUrl: formValue.webUrl,
      email: formValue.email,
      pictureFileExternalId: this.naturalPerson.pictureFileExternalId,
      legalDocumentFileExternalId: this.naturalPerson.legalDocumentFileExternalId,
    };

    this.legalPersonService.updateLegalPerson(this.naturalPerson.id, updatedLegalPerson).subscribe({
      next: () => {
        this.saving = false;
        this.notificationService.success('Éxito', 'Datos de la empresa actualizados correctamente.');
      },
      error: () => {
        this.saving = false;
        this.notificationService.error('Error', 'No se pudo actualizar los datos de la empresa.');
      },
    });
  }

  // --- Save Profile Photo ---

  saveProfilePhoto(): void {
    if (!this.naturalPerson || !this.user?.id) {
      this.notificationService.error('Error', 'No se pudo cargar la información del perfil.');
      return;
    }

    if (!this.profilePhotoFile) {
      this.notificationService.error('Sin cambios', 'Selecciona o captura una foto para guardar.');
      return;
    }

    this.saving = true;
    this.uploadOrCreateAttachment(this.naturalPerson.pictureFileExternalId, this.profilePhotoFile, 'Foto de perfil').pipe(
      switchMap((returnedExternalId) => {
        const effectiveExternalId = this.naturalPerson?.pictureFileExternalId?.trim() || returnedExternalId?.trim();
        if (!effectiveExternalId) {
          throw new Error('No se pudo resolver el externalId de la foto de perfil.');
        }
        if (this.naturalPerson?.customerType === 'Persona')
          return this.naturalPersonService.updateNaturalPersonAttachmentFieldByAuthUserId(this.user!.id, {
            pictureAttachmentExternalId: effectiveExternalId,
            field: 'profile',
          })
        else
          return this.legalPersonService.updateLegalPersonAttachmentFieldByAuthUserId(this.user!.id, {
            pictureAttachmentExternalId: effectiveExternalId,
            field: 'profile',
          });
      }),
      switchMap(() => this.naturalPersonService.getNaturalPersonById(this.user!.id)),
    ).subscribe({
      next: (updatedPerson) => {
        this.naturalPerson = updatedPerson;
        this.profilePhotoFile = null;
        this.profilePhotoUrl = this.buildAttachUrl(updatedPerson.pictureFileExternalId || '');
        this.saving = false;
        this.notificationService.success('Foto guardada', 'Tu foto de perfil fue actualizada correctamente.');
      },
      error: () => {
        this.saving = false;
        this.notificationService.error('Error', 'No se pudo guardar la foto de perfil.');
      },
    });
  }

  // --- Save Documents ---

  saveDocuments(): void {
    if (this.isEmpresa) {
      this.saveLegalDocument();
      return;
    }
    this.saveIdentityDocuments();
  }

  private saveIdentityDocuments(): void {
    if (!this.naturalPerson || !this.user?.id) {
      this.notificationService.error('Error', 'No se pudo cargar la información del perfil.');
      return;
    }

    if (!this.documentFrontFile && !this.documentBackFile) {
      this.notificationService.error('Sin cambios', 'Sube o captura al menos un documento para guardar.');
      return;
    }

    this.savingDocs = true;

    const updateRequests: Observable<number>[] = [];

    if (this.documentFrontFile) {
      updateRequests.push(
        this.uploadOrCreateAttachment(
          this.naturalPerson.frontDocumentFileExternalId,
          this.documentFrontFile,
          'Documento frente',
        ).pipe(
          switchMap((returnedExternalId) => {
            const normalizedExternalId = this.naturalPerson?.frontDocumentFileExternalId?.trim() || returnedExternalId?.trim();
            if (!normalizedExternalId) {
              throw new Error('No se pudo obtener el externalId del documento frente.');
            }

            return this.naturalPersonService.updateNaturalPersonAttachmentFieldByAuthUserId(this.user!.id, {
              pictureAttachmentExternalId: normalizedExternalId,
              field: 'front-document',
            });
          }),
        ),
      );
    }

    if (this.documentBackFile) {
      updateRequests.push(
        this.uploadOrCreateAttachment(
          this.naturalPerson.backDocumentFileExternalId,
          this.documentBackFile,
          'Documento reverso',
        ).pipe(
          switchMap((returnedExternalId) => {
            const normalizedExternalId = this.naturalPerson?.backDocumentFileExternalId?.trim() || returnedExternalId?.trim();
            if (!normalizedExternalId) {
              throw new Error('No se pudo obtener el externalId del documento reverso.');
            }

            return this.naturalPersonService.updateNaturalPersonAttachmentFieldByAuthUserId(this.user!.id, {
              pictureAttachmentExternalId: normalizedExternalId,
              field: 'back-document',
            });
          }),
        ),
      );
    }

    (updateRequests.length > 0 ? forkJoin(updateRequests) : of([])).pipe(
      switchMap(() => this.naturalPersonService.getNaturalPersonById(this.user!.id)),
    ).subscribe({
      next: (updatedPerson) => {
        this.naturalPerson = updatedPerson;
        this.documentFrontFile = null;
        this.documentBackFile = null;
        this.documentFrontUrl = this.buildAttachUrl(updatedPerson.frontDocumentFileExternalId || '');
        this.documentBackUrl = this.buildAttachUrl(updatedPerson.backDocumentFileExternalId || '');
        this.savingDocs = false;
        this.notificationService.success('Documentos guardados', 'Las imágenes del documento se actualizaron correctamente.');
      },
      error: () => {
        this.savingDocs = false;
        this.notificationService.error('Error', 'No se pudieron guardar los documentos.');
      },
    });
  }

  private saveLegalDocument(): void {
    if (!this.naturalPerson || !this.user?.id) {
      this.notificationService.error('Error', 'No se pudo cargar la información del perfil.');
      return;
    }

    if (!this.legalDocumentFile) {
      this.notificationService.error('Sin cambios', 'Sube o captura el documento legal para guardar.');
      return;
    }

    this.savingDocs = true;

    this.uploadOrCreateAttachment(
      this.naturalPerson.legalDocumentFileExternalId,
      this.legalDocumentFile,
      'Documento legal de la empresa',
    ).pipe(
      switchMap((returnedExternalId) => {
        const normalizedExternalId = this.naturalPerson?.legalDocumentFileExternalId?.trim() || returnedExternalId?.trim();
        if (!normalizedExternalId) {
          throw new Error('No se pudo obtener el externalId del documento legal.');
        }

        return this.legalPersonService.updateLegalPersonAttachmentFieldByAuthUserId(this.user!.id, {
          pictureAttachmentExternalId: normalizedExternalId,
          field: 'document',
        });
      }),
      switchMap(() => this.naturalPersonService.getNaturalPersonById(this.user!.id)),
    ).subscribe({
      next: (updatedPerson) => {
        this.naturalPerson = updatedPerson;
        this.legalDocumentFile = null;
        this.legalDocumentUrl = this.buildAttachUrl(updatedPerson.legalDocumentFileExternalId || '');
        this.savingDocs = false;
        this.notificationService.success('Documento guardado', 'El documento legal se actualizó correctamente.');
      },
      error: () => {
        this.savingDocs = false;
        this.notificationService.error('Error', 'No se pudo guardar el documento legal.');
      },
    });
  }

  // --- Helpers ---

  private getFileFromEvent(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.error('Archivo muy grande', 'El tamaño máximo es 5 MB.');
        return null;
      }
      return file;
    }
    return null;
  }

  private readFileAsDataUrl(file: File, callback: (url: string) => void): void {
    const reader = new FileReader();
    reader.onload = () => callback(reader.result as string);
    reader.readAsDataURL(file);
  }

  private uploadOrCreateAttachment(currentAttachmentId: string | undefined, file: File, description: string): Observable<string> {
    const normalizedAttachmentId = currentAttachmentId?.trim();

    // If there is an existing externalId we update that attachment; otherwise we create a new one.
    if (normalizedAttachmentId) {
      return this.attachmentService.updateAttachment(normalizedAttachmentId, file);
    }

    return this.attachmentService.createAttachment(file, description);
  }
}
