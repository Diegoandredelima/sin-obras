/**
 * auth.ts — Store Global de Autenticação Mobile (Zustand + Expo SecureStore)
 *
 * Armazena e gerencia o estado de autenticação e as credenciais do fiscal de obras.
 * Utiliza o `expo-secure-store` para persistir dados sensíveis (JWT e perfil) de
 * forma encriptada no hardware do celular.
 */
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
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set: any) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,

  login: async (user, token, refreshToken) => {
    await SecureStore.setItemAsync('access_token', token);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
    await SecureStore.setItemAsync('user_data', JSON.stringify(user));
    set({ user, token, refreshToken, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user_data');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },

  loadFromStorage: async () => {
    const token = await SecureStore.getItemAsync('access_token');
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    const userData = await SecureStore.getItemAsync('user_data');
    if (token && userData) {
      set({ token, refreshToken, user: JSON.parse(userData), isAuthenticated: true });
    }
  },
}));
