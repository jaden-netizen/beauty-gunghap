# 뷰티궁합 — Claude Code 프롬프트 모음

Claude Code 터미널에서 순서대로 사용하세요.
각 프롬프트는 독립적으로 사용 가능하며, 단계별로 진행합니다.

---

## 0. 프로젝트 초기 세팅

```
다음 구조로 뷰티궁합 프로젝트를 세팅해줘.

프로젝트명: beauty-gunghap
서비스: 사주 기반 병원(피부과·성형외과) 궁합 서비스

폴더 구조:
beauty-gunghap/
├── backend/
│   ├── app/
│   │   ├── main.py          (FastAPI 진입점)
│   │   ├── core/
│   │   │   └── saju.py      (사주 계산 엔진)
│   │   ├── api/             (라우터)
│   │   └── models/          (DB 모델)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      (Header, Footer)
│   │   │   └── features/    (HeroSection, CompatibilityResult 등)
│   │   ├── pages/
│   │   ├── styles/
│   │   └── lib/
│   ├── package.json
│   └── next.config.js
└── scripts/
    └── preprocess_hospitals.py

그 다음 아래 파일들을 내가 제공하는 코드로 채워줘:
- backend/app/core/saju.py
- backend/app/main.py
- frontend/src/styles/globals.css
- frontend/src/components/layout/Header.tsx
- frontend/src/components/features/HeroSection.tsx
- frontend/src/components/features/CompatibilityResult.tsx
- frontend/src/pages/analyze.tsx
- scripts/preprocess_hospitals.py
```

---

## 1. DB 세팅 및 CSV 적재

```
PostgreSQL에 뷰티궁합 DB를 세팅하고 병원 데이터를 적재해줘.

1. PostgreSQL 데이터베이스 beauty_gunghap 생성
2. 아래 스키마로 hospitals 테이블 생성:

CREATE TABLE hospitals (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  license_date    DATE NOT NULL,
  address         VARCHAR(300),
  district        VARCHAR(20),
  zip_code        VARCHAR(10),
  phone           VARCHAR(30),
  institution_type VARCHAR(50),
  specialties     VARCHAR(200),
  doctor_count    INT DEFAULT 0,
  area            FLOAT,
  coord_x         FLOAT,
  coord_y         FLOAT,
  naver_map_url   VARCHAR(500),
  naver_place_id  VARCHAR(50),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hospitals_district    ON hospitals(district);
CREATE INDEX idx_hospitals_specialties ON hospitals(specialties);
CREATE INDEX idx_hospitals_license     ON hospitals(license_date);
CREATE INDEX idx_hospitals_name        ON hospitals USING gin(to_tsvector('simple', name));

3. scripts/preprocess_hospitals.py 실행해서 data/ 폴더의 CSV 파일들을 적재

실행 전에 .env 파일에 DB_URL=postgresql://user:password@localhost:5432/beauty_gunghap 형식으로 설정 필요하다고 알려줘.
```

---

## 2. 백엔드 서버 실행 및 API 테스트

```
FastAPI 백엔드 서버를 실행하고 기본 동작을 테스트해줘.

1. backend/ 폴더에서 pip install -r requirements.txt
2. uvicorn app.main:app --reload --port 8000 으로 서버 실행
3. 아래 API 엔드포인트가 정상 동작하는지 curl로 테스트:
   - GET /health
   - GET /api/districts
   - GET /api/hospitals/search?q=청담&specialty=피부과
   - POST /api/compatibility (생년월일 1990-05-15, 병원 id 1번)

오류가 있으면 수정해줘.
```

---

## 3. Next.js 프론트엔드 세팅

```
Next.js 14 App Router 기반으로 뷰티궁합 프론트엔드를 세팅해줘.

요구사항:
- TypeScript
- TailwindCSS
- Google Fonts: Cormorant Garamond, Noto Serif KR, Noto Sans KR
- next.config.js에 API URL 환경변수 설정

package.json dependencies:
- next: 14.x
- react: 18.x
- typescript
- tailwindcss
- @types/react, @types/node

.env.local:
NEXT_PUBLIC_API_URL=http://localhost:8000

tailwind.config.js에서 아래 CSS 변수를 safelist에 추가해줘:
--night, --night2, --gold, --gold2, --gold3, --cream, --cream2, --cream3, --ink, --ink2, --ink3, --wood, --fire, --earth, --metal, --water
```

---

## 4. 랜딩 페이지 구현

```
뷰티궁합 랜딩 페이지(/)를 구현해줘. 다음 섹션으로 구성:

디자인 방향:
- 메인 컬러: #0E0B1A (night), #B8924A (gold), #FAF6EE (cream)
- 폰트: Cormorant Garamond (영문 이탤릭), Noto Serif KR (한글 헤딩), Noto Sans KR (본문)
- 버튼: border-radius 2px (각진 스타일)
- 전체적으로 럭셔리 뷰티 브랜드 느낌

섹션 구성:
1. Hero — 다크(#0E0B1A) 배경, 파티클 캔버스 애니메이션(오행 한자 木火土金水 떠다니기), 메인 헤딩, CTA 2개
2. Feature — 크림 배경, 3개 카드 (사주 오행 분석 / 시술 최적 시기 / Best 3 추천)
3. How it Works — 3단계 프로세스 (내 정보 입력 → 병원 검색 → 궁합 결과)
4. Result Preview — 샘플 결과 카드 미리보기 (점수 82점, 강남 청담피부과의원, best months 3·7·11월)
5. FAQ — 아코디언, 4개 항목
6. Footer — 로고·태그라인, 링크, 카피라이트

스크롤 시 각 섹션 fade-in 애니메이션 추가 (Intersection Observer 사용).
```

