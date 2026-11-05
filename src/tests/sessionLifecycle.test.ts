import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

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
  // @ts-ignore
  globalThis.window = globalThis;
});

import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../services/apiClient';

describe('MeasureX Session Lifecycle & Guest State Verification', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useAuthStore.getState().logout();
    vi.restoreAllMocks();
  });

  // Test Case 1: First-time visitor opens website → Guest
  it('Case 1: First-time visitor opens website → Treated as Guest (Logged Out)', async () => {
    // Initial state before any network calls
    const initialAuth = useAuthStore.getState();
    expect(initialAuth.isAuthenticated).toBe(false);
    expect(initialAuth.user).toBeNull();

    // Mock backend returning 401 Unauthorized for unauthenticated visitor
    vi.spyOn(apiClient.auth, 'me').mockRejectedValue({
      status: 401,
      message: 'Not authenticated',
    });

    const isAuthed = await useAuthStore.getState().checkSession();
    expect(isAuthed).toBe(false);

    const postCheckAuth = useAuthStore.getState();
    expect(postCheckAuth.isAuthenticated).toBe(false);
    expect(postCheckAuth.user).toBeNull();
  });

  // Test Case 2: Visitor refreshes website without login → Guest
  it('Case 2: Visitor refreshes website without login → Stays as Guest', async () => {
    vi.spyOn(apiClient.auth, 'me').mockRejectedValue({
      status: 401,
      message: 'Not authenticated',
    });

    // Simulate page refresh checkSession
    await useAuthStore.getState().checkSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();

    // Refresh second time
    await useAuthStore.getState().checkSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  // Test Case 3: User logs in successfully → Logged In
  it('Case 3: User logs in successfully → Enters Logged In state', () => {
    const auth = useAuthStore.getState();
    expect(auth.isAuthenticated).toBe(false);

    const result = auth.login('simran.sharma@measurex.io', 'MeasureX@2026');
    expect(result.success).toBe(true);

    const updated = useAuthStore.getState();
    expect(updated.isAuthenticated).toBe(true);
    expect(updated.user).not.toBeNull();
    expect(updated.user?.email).toBe('simran.sharma@measurex.io');
    expect(updated.user?.name).toBe('Simran Sharma');
  });

  // Test Case 4: Logged-in user refreshes → Logged In only if session is valid
  it('Case 4: Logged-in user refreshes → Preserves Logged In state when backend validates session', async () => {
    // 1. User performs manual login
    useAuthStore.getState().login('simran.sharma@measurex.io', 'MeasureX@2026');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // 2. Simulate refresh: backend confirms active session cookie
    vi.spyOn(apiClient.auth, 'me').mockResolvedValue({
      authenticated: true,
      user: {
        id: 'usr-simran',
        email: 'simran.sharma@measurex.io',
        name: 'Simran Sharma',
        role: 'Lead Instrumentation Engineer',
        plan: 'pro',
      },
    });

    const isAuthed = await useAuthStore.getState().checkSession();
    expect(isAuthed).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.name).toBe('Simran Sharma');
  });

  // Test Case 5: User logs out → Guest
  it('Case 5: User logs out → Active session cleared and immediately returns to Guest state', async () => {
    // Start logged in
    useAuthStore.getState().login('simran.sharma@measurex.io', 'MeasureX@2026');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    const logoutSpy = vi.spyOn(apiClient.auth, 'logout').mockResolvedValue({ success: true });

    // Perform logout
    useAuthStore.getState().logout();

    // Verify immediate state change
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(logoutSpy).toHaveBeenCalled();
    expect(localStorageMock.getItem('measurex_auth_user')).toBeNull();
  });

  // Test Case 6: Expired or invalid session → Guest
  it('Case 6: Expired or invalid session → Purges local session and falls back to Guest state', async () => {
    // Simulate stale local session
    localStorageMock.setItem(
      'measurex_auth_user',
      JSON.stringify({
        id: 'usr-stale',
        name: 'Stale User',
        email: 'stale@example.com',
        role: 'Metrologist',
        plan: 'pro',
        joinedDate: Date.now() - 30 * 86400 * 1000,
        manuallyLoggedIn: true,
      })
    );

    // Backend reports session expired/revoked (HTTP 401)
    vi.spyOn(apiClient.auth, 'me').mockRejectedValue({
      status: 401,
      message: 'Session has expired or was revoked',
    });

    const isAuthed = await useAuthStore.getState().checkSession();
    expect(isAuthed).toBe(false);

    // Verify stale session was purged and state is Guest
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(localStorageMock.getItem('measurex_auth_user')).toBeNull();
  });

  // Additional Check: Legacy fake default accounts are never auto-logged in
  it('Case 7: Legacy fake demo account in storage without manual login is automatically purged', async () => {
    // Simulate legacy fake user deposited by old version
    localStorageMock.setItem(
      'measurex_auth_user',
      JSON.stringify({
        id: 'usr-simran',
        name: 'Simran Sharma',
        email: 'simran.sharma@measurex.io',
        role: 'Lead Instrumentation Engineer',
        plan: 'pro',
        joinedDate: Date.now(),
        // no manuallyLoggedIn flag
      })
    );

    // Backend returns 401
    vi.spyOn(apiClient.auth, 'me').mockRejectedValue({
      status: 401,
      message: 'Unauthorized',
    });

    await useAuthStore.getState().checkSession();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorageMock.getItem('measurex_auth_user')).toBeNull();
  });
});
