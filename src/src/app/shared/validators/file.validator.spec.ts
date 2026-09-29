import { validateFile, FileValidationResult } from './file.validator';

describe('validateFile', () => {
  function createMockFile(type: string, size: number): File {
    const blob = new Blob(['x'.repeat(size)], { type });
    return new File([blob], 'test-file', { type });
  }

  it('should return valid for a PNG file under 5 MB', () => {
    const file = createMockFile('image/png', 1024);
    const result: FileValidationResult = validateFile(file);
    expect(result).toEqual({ valid: true });
  });

  it('should return valid for a JPEG file under 5 MB', () => {
    const file = createMockFile('image/jpeg', 2 * 1024 * 1024);
    const result: FileValidationResult = validateFile(file);
    expect(result).toEqual({ valid: true });
  });

  it('should return valid for a JPG file exactly at 5 MB', () => {
    const file = createMockFile('image/jpg', 5 * 1024 * 1024);
    const result: FileValidationResult = validateFile(file);
    expect(result).toEqual({ valid: true });
  });

  it('should return invalid_format for unsupported MIME type', () => {
    const file = createMockFile('application/pdf', 1024);
    const result: FileValidationResult = validateFile(file);
    expect(result).toEqual({ valid: false, error: 'invalid_format' });
  });

  it('should return invalid_format for GIF files', () => {
    const file = createMockFile('image/gif', 1024);
    const result: FileValidationResult = validateFile(file);
    expect(result).toEqual({ valid: false, error: 'invalid_format' });
  });

  it('should return exceeds_size for file larger than 5 MB', () => {
    const file = createMockFile('image/png', 5 * 1024 * 1024 + 1);
    const result: FileValidationResult = validateFile(file);
    expect(result).toEqual({ valid: false, error: 'exceeds_size' });
  });

  it('should check format before size (invalid format takes priority)', () => {
    const file = createMockFile('application/pdf', 10 * 1024 * 1024);
    const result: FileValidationResult = validateFile(file);
    expect(result).toEqual({ valid: false, error: 'invalid_format' });
  });
});
