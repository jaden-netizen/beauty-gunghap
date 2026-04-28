"""
뷰티궁합 — FastAPI 백엔드
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
import asyncpg
import ssl as ssl_module
import os
from dotenv import load_dotenv

from app.core.saju import calculate_compatibility, ELEMENT_NAMES, ELEMENT_COLORS

load_dotenv()

app = FastAPI(
    title="뷰티궁합 API",
    description="사주 기반 병원 궁합 서비스",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_URL = os.getenv("DB_URL")

# ── DB 연결 풀 ─────────────────────────────────────────
@app.on_event("startup")
async def startup():
    app.state.pool = None
    app.state.db_error = None
    try:
        ssl_ctx = ssl_module.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl_module.CERT_NONE
        app.state.pool = await asyncpg.create_pool(
            DB_URL, min_size=1, max_size=10, ssl=ssl_ctx,
            statement_cache_size=0,
        )
        print("DB 연결 성공")
    except Exception as e:
        app.state.db_error = str(e)
        print(f"DB 연결 실패 (서버는 계속 실행): {e}")

@app.on_event("shutdown")
async def shutdown():
    if app.state.pool:
        await app.state.pool.close()

async def get_db():
    if not app.state.pool:
        raise HTTPException(503, f"DB 연결 불가: {app.state.db_error}")
    async with app.state.pool.acquire() as conn:
        yield conn

# ── 스키마 ─────────────────────────────────────────────
class CompatibilityRequest(BaseModel):
    birth_date:  str  = Field(..., example="1990-05-15", description="생년월일 YYYY-MM-DD")
    birth_hour:  Optional[int] = Field(None, ge=0, le=23, description="태어난 시 (0~23), 모르면 null")
    birth_type:  str  = Field("양력", description="양력|음력")
    hospital_id: int  = Field(..., description="병원 ID")

class HospitalOut(BaseModel):
    id:              int
    name:            str
    address:         str
    district:        str
    phone:           Optional[str]
    specialties:     Optional[str]
    institution_type: Optional[str]
    doctor_count:    int
    license_date:    str
    naver_map_url:   Optional[str]
    coord_x:         Optional[float]
    coord_y:         Optional[float]

class BreakdownOut(BaseModel):
    오행상생상극: int
    천간합충:    int
    지지합충형:  int
    일간관계:    int

class ElementOut(BaseModel):
    name:  str
    color: str
    customer_count: int
    hospital_count: int

class CompatibilityOut(BaseModel):
    total:           int
    grade:           str
    grade_en:        str
    summary:         str
    breakdown:       BreakdownOut
    elements:        List[ElementOut]
    best_months:     List[int]
    avoid_months:    List[int]
    element_relation: str
    hospital:        HospitalOut

# ── 병원 검색 ──────────────────────────────────────────
@app.get("/api/hospitals/search", response_model=List[HospitalOut])
async def search_hospitals(
    q:          str   = Query(..., min_length=1, description="병원명 검색어"),
    district:   Optional[str] = Query(None, description="구 이름 필터"),
    specialty:  Optional[str] = Query(None, description="피부과|성형외과"),
    limit:      int   = Query(20, le=50),
    db = Depends(get_db),
):
    conditions = ["to_tsvector('simple', name) @@ plainto_tsquery('simple', $1) OR name ILIKE $2"]
    params     = [q, f"%{q}%"]
    idx        = 3

    if district:
        conditions.append(f"district = ${idx}")
        params.append(district)
        idx += 1
    if specialty:
        conditions.append(f"specialties ILIKE ${idx}")
        params.append(f"%{specialty}%")
        idx += 1

    where = " AND ".join(conditions)
    sql = f"""
        SELECT id, name, address, district, phone, specialties,
               institution_type, doctor_count, license_date,
               naver_map_url, coord_x, coord_y
        FROM hospitals
        WHERE {where}
        ORDER BY
            CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END,
            doctor_count DESC
        LIMIT ${idx}
    """
    params.append(limit)

    rows = await db.fetch(sql, *params)
    return [_row_to_hospital(r) for r in rows]

# ── 구 목록 ────────────────────────────────────────────
@app.get("/api/districts")
async def get_districts(db = Depends(get_db)):
    rows = await db.fetch(
        "SELECT district, COUNT(*) as cnt FROM hospitals GROUP BY district ORDER BY district"
    )
    return [{"district": r["district"], "count": r["cnt"]} for r in rows]

# ── 궁합 계산 (무료 — 1개) ────────────────────────────
@app.post("/api/compatibility", response_model=CompatibilityOut)
async def calc_compatibility(req: CompatibilityRequest, db = Depends(get_db)):
    # 병원 조회
    hospital = await db.fetchrow(
        """SELECT id, name, address, district, phone, specialties,
                  institution_type, doctor_count, license_date,
                  naver_map_url, coord_x, coord_y
           FROM hospitals WHERE id = $1""",
        req.hospital_id,
    )
    if not hospital:
        raise HTTPException(404, "병원을 찾을 수 없습니다.")

    # 생년월일 파싱
    try:
        bd = date.fromisoformat(req.birth_date)
    except ValueError:
        raise HTTPException(400, "생년월일 형식이 올바르지 않습니다. (YYYY-MM-DD)")

    # 음력 → 양력 변환 (필요 시 korean-lunar-calendar 사용)
    # 여기서는 양력 기준으로 처리 (음력 변환은 추후 추가)

    lic = hospital["license_date"]
    result = calculate_compatibility(
        birth_year=bd.year, birth_month=bd.month, birth_day=bd.day,
        birth_hour=req.birth_hour,
        license_year=lic.year, license_month=lic.month, license_day=lic.day,
        current_year=datetime.now().year,
    )

    elements = [
        ElementOut(
            name=ELEMENT_NAMES[i],
            color=ELEMENT_COLORS[i],
            customer_count=result.customer_elements[i],
            hospital_count=result.hospital_elements[i],
        )
        for i in range(5)
    ]

    return CompatibilityOut(
        total=result.total,
        grade=result.grade,
        grade_en=result.grade_en,
        summary=result.summary,
        breakdown=BreakdownOut(
            오행상생상극=result.element_score,
            천간합충=result.heavenly_score,
            지지합충형=result.earthly_score,
            일간관계=result.ilgan_score,
        ),
        elements=elements,
        best_months=result.best_months,
        avoid_months=result.avoid_months,
        element_relation=result.element_relation,
        hospital=_row_to_hospital(hospital),
    )

# ── Best 3 추천 (유료) ────────────────────────────────
@app.post("/api/compatibility/best3")
async def calc_best3(
    birth_date:  str,
    birth_hour:  Optional[int] = None,
    district:    str = Query(...),
    specialty:   str = Query(...),
    db = Depends(get_db),
):
    # TODO: 결제 검증 미들웨어 추가
    hospitals = await db.fetch(
        """SELECT id, name, address, district, phone, specialties,
                  institution_type, doctor_count, license_date,
                  naver_map_url, coord_x, coord_y
           FROM hospitals
           WHERE district = $1 AND specialties ILIKE $2""",
        district, f"%{specialty}%",
    )

    if not hospitals:
        raise HTTPException(404, "해당 조건의 병원이 없습니다.")

    bd = date.fromisoformat(birth_date)
    results = []

    for h in hospitals:
        lic = h["license_date"]
        r = calculate_compatibility(
            birth_year=bd.year, birth_month=bd.month, birth_day=bd.day,
            birth_hour=birth_hour,
            license_year=lic.year, license_month=lic.month, license_day=lic.day,
        )
        results.append({"hospital": _row_to_hospital(h), "score": r.total, "result": r})

    results.sort(key=lambda x: -x["score"])
    top3 = results[:3]

    return {
        "best3": [
            {
                "rank": i + 1,
                "hospital": t["hospital"],
                "total": t["score"],
                "grade": t["result"].grade,
                "best_months": t["result"].best_months,
                "summary": t["result"].summary,
            }
            for i, t in enumerate(top3)
        ]
    }

# ── 헬스체크 ───────────────────────────────────────────
@app.get("/health")
async def health():
    db_ok = app.state.pool is not None
    return {
        "status": "ok",
        "service": "뷰티궁합 API",
        "db": "connected" if db_ok else "disconnected",
        "db_error": app.state.db_error if not db_ok else None,
    }

# ── 유틸 ───────────────────────────────────────────────
def _row_to_hospital(r) -> HospitalOut:
    return HospitalOut(
        id=r["id"],
        name=r["name"],
        address=r["address"] or "",
        district=r["district"] or "",
        phone=r["phone"],
        specialties=r["specialties"],
        institution_type=r["institution_type"],
        doctor_count=r["doctor_count"] or 0,
        license_date=str(r["license_date"]),
        naver_map_url=r["naver_map_url"],
        coord_x=r["coord_x"],
        coord_y=r["coord_y"],
    )
