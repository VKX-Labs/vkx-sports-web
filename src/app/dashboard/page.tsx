import Header from "@/components/dashboard/Header";
import StatsCard from "@/components/dashboard/StatsCard";
import Section from "@/components/dashboard/Section";
import EmptyState from "@/components/dashboard/EmptyState";
import { Trophy, Users, UserSquare2, Calendar } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" description="Visão geral da sua plataforma" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Campeonatos" value={12} icon={Trophy} />
        <StatsCard label="Equipes" value={85} icon={Users} />
        <StatsCard label="Jogadores" value={1820} icon={UserSquare2} />
        <StatsCard label="Jogos" value={412} icon={Calendar} />
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
