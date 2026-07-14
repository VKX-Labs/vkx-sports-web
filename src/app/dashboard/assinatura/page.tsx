import { CreditCard } from "lucide-react";

import PageHeader from "@/components/shared/PageHeader";
import Section from "@/components/shared/Section";
import EmptyState from "@/components/shared/EmptyState";

export default function AssinaturaPage() {
  return (
    <>
      <PageHeader
        title="Assinatura"
        description="Gerencie seu plano e métodos de pagamento."
      />

      <Section>
        <EmptyState
          icon={CreditCard}
          title="Nenhum plano ativo"
          description="Escolha um plano para começar a usar todos os recursos."
        />
      </Section>
    </>
  );
}
