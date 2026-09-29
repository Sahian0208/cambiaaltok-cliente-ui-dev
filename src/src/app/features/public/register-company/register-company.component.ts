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

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register-company',
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
  ],
  templateUrl: './register-company.component.html',
  styleUrl: './register-company.component.scss',
})
export class RegisterCompanyComponent implements OnDestroy {
  @ViewChild('cameraVideo') cameraVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('cameraCanvas') cameraCanvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  readonly router = inject(Router);

  currentStep = signal(0);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  submitSuccess = signal(false);

  // Step 1 form
  companyForm: FormGroup;

  // Step 2: taxpayer registration photo
  taxpayerRegistrationPhoto = signal<File | null>(null);
  taxpayerRegistrationPreview = signal<string | null>(null);

  // Camera state
  showCamera = signal(false);
  private mediaStream: MediaStream | null = null;

  readonly businessSectorOptions = [
    { label: 'Comercio', value: 'comercio' },
    { label: 'Servicios', value: 'servicios' },
    { label: 'Industria', value: 'industria' },
    { label: 'Tecnología', value: 'tecnologia' },
    { label: 'Construcción', value: 'construccion' },
    { label: 'Transporte', value: 'transporte' },
    { label: 'Salud', value: 'salud' },
    { label: 'Educación', value: 'educacion' },
    { label: 'Otro', value: 'otro' },
  ];

  readonly countryOptions = [
    { label: 'Peru', value: 'peru' },
    { label: 'Bolivia', value: 'bolivia' },
  ];

  constructor() {
    this.companyForm = this.fb.group({
      country: ['', [Validators.required]],
      legalName: ['', [Validators.required]],
      legalRepresentativeName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      registrationNumber: ['', [Validators.required]],
      businessSector: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      termsAccepted: [false, [Validators.requiredTrue]],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnDestroy(): void {
    this.stopCamera();
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
      this.companyForm.markAllAsTouched();
      if (this.companyForm.invalid) return;
    }
    this.currentStep.update(s => Math.min(s + 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prevStep(): void {
    this.currentStep.update(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Photo handling
  onTaxpayerPhotoSelected(event: Event): void {
    const file = this.getFileFromEvent(event);
    if (file) {
      this.taxpayerRegistrationPhoto.set(file);
      this.readFilePreview(file, url => this.taxpayerRegistrationPreview.set(url));
    }
  }

  removeTaxpayerPhoto(): void {
    this.taxpayerRegistrationPhoto.set(null);
    this.taxpayerRegistrationPreview.set(null);
  }

  // Camera
  openCamera(): void {
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
      const file = new File([blob], 'taxpayer-registration.jpg', { type: 'image/jpeg' });
      const url = canvas.toDataURL('image/jpeg', 0.85);
      this.taxpayerRegistrationPhoto.set(file);
      this.taxpayerRegistrationPreview.set(url);
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

  // Submit
  submit(): void {
    if (!this.taxpayerRegistrationPhoto()) return;

    this.submitting.set(true);
    this.submitError.set(null);

    const formData = new FormData();
    const formValue = this.companyForm.value;

    formData.append('country', formValue.country);
    formData.append('legalName', formValue.legalName);
    formData.append('email', formValue.email);
    formData.append('legalRepresentativeName', formValue.legalRepresentativeName);
    formData.append('registrationNumber', formValue.registrationNumber);
    formData.append('businessSector', formValue.businessSector);
    formData.append('password', formValue.password);
    formData.append('taxpayerRegistrationPhoto', this.taxpayerRegistrationPhoto()!);

    this.authService.registerCompany(formData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.messages[0] || 'Error al registrar la empresa. Intente nuevamente.');        
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
