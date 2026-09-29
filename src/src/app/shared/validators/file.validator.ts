export interface FileValidationResult {
  valid: boolean;
  error?: 'invalid_format' | 'exceeds_size';
}

const ALLOWED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateFile(file: File): FileValidationResult {
  if (!ALLOWED_FORMATS.includes(file.type)) {
    return { valid: false, error: 'invalid_format' };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: 'exceeds_size' };
  }
  return { valid: true };
}
