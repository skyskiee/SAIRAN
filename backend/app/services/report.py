"""Report builder — assembles the JSON structure defined in the Report JSON
Structure doc, consumed by both the preview UI and the PDF renderer."""
from __future__ import annotations

from datetime import datetime, timezone

from app.models import Assessment, DIMENSION_CODE, Dimension
from app.services.scoring import (
    DIMENSIONS,
    dimension_description,
    level_interpretation,
    overall_narrative,
)

DISCLAIMER_TEXT = (
    "This assessment reflects the organization's current practices based on responses "
    "provided at the time of assessment. Results indicate relative alignment with "
    "recognized professional and technical considerations relevant to AI readiness. "
    "This report does not constitute certification, regulatory approval, legal "
    "compliance determination, or professional accreditation. The results are "
    "intended to support internal evaluation, planning, and continuous improvement."
)

METHODOLOGY_TEXT = (
    "The SAIRAN AI Readiness Assessment applies structured evaluation criteria "
    "across five dimensions: People, Process, Technology, Ecosystem, Governance. "
    "Responses are converted into relative maturity indicators using a consistent "
    "weighted-average scoring approach. Scores reflect conditions at the time of "
    "assessment based on information provided by the organization."
)


def report_id_for(assessment: Assessment) -> str:
    year = (assessment.submitted_at or assessment.created_at).year
    return f"SRN-{year}-{assessment.id:05d}"


def build_report(assessment: Assessment) -> dict:
    scores = assessment.dimension_scores or {}
    submitted = assessment.submitted_at or datetime.now(timezone.utc)

    dimension_analysis = []
    for dim in DIMENSIONS:
        d = scores.get(dim, {"score": 0, "level": "Basic"})
        dimension_analysis.append({
            "dimension_code": DIMENSION_CODE[Dimension(dim)],
            "dimension_name": dim,
            "score": d.get("score", 0),
            "readiness_level": d.get("level", "Basic"),
            "description": dimension_description(dim),
            "interpretation": level_interpretation(dim, d.get("level", "Basic")),
        })

    recs = [
        {
            "id": r.id,
            "title": r.title,
            "dimension": r.dimension,
            "priority": r.priority,
            "description": r.description,
        }
        for r in assessment.recommendations
    ]

    return {
        "report_metadata": {
            "report_id": report_id_for(assessment),
            "report_title": "SAIRAN AI Readiness Assessment Report",
            "report_version": "v1.0",
        },
        "organization": {
            "organization_name": assessment.organization.name,
        },
        "assessment": {
            "assessment_name": assessment.name,
            "assessment_date": submitted.strftime("%Y-%m-%d"),
        },
        "executive_summary": {
            "text": (
                "This report summarizes the results of the SAIRAN AI Readiness "
                "Assessment based on current organizational practices across People, "
                "Process, Technology, Ecosystem, and Governance. Overall readiness "
                "reflects the relative maturity of current practices based on "
                "responses provided at the time of assessment."
            ),
        },
        "readiness_scores": {
            "overall_score": assessment.overall_score or 0,
            "overall_readiness_level": assessment.overall_level or "Basic",
            "overall_narrative": overall_narrative(assessment.overall_level or "Basic"),
            "dimensions": dimension_analysis,
        },
        "dimension_analysis": dimension_analysis,
        "recommendations": recs,
        "methodology_note": {"text": METHODOLOGY_TEXT},
        "disclaimer": {"text": DISCLAIMER_TEXT},
    }


def report_filename(assessment: Assessment) -> str:
    safe = "".join(c if c.isalnum() else "_" for c in assessment.organization.name)
    date = (assessment.submitted_at or assessment.created_at).strftime("%Y%m%d")
    return f"SAIRAN_Report_{safe}_{date}.pdf"
