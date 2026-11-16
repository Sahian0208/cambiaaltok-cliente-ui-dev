import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Password } from 'primeng/password';

import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Password,
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly isDarkMode = this.themeService.isDarkMode;

  saving = false;

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordStrength]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatch });

  get newPasswordVal(): string {
    return this.passwordForm.get('newPassword')?.value || '';
  }

  get hasMinLength(): boolean {
    return this.newPasswordVal.length >= 8;
  }

  get hasUpperAndLower(): boolean {
    return /[A-Z]/.test(this.newPasswordVal) && /[a-z]/.test(this.newPasswordVal);
  }

  get hasNumber(): boolean {
    return /\d/.test(this.newPasswordVal);
  }

  private passwordStrength(control: AbstractControl) {
    const value = control.value || '';
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return { passwordStrength: true };
    }
    return null;
  }

  private passwordMatch(group: AbstractControl) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.saving = true;    
    const currentUser = this.authService.getCurrentUser();
    
    this.userService.changePassword(
      currentUser()?.email, 
      this.passwordForm.get('currentPassword')?.value,
      this.passwordForm.get('newPassword')?.value
    ).subscribe({
      next: (result) => {
        this.saving = false;
        if (result === true) {
          this.passwordForm.reset();
          this.notificationService.success(
            'Contraseña actualizada', 
            'Tu contraseña ha sido cambiada exitosamente.'
          );    
        }
      },
      error: (err) => {
        this.saving = false;
        this.notificationService.error(
          'Error', 
          'No se pudo cambiar la contraseña. Verifica tus datos o intenta más tarde.'
        );
        console.error('Detalle del error:', err);
      }
    });
  }
}
