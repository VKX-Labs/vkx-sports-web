"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  ShieldAlert,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/button";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleRegister(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage("");
    setSuccess(false);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setSuccess(true);

        setForm({
          name: "",
          email: "",
          password: "",
        });
      }
    } catch (error: any) {
      setErrorMessage(
        error.message ?? "Não foi possível criar sua conta."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-dark px-6">

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent/5 blur-[120px]" />


      <section className="relative z-10 w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-md">

        <header className="space-y-3 text-center">

          <Link
            href="/"
            className="text-sm font-black uppercase tracking-wider text-white transition-colors hover:text-brand-accent"
          >
            VKX <span className="text-brand-accent">Sports</span>
          </Link>

          <h1 className="pt-2 text-2xl font-black tracking-tight text-white">
            Criar conta profissional
          </h1>

          <p className="text-xs text-slate-400">
            Gerencie campeonatos, equipes e estatísticas em uma única plataforma.
          </p>

        </header>


        {errorMessage && (
          <AlertBox type="error">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </AlertBox>
        )}


        {success && (
          <AlertBox type="success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />

            <div>
              <p className="font-bold">
                Cadastro realizado com sucesso.
              </p>

              <p className="mt-1 text-slate-400">
                Verifique seu e-mail para confirmar o acesso.
              </p>
            </div>

          </AlertBox>
        )}


        <form
          onSubmit={handleRegister}
          className="space-y-4"
        >

          <InputField
            label="Nome completo"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Digite seu nome"
            icon={<User />}
          />


          <InputField
            label="E-mail"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="seu@email.com"
            icon={<Mail />}
          />


          <InputField
            label="Senha"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Mínimo 6 caracteres"
            icon={<Lock />}
          />


          <Button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 py-3.5 font-bold"
            variant="primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              "Criar conta"
            )}
          </Button>

        </form>


        <footer className="pt-2 text-center text-xs text-slate-500">

          Já possui cadastro?{" "}

          <Link
            href="/login"
            className="font-semibold text-brand-accent hover:underline"
          >
            Entrar na plataforma
          </Link>

        </footer>

      </section>

    </main>
  );
}


function InputField({
  label,
  icon,
  ...props
}: {
  label: string;
  icon: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <div className="space-y-1.5">

      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>

      <div className="relative">

        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </div>

        <input
          {...props}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 transition-colors focus:border-brand-accent/50 focus:outline-none"
        />

      </div>

    </div>
  );
}


function AlertBox({
  children,
  type,
}: {
  children: React.ReactNode;
  type: "error" | "success";
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 text-xs ${
        type === "error"
          ? "border-red-500/20 bg-red-500/10 text-red-400"
          : "border-brand-accent/20 bg-brand-accent/10 text-brand-accent"
      }`}
    >
      {children}
    </div>
  );
}