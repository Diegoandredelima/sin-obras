/**
 * HistoricoScreen.tsx — Histórico da Obra (RF18)
 *
 * Linha do tempo da obra para o fiscal: vistorias anteriores, medições aprovadas
 * e pendências abertas. Recebe o objeto por navigation params.
 */
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { vistoriaAPI } from '../../services/api';

interface Historico {
  vistorias: { id: string; checkin_em: string | null; resultado: string | null; dentro_raio: boolean; observacoes: string | null }[];
  medicoes: { id: string; numero_medicao: number; valor_medido: number; criado_em: string | null }[];
  pendencias: { id: string; titulo: string; descricao: string | null; prioridade: string; resolvido: boolean; criado_em: string | null }[];
}

const fmtData = (s: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—');

export default function HistoricoScreen({ route }: any) {
  const objeto = route?.params?.objeto;
  const [data, setData] = useState<Historico | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    if (!objeto?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await vistoriaAPI.getHistorico(objeto.id);
      setData(data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#15803d" size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={carregar} />}>
      <Text style={styles.titulo}>{objeto?.titulo || 'Obra'}</Text>

      <Text style={styles.secao}>Pendências abertas</Text>
      {(data?.pendencias.filter((p) => !p.resolvido) ?? []).length === 0 && (
        <Text style={styles.vazio}>Nenhuma pendência aberta.</Text>
      )}
      {data?.pendencias.filter((p) => !p.resolvido).map((p) => (
        <View key={p.id} style={[styles.card, styles.cardPend]}>
          <Text style={styles.cardTitulo}>{p.titulo}</Text>
          {p.descricao ? <Text style={styles.cardSub}>{p.descricao}</Text> : null}
          <Text style={styles.meta}>{p.prioridade} · {fmtData(p.criado_em)}</Text>
        </View>
      ))}

      <Text style={styles.secao}>Vistorias anteriores</Text>
      {data?.vistorias.length === 0 && <Text style={styles.vazio}>Sem vistorias.</Text>}
      {data?.vistorias.map((v) => (
        <View key={v.id} style={styles.card}>
          <Text style={styles.cardTitulo}>{v.resultado || 'Em andamento'} · {fmtData(v.checkin_em)}</Text>
          <Text style={styles.meta}>{v.dentro_raio ? 'Dentro do raio' : 'Fora do raio'}</Text>
          {v.observacoes ? <Text style={styles.cardSub}>{v.observacoes}</Text> : null}
        </View>
      ))}

      <Text style={styles.secao}>Medições aprovadas</Text>
      {data?.medicoes.length === 0 && <Text style={styles.vazio}>Sem medições aprovadas.</Text>}
      {data?.medicoes.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.cardTitulo}>Medição #{m.numero_medicao}</Text>
          <Text style={styles.meta}>R$ {m.valor_medido.toLocaleString('pt-BR')} · {fmtData(m.criado_em)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  titulo: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  secao: { fontSize: 13, fontWeight: '700', color: '#64748b', marginTop: 16, textTransform: 'uppercase' },
  vazio: { fontSize: 13, color: '#94a3b8' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f1f5f9', gap: 2 },
  cardPend: { borderColor: '#fde68a', backgroundColor: '#fffbeb' },
  cardTitulo: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  cardSub: { fontSize: 13, color: '#475569' },
  meta: { fontSize: 12, color: '#94a3b8' },
});
