// Local environment (default when running `ng serve`)
export const environment = {
  production: false,
  //apiBaseUrl: 'https://cambiaaltok-api-dev.premiumasp.net',
  apiBaseUrl: 'https://localhost:7025',
  ratePollingInterval: 300000, // 5 minutos
  useMockData: false,
  mainWhatsappContact: '59172237251',
  oauth: {
    authority: 'https://cambiaaltok-auth.premiumasp.net',
    clientId: 'b8b5aa8c-3ecc-4697-8341-acd13e1acebb',
    scope: 'openid profile email cambiaaltok-api offline_access',
  },
};
