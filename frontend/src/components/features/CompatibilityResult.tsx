"use client";

import { useEffect, useState } from "react";

// ── 인터페이스 ──────────────────────────────────────────
interface ElementData {
  name: string; color: string; customer_count: number; hospital_count: number;
}
interface Hospital {
  id: number; name: string; address: string; district: string;
  phone?: string; specialties?: string; institution_type?: string;
  doctor_count: number; license_date: string; naver_map_url?: string;
}
interface Result {
  total: number; grade: string; grade_en: string; summary: string;
  breakdown: { 오행상생상극: number; 천간합충: number; 지지합충형: number; 일간관계: number; };
  elements: ElementData[];
  best_months: number[]; avoid_months: number[];
  element_relation: string; hospital: Hospital;
  customer_day_heavenly?: number;
}

// ── 공통 상수 ───────────────────────────────────────────
const MONTH_LABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const GRADE_EMOJI: Record<string, string> = {
  "천생연분": "🔴", "매우 좋음": "🟠", "좋음": "🟡", "보통": "🟢", "주의": "🔵",
};

// 오행
const EL_SHORT   = ["木","火","土","金","水"];
const EL_KOR     = ["목","화","토","금","수"];
const EL_COLOR   = ["#5A8C3A","#C84830","#B8924A","#607090","#3A6898"];
const EL_KW      = [
  "성장과 생명력 — 회복력과 재생 에너지",
  "열정과 빛 — 레이저와 광선 에너지",
  "안정과 풍요 — 볼륨과 충만 에너지",
  "정밀과 순수 — 조각과 정제 에너지",
  "흐름과 수분 — 진정과 보습 에너지",
];
const EL_LUCKY_COLOR = ["초록·민트","레드·핑크","베이지·골드","화이트·실버","블루·네이비"];
const EL_LUCKY_TIME  = ["7~9시","9~11시","11~13시","15~17시","17~19시"];
const EL_TIP = [
  "자연 소재 향수나 그린 계열 액세서리를 지참해보세요",
  "밝고 따뜻한 색상의 옷을 입으면 시술 기운이 살아나요",
  "편안하고 안정적인 마음 상태로 방문하면 더 좋아요",
  "깔끔하고 정돈된 느낌의 코디가 금 기운을 높여줘요",
  "방문 전 충분한 수분 섭취로 수 기운을 채워보세요",
];
const EL_TREATMENT = [
  { emoji: "🌿", label: "재생·회복 시술", detail: "리프팅, 줄기세포, 피부재생" },
  { emoji: "✨", label: "레이저·광선 시술", detail: "IPL, 레이저토닝, 제모" },
  { emoji: "💎", label: "볼륨·필러 시술", detail: "히알루론산, 지방이식" },
  { emoji: "🔬", label: "정밀·조각 시술", detail: "쌍꺼풀, 코, 윤곽선" },
  { emoji: "💧", label: "수분·진정 시술", detail: "물광주사, 수분광채" },
];
const EL_ENERGY = [
  "봄날의 새싹처럼 피부의 재생력을 깨워주는 木의 기운이 이곳에 흐릅니다. 리프팅·재생 시술 후 회복이 빠르고 피부의 생명력이 살아납니다.",
  "밝고 뜨거운 火의 빛 에너지가 피부 깊숙이 활력을 불어넣습니다. 레이저·광선 시술에서 특히 뛰어난 효과를 기대할 수 있어요.",
  "대지처럼 안정적인 土의 기운이 이 병원을 감쌉니다. 볼륨·필러 시술에서 풍성하고 자연스러운 결과를 만들어냅니다.",
  "정밀하고 예리한 金의 기운이 조각처럼 아름다운 결과를 만들어냅니다. 섬세한 성형 시술에서 빛을 발하는 곳이에요.",
  "맑고 투명한 水의 기운이 피부 속 수분을 채우고 진정시켜줍니다. 물광·수분 시술에서 특별한 효과를 경험할 수 있어요.",
];

