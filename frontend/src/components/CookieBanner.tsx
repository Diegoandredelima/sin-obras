import { useState, useEffect } from "react";
import { Cookie, Shield, X } from "lucide-react";

const CONSENT_KEY = "sinobras-cookie-consent";

type Consent = "accepted" | "rejected" | null;

function getStoredConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "accepted" || v === "rejected") return v;
  } catch {
    // ignore
  }
  return null;
}

function storeConsent(consent: Consent) {
  try {
    if (consent) localStorage.setItem(CONSENT_KEY, consent);
  } catch {
    // ignore
  }
}

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (getStoredConsent() === null) {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    storeConsent("accepted");
    setVisible(false);
    setDismissed(true);
  };

  const reject = () => {
    storeConsent("rejected");
    setVisible(false);
    setDismissed(true);
  };

  if (!visible || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 flex justify-center animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <Cookie className="h-3.5 w-3.5 text-amber-500" />
              Este site utiliza cookies
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Utilizamos cookies essenciais para o funcionamento do sistema e cookies de
              análise para melhorar sua experiência. Nenhum dado pessoal é compartilhado
              com terceiros. Veja nossa{" "}
              <a href="/privacidade" className="underline text-brand-600 hover:text-brand-700 font-medium">
                Política de Privacidade
              </a>
              .
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={reject}
            className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Rejeitar
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-200 transition-all"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
