import { Bank } from '../models/bank.model';

export const MOCK_BANKS: Bank[] = [
  // Bancos de Bolivia
  {
    id: 'bank-bo-001',
    name: 'BISA',
    country: 'Bolivia',
    active: true,
    logoUrl: 'img/banks/bo/bisa.png',
    externalId: '98048f17-5919-49e0-9910-810872a0f5f7'
  },
  {
    id: 'bank-bo-002',
    name: 'BNB',
    country: 'Bolivia',
    active: true,
    logoUrl: 'img/banks/bo/bnb.png',
    externalId: 'e375b548-54a7-4fb2-ab0c-31ffefe5f54e'
  },
  {
    id: 'bank-bo-003',
    name: 'Mercantil Santa Cruz',
    country: 'Bolivia',
    active: true,
    logoUrl: 'img/banks/bo/mercantil-santa-cruz.png',
    externalId: 'f65e7e2a-a4c3-4daf-b070-35a8a211bff7'
  },
  {
    id: 'bank-bo-004',
    name: 'Económico',
    country: 'Bolivia',
    active: true,
    logoUrl: 'img/banks/bo/economico.png',
    externalId: 'f4bd49e9-48f7-47d7-bb06-9df531e580ac'
  },
  {
    id: 'bank-bo-005',
    name: 'Sol',
    country: 'Bolivia',
    active: true,
    logoUrl: 'img/banks/bo/sol.png',
    externalId: 'cb9dd58e-79e4-4e38-b05d-e0823f8455eb'
  },
  // Bancos de Perú
  {
    id: 'bank-pe-001',
    name: 'Banco de Comercio',
    country: 'Peru',
    active: true,
    logoUrl: 'img/banks/pe/bancom.png',
    externalId: '2acf1d45-f8a0-415d-8ba9-24dc48d9d765'
  },
  {
    id: 'bank-pe-002',
    name: 'BCP',
    country: 'Peru',
    active: true,
    logoUrl: 'img/banks/pe/bcp.png',
    externalId: 'cc99b41e-734e-4ea7-9e8f-2503093eb3b6'
  },  
  {
    id: 'bank-pe-004',
    name: 'Banco Pichincha',
    country: 'Peru',
    active: true,
    logoUrl: 'img/banks/pe/pichincha.png',
    externalId: '613c40e0-6aa7-4819-87ac-b9f6576d2d15'
  },
  {
    id: 'bank-pe-005',
    name: 'BBVA',
    country: 'Peru',
    active: true,
    logoUrl: 'img/banks/pe/bbva.png',
    externalId: '4950c124-09b3-49ad-baea-00171fa07a6e'
  },
  {
    id: 'bank-pe-006',
    name: 'Citibank Perú',
    country: 'Peru',
    active: true,
    logoUrl: 'img/banks/pe/citibank.png',
    externalId: '8785bb50-ec40-4f99-b335-29f367106754'
  }
];
