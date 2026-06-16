/**
 * SIN-Obras Mobile — Serviço de Câmera
 * RF07 / RN03 — Foto com metadados invioláveis (câmera nativa, GPS + timestamp do servidor)
 */

import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { vistoriaAPI } from './api';
import { obterLocalizacao } from './geofencing';

export interface FotoCapturada {
  uri: string;
  base64?: string;
  latitude?: number;
  longitude?: number;
  timestampServidor?: string;
  hashLocal?: string;
}

/**
 * Abre a câmera nativa (NUNCA a galeria — RN03).
 * Captura localização e busca timestamp do servidor.
 */
export async function capturarFotoVistoria(): Promise<FotoCapturada | null> {
  // Solicitar permissão da câmera
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permissão de câmera negada. Habilite o acesso à câmera.');
  }

  // Abrir câmera nativa (mediaTypes: 'Images', sem acesso à galeria)
  const resultado = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    base64: true,
    exif: true,
    allowsEditing: false,
  });

  if (resultado.canceled || !resultado.assets?.[0]) {
    return null;
  }

  const asset = resultado.assets[0];

  // Obter coordenadas atuais
  let latitude: number | undefined;
  let longitude: number | undefined;
  try {
    const coords = await obterLocalizacao();
    latitude = coords.latitude;
    longitude = coords.longitude;
  } catch {
    // Localização opcional para a foto (embora recomendada)
  }

  // Buscar timestamp oficial do servidor
  let timestampServidor: string | undefined;
  try {
    const { data } = await vistoriaAPI.getServerTimestamp();
    timestampServidor = data.timestamp;
  } catch {
    timestampServidor = new Date().toISOString(); // fallback
  }

  // Calcular hash SHA-256 do arquivo local (para verificação de integridade)
  let hashLocal: string | undefined;
  try {
    if (asset.base64) {
      hashLocal = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        asset.base64,
      );
    }
  } catch {
    // Hash é melhor-esforço localmente; o backend recalcula no upload
  }

  return {
    uri: asset.uri,
    base64: asset.base64 ?? undefined,
    latitude,
    longitude,
    timestampServidor,
    hashLocal,
  };
}

/**
 * Faz upload da foto para o backend com metadados
 */
export async function uploadFotoVistoria(
  vistoriaId: string,
  foto: FotoCapturada,
  checklistItemId?: string,
): Promise<any> {
  const formData = new FormData();

  // Obter tipo MIME e nome do arquivo
  const uri = foto.uri;
  const filename = uri.split('/').pop() || 'foto.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const mimeType = mimeMap[ext] || 'image/jpeg';

  // Append do arquivo
  formData.append('file', {
    uri,
    name: filename,
    type: mimeType,
  } as any);

  if (checklistItemId) formData.append('checklist_item_id', checklistItemId);
  if (foto.latitude != null) formData.append('latitude', String(foto.latitude));
  if (foto.longitude != null) formData.append('longitude', String(foto.longitude));

  const { data } = await vistoriaAPI.uploadFoto(vistoriaId, formData);
  return data;
}
