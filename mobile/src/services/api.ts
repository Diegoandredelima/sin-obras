/**
 * api.ts — Cliente HTTP Centralizado Mobile (Axios + Interceptors)
 *
 * Configura o cliente Axios com a URL base da API SIN-Obras.
 * Inclui:
 *   - Interceptor de Requisição: recupera assincronamente o token JWT encriptado do
 *     SecureStore e injeta no header `Authorization` de todas as requisições de saída.
 *   - Interceptor de Resposta: remove o token local em caso de erro 401 (Não Autorizado)
 *     para forçar o fluxo de login.
 *   - Módulos de API tipados para Obras, Vistorias, Empresa e Autenticação.
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

api.interceptors.response.use(
  (res: any) => res,
  async (error: any) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('access_token');
    }
    return Promise.reject(error);
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
  getDiario: (obraId: string) => api.get(`/empresa/obras/${obraId}/diario`),
  createDiario: (obraId: string, payload: any) => api.post(`/empresa/obras/${obraId}/diario`, payload),
  getMedicoes: (obraId: string) => api.get(`/empresa/obras/${obraId}/medicoes`),
  assinarMedicao: (medicaoId: string) => api.post(`/empresa/medicoes/${medicaoId}/assinar`, { confirmado: true }),
};

// Endpoints de Obras
export const obrasAPI = {
  list: () => api.get('/obras'),
  getById: (id: string) => api.get(`/obras/${id}`),
};

// Auth
export const authAPI = {
  login: (identificador: string, senha: string) => api.post('/auth/login', { identificador, senha }),
  me: () => api.get('/auth/me'),
};

export default api;
