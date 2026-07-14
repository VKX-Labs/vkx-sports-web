export interface SelectOption {
  label: string;
  value: string;
}

export const MODALITIES: SelectOption[] = [
  { label: "Futebol de Campo", value: "Futebol de Campo" },
  { label: "Futsal", value: "Futsal" },
  { label: "Fut7", value: "Fut7" },
  { label: "Basquete", value: "Basquete" },
  { label: "Vôlei", value: "Vôlei" },
];

export const TOURNAMENT_TYPES: SelectOption[] = [
  { label: "Pontos Corridos", value: "PONTOS_CORRIDOS" },
  { label: "Mata-mata", value: "MATA_MATA" },
  { label: "Grupos + Mata-mata", value: "GRUPOS_MATA_MATA" },
  { label: "Copa", value: "COPA" },
];

export const BRAZILIAN_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];
