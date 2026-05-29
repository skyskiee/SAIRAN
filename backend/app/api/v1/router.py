from fastapi import APIRouter

from app.api.v1 import assessments, auth, organizations, questions, reports, users

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(organizations.router)
api_router.include_router(questions.router)
api_router.include_router(assessments.router)
api_router.include_router(reports.router)
