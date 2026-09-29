import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Password } from 'primeng/password';

import { NotificationService } from '../../../core/services/notification.service';
import { UserService } from '../../../core/services/user.service';
import { AuthUser } from 'bc-oidc-oauth';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
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
  saving = false;

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8), this.passwordStrength]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatch });

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
    var currentUser = this.authService.getCurrentUser();
    
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
        // Aseguramos que termine el estado de carga
        this.saving = false;

        // Mostramos la notificación de error
        this.notificationService.error(
          'Error', 
          'No se pudo cambiar la contraseña. Verifica tus datos o intenta más tarde.'
        );

        // Opcional: inspeccionar la respuesta del backend
        console.error('Detalle del error:', err);
      }
    });

    
    // // Simulate API call
    // setTimeout(() => {
    //   this.saving = false;
    //   this.passwordForm.reset();
    //   this.notificationService.success('Contraseña actualizada', 'Tu contraseña ha sido cambiada exitosamente.');
    // }, 600);`
  }
}
