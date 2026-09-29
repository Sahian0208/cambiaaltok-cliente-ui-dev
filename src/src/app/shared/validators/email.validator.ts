import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function emailFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value) ? null : { emailFormat: true };
  };
}
