import { Globe } from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import Section from "@/components/shared/Section";
import EmptyState from "@/components/shared/EmptyState";

export default function OrganizadorPage() {
  return (
    <>
      <PageHeader
        title="Página do Organizador"
        description="Personalize sua página pública de organizador."
      />

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