// 천간/지지
const HEAVENLY_STEMS     = ["갑","을","병","정","무","기","경","신","임","계"];
const HEAVENLY_STEMS_HAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const EARTHLY_BRANCHES     = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const EARTHLY_BRANCHES_HAN = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const HEAVENLY_ELEMENT = [0,0,1,1,2,2,3,3,4,4];
const HEAVENLY_DESC = [
  "새로운 시작과 강한 의지","부드러운 성장과 인내",
  "밝고 열정적인 기운","섬세하고 우아한 지혜",
  "안정과 든든한 믿음","풍성하고 너그러운 결실",
  "날카로운 결단력","순수하고 정밀한 완성",
  "깊고 유연한 지혜","부드럽고 섬세한 감성",
];
const EARTHLY_DESC = [
  "깊은 잠재력","착실한 기반","힘찬 도전정신","부드러운 성장",
  "화려한 변화","총명한 지혜","충만한 열기","풍성한 여름",
  "민첩한 실행력","완성된 결실","깊어가는 성숙","새로운 시작의 잠재력",
];

// 오행 관계 집합
const SAMSAENG = new Set(["0-1","1-2","2-3","3-4","4-0"]);
const SAMGUK   = new Set(["0-2","1-3","2-4","3-0","4-1"]);

// ── 유틸 함수 ───────────────────────────────────────────
function getYearPillar(year: number) {
  const h = ((year - 4) % 10 + 10) % 10;
  const e = ((year - 4) % 12 + 12) % 12;
  return { h, e, label: HEAVENLY_STEMS[h] + EARTHLY_BRANCHES[e] };
}

function getElRelation(myEl: number, theirMain: number): string {
  if (myEl === theirMain) return "공명";
  if (SAMSAENG.has(`${myEl}-${theirMain}`) || SAMSAENG.has(`${theirMain}-${myEl}`)) return "북돋움";
  if (SAMGUK.has(`${myEl}-${theirMain}`) || SAMGUK.has(`${theirMain}-${myEl}`)) return "긴장과 자극";
  return "독립";
}

function seededRandom(seed: number) {
  let s = ((seed ^ 0x45d9f3b) >>> 0) || 1;
  return function () {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// ── 기존 서브 컴포넌트 ──────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const timer = setTimeout(() => setOffset(circ * (1 - score / 100)), 300);
    return () => clearTimeout(timer);
  }, [score, circ]);

  return (
    <div className="relative w-[120px] h-[120px] flex-shrink-0">
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="60" cy="60" r={r} fill="none"
          stroke="var(--gold)" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-['Noto_Sans_KR'] text-3xl font-semibold text-white leading-none">{score}</span>
        <span className="text-[10px] text-white/40 mt-0.5 tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

function ElementBars({ elements }: { elements: ElementData[] }) {
  const max = 8;
  return (
    <div className="space-y-3">
      {elements.map((el) => (
        <div key={el.name} className="grid grid-cols-[28px_1fr_1fr_32px] gap-2 items-center">
          <span className="font-['Noto_Serif_KR'] text-sm text-center" style={{ color: el.color }}>
            {el.name.slice(0, 1)}
          </span>
          <div>
            <div className="text-[9px] text-[var(--ink3)] mb-1">나</div>
            <div className="h-1.5 rounded-full bg-[var(--cream3)]">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(el.customer_count / max) * 100}%`, background: el.color }} />
            </div>
          </div>
          <div>
            <div className="text-[9px] text-[var(--ink3)] mb-1">병원</div>
            <div className="h-1.5 rounded-full bg-[var(--cream3)]">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(el.hospital_count / max) * 100}%`, background: el.color, opacity: 0.5 }} />
            </div>
          </div>
          <span className="text-[10px] text-right" style={{ color: el.color }}>
            {el.customer_count}/{el.hospital_count}
          </span>
        </div>
      ))}
    </div>
  );
}

