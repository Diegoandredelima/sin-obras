/**
 * MedicaoScreen.tsx — Medição em campo pelo Fiscal (Boletim de Medição)
 *
 * Permite ao fiscal lançar quantidades por evento do cronograma, validar cada
 * item com foto (câmera nativa — RN03) e concluir a medição, que vai direto para
 * APROVADA. Reaproveita os serviços de câmera/geofencing já existentes.
 *
 * Fluxo:
 *   1. Carrega os eventos do objeto (cronograma).
 *   2. Fiscal informa a quantidade executada por evento.
 *   3. Cria a medição (origem FISCAL) e recebe os itens com seus ids.
 *   4. Para cada item com avanço, captura e envia uma foto.
 *   5. Conclui a medição.
 */
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { medicaoAPI } from '../../services/api';
import { capturarFotoVistoria, uploadFotoMedicao } from '../../services/camera';

// Fallback usado apenas se a tela for aberta sem objeto (ex.: deep link / demo).
const OBJETO_FALLBACK = { id: '1', titulo: 'Obra (demo)' };

interface Evento {
  id: string;
  descricao: string;
  unidade: string;
  valor_unitario: string;
}

interface ItemCriado {
  id: string;
  evento_id: string;
}

export default function MedicaoScreen({ navigation, route }: any) {
  const objeto = route?.params?.objeto ?? OBJETO_FALLBACK;
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [quantidades, setQuantidades] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [medicaoId, setMedicaoId] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemCriado[]>([]);
  const [fotos, setFotos] = useState<Record<string, boolean>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await medicaoAPI.getEventos(objeto.id);
        const flat: Evento[] = [];
        for (const meta of data) {
          for (const sub of meta.submetas || []) {
            for (const ev of sub.eventos || []) flat.push(ev);
          }
        }
        setEventos(flat);
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar os eventos do objeto.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const itensValidos = eventos.filter((e) => Number(quantidades[e.id] || 0) > 0);

  const handleCriar = async () => {
    if (itensValidos.length === 0) {
      Alert.alert('Atenção', 'Informe a quantidade de ao menos um evento.');
      return;
    }
    setSalvando(true);
    try {
      const { data } = await medicaoAPI.criarFiscal(objeto.id, {
        itens: itensValidos.map((e) => ({
          evento_id: e.id,
          quantidade_periodo: Number(quantidades[e.id]),
        })),
      });
      setMedicaoId(data.id);
      setItens(data.itens || []);
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.detail || 'Falha ao criar a medição.');
    } finally {
      setSalvando(false);
    }
  };

  const handleFoto = async (itemId: string) => {
    if (!medicaoId) return;
    try {
      const foto = await capturarFotoVistoria();
      if (!foto) return;
      await uploadFotoMedicao(medicaoId, foto, itemId);
      setFotos((prev) => ({ ...prev, [itemId]: true }));
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao enviar a foto.');
    }
  };

  const todasComFoto = itens.every((it) => fotos[it.id]);

  const handleConcluir = async () => {
    if (!medicaoId) return;
    setSalvando(true);
    try {
      await medicaoAPI.concluir(medicaoId, { observacao: 'Medido em campo pelo fiscal.' });
      Alert.alert('Sucesso', 'Medição concluída e aprovada.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Erro', e?.response?.data?.detail || 'Falha ao concluir a medição.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color="#15803d" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.titulo}>{objeto.titulo}</Text>

      {!medicaoId ? (
        <>
          <Text style={styles.sub}>Informe a quantidade executada por evento:</Text>
          {eventos.length === 0 && <Text style={styles.aviso}>Nenhum evento cadastrado no cronograma.</Text>}
          {eventos.map((e) => (
            <View key={e.id} style={styles.card}>
              <Text style={styles.evDesc}>{e.descricao}</Text>
              <View style={styles.row}>
                <Text style={styles.unidade}>{e.unidade}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  value={quantidades[e.id] || ''}
                  onChangeText={(v) => setQuantidades((prev) => ({ ...prev, [e.id]: v }))}
                />
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.btn} onPress={handleCriar} disabled={salvando}>
            <Text style={styles.btnText}>{salvando ? 'Criando...' : 'Criar medição'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.sub}>Valide cada item com uma foto:</Text>
          {itens.map((it) => {
            const ev = eventos.find((e) => e.id === it.evento_id);
            return (
              <View key={it.id} style={styles.card}>
                <Text style={styles.evDesc}>{ev?.descricao || 'Item'}</Text>
                <TouchableOpacity
                  style={[styles.fotoBtn, fotos[it.id] && styles.fotoBtnOk]}
                  onPress={() => handleFoto(it.id)}
                >
                  <Text style={[styles.fotoBtnText, fotos[it.id] && styles.fotoBtnTextOk]}>
                    {fotos[it.id] ? '✓ Foto enviada' : '📷 Anexar foto'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
          <TouchableOpacity
            style={[styles.btn, !todasComFoto && styles.btnDisabled]}
            onPress={handleConcluir}
            disabled={!todasComFoto || salvando}
          >
            <Text style={styles.btnText}>{salvando ? 'Concluindo...' : 'Concluir medição'}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 14, color: '#64748b' },
  aviso: { fontSize: 13, color: '#d97706' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#f1f5f9', gap: 8 },
  evDesc: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  unidade: { fontSize: 13, color: '#94a3b8', width: 40 },
  input: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16 },
  fotoBtn: { backgroundColor: '#f1f5f9', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  fotoBtnOk: { backgroundColor: '#dcfce7' },
  fotoBtnText: { color: '#15803d', fontWeight: '700' },
  fotoBtnTextOk: { color: '#15803d' },
  btn: { backgroundColor: '#15803d', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { backgroundColor: '#94a3b8' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
