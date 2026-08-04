import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Calendar,
  Trophy,
  BarChart3,
  Settings,
} from "lucide-react";
import type { ChampionshipSection } from "@/lib/routes";

export interface ChampionshipMenuItem {
  label: string;
  path: ChampionshipSection | "";
  icon: typeof LayoutDashboard;
}

export const championshipMenu: ChampionshipMenuItem[] = [
  {
    label: "Resumo",
    path: "",
    icon: LayoutDashboard,
  },
  {
    label: "Equipes",
    path: "equipes",
    icon: Users,
  },
  {
    label: "Jogadores",
    path: "jogadores",
    icon: UserSquare2,
  },
  {
    label: "Jogos",
    path: "jogos",
    icon: Calendar,
  },
  {
    label: "Classificação / Chave",
    path: "classificacao",
    icon: Trophy,
  },
  {
    label: "Estatísticas",
    path: "estatisticas",
    icon: BarChart3,
  },
  {
    label: "Configurações",
    path: "configuracoes",
    icon: Settings,
  },
];
