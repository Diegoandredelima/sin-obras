/**
 * CheckinScreen.tsx — Tela de Check-in Georreferenciado
 *
 * Responsável por obter a localização GPS em tempo real do fiscal e comparar com as
 * coordenadas cadastradas do objeto (Geofencing — RF05), determinando se ele está
 * no raio de abrangência configurado.
 *
 * Funcionalidades:
 *   - Exibe o mapa (React Native Maps) com a localização do objeto e círculo de geofencing.
 *   - Obtém a geolocalização do dispositivo de forma assíncrona.
 *   - Verifica a conectividade do dispositivo (NetInfo):
 *     - Se online, submete para o endpoint POST `/api/vistorias/checkin`.
 *     - Se offline, salva no banco local (WatermelonDB/SQLite) para sincronização posterior.
 *   - Redireciona o usuário para o checklist de vistoria após confirmação.
 */
import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { obterLocalizacao, calcularDistancia } from '../../services/geofencing';
import { vistoriaAPI } from '../../services/api';
import { salvarCheckinOffline } from '../../db/offline';
import NetInfo from '@react-native-community/netinfo';

// Fallback usado apenas se a tela for aberta sem objeto (ex.: deep link / demo).
const OBJETO_FALLBACK = {
  id: '1',
  titulo: 'Obra (demo)',
  latitude: -5.7945,
  longitude: -35.2110,
  raio_geofencing_metros: 200,
};

export default function CheckinScreen({ navigation, route }: any) {
  const params = route?.params?.objeto;
  const objeto = {
    id: params?.id ?? OBJETO_FALLBACK.id,
    titulo: params?.titulo ?? OBJETO_FALLBACK.titulo,
    latitude: params?.latitude ?? OBJETO_FALLBACK.latitude,
    longitude: params?.longitude ?? OBJETO_FALLBACK.longitude,
    raio_geofencing_metros: params?.raio_geofencing_metros ?? OBJETO_FALLBACK.raio_geofencing_metros,
  };

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{
    dentro: boolean;
    distancia: number;
    vistoriaId?: string;
  } | null>(null);

  const handleCheckin = async () => {
    setLoading(true);
    try {
      // Obter localização
      const pos = await obterLocalizacao();
      const distancia = calcularDistancia(
        pos.latitude, pos.longitude,
        objeto.latitude, objeto.longitude,
      );
      const dentro = distancia <= objeto.raio_geofencing_metros;

      // Verificar conectividade
      const netState = await NetInfo.fetch();
      const online = netState.isConnected && netState.isInternetReachable;

      let vistoriaId: string | undefined;

      if (online) {
        const { data } = await vistoriaAPI.checkin({
          objeto_id: objeto.id,
          latitude: pos.latitude,
          longitude: pos.longitude,
        });
        vistoriaId = data.id;
      } else {
        // Salvar offline
        const id = `offline-${Date.now()}`;
        await salvarCheckinOffline({
          id,
          objeto_id: objeto.id,
          latitude: pos.latitude,
          longitude: pos.longitude,
        });
        vistoriaId = id;
        Alert.alert('Modo Offline', 'Check-in salvo. Será sincronizado quando a conexão retornar.');
      }

      setResultado({ dentro, distancia, vistoriaId });
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível realizar o check-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinuar = () => {
    if (resultado?.vistoriaId) {
      navigation?.navigate('Checklist', { vistoriaId: resultado.vistoriaId });
    }
  };

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: objeto.latitude,
          longitude: objeto.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <Marker
          coordinate={{ latitude: objeto.latitude, longitude: objeto.longitude }}
          title={objeto.titulo}
          pinColor="#15803d"
        />
        <Circle
          center={{ latitude: objeto.latitude, longitude: objeto.longitude }}
          radius={objeto.raio_geofencing_metros}
          strokeColor="#15803d"
          fillColor="rgba(21,128,61,0.12)"
          strokeWidth={2}
        />
      </MapView>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <Text style={styles.objetoTitle}>{objeto.titulo}</Text>
        <Text style={styles.objetoSub}>Raio permitido: {objeto.raio_geofencing_metros}m</Text>

        {resultado ? (
          <View style={[styles.resultBox, resultado.dentro ? styles.resultOk : styles.resultWarn]}>
            <Text style={[styles.resultText, { color: resultado.dentro ? '#15803d' : '#b45309' }]}>
              {resultado.dentro ? '✓ Dentro do raio do objeto' : '⚠ Fora do raio do objeto'}
            </Text>
            <Text style={styles.distText}>
              Distância: {resultado.distancia.toFixed(0)}m
            </Text>
            {!resultado.dentro && (
              <Text style={styles.distText}>
                Registrado com flag de "fora do raio"
              </Text>
            )}
          </View>
        ) : null}

        {!resultado ? (
          <TouchableOpacity style={styles.btnPrimary} onPress={handleCheckin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.btnText}>📍 Fazer Check-in</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnPrimary} onPress={handleContinuar}>
            <Text style={styles.btnText}>Ir para Checklist →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  map: { flex: 1 },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
    gap: 12,
  },
  objetoTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  objetoSub: { fontSize: 13, color: '#64748b' },
  resultBox: { borderRadius: 12, padding: 14, gap: 4 },
  resultOk: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  resultWarn: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
  resultText: { fontSize: 15, fontWeight: '700' },
  distText: { fontSize: 13, color: '#64748b' },
  btnPrimary: {
    backgroundColor: '#15803d',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
