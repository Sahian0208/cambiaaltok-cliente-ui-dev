import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay } from 'rxjs/operators';
import { of } from 'rxjs';

import { MOCK_USERS } from '../mock-data/users.mock';
import { MOCK_TRANSACTIONS } from '../mock-data/transactions.mock';
import { MOCK_BANKS } from '../mock-data/banks.mock';
import { MOCK_ACCOUNTS } from '../mock-data/accounts.mock';
import { User } from '../models/user.model';
import { Transaction } from '../models/transaction.model';
import { BankAccount } from '../models/bank-account.model';
import { Bank } from '../models/bank.model';

interface MockResponse {
  status: number;
  body: unknown;
}

// Envoltorio identico al que usa el backend real (ApiResponse<T>)
function toApiResponse(data: unknown, success = true, statusCode = 200): MockResponse {
  return {
    status: statusCode,
    body: {
      success,
      statusCode,
      data,
      messages: [],
      dateTimeUtc: new Date().toISOString(),
    },
  };
}

// In-memory mutable stores (persist during session)
const users: User[] = [...MOCK_USERS];
const transactions: Transaction[] = [...MOCK_TRANSACTIONS];
const banks: Bank[] = [...MOCK_BANKS];
const accounts: BankAccount[] = [...MOCK_ACCOUNTS];

function getMockResponse(
  method: string,
  url: string,
  body: unknown,
): MockResponse | null {
  // --- AUTH ---
  if (method === 'POST' && url.endsWith('/api/auth/login')) {
    return handleLogin(body as { email: string; password: string });
  }
  if (method === 'POST' && url.endsWith('/api/auth/register')) {
    return handleRegister(body as Partial<User> & { password: string });
  }

  // --- TRANSACTIONS ---
  if (method === 'GET' && url.includes('/api/transactions/pending')) {
    return handleGetPendingTransactions();
  }
  if (method === 'POST' && url.match(/\/api\/transactions\/[^/]+\/receipt$/)) {
    const id = extractId(url, '/api/transactions/', '/receipt');
    return handleUploadReceipt(id, body);
  }
  if (method === 'POST' && url.match(/\/api\/transactions\/[^/]+\/verify$/)) {
    const id = extractId(url, '/api/transactions/', '/verify');
    return handleVerifyTransaction(id);
  }
  if (method === 'POST' && url.match(/\/api\/transactions\/[^/]+\/deny$/)) {
    const id = extractId(url, '/api/transactions/', '/deny');
    return handleDenyTransaction(id, body as { motivo: string });
  }
  if (method === 'POST' && url.match(/\/api\/transactions\/[^/]+\/complete$/)) {
    const id = extractId(url, '/api/transactions/', '/complete');
    return handleCompleteTransaction(id);
  }
  if (
    method === 'GET' &&
    url.match(/\/api\/transactions\/[^/?]+$/) &&
    !url.includes('?')
  ) {
    const id = url.split('/api/transactions/')[1];
    return handleGetTransactionById(id);
  }
  if (method === 'GET' && url.includes('/api/transactions')) {
    return handleGetTransactions(url);
  }
  if (method === 'POST' && url.endsWith('/api/transactions')) {
    return handleCreateTransaction(body as Partial<Transaction>);
  }

  // --- ACCOUNTS (v1/customer-favorites-account) ---
  if (method === 'GET' && url.includes('/v1/customer-favorites-account/get-all-accounts-for-client')) {
    return handleGetAccounts(url);
  }
  if (method === 'POST' && url.endsWith('/v1/customer-favorites-account')) {
    return handleCreateAccount(body as Partial<BankAccount>);
  }
  if (method === 'PUT' && url.match(/\/v1\/customer-favorites-account\/[^/]+$/)) {
    const id = url.split('/v1/customer-favorites-account/')[1];
    return handleUpdateAccount(id, body as Partial<BankAccount>);
  }
  if (method === 'DELETE' && url.match(/\/v1\/customer-favorites-account\/[^/]+$/)) {
    const id = url.split('/v1/customer-favorites-account/')[1];
    return handleDeleteAccount(id);
  }

  // --- BANKS (v1/financial-entity) ---
  // Listado para clientes (dropdown de cuentas), envuelto en ApiResponse
  if (method === 'GET' && url.includes('/v1/financial-entity/all-by-country')) {
    return handleGetBanksForClient(url);
  }
  if (method === 'POST' && url.endsWith('/v1/financial-entity')) {
    return handleCreateBank(body as Partial<Bank>);
  }
  if (method === 'PUT' && url.match(/\/v1\/financial-entity\/[^/]+$/)) {
    const id = url.split('/v1/financial-entity/')[1];
    return handleUpdateBank(id, body as Partial<Bank>);
  }
  if (method === 'PATCH' && url.match(/\/v1\/financial-entity\/[^/]+\/toggle$/)) {
    const id = extractId(url, '/v1/financial-entity/', '/toggle');
    return handleToggleBank(id);
  }
  // Listado para administracion (incluye inactivos), sin envoltorio
  if (method === 'GET' && url.includes('/v1/financial-entity/by-country')) {
    return handleGetBanks(url);
  }

  // --- USERS ---
  if (method === 'PATCH' && url.match(/\/api\/users\/[^/]+\/role$/)) {
    const id = extractId(url, '/api/users/', '/role');
    return handleChangeUserRole(id, body as { role: string });
  }
  if (method === 'GET' && url.includes('/api/users')) {
    return handleGetUsers();
  }

  // --- RATES (Manual) ---
  if (method === 'POST' && url.endsWith('/api/rates/manual/clear')) {
    return { status: 200, body: null };
  }
  if (method === 'POST' && url.endsWith('/api/rates/manual')) {
    return { status: 200, body: null };
  }

  return null;
}

