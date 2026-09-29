/**
 * Data passed from the home calculator to /cliente/transferencia
 * when the user clicks "Iniciar transacción".
 */
export interface CalculatorTransferData {
  sourceAmount: number;
  sourceCurrency: 'BOB' | 'PEN';
  destinationAmount: number;
  destinationCurrency: 'BOB' | 'PEN';
  appliedRate: number;
  sourceCountry: string;
  destinationCountry: string;
  coupon: {
    code: string;
    bonusAmount: number;
    bonusCurrency: 'BOB' | 'PEN';
    reason: string;
    spreadPercent: number;
  } | null;
}
