# src/app/api/knockout_generator.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import math

app = FastAPI()

class Team(BaseModel):
    id: str
    name: str
    short_name: Optional[str] = None
    overall: Optional[int] = 50

class KnockoutRequest(BaseModel):
    teams: List[Team]
    legs: int = 1  # 1 ou 2 jogos por fase

def get_phase_name(teams_in_round: int) -> str:
    """Mapeia dinamicamente a quantidade de times no chaveamento para o nome da fase."""
    if teams_in_round == 2:
        return "Final"
    elif teams_in_round == 4:
        return "Semifinal"
    elif teams_in_round == 8:
        return "Quartas de Final"
    elif teams_in_round == 16:
        return "Oitavas de Final"
    elif teams_in_round == 32:
        return "1/16 de Final"
    elif teams_in_round == 64:
        return "1/32 de Final"
    elif teams_in_round == 128:
        return "1/64 de Final"
    elif teams_in_round == 256:
        return "1/128 de Final"
    else:
        return f"Fase de {teams_in_round} equipes"

@app.post("/api/knockout/generate-bracket")
async def generate_bracket(request: KnockoutRequest):
    teams = request.teams
    total_teams = len(teams)

    if total_teams < 2:
        raise HTTPException(status_code=400, detail="Mínimo de 2 times necessário para gerar um mata-mata.")

    # Encontra a maior potência de 2 menor ou igual ao número total de times
    nearest_power = 2 ** math.floor(math.log2(total_teams))
    playoff_teams_count = (total_teams - nearest_power) * 2

    matches = []
    rounds_structure = []
    
    # 1. Fase Preliminar / Playoff (se o número de times não for potência de 2 perfeita)
    current_team_idx = 0
    if playoff_teams_count > 0:
        rounds_structure.append({
            "name": "Playoff Preliminar",
            "order": 1,
            "type": "playoff"
        })
        for i in range(0, playoff_teams_count, 2):
            home = teams[current_team_idx]
            away = teams[current_team_idx + 1]
            matches.append({
                "phase": "Playoff Preliminar",
                "round_order": 1,
                "home_team_id": home.id,
                "away_team_id": away.id,
                "leg": 1
            })
            current_team_idx += 2

    # 2. Gera a estrutura de fases principais (ex: Oitavas, Quartas, Semi, Final)
    remaining_teams = nearest_power
    round_order = 2 if playoff_teams_count > 0 else 1

    while remaining_teams >= 2:
        phase_name = get_phase_name(remaining_teams)
        rounds_structure.append({
            "name": phase_name,
            "order": round_order,
            "type": "knockout"
        })

        # Adiciona partidas slots da primeira fase principal com os times restantes (se houver)
        if round_order == (2 if playoff_teams_count > 0 else 1):
            teams_for_first_round = teams[current_team_idx:]
            for i in range(0, len(teams_for_first_round), 2):
                if i + 1 < len(teams_for_first_round):
                    matches.append({
                        "phase": phase_name,
                        "round_order": round_order,
                        "home_team_id": teams_for_first_round[i].id,
                        "away_team_id": teams_for_first_round[i+1].id,
                        "leg": 1
                    })

        remaining_teams //= 2
        round_order += 1

    return {
        "rounds": rounds_structure,
        "matches": matches
    }