// --- Helper ---
function extractId(url: string, prefix: string, suffix: string): string {
  const afterPrefix = url.split(prefix)[1];
  return afterPrefix.split(suffix)[0];
}

function getUrlParams(url: string): URLSearchParams {
  const queryString = url.split('?')[1] || '';
  return new URLSearchParams(queryString);
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

// --- AUTH Handlers ---
function handleLogin(body: { email: string; password: string }): MockResponse {
  const user = users.find((u) => u.email === body.email);
  if (!user) {
    return { status: 401, body: { message: 'Credenciales inválidas' } };
  }
  // In mock mode, accept any password for existing users
  const { passwordHash, ...safeUser } = user;
  return { status: 200, body: safeUser };
}

function handleRegister(
  body: Partial<User> & { password: string },
): MockResponse {
  const existingUser = users.find((u) => u.email === body.email);
  if (existingUser) {
    return {
      status: 409,
      body: { message: 'El email ya se encuentra en uso' },
    };
  }

  const newUser: User = {
    id: generateId('usr'),
    firstName: body.firstName || '',
    lastName: body.lastName || '',
    phone: body.phone || '',
    documentType: body.documentType || 'CI',
    documentNumber: body.documentNumber || '',
    birthDate: body.birthDate || '',
    email: body.email || '',
    passwordHash: `$2b$10$simulated_${Date.now()}`,
    role: 'cliente',
    registeredAt: new Date().toISOString(),
  };

  users.push(newUser);
  const { passwordHash, ...safeUser } = newUser;
  return { status: 201, body: safeUser };
}

// --- TRANSACTION Handlers ---
function handleGetTransactions(url: string): MockResponse {
  const params = getUrlParams(url);
  const clientId = params.get('clientId');

  let result = [...transactions];
  if (clientId) {
    result = result.filter((t) => t.clientId === clientId);
  }

  return { status: 200, body: result };
}

function handleGetPendingTransactions(): MockResponse {
  const pending = transactions.filter(
    (t) => t.status === 'pendiente_verificacion' || t.status === 'verificado',
  );
  return { status: 200, body: pending };
}

function handleGetTransactionById(id: string): MockResponse {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) {
    return { status: 404, body: { message: 'Transacción no encontrada' } };
  }
  return { status: 200, body: transaction };
}

