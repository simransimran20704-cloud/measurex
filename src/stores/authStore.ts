import { create } from 'zustand';
import confetti from 'canvas-confetti';
import { apiClient } from '../services/apiClient';

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  plan: SubscriptionPlan;
  joinedDate: number;
}

export interface UserRecord extends UserProfile {
  password: string;
}

export interface InvoiceRecord {
  id: string;
  plan: SubscriptionPlan;
  amount: number;
  billingCycle: 'monthly' | 'annual';
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerCountry: string;
  gstNumber?: string;
  paymentMethod: 'card' | 'upi' | 'netbanking';
  paymentRef: string;
  date: number;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  authPromptReason: string | null;
  
  // Subscription & Billing Modals
  isSubscriptionModalOpen: boolean;
  isBillingModalOpen: boolean;
  billingPlan: SubscriptionPlan;
  lastInvoice: InvoiceRecord | null;

  // Actions
  openAuthModal: (mode?: 'login' | 'signup', reason?: string) => void;
  closeAuthModal: () => void;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;
  openBillingModal: (plan: SubscriptionPlan) => void;
  closeBillingModal: () => void;
  
  isEmailRegistered: (email: string) => boolean;
  login: (email: string, pass: string) => { success: boolean; error?: string };
  loginAsDemo: (plan?: SubscriptionPlan) => void;
  signup: (name: string, email: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  upgradePlan: (plan: SubscriptionPlan, invoice?: InvoiceRecord) => void;

  // Helper check
  requireAuth: (actionName: string, callback: () => void) => boolean;
}

const STORAGE_SESSION_KEY = 'measurex_auth_user';
const STORAGE_USERS_DB_KEY = 'measurex_users_db';
const STORAGE_INVOICES_KEY = 'measurex_invoices';

// Seeded user database
const SEED_USERS: UserRecord[] = [
  {
    id: 'usr-simran',
    name: 'Simran Sharma',
    email: 'simran.sharma@measurex.io',
    password: 'MeasureX@2026',
    role: 'Lead Instrumentation Engineer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    plan: 'pro',
    joinedDate: Date.now() - 30 * 86400 * 1000,
  },
  {
    id: 'usr-vikram',
    name: 'Dr. Vikram Sarabhai',
    email: 'director@measurex.io',
    password: 'LabDirector@2026',
    role: 'Lab Director & Chief Metrologist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    plan: 'enterprise',
    joinedDate: Date.now() - 60 * 86400 * 1000,
  },
  {
    id: 'usr-student',
    name: 'Student Metrologist',
    email: 'student@measurex.io',
    password: 'MeasureX@Free',
    role: 'Precision Science Trainee',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    plan: 'free',
    joinedDate: Date.now() - 10 * 86400 * 1000,
  },
];

// Helper to get or initialize persistent user DB
const getUsersDb = (): UserRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  // Initialize seed users
  try {
    localStorage.setItem(STORAGE_USERS_DB_KEY, JSON.stringify(SEED_USERS));
  } catch (e) {}
  return SEED_USERS;
};

