import Header from "@/components/dashboard/Header";
import Section from "@/components/dashboard/Section";
import EmptyState from "@/components/dashboard/EmptyState";
import { Trophy } from "lucide-react";

export default function CampeonatosPage() {
  return (
    <>
      <Header title="Campeonatos" description="Gerencie suas ligas e competições ativas." />

      <Section>
        <EmptyState
          icon={Trophy}
          title="Nenhum campeonato criado"
          description="Você ainda não possui competições registradas."
        />
      </Section>
    </>
  );
}