function handleCreateTransaction(body: Partial<Transaction>): MockResponse {
  const newTransaction: Transaction = {
    id: generateId('txn'),
    clientId: body.clientId || '',
    clientName: body.clientName || 'Cliente',
    intermediaryId: body.intermediaryId || 'usr-002',
    sourceAmount: body.sourceAmount || 0,
    sourceCurrency: body.sourceCurrency || 'BOB',
    destinationAmount: body.destinationAmount || 0,
    destinationCurrency: body.destinationCurrency || 'PEN',
    appliedRate: body.appliedRate || 0,
    sourceAccountId: body.sourceAccountId || '',
    destinationAccountId: body.destinationAccountId || '',
    destinationQrUrl: body.destinationQrUrl || '',
    intermediaryQrUrl: 'img/QR/qr-intermediario-default.jpeg',
    clientReceiptUrl: null,
    intermediaryReceiptUrl: null,
    status: 'pendiente_deposito',
    denialReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  transactions.push(newTransaction);
  return { status: 201, body: newTransaction };
}

function handleUploadReceipt(id: string, body: unknown): MockResponse {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) {
    return { status: 404, body: { message: 'Transacción no encontrada' } };
  }

  // Extract type from FormData or plain object
  let type: string | null = null;
  if (body instanceof FormData) {
    type = body.get('type') as string;
  } else {
    const data = body as { type?: string };
    type = data?.type ?? null;
  }

  const simulatedUrl = `assets/images/mock/comprobante-${Date.now()}.png`;

  if (type === 'intermediario') {
    transaction.intermediaryReceiptUrl = simulatedUrl;
    transaction.status = 'finalizado';
  } else {
    transaction.clientReceiptUrl = simulatedUrl;
    transaction.status = 'pendiente_verificacion';
  }
  transaction.updatedAt = new Date().toISOString();

  return { status: 200, body: { ...transaction } };
}

function handleVerifyTransaction(id: string): MockResponse {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) {
    return { status: 404, body: { message: 'Transacción no encontrada' } };
  }

  transaction.status = 'verificado';
  transaction.updatedAt = new Date().toISOString();
  return { status: 200, body: transaction };
}

function handleDenyTransaction(
  id: string,
  body: { motivo: string },
): MockResponse {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) {
    return { status: 404, body: { message: 'Transacción no encontrada' } };
  }

  transaction.status = 'denegado';
  transaction.denialReason = body.motivo || 'Sin motivo especificado';
  transaction.updatedAt = new Date().toISOString();
  return { status: 200, body: transaction };
}

function handleCompleteTransaction(id: string): MockResponse {
  const transaction = transactions.find((t) => t.id === id);
  if (!transaction) {
    return { status: 404, body: { message: 'Transacción no encontrada' } };
  }

  transaction.status = 'finalizado';
  transaction.updatedAt = new Date().toISOString();
  return { status: 200, body: transaction };
}

// --- ACCOUNT Handlers ---
// GET /v1/customer-favorites-account/get-all-accounts-for-client?authUseId=&accountType=
function handleGetAccounts(url: string): MockResponse {
  const params = getUrlParams(url);
  const authUseId = params.get('authUseId');
  const accountType = params.get('accountType');

  let result = [...accounts];
  if (authUseId) {
    result = result.filter((a) => a.userId === authUseId);
  }
  if (accountType) {
    result = result.filter((a) => a.type === accountType);
  }

  return toApiResponse(result);
}

function handleCreateAccount(body: Partial<BankAccount>): MockResponse {
  const bank = banks.find((b) => b.externalId === body.bankId);
  const newAccount: BankAccount = {
    id: generateId('acc'),
    userId: body.userId || '',
    bankId: body.bankId || '',
    bankName: bank?.name,
    accountNumber: body.accountNumber || '',
    holderName: body.holderName || '',
    type: body.type || 'origen',
    country: body.country || 'Bolivia',
    isYape: body.isYape || false,
    isQR: body.isQR || false,
    otherAccountValue: body.otherAccountValue || '',
  };

  accounts.push(newAccount);
  return { status: 201, body: newAccount };
}

