import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Calendar,
  Trophy,
  BarChart3,
  Settings,
} from "lucide-react";

export const championshipMenu = [
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
    label: "Rodadas e Jogos",
    path: "rodadas",
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
