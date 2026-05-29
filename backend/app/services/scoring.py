"""Scoring engine — implements the SAIRAN scoring model.

Flow: answer -> weighted question score -> dimension score (weighted avg)
      -> overall score (equal-weight avg of 5 dimensions) -> readiness level.

Thresholds (from Scoring Logic doc):
  Basic       1.00 - 2.49
  Developing  2.50 - 3.49
  Advanced    3.50 - 5.00
"""
from __future__ import annotations

from app.models import DIMENSION_CODE, Assessment, Dimension, Question, Response

DIMENSIONS = [d.value for d in Dimension]


def level_for_score(score: float) -> str:
    if score < 2.5:
        return "Basic"
    if score < 3.5:
        return "Developing"
    return "Advanced"


def dimension_description(dim: str) -> str:
    return {
        "People": "Evaluates roles, competencies, and awareness supporting responsible AI adoption.",
        "Process": "Evaluates structured procedures supporting consistent AI-related practices.",
        "Technology": "Evaluates technical safeguards supporting reliability, security, and performance of AI systems.",
        "Ecosystem": "Evaluates external relationships, dependencies, and collaboration relevant to AI readiness.",
        "Governance": "Evaluates oversight structures guiding responsible AI-related decision-making.",
    }.get(dim, "")


def level_interpretation(dim: str, level: str) -> str:
    if level == "Advanced":
        return f"The organization demonstrates structured and consistently applied practices in the {dim.lower()} dimension."
    if level == "Developing":
        return f"{dim} maturity is emerging, with several practices in place but gaps remaining."
    return f"{dim} practices are limited or informal; foundational structures should be prioritized."


def overall_narrative(level: str) -> str:
    if level == "Basic":
        return (
            "The organization is at an early stage of AI readiness, with limited or "
            "inconsistent practices across key dimensions."
        )
    if level == "Developing":
        return (
            "The organization has emerging readiness foundations, with several "
            "structured practices in place but notable gaps remaining."
        )
    return (
        "The organization demonstrates established and structured practices across "
        "major AI readiness dimensions, with evidence of governance and operational maturity."
    )


def score_for_answer(question: Question, answer_value: str) -> int:
    """Map an answer value to its numeric score using the question's answer_options."""
    for opt in question.answer_options or []:
        if opt.get("value") == answer_value:
            return int(opt.get("score", 0))
    raise ValueError(f"Invalid answer '{answer_value}' for question {question.question_code}")


def compute_scores(responses: list[Response]) -> dict:
    """Compute dimension scores, overall score, and levels from a list of responses.

    Returns:
        {
          "dimension_scores": {"People": {"score": 3.8, "level": "Advanced", "code": "PPL"}, ...},
          "overall_score": 3.53,
          "overall_level": "Advanced",
        }
    """
    by_dim: dict[str, list[tuple[int, int]]] = {d: [] for d in DIMENSIONS}
    # collect (weighted_score, weight) pairs per dimension
    for r in responses:
        q = r.question
        if not q.is_active:
            continue
        by_dim.setdefault(q.dimension, []).append((r.answer_score * q.weight, q.weight))

    dim_out: dict[str, dict] = {}
    for dim in DIMENSIONS:
        pairs = by_dim.get(dim, [])
        total_w = sum(w for _, w in pairs)
        total_ws = sum(ws for ws, _ in pairs)
        score = round(total_ws / total_w, 2) if total_w else 0.0
        dim_out[dim] = {
            "score": score,
            "level": level_for_score(score) if total_w else "Basic",
            "code": DIMENSION_CODE[Dimension(dim)],
        }

    scored = [d["score"] for d in dim_out.values() if d["score"] > 0]
    overall = round(sum(scored) / len(scored), 2) if scored else 0.0

    return {
        "dimension_scores": dim_out,
        "overall_score": overall,
        "overall_level": level_for_score(overall) if scored else "Basic",
    }


def completion_percentage(assessment: Assessment, required_question_count: int) -> int:
    if required_question_count == 0:
        return 0
    answered = sum(1 for r in assessment.responses if r.answer_value)
    return min(100, int(round(answered * 100 / required_question_count)))
