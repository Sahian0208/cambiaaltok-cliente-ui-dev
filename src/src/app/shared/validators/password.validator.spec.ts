import { FormControl } from '@angular/forms';
import { passwordValidator } from './password.validator';

describe('passwordValidator', () => {
  const validator = passwordValidator();

  it('should return null for empty value', () => {
    const control = new FormControl('');
    expect(validator(control)).toBeNull();
  });

  it('should return null for a valid password', () => {
    const control = new FormControl('Password1');
    expect(validator(control)).toBeNull();
  });

  it('should return minLength error for password shorter than 8 characters', () => {
    const control = new FormControl('Pass1');
    const errors = validator(control);
    expect(errors).toBeTruthy();
    expect(errors!['minLength']).toBeTrue();
  });

  it('should return uppercase error when no uppercase letter', () => {
    const control = new FormControl('password1');
    const errors = validator(control);
    expect(errors).toBeTruthy();
    expect(errors!['uppercase']).toBeTrue();
  });

  it('should return lowercase error when no lowercase letter', () => {
    const control = new FormControl('PASSWORD1');
    const errors = validator(control);
    expect(errors).toBeTruthy();
    expect(errors!['lowercase']).toBeTrue();
  });

  it('should return number error when no digit', () => {
    const control = new FormControl('Passwordd');
    const errors = validator(control);
    expect(errors).toBeTruthy();
    expect(errors!['number']).toBeTrue();
  });

  it('should return multiple errors when multiple criteria fail', () => {
    const control = new FormControl('short');
    const errors = validator(control);
    expect(errors).toBeTruthy();
    expect(errors!['minLength']).toBeTrue();
    expect(errors!['uppercase']).toBeTrue();
    expect(errors!['number']).toBeTrue();
  });
});
