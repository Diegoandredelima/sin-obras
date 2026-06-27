/**
 * ChecklistScreen.tsx — Tela de Lista de Verificação (Checklist)
 *
 * Apresenta a relação de serviços declarados na medição atual para que o fiscal
 * ateste a conformidade de cada item individualmente em campo.
 *
 * Funcionalidades:
 *   - Carrega itens de checklist baseados nos eventos declarados na medição correspondente.
 *   - Atesta conformidade ativando/desativando interruptores de estado.
 *   - Permite capturar e vincular fotos (RN03) a cada item de serviço:
 *     - Fotos usam câmera nativa (não galeria) e gravam hashes e timestamps invioláveis.
 *   - Exibe uma barra de progresso visual de conformidade dos serviços da vistoria.
 */
import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Platform, ActivityIndicator,
} from 'react-native';
import { vistoriaAPI } from '../../services/api';
import { capturarFotoVistoria, uploadFotoVistoria } from '../../services/camera';

interface ChecklistItem {
  id: string;
  evento_id: string;
  atestado: boolean;
  observacao?: string;
}

interface ChecklistScreenProps {
  route: { params: { vistoriaId: string } };
  navigation: any;
}

export default function ChecklistScreen({ route, navigation }: ChecklistScreenProps) {
  const { vistoriaId } = route.params;
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
    try {
      const { data } = await vistoriaAPI.getChecklist(vistoriaId);
      setItems(data);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar o checklist.');
    } finally {
      setLoading(false);
    }
  };

  const handleAteste = async (item: ChecklistItem, atestado: boolean) => {
    try {
      await vistoriaAPI.updateChecklistItem(item.id, { atestado });
      setItems((prev: ChecklistItem[]) => prev.map((i: ChecklistItem) => i.id === item.id ? { ...i, atestado } : i));
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o item.');
    }
  };

  const handleFoto = async (item: ChecklistItem) => {
    setUploadingItemId(item.id);
    try {
      const foto = await capturarFotoVistoria();
      if (!foto) { setUploadingItemId(null); return; }
      await uploadFotoVistoria(vistoriaId, foto, item.id);
      Alert.alert('✓ Foto registrada', 'Foto enviada com hash SHA-256 e carimbo do servidor.');
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Erro ao enviar foto.');
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleFinalizar = () => {
    navigation?.navigate('ResultadoVistoria', { vistoriaId });
  };

  const concluidos = items.filter(i => i.atestado).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#15803d" />
        <Text style={styles.loadingText}>Carregando checklist...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header de progresso */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Checklist de Vistoria</Text>
        <Text style={styles.progressSub}>{concluidos} de {items.length} itens validados</Text>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${items.length > 0 ? (concluidos / items.length) * 100 : 0}%` }]}
          />
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i: ChecklistItem) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Nenhum item no checklist.</Text>
            <Text style={styles.emptySub}>Esta vistoria não possui medição vinculada com eventos declarados.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={[styles.card, item.atestado && styles.cardOk]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIndex}>#{index + 1}</Text>
              <Text style={styles.cardTitle} numberOfLines={2}>
                Evento {item.evento_id.slice(0, 8)}...
              </Text>
              <View style={[styles.badge, item.atestado ? styles.badgeOk : styles.badgePend]}>
                <Text style={[styles.badgeText, { color: item.atestado ? '#15803d' : '#b45309' }]}>
                  {item.atestado ? '✓ Atestado' : 'Pendente'}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, item.atestado ? styles.actionBtnActive : styles.actionBtnInactive]}
                onPress={() => handleAteste(item, !item.atestado)}
              >
                <Text style={styles.actionText}>
                  {item.atestado ? '✓ Confirmado' : 'Atestar Conformidade'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fotoBtn}
                onPress={() => handleFoto(item)}
                disabled={uploadingItemId === item.id}
              >
                {uploadingItemId === item.id ? (
                  <ActivityIndicator size="small" color="#15803d" />
                ) : (
                  <Text style={styles.fotoBtnText}>📷 Foto</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Ações finais */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.pendenciaBtn}
          onPress={() => navigation?.navigate('Pendencia', { vistoriaId })}
        >
          <Text style={styles.pendenciaText}>⚠ Registrar Pendência</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.finalizarBtn} onPress={handleFinalizar}>
          <Text style={styles.finalizarText}>Ir para Resultado →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 8 },
  loadingText: { color: '#64748b', marginTop: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#334155', textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
  progressHeader: { backgroundColor: '#fff', padding: 20, gap: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  progressTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  progressSub: { fontSize: 13, color: '#64748b' },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#15803d', borderRadius: 3 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardOk: { borderColor: '#bbf7d0' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIndex: { fontSize: 13, color: '#94a3b8', width: 24 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1e293b' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, borderWidth: 1 },
  badgeOk: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  badgePend: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnActive: { backgroundColor: '#15803d' },
  actionBtnInactive: { backgroundColor: '#f1f5f9' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  fotoBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center',
  },
  fotoBtnText: { fontSize: 13, fontWeight: '600', color: '#15803d' },
  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 10 },
  pendenciaBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  pendenciaText: { color: '#b45309', fontSize: 15, fontWeight: '700' },
  finalizarBtn: {
    backgroundColor: '#15803d', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', shadowColor: '#15803d', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  finalizarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
