from fastapi import APIRouter, Depends
from database.firebase_db import get_firestore
from utils.jwt_handler import verify_token
from schemas.project import ProjectStatusUpdate
from services.recommendation_service import get_recommended_projects, update_project_status

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("")
def get_projects(
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    return get_recommended_projects(db, uid)


@router.put("/{project_id}")
def update_status(
    project_id: str,
    data: ProjectStatusUpdate,
    db = Depends(get_firestore),
    uid: str = Depends(verify_token),
):
    from services.activity_service import log_activity
    if data.status == "Completed":
        log_activity(db, uid, "complete_project", {"project_id": project_id})
    return update_project_status(db, uid, project_id, data.status)
