import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/auth";
import { Lock, User, Loader2 } from "lucide-react";
import api from "@/services/api";
import brasaoRN from "../assets/brasao_RN.png";

const loginSchema = z.object({
  identificador: z.string().min(1, "Informe sua matrícula ou CNPJ"),
  senha: z.string().min(4, "Senha deve ter ao menos 4 caracteres"),
});

type LoginData = z.infer<typeof loginSchema>;

const Login = () => {
  const [apiError, setApiError] = useState("");
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginData) => {
    setApiError("");
    try {
      const tokenRes = await api.post("/auth/login", {
        matricula_cnpj: data.identificador,
        senha: data.senha,
      });
      const { access_token, refresh_token } = tokenRes.data;
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      const meRes = await api.get("/auth/me");
      login(meRes.data.usuario, access_token, refresh_token);
      navigate("/dashboard");
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err.response as { data?: { detail?: string } })?.data?.detail
          : undefined;
      setApiError(detail || "Credenciais inválidas. Tente novamente.");
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Painel esquerdo — fundo azul institucional */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-brand-700 text-white px-10 py-10 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <img src={brasaoRN} alt="Brasão do Governo do RN" className="h-10 w-10 object-contain brightness-0 invert opacity-90" />
            <span
              className="text-2xl font-black tracking-wider uppercase"
              style={{ fontFamily: "var(--font-condensed)" }}
            >
              SIN-Obras
            </span>
          </div>
          <p className="text-xs font-bold tracking-widest uppercase text-white/45 mb-3">
            Secretaria de Estado da Infraestrutura — RN
          </p>
          <h1
            className="text-5xl font-black leading-none tracking-tight mb-4"
            style={{ fontFamily: "var(--font-condensed)" }}
          >
            Sistema de<br />Gestão de<br />Objetos
          </h1>
          <p className="text-sm text-white/55 leading-relaxed max-w-xs">
            Acompanhe o cronograma físico-financeiro, valide ARTs e realize
            inspeções georreferenciadas em tempo real.
          </p>
        </div>
        {/* Stripe na base */}
        <div>
          <div className="h-1.5 w-full sin-stripe rounded mb-4 opacity-80" />
          <p className="text-xs text-white/30">
            Governo do Estado do Rio Grande do Norte
          </p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex flex-1 flex-col justify-center bg-surface-50 px-8 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <img src={brasaoRN} alt="Brasão do Governo do RN" className="h-10 w-10 object-contain" />
            <span
              className="text-xl font-black tracking-wider text-brand-700 uppercase"
              style={{ fontFamily: "var(--font-condensed)" }}
            >
              SIN-Obras
            </span>
          </div>

          <h2 className="text-2xl font-bold text-surface-950 mb-1">
            Entrar no sistema
          </h2>
          <p className="text-sm text-surface-600 mb-7">
            Acesse com sua matrícula ou CNPJ.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="rounded-lg bg-accent-50 p-4 text-sm font-medium text-accent-700 border border-accent-200 flex items-center gap-2">
                <span className="flex-1">{apiError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-surface-950" htmlFor="identificador">
                Matrícula ou CNPJ
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-surface-600" />
                </div>
                <input
                  id="identificador"
                  type="text"
                  className={`block w-full rounded-lg border ${
                    errors.identificador
                      ? "border-accent-500 bg-accent-50"
                      : "border-surface-200 bg-white"
                  } py-2.5 pl-9 pr-3 text-sm placeholder:text-surface-600/50 focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all`}
                  placeholder="000.000 ou 00.000.000/0000-00"
                  {...register("identificador")}
                />
              </div>
              {errors.identificador && (
                <p className="text-xs text-accent-600 mt-1">{errors.identificador.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-surface-950" htmlFor="senha">
                  Senha
                </label>
                <a href="#" className="text-sm font-medium text-brand-700 hover:text-brand-500 transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-surface-600" />
                </div>
                <input
                  id="senha"
                  type="password"
                  className={`block w-full rounded-lg border ${
                    errors.senha
                      ? "border-accent-500 bg-accent-50"
                      : "border-surface-200 bg-white"
                  } py-2.5 pl-9 pr-3 text-sm placeholder:text-surface-600/50 focus:border-brand-700 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-700/10 transition-all`}
                  placeholder="••••••••"
                  {...register("senha")}
                />
              </div>
              {errors.senha && (
                <p className="text-xs text-accent-600 mt-1">{errors.senha.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 py-3 text-sm font-semibold text-white shadow-md shadow-brand-700/25 transition-all hover:bg-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-700/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-surface-600/60">
            Acesso exclusivo para servidores autorizados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
