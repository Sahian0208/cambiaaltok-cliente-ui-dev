import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, currency: 'BOB' | 'PEN'): string {
    if (value == null || isNaN(value)) {
      return '';
    }

    const symbol = currency === 'BOB' ? 'Bs.' : 'S/.';
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${symbol} ${formatted}`;
  }
}
