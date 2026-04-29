"""
뷰티궁합 — 병원 CSV 전처리 스크립트
서울 25개 구 공공데이터 CSV → PostgreSQL 적재

사용법:
  1. data/ 폴더에 각 구 CSV 파일 모두 넣기
     예) data/강남구_의원_인허가정보.csv
         data/광진구_의원_인허가정보.csv ...
  2. pip install pandas psycopg2-binary python-dotenv tqdm
  3. .env 파일에 DB_URL 설정
  4. python preprocess_hospitals.py
"""

import os
import re
import glob
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
from tqdm import tqdm
from datetime import datetime

load_dotenv()

# ── 설정 ──────────────────────────────────────────────
DB_URL = os.getenv("DB_URL", "postgresql://user:password@localhost:5432/beauty_gunghap")

# 서비스 대상 진료과목
TARGET_SPECIALTIES = ["피부과", "성형외과"]

# CSV 컬럼 → DB 컬럼 매핑
COLUMN_MAP = {
    "사업장명":         "name",
    "인허가일자":       "license_date",
    "영업상태명":       "status",
    "상세영업상태명":   "status_detail",
    "폐업일자":         "closed_date",
    "전화번호":         "phone",
    "도로명주소":       "address",
    "소재지우편번호":   "zip_code",
    "의료기관종별명":   "institution_type",
    "의료인수":         "doctor_count",
    "총면적":           "area",
    "진료과목내용명":   "specialties",
    "좌표정보(X)":      "coord_x",
    "좌표정보(Y)":      "coord_y",
}

# ── 구 이름 추출 ──────────────────────────────────────
def extract_district(address: str) -> str:
    """도로명주소에서 구 이름 파싱"""
    if not isinstance(address, str):
        return ""
    match = re.search(r"서울특별시\s+(\S+구)", address)
    if match:
        return match.group(1)
    match = re.search(r"(\S+구)", address)
    return match.group(1) if match else ""

# ── 네이버 맵 URL 생성 ────────────────────────────────
def build_naver_map_url(name: str, address: str) -> str:
    """병원명 + 주소 기반 네이버 맵 검색 URL"""
    query = f"{address} {name}".strip()
    encoded = query.replace(" ", "+")
    return f"https://map.naver.com/v5/search/{encoded}"

# ── CSV 단일 파일 로드 ────────────────────────────────
def load_csv(filepath: str) -> pd.DataFrame:
    """인코딩 자동 감지 후 로드"""
    for enc in ["utf-8", "cp949", "euc-kr"]:
        try:
            df = pd.read_csv(filepath, encoding=enc, dtype=str, low_memory=False)
            print(f"  ✓ {os.path.basename(filepath)} ({enc}, {len(df)}행)")
            return df
        except (UnicodeDecodeError, Exception):
            continue
    raise ValueError(f"인코딩 감지 실패: {filepath}")

