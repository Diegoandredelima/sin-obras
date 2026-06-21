import { useState } from "react";
import { X, Ruler, Repeat, Percent, TrendingUp } from "lucide-react";

type Tab = "cubicagem" | "conversao" | "bdi" | "incc";

const TABS: { id: Tab; label: string; icon: typeof Ruler }[] = [
  { id: "cubicagem", label: "Cubicagem", icon: Ruler },
  { id: "conversao", label: "Conversões", icon: Repeat },
  { id: "bdi", label: "BDI", icon: Percent },
  { id: "incc", label: "INCC", icon: TrendingUp },
];

const FORMATAS = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CubicagemTab = () => {
  const [tipo, setTipo] = useState("viga");
  const [dim1, setDim1] = useState("");
  const [dim2, setDim2] = useState("");
  const [dim3, setDim3] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const labels: Record<string, [string, string, string]> = {
    viga: ["Largura (m)", "Altura (m)", "Comprimento (m)"],
    laje: ["Largura (m)", "Comprimento (m)", "Espessura (m)"],
    pilar: ["Lado A (m)", "Lado B (m)", "Altura (m)"],
  };

  const calc = () => {
    const a = parseFloat(dim1) || 0;
    const b = parseFloat(dim2) || 0;
    const c = parseFloat(dim3) || 0;
    setResult(a * b * c);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600">Tipo de estrutura</label>
        <select value={tipo} onChange={(e) => { setTipo(e.target.value); setResult(null); }}
          className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm focus:border-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-700/10">
          <option value="viga">Viga</option>
          <option value="laje">Laje</option>
          <option value="pilar">Pilar</option>
        </select>
      </div>
      {labels[tipo].map((label, i) => (
        <div key={i} className="space-y-1">
          <label className="text-xs text-slate-500">{label}</label>
          <input type="number" step="0.01" value={[dim1, dim2, dim3][i]}
            onChange={(e) => { [setDim1, setDim2, setDim3][i](e.target.value); setResult(null); }}
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-sm focus:border-brand-700 focus:outline-none" />
        </div>
      ))}
      <button onClick={calc}
        className="w-full py-2 bg-brand-700 text-white text-sm font-semibold rounded-xl hover:bg-brand-500 transition-all">
        Calcular Volume
      </button>
      {result !== null && (
        <div className="rounded-xl bg-brand-50 border border-brand-200 p-3 text-center">
          <p className="text-xs text-brand-700 font-semibold uppercase">Volume</p>
          <p className="text-xl font-bold text-brand-900">{FORMATAS(result)} m³</p>
        </div>
      )}
    </div>
  );
};

const ConversaoTab = () => {
  const UNITS = [
    { value: "m2", label: "m²" },
    { value: "m3", label: "m³" },
    { value: "ton", label: "ton" },
    { value: "kg", label: "kg" },
    { value: "km", label: "km" },
    { value: "m", label: "m" },
    { value: "cm", label: "cm" },
    { value: "ha", label: "hectare" },
  ];

  const FACTORS: Record<string, Record<string, number>> = {
    m2: { ha: 0.0001 },
    m3: { ton: 1 },
    ton: { kg: 1000, m3: 1 },
    kg: { ton: 0.001 },
    km: { m: 1000, cm: 100000 },
    m: { km: 0.001, cm: 100 },
    cm: { m: 0.01 },
    ha: { m2: 10000 },
  };

  const [from, setFrom] = useState("m2");
  const [to, setTo] = useState("ha");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const calc = () => {
    const v = parseFloat(value) || 0;
    if (from === to) { setResult(v); return; }
    const factor = FACTORS[from]?.[to] || (FACTORS[to]?.[from] ? 1 / FACTORS[to][from] : null);
    if (factor !== null) { setResult(v * factor); } else { setResult(null); }
  };

  const convertLabel = (v: string) => UNITS.find((u) => u.value === v)?.label || v;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs text-slate-500">Converter de</label>
        <select value={from} onChange={(e) => setFrom(e.target.value)}
          className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-sm focus:border-brand-700 focus:outline-none">
          {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-500">Para</label>
        <select value={to} onChange={(e) => setTo(e.target.value)}
          className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-sm focus:border-brand-700 focus:outline-none">
          {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-500">Valor</label>
        <input type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)}
          className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-sm focus:border-brand-700 focus:outline-none" />
      </div>
      <button onClick={calc}
        className="w-full py-2 bg-sky-600 text-white text-sm font-semibold rounded-xl hover:bg-sky-500 transition-all">
        Converter
      </button>
      {result !== null && (
        <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 text-center">
          <p className="text-xs text-sky-600 font-semibold uppercase">Resultado</p>
          <p className="text-xl font-bold text-sky-800">{FORMATAS(result)} {convertLabel(to)}</p>
        </div>
      )}
    </div>
  );
};

