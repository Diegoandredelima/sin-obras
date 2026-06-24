/**
 * api.ts — Cliente HTTP Centralizado Mobile (Axios + Interceptors)
 *
 * Configura o cliente Axios com a URL base da API SIN-Objetos.
 * Inclui:
 *   - Interceptor de Requisição: recupera assincronamente o token JWT encriptado do
 *     SecureStore e injeta no header `Authorization` de todas as requisições de saída.
 *   - Interceptor de Resposta: remove o token local em caso de erro 401 (Não Autorizado)
 *     para forçar o fluxo de login.
 *   - Módulos de API tipados para Objetos, Vistorias, Empresa e Autenticação.
 */
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api'; // 10.0.2.2 = localhost no emulador Android

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

api.interceptors.request.use(async (config: any) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res: any) => res,
  async (error: any) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url === '/auth/refresh') {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = await SecureStore.getItemAsync('refresh_token');

    if (!refreshToken) {
      await SecureStore.deleteItemAsync('access_token');
      return Promise.reject(error);
    }

    try {
      const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken });
      const newToken = data.access_token;
      const newRefreshToken = data.refresh_token || refreshToken;

      await SecureStore.setItemAsync('access_token', newToken);
      await SecureStore.setItemAsync('refresh_token', newRefreshToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Endpoints de Vistoria
export const vistoriaAPI = {
  checkin: (payload: any) => api.post('/vistorias/checkin', payload),
  getChecklist: (vistoriaId: string) => api.get(`/vistorias/${vistoriaId}/checklist`),
  updateChecklistItem: (itemId: string, payload: any) => api.patch(`/vistorias/checklist/${itemId}`, payload),
  finalizar: (vistoriaId: string, payload: any) => api.post(`/vistorias/${vistoriaId}/finalizar`, payload),
  getServerTimestamp: () => api.get('/vistorias/timestamp'),
  uploadFoto: (vistoriaId: string, formData: any) =>
    api.post(`/vistorias/${vistoriaId}/fotos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }),
};

// Endpoints da Empresa
export const empresaAPI = {
  getDiario: (objetoId: string) => api.get(`/empresa/objetos/${objetoId}/diario`),
  createDiario: (objetoId: string, payload: any) => api.post(`/empresa/objetos/${objetoId}/diario`, payload),
  getMedicoes: (objetoId: string) => api.get(`/empresa/objetos/${objetoId}/medicoes`),
  assinarMedicao: (medicaoId: string) => api.post(`/empresa/medicoes/${medicaoId}/assinar`, { confirmado: true }),
};

// Endpoints de Medição (Boletim) — fluxo do fiscal medindo em campo
export const medicaoAPI = {
  getEventos: (objetoId: string) => api.get(`/cronograma/objetos/${objetoId}/metas`),
  criarFiscal: (objetoId: string, payload: any) => api.post(`/empresa/objetos/${objetoId}/medicoes/fiscal`, payload),
  getBoletim: (medicaoId: string) => api.get(`/empresa/medicoes/${medicaoId}/boletim`),
  uploadFoto: (medicaoId: string, formData: any) =>
    api.post(`/empresa/medicoes/${medicaoId}/fotos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }),
  concluir: (medicaoId: string, payload: any) => api.post(`/empresa/medicoes/${medicaoId}/concluir`, payload),
};

// Endpoints de Objetos
export const objetosAPI = {
  list: () => api.get('/objetos'),
  getById: (id: string) => api.get(`/objetos/${id}`),
};

// Auth
export const authAPI = {
  login: (matricula_cnpj: string, senha: string) => api.post('/auth/login', { matricula_cnpj, senha }),
  refresh: (refresh_token: string) => api.post('/auth/refresh', { refresh_token }),
  me: () => api.get('/auth/me'),
};

export default api;