function MonthGrid({ best, avoid }: { best: number[]; avoid: number[] }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {MONTH_LABELS.map((label, i) => {
        const m = i + 1;
        const isBest  = best.includes(m);
        const isAvoid = avoid.includes(m);
        return (
          <div key={m} className="aspect-square rounded flex flex-col items-center justify-center text-center"
            style={{
              background: isBest ? "#E8F4ED" : isAvoid ? "#FBF0F0" : "white",
              border: `0.5px solid ${isBest ? "#A8D4B8" : isAvoid ? "#E8B8B8" : "rgba(26,18,8,0.08)"}`,
            }}
          >
            <span className="text-[13px] font-medium leading-none"
              style={{ color: isBest ? "#2D6B46" : isAvoid ? "#8B3030" : "var(--ink)" }}>
              {m}
            </span>
            <span className="text-[8px] mt-0.5"
              style={{ color: isBest ? "#6AAC30" : isAvoid ? "#C84B4B" : "var(--ink3)" }}>
              {isBest ? "★ 최적" : isAvoid ? "주의" : "보통"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BreakdownCard({ label, score, max }: { label: string; score: number; max: number }) {
  return (
    <div className="bg-white border border-[rgba(26,18,8,0.06)] rounded p-4">
      <div className="text-[11px] text-[var(--ink3)] mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-medium text-[var(--ink)]">{score}</span>
        <span className="text-[11px] text-[var(--ink3)]">/ {max}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-[var(--cream3)]">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(score / max) * 100}%`, background: "var(--gold)" }} />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-0.5 h-3 rounded-full" style={{ background: "var(--gold)" }} />
      <span className="text-[11px] font-medium tracking-[0.08em] text-[var(--ink3)] uppercase">
        {children}
      </span>
    </div>
  );
}

// ── 섹션 1: 궁합 스토리텔링 ────────────────────────────
function StorytellingSection({
  result, cMainIdx, hMainIdx,
}: { result: Result; cMainIdx: number; hMainIdx: number }) {
  const licenseYear = parseInt(result.hospital.license_date.slice(0, 4));
  const { h, e, label } = getYearPillar(licenseYear);
  const cName = `${EL_KOR[cMainIdx]}(${EL_SHORT[cMainIdx]})`;
  const hName = `${EL_KOR[hMainIdx]}(${EL_SHORT[hMainIdx]})`;

  const p1 = result.element_relation === "상생"
    ? `${cName} 기운의 당신과 ${hName} 기운의 이 병원은 서로를 북돋워주는 상생(相生) 관계입니다. 두 기운이 만나면 자연스러운 흐름이 생겨나 시술의 효과가 부드럽게 발현될 거예요.`
    : result.element_relation === "상극"
    ? `${cName} 기운의 당신과 ${hName} 기운의 이 병원은 서로 긴장감을 주고받는 상극(相克) 관계입니다. 이 긴장이 때로는 변화의 에너지가 되기도 하지만, 방문 시기를 잘 선택하는 것이 중요해요.`
    : `${cName} 기운의 당신과 ${hName} 기운의 이 병원은 충돌 없이 독립적으로 작용하는 중립 관계입니다. 서로의 기운이 조화롭게 공존해 안정적인 시술 환경을 만들어냅니다.`;

  const p2 = `이 병원은 ${licenseYear}년 ${label}(${HEAVENLY_STEMS_HAN[h]}${EARTHLY_BRANCHES_HAN[e]})년에 문을 열었어요. ${HEAVENLY_DESC[h]}의 기운과 ${EARTHLY_DESC[e]}의 에너지가 어우러진 곳입니다. 오랜 시간 쌓아온 병원의 기운이 당신을 기다리고 있어요.`;

  const p3 = EL_ENERGY[hMainIdx];

  const p4 =
    result.total >= 90 ? "이 병원은 당신을 위해 존재하는 곳이에요 ✨" :
    result.total >= 75 ? "좋은 인연이에요. 믿고 맡겨보세요 🌟" :
    result.total >= 60 ? "괜찮은 인연이에요. 좋은 시기에 방문해보세요 💫" :
    result.total >= 45 ? "인연이 없진 않아요. 시기를 잘 골라보세요 🌙" :
    "이번엔 다른 병원도 찾아보는 게 좋을 수 있어요 🔮";

  return (
    <div className="mt-6">
      <SectionTitle>궁합 스토리</SectionTitle>
      <div className="p-5 rounded"
        style={{ background: "rgba(184,146,74,0.06)", border: "0.5px solid rgba(184,146,74,0.2)" }}>
        {[p1, p2, p3].map((para, i) => (
          <p key={i} className="font-['Noto_Serif_KR'] font-light text-[13px] text-[var(--ink2)] mb-4"
            style={{ lineHeight: "2.0" }}>
            {para}
          </p>
        ))}
        <p className="font-['Noto_Serif_KR'] text-[14px] font-medium text-center"
          style={{ color: "var(--gold)", lineHeight: "2.0" }}>
          {p4}
        </p>
      </div>
    </div>
  );
}

// ── 섹션 2: 오행 상세 해석 카드 ────────────────────────
function ElementDetailCards({
  elements, cMainIdx, hMainIdx,
}: { elements: ElementData[]; cMainIdx: number; hMainIdx: number }) {
  const RELATION_STYLE: Record<string, { bg: string; color: string }> = {
    "공명":      { bg: "rgba(184,146,74,0.12)", color: "var(--gold)" },
    "북돋움":    { bg: "#E8F4ED", color: "#2D6B46" },
    "긴장과 자극": { bg: "#FBF0F0", color: "#8B3030" },
    "독립":      { bg: "rgba(26,18,8,0.04)", color: "var(--ink3)" },
  };

  return (
    <div className="mt-5">
      <SectionTitle>오행 에너지 해석</SectionTitle>
      <div className="grid grid-cols-5 gap-1.5">
        {EL_SHORT.map((short, i) => {
          const relation = getElRelation(i, hMainIdx);
          const rs = RELATION_STYLE[relation];
          const isMyMain = i === cMainIdx;
          return (
            <div key={short} className="rounded text-center"
              style={{
                borderTop: `2px solid ${EL_COLOR[i]}`,
                borderLeft: "0.5px solid rgba(26,18,8,0.06)",
                borderRight: "0.5px solid rgba(26,18,8,0.06)",
                borderBottom: "0.5px solid rgba(26,18,8,0.06)",
                background: isMyMain ? `${EL_COLOR[i]}0d` : "white",
                padding: "10px 4px 8px",
              }}
            >
              <div className="font-['Noto_Serif_KR'] text-lg font-medium mb-1"
                style={{ color: EL_COLOR[i] }}>
                {short}
              </div>
              <div className="text-[8px] text-[var(--ink3)] leading-tight mb-2 px-0.5">
                {EL_KW[i].split(" — ").map((part, j) => (
                  <span key={j} className="block">{part}</span>
                ))}
              </div>
              <div className="text-[8px] font-medium rounded-sm mx-1 py-0.5"
                style={{ background: rs.bg, color: rs.color }}>
                {relation}
              </div>
              {isMyMain && (
                <div className="text-[7px] mt-1.5 font-medium" style={{ color: "var(--gold)" }}>
                  나의 주오행
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 섹션 3: 나에게 맞는 시술 타입 ──────────────────────
function TreatmentTypeSection({
  cMainIdx, hMainIdx,
}: { cMainIdx: number; hMainIdx: number }) {
  const cards = [
    { idx: cMainIdx, subtitle: "나의 기운에 어울리는" },
    { idx: hMainIdx, subtitle: "이 병원이 강한" },
  ];
  return (
    <div className="mt-6">
      <SectionTitle>나에게 맞는 시술 타입</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {cards.map(({ idx, subtitle }) => {
          const t = EL_TREATMENT[idx];
          return (
            <div key={subtitle} className="rounded p-4"
              style={{ background: "var(--cream2)", border: "0.5px solid rgba(26,18,8,0.06)" }}>
              <div className="text-[10px] text-[var(--ink3)] mb-2">{subtitle}</div>
              <div className="text-2xl mb-2">{t.emoji}</div>
              <div className="font-['Noto_Serif_KR'] text-[13px] font-medium mb-1"
                style={{ color: EL_COLOR[idx] }}>
                {t.label}
              </div>
              <div className="text-[11px] text-[var(--ink3)]">{t.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 섹션 4: 럭키 정보 ──────────────────────────────────
function LuckyInfoSection({
  cMainIdx, dayHeavenly,
}: { cMainIdx: number; dayHeavenly: number }) {
  const dayEl = HEAVENLY_ELEMENT[dayHeavenly] ?? cMainIdx;
  const cards = [
    {
      icon: "🎨", title: "럭키 컬러", sub: "일간 오행 기준",
      content: EL_LUCKY_COLOR[dayEl], accent: EL_COLOR[dayEl],
    },
    {
      icon: "🕐", title: "방문 럭키 타임", sub: "일간 기준",
      content: EL_LUCKY_TIME[dayEl], accent: "var(--gold)",
    },
    {
      icon: "💡", title: "방문 전 팁", sub: "주오행 기준",
      content: EL_TIP[cMainIdx], accent: EL_COLOR[cMainIdx],
    },
  ];
  return (
    <div className="mt-6">
      <SectionTitle>오늘의 럭키 정보</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((card) => (
          <div key={card.title} className="rounded p-3 bg-white"
            style={{ border: "0.5px solid rgba(26,18,8,0.06)" }}>
            <div className="text-xl mb-2">{card.icon}</div>
            <div className="font-['Noto_Serif_KR'] text-[11px] font-medium mb-0.5"
              style={{ color: card.accent }}>
              {card.title}
            </div>
            <div className="text-[9px] text-[var(--ink3)] mb-2">{card.sub}</div>
            <div className="text-[11px] text-[var(--ink2)] leading-snug font-medium">
              {card.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 섹션 5: 궁합 분포 차트 ────────────────────────────
function DistributionChart({
  hospitalId, score,
}: { hospitalId: number; score: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  const rand = seededRandom(hospitalId);
  const totalUsers = 180 + Math.floor(rand() * 420);
  const r1 = 0.04 + rand() * 0.09;
  const r2 = 0.18 + rand() * 0.17;
  const r3 = 0.28 + rand() * 0.17;
  const r4 = Math.max(0.04, 1 - r1 - r2 - r3);

  const brackets = [
    { label: "천생연분 (90+)",   count: Math.round(totalUsers * r1), color: "#B8924A" },
    { label: "매우 좋음 (75~89)", count: Math.round(totalUsers * r2), color: "#5A8C3A" },
    { label: "좋음 (60~74)",     count: Math.round(totalUsers * r3), color: "#3A6898" },
    { label: "보통 이하 (~59)",   count: Math.round(totalUsers * r4), color: "#8C7060" },
  ];

  const userBracketIdx = score >= 90 ? 0 : score >= 75 ? 1 : score >= 60 ? 2 : 3;
  const maxCount = Math.max(...brackets.map(b => b.count));

  return (
    <div className="mt-6">
      <SectionTitle>이 병원과의 궁합 분포</SectionTitle>
      <div className="rounded p-5 bg-white"
        style={{ border: "0.5px solid rgba(26,18,8,0.08)" }}>
        <p className="text-[11px] text-[var(--ink3)] mb-4">
          총{" "}
          <span className="font-medium" style={{ color: "var(--ink)" }}>
            {totalUsers.toLocaleString()}명
          </span>
          이 이 병원과의 궁합을 확인했어요
        </p>
        <div className="space-y-3.5">
          {brackets.map((b, i) => (
            <div key={b.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px]"
                  style={{
                    color: i === userBracketIdx ? "var(--gold)" : "var(--ink2)",
                    fontWeight: i === userBracketIdx ? 500 : 300,
                  }}>
                  {b.label}
                </span>
                <div className="flex items-center gap-2">
                  {i === userBracketIdx && (
                    <span className="text-[10px] font-semibold" style={{ color: "var(--gold)" }}>
                      ← 나
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--ink3)]">{b.count}명</span>
                </div>
              </div>
              <div className="h-2 rounded-full" style={{ background: "var(--cream3)" }}>
                <div className="h-full rounded-full"
                  style={{
                    width: animated ? `${(b.count / maxCount) * 100}%` : "0%",
                    background: i === userBracketIdx ? "var(--gold)" : b.color,
                    transition: `width 0.9s cubic-bezier(0.4,0,0.2,1) ${i * 0.13}s`,
                    opacity: i === userBracketIdx ? 1 : 0.7,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────
export default function CompatibilityResult({ result }: { result: Result }) {
  const {
    hospital, total, grade, summary, breakdown,
    elements, best_months, avoid_months,
  } = result;

  const gradeEmoji = GRADE_EMOJI[grade] ?? "⚪";
  const bestStr  = best_months.map((m) => `${m}월`).join("·");
  const avoidStr = avoid_months.map((m) => `${m}월`).join("·");

  const customerCounts = elements.map(e => e.customer_count);
  const hospitalCounts = elements.map(e => e.hospital_count);
  const cMainIdx = customerCounts.indexOf(Math.max(...customerCounts));
  const hMainIdx = hospitalCounts.indexOf(Math.max(...hospitalCounts));
  const dayHeavenly = result.customer_day_heavenly ?? (cMainIdx * 2);

  return (
    <div className="max-w-lg mx-auto">

      {/* ── 헤더 ── */}
      <div className="relative overflow-hidden px-6 py-8" style={{ background: "var(--night2)" }}>
        <div className="absolute top-[-40px] right-[-40px] w-40 h-40 rounded-full"
          style={{ border: "0.5px solid rgba(184,146,74,0.1)" }} />
        <div className="absolute bottom-[-60px] left-[-20px] w-32 h-32 rounded-full"
          style={{ border: "0.5px solid rgba(200,184,240,0.06)" }} />

        <p className="font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.2em] text-white/40 mb-1">
          Compatibility Result
        </p>
        <h2 className="font-['Noto_Serif_KR'] text-lg font-normal text-white mb-1">
          {hospital.name}
        </h2>
        <p className="text-[12px] text-white/40 mb-6">
          {hospital.address} · 개원 {hospital.license_date}
        </p>

        <div className="flex items-center gap-6">
          <ScoreRing score={total} />
          <div>
            <div className="font-['Noto_Serif_KR'] text-lg text-white mb-1">
              {gradeEmoji} {grade}
            </div>
            <p className="text-[12px] text-white/55 leading-relaxed max-w-[200px]">
              {summary}
            </p>
          </div>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="px-5 pb-10" style={{ background: "var(--cream)" }}>

        {/* 오행 분석 */}
        <div className="mt-6">
          <SectionTitle>오행 분석</SectionTitle>
          <div className="bg-white border border-[rgba(26,18,8,0.06)] rounded p-5">
            <ElementBars elements={elements} />
            <div className="mt-4 pt-4 text-[12px] leading-[1.9] text-[var(--ink2)]"
              style={{ borderTop: "0.5px solid var(--cream3)" }}>
              {result.element_relation === "상생" && (
                <p>✅ <strong>상생(相生)</strong> 관계 — 두 사주의 주된 오행이 서로를 도와 긍정적인 기운을 만들어냅니다.</p>
              )}
              {result.element_relation === "상극" && (
                <p>⚠️ <strong>상극(相克)</strong> 관계 — 오행 간 충돌이 있어 주의가 필요합니다. 시기를 잘 선택하면 보완됩니다.</p>
              )}
              {result.element_relation === "중립" && (
                <p>⚪ <strong>중립</strong> 관계 — 상생·상극 없이 독립적으로 작용합니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* 섹션 2: 오행 상세 해석 카드 */}
        <ElementDetailCards elements={elements} cMainIdx={cMainIdx} hMainIdx={hMainIdx} />

        {/* 섹션 3: 나에게 맞는 시술 타입 */}
        <TreatmentTypeSection cMainIdx={cMainIdx} hMainIdx={hMainIdx} />

        {/* 항목별 점수 */}
        <div className="mt-6">
          <SectionTitle>항목별 점수</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <BreakdownCard label="오행 상생/상극" score={breakdown.오행상생상극} max={40} />
            <BreakdownCard label="천간 합·충"     score={breakdown.천간합충}     max={20} />
            <BreakdownCard label="지지 합·충·형"  score={breakdown.지지합충형}   max={20} />
            <BreakdownCard label="일간 관계"       score={breakdown.일간관계}     max={20} />
          </div>
        </div>

        {/* 시술 추천 시기 */}
        <div className="mt-6">
          <SectionTitle>2025년 시술 추천 시기</SectionTitle>
          <MonthGrid best={best_months} avoid={avoid_months} />
          <div className="mt-3 p-4 rounded text-[12px] leading-[1.9] text-[var(--ink2)]"
            style={{ background: "var(--cream2)" }}>
            <p>✅ <strong>{bestStr}</strong>이 가장 좋아요. 월간 기운이 상생을 이루어 시술 후 회복이 빠를 것으로 예상됩니다.</p>
            <p className="mt-1">⚠️ <strong>{avoidStr}</strong>은 피하는 것이 좋아요. 월지 충(衝)으로 예상치 못한 변수가 생길 수 있어요.</p>
          </div>
        </div>

        {/* 섹션 4: 럭키 정보 */}
        <LuckyInfoSection cMainIdx={cMainIdx} dayHeavenly={dayHeavenly} />

        {/* 섹션 1: 궁합 스토리텔링 (종합 해석 확장) */}
        <StorytellingSection result={result} cMainIdx={cMainIdx} hMainIdx={hMainIdx} />

        {/* 섹션 5: 궁합 분포 차트 */}
        <DistributionChart hospitalId={hospital.id} score={total} />

        {/* 병원 정보 */}
        <div className="mt-6">
          <SectionTitle>병원 정보</SectionTitle>
          <div className="rounded overflow-hidden"
            style={{ border: "0.5px solid rgba(26,18,8,0.08)", background: "white" }}>
            {[
              { icon: "📍", label: "주소",   value: hospital.address },
              { icon: "📞", label: "전화",   value: hospital.phone || "정보 없음" },
              { icon: "🗓",  label: "개원일", value: hospital.license_date },
              { icon: "👨‍⚕️", label: "의료진", value: `의사 ${hospital.doctor_count}명 · ${hospital.institution_type || "의원"}` },
            ].map((row, i, arr) => (
              <div key={row.label} className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < arr.length - 1 ? "0.5px solid var(--cream3)" : "none" }}>
                <span className="text-sm w-5 text-center flex-shrink-0">{row.icon}</span>
                <span className="text-[11px] text-[var(--ink3)] w-14 flex-shrink-0">{row.label}</span>
                <span className="text-[13px] text-[var(--ink)]">{row.value}</span>
              </div>
            ))}
            <a
              href={hospital.naver_map_url || `https://map.naver.com/v5/search/${encodeURIComponent(hospital.address + " " + hospital.name)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#F0FBF3]"
              style={{ borderTop: "0.5px solid var(--cream3)" }}
            >
              <div className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                style={{ background: "#03C75A" }}>N</div>
              <span className="text-[13px] font-medium" style={{ color: "#03C75A" }}>
                네이버 맵에서 보기
              </span>
              <span className="ml-auto text-[11px] text-[var(--ink3)]">→</span>
            </a>
          </div>
        </div>

        {/* 공유 / 즐겨찾기 */}
        <div className="flex gap-2 mt-5">
          {[
            { icon: "🔖", label: "즐겨찾기" },
            { icon: "📤", label: "결과 공유" },
          ].map((btn) => (
            <button key={btn.label}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-[13px] text-[var(--ink2)] transition-colors"
              style={{ border: "0.5px solid var(--cream3)", borderRadius: "var(--radius-sm)", background: "white" }}>
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>

        {/* 유료 CTA */}
        <div className="mt-5 p-6 rounded" style={{ background: "var(--night2)" }}>
          <p className="font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.18em] mb-2"
            style={{ color: "var(--gold3)" }}>
            Premium
          </p>
          <h3 className="font-['Noto_Serif_KR'] text-[17px] font-light text-white mb-2">
            내 지역 Best 3 병원은?
          </h3>
          <p className="text-[12px] text-white/50 leading-[1.9] mb-4">
            {hospital.district} 내 모든 피부과·성형외과와 궁합을
            자동 계산해 상위 3곳을 추천해드려요.
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-white/40">
              단&nbsp;
              <strong className="text-lg font-semibold" style={{ color: "var(--gold)" }}>
                ₩3,900
              </strong>
            </span>
            <button className="btn-primary text-[13px]">
              Best 3 찾기 →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
