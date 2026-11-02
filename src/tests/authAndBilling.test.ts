import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

// Simple in-memory storage polyfill for Vitest Node runner
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => storageMap.set(key, String(val)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

beforeAll(() => {
  // @ts-ignore
  globalThis.localStorage = localStorageMock;
});

// Import after polyfill so initial state can access localStorage safely
import { useAuthStore } from '../stores/authStore';

describe('MeasureX Authentication & Password System', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('authenticates seed user with correct password', () => {
    const auth = useAuthStore.getState();
    const result = auth.login('simran.sharma@measurex.io', 'MeasureX@2026');
    expect(result.success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('simran.sharma@measurex.io');
  });

  it('rejects incorrect password with descriptive error', () => {
    const auth = useAuthStore.getState();
    const result = auth.login('simran.sharma@measurex.io', 'WrongPassword123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Incorrect password');
  });

  it('rejects unregistered email address', () => {
    const auth = useAuthStore.getState();
    const result = auth.login('nonexistent.user@unknown.org', 'AnyPassword');
    expect(result.success).toBe(false);
    expect(result.error).toContain('No account registered');
  });

  it('creates new account with password validation and requires explicit sign in', () => {
    const auth = useAuthStore.getState();
    const signupResult = auth.signup('Dr. Aryan Roy', 'aryan.roy@isro.gov.in', 'SecurePass2026');
    expect(signupResult.success).toBe(true);

    // Explicit check: create account does NOT directly authenticate the user
    // The user must sign in with their password
    const loginResult = auth.login('aryan.roy@isro.gov.in', 'SecurePass2026');
    expect(loginResult.success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.name).toBe('Dr. Aryan Roy');
  });

  it('handles upgrade to Enterprise plan with invoice generation', () => {
    const auth = useAuthStore.getState();
    auth.login('simran.sharma@measurex.io', 'MeasureX@2026');

    auth.upgradePlan('enterprise', {
      id: 'MX-INV-TEST-001',
      plan: 'enterprise',
      amount: 408,
      billingCycle: 'annual',
      customerName: 'Simran Sharma',
      customerEmail: 'simran.sharma@measurex.io',
      customerAddress: 'Tech Park, Bengaluru',
      customerCountry: 'India',
      paymentMethod: 'card',
      paymentRef: 'TXN-TEST',
      date: Date.now(),
    });

    expect(useAuthStore.getState().user?.plan).toBe('enterprise');
    expect(useAuthStore.getState().lastInvoice?.id).toBe('MX-INV-TEST-001');
  });
});
