import { useState, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import { Camera, Pencil, X, Shield, Mail, User, Briefcase, Hash, Phone } from "lucide-react";

const FOTO_KEY = "sinobras-user-photo";

function getStoredPhoto(): string | null {
  try {
    return localStorage.getItem(FOTO_KEY);
  } catch {
    return null;
  }
}

function storePhoto(dataUrl: string) {
  try {
    localStorage.setItem(FOTO_KEY, dataUrl);
  } catch {
    // ignore
  }
}

interface PerfilModalProps {
  open: boolean;
  onClose: () => void;
}

const PerfilModal = ({ open, onClose }: PerfilModalProps) => {
  const { user } = useAuthStore();
  const [foto, setFoto] = useState<string | null>(getStoredPhoto);
  const [editando, setEditando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open || !user) return null;

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setFoto(dataUrl);
      storePhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-brand-600 to-brand-800 h-20" />

        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="relative group shrink-0">
              <div className="h-20 w-20 rounded-2xl bg-white shadow-lg ring-4 ring-white overflow-hidden flex items-center justify-center">
                {foto ? (
                  <img src={foto} alt="Foto" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-brand-700 select-none">
                    {user.nome.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                title="Alterar foto"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFotoChange}
              />
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <h2 className="text-lg font-bold text-slate-800 truncate">{user.nome}</h2>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
            </div>

            <div className="flex gap-1 pb-1 shrink-0">
              <button
                onClick={() => setEditando(!editando)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                {editando ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <InfoField icon={User} label="Nome completo" value={user.nome} editando={editando} />
            <InfoField icon={Mail} label="E-mail" value={user.email} editando={editando} />
            <InfoField icon={Hash} label="Matrícula / CNPJ" value={user.matricula_cnpj} editando={false} lock />
            <InfoField icon={Briefcase} label="Cargo" value={user.cargo || "—"} editando={editando} />
            <InfoField icon={Phone} label="Telefone" value={(user as any).telefone || "—"} editando={editando} />
            <InfoField icon={Shield} label="Tipo de usuário" value={user.tipo} editando={false} lock />
          </div>

          {editando && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setEditando(false)}
                className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700 transition-colors"
              >
                Salvar alterações
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface InfoFieldProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  editando: boolean;
  lock?: boolean;
}

const InfoField = ({ icon: Icon, label, value, editando, lock }: InfoFieldProps) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5">
    <Icon className="h-4 w-4 text-slate-400 shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      {editando && !lock ? (
        <input
          defaultValue={value === "—" ? "" : value}
          className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none border-b border-brand-300 focus:border-brand-500 py-0.5"
        />
      ) : (
        <p className="text-sm font-medium text-slate-700 truncate">
          {lock ? <span className="inline-flex items-center gap-1">{value} <span className="text-[10px] text-slate-400">🔒</span></span> : value}
        </p>
      )}
    </div>
  </div>
);

export default PerfilModal;
