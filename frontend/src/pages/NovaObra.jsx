/**
 * NovaObra.jsx — Formulário Multi-Step de Cadastro de Obra
 *
 * Divide o cadastro em 3 etapas para reduzir a carga cognitiva do usuário:
 *   Etapa 0 — Dados Gerais: título, descrição, município
 *   Etapa 1 — Localização:  endereço, lat/lng, raio de geofencing
 *   Etapa 2 — Contrato:     valor, datas de início e conclusão
 *
 * Ao submeter a última etapa, envia POST /obras para a API.
 * Em caso de sucesso, redireciona para /obras.
 *
 * Componentes internos:
 *   - ObraFormField: input genérico com label e estilo padrão
 *
 * TODO Bloco 2: buscar lista de contratos existentes da API para o campo
 *   contrato_id (atualmente oculto no form, precisa de um <select> dinâmico).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Calendar, DollarSign, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

// Nomes de cada etapa — usados no indicador visual de progresso
const steps = ['Dados Gerais', 'Localização', 'Contrato'];

/**
 * ObraFormField — Campo de formulário padronizado
 * Evita repetir a mesma estrutura label + input em cada etapa do wizard.
 *
 * @param {string} label      - Texto do label
 * @param {string} id         - id do input (para htmlFor do label)
 * @param {string} type       - Tipo do input (default: 'text')
 * @param {string} value      - Valor controlado (estado React)
 * @param {Function} onChange - Handler de mudança
 * @param {string} placeholder
 * @param {boolean} required  - Se verdadeiro, exibe asterisco vermelho
 */
const ObraFormField = ({ label, id, type = 'text', value, onChange, placeholder, required }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-slate-700">{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>
    <input
      id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
      className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
    />
  </div>
);

const NovaObra = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    titulo: '', descricao: '', municipio: '', endereco: '',
    latitude: '', longitude: '', raio_geofencing_metros: '200',
    valor_contrato: '', data_inicio: '', data_fim_prevista: '',
    contrato_id: '',
  });

  // `update` é um curried handler: update('titulo') retorna (e) => setForm({...})
  // Evita criar uma função separada para cada campo do formulário.
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Se não estiver na última etapa, apenas avança para a próxima
    if (step < steps.length - 1) { setStep(step + 1); return; }
    setLoading(true); setError('');
    try {
      // Converte campos numéricos (vindos como string do input) para Number
      await api.post('/obras', {
        ...form,
        latitude:                form.latitude  ? Number(form.latitude)  : null,
        longitude:               form.longitude ? Number(form.longitude) : null,
        raio_geofencing_metros:  Number(form.raio_geofencing_metros),
        valor_contrato:          Number(form.valor_contrato),
      });
      navigate('/obras');   // Redireciona para a listagem após sucesso
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao cadastrar a obra.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/obras')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {step > 0 ? 'Etapa anterior' : 'Voltar para obras'}
      </button>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Cadastrar Nova Obra</h2>
        <p className="text-sm text-slate-400 mt-0.5">Preencha os dados em {steps.length} etapas</p>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col gap-1.5">
            <div className={`h-1.5 rounded-full transition-all ${i <= step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <span className={`text-xs font-medium ${i === step ? 'text-emerald-600' : i < step ? 'text-slate-500' : 'text-slate-300'}`}>
              {i + 1}. {s}
            </span>
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          {step === 0 && <Building2 className="h-5 w-5 text-emerald-600" />}
          {step === 1 && <MapPin className="h-5 w-5 text-emerald-600" />}
          {step === 2 && <DollarSign className="h-5 w-5 text-emerald-600" />}
          <h3 className="text-base font-semibold text-slate-900">{steps[step]}</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm font-medium text-rose-600">{error}</div>
          )}

          {step === 0 && (
            <>
              <ObraFormField label="Título da Obra" id="titulo" value={form.titulo} onChange={update('titulo')} placeholder="Ex: Construção do CRAS Cidade Nova" required />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Descrição</label>
                <textarea rows={3} value={form.descricao} onChange={update('descricao')} placeholder="Descreva o escopo da obra..."
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none"
                />
              </div>
              <ObraFormField label="Município" id="municipio" value={form.municipio} onChange={update('municipio')} placeholder="Ex: Natal" required />
            </>
          )}

          {step === 1 && (
            <>
              <ObraFormField label="Endereço Completo" id="endereco" value={form.endereco} onChange={update('endereco')} placeholder="Rua, número, bairro" />
              <div className="grid grid-cols-2 gap-4">
                <ObraFormField label="Latitude" id="latitude" type="number" value={form.latitude} onChange={update('latitude')} placeholder="-5.7945" />
                <ObraFormField label="Longitude" id="longitude" type="number" value={form.longitude} onChange={update('longitude')} placeholder="-35.2110" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Raio de Geofencing (metros)</label>
                <input type="number" min="50" max="2000" value={form.raio_geofencing_metros} onChange={update('raio_geofencing_metros')}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
                <p className="text-xs text-slate-400">Raio máximo para check-in dos fiscais (padrão: 200m)</p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Valor do Contrato (R$) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">R$</span>
                  <input type="number" step="0.01" required value={form.valor_contrato} onChange={update('valor_contrato')} placeholder="0,00"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ObraFormField label="Data de Início" id="data_inicio" type="date" value={form.data_inicio} onChange={update('data_inicio')} />
                <ObraFormField label="Data de Conclusão Prevista" id="data_fim_prevista" type="date" value={form.data_fim_prevista} onChange={update('data_fim_prevista')} />
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit" disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-200 hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-70 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                step < steps.length - 1 ? 'Próxima Etapa →' : (
                  <><CheckCircle2 className="h-4 w-4" /> Cadastrar Obra</>
                )
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovaObra;
