/**
 * ObrasFiscalScreen.tsx — Lista de Obras do Fiscal
 *
 * Substitui o OBJETO_MOCK das telas de Check-in e Medição: carrega da API as obras
 * sob responsabilidade do fiscal logado (`GET /api/objetos`, já recortado ao escopo
 * do usuário no backend) e permite escolher a obra e a ação (Check-in ou Medição),
 * passando o objeto selecionado por `navigation params`.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, FlatList, RefreshControl,
} from 'react-native';
import { objetosAPI } from '../../services/api';

export interface ObjetoFiscal {
  id: string;
  titulo: string;
  municipio?: string | null;
  status?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  raio_geofencing_metros?: number | null;
}

export default function ObrasFiscalScreen({ navigation }: any) {
  const [objetos, setObjetos] = useState<ObjetoFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const { data } = await objetosAPI.list();
      // Endpoint devolve PaginatedResponse { items, total, ... }
      const items: ObjetoFiscal[] = Array.isArray(data) ? data : data.items ?? [];
      setObjetos(items);
    } catch {
      setErro('Não foi possível carregar suas obras.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const renderItem = ({ item }: { item: ObjetoFiscal }) => {
    const semCoord = item.latitude == null || item.longitude == null;
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.titulo}</Text>
        <Text style={styles.cardSub}>
          {item.municipio || 'Município não informado'}
          {item.status ? `  ·  ${item.status}` : ''}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, semCoord && styles.btnDisabled]}
            disabled={semCoord}
            onPress={() => navigation.navigate('Checkin', { objeto: item })}
          >
            <Text style={styles.btnText}>📍 Check-in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnAlt]}
            onPress={() => navigation.navigate('Medicao', { objeto: item })}
          >
            <Text style={styles.btnTextAlt}>📋 Medição</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnAlt]}
            onPress={() => navigation.navigate('Historico', { objeto: item })}
          >
            <Text style={styles.btnTextAlt}>🕓 Histórico</Text>
          </TouchableOpacity>
        </View>
        {semCoord && (
          <Text style={styles.aviso}>⚠ Sem coordenadas cadastradas — check-in indisponível.</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#15803d" size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={objetos}
      keyExtractor={(o) => o.id}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={carregar} />}
      ListEmptyComponent={
        <Text style={styles.vazio}>
          {erro || 'Nenhuma obra sob sua responsabilidade.'}
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 13, color: '#64748b' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: {
    flex: 1, backgroundColor: '#15803d', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  btnAlt: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#15803d' },
  btnDisabled: { backgroundColor: '#cbd5e1' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnTextAlt: { color: '#15803d', fontSize: 14, fontWeight: '700' },
  aviso: { fontSize: 12, color: '#b45309' },
  vazio: { textAlign: 'center', color: '#94a3b8', marginTop: 48, fontSize: 15 },
});
