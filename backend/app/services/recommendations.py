"""Recommendation engine — builds the list of improvement recommendations
based on dimension scores and specific question answers.

Two rule types (per Scoring Logic doc):
  A. By dimension score (priority bucket)
  B. By specific question answer (direct mapping)
"""
from __future__ import annotations

from app.models import Recommendation, Response

# Mapping of question_code -> recommendation when answered No / In Progress.
# Priority labels per Report Structure doc:
#   Priority Action | Suggested Improvement | Opportunity for Enhancement
QUESTION_RECS: dict[str, dict[str, dict[str, str]]] = {
    # People
    "PPL-01": {
        "No": {"title": "Launch AI awareness training program", "priority": "Priority Action",
               "description": "Develop and roll out AI awareness training to build organization-wide understanding of AI opportunities and risks."},
        "In Progress": {"title": "Formalize AI awareness training program", "priority": "Suggested Improvement",
                        "description": "Finalize the training curriculum, define target audiences, and schedule regular delivery."},
    },
    "PPL-02": {
        "No": {"title": "Designate an AI governance owner", "priority": "Priority Action",
               "description": "Assign a named individual or committee accountable for AI oversight and governance."},
    },
    "PPL-03": {
        "No": {"title": "Raise staff awareness of AI risks", "priority": "Priority Action",
               "description": "Establish communications and training that educate staff on AI-related risks and responsible practices."},
        "In Progress": {"title": "Strengthen AI risk awareness program", "priority": "Suggested Improvement",
                        "description": "Expand the scope and measurement of AI risk awareness across teams."},
    },
    "PPL-04": {
        "No": {"title": "Define AI competency framework", "priority": "Suggested Improvement",
               "description": "Create a role-based AI competency model that clarifies required skills and development paths."},
        "In Progress": {"title": "Operationalize AI competency framework", "priority": "Opportunity for Enhancement",
                        "description": "Integrate the competency framework into hiring, performance, and L&D processes."},
    },
    "PPL-05": {
        "No": {"title": "Allocate training budget for AI skills", "priority": "Suggested Improvement",
               "description": "Earmark dedicated budget for upskilling staff on AI topics relevant to the organization."},
    },
    # Process
    "PRC-01": {
        "No": {"title": "Document AI-related procedures", "priority": "Priority Action",
               "description": "Create and approve written procedures covering AI risk assessment, development, and deployment."},
        "In Progress": {"title": "Finalize and standardize AI procedures", "priority": "Suggested Improvement",
                        "description": "Complete documentation and ensure consistent application across teams."},
    },
    "PRC-02": {
        "No": {"title": "Establish an AI risk assessment process", "priority": "Priority Action",
               "description": "Define a repeatable method for identifying, analyzing, and mitigating AI-specific risks."},
    },
    "PRC-03": {
        "No": {"title": "Institute periodic AI process reviews", "priority": "Suggested Improvement",
               "description": "Schedule regular reviews of AI-related processes to ensure they remain effective and current."},
    },
    "PRC-04": {
        "No": {"title": "Define AI incident management procedure", "priority": "Priority Action",
               "description": "Document how the organization will detect, respond to, and recover from AI-related incidents."},
        "In Progress": {"title": "Mature the AI incident management procedure", "priority": "Suggested Improvement",
                        "description": "Complete playbooks, escalation paths, and post-incident review processes."},
    },
    "PRC-05": {
        "No": {"title": "Adopt AI documentation standards", "priority": "Suggested Improvement",
               "description": "Define consistent documentation standards for AI models, datasets, and decisions."},
    },
    # Technology
    "TEC-01": {
        "No": {"title": "Apply access controls to AI systems", "priority": "Priority Action",
               "description": "Implement role-based access control and authentication for all AI systems and data."},
        "In Progress": {"title": "Strengthen AI access controls", "priority": "Suggested Improvement",
                        "description": "Expand RBAC coverage and review access periodically."},
    },
    "TEC-02": {
        "No": {"title": "Enable logging for AI tools", "priority": "Priority Action",
               "description": "Turn on and retain logs of AI system usage and decision outputs for audit and review."},
    },
    "TEC-03": {
        "No": {"title": "Establish an AI testing environment", "priority": "Suggested Improvement",
               "description": "Set up a dedicated environment to validate AI systems before production deployment."},
    },
    "TEC-04": {
        "No": {"title": "Implement data protection safeguards", "priority": "Priority Action",
               "description": "Introduce encryption, minimization, and data-handling controls for AI pipelines."},
    },
    "TEC-05": {
        "No": {"title": "Introduce model monitoring", "priority": "Suggested Improvement",
               "description": "Monitor model performance, drift, and anomalies in production."},
        "In Progress": {"title": "Expand model monitoring coverage", "priority": "Opportunity for Enhancement",
                        "description": "Extend monitoring to all production models and integrate with alerting."},
    },
    # Ecosystem
    "ECO-01": {
        "No": {"title": "Define vendor evaluation criteria for AI", "priority": "Priority Action",
               "description": "Create a consistent framework to evaluate third-party AI providers for compliance and quality."},
    },
    "ECO-02": {
        "No": {"title": "Add contractual AI safeguards", "priority": "Priority Action",
               "description": "Include AI-specific clauses (data use, IP, liability) in vendor contracts."},
        "In Progress": {"title": "Standardize AI contract safeguards", "priority": "Suggested Improvement",
                        "description": "Roll out AI clauses across all new and renewing contracts."},
    },
    "ECO-03": {
        "No": {"title": "Run supplier risk assessments", "priority": "Suggested Improvement",
               "description": "Assess AI-related suppliers against defined risk criteria on a regular cadence."},
    },
    "ECO-04": {
        "In Progress": {"title": "Deepen AI ecosystem participation", "priority": "Opportunity for Enhancement",
                        "description": "Increase engagement with industry AI groups, standards bodies, and peers."},
    },
    "ECO-05": {
        "No": {"title": "Collaborate with external AI experts", "priority": "Suggested Improvement",
               "description": "Establish advisory relationships with recognized AI experts or institutions."},
    },
    # Governance
    "GOV-01": {
        "No": {"title": "Develop an AI governance framework", "priority": "Priority Action",
               "description": "Create and formally approve an AI governance framework covering roles, policies, and controls."},
        "In Progress": {"title": "Finalize AI governance framework", "priority": "Suggested Improvement",
                        "description": "Complete the draft framework and obtain executive endorsement."},
    },
    "GOV-02": {
        "No": {"title": "Establish executive oversight for AI", "priority": "Priority Action",
               "description": "Assign executive-level accountability for AI initiatives and outcomes."},
    },
    "GOV-03": {
        "No": {"title": "Define AI accountability structure", "priority": "Priority Action",
               "description": "Document who is responsible and accountable for AI decisions across the lifecycle."},
    },
    "GOV-04": {
        "No": {"title": "Publish AI ethics guidelines", "priority": "Suggested Improvement",
               "description": "Adopt and communicate ethical principles that govern AI use in the organization."},
    },
    "GOV-05": {
        "No": {"title": "Introduce AI compliance monitoring", "priority": "Suggested Improvement",
               "description": "Establish monitoring against applicable regulations (e.g., RA 10173) and internal AI policies."},
    },
}


def generate_recommendations(assessment_id: int, responses: list[Response]) -> list[Recommendation]:
    """Build Recommendation rows for an assessment from its responses.

    Only produces question-level recommendations for now; dimension-level
    narratives are surfaced via interpretation text on the results screens.
    """
    recs: list[Recommendation] = []
    for r in responses:
        rule = QUESTION_RECS.get(r.question.question_code, {}).get(r.answer_value)
        if not rule:
            continue
        recs.append(
            Recommendation(
                assessment_id=assessment_id,
                title=rule["title"],
                dimension=r.question.dimension,
                priority=rule["priority"],
                description=rule["description"],
                source_question_code=r.question.question_code,
            )
        )
    # sort: Priority Action > Suggested Improvement > Opportunity for Enhancement
    order = {"Priority Action": 0, "Suggested Improvement": 1, "Opportunity for Enhancement": 2}
    recs.sort(key=lambda x: order.get(x.priority, 99))
    return recs
