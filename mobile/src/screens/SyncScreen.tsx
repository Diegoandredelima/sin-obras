import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getPendentes, marcarSincronizado } from '../../db/offline';
import { vistoriaAPI, empresaAPI } from '../../services/api';
import { uploadFotoVistoria } from '../../services/camera';

interface PendingItem {
  id: string;
  tipo: 'checkin' | 'foto' | 'checklist' | 'finalizacao';
  descricao: string;
  raw: any;
}

export default function SyncScreen() {
  const [pendentes, setPendentes] = useState<PendingItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    carregarPendentes();
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      setOnline(!!state.isConnected && !!state.isInternetReachable);
    });
    return unsubscribe;
  }, []);

  const carregarPendentes = async () => {
    const { checkins, fotos, checklists, finalizacoes } = await getPendentes();
    const items: PendingItem[] = [
      ...checkins.map((c: any) => ({ id: c.id, tipo: 'checkin' as const, descricao: `Check-in na obra ${c.obra_id.slice(0, 8)}`, raw: c })),
      ...fotos.map((f: any) => ({ id: f.id, tipo: 'foto' as const, descricao: `Foto para vistoria ${f.vistoria_id.slice(0, 8)}`, raw: f })),
      ...checklists.map((c: any) => ({ id: c.id, tipo: 'checklist' as const, descricao: `Checklist item ${c.item_id.slice(0, 8)}`, raw: c })),
      ...finalizacoes.map((f: any) => ({ id: f.id, tipo: 'finalizacao' as const, descricao: `Finalização vistoria ${f.vistoria_id.slice(0, 8)}`, raw: f })),
    ];
    setPendentes(items);
  };

  const sincronizarTudo = async () => {
    if (!online) {
      Alert.alert('Sem conexão', 'Aguarde a conexão ser restaurada para sincronizar.');
      return;
    }
    setSyncing(true);
    let erros = 0;

    for (const item of pendentes) {
      try {
        if (item.tipo === 'checkin') {
          await vistoriaAPI.checkin({
            obra_id: item.raw.obra_id,
            medicao_id: item.raw.medicao_id,
            latitude: item.raw.latitude,
            longitude: item.raw.longitude,
          });
        } else if (item.tipo === 'checklist') {
          await vistoriaAPI.updateChecklistItem(item.raw.item_id, { atestado: !!item.raw.atestado, observacao: item.raw.observacao });
        } else if (item.tipo === 'finalizacao') {
          await vistoriaAPI.finalizar(item.raw.vistoria_id, { resultado: item.raw.resultado, observacoes: item.raw.observacoes });
        } else if (item.tipo === 'foto') {
          const foto = {
            uri: item.raw.uri,
            latitude: item.raw.latitude,
            longitude: item.raw.longitude,
            timestampServidor: item.raw.timestamp_servidor,
            hashLocal: item.raw.hash_local,
          };
          await uploadFotoVistoria(item.raw.vistoria_id, foto, item.raw.checklist_item_id);
        }

        const tabelaMap = { checkin: 'pending_checkins', foto: 'pending_fotos', checklist: 'pending_checklist_updates', finalizacao: 'pending_finalizacoes' };
        await marcarSincronizado(tabelaMap[item.tipo], item.id);
      } catch {
        erros++;
      }
    }

    setSyncing(false);
    await carregarPendentes();
    if (erros === 0) {
      Alert.alert('✓ Sincronizado', 'Todos os dados foram enviados com sucesso!');
    } else {
      Alert.alert('Parcialmente sincronizado', `${erros} itens falharam. Tente novamente.`);
    }
  };

  const TIPO_CONFIG = {
    checkin: { emoji: '📍', color: '#0369a1' },
    foto: { emoji: '📷', color: '#7c3aed' },
    checklist: { emoji: '✅', color: '#15803d' },
    finalizacao: { emoji: '🏁', color: '#b45309' },
  };

  return (
    <View style={styles.container}>
      {/* Status de conectividade */}
      <View style={[styles.statusBar, online ? styles.statusOnline : styles.statusOffline]}>
        <Text style={styles.statusText}>
          {online ? '🟢 Conectado — pronto para sincronizar' : '🔴 Sem conexão — dados salvos localmente'}
        </Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Sincronização</Text>
        <Text style={styles.subtitle}>{pendentes.length} item(s) pendente(s)</Text>
      </View>

      <FlatList
        data={pendentes}
        keyExtractor={(i: PendingItem) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✓</Text>
            <Text style={styles.emptyTitle}>Tudo sincronizado!</Text>
            <Text style={styles.emptyDesc}>Não há dados pendentes de envio.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = TIPO_CONFIG[item.tipo as keyof typeof TIPO_CONFIG];
          return (
            <View style={styles.card}>
              <Text style={styles.cardEmoji}>{cfg.emoji}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>{item.descricao}</Text>
                <Text style={[styles.cardTipo, { color: cfg.color }]}>{item.tipo.toUpperCase()}</Text>
              </View>
            </View>
          );
        }}
      />

      {pendentes.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.syncBtn, (!online || syncing) && styles.syncBtnDisabled]}
            onPress={sincronizarTudo}
            disabled={!online || syncing}
          >
            {syncing ? (
              <><ActivityIndicator color="#fff" size="small" /><Text style={styles.syncText}> Sincronizando...</Text></>
            ) : (
              <Text style={styles.syncText}>↑ Sincronizar Agora</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  statusBar: { paddingVertical: 10, paddingHorizontal: 16 },
  statusOnline: { backgroundColor: '#f0fdf4' },
  statusOffline: { backgroundColor: '#fef2f2' },
  statusText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  header: { padding: 24, gap: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b' },
  list: { padding: 16, gap: 10 },
  empty: { padding: 40, alignItems: 'center', gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155' },
  emptyDesc: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
  card: {
    flexDirection: 'row', gap: 14, backgroundColor: '#fff',
    borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  cardEmoji: { fontSize: 24 },
  cardInfo: { flex: 1, gap: 2 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  cardTipo: { fontSize: 11, fontWeight: '700' },
  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  syncBtn: {
    backgroundColor: '#15803d', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#15803d', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  syncBtnDisabled: { backgroundColor: '#94a3b8' },
  syncText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
