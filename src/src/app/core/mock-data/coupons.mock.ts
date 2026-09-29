export interface MockCoupon {
  bonusAmount: number;
  bonusCurrency: 'BOB' | 'PEN';
  reason: string;
  assignedUserId: string;
}

export const MOCK_COUPONS: Record<string, MockCoupon> = {
  'FIDELIDAD10': {
    bonusAmount: 10,
    bonusCurrency: 'PEN',
    reason: 'Cliente fiel',
    assignedUserId: 'usr-001',
  },
  'PATRIA25': {
    bonusAmount: 25,
    bonusCurrency: 'BOB',
    reason: 'Fiestas patrias',
    assignedUserId: 'usr-001',
  },
  'BIENVENIDA5': {
    bonusAmount: 5,
    bonusCurrency: 'PEN',
    reason: 'Bienvenida nuevo cliente',
    assignedUserId: 'usr-004',
  },
};
