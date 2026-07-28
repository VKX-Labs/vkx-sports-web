from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import random
import math

app = FastAPI()

class Team(BaseModel):
    id: str
    name: str

class TournamentRequest(BaseModel):
    teams: List[Team]
    tournament_type: str

@app.post("/api/py/generate-tournament")
def generate_tournament(payload: TournamentRequest):
    teams = [t.model_dump() for t in payload.teams]
    t_type = payload.tournament_type

    if t_type == "MATA_MATA":
        random.shuffle(teams)
        num_teams = len(teams)
        next_pow2 = 2 ** math.ceil(math.log2(num_teams)) if num_teams > 1 else 2
        
        while len(teams) < next_pow2:
            teams.append({"id": None, "name": "FOLGA"})

        matches = []
        phase_name = "QUARTAS" if next_pow2 == 8 else "OITAVAS" if next_pow2 == 16 else "SEMI"
        
        for i in range(0, len(teams), 2):
            matches.append({
                "phase": phase_name,
                "home_team_id": teams[i]["id"],
                "away_team_id": teams[i+1]["id"],
                "status": "scheduled"
            })
            
        return {"type": "MATA_MATA", "matches": matches}

    elif t_type in ["GRUPOS_MATA_MATA", "COPA"]:
        random.shuffle(teams)
        groups = {"A": [], "B": [], "C": [], "D": []}
        group_keys = list(groups.keys())
        
        for idx, team in enumerate(teams):
            group_key = group_keys[idx % len(group_keys)]
            groups[group_key].append(team)
            
        return {"type": t_type, "groups": groups}

    return {"error": "Tipo de torneio não suportado."}