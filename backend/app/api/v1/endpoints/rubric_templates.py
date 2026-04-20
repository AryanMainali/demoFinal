"""
Course Rubric Template Endpoints
CRUD for reusable per-course rubric templates with per-score-level comment descriptors.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_user, require_roles
from app.models import User, UserRole, Course
from app.models.rubric_template import (
    CourseRubricTemplate,
    CourseRubricTemplateItem,
    CourseRubricTemplateLevelDescriptor,
)
from app.schemas.rubric_template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateSummary,
)

router = APIRouter()

ALLOWED_ROLES = [UserRole.FACULTY, UserRole.ADMIN]


def _get_course_or_404(course_id: int, db: Session) -> Course:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _get_template_or_404(template_id: int, course_id: int, db: Session) -> CourseRubricTemplate:
    tpl = (
        db.query(CourseRubricTemplate)
        .options(
            joinedload(CourseRubricTemplate.items).joinedload(CourseRubricTemplateItem.levels)
        )
        .filter(
            CourseRubricTemplate.id == template_id,
            CourseRubricTemplate.course_id == course_id,
        )
        .first()
    )
    if not tpl:
        raise HTTPException(status_code=404, detail="Rubric template not found")
    return tpl


@router.get("/courses/{course_id}/rubric-templates", response_model=List[TemplateSummary])
def list_rubric_templates(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_course_or_404(course_id, db)
    templates = (
        db.query(CourseRubricTemplate)
        .options(joinedload(CourseRubricTemplate.items))
        .filter(CourseRubricTemplate.course_id == course_id)
        .order_by(CourseRubricTemplate.created_at.desc())
        .all()
    )
    result = []
    for tpl in templates:
        result.append(
            TemplateSummary(
                id=tpl.id,
                course_id=tpl.course_id,
                title=tpl.title,
                description=tpl.description,
                item_count=len(tpl.items),
                total_points=sum(item.points for item in tpl.items),
                created_at=tpl.created_at,
            )
        )
    return result


@router.post("/courses/{course_id}/rubric-templates", response_model=TemplateResponse, status_code=201)
def create_rubric_template(
    course_id: int,
    body: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ALLOWED_ROLES)),
):
    _get_course_or_404(course_id, db)

    tpl = CourseRubricTemplate(
        course_id=course_id,
        title=body.title.strip(),
        description=(body.description or "").strip() or None,
    )
    db.add(tpl)
    db.flush()  # get tpl.id

    for idx, item_data in enumerate(body.items):
        item = CourseRubricTemplateItem(
            template_id=tpl.id,
            name=item_data.name.strip(),
            description=(item_data.description or "").strip() or None,
            min_scale=item_data.min_scale,
            max_scale=item_data.max_scale,
            weight=item_data.weight,
            points=item_data.points,
            sort_order=item_data.sort_order if item_data.sort_order else idx,
        )
        db.add(item)
        db.flush()

        for level_data in item_data.levels:
            lvl = CourseRubricTemplateLevelDescriptor(
                item_id=item.id,
                score=level_data.score,
                comment=level_data.comment or "",
            )
            db.add(lvl)

    db.commit()
    db.refresh(tpl)

    return _get_template_or_404(tpl.id, course_id, db)


@router.get("/courses/{course_id}/rubric-templates/{template_id}", response_model=TemplateResponse)
def get_rubric_template(
    course_id: int,
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_template_or_404(template_id, course_id, db)


@router.put("/courses/{course_id}/rubric-templates/{template_id}", response_model=TemplateResponse)
def update_rubric_template(
    course_id: int,
    template_id: int,
    body: TemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ALLOWED_ROLES)),
):
    tpl = _get_template_or_404(template_id, course_id, db)

    if body.title is not None:
        tpl.title = body.title.strip()
    if body.description is not None:
        tpl.description = body.description.strip() or None

    if body.items is not None:
        # Full replace: delete existing items (cascade deletes levels too)
        for old_item in list(tpl.items):
            db.delete(old_item)
        db.flush()

        for idx, item_data in enumerate(body.items):
            item = CourseRubricTemplateItem(
                template_id=tpl.id,
                name=item_data.name.strip(),
                description=(item_data.description or "").strip() or None,
                min_scale=item_data.min_scale,
                max_scale=item_data.max_scale,
                weight=item_data.weight,
                points=item_data.points,
                sort_order=item_data.sort_order if item_data.sort_order else idx,
            )
            db.add(item)
            db.flush()

            for level_data in item_data.levels:
                lvl = CourseRubricTemplateLevelDescriptor(
                    item_id=item.id,
                    score=level_data.score,
                    comment=level_data.comment or "",
                )
                db.add(lvl)

    db.commit()
    return _get_template_or_404(tpl.id, course_id, db)


@router.delete("/courses/{course_id}/rubric-templates/{template_id}", status_code=204)
def delete_rubric_template(
    course_id: int,
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(*ALLOWED_ROLES)),
):
    tpl = _get_template_or_404(template_id, course_id, db)
    db.delete(tpl)
    db.commit()
