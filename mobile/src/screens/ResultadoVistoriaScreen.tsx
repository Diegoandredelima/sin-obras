/**
 * ResultadoVistoriaScreen.tsx — Tela de Finalização de Vistoria
 *
 * Etapa conclusiva onde o fiscal avalia o estado geral da medição como "Conforme"
 * ou "Não Conforme" (RN02).
 *
 * Características:
 *   - Cartões de seleção intuitivos e com contraste visual para escolha de conformidade.
 *   - Campo de justificativa (obrigatório se o resultado for classificado como "Não Conforme").
 *   - Assinatura lógica e encerramento da vistoria enviando os dados finais para a API
 *     POST `/api/vistorias/{id}/finalizar` ou registrando localmente no fluxo offline.
 */
import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { vistoriaAPI } from '../../services/api';

interface ResultadoVistoriaProps {
  route: { params: { vistoriaId: string } };
  navigation: any;
}

type Resultado = 'CONFORME' | 'NAO_CONFORME';

export default function ResultadoVistoriaScreen({ route, navigation }: ResultadoVistoriaProps) {
  const { vistoriaId } = route.params;
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFinalizar = async () => {
    if (!resultado) {
      Alert.alert('Atenção', 'Selecione o resultado da vistoria.');
      return;
    }
    if (resultado === 'NAO_CONFORME' && !observacoes.trim()) {
      Alert.alert('Atenção', 'Observações são obrigatórias para "Não Conforme".');
      return;
    }

    setLoading(true);
    try {
      await vistoriaAPI.finalizar(vistoriaId, { resultado, observacoes: observacoes || undefined });
      Alert.alert(
        '✓ Vistoria Finalizada',
        `A vistoria foi registrada como "${resultado === 'CONFORME' ? 'Conforme' : 'Não Conforme'}".`,
        [{ text: 'OK', onPress: () => navigation?.navigate('Home') }]
      );
    } catch (e: any) {
      Alert.alert('Erro', e.response?.data?.detail || 'Não foi possível finalizar a vistoria.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Resultado da Vistoria</Text>
      <Text style={styles.subtitle}>
        Registre o resultado final após concluir o checklist e as fotografias.
      </Text>

      {/* Seleção de resultado */}
      <View style={styles.resultContainer}>
        <TouchableOpacity
          style={[styles.resultCard, resultado === 'CONFORME' && styles.resultCardOk]}
          onPress={() => setResultado('CONFORME')}
        >
          <Text style={styles.resultEmoji}>✅</Text>
          <Text style={[styles.resultLabel, resultado === 'CONFORME' && { color: '#15803d' }]}>
            Conforme
          </Text>
          <Text style={styles.resultDesc}>A objeto está de acordo com o declarado na medição.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resultCard, resultado === 'NAO_CONFORME' && styles.resultCardWarn]}
          onPress={() => setResultado('NAO_CONFORME')}
        >
          <Text style={styles.resultEmoji}>❌</Text>
          <Text style={[styles.resultLabel, resultado === 'NAO_CONFORME' && { color: '#b91c1c' }]}>
            Não Conforme
          </Text>
          <Text style={styles.resultDesc}>Foram encontradas divergências. Justificativa obrigatória.</Text>
        </TouchableOpacity>
      </View>

      {/* Observações */}
      <View style={styles.obsContainer}>
        <Text style={styles.obsLabel}>
          Observações{resultado === 'NAO_CONFORME' && <Text style={{ color: '#b91c1c' }}> *</Text>}
        </Text>
        <TextInput
          style={styles.obsInput}
          multiline
          numberOfLines={5}
          placeholder="Descreva as conformidades ou não conformidades encontradas..."
          value={observacoes}
          onChangeText={setObservacoes}
          textAlignVertical="top"
        />
      </View>

      {/* Info de auditoria */}
      <View style={styles.auditBox}>
        <Text style={styles.auditText}>
          🔒 Esta ação será registrada com timestamp do servidor, ID do fiscal e vistoria #{vistoriaId.slice(0, 8)}
        </Text>
      </View>

      {/* Botão */}
      <TouchableOpacity
        style={[styles.btn, !resultado && styles.btnDisabled]}
        onPress={handleFinalizar}
        disabled={!resultado || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>✓ Assinar e Finalizar Vistoria</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
    gap: 20,
    backgroundColor: '#f8fafc',
    flexGrow: 1,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  resultContainer: { flexDirection: 'row', gap: 12 },
  resultCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    padding: 16, gap: 6, borderWidth: 2, borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  resultCardOk: { borderColor: '#15803d', backgroundColor: '#f0fdf4' },
  resultCardWarn: { borderColor: '#b91c1c', backgroundColor: '#fef2f2' },
  resultEmoji: { fontSize: 28 },
  resultLabel: { fontSize: 15, fontWeight: '700', color: '#334155' },
  resultDesc: { fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 15 },
  obsContainer: { gap: 8 },
  obsLabel: { fontSize: 14, fontWeight: '600', color: '#334155' },
  obsInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 14, padding: 14, fontSize: 14, color: '#0f172a',
    minHeight: 120,
  },
  auditBox: {
    backgroundColor: '#f0f9ff', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#bae6fd',
  },
  auditText: { fontSize: 12, color: '#0369a1', lineHeight: 18 },
  btn: {
    backgroundColor: '#15803d', borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', shadowColor: '#15803d', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnDisabled: { backgroundColor: '#94a3b8' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
