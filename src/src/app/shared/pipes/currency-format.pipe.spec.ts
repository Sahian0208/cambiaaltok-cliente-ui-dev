import { CurrencyFormatPipe } from './currency-format.pipe';

describe('CurrencyFormatPipe', () => {
  let pipe: CurrencyFormatPipe;

  beforeEach(() => {
    pipe = new CurrencyFormatPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('BOB formatting', () => {
    it('should format 1000 BOB as "Bs. 1,000.00"', () => {
      expect(pipe.transform(1000, 'BOB')).toBe('Bs. 1,000.00');
    });

    it('should format 500.5 BOB as "Bs. 500.50"', () => {
      expect(pipe.transform(500.5, 'BOB')).toBe('Bs. 500.50');
    });

    it('should format 0 BOB as "Bs. 0.00"', () => {
      expect(pipe.transform(0, 'BOB')).toBe('Bs. 0.00');
    });

    it('should format 1234567.89 BOB with thousands separators', () => {
      expect(pipe.transform(1234567.89, 'BOB')).toBe('Bs. 1,234,567.89');
    });
  });

  describe('PEN formatting', () => {
    it('should format 500 PEN as "S/. 500.00"', () => {
      expect(pipe.transform(500, 'PEN')).toBe('S/. 500.00');
    });

    it('should format 1000 PEN as "S/. 1,000.00"', () => {
      expect(pipe.transform(1000, 'PEN')).toBe('S/. 1,000.00');
    });

    it('should format 99.99 PEN as "S/. 99.99"', () => {
      expect(pipe.transform(99.99, 'PEN')).toBe('S/. 99.99');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for null value', () => {
      expect(pipe.transform(null, 'BOB')).toBe('');
    });

    it('should return empty string for undefined value', () => {
      expect(pipe.transform(undefined, 'PEN')).toBe('');
    });

    it('should return empty string for NaN value', () => {
      expect(pipe.transform(NaN, 'BOB')).toBe('');
    });
  });
});
