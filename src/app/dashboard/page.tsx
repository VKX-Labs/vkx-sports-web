import Header from "@/components/dashboard/Header";
import StatsCard from "@/components/dashboard/StatsCard";
import Section from "@/components/dashboard/Section";
import EmptyState from "@/components/dashboard/EmptyState";
import { Trophy, Users, UserSquare2, Calendar } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" description="Visão geral da sua plataforma" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Campeonatos" value={0} icon={Trophy} />
        <StatsCard title="Equipes" value={0} icon={Users} />
        <StatsCard title="Jogadores" value={0} icon={UserSquare2} />
        <StatsCard title="Jogos" value={0} icon={Calendar} />
    </div>

      <Section title="Campeonatos Recentes">
        <EmptyState
          icon={Trophy}
          title="Nenhum campeonato encontrado"
          description="Você ainda não possui competições registradas."
        />
      </Section>
    </>
  );
}
