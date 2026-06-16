import React from "react";
import Button from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        
        <div className="text-2xl font-black tracking-wider text-brand-textPrimary cursor-pointer hover:opacity-90 transition">
          VKX<span className="text-brand-accent">SPORTS</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-brand-textSecondary">
          <a 
            href="#inicio" 
            className="hover:text-brand-textPrimary hover:scale-105 transition-all duration-200"
          >
            Início
          </a>
          <a 
            href="#features" 
            className="hover:text-brand-textPrimary hover:scale-105 transition-all duration-200"
          >
            Características
          </a>
          <a 
            href="#funcionalidades" 
            className="hover:text-brand-textPrimary hover:scale-105 transition-all duration-200"
          >
            Funcionalidades
          </a>
          <a 
            href="#planos" 
            className="hover:text-brand-textPrimary hover:scale-105 transition-all duration-200"
          >
            Planos
          </a>
          <a 
            href="#contato" 
            className="hover:text-brand-textPrimary hover:scale-105 transition-all duration-200"
          >
            Fale Conosco
          </a>
        </nav>

        {/* BOTÃO DE AÇÃO */}
        <div className="flex items-center gap-4">
          <Button variant="secondary">Entrar</Button>
        </div>
      </div>
    </header>
  );
}