function handleUpdateAccount(
  id: string,
  body: Partial<BankAccount>,
): MockResponse {
  const index = accounts.findIndex((a) => a.id === id);
  if (index === -1) {
    return { status: 404, body: { message: 'Cuenta no encontrada' } };
  }

  const bank = body.bankId ? banks.find((b) => b.externalId === body.bankId) : undefined;
  accounts[index] = {
    ...accounts[index],
    ...body,
    bankName: bank?.name ?? accounts[index].bankName,
    id,
  };
  return { status: 200, body: accounts[index] };
}

function handleDeleteAccount(id: string): MockResponse {
  const index = accounts.findIndex((a) => a.id === id);
  if (index === -1) {
    return { status: 404, body: { message: 'Cuenta no encontrada' } };
  }

  accounts.splice(index, 1);
  return { status: 204, body: null };
}

// --- BANK Handlers ---
// GET /v1/financial-entity/all-by-country?country= (para clientes, envuelto en ApiResponse, solo activos)
function handleGetBanksForClient(url: string): MockResponse {
  const params = getUrlParams(url);
  const country = params.get('country');

  let result = banks.filter((b) => b.active);
  if (country) {
    result = result.filter((b) => b.country === country);
  }

  return toApiResponse(result);
}

// GET /v1/financial-entity/by-country?pais=&includeInactive= (para administracion, sin envoltorio)
function handleGetBanks(url: string): MockResponse {
  const params = getUrlParams(url);
  const pais = params.get('pais');
  const includeInactive = params.get('includeInactive');

  let result = [...banks];
  if (pais) {
    result = result.filter((b) => b.country === pais);
  }
  // By default, only return active banks unless includeInactive is set
  if (!includeInactive) {
    result = result.filter((b) => b.active);
  }

  return { status: 200, body: result };
}

function handleCreateBank(body: Partial<Bank>): MockResponse {
  const newBank: Bank = {
    id: generateId('bank'),
    name: body.name || '',
    country: body.country || 'Bolivia',
    active: body.active !== undefined ? body.active : true,
    logoUrl:
      body.logoUrl ||
      `assets/images/banks/${(body.name || 'default').toLowerCase().replace(/\s+/g, '-')}.png`,
    externalId: body.externalId || crypto.randomUUID(),
  };

  banks.push(newBank);
  return { status: 201, body: newBank };
}

function handleUpdateBank(id: string, body: Partial<Bank>): MockResponse {
  const index = banks.findIndex((b) => b.id === id);
  if (index === -1) {
    return { status: 404, body: { message: 'Banco no encontrado' } };
  }

  banks[index] = { ...banks[index], ...body, id };
  return { status: 200, body: banks[index] };
}

function handleToggleBank(id: string): MockResponse {
  const bank = banks.find((b) => b.id === id);
  if (!bank) {
    return { status: 404, body: { message: 'Banco no encontrado' } };
  }

  bank.active = !bank.active;
  return { status: 200, body: bank };
}

// --- USER Handlers ---
function handleGetUsers(): MockResponse {
  const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
  return { status: 200, body: safeUsers };
}

function handleChangeUserRole(
  id: string,
  body: { role: string },
): MockResponse {
  const user = users.find((u) => u.id === id);
  if (!user) {
    return { status: 404, body: { message: 'Usuario no encontrado' } };
  }

  user.role = body.role as User['role'];
  const { passwordHash, ...safeUser } = user;
  return { status: 200, body: safeUser };
}

// --- INTERCEPTOR ---
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  // Routes that pass through to the real API
  if (
    req.url.includes('exchangerate-api.com') ||
    req.url.includes('api.exchangerate')
  ) {
    return next(req);
  }

  // Simulate responses for internal routes
  const mockResponse = getMockResponse(req.method, req.url, req.body);
  if (mockResponse) {
    return of(
      new HttpResponse({
        status: mockResponse.status,
        body: mockResponse.body,
      }),
    ).pipe(delay(300)); // Simulate latency
  }

  return next(req);
};