const BDITab = () => {
  const [custoDireto, setCustoDireto] = useState("");
  const [adm, setAdm] = useState("15");
  const [lucro, setLucro] = useState("8");
  const [impostos, setImpostos] = useState("7");
  const [result, setResult] = useState<number | null>(null);
  const [precoFinal, setPrecoFinal] = useState<number | null>(null);

  const calc = () => {
    const cd = parseFloat(custoDireto) || 0;
    const a = (parseFloat(adm) || 0) / 100;
    const l = (parseFloat(lucro) || 0) / 100;
    const i = (parseFloat(impostos) || 0) / 100;
    const bdi = ((1 + a) * (1 + l) * (1 + i) - 1) * 100;
    const pf = cd * (1 + bdi / 100);
    setResult(bdi);
    setPrecoFinal(pf);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs text-slate-500">Custo Direto (R$)</label>
        <input type="number" step="0.01" value={custoDireto} onChange={(e) => setCustoDireto(e.target.value)}
          className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-sm focus:border-brand-700 focus:outline-none" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">ADM (%)</label>
          <input type="number" step="0.1" value={adm} onChange={(e) => setAdm(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-sm focus:border-brand-700 focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Lucro (%)</label>
          <input type="number" step="0.1" value={lucro} onChange={(e) => setLucro(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-sm focus:border-brand-700 focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Impostos (%)</label>
          <input type="number" step="0.1" value={impostos} onChange={(e) => setImpostos(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-sm focus:border-brand-700 focus:outline-none" />
        </div>
      </div>
      <button onClick={calc}
        className="w-full py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-500 transition-all">
        Calcular BDI
      </button>
      {result !== null && (
        <div className="space-y-2">
          <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 text-center">
            <p className="text-xs text-purple-600 font-semibold uppercase">BDI</p>
            <p className="text-xl font-bold text-purple-800">{result.toFixed(2)}%</p>
          </div>
          <div className="rounded-xl bg-brand-50 border border-brand-200 p-3 text-center">
            <p className="text-xs text-brand-700 font-semibold uppercase">Preço Final</p>
            <p className="text-xl font-bold text-brand-900">R$ {FORMATAS(precoFinal!)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const INCCTab = () => {
  const [valorInicial, setValorInicial] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [indiceMensal, setIndiceMensal] = useState("0.5");
  const [result, setResult] = useState<number | null>(null);

  const calc = () => {
    const vi = parseFloat(valorInicial) || 0;
    const d1 = new Date(dataInicio + "T00:00:00");
    const d2 = new Date(dataFim + "T00:00:00");
    const meses = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    if (meses <= 0) { setResult(null); return; }
    const taxa = (parseFloat(indiceMensal) || 0) / 100;
    const reajustado = vi * Math.pow(1 + taxa, meses);
    setResult(reajustado);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs text-slate-500">Valor Inicial (R$)</label>
        <input type="number" step="0.01" value={valorInicial} onChange={(e) => setValorInicial(e.target.value)}
          className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-sm focus:border-brand-700 focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Data início</label>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-sm focus:border-brand-700 focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Data fim</label>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-sm focus:border-brand-700 focus:outline-none" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-slate-500">INCC mensal estimado (%)</label>
        <input type="number" step="0.01" value={indiceMensal} onChange={(e) => setIndiceMensal(e.target.value)}
          className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-sm focus:border-brand-700 focus:outline-none" />
      </div>
      <button onClick={calc}
        className="w-full py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-500 transition-all">
        Calcular Reajuste
      </button>
      {result !== null && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
          <p className="text-xs text-amber-600 font-semibold uppercase">Valor Reajustado</p>
          <p className="text-xl font-bold text-amber-800">R$ {FORMATAS(result)}</p>
        </div>
      )}
    </div>
  );
};

export const CalculadoraDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<Tab>("cubicagem");

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <Ruler className="h-4 w-4 text-brand-700" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Calculadora</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "text-brand-700 border-brand-700 bg-brand-50/50"
                    : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "cubicagem" && <CubicagemTab />}
          {activeTab === "conversao" && <ConversaoTab />}
          {activeTab === "bdi" && <BDITab />}
          {activeTab === "incc" && <INCCTab />}
        </div>
      </div>
    </>
  );
};
