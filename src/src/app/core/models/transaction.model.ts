export type TransactionStatus =
  | 'pendiente_deposito'
  | 'pendiente_verificacion'
  | 'verificado'
  | 'transferido'
  | 'finalizado'
  | 'denegado';

export interface Transaction {
  id: string;
  clientId: string;
  clientName: string;
  intermediaryId: string;
  sourceAmount: number;
  sourceCurrency: 'BOB' | 'PEN';
  destinationAmount: number;
  destinationCurrency: 'BOB' | 'PEN';
  appliedRate: number;
  sourceAccountId: string;
  destinationAccountId: string;
  destinationQrUrl: string;
  intermediaryQrUrl: string;
  clientReceiptUrl: string | null;
  intermediaryReceiptUrl: string | null;
  status: TransactionStatus;
  denialReason: string | null;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}
