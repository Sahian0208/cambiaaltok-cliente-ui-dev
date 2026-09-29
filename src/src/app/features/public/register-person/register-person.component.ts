import { Component, inject, signal, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Password } from 'primeng/password';
import { Checkbox } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { DatePicker } from 'primeng/datepicker';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from 'bc-primeng-ui';
import { HOW_DID_YOU_FIND_US_OPTIONS, SelectOption } from '../../../shared/constants/select-options.constants';

@Component({
  selector: 'app-register-person',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputText,
    Select,
    Password,
    Checkbox,
    ButtonModule,
    StepperModule,
    DatePicker,
  ],
  templateUrl: './register-person.component.html',
  styleUrl: './register-person.component.scss',
})
export class RegisterPersonComponent implements OnDestroy {
  @ViewChild('cameraVideo') cameraVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('cameraCanvas') cameraCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('videoRecordingElement') videoRecordingRef!: ElementRef<HTMLVideoElement>;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  readonly howDidYouFindUsOptions: SelectOption[] = HOW_DID_YOU_FIND_US_OPTIONS;
  readonly router = inject(Router);

  currentStep = signal(0);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);

  // Email verification state
  emailChecking = signal(false);
  emailAvailable = signal<boolean | null>(null);
  emailErrorMessage = signal<string | null>(null);

