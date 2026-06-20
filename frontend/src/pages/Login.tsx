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
    <div className="flex h-screen w-full bg-slate-50">
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 md:px-24 lg:w-[480px] xl:w-[560px] 2xl:px-32 z-10 bg-white shadow-2xl relative">
        <div className="mx-auto w-full max-w-sm lg:max-w-md">
          <div className="mb-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center">
              <img src={brasaoRN} alt="Brasão do Governo do RN" className="h-full w-full object-contain drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">SIN-Obras</h1>
              <p className="text-sm font-medium text-emerald-600">Governo do Estado do RN</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Bem-vindo de volta</h2>
            <p className="mt-2 text-sm text-slate-500">Acesse o sistema unificado de obras com sua Matrícula ou CNPJ.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {apiError && (
              <div className="rounded-lg bg-rose-50 p-4 text-sm font-medium text-rose-600 border border-rose-100 flex items-center gap-2">
                <span className="flex-1">{apiError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="identificador">
                Matrícula ou CNPJ
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="identificador"
                  type="text"
                  className={`block w-full rounded-xl border ${errors.identificador ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"} py-3 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all`}
                  placeholder="000.000 ou 00.000.000/0000-00"
                  {...register("identificador")}
                />
              </div>
              {errors.identificador && (
                <p className="text-xs text-rose-600 mt-1">{errors.identificador.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700" htmlFor="senha">
                  Senha
                </label>
                <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="senha"
                  type="password"
                  className={`block w-full rounded-xl border ${errors.senha ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50"} py-3 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all`}
                  placeholder="••••••••"
                  {...register("senha")}
                />
              </div>
              {errors.senha && (
                <p className="text-xs text-rose-600 mt-1">{errors.senha.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="relative hidden w-full flex-1 lg:block overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-emerald-900/40 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-10" />
        <img
          className="absolute inset-0 h-full w-full object-contain object-center"
          src="/login_bg.jpeg"
          alt="Construção Moderna"
        />
        <div className="absolute bottom-12 left-12 right-12 z-20 text-white">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Gestão inteligente e transparente.</h2>
          <p className="text-lg text-emerald-100 max-w-xl">
            Acompanhe o cronograma físico-financeiro, valide ARTs e realize inspeções georreferenciadas em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
