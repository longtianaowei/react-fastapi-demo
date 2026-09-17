import { create } from "zustand";

import type { CurrentUser } from "@/api/auth";

type AuthState = {
  currentUser: CurrentUser | null;
  isRestoring: boolean;
  setCurrentUser: (currentUser: CurrentUser | null) => void;
  setIsRestoring: (isRestoring: boolean) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isRestoring: true,
  setCurrentUser: (currentUser) => set({ currentUser }),
  setIsRestoring: (isRestoring) => set({ isRestoring }),
  clearAuth: () => set({ currentUser: null }),
}));
