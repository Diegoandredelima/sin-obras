import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set: any) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (user, token) => {
    await SecureStore.setItemAsync('access_token', token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('user_data');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync('access_token');
    const userData = await SecureStore.getItemAsync('user_data');
    if (token && userData) {
      set({ token, user: JSON.parse(userData), isAuthenticated: true });
    }
  },
}));
