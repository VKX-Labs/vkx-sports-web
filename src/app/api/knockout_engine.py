# knockout_engine.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class KnockoutRules(BaseModel):
    two_legged: bool = False
    away_goals_rule: bool = False
    extra_time: bool = False
    penalties: bool = True

class MatchInput(BaseModel):
    match_id: str
    home_team_id: str
    away_team_id: str
    home_score_leg1: Optional[int] = None
    away_score_leg1: Optional[int] = None
    home_score_leg2: Optional[int] = None
    away_score_leg2: Optional[int] = None
    penalties_home: Optional[int] = None
    penalties_away: Optional[int] = None

class KnockoutResult(BaseModel):
    winner_id: Optional[str]
    aggregate_home: int
    aggregate_away: int
    is_tied: bool
    reason: str

class KnockoutEngine:
    @staticmethod
    def evaluate_confrontation(match: MatchInput, rules: KnockoutRules) -> KnockoutResult:
        """
        Avalia o confronto de mata-mata com base nas regras configuradas.
        """
        if not rules.two_legged:
            # --- JOGO ÚNICO ---
            if match.home_score_leg1 is None or match.away_score_leg1 is None:
                return KnockoutResult(
                    winner_id=None,
                    aggregate_home=0,
                    aggregate_away=0,
                    is_tied=True,
                    reason="Partida ainda não finalizada"
                )
            
            h1, a1 = match.home_score_leg1, match.away_score_leg1
            
            if h1 > a1:
                return KnockoutResult(winner_id=match.home_team_id, aggregate_home=h1, aggregate_away=a1, is_tied=False, reason="Vitória no jogo único")
            elif a1 > h1:
                return KnockoutResult(winner_id=match.away_team_id, aggregate_home=h1, aggregate_away=a1, is_tied=False, reason="Vitória no jogo único")
            else:
                # Empate em jogo único -> Pênaltis
                ph, pa = match.penalties_home or 0, match.penalties_away or 0
                if ph > pa:
                    return KnockoutResult(winner_id=match.home_team_id, aggregate_home=h1, aggregate_away=a1, is_tied=False, reason="Vitória nos Pênaltis")
                elif pa > ph:
                    return KnockoutResult(winner_id=match.away_team_id, aggregate_home=h1, aggregate_away=a1, is_tied=False, reason="Vitória nos Pênaltis")
                
                return KnockoutResult(winner_id=None, aggregate_home=h1, aggregate_away=a1, is_tied=True, reason="Empate - Pênaltis pendentes")

        else:
            # --- JOGO DUPLO (IDA E VOLTA) ---
            # Nota: No jogo 2, home_team é o mando de campo da volta.
            if any(x is None for x in [match.home_score_leg1, match.away_score_leg1, match.home_score_leg2, match.away_score_leg2]):
                return KnockoutResult(winner_id=None, aggregate_home=0, aggregate_away=0, is_tied=True, reason="Jogos de ida/volta incompletos")

            # Leg 1: Time A (Home) vs Time B (Away)
            # Leg 2: Time B (Home) vs Time A (Away)
            h1, a1 = match.home_score_leg1, match.away_score_leg1
            h2, a2 = match.home_score_leg2, match.away_score_leg2

            # Total de gols: Time A = h1 + a2 | Time B = a1 + h2
            total_team_a = h1 + a2
            total_team_b = a1 + h2

            if total_team_a > total_team_b:
                return KnockoutResult(winner_id=match.home_team_id, aggregate_home=total_team_a, aggregate_away=total_team_b, is_tied=False, reason="Vitória no placar agregado")
            elif total_team_b > total_team_a:
                return KnockoutResult(winner_id=match.away_team_id, aggregate_home=total_team_a, aggregate_away=total_team_b, is_tied=False, reason="Vitória no placar agregado")

            # --- EMPATE NO AGREGADO ---
            # Regra do Gol Fora (se ativada)
            if rules.away_goals_rule:
                # Gols fora do Time A (a2) vs Gols fora do Time B (a1)
                if a2 > a1:
                    return KnockoutResult(winner_id=match.home_team_id, aggregate_home=total_team_a, aggregate_away=total_team_b, is_tied=False, reason="Classificado pela regra do Gol Fora")
                elif a1 > a2:
                    return KnockoutResult(winner_id=match.away_team_id, aggregate_home=total_team_a, aggregate_away=total_team_b, is_tied=False, reason="Classificado pela regra do Gol Fora")

            # Pênaltis
            ph, pa = match.penalties_home or 0, match.penalties_away or 0
            if ph > pa:
                return KnockoutResult(winner_id=match.home_team_id, aggregate_home=total_team_a, aggregate_away=total_team_b, is_tied=False, reason="Vitória nos Pênaltis")
            elif pa > ph:
                return KnockoutResult(winner_id=match.away_team_id, aggregate_home=total_team_a, aggregate_away=total_team_b, is_tied=False, reason="Vitória nos Pênaltis")

            return KnockoutResult(winner_id=None, aggregate_home=total_team_a, aggregate_away=total_team_b, is_tied=True, reason="Empate em tudo - Pênaltis pendentes")