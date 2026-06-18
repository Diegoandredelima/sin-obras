/**
 * api.js — Cliente HTTP centralizado da aplicação
 *
 * Cria uma instância do Axios pré-configurada com:
 *   - baseURL apontando para o backend FastAPI
 *   - Interceptor de requisição: injeta o Bearer token JWT automaticamente
 *   - Interceptor de resposta: trata 401 (token expirado) fazendo logout
 *
 * Uso em qualquer componente ou página:
 *   import api from '../services/api';
 *   const { data } = await api.get('/obras');
 *   await api.post('/auth/login', { matricula_cnpj, senha });
 *
 * A VITE_API_URL vem do .env e muda entre dev (localhost) e produção.
 */
import axios from 'axios';
import { useAuthStore } from '../store/auth';

// Instância Axios com baseURL padrão do backend
// Em produção, VITE_API_URL deve apontar para o domínio real da API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// ---------------------------------------------------------------------------
// Interceptor de REQUISIÇÃO — injeta JWT em todas as chamadas autenticadas
// ---------------------------------------------------------------------------
// Lê o token diretamente do store Zustand (getState() é síncrono).
// Assim não é necessário passar o token manualmente em cada chamada.
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      // Padrão Bearer Token (RFC 6750) exigido pelo FastAPI/OAuth2
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Interceptor de RESPOSTA — trata erros globais de autenticação
// ---------------------------------------------------------------------------
// 401 Unauthorized: token expirado ou inválido.
// TODO Bloco 2: implementar refresh automático do token antes de fazer logout.
//   O fluxo ideal seria: tentar /auth/refresh → se falhar → logout.
api.interceptors.response.use(
  (response) => response, // Repassa respostas bem-sucedidas sem alteração
  async (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado — limpa o estado de autenticação
      // e o Layout vai redirecionar para /login automaticamente
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
