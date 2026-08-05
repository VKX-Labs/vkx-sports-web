"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BellOff, Loader2 } from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { routes } from "@/lib/routes";
import {
  followChampionship,
  getMyChampionshipMembership,
  unfollowChampionship,
} from "@/services/championship-members";
import type { ChampionshipMember } from "@/types/championship-member";

interface FollowButtonProps {
  championshipId: string;
  championshipOwnerId?: string | null;
  compact?: boolean;
  className?: string;
}

export default function FollowButton({
  championshipId,
  championshipOwnerId,
  compact = false,
  className = "",
}: FollowButtonProps) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();

  const [membership, setMembership] = useState<
    ChampionshipMember | null | undefined
  >(undefined);
  const [busy, setBusy] = useState(false);

  const isOwner = Boolean(
    user?.id && championshipOwnerId && user.id === championshipOwnerId
  );

  useEffect(() => {
    let active = true;

    if (!user || isOwner) {
      setMembership(undefined);
      return;
    }

    getMyChampionshipMembership(championshipId)
      .then((result) => {
        if (active) setMembership(result);
      })
      .catch(() => {
        if (active) setMembership(null);
      });

    return () => {
      active = false;
    };
  }, [championshipId, user, isOwner]);

  const baseClasses = `inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer shrink-0 ${className}`;

  if (authLoading) {
    return (
      <button
        disabled
        className={`${baseClasses} bg-slate-900 border border-slate-800 text-slate-400`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  if (!user) {
    return (
      <Link
        href={routes.public.login(pathname ?? routes.public.home())}
        className={`${baseClasses} bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/10`}
      >
        <Bell className="w-4 h-4" />
        {compact ? "Seguir" : "Seguir Campeonato"}
      </Link>
    );
  }

  if (isOwner) {
    return null;
  }

  const isFollowing = Boolean(membership);

  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);

    try {
      if (isFollowing) {
        await unfollowChampionship(championshipId);
        setMembership(null);
      } else {
        await followChampionship(championshipId);
        setMembership({
          id: "",
          championship_id: championshipId,
          user_id: user.id,
          role: "FOLLOWER",
        });
      }
    } catch (err) {
      console.error("Erro ao alternar seguidor:", err);
      alert(
        "Não foi possível atualizar seu vínculo com este campeonato. Tente novamente."
      );
    } finally {
      setBusy(false);
    }
  };

  if (isFollowing) {
    return (
      <button
        onClick={handleToggle}
        disabled={busy}
        title="Deixar de seguir"
        className={`${baseClasses} bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200`}
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <BellOff className="w-4 h-4 text-amber-400" />
        )}
        Seguindo
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      title="Seguir campeonato"
      className={`${baseClasses} bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/10`}
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      {compact ? "Seguir" : "Seguir Campeonato"}
    </button>
  );
}
