/**
 * PendenciaScreen.tsx — Registro de Pendência / Não Conformidade (RF17)
 *
 * O fiscal registra uma pendência vinculada à vistoria, com gravidade e prazo
 * sugerido. Ao enviar, o backend notifica a empresa e o apoio.
 */
import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { vistoriaAPI } from '../../services/api';

const GRAVIDADES = ['LEVE', 'GRAVE', 'CRITICO'] as const;

export default function PendenciaScreen({ navigation, route }: any) {
  const vistoriaId = route?.params?.vistoriaId;
  const [descricao, setDescricao] = useState('');
  const [gravidade, setGravidade] = useState<(typeof GRAVIDADES)[number]>('GRAVE');
  const [prazo, setPrazo] = useState('');
  const [salvando, setSalvando] = useState(false);

  const enviar = async () => {
    if (!descricao.trim()) { Alert.alert('Atenção', 'Descreva a pendência.'); return; }
    if (!vistoriaId) { Alert.alert('Erro', 'Vistoria não identificada.'); return; }
    setSalvando(true);
    try {
      await vistoriaAPI.registrarPendencia(vistoriaId, {
        descricao,
        gravidade,
        prazo_dias: prazo ? Number(prazo) : null,
      });
      Alert.alert('Pronto', 'Pendência registrada. Empresa e apoio foram notificados.');
      navigation?.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar a pendência.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Descrição da pendência</Text>
      <TextInput value={descricao} onChangeText={setDescricao} multiline
        placeholder="Ex.: Ausência de guarda-corpo no trecho das vigas"
        style={[styles.input, styles.textarea]} />

      <Text style={styles.label}>Gravidade</Text>
      <View style={styles.row}>
        {GRAVIDADES.map((g) => (
          <TouchableOpacity key={g} onPress={() => setGravidade(g)}
            style={[styles.chip, gravidade === g && styles.chipAtivo]}>
            <Text style={[styles.chipText, gravidade === g && styles.chipTextAtivo]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Prazo sugerido (dias)</Text>
      <TextInput value={prazo} onChangeText={setPrazo} keyboardType="numeric"
        placeholder="Ex.: 7" style={styles.input} />

      <TouchableOpacity style={styles.btn} onPress={enviar} disabled={salvando}>
        {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Registrar e Notificar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16, gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginTop: 12 },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, fontSize: 14 },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#fff' },
  chipAtivo: { backgroundColor: '#15803d', borderColor: '#15803d' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  chipTextAtivo: { color: '#fff' },
  btn: { marginTop: 20, backgroundColor: '#15803d', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
