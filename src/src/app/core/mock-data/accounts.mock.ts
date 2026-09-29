import { BankAccount } from '../models/bank-account.model';

export const MOCK_ACCOUNTS: BankAccount[] = [
  // Cuentas del cliente Carlos (usr-001) - Bolivia
  {
    id: 'acc-001',
    userId: 'usr-001',
    bankId: 'bank-bo-001',
    accountNumber: '1234567890',
    holderName: 'Carlos Alberto Mamani Quispe',
    type: 'origen',
    country: 'Bolivia',
    isYape: false,
    otherAccountValue: '',
    isQR: false
  },
  {
    id: 'acc-002',
    userId: 'usr-001',
    bankId: 'bank-pe-002',
    accountNumber: '9876543210',
    holderName: 'Carlos Alberto Mamani Quispe',
    type: 'destino',
    country: 'Peru',
    isYape: false,
    otherAccountValue: '',
    isQR: false
  },
  {
    id: 'acc-003',
    userId: 'usr-001',
    bankId: 'bank-pe-002',
    accountNumber: '951753852',
    holderName: 'Carlos Alberto Mamani Quispe',
    type: 'destino',
    country: 'Peru',
    isYape: true,
    otherAccountValue: '',
    isQR: false
  },
  // Cuentas de la intermediaria María (usr-002) - Perú
  {
    id: 'acc-004',
    userId: 'usr-002',
    bankId: 'bank-pe-005',
    accountNumber: '5566778899',
    holderName: 'María Elena Torres Vargas',
    type: 'origen',
    country: 'Peru',
    isYape: false,
    otherAccountValue: '',
    isQR: false
  },
  {
    id: 'acc-005',
    userId: 'usr-002',
    bankId: 'bank-bo-003',
    accountNumber: '1122334455',
    holderName: 'María Elena Torres Vargas',
    type: 'destino',
    country: 'Bolivia',
    isYape: false,
    otherAccountValue: '',
    isQR: false
  },
  // Cuentas de la cliente Ana (usr-004) - Bolivia
  {
    id: 'acc-006',
    userId: 'usr-004',
    bankId: 'bank-bo-002',
    accountNumber: '6677889900',
    holderName: 'Ana Lucía Condori Poma',
    type: 'origen',
    country: 'Bolivia',
    isYape: false,
    otherAccountValue: '',
    isQR: false
  },
  {
    id: 'acc-007',
    userId: 'usr-004',
    bankId: 'bank-pe-003',
    accountNumber: '3344556677',
    holderName: 'Ana Lucía Condori Poma',
    type: 'destino',
    country: 'Peru',
    isYape: false,
    otherAccountValue: '',
    isQR: false
  },
  // Cuenta del intermediario Roberto (usr-005) - Perú
  {
    id: 'acc-008',
    userId: 'usr-005',
    bankId: 'bank-pe-001',
    accountNumber: '7788990011',
    holderName: 'Roberto Chávez Mendoza',
    type: 'origen',
    country: 'Peru',
    isYape: false,
    otherAccountValue: '',
    isQR: false
  },
  {
    id: 'acc-009',
    userId: 'usr-005',
    bankId: 'bank-bo-004',
    accountNumber: '2233445566',
    holderName: 'Roberto Chávez Mendoza',
    type: 'destino',
    country: 'Bolivia',
    isYape: false,
    otherAccountValue: '',
    isQR: false
  }
];
