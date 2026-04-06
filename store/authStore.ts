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
  isAuthenticated: boolean
  isInitialized: boolean
  sessionChecked: boolean
  isCheckingSession: boolean
  setAuth: (user: User) => void
  logout: () => void
  setUser: (user: User) => void
  setInitialized: () => void
  setSessionChecked: (checked: boolean) => void
  setIsCheckingSession: (checking: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      sessionChecked: false,
      isCheckingSession: false,

      // Methods
      setAuth: (user) =>
        set({
          user: { ...user, role: (user.role as string).toLowerCase() as any },
          isAuthenticated: true,
          isInitialized: true,
          sessionChecked: true,
          isCheckingSession: false,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          sessionChecked: true,
          isCheckingSession: false,
        }),

      setUser: (user) => set({ user: { ...user, role: (user.role as string).toLowerCase() as any } }),

      setInitialized: () => set({ isInitialized: true }),

      setSessionChecked: (checked) => set({ sessionChecked: checked }),
      
      setIsCheckingSession: (checking) => set({ isCheckingSession: checking }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setInitialized()
        }
      },
    }
  )
)