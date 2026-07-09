import { Users } from "lucide-react";

import Header from "@/components/dashboard/Header";
import Section from "@/components/dashboard/Section";
import EmptyState from "@/components/dashboard/EmptyState";

export default function EquipesPage() {
  return (
    <>
      <Header title="Equipes" description="Cadastre e gerencie as equipes dos seus campeonatos." />

      <Section>
        <EmptyState
          icon={Users}
          title="Nenhuma equipe cadastrada"
          description="Você ainda não possui equipes registradas."
        />
      </Section>
    </>
  );
}
