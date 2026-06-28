"use client";

import React from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export default function Navbar() {
  const { user, profile, loading } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

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

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-24 h-10 bg-slate-800 rounded-lg animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-brand-textPrimary">
                {profile?.full_name?.split(" ")[0]}
              </span>
              <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center text-brand-dark font-bold text-sm">
                {initials}
              </div>
            </div>
          ) : (
            <Link href="/register">
              <Button variant="secondary">Entrar</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}