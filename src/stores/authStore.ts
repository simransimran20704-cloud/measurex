import { create } from 'zustand';
import confetti from 'canvas-confetti';

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

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  authPromptReason: string | null;
  isSubscriptionModalOpen: boolean;

  // Actions
  openAuthModal: (mode?: 'login' | 'signup', reason?: string) => void;
  closeAuthModal: () => void;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;
  
  login: (email: string, pass: string) => boolean;
  loginAsDemo: (plan?: SubscriptionPlan) => void;
  signup: (name: string, email: string, pass: string) => boolean;
  logout: () => void;
  upgradePlan: (plan: SubscriptionPlan) => void;

  // Helper check
  requireAuth: (actionName: string, callback: () => void) => boolean;
}

const STORAGE_KEY = 'measurex_auth_user';

export const useAuthStore = create<AuthState>((set, get) => {
  // Try loading existing user session
  let savedUser: UserProfile | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      savedUser = JSON.parse(raw);
    }
  } catch (e) {}

  // If no saved user, default to demo logged-in user so the experience is immediately seamless,
  // but allow them to switch or test unauthenticated flows.
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

    login: (email, pass) => {
      const user: UserProfile = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: 'Verified Engineer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        plan: 'pro',
        joinedDate: Date.now(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch (e) {}
      set({ user, isAuthenticated: true, isAuthModalOpen: false, authPromptReason: null });
      return true;
    },

    loginAsDemo: (plan: SubscriptionPlan = 'pro') => {
      const user: UserProfile = {
        id: 'usr-simran',
        name: 'Simran Sharma',
        email: 'simran.sharma@measurex.io',
        role: plan === 'enterprise' ? 'Lab Director' : 'Lead Instrumentation Engineer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
        plan,
        joinedDate: Date.now() - 30 * 86400 * 1000,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch (e) {}
      set({ user, isAuthenticated: true, isAuthModalOpen: false, authPromptReason: null });
    },

    signup: (name, email, pass) => {
      const user: UserProfile = {
        id: `usr-${Date.now()}`,
        name,
        email,
        role: 'Registered Metrologist',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
        plan: 'pro',
        joinedDate: Date.now(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch (e) {}
      set({ user, isAuthenticated: true, isAuthModalOpen: false, authPromptReason: null });
      return true;
    },

    logout: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      set({ user: null, isAuthenticated: false });
    },

    upgradePlan: (plan) => {
      set((state) => {
        if (!state.user) return state;
        const updated = { ...state.user, plan };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {}
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        return { user: updated, isSubscriptionModalOpen: false };
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
