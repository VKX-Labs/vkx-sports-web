from fastapi import FastAPI
from knockout_engine import KnockoutEngine, MatchInput, KnockoutRules, KnockoutResult
from knockout_generator import KnockoutGenerator, TournamentBracketConfig, GeneratedMatchNode
from typing import List

app = FastAPI(title="VKX Sports - Engine API")

@app.post("/api/knockout/evaluate", response_model=KnockoutResult)
def evaluate_match(payload: dict):
    # payload contém match e rules
    return KnockoutEngine.evaluate_confrontation(MatchInput(**payload['match']), KnockoutRules(**payload['rules']))

@app.post("/api/knockout/generate-bracket", response_model=List[GeneratedMatchNode])
def generate_bracket(config: TournamentBracketConfig):
    return KnockoutGenerator.generate_bracket(config)