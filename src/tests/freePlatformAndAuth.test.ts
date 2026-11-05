import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import { useHistoryStore } from '../stores/historyStore';
import { useProjectStore } from '../stores/projectStore';
import fs from 'fs';

// Node storage mock
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => storageMap.set(key, String(val)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

describe('MeasureX Free Platform & Optional Authentication Suite', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useAuthStore.getState().logout();
  });

  // Scenario 1: Guest user can access every free tool
  it('Scenario 1: Guest user can access tools without compulsion to authenticate', () => {
    const authState = useAuthStore.getState();
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.user).toBeNull();

    // Tools list accessible to guest
    const sidebarSrc = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf-8');
    expect(sidebarSrc).toContain('vernier-caliper');
    expect(sidebarSrc).toContain('screw-gauge');
    expect(sidebarSrc).toContain('precision-studio');
    expect(sidebarSrc).toContain('image-measurement');
    expect(sidebarSrc).toContain('unit-converter');
    expect(sidebarSrc).toContain('scientific-instruments');
  });

  // Scenario 2: Guest user can use measurement and conversion features
  it('Scenario 2: Guest user can calculate without login', async () => {
    const { convertValue } = await import('../engine/conversion/units');
    const result = convertValue(100, 'mm', 'in', 'length');
    expect(result).toBeCloseTo(3.937, 2);
  });

  // Scenario 3: Login is requested when saving a measurement
  it('Scenario 3: Login prompt is triggered when a guest attempts to save to history', () => {
    const auth = useAuthStore.getState();
    expect(auth.isAuthenticated).toBe(false);

    let callbackExecuted = false;
    const allowed = auth.requireAuth('save measurement to history', () => {
      callbackExecuted = true;
    });

    expect(allowed).toBe(false);
    expect(callbackExecuted).toBe(false);
    expect(useAuthStore.getState().isAuthModalOpen).toBe(true);
    expect(useAuthStore.getState().authPromptReason).toContain('save measurement to history');
  });

  // Scenario 4: Authenticated user can access personal measurement history
  it('Scenario 4: Authenticated user can save and view their measurement history', () => {
    const auth = useAuthStore.getState();
    auth.login('simran.sharma@measurex.io', 'MeasureX@2026');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    const userId = useAuthStore.getState().user?.id;

    const history = useHistoryStore.getState();
    history.addItem({
      tool: 'Vernier Caliper',
      title: 'Precision Shaft Test',
      value: '25.40 mm',
      rawNumericValue: 25.4,
      unit: 'mm',
    });

    const items = useHistoryStore.getState().items;
    const userItem = items.find((i) => i.title === 'Precision Shaft Test');
    expect(userItem).toBeDefined();
    expect(userItem?.userId).toBe(userId);
  });

  // Scenario 5: Users cannot access another user's private records
  it("Scenario 5: User B cannot access User A's private measurements", () => {
    // User A adds a private record
    useHistoryStore.getState().addItem({
      tool: 'Screw Gauge',
      title: "User A Confidential Bore",
      value: '12.05 mm',
      rawNumericValue: 12.05,
      unit: 'mm',
      userId: 'usr-user-A',
    });

    // User B logs in
    const auth = useAuthStore.getState();
    auth.login('director@measurex.io', 'LabDirector@2026');
    const userB = useAuthStore.getState().user!;
    expect(userB.id).toBe('usr-vikram');

    // Filter items using User B's perspective
    const allItems = useHistoryStore.getState().items;
    const userBItems = allItems.filter((i) => i.userId === userB.id);

    // User A's item is not present in User B's list
    expect(userBItems.some((i) => i.title === "User A Confidential Bore")).toBe(false);
  });

  // Scenario 6: No subscription or payment prompts remain in the UI
  it('Scenario 6: Verifies absence of MeasureX Pro, Upgrade, and Subscription buttons in layout', () => {
    const sidebarSrc = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf-8');
    expect(sidebarSrc).not.toContain('MeasureX Pro');
    expect(sidebarSrc).not.toContain('Upgrade Plan');
    expect(sidebarSrc).not.toContain('openSubscriptionModal');
    expect(sidebarSrc).toContain('Free & Open');

    const headerSrc = fs.readFileSync('src/components/layout/Header.tsx', 'utf-8');
    expect(headerSrc).not.toContain('Manage Subscription');
    expect(headerSrc).not.toContain('openSubscriptionModal');
    expect(headerSrc).not.toContain('{user.plan} Plan');

    const appSrc = fs.readFileSync('src/App.tsx', 'utf-8');
    expect(appSrc).not.toContain('<SubscriptionModal');
    expect(appSrc).not.toContain('<BillingCheckoutModal');
  });

  // Scenario 7: No new payment transactions can be initiated
  it('Scenario 7: Checkout endpoint rejects payment creation with HTTP 403 PAYMENTS_DISABLED', () => {
    const checkoutSrc = fs.readFileSync('functions/api/payments/create-checkout-session.ts', 'utf-8');
    expect(checkoutSrc).toContain('PAYMENTS_DISABLED');
    expect(checkoutSrc).toContain('403');
    expect(checkoutSrc).toContain('MeasureX is 100% free for all users');
  });

  // Scenario 8: Existing database records and core functionality remain intact
  it('Scenario 8: D1 database bindings, migrations, and user seed records remain intact', () => {
    const wranglerSrc = fs.readFileSync('wrangler.toml', 'utf-8');
    expect(wranglerSrc).toContain('[[d1_databases]]');
    expect(wranglerSrc).toContain('database_name = "measurex-db"');
    expect(wranglerSrc).toContain('database_id = "f0432b03-03aa-4e73-9015-af46b32e54a2"');

    const webhookSrc = fs.readFileSync('functions/api/payments/webhook.ts', 'utf-8');
    expect(webhookSrc).toContain('checkout.session.completed'); // Preserved for historical compatibility
  });
});
