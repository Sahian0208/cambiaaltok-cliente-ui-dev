// Development environment
export const environment = {
  production: false,
  apiBaseUrl: 'https://cambiaaltok-api-dev.premiumasp.net',
  ratePollingInterval: 300000, // 5 minutos
  useMockData: false,
  mainWhatsappContact: '59172237251',
  oauth: {
    authority: 'https://auth-dev.premiumasp.net',
    clientId: 'b8b5aa8c-3ecc-4697-8341-acd13e1acebb',
    scope: 'openid profile email cambiaaltok-api offline_access',
  },
};
