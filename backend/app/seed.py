"""Seed the database with questions, demo organizations, users, and sample
completed assessments at each readiness level.

Run with: `python -m app.seed` from the backend directory.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models import (
    Assessment,
    AssessmentStatus,
    Organization,
    Question,
    Recommendation,
    Response,
    Role,
    User,
)
from app.services.recommendations import generate_recommendations
from app.services.scoring import compute_scores

# Standard answer options used for most questions (Yes / In Progress / No)
YNI_OPTIONS = [
    {"value": "Yes", "score": 5, "label": "Yes"},
    {"value": "In Progress", "score": 3, "label": "In Progress"},
    {"value": "No", "score": 1, "label": "No"},
]


# 25 questions — 5 per dimension, sourced from Demo Data (Golden Path) PDF
QUESTIONS: list[dict] = [
    # People
    {"code": "PPL-01", "dim": "People", "text": "Does the organization provide AI awareness training to employees?",
     "help": "Covers structured sessions that educate staff on AI concepts and responsible use.", "weight": 2},
    {"code": "PPL-02", "dim": "People", "text": "Is there a designated role responsible for AI governance or oversight?",
     "help": "A named individual or committee accountable for AI initiatives.", "weight": 3},
    {"code": "PPL-03", "dim": "People", "text": "Are staff aware of AI-related risks and responsible-use practices?",
     "help": "Awareness of bias, privacy, security, and ethical considerations.", "weight": 2},
    {"code": "PPL-04", "dim": "People", "text": "Does the organization have a defined AI competency framework?",
     "help": "Role-based skills and development paths for AI capabilities.", "weight": 2},
    {"code": "PPL-05", "dim": "People", "text": "Is there a dedicated training budget for AI-related skills?",
     "help": "Funding allocated for upskilling staff on AI topics.", "weight": 1},
    # Process
    {"code": "PRC-01", "dim": "Process", "text": "Are there documented procedures for AI-related activities?",
     "help": "Written procedures for AI risk assessment, development, and deployment.", "weight": 3},
    {"code": "PRC-02", "dim": "Process", "text": "Does the organization have a defined AI risk assessment process?",
     "help": "A repeatable method to identify, analyze, and mitigate AI-specific risks.", "weight": 3},
    {"code": "PRC-03", "dim": "Process", "text": "Are AI-related processes reviewed periodically?",
     "help": "Scheduled reviews of AI processes for continued effectiveness.", "weight": 2},
    {"code": "PRC-04", "dim": "Process", "text": "Is there a defined AI incident management procedure?",
     "help": "How the organization detects, responds to, and recovers from AI incidents.", "weight": 2},
    {"code": "PRC-05", "dim": "Process", "text": "Does the organization follow AI documentation standards?",
     "help": "Consistent documentation of AI models, datasets, and decisions.", "weight": 2},
    # Technology
    {"code": "TEC-01", "dim": "Technology", "text": "Are AI systems subject to security and access controls?",
     "help": "Role-based access control and authentication on AI systems and data.", "weight": 3},
    {"code": "TEC-02", "dim": "Technology", "text": "Are logs maintained for AI system usage and decision outputs?",
     "help": "Audit trail of AI system activity and outputs.", "weight": 2},
    {"code": "TEC-03", "dim": "Technology", "text": "Does the organization maintain a dedicated AI testing environment?",
     "help": "A non-production environment to validate AI systems before deployment.", "weight": 2},
    {"code": "TEC-04", "dim": "Technology", "text": "Are data protection safeguards applied to AI pipelines?",
     "help": "Encryption, minimization, and controlled handling of data used by AI.", "weight": 3},
    {"code": "TEC-05", "dim": "Technology", "text": "Is model monitoring in place for production AI systems?",
     "help": "Monitoring for performance, drift, and anomalies.", "weight": 2},
    # Ecosystem
    {"code": "ECO-01", "dim": "Ecosystem", "text": "Does the organization evaluate third-party AI providers against defined criteria?",
     "help": "Vendor assessment covering compliance and quality.", "weight": 3},
    {"code": "ECO-02", "dim": "Ecosystem", "text": "Are contractual safeguards in place for AI vendors?",
     "help": "AI-specific clauses covering data use, IP, and liability.", "weight": 2},
    {"code": "ECO-03", "dim": "Ecosystem", "text": "Does the organization perform supplier risk assessments for AI providers?",
     "help": "Periodic risk assessments of AI-related suppliers.", "weight": 2},
    {"code": "ECO-04", "dim": "Ecosystem", "text": "Does the organization participate in the broader AI ecosystem?",
     "help": "Engagement with industry groups, standards bodies, or peer organizations.", "weight": 1},
    {"code": "ECO-05", "dim": "Ecosystem", "text": "Does the organization collaborate with external AI experts?",
     "help": "Advisory relationships with recognized AI experts or institutions.", "weight": 2},
    # Governance
    {"code": "GOV-01", "dim": "Governance", "text": "Does the organization have a documented AI governance framework?",
     "help": "A framework covering roles, policies, and controls for AI.", "weight": 3},
    {"code": "GOV-02", "dim": "Governance", "text": "Is there executive oversight for AI-related initiatives?",
     "help": "Executive-level accountability for AI outcomes.", "weight": 2},
    {"code": "GOV-03", "dim": "Governance", "text": "Is there a defined accountability structure for AI decisions?",
     "help": "Clear responsibility and accountability across the AI lifecycle.", "weight": 3},
    {"code": "GOV-04", "dim": "Governance", "text": "Has the organization adopted AI ethics guidelines?",
     "help": "Ethical principles guiding AI use in the organization.", "weight": 2},
    {"code": "GOV-05", "dim": "Governance", "text": "Does the organization monitor compliance with applicable AI regulations?",
     "help": "Monitoring against regulations such as RA 10173 and internal AI policies.", "weight": 2},
]


# Golden Path demo answers per readiness profile (from Demo Data PDF)
BASIC_ANSWERS = {
    "PPL-01": "No", "PPL-02": "No", "PPL-03": "In Progress", "PPL-04": "No", "PPL-05": "No",
    "PRC-01": "No", "PRC-02": "No", "PRC-03": "No", "PRC-04": "In Progress", "PRC-05": "No",
    "TEC-01": "In Progress", "TEC-02": "No", "TEC-03": "No", "TEC-04": "In Progress", "TEC-05": "No",
    "ECO-01": "No", "ECO-02": "No", "ECO-03": "No", "ECO-04": "In Progress", "ECO-05": "No",
    "GOV-01": "No", "GOV-02": "In Progress", "GOV-03": "No", "GOV-04": "No", "GOV-05": "No",
}

DEVELOPING_ANSWERS = {
    "PPL-01": "In Progress", "PPL-02": "Yes", "PPL-03": "In Progress", "PPL-04": "In Progress", "PPL-05": "No",
    "PRC-01": "In Progress", "PRC-02": "In Progress", "PRC-03": "Yes", "PRC-04": "In Progress", "PRC-05": "Yes",
    "TEC-01": "Yes", "TEC-02": "In Progress", "TEC-03": "In Progress", "TEC-04": "Yes", "TEC-05": "In Progress",
    "ECO-01": "In Progress", "ECO-02": "Yes", "ECO-03": "In Progress", "ECO-04": "Yes", "ECO-05": "In Progress",
    "GOV-01": "In Progress", "GOV-02": "Yes", "GOV-03": "Yes", "GOV-04": "In Progress", "GOV-05": "In Progress",
}

ADVANCED_ANSWERS = {
    "PPL-01": "Yes", "PPL-02": "Yes", "PPL-03": "Yes", "PPL-04": "Yes", "PPL-05": "In Progress",
    "PRC-01": "Yes", "PRC-02": "Yes", "PRC-03": "Yes", "PRC-04": "Yes", "PRC-05": "Yes",
    "TEC-01": "Yes", "TEC-02": "Yes", "TEC-03": "Yes", "TEC-04": "Yes", "TEC-05": "In Progress",
    "ECO-01": "Yes", "ECO-02": "Yes", "ECO-03": "Yes", "ECO-04": "Yes", "ECO-05": "Yes",
    "GOV-01": "Yes", "GOV-02": "Yes", "GOV-03": "Yes", "GOV-04": "Yes", "GOV-05": "Yes",
}


def seed_questions(db: Session) -> dict[str, Question]:
    by_code: dict[str, Question] = {}
    for idx, q in enumerate(QUESTIONS):
        existing = db.query(Question).filter(Question.question_code == q["code"]).first()
        if existing:
            by_code[q["code"]] = existing
            continue
        obj = Question(
            question_code=q["code"],
            dimension=q["dim"],
            text=q["text"],
            help_text=q["help"],
            answer_type="YES_NO_INPROGRESS",
            answer_options=YNI_OPTIONS,
            weight=q["weight"],
            required=True,
            is_active=True,
            order_index=idx,
        )
        db.add(obj)
        by_code[q["code"]] = obj
    db.commit()
    for code, obj in by_code.items():
        db.refresh(obj)
    return by_code


def upsert_org(db: Session, name: str, industry: str = "Technology", size: str = "Medium") -> Organization:
    org = db.query(Organization).filter(Organization.name == name).first()
    if org:
        return org
    org = Organization(name=name, industry=industry, size=size)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def upsert_user(
    db: Session,
    email: str,
    full_name: str,
    password: str,
    role: Role,
    organization_id: int | None = None,
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=role.value,
        organization_id=organization_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def seed_completed_assessment(
    db: Session,
    org: Organization,
    creator: User,
    name: str,
    answers: dict[str, str],
    questions_by_code: dict[str, Question],
) -> Assessment:
    existing = (
        db.query(Assessment)
        .filter(Assessment.organization_id == org.id, Assessment.name == name)
        .first()
    )
    if existing:
        return existing

    a = Assessment(
        name=name,
        organization_id=org.id,
        created_by_id=creator.id,
        status=AssessmentStatus.IN_PROGRESS.value,
    )
    db.add(a)
    db.flush()

    for code, value in answers.items():
        q = questions_by_code[code]
        score = next(opt["score"] for opt in YNI_OPTIONS if opt["value"] == value)
        db.add(Response(assessment_id=a.id, question_id=q.id, answer_value=value, answer_score=score))
    db.flush()
    # reload responses with question relationship
    db.refresh(a)

    scores = compute_scores(a.responses)
    a.overall_score = scores["overall_score"]
    a.overall_level = scores["overall_level"]
    a.dimension_scores = scores["dimension_scores"]
    a.status = AssessmentStatus.COMPLETED.value
    a.submitted_at = datetime.now(timezone.utc)

    for rec in generate_recommendations(a.id, a.responses):
        db.add(rec)

    db.commit()
    db.refresh(a)
    return a


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        questions = seed_questions(db)

        # System admin (no org)
        upsert_user(
            db,
            email="admin@sairan.ph",
            full_name="SAIRAN System Admin",
            password="admin123",
            role=Role.SYSTEM_ADMIN,
        )

        # Three demo orgs, one user each + one org admin on Sample Organization B
        basic_org = upsert_org(db, "Sample Organization A", "Healthcare", "Small")
        dev_org = upsert_org(db, "Sample Organization B", "Financial Services", "Medium")
        adv_org = upsert_org(db, "Sample Organization C", "Telecommunications", "Large")

        basic_user = upsert_user(
            db, "user@samplea.com", "Alex Santos", "demo123", Role.ORG_USER, basic_org.id
        )
        dev_admin = upsert_user(
            db, "orgadmin@sampleb.com", "Bea Reyes", "demo123", Role.ORG_ADMIN, dev_org.id
        )
        dev_user = upsert_user(
            db, "user@sampleb.com", "Carlo Dela Cruz", "demo123", Role.ORG_USER, dev_org.id
        )
        adv_user = upsert_user(
            db, "user@samplec.com", "Dana Lim", "demo123", Role.ORG_USER, adv_org.id
        )

        # Seed one completed assessment per org
        seed_completed_assessment(
            db, basic_org, basic_user, "AI Readiness Baseline 2026", BASIC_ANSWERS, questions
        )
        seed_completed_assessment(
            db, dev_org, dev_user, "AI Readiness Baseline 2026", DEVELOPING_ANSWERS, questions
        )
        seed_completed_assessment(
            db, adv_org, adv_user, "AI Readiness Baseline 2026", ADVANCED_ANSWERS, questions
        )

        print("Seed complete.")
        print(f"  Questions: {db.query(Question).count()}")
        print(f"  Organizations: {db.query(Organization).count()}")
        print(f"  Users: {db.query(User).count()}")
        print(f"  Assessments: {db.query(Assessment).count()}")
        print(f"  Recommendations: {db.query(Recommendation).count()}")
        print()
        print("Demo credentials:")
        print("  admin@sairan.ph / admin123           (System Admin)")
        print("  orgadmin@sampleb.com / demo123       (Org Admin, Sample Org B)")
        print("  user@sampleb.com / demo123           (Org User, Sample Org B)")
    finally:
        db.close()


if __name__ == "__main__":
    run()
