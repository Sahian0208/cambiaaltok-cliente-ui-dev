export interface Bank {
  id: string;
  name: string;
  country: 'Bolivia' | 'Peru';
  active: boolean;
  logoUrl: string;
  externalId: string;
}
