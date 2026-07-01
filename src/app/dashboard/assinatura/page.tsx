import Header from "@/components/dashboard/Header";
import Section from "@/components/dashboard/Section";
import EmptyState from "@/components/dashboard/EmptyState";
import { CreditCard } from "lucide-react";

export default function AssinaturaPage() {
  return (
    <>
      <Header title="Assinatura" description="Gerencie seu plano e métodos de pagamento." />

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
