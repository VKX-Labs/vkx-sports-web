export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatSeasonStatus(status: string): string {
  const statuses: Record<string, string> = {
    CONFIGURACAO: "Configuração",
    INSCRICOES: "Inscrições",
    SORTEIO: "Sorteio",
    ANDAMENTO: "Em Andamento",
    FINALIZADO: "Finalizado",
  };
  return statuses[status] || status;
}

export function formatTournamentType(type: string): string {
  const types: Record<string, string> = {
    PONTOS_CORRIDOS: "Pontos Corridos",
    MATA_MATA: "Mata-mata",
    GRUPOS_MATA_MATA: "Grupos + Mata-mata",
    ELIMINATORIA_DUPLA: "Eliminatória Dupla",
    COPA: "Copa",
    LIGA: "Liga",
  };
  return types[type] || type;
}

export function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US"
  );
}

export function getFirstName(fullName: string | undefined): string {
  return fullName?.split(" ")[0] || "Usuário";
}
