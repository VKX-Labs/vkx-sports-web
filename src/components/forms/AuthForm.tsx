"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Globe2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { signInWithEmail, signUpWithEmail } from "@/services/auth.service";

export default function AuthForm({ initialMode = "register" }: { initialMode?: "login" | "register" }) {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(initialMode === "login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      if (isLogin) {
        await signInWithEmail(form.email, form.password);

        setFeedback({
          type: "success",
          message: "Login realizado com sucesso. Redirecionando...",
        });

        setTimeout(() => {
          router.push("/");
        }, 800);
      } else {
        await signUpWithEmail(form.email, form.password, {
          full_name: form.name,
        });

        setFeedback({
          type: "success",
          message: "Conta criada com sucesso!",
        });

        setTimeout(() => {
          setIsLogin(true);
        }, 1500);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Não foi possível concluir a autenticação.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <section className="w-full max-w-md relative z-10">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase mb-4">
            <Globe2 className="w-4 h-4" />
            Plataforma VKX Sports
          </div>

          <h1 className="text-3xl font-black text-white">
            VKX <span className="text-emerald-500">SPORTS</span>
          </h1>

          <p className="text-sm text-gray-400 mt-2">
            {isLogin
              ? "Acesse seu painel de gerenciamento."
              : "Crie sua conta para administrar campeonatos."}
          </p>
        </header>

        <div className="bg-[#111827]/70 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {feedback.message && (
            <div
              className={`mb-5 p-3 rounded-xl text-sm border ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <InputField
                icon={User}
                label="Nome completo"
                placeholder="Digite seu nome"
                value={form.name}
                onChange={(value) => updateField("name", value)}
              />
            )}

            <InputField
              icon={Mail}
              label="E-mail"
              placeholder="seu@email.com"
              type="email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
            />

            <InputField
              icon={Lock}
              label="Senha"
              placeholder="••••••••"
              type="password"
              value={form.password}
              onChange={(value) => updateField("password", value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando
                </>
              ) : (
                <>
                  {isLogin ? "Entrar na plataforma" : "Criar conta"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-400">
            {isLogin
              ? "Ainda não possui uma conta?"
              : "Já possui cadastro?"}

            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setFeedback({ type: "", message: "" });
              }}
              className="ml-1 text-emerald-400 font-semibold hover:underline"
            >
              {isLogin ? "Criar conta" : "Fazer login"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-600">
          <ShieldCheck className="w-4 h-4" />
          Ambiente protegido com autenticação segura.
        </div>
      </section>
    </main>
  );
}

function InputField({
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: LucideIcon;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        {label}
      </label>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          <Icon className="w-4 h-4" />
        </div>

        <input
          type={type}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0B0F19]/80 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
        />
      </div>
    </div>
  );
}
