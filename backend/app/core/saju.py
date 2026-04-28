"""
뷰티궁합 — 사주 계산 엔진
만세력 기반 사주팔자 추출 + 오행 궁합 점수 계산
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Optional
import math

# ── 천간 (10개) ────────────────────────────────────────
HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
HEAVENLY_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]
# 0=목, 1=화, 2=토, 3=금, 4=수
HEAVENLY_YIN = [False, True, False, True, False, True, False, True, False, True]

# ── 지지 (12개) ────────────────────────────────────────
EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]
EARTHLY_ELEMENT  = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4]
EARTHLY_MONTH    = [11,12, 1, 2, 3, 4, 5, 6, 7, 8, 9,10]

ELEMENT_NAMES = ["목(木)", "화(火)", "토(土)", "금(金)", "수(水)"]
ELEMENT_COLORS = ["#5A8C3A", "#C84830", "#B8924A", "#607090", "#3A6898"]
ELEMENT_EN     = ["Wood", "Fire", "Earth", "Metal", "Water"]

# ── 오행 상생 / 상극 ────────────────────────────────────
# 상생: (생하는 오행, 생받는 오행)
SAMSAENG = {(0,1),(1,2),(2,3),(3,4),(4,0)}
# 상극: (극하는 오행, 극당하는 오행)
SAMGUK   = {(0,2),(1,3),(2,4),(3,0),(4,1)}

# ── 천간 합 / 충 ────────────────────────────────────────
HEAVENLY_HAP = [(0,5),(1,6),(2,7),(3,8),(4,9)]   # 갑기, 을경, 병신, 정임, 무계
HEAVENLY_CHUNG = [(0,6),(1,7),(2,8),(3,9),(4,5)] # 갑경, 을신, 병임, 정계, 무기

# ── 지지 합충형 ─────────────────────────────────────────
EARTHLY_SAMHAP = [{2,6,10},{5,9,1},{8,0,4},{11,3,7}]
EARTHLY_YUKHAP = [(0,1),(2,11),(3,10),(4,9),(5,8),(6,7)]
EARTHLY_CHUNG  = [(0,6),(1,7),(2,8),(3,9),(4,10),(5,11)]
EARTHLY_HYUNG  = [(2,5),(5,8),(8,2),(1,4),(4,7),(0,0),(3,3)]

# ── 월간 천간 시작 인덱스 ───────────────────────────────
MONTH_HEAVENLY_START = {0:2,1:2,2:4,3:4,4:6,5:6,6:8,7:8,8:0,9:0}

# ── 시지 매핑 ───────────────────────────────────────────
HOUR_EARTHLY_MAP = [
    (23,1,0),(1,3,1),(3,5,2),(5,7,3),(7,9,4),(9,11,5),
    (11,13,6),(13,15,7),(15,17,8),(17,19,9),(19,21,10),(21,23,11)
]

@dataclass
class Pillar:
    """사주 한 기둥 (천간 + 지지)"""
    heavenly: int  # 천간 인덱스 0~9
    earthly:  int  # 지지 인덱스 0~11

    @property
    def heavenly_name(self): return HEAVENLY_STEMS[self.heavenly]
    @property
    def earthly_name(self):  return EARTHLY_BRANCHES[self.earthly]
    @property
    def heavenly_element(self): return HEAVENLY_ELEMENT[self.heavenly]
    @property
    def earthly_element(self):  return EARTHLY_ELEMENT[self.earthly]
    @property
    def label(self): return f"{self.heavenly_name}{self.earthly_name}"

@dataclass
class Saju:
    """사주팔자"""
    year:  Pillar
    month: Pillar
    day:   Pillar
    hour:  Optional[Pillar] = None  # 병원은 None

    @property
    def pillars(self):
        p = [self.year, self.month, self.day]
        if self.hour: p.append(self.hour)
        return p

    @property
    def element_counts(self) -> list[int]:
        """오행 등장 횟수 [목, 화, 토, 금, 수]"""
        counts = [0] * 5
        for p in self.pillars:
            counts[p.heavenly_element] += 1
            counts[p.earthly_element]  += 1
        return counts

    @property
    def day_heavenly(self) -> int:
        return self.day.heavenly

@dataclass
class CompatibilityResult:
    """궁합 계산 결과"""
    total:           int
    element_score:   int   # /40
    heavenly_score:  int   # /20
    earthly_score:   int   # /20
    ilgan_score:     int   # /20
    grade:           str
    grade_en:        str
    summary:         str
    customer_elements: list[int]
    hospital_elements: list[int]
    best_months:     list[int]
    avoid_months:    list[int]
    element_relation: str  # "상생" | "상극" | "중립"

# ── 율리우스 적일 계산 ─────────────────────────────────
def _julian_day(year: int, month: int, day: int) -> int:
    a = (14 - month) // 12
    y = year + 4800 - a
    m = month + 12 * a - 3
    return (day + (153*m+2)//5 + 365*y
            + y//4 - y//100 + y//400 - 32045)

# ── 사주 추출 ──────────────────────────────────────────
def get_year_pillar(year: int) -> Pillar:
    return Pillar(
        heavenly=(year - 4) % 10,
        earthly =(year - 4) % 12,
    )

def get_month_pillar(year_heavenly: int, month: int) -> Pillar:
    start = MONTH_HEAVENLY_START[year_heavenly % 10]
    return Pillar(
        heavenly=(start + month - 1) % 10,
        earthly =[2,3,4,5,6,7,8,9,10,11,0,1][month-1],
    )

def get_day_pillar(year: int, month: int, day: int) -> Pillar:
    jdn = _julian_day(year, month, day)
    return Pillar(
        heavenly=(jdn + 9) % 10,
        earthly =(jdn + 1) % 12,
    )

def get_hour_pillar(day_heavenly: int, hour: int) -> Pillar:
    earthly = 0
    for start, end, idx in HOUR_EARTHLY_MAP:
        if start <= hour < end or (start == 23 and (hour >= 23 or hour < 1)):
            earthly = idx
            break
    start_h = {0:0,1:2,2:4,3:6,4:8,5:0,6:2,7:4,8:6,9:8}[day_heavenly]
    return Pillar(
        heavenly=(start_h + earthly) % 10,
        earthly =earthly,
    )

def build_saju(
    year: int, month: int, day: int,
    hour: Optional[int] = None
) -> Saju:
    yp = get_year_pillar(year)
    mp = get_month_pillar(yp.heavenly, month)
    dp = get_day_pillar(year, month, day)
    hp = get_hour_pillar(dp.heavenly, hour) if hour is not None else None
    return Saju(year=yp, month=mp, day=dp, hour=hp)

# ── 점수 계산 ──────────────────────────────────────────
def _hap_pairs(lst):
    return [tuple(sorted(x)) for x in lst]

def calc_element_score(c_counts: list, h_counts: list) -> int:
    score = 0
    hap = _hap_pairs(SAMSAENG)
    guk = _hap_pairs(SAMGUK)
    for c_e, c_cnt in enumerate(c_counts):
        for h_e, h_cnt in enumerate(h_counts):
            if c_cnt == 0 or h_cnt == 0: continue
            w = min(c_cnt, h_cnt)
            pair = tuple(sorted([c_e, h_e]))
            if pair in [tuple(sorted(x)) for x in SAMSAENG] or \
               pair in [tuple(sorted(x)) for x in SAMSAENG]:
                if (c_e,h_e) in SAMSAENG or (h_e,c_e) in SAMSAENG:
                    score += 8 * w
                elif c_e == h_e:
                    score += 5 * w
            elif (c_e,h_e) in SAMGUK:
                score -= 6 * w
            elif (h_e,c_e) in SAMGUK:
                score -= 8 * w
            elif c_e == h_e:
                score += 5 * w
    return max(0, min(40, 20 + score))

def calc_heavenly_score(c_saju: Saju, h_saju: Saju) -> int:
    score = 10
    hap   = [tuple(sorted(x)) for x in HEAVENLY_HAP]
    chung = [tuple(sorted(x)) for x in HEAVENLY_CHUNG]
    for cp in c_saju.pillars:
        for hp in h_saju.pillars:
            pair = tuple(sorted([cp.heavenly, hp.heavenly]))
            if pair in hap:   score += 3
            elif pair in chung: score -= 3
    return max(0, min(20, score))

def calc_earthly_score(c_saju: Saju, h_saju: Saju) -> int:
    score   = 10
    c_set   = set(p.earthly for p in c_saju.pillars)
    h_set   = set(p.earthly for p in h_saju.pillars)
    combined = c_set | h_set

    for group in EARTHLY_SAMHAP:
        if group.issubset(combined): score += 5

    for a, b in EARTHLY_YUKHAP:
        if (a in c_set and b in h_set) or (b in c_set and a in h_set):
            score += 3

    for a, b in EARTHLY_CHUNG:
        if (a in c_set and b in h_set) or (b in c_set and a in h_set):
            score -= 5

    for a, b in EARTHLY_HYUNG:
        if (a in c_set and b in h_set) or (b in c_set and a in h_set):
            score -= 2

    return max(0, min(20, score))

def calc_ilgan_score(c_day_h: int, h_day_h: int) -> int:
    pair  = tuple(sorted([c_day_h, h_day_h]))
    hap   = [tuple(sorted(x)) for x in HEAVENLY_HAP]
    chung = [tuple(sorted(x)) for x in HEAVENLY_CHUNG]
    c_e   = HEAVENLY_ELEMENT[c_day_h]
    h_e   = HEAVENLY_ELEMENT[h_day_h]

    if pair in hap:                   return 20
    if c_e == h_e:                    return 16
    if (c_e,h_e) in SAMSAENG or (h_e,c_e) in SAMSAENG: return 14
    if pair in chung:                 return 4
    if (c_e,h_e) in SAMGUK:          return 6
    if (h_e,c_e) in SAMGUK:          return 4
    return 10

def get_grade(score: int, relation: str = "중립") -> tuple[str, str]:
    # 천생연분은 상생 관계일 때만 가능
    if score >= 90 and relation == "상생": return "천생연분", "Destined"
    if score >= 75: return "매우 좋음", "Very Good"
    if score >= 60: return "좋음",     "Good"
    if score >= 45: return "보통",     "Average"
    return "주의",  "Caution"

def get_element_relation(c_counts: list, h_counts: list) -> str:
    c_main = c_counts.index(max(c_counts))
    h_main = h_counts.index(max(h_counts))
    if (c_main, h_main) in SAMSAENG or (h_main, c_main) in SAMSAENG:
        return "상생"
    if (c_main, h_main) in SAMGUK or (h_main, c_main) in SAMGUK:
        return "상극"
    return "중립"

# ── 월별 시술 추천 시기 ────────────────────────────────
def get_best_months(c_saju: Saju, h_saju: Saju, current_year: int) -> tuple[list, list]:
    year_h = get_year_pillar(current_year).heavenly
    hap    = [tuple(sorted(x)) for x in HEAVENLY_HAP]
    monthly_scores = []

    for month in range(1, 13):
        mp  = get_month_pillar(year_h, month)
        score = 0

        # 월간 천간 vs 고객 일간
        pair_c = tuple(sorted([mp.heavenly, c_saju.day_heavenly]))
        if pair_c in hap: score += 3

        # 월간 천간 vs 병원 일간
        pair_h = tuple(sorted([mp.heavenly, h_saju.day_heavenly]))
        if pair_h in hap: score += 3

        # 월지 vs 고객 일지 삼합/육합
        c_day_e = c_saju.day.earthly
        for group in EARTHLY_SAMHAP:
            if mp.earthly in group and c_day_e in group: score += 2
        for a, b in EARTHLY_YUKHAP:
            if (mp.earthly==a and c_day_e==b) or (mp.earthly==b and c_day_e==a):
                score += 2
        for a, b in EARTHLY_CHUNG:
            if (mp.earthly==a and c_day_e==b) or (mp.earthly==b and c_day_e==a):
                score -= 3

        monthly_scores.append((month, score))

    monthly_scores.sort(key=lambda x: -x[1])
    best  = [m for m, _ in monthly_scores[:3]]
    avoid = [m for m, _ in monthly_scores[-2:]]
    return sorted(best), sorted(avoid)

# ── 궁합 메인 함수 ─────────────────────────────────────
def calculate_compatibility(
    birth_year: int, birth_month: int, birth_day: int,
    birth_hour: Optional[int],
    license_year: int, license_month: int, license_day: int,
    current_year: int = 2025,
) -> CompatibilityResult:

    c_saju = build_saju(birth_year, birth_month, birth_day, birth_hour)
    h_saju = build_saju(license_year, license_month, license_day, None)

    c_elem = c_saju.element_counts
    h_elem = h_saju.element_counts

    s1 = calc_element_score(c_elem, h_elem)
    s2 = calc_heavenly_score(c_saju, h_saju)
    s3 = calc_earthly_score(c_saju, h_saju)
    s4 = calc_ilgan_score(c_saju.day_heavenly, h_saju.day_heavenly)

    total = s1 + s2 + s3 + s4
    relation = get_element_relation(c_elem, h_elem)

    # 상극 페널티: 주된 오행 강도에 따라 15~20점 차감, 최대 75점 캡
    if relation == "상극":
        c_main_idx = c_elem.index(max(c_elem))
        h_main_idx = h_elem.index(max(h_elem))
        strength = min(c_elem[c_main_idx], h_elem[h_main_idx])
        penalty = min(20, 14 + strength)  # strength 1→15, 2→16, ... 6→20
        total = min(75, max(0, total - penalty))

    grade, grade_en = get_grade(total, relation)
    best, avoid = get_best_months(c_saju, h_saju, current_year)

    c_main = ELEMENT_NAMES[c_elem.index(max(c_elem))]
    h_main = ELEMENT_NAMES[h_elem.index(max(h_elem))]
    best_str = "·".join(f"{m}월" for m in best)

    if relation == "상극":
        summary = (
            f"{c_main}이 강한 당신과 {h_main} 기운의 이 병원은 "
            f"상극 관계로 주의가 필요합니다. "
            f"시술 전 충분한 상담을 권장하며, {best_str}에는 상극의 영향이 다소 완화됩니다."
        )
    else:
        summary = (
            f"{c_main}이 강한 당신과 {h_main} 기운의 이 병원은 "
            f"{relation} 관계입니다. {best_str}이 최적 방문 시기예요."
        )

    return CompatibilityResult(
        total=total,
        element_score=s1,
        heavenly_score=s2,
        earthly_score=s3,
        ilgan_score=s4,
        grade=grade,
        grade_en=grade_en,
        summary=summary,
        customer_elements=c_elem,
        hospital_elements=h_elem,
        best_months=best,
        avoid_months=avoid,
        element_relation=relation,
    )
