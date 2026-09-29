export interface FinancialAccount {
  id: string;
  bankName: string;
  country: 'Bolivia' | 'Peru';
  accountNumber: string;
  isDefault: boolean;
}
