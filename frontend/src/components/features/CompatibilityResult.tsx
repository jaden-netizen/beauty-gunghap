"use client";

import { useEffect, useRef, useState } from "react";

interface Element { name: string; color: string; customer_count: number; hospital_count: number; }
interface Hospital {
  name: string; address: string; district: string;
  phone?: string; specialties?: string; institution_type?: string;
  doctor_count: number; license_date: string; naver_map_url?: string;
}
interface Result {
  total: number; grade: string; grade_en: string; summary: string;
  breakdown: { 오행상생상극: number; 천간합충: number; 지지합충형: number; 일간관계: number; };
  elements: Element[];
  best_months: number[]; avoid_months: number[];
  element_relation: string; hospital: Hospital;
}

const MONTH_LABELS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const GRADE_EMOJI: Record<string, string> = {
  "천생연분": "🔴", "매우 좋음": "🟠", "좋음": "🟡", "보통": "🟢", "주의": "🔵"
};

// 원형 점수 게이지
function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circ * (1 - score / 100));
    }, 300);
    return () => clearTimeout(timer);
  }, [score, circ]);

  return (
    <div className="relative w-[120px] h-[120px] flex-shrink-0">
      <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="60" cy="60" r={r} fill="none"
          stroke="var(--gold)" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-['Noto_Sans_KR'] text-3xl font-semibold text-white leading-none">
          {score}
        </span>
        <span className="text-[10px] text-white/40 mt-0.5 tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

// 오행 막대 비교
function ElementBars({ elements }: { elements: Element[] }) {
  const max = 8;
  return (
    <div className="space-y-3">
      {elements.map((el) => (
        <div key={el.name} className="grid grid-cols-[28px_1fr_1fr_32px] gap-2 items-center">
          <span className="font-['Noto_Serif_KR'] text-sm text-center" style={{ color: el.color }}>
            {el.name.slice(0, 1)}
          </span>
          {/* 고객 */}
          <div>
            <div className="text-[9px] text-[var(--ink3)] mb-1">나</div>
            <div className="h-1.5 rounded-full bg-[var(--cream3)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(el.customer_count / max) * 100}%`, background: el.color }}
              />
            </div>
          </div>
          {/* 병원 */}
          <div>
            <div className="text-[9px] text-[var(--ink3)] mb-1">병원</div>
            <div className="h-1.5 rounded-full bg-[var(--cream3)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(el.hospital_count / max) * 100}%`, background: el.color, opacity: 0.5 }}
              />
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

// 월별 그리드
function MonthGrid({ best, avoid }: { best: number[]; avoid: number[] }) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {MONTH_LABELS.map((label, i) => {
        const m = i + 1;
        const isBest  = best.includes(m);
        const isAvoid = avoid.includes(m);
        return (
          <div
            key={m}
            className="aspect-square rounded flex flex-col items-center justify-center text-center"
            style={{
              background: isBest ? "#E8F4ED" : isAvoid ? "#FBF0F0" : "white",
              border: `0.5px solid ${isBest ? "#A8D4B8" : isAvoid ? "#E8B8B8" : "rgba(26,18,8,0.08)"}`,
            }}
          >
            <span
              className="text-[13px] font-medium leading-none"
              style={{ color: isBest ? "#2D6B46" : isAvoid ? "#8B3030" : "var(--ink)" }}
            >
              {m}
            </span>
            <span
              className="text-[8px] mt-0.5"
              style={{ color: isBest ? "#6AAC30" : isAvoid ? "#C84B4B" : "var(--ink3)" }}
            >
              {isBest ? "★ 최적" : isAvoid ? "주의" : "보통"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// 항목별 점수 카드
function BreakdownCard({ label, score, max }: { label: string; score: number; max: number }) {
  return (
    <div className="bg-white border border-[rgba(26,18,8,0.06)] rounded p-4">
      <div className="text-[11px] text-[var(--ink3)] mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-medium text-[var(--ink)]">{score}</span>
        <span className="text-[11px] text-[var(--ink3)]">/ {max}</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-[var(--cream3)]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(score / max) * 100}%`, background: "var(--gold)" }}
        />
      </div>
    </div>
  );
}

export default function CompatibilityResult({ result }: { result: Result }) {
  const { hospital, total, grade, summary, breakdown, elements, best_months, avoid_months } = result;
  const gradeEmoji = GRADE_EMOJI[grade] ?? "⚪";
  const bestStr = best_months.map((m) => `${m}월`).join("·");
  const avoidStr = avoid_months.map((m) => `${m}월`).join("·");

  return (
    <div className="max-w-lg mx-auto">

      {/* ── 헤더 ── */}
      <div
        className="relative overflow-hidden px-6 py-8"
        style={{ background: "var(--night2)" }}
      >
        {/* 장식 */}
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
            <div
              className="mt-4 pt-4 text-[12px] leading-[1.9] text-[var(--ink2)]"
              style={{ borderTop: "0.5px solid var(--cream3)" }}
            >
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

        {/* 항목별 점수 */}
        <div className="mt-6">
          <SectionTitle>항목별 점수</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <BreakdownCard label="오행 상생/상극" score={breakdown.오행상생상극} max={40} />
            <BreakdownCard label="천간 합·충"    score={breakdown.천간합충}    max={20} />
            <BreakdownCard label="지지 합·충·형" score={breakdown.지지합충형}  max={20} />
            <BreakdownCard label="일간 관계"      score={breakdown.일간관계}    max={20} />
          </div>
        </div>

        {/* 시술 추천 시기 */}
        <div className="mt-6">
          <SectionTitle>2025년 시술 추천 시기</SectionTitle>
          <MonthGrid best={best_months} avoid={avoid_months} />
          <div
            className="mt-3 p-4 rounded text-[12px] leading-[1.9] text-[var(--ink2)]"
            style={{ background: "var(--cream2)" }}
          >
            <p>✅ <strong>{bestStr}</strong>이 가장 좋아요. 월간 기운이 상생을 이루어 시술 후 회복이 빠를 것으로 예상됩니다.</p>
            <p className="mt-1">⚠️ <strong>{avoidStr}</strong>은 피하는 것이 좋아요. 월지 충(衝)으로 예상치 못한 변수가 생길 수 있어요.</p>
          </div>
        </div>

        {/* 종합 해석 */}
        <div className="mt-6">
          <SectionTitle>종합 해석</SectionTitle>
          <div
            className="p-5 rounded text-[13px] leading-[2] text-[var(--ink2)] font-['Noto_Serif_KR'] font-light"
            style={{ background: "rgba(184,146,74,0.06)", border: "0.5px solid rgba(184,146,74,0.2)" }}
          >
            {summary}
          </div>
        </div>

        {/* 병원 정보 */}
        <div className="mt-6">
          <SectionTitle>병원 정보</SectionTitle>
          <div
            className="rounded overflow-hidden"
            style={{ border: "0.5px solid rgba(26,18,8,0.08)", background: "white" }}
          >
            {[
              { icon: "📍", label: "주소",   value: hospital.address },
              { icon: "📞", label: "전화",   value: hospital.phone || "정보 없음" },
              { icon: "🗓",  label: "개원일", value: hospital.license_date },
              { icon: "👨‍⚕️", label: "의료진", value: `의사 ${hospital.doctor_count}명 · ${hospital.institution_type || "의원"}` },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < arr.length - 1 ? "0.5px solid var(--cream3)" : "none" }}
              >
                <span className="text-sm w-5 text-center flex-shrink-0">{row.icon}</span>
                <span className="text-[11px] text-[var(--ink3)] w-14 flex-shrink-0">{row.label}</span>
                <span className="text-[13px] text-[var(--ink)]">{row.value}</span>
              </div>
            ))}
            {/* 네이버 맵 */}
            <a
              href={hospital.naver_map_url || `https://map.naver.com/v5/search/${encodeURIComponent(hospital.address + " " + hospital.name)}`}
              target="_blank"
              rel="noopener noreferrer"
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
            <button
              key={btn.label}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-[13px] text-[var(--ink2)] transition-colors"
              style={{ border: "0.5px solid var(--cream3)", borderRadius: "var(--radius-sm)", background: "white" }}
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>

        {/* 유료 CTA */}
        <div
          className="mt-5 p-6 rounded"
          style={{ background: "var(--night2)" }}
        >
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
