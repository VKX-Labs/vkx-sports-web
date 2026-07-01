import type { LucideIcon } from "lucide-react";

export interface DashboardStats {
  championships: number;
  teams: number;
  players: number;
  matches: number;
}

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}
