"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import Button from "@/components/ui/button";

const navigation = [
  { label: "Início", href: "#inicio" },
  { label: "Características", href: "#features" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "Planos", href: "#planos" },
  { label: "Contato", href: "#contato" },
];

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US";

  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        <Link
          href="/"
          className="text-2xl font-black tracking-wider text-white transition hover:opacity-80"
        >
          VKX<span className="text-brand-accent">SPORTS</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div
          ref={dropdownRef}
          className="relative flex items-center"
        >
          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-xl border border-slate-800 bg-slate-900" />
          ) : user ? (
            <>
              <button
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/70 py-1.5 pl-4 pr-1.5 transition hover:border-brand-accent/50"
              >
                <span className="text-sm font-medium text-white">
                  Olá, {firstName}
                </span>

                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-xs font-black text-slate-950">
                  {initials}
                </span>
              </button>

              {open && (
                <div className="absolute right-0 top-12 w-48 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">

                  <div className="border-b border-slate-800 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Minha conta
                  </div>

                  <button
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>

                </div>
              )}
            </>
          ) : (
            <Link href="/register">
              <Button variant="secondary">
                Entrar
              </Button>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}