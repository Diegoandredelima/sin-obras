/**
 * auth.js — Store Global de Autenticação (Zustand + Persist)
 *
 * Armazena o estado de autenticação do usuário logado.
 * Usa o middleware `persist` para salvar no localStorage, garantindo que
 * o login persista entre refreshes de página (sem precisar logar novamente).
 *
 * Estado disponível:
 *   - user: objeto com dados do usuário (nome, email, tipo/role, etc.)
 *   - token: JWT access token para autenticar chamadas à API
 *   - isAuthenticated: booleano — true quando user e token estão presentes
 *
 * Ações disponíveis:
 *   - login(userData, token): salva usuário + token após autenticação bem-sucedida
 *   - logout(): limpa o estado (usuário é redirecionado para /login pelo Layout)
 *
 * Uso em qualquer componente:
 *   const { user, isAuthenticated, login, logout } = useAuthStore();
 *   const token = useAuthStore((state) => state.token); // seletor otimizado
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      // Estado inicial — usuário não autenticado
      user: null,
      token: null,
      isAuthenticated: false,

      /**
       * login — chamado após autenticação bem-sucedida.
       * @param {Object} userData - Dados retornados pelo /auth/me
       * @param {string} token    - JWT access_token retornado pelo /auth/login
       */
      login: (userData, token) => set({
        user: userData,
        token: token,
        isAuthenticated: true,
      }),

      /**
       * logout — limpa todo o estado de autenticação.
       * O Layout detecta isAuthenticated=false e redireciona para /login.
       */
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
      }),
    }),
    {
      // Chave usada no localStorage para persistência.
      // Troque se precisar invalidar sessões existentes de todos os usuários.
      name: 'sinobras-auth',
    }
  )
);