// documentNumber verification state
  documentNumberChecking = signal(false);
  documentNumberAvailable = signal<boolean | null>(null);
  documentNumberErrorMessage = signal<string | null>(null);


  // Step 1 form
  personForm: FormGroup;

  // Step 2: document photos
  documentFrontPhoto = signal<File | null>(null);
  documentFrontPreview = signal<string | null>(null);
  documentBackPhoto = signal<File | null>(null);
  documentBackPreview = signal<string | null>(null);

  // Step 3: identity video
  identityVideo = signal<File | null>(null);
  identityVideoPreview = signal<string | null>(null);

  // Camera state
  showCamera = signal(false);
  cameraTarget = signal<'front' | 'back'>('front');
  private mediaStream: MediaStream | null = null;

  // Video recording state
  isRecording = signal(false);
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  readonly countryOptions = [
    { label: 'Peruano(a)', value: 'peru' },
    { label: 'Boliviano(a)', value: 'bolivia' },
  ];

  // Max birth date: must be at least 18 years old
  readonly maxBirthDate = new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate());

  constructor() {
    this.personForm = this.fb.group({
      country: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      documentNumber: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      birthDate: [null, [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      referralSource: ['', [Validators.required]],
      termsAccepted: [false, [Validators.requiredTrue]],
    }, { validators: this.passwordMatchValidator });

    // Email availability check
    this.personForm.get('email')!.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap((email: string) => {
        if (!email || !this.personForm.get('email')!.valid) {
          this.emailAvailable.set(null);
          this.emailErrorMessage.set(null);
          this.emailChecking.set(false);
          return of(null);
        }
        this.emailChecking.set(true);
        this.emailAvailable.set(null);
        this.emailErrorMessage.set(null);
        return this.http.get<ApiResponse<boolean>>(
          `${environment.apiBaseUrl}/v1/public/check-person-email`,
          { params: { email } }
        ).pipe(map((response) => response.data),
          catchError(() => of(false))
        );
      })
    ).subscribe((result) => {
      this.emailChecking.set(false);
      if (result !== null) {
        this.emailAvailable.set(result);
        if (!result) {
          this.emailErrorMessage.set('Este email ya está en uso');
        } else {
          this.emailErrorMessage.set(null);
        }
      }
    });

// documentNumber availability check
    this.personForm.get('documentNumber')!.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap((documentNumber: string) => {
        if (!documentNumber || !this.personForm.get('documentNumber')!.valid) {
          this.documentNumberAvailable.set(null);
          this.documentNumberErrorMessage.set(null);
          return of(null);
        }
        this.documentNumberChecking.set(true);
        this.documentNumberAvailable.set(null);
        this.documentNumberErrorMessage.set(null);
        return this.http.get<ApiResponse<boolean>>(
          `${environment.apiBaseUrl}/v1/public/check-person-document`, 
          { params: { documentNumber } }
        );
      })
    ).subscribe({
      next: (result) => {
        this.documentNumberChecking.set(false);
        if (result !== null) {
          this.documentNumberAvailable.set(result.data);
          if (!result.data) {
            this.documentNumberErrorMessage.set('Este numero ya está en uso');
          }
        }
      },
      error: () => {
        this.documentNumberChecking.set(false);
        this.documentNumberAvailable.set(null);
      },
    });

  }

  ngOnDestroy(): void {
    this.stopCamera();
    this.stopRecording();
  }

  // Validators
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return { passwordStrength: true };
    }
    return null;
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // Step navigation
  nextStep(): void {
    if (this.currentStep() === 0) {
      this.personForm.markAllAsTouched();
      if (this.personForm.invalid) return;
    }
    if (this.currentStep() === 1) {
      if (!this.documentFrontPhoto() || !this.documentBackPhoto()) return;
    }
    this.currentStep.update(s => Math.min(s + 1, 2));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevStep(): void {
    this.currentStep.update(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Document photo handling
  onDocumentFrontSelected(event: Event): void {
    const file = this.getFileFromEvent(event);
    if (file) {
      this.documentFrontPhoto.set(file);
      this.readFilePreview(file, url => this.documentFrontPreview.set(url));
    }
  }

  onDocumentBackSelected(event: Event): void {
    const file = this.getFileFromEvent(event);
    if (file) {
      this.documentBackPhoto.set(file);
      this.readFilePreview(file, url => this.documentBackPreview.set(url));
    }
  }

  removeDocumentFront(): void {
    this.documentFrontPhoto.set(null);
    this.documentFrontPreview.set(null);
  }

  removeDocumentBack(): void {
    this.documentBackPhoto.set(null);
    this.documentBackPreview.set(null);
  }

  // Camera
  openCamera(target: 'front' | 'back'): void {
    this.cameraTarget.set(target);
    this.showCamera.set(true);
    setTimeout(() => this.startCamera(), 100);
  }

  closeCamera(): void {
    this.stopCamera();
    this.showCamera.set(false);
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
      if (!blob) return;
      const file = new File([blob], `document-${this.cameraTarget()}.jpg`, { type: 'image/jpeg' });
      const url = canvas.toDataURL('image/jpeg', 0.85);

      if (this.cameraTarget() === 'front') {
        this.documentFrontPhoto.set(file);
        this.documentFrontPreview.set(url);
      } else {
        this.documentBackPhoto.set(file);
        this.documentBackPreview.set(url);
      }
      this.closeCamera();
    }, 'image/jpeg', 0.85);
  }

  private async startCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      const video = this.cameraVideoRef?.nativeElement;
      if (video) {
        video.srcObject = this.mediaStream;
      }
    } catch {
      this.closeCamera();
    }
  }

  private stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }

  // Video handling
  onVideoSelected(event: Event): void {
    const file = this.getFileFromEvent(event);
    if (file) {
      this.identityVideo.set(file);
      this.identityVideoPreview.set(URL.createObjectURL(file));
    }
  }

  removeVideo(): void {
    if (this.identityVideoPreview()) {
      URL.revokeObjectURL(this.identityVideoPreview()!);
    }
    this.identityVideo.set(null);
    this.identityVideoPreview.set(null);
  }

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });
      this.mediaStream = stream;

      const videoEl = this.videoRecordingRef?.nativeElement;
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.muted = true;
      }

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const file = new File([blob], 'identity-video.webm', { type: 'video/webm' });
        this.identityVideo.set(file);
        this.identityVideoPreview.set(URL.createObjectURL(blob));
        this.stopCamera();
      };
      this.mediaRecorder.start();
      this.isRecording.set(true);
    } catch {
      // Camera not available
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording.set(false);
  }

  // Submit
  submit(): void {
    if (!this.identityVideo()) return;

    this.submitting.set(true);
    this.submitError.set(null);

    const formData = new FormData();
    const formValue = this.personForm.value;

    // Append text fields
    formData.append('country', formValue.country);
    formData.append('firstName', formValue.firstName);
    formData.append('lastName', formValue.lastName);
    formData.append('phone', formValue.phone);
    formData.append('documentNumber', formValue.documentNumber);
    formData.append('email', formValue.email);
    formData.append('birthDate', formValue.birthDate instanceof Date ? formValue.birthDate.toISOString().split('T')[0] : formValue.birthDate);
    formData.append('password', formValue.password);
    formData.append('referralSource', formValue.referralSource);

    // Append files
    formData.append('documentFrontPhoto', this.documentFrontPhoto()!);
    formData.append('documentBackPhoto', this.documentBackPhoto()!);
    formData.append('identityVideo', this.identityVideo()!);

    this.authService.registerPerson(formData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set(true);
      },
      error: (err) => {
        debugger;
        this.submitting.set(false);
        this.submitError.set(err?.error?.messages[0] || 'Error al registrar. Intente nuevamente.');
      },
    });
  }

  // Helpers
  private getFileFromEvent(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      return input.files[0];
    }
    return null;
  }

  private readFilePreview(file: File, callback: (url: string) => void): void {
    const reader = new FileReader();
    reader.onload = () => callback(reader.result as string);
    reader.readAsDataURL(file);
  }
}