# ── 데이터 필터링 및 정제 ─────────────────────────────
def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    # 컬럼명 공백 제거
    df.columns = df.columns.str.strip()

    # 필요 컬럼만 선택 (존재하는 것만)
    available = {k: v for k, v in COLUMN_MAP.items() if k in df.columns}
    df = df[list(available.keys())].rename(columns=available)

    # 1. 영업 중인 곳만 (폐업·휴업 제외)
    if "status" in df.columns:
        df = df[df["status"].str.strip().str.contains("영업", na=False)]
    if "status_detail" in df.columns:
        df = df[~df["status_detail"].str.strip().str.contains("폐업|휴업", na=False)]
    if "closed_date" in df.columns:
        df = df[df["closed_date"].isna() | (df["closed_date"].str.strip() == "")]

    # 2. 피부과/성형외과 전문 병원만 (다른 진료과목 혼재 시 제외)
    if "specialties" in df.columns:
        allowed = set(TARGET_SPECIALTIES)
        def _is_beauty(x):
            specs = {s.strip() for s in x.split(",") if s.strip()}
            return bool(specs) and specs.issubset(allowed)
        mask = df["specialties"].fillna("").apply(_is_beauty)
        df = df[mask]
    else:
        print("  ⚠️  진료과목 컬럼 없음 — 전체 포함")

    # 3. 인허가일자 유효한 것만
    if "license_date" in df.columns:
        df["license_date"] = pd.to_datetime(
            df["license_date"], format="mixed", errors="coerce"
        )
        df = df[df["license_date"].notna()]

    # 4. 구 이름 파싱
    if "address" in df.columns:
        df["district"] = df["address"].apply(extract_district)
    else:
        df["district"] = ""

    # 5. 네이버 맵 URL
    df["naver_map_url"] = df.apply(
        lambda r: build_naver_map_url(
            r.get("name", ""), r.get("address", "")
        ), axis=1
    )

    # 6. 숫자형 변환
    for col in ["doctor_count"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)
    for col in ["area", "coord_x", "coord_y"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # 7. 불필요 컬럼 제거
    drop_cols = ["status", "status_detail", "closed_date"]
    df = df.drop(columns=[c for c in drop_cols if c in df.columns])

    # 8. 중복 제거 (병원명 + 주소 기준)
    df = df.drop_duplicates(subset=["name", "address"], keep="first")

    return df.reset_index(drop=True)

# ── DB 테이블 생성 ────────────────────────────────────
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS hospitals (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200)    NOT NULL,
    license_date    DATE            NOT NULL,
    address         VARCHAR(300),
    district        VARCHAR(20),
    zip_code        VARCHAR(10),
    phone           VARCHAR(30),
    institution_type VARCHAR(50),
    specialties     VARCHAR(200),
    doctor_count    INT             DEFAULT 0,
    area            FLOAT,
    coord_x         FLOAT,
    coord_y         FLOAT,
    naver_map_url   VARCHAR(500),
    naver_place_id  VARCHAR(50),
    created_at      TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_district   ON hospitals(district);
CREATE INDEX IF NOT EXISTS idx_hospitals_specialties ON hospitals(specialties);
CREATE INDEX IF NOT EXISTS idx_hospitals_license     ON hospitals(license_date);
CREATE INDEX IF NOT EXISTS idx_hospitals_name        ON hospitals USING gin(to_tsvector('simple', name));
"""

# ── DB 적재 ───────────────────────────────────────────
def insert_to_db(df: pd.DataFrame, conn):
    cur = conn.cursor()

    # 테이블 생성
    cur.execute(CREATE_TABLE_SQL)
    conn.commit()

    # 기존 데이터 초기화 (재실행 시)
    cur.execute("TRUNCATE TABLE hospitals RESTART IDENTITY;")

    # 컬럼 정의
    cols = [
        "name", "license_date", "address", "district", "zip_code",
        "phone", "institution_type", "specialties",
        "doctor_count", "area", "coord_x", "coord_y", "naver_map_url"
    ]

    rows = []
    for _, row in df.iterrows():
        rows.append(tuple(
            row.get(c, None) for c in cols
        ))

    insert_sql = f"""
        INSERT INTO hospitals ({', '.join(cols)})
        VALUES %s
        ON CONFLICT DO NOTHING
    """

    execute_values(cur, insert_sql, rows, page_size=500)
    conn.commit()
    cur.close()
    print(f"\n✅ DB 적재 완료: {len(rows)}개 병원")

# ── 통계 출력 ─────────────────────────────────────────
def print_stats(df: pd.DataFrame):
    print("\n── 전처리 결과 통계 ──────────────────────")
    print(f"  총 병원 수       : {len(df):,}개")
    print(f"  피부과           : {df['specialties'].str.contains('피부과', na=False).sum():,}개")
    print(f"  성형외과         : {df['specialties'].str.contains('성형외과', na=False).sum():,}개")
    print(f"\n  구별 분포 TOP 10:")
    top = df["district"].value_counts().head(10)
    for dist, cnt in top.items():
        print(f"    {dist:10s} {cnt:4d}개")
    print(f"\n  인허가일 범위    : {df['license_date'].min().date()} ~ {df['license_date'].max().date()}")
    print("──────────────────────────────────────────\n")

# ── 메인 ─────────────────────────────────────────────
def main():
    print("🏥 뷰티궁합 — 병원 데이터 전처리 시작\n")

    csv_files = glob.glob("data/*.csv")
    if not csv_files:
        print("❌ data/ 폴더에 CSV 파일이 없습니다.")
        print("   공공데이터포털에서 서울 각 구 CSV를 다운로드해 data/ 폴더에 넣어주세요.")
        return

    print(f"📂 CSV 파일 {len(csv_files)}개 발견\n")

    all_dfs = []
    for filepath in tqdm(csv_files, desc="파일 로딩"):
        try:
            df = load_csv(filepath)
            cleaned = clean_dataframe(df)
            all_dfs.append(cleaned)
        except Exception as e:
            print(f"  ⚠️  {filepath} 오류: {e}")

    if not all_dfs:
        print("❌ 처리된 데이터 없음")
        return

    final_df = pd.concat(all_dfs, ignore_index=True)
    final_df = final_df.drop_duplicates(subset=["name", "address"], keep="first")
    final_df = final_df.reset_index(drop=True)

    print_stats(final_df)

    # CSV 백업 저장
    out_path = f"data/hospitals_processed_{datetime.now().strftime('%Y%m%d')}.csv"
    final_df.to_csv(out_path, index=False, encoding="utf-8-sig")
    print(f"💾 CSV 백업: {out_path}")

    # DB 적재
    print("🔌 DB 연결 중...")
    try:
        conn = psycopg2.connect(DB_URL)
        insert_to_db(final_df, conn)
        conn.close()
    except Exception as e:
        print(f"❌ DB 연결 실패: {e}")
        print("   .env 파일의 DB_URL을 확인해주세요.")
        print("   CSV 백업 파일은 저장되었습니다.")

if __name__ == "__main__":
    main()
