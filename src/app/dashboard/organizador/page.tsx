import Header from "@/components/dashboard/Header";
import Section from "@/components/dashboard/Section";
import EmptyState from "@/components/dashboard/EmptyState";
import { Globe } from "lucide-react";

export default function OrganizadorPage() {
  return (
    <>
      <Header title="Página do Organizador" description="Personalize sua página pública de organizador." />

      <Section>
        <EmptyState
          icon={Globe}
          title="Página não publicada"
          description="Configure sua página pública para divulgar seus campeonatos."
        />
      </Section>
    </>
  );
}
