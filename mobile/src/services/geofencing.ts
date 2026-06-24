/**
 * SIN-Objetos Mobile — Serviço de Geolocalização
 * RF05 — Check-in georreferenciado com validação de raio
 */

import * as Location from 'expo-location';

export interface Coordenadas {
  latitude: number;
  longitude: number;
  precisao?: number;
}

/**
 * Solicita permissão e obtém coordenadas de alta precisão
 */
export async function obterLocalizacao(): Promise<Coordenadas> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permissão de localização negada. Habilite o GPS para fazer check-in.');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    precisao: location.coords.accuracy ?? undefined,
  };
}

/**
 * Calcula distância em metros entre dois pontos (Haversine)
 */
export function calcularDistancia(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6_371_000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Verifica se o usuário está dentro do raio do objeto
 */
export function estaNoRaio(
  posicaoUsuario: Coordenadas,
  posicaoObjeto: Coordenadas,
  raioMetros: number,
): { dentro: boolean; distancia: number } {
  const distancia = calcularDistancia(
    posicaoUsuario.latitude, posicaoUsuario.longitude,
    posicaoObjeto.latitude, posicaoObjeto.longitude,
  );
  return { dentro: distancia <= raioMetros, distancia };
}
