import { FormControl } from '@angular/forms';
import { emailFormatValidator } from './email.validator';

describe('emailFormatValidator', () => {
  const validator = emailFormatValidator();

  it('should return null for empty value', () => {
    const control = new FormControl('');
    expect(validator(control)).toBeNull();
  });

  it('should return null for a valid email', () => {
    const control = new FormControl('user@example.com');
    expect(validator(control)).toBeNull();
  });

  it('should return null for email with dots and plus in local part', () => {
    const control = new FormControl('user.name+tag@domain.co');
    expect(validator(control)).toBeNull();
  });

  it('should return emailFormat error for missing @', () => {
    const control = new FormControl('userexample.com');
    expect(validator(control)).toEqual({ emailFormat: true });
  });

  it('should return emailFormat error for missing domain', () => {
    const control = new FormControl('user@');
    expect(validator(control)).toEqual({ emailFormat: true });
  });

  it('should return emailFormat error for missing TLD', () => {
    const control = new FormControl('user@domain');
    expect(validator(control)).toEqual({ emailFormat: true });
  });

  it('should return emailFormat error for single char TLD', () => {
    const control = new FormControl('user@domain.c');
    expect(validator(control)).toEqual({ emailFormat: true });
  });

  it('should return null for valid email with subdomain', () => {
    const control = new FormControl('admin@mail.example.org');
    expect(validator(control)).toBeNull();
  });
});
