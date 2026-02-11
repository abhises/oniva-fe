import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  phone: string
  fullName: string
  role: 'client' | 'driver' | 'admin'
  language: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isInitialized: boolean  // ← NEW: Track if store is initialized
  setAuth: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
  setInitialized: () => void  // ← NEW: Mark as initialized
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,  // ← NEW: Start as not initialized

      // Methods
      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isInitialized: true,  // ← NEW: Mark as initialized when auth
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitialized: true,  // ← NEW: Stay initialized (just logged out)
        }),

      setUser: (user) => set({ user }),

      setInitialized: () => set({ isInitialized: true }),  // ← NEW: Simple setter
    }),
    {
      name: 'auth-storage',
      // ← NEW: This hook runs AFTER loading from localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setInitialized()  // Tell others we're done loading
        }
      },
    }
  )
)