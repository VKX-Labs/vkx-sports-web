import type { PlayerPosition } from "@/types/player";

export interface PositionFilterOption {
  key: string;
  label: string;
  positions: PlayerPosition[];
}

export const POSITION_FILTER_ALL = "ALL";

export const POSITION_FILTER_OPTIONS: PositionFilterOption[] = [
  { key: POSITION_FILTER_ALL, label: "Todas", positions: [] },
  { key: "GOLEIRO", label: "Goleiros", positions: ["GOLEIRO"] },
  {
    key: "DEFENSOR",
    label: "Defensores",
    positions: ["ZAGUEIRO", "LATERAL_DIREITO", "LATERAL_ESQUERDO"],
  },
  {
    key: "MEIA",
    label: "Meias",
    positions: ["VOLANTE", "MEIA_DE_LIGACAO", "MEIA_ATACANTE"],
  },
  {
    key: "ATACANTE",
    label: "Atacantes",
    positions: [
      "PONTA_DIREITA",
      "PONTA_ESQUERDA",
      "SEGUNDO_ATACANTE",
      "CENTROAVANTE",
    ],
  },
];

interface PositionFilterProps {
  value: string;
  onChange: (key: string) => void;
}

export function PositionFilter({ value, onChange }: PositionFilterProps) {
  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
      {POSITION_FILTER_OPTIONS.map((option) => {
        const isActive = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              isActive
                ? "bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20 font-semibold"
                : "bg-gray-900/60 text-gray-400 border-gray-800 hover:text-white hover:bg-gray-800"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}