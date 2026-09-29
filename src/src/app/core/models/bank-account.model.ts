export type AccountType = 'origen' | 'destino';

export interface BankAccount {
  id: string;
  userId: string;
  bankId: string;
  bankName?: string;
  accountNumber: string;
  holderName: string;
  type: AccountType;
  country: 'Bolivia' | 'Peru';
  isYape: boolean;
  isQR: boolean;
  otherAccountValue: string;
}
