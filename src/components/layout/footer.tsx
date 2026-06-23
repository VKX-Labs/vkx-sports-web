"use client";

import { Play, Apple } from "lucide-react";

const navigationLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Características", href: "#features" },
  { label: "Buscar Torneios", href: "#campeonatos" },
  { label: "Planos e Preços", href: "#planos" },
];

const appStores = [
  {
    label: "Disponível no",
    store: "Google Play",
    Icon: Play,
  },
  {
    label: "Baixar na",
    store: "App Store",
    Icon: Apple,
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full overflow-hidden border-t border-slate-900 bg-slate-950 pt-16 pb-8">
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-brand-accent/5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-12 px-6">
        <div className="grid grid-cols-1 gap-8 border-b border-slate-900 pb-12 md:grid-cols-12 md:gap-6">
          <div className="space-y-4 md:col-span-5">
            <div className="flex items-center gap-2">
              <span className="text-xl text-brand-accent">⚡</span>

              <span className="text-xl font-black tracking-wider text-white">
                VKX <span className="text-brand-accent">SPORTS</span>
              </span>
            </div>

            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              A infraestrutura digital definitiva para gerenciamento de ligas,
              campeonatos e estatísticas esportivas de alta performance.
            </p>

            <div className="space-y-1 pt-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Suporte Oficial
              </p>

              <a
                href="mailto:suporte@vkxsports.com"
                className="block text-xs text-slate-300 transition-colors duration-200 hover:text-brand-accent"
              >
                suporte@vkxsports.com
              </a>
            </div>
          </div>

          <div className="space-y-4 md:col-span-3">
            <h4 className="border-l-2 border-brand-accent pl-2.5 text-xs font-black uppercase tracking-widest text-slate-200">
              Navegação
            </h4>

            <ul className="space-y-2.5 text-xs">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-slate-400 transition-colors duration-200 hover:text-brand-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 md:col-span-4">
            <h4 className="border-l-2 border-brand-accent pl-2.5 text-xs font-black uppercase tracking-widest text-slate-200">
              Downloads
            </h4>

            <p className="text-xs leading-relaxed text-slate-400">
              Gerencie ou acompanhe os confrontos direto pelo smartphone.
              Disponível em breve para todas as plataformas.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {appStores.map(({ label, store, Icon }) => (
                <div
                  key={store}
                  className="flex w-[145px] cursor-not-allowed select-none items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900 px-4 py-2 opacity-50"
                >
                  <Icon className="h-5 w-5 fill-slate-400 text-slate-400" />

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      {label}
                    </p>

                    <p className="mt-0.5 text-xs font-bold text-slate-300">
                      {store}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 text-[11px] font-medium text-slate-500 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <span>
              © {currentYear} VKX Sports. Todos os direitos reservados.
            </span>

            <a
              href="#"
              className="transition-colors duration-200 hover:text-slate-300"
            >
              Política de Privacidade
            </a>
          </div>

          <div className="text-center sm:text-right">
            <span className="rounded-md border border-slate-800/80 bg-slate-900/60 px-3 py-1 text-[10px] uppercase tracking-wider">
              VKX SPORTS LTDA • CNPJ: 00.000.000/0001-00
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}