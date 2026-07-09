"use client";

import { useState, useRef, useEffect } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserMenu() {
  const { profile, signOut } = useDashboard();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = profile?.full_name?.substring(0, 2).toUpperCase() || "U";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/50 transition cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-slate-950 font-bold text-xs">
          {initials}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-800 bg-brand-card shadow-xl shadow-black/20 overflow-hidden z-50">
          <div className="p-3 border-b border-slate-800/60">
            <p className="text-sm font-semibold text-white truncate">
              {profile?.full_name || "Organizador"}
            </p>
          </div>
          <div className="p-1">
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.push("/");
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