---

## 5. 로그인 / 회원가입 페이지

```
뷰티궁합 로그인·회원가입 페이지를 구현해줘. Supabase Auth 기반.

설치: npm install @supabase/supabase-js @supabase/ssr

.env.local에 추가:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

구현할 파일:
- src/lib/supabase.ts (클라이언트 초기화)
- src/pages/login.tsx
- src/pages/signup.tsx
- src/pages/auth/callback.tsx

로그인 페이지 요소:
- 헤딩: "다시 만나서 반가워요" (Noto Serif KR)
- 카카오 버튼: background #FEE500, 카카오 버블 SVG 아이콘, provider='kakao'
- Google 버튼: white bg, 1px border #DADCE0, Google G SVG, provider='google'
- 구분선: "또는 이메일로 로그인"
- 이메일·비밀번호 입력
- Supabase signInWithOAuth, signInWithPassword 연동

회원가입 페이지:
- 헤딩: "뷰티궁합 시작하기"
- 카카오·구글 소셜 로그인 동일
- 이메일·비밀번호·비밀번호확인
- 가입 후 /analyze 리다이렉트

전체 디자인은 랜딩 페이지와 동일한 브랜드 톤 유지.
```

---

## 6. 유료 Best 3 기능 + 토스페이먼츠 결제

```
Best 3 병원 추천 유료 기능과 토스페이먼츠 결제를 연동해줘.

1. 토스페이먼츠 SDK 설치: npm install @tosspayments/payment-sdk

2. /best3 페이지 구현:
   - 사용자 정보 (이미 입력했으면 재사용, 아니면 입력)
   - 구(district) 선택 드롭다운 (DB에서 가져오기)
   - 진료과목 선택 (피부과/성형외과)
   - 가격 표시: ₩3,900
   - "결제하고 Best 3 보기" 버튼

3. 토스페이먼츠 결제 플로우:
   - 결제 요청 → 토스 결제창 → 성공 콜백 → /best3/result 페이지
   - 결제 성공 시 백엔드 /api/compatibility/best3 호출
   - 결과 캐싱 (같은 조건 재조회 방지)

4. /best3/result 페이지:
   - 1위·2위·3위 병원 카드 (점수, 등급, 추천 시기 포함)
   - 각 병원마다 상세 궁합 보기 / 네이버 맵 링크
   - 결과 공유 기능

.env.local:
NEXT_PUBLIC_TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key
```

---

## 7. 공유 카드 이미지 생성

```
궁합 결과를 카카오톡·인스타그램 스토리용 이미지로 생성하는 기능을 추가해줘.

방식: html2canvas 사용 (npm install html2canvas)

공유 카드 디자인:
- 크기: 1080x1920px (스토리 비율)
- 배경: var(--night2) #1E1830
- 상단: 뷰티궁합 로고 + "Beauty & Destiny"
- 중앙: 병원명, 점수 원형 게이지, 등급
- 오행 막대 차트
- 추천 시기: "3월·7월·11월이 최적 시기"
- 하단: "뷰티궁합에서 나의 병원 운을 확인해보세요"

구현:
1. ShareCard 컴포넌트 (숨겨진 div, 스크린 밖 렌더링)
2. "결과 공유" 버튼 클릭 시 html2canvas로 캡처
3. 이미지 다운로드 또는 카카오SDK로 공유

카카오 공유는 카카오 SDK 사용:
- 피드 공유: 이미지 + 텍스트 + 버튼("나도 궁합 보기")
```

---

## 8. 배포 세팅

```
뷰티궁합을 프로덕션 배포해줘.

프론트엔드 (Vercel):
1. vercel.json 생성
2. 환경변수 설정 가이드 작성
3. next.config.js 프로덕션 최적화 (이미지 도메인, API rewrites)

백엔드 (Railway 또는 Fly.io):
1. Dockerfile 생성:
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

2. railway.toml 또는 fly.toml 생성
3. DB는 Railway PostgreSQL 또는 Supabase DB 사용

CORS 설정:
- 프론트 도메인을 백엔드 CORS 허용 목록에 추가
- 환경변수 FRONTEND_URL로 관리

배포 후 체크리스트:
- [ ] /health 엔드포인트 응답 확인
- [ ] 병원 검색 동작 확인
- [ ] 궁합 계산 동작 확인
- [ ] 로그인 OAuth 콜백 URL 업데이트
```

---

## 9. 버그 수정 / 개선 (수시로 사용)

```
현재 뷰티궁합 코드에서 아래 문제를 수정해줘:

[문제 내용을 여기에 붙여넣기]

관련 파일: [파일 경로]
에러 메시지: [에러 내용]

수정 후 해당 기능이 정상 동작하는지 확인해줘.
```

---

## 10. FAQ 및 세부 디자인 개선 (스크린샷 첨부용)

```
첨부한 스크린샷을 보고 뷰티궁합 [해당 페이지/컴포넌트]를 개선해줘.

현재 상태: [스크린샷 첨부]
개선 방향:
- FAQ 아코디언 chevron 회전 애니메이션 (200ms)
- 답변 내용 모두 채우기
- 섹션 간 여백 통일 (py-20)
- 푸터 디자인 현재 톤 유지하면서 링크 hover 색상 var(--gold)로 변경

브랜드 컬러 및 폰트는 기존 디자인 시스템 유지.
```
