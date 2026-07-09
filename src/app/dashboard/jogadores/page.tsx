import { UserSquare2 } from "lucide-react";

import Header from "@/components/dashboard/Header";
import Section from "@/components/dashboard/Section";
import EmptyState from "@/components/dashboard/EmptyState";

export default function JogadoresPage() {
  return (
    <>
      <Header title="Jogadores" description="Cadastre e gerencie os jogadores das equipes." />

      <Section>
        <EmptyState
          icon={UserSquare2}
          title="Nenhum jogador cadastrado"
          description="Você ainda não possui jogadores registrados."
        />
      </Section>
    </>
  );
}
