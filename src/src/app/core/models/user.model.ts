export type UserRole = 'cliente' | 'intermediario' | 'administrador';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  documentType: 'DNI' | 'CI';
  documentNumber: string;
  birthDate: string; // ISO date
  email: string;
  passwordHash: string;
  role: UserRole;
  registeredAt: string; // ISO datetime
}