export const useAuthStore = create<AuthState>((set, get) => {
  // Ensure DB is initialized
  getUsersDb();

  // Try loading existing user session
  let savedUser: UserProfile | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (raw) {
      savedUser = JSON.parse(raw);
    }
  } catch (e) {}

  // If no saved user, default to demo logged-in user so the experience is immediately seamless
  const initialUser: UserProfile = savedUser || {
    id: 'usr-simran',
    name: 'Simran Sharma',
    email: 'simran.sharma@measurex.io',
    role: 'Lead Instrumentation Engineer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    plan: 'pro',
    joinedDate: Date.now() - 30 * 86400 * 1000,
  };

  return {
    user: initialUser,
    isAuthenticated: true,
    isAuthModalOpen: false,
    authModalMode: 'login',
    authPromptReason: null,
    isSubscriptionModalOpen: false,
    isBillingModalOpen: false,
    billingPlan: 'pro',
    lastInvoice: null,

    openAuthModal: (mode = 'login', reason) =>
      set({
        isAuthModalOpen: true,
        authModalMode: mode,
        authPromptReason: reason || null,
      }),

    closeAuthModal: () =>
      set({
        isAuthModalOpen: false,
        authPromptReason: null,
      }),

    openSubscriptionModal: () => set({ isSubscriptionModalOpen: true }),
    closeSubscriptionModal: () => set({ isSubscriptionModalOpen: false }),

    openBillingModal: (plan: SubscriptionPlan) =>
      set({
        isSubscriptionModalOpen: false,
        isBillingModalOpen: true,
        billingPlan: plan,
      }),

    closeBillingModal: () => set({ isBillingModalOpen: false }),

    // Password-Verified Login
    login: (email: string, pass: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const users = getUsersDb();
      const matched = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!matched) {
        return {
          success: false,
          error: `No account registered with "${email}". Please verify or switch to Create Account.`,
        };
      }

      if (matched.password !== pass) {
        return {
          success: false,
          error: 'Incorrect password! Please check your credentials or click a demo login chip below.',
        };
      }

      // Successful login
      const profile: UserProfile = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        avatar: matched.avatar,
        plan: matched.plan,
        joinedDate: matched.joinedDate,
      };

      try {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(profile));
      } catch (e) {}

      // Sync with server-side Cloudflare Worker if online
      if (typeof window !== 'undefined') {
        apiClient.auth.login(matched.email, matched.password).catch(() => {});
      }

      set({
        user: profile,
        isAuthenticated: true,
        isAuthModalOpen: false,
        authPromptReason: null,
      });

      return { success: true };
    },

    loginAsDemo: (plan: SubscriptionPlan = 'pro') => {
      const users = getUsersDb();
      const matched =
        users.find((u) => u.plan === plan) ||
        users.find((u) => u.email === 'simran.sharma@measurex.io') ||
        SEED_USERS[0];

      const profile: UserProfile = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        avatar: matched.avatar,
        plan: matched.plan,
        joinedDate: matched.joinedDate,
      };

      try {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(profile));
      } catch (e) {}

      // Sync with server-side Cloudflare Worker if online
      if (typeof window !== 'undefined') {
        apiClient.auth.login(matched.email, matched.password).catch(() => {});
      }

      set({
        user: profile,
        isAuthenticated: true,
        isAuthModalOpen: false,
        authPromptReason: null,
      });
    },

    isEmailRegistered: (email: string) => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) return false;
      const users = getUsersDb();
      return users.some((u) => u.email.toLowerCase() === cleanEmail);
    },

    // Sign Up with Password validation and persistence
    signup: (name: string, email: string, pass: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      if (cleanName.length < 2) {
        return { success: false, error: 'Full name must be at least 2 characters.' };
      }

      if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      if (pass.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }

      const users = getUsersDb();
      const alreadyExists = users.some((u) => u.email.toLowerCase() === cleanEmail);
      if (alreadyExists) {
        return {
          success: false,
          error: `⚠️ Warning: "${cleanEmail}" is already registered! You cannot register this email again. Please sign in with your password.`,
        };
      }

      const newUser: UserRecord = {
        id: `usr-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        password: pass,
        role: 'Verified Metrologist',
        avatar: `https://images.unsplash.com/photo-${1534528741775 + (users.length % 5)}?auto=format&fit=crop&q=80&w=120`,
        plan: 'pro', // 14-day Pro trial included
        joinedDate: Date.now(),
      };

      const updatedUsers = [...users, newUser];
      try {
        localStorage.setItem(STORAGE_USERS_DB_KEY, JSON.stringify(updatedUsers));
      } catch (e) {}

      // Sync with Cloudflare edge backend if online
      if (typeof window !== 'undefined') {
        apiClient.auth.register(cleanName, cleanEmail, pass).catch(() => {});
      }

      // NOTE: Do NOT sign in automatically upon creation. User must explicitly sign in with their password.
      return { success: true };
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        apiClient.auth.logout().catch(() => {});
      }
      try {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      } catch (e) {}
      set({ user: null, isAuthenticated: false });
    },

    upgradePlan: (plan: SubscriptionPlan, invoice?: InvoiceRecord) => {
      set((state) => {
        if (!state.user) return state;
        const updatedUser: UserProfile = { ...state.user, plan };
        
        // Update session
        try {
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
        } catch (e) {}

        // Update in users database as well
        try {
          const users = getUsersDb();
          const updatedDb = users.map((u) =>
            u.id === state.user?.id ? { ...u, plan } : u
          );
          localStorage.setItem(STORAGE_USERS_DB_KEY, JSON.stringify(updatedDb));
        } catch (e) {}

        // Save invoice
        if (invoice) {
          try {
            const rawInv = localStorage.getItem(STORAGE_INVOICES_KEY);
            const invoices: InvoiceRecord[] = rawInv ? JSON.parse(rawInv) : [];
            invoices.unshift(invoice);
            localStorage.setItem(STORAGE_INVOICES_KEY, JSON.stringify(invoices));
          } catch (e) {}
        }

        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          try {
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.55 },
            });
          } catch (e) {}
        }

        return {
          user: updatedUser,
          isSubscriptionModalOpen: false,
          lastInvoice: invoice || null,
        };
      });
    },

    requireAuth: (actionName, callback) => {
      const state = get();
      if (!state.isAuthenticated || !state.user) {
        set({
          isAuthModalOpen: true,
          authPromptReason: `Authentication is mandatory to ${actionName} and sync measurements to your cloud account.`,
        });
        return false;
      }
      callback();
      return true;
    },
  };
});
