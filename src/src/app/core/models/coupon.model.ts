export interface AppliedCoupon {
  code: string;
  bonusAmount: number;
  bonusCurrency: 'BOB' | 'PEN';
  reason: string;
  message?: string;
  //  code: string;
   spreadPercent: number;
  // message?: string;
}

export interface ValidateCouponRequest {
  code: string;
  userId? :string;
  amount?: number;
  currencyFrom: 'BOB' | 'PEN';
  currencyTo: 'BOB' | 'PEN';
  // code: string;
  // amount?: number;
  // currencyFrom: 'BOB' | 'PEN';
  // currencyTo: 'BOB' | 'PEN';
}

export interface ValidateCouponResponse {
  isValid: boolean;
  code: string;
  spreadPercent: number;
  bonusAmount: number;
  bonusCurrency: 'BOB' | 'PEN';
  reason: string;
  message: string;
}

export interface MyCouponSummary {
  couponCode: string;
  couponDescription: string;
  usedCount: number;
  lastUsedAt: string | null;
  lastUsedByUsername: string | null;
}
