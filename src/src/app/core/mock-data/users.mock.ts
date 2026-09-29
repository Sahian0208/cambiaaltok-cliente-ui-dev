import { User } from '../models/user.model';

export const MOCK_USERS: User[] = [
  {
    id: 'usr-001',
    firstName: 'Carlos Alberto',
    lastName: 'Mamani Quispe',
    phone: '+59171234567',
    documentType: 'CI',
    documentNumber: '8901234',
    birthDate: '1990-05-15',
    email: 'carlos.mamani@email.com',
    passwordHash: '$2b$10$simulatedHashForCarlos123456789abcdef',
    role: 'cliente',
    registeredAt: '2024-01-10T08:30:00.000Z'
  },
  {
    id: 'usr-002',
    firstName: 'María Elena',
    lastName: 'Torres Vargas',
    phone: '+51987654321',
    documentType: 'DNI',
    documentNumber: '45678912',
    birthDate: '1985-11-22',
    email: 'maria.torres@email.com',
    passwordHash: '$2b$10$simulatedHashForMaria987654321fedcba',
    role: 'intermediario',
    registeredAt: '2023-11-05T14:20:00.000Z'
  },
  {
    id: 'usr-004',
    firstName: 'Ana Lucía',
    lastName: 'Condori Poma',
    phone: '+59173456789',
    documentType: 'CI',
    documentNumber: '7654321',
    birthDate: '1995-08-30',
    email: 'ana.condori@email.com',
    passwordHash: '$2b$10$simulatedHashForAna111111111111111111',
    role: 'cliente',
    registeredAt: '2024-02-20T16:45:00.000Z'
  },
  {
    id: 'usr-005',
    firstName: 'Roberto',
    lastName: 'Chávez Mendoza',
    phone: '+51976543210',
    documentType: 'DNI',
    documentNumber: '32165498',
    birthDate: '1982-12-14',
    email: 'roberto.chavez@email.com',
    passwordHash: '$2b$10$simulatedHashForRoberto22222222222222',
    role: 'intermediario',
    registeredAt: '2023-12-15T09:10:00.000Z'
  }
];
