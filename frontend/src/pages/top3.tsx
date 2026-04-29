"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/router";

// ── 상수 ────────────────────────────────────────────────
const DISTRICTS = [
  "강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구",
  "노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구",
  "성동구","성북구","송파구","양천구","영등포구","용산구","은평구",
  "종로구","중구","중랑구",
];

const SIJUS = [
  { label: "자시(子時) 23~1시",  value: 0 },
  { label: "축시(丑時) 1~3시",   value: 1 },
  { label: "인시(寅時) 3~5시",   value: 3 },
  { label: "묘시(卯時) 5~7시",   value: 5 },
  { label: "진시(辰時) 7~9시",   value: 7 },
  { label: "사시(巳時) 9~11시",  value: 9 },
  { label: "오시(午時) 11~13시", value: 11 },
  { label: "미시(未時) 13~15시", value: 13 },
  { label: "신시(申時) 15~17시", value: 15 },
  { label: "유시(酉時) 17~19시", value: 17 },
  { label: "술시(戌時) 19~21시", value: 19 },
  { label: "해시(亥時) 21~23시", value: 21 },
];

const LOADING_TEXTS = [
  "사주를 분석하고 있어요...",
  "서울 병원들과 기운을 맞춰보고 있어요...",
  "당신과 가장 잘 맞는 병원을 찾았어요 ✨",
];

const EL_SHORT  = ["木","火","土","金","水"];
const EL_COLOR  = ["#5A8C3A","#C84830","#B8924A","#607090","#3A6898"];
const EL_TREAT  = ["재생·회복 시술","레이저·광선 시술","볼륨·필러 시술","정밀·조각 시술","수분·진정 시술"];

const RANK_BADGE = ["👑","🥈","🥉"];
const RANK_LABEL = ["1위","2위","3위"];
const RANK_ACCENT = ["#B8924A","#8090A0","#A06840"];

type Step = "form" | "loading" | "result";

interface HospitalInfo {
  id: number; name: string; address: string; district: string;
  phone?: string; specialties?: string; institution_type?: string;
  doctor_count: number; license_date: string;
}
interface Top3Item {
  hospital: HospitalInfo;
  total: number;
  grade: string;
  element_relation: string;
  customer_elements: number[];
  hospital_elements: number[];
  best_months: number[];
}

function getComment(item: Top3Item): string {
  const hMaxEl = item.hospital_elements.indexOf(Math.max(...item.hospital_elements));
  const el = EL_SHORT[hMaxEl];
  const treat = EL_TREAT[hMaxEl];
  if (item.total >= 90) return `${el} 기운이 당신과 완벽히 공명해요. ${treat}에서 최고의 결과를 기대해보세요.`;
  if (item.total >= 75) return `${el} 에너지가 당신의 기운을 북돋워줘요. ${treat}이 잘 맞을 거예요.`;
  if (item.total >= 60) return `${el} 기운과 좋은 인연이에요. 좋은 시기를 골라 방문해보세요.`;
  return `${el} 기운의 병원이에요. 시기와 컨디션을 잘 맞춰보세요.`;
}

// ── 컴포넌트 ────────────────────────────────────────────
export default function Top3Page() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const startTime = useRef<number>(0);

  // 폼 상태
  const [birthDate, setBirthDate]   = useState("");
  const [birthHour, setBirthHour]   = useState<number | null>(null);
  const [district, setDistrict]     = useState("");
  const [specialty, setSpecialty]   = useState<"피부과" | "성형외과" | "전체">("피부과");

  // 로딩 상태
  const [loadingIdx, setLoadingIdx] = useState(0);

  // 결과 상태
  const [top3, setTop3]               = useState<Top3Item[]>([]);
  const [totalCalc, setTotalCalc]     = useState(0);
  const [error, setError]             = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL ?? "https://beauty-gunghap-production.up.railway.app";

  const handleSubmit = async () => {
    if (!birthDate || !district) return;
    setError("");
    setStep("loading");
    setLoadingIdx(0);
    startTime.current = Date.now();

    const t1 = setTimeout(() => setLoadingIdx(1), 1800);
    const t2 = setTimeout(() => setLoadingIdx(2), 3500);

    try {
      const params = new URLSearchParams({ birth: birthDate, gu: district, type: specialty });
      if (birthHour !== null) params.append("hour", String(birthHour));

      const res = await fetch(`${API}/api/top3?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "서버 오류");
      }
      const data = await res.json();
      setTop3(data.top3);
      setTotalCalc(data.total_calculated);

      // 최소 4초 로딩 보장
      const elapsed = Date.now() - startTime.current;
      const delay = Math.max(0, 4000 - elapsed);
      setTimeout(() => {
        clearTimeout(t1); clearTimeout(t2);
        setStep("result");
      }, delay);
    } catch (e: any) {
      clearTimeout(t1); clearTimeout(t2);
      setError(e.message || "조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setStep("form");
    }
  };

  const goToDetail = (item: Top3Item) => {
    const params = new URLSearchParams({
      hospital_id: String(item.hospital.id),
      birth_date: birthDate,
    });
    if (birthHour !== null) params.append("birth_hour", String(birthHour));
    router.push(`/analyze?${params}`);
  };

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh", paddingTop: "64px" }}>
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* ── STEP 1: 입력 폼 ── */}
        {step === "form" && (
          <div className="fade-in-up">
            {/* 헤딩 */}
            <p className="font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.2em] mb-1"
              style={{ color: "var(--gold)" }}>
              Best 3 Hospitals
            </p>
            <h1 className="font-['Noto_Serif_KR'] text-2xl font-light text-[var(--ink)] mb-2">
              내 궁합 TOP3 병원
            </h1>
            <p className="text-[13px] text-[var(--ink3)] leading-relaxed mb-8">
              생년월일과 지역을 입력하면 가장 잘 맞는<br />
              병원 3곳을 찾아드려요.
            </p>

            {error && (
              <div className="mb-5 p-3 rounded text-[12px]"
                style={{ background: "#FBF0F0", color: "#8B3030", border: "0.5px solid #E8B8B8" }}>
                {error}
              </div>
            )}

            {/* 생년월일 */}
            <FormGroup label="생년월일">
              <input type="date" value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                style={inpStyle} />
            </FormGroup>

            {/* 태어난 시 */}
            <FormGroup label="태어난 시 (선택)">
              <select
                value={birthHour ?? ""}
                onChange={(e) => setBirthHour(e.target.value === "" ? null : Number(e.target.value))}
                style={inpStyle}
              >
                <option value="">모름 (시간 제외)</option>
                {SIJUS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormGroup>

            {/* 구 선택 */}
            <FormGroup label="지역 선택 (서울)">
              <div className="grid grid-cols-5 gap-1.5">
                {DISTRICTS.map((gu) => (
                  <button key={gu} onClick={() => setDistrict(gu)}
                    className="py-2 text-[11px] transition-all"
                    style={{
                      border: `1px solid ${district === gu ? "var(--gold)" : "var(--cream3)"}`,
                      background: district === gu ? "rgba(184,146,74,0.08)" : "white",
                      color: district === gu ? "var(--gold)" : "var(--ink2)",
                      fontWeight: district === gu ? 500 : 300,
                      borderRadius: "2px",
                    }}>
                    {gu.replace("구", "")}
                  </button>
                ))}
              </div>
            </FormGroup>

            {/* 병원 종류 */}
            <FormGroup label="병원 종류">
              <div className="flex rounded overflow-hidden" style={{ border: "1px solid var(--cream3)" }}>
                {(["피부과","성형외과","전체"] as const).map((opt, i, arr) => (
                  <button key={opt} onClick={() => setSpecialty(opt)}
                    className="flex-1 py-2.5 text-[13px] transition-all"
                    style={{
                      background: specialty === opt ? "rgba(184,146,74,0.08)" : "white",
                      color: specialty === opt ? "var(--gold)" : "var(--ink2)",
                      fontWeight: specialty === opt ? 500 : 300,
                      borderRight: i < arr.length - 1 ? "1px solid var(--cream3)" : "none",
                    }}>
                    {opt}
                  </button>
                ))}
              </div>
            </FormGroup>

            <button onClick={handleSubmit} disabled={!birthDate || !district}
              className="btn-primary w-full justify-center mt-8"
              style={{ opacity: birthDate && district ? 1 : 0.4, fontSize: "14px" }}>
              내 궁합 TOP3 찾기 →
            </button>
          </div>
        )}

        {/* ── STEP 2: 로딩 ── */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-24">
            {/* 골드 스피너 */}
            <div className="relative w-16 h-16 mb-10">
              <div className="absolute inset-0 rounded-full"
                style={{ border: "1.5px solid rgba(184,146,74,0.15)" }} />
              <div className="absolute inset-0 rounded-full animate-spin"
                style={{ border: "1.5px solid transparent", borderTopColor: "var(--gold)" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-['Cormorant_Garamond'] italic text-[18px]"
                  style={{ color: "var(--gold)" }}>美</span>
              </div>
            </div>

            {/* 순차 텍스트 */}
            <div className="h-8 flex items-center justify-center">
              {LOADING_TEXTS.map((text, i) => (
                <p key={i}
                  className="font-['Noto_Serif_KR'] text-[14px] text-center absolute transition-all duration-700"
                  style={{
                    color: "var(--ink2)",
                    opacity: i === loadingIdx ? 1 : 0,
                    transform: i === loadingIdx ? "translateY(0)" : "translateY(6px)",
                    pointerEvents: "none",
                  }}>
                  {text}
                </p>
              ))}
            </div>

            {/* 진행 도트 */}
            <div className="flex gap-2 mt-10">
              {LOADING_TEXTS.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                  style={{ background: i <= loadingIdx ? "var(--gold)" : "var(--cream3)" }} />
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: 결과 ── */}
        {step === "result" && top3.length > 0 && (
          <div className="fade-in-up">
            <p className="font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.2em] mb-1"
              style={{ color: "var(--gold)" }}>
              Best 3 Hospitals
            </p>
            <h1 className="font-['Noto_Serif_KR'] text-xl font-light text-[var(--ink)] mb-1">
              {district} 궁합 TOP3
            </h1>
            <p className="text-[12px] text-[var(--ink3)] mb-6">
              {specialty} {totalCalc}개 병원 중 당신과 가장 잘 맞는 곳이에요
            </p>

            <div className="space-y-3">
              {top3.map((item, rank) => {
                const hMaxEl = item.hospital_elements.indexOf(Math.max(...item.hospital_elements));
                const comment = getComment(item);
                const isFirst = rank === 0;

                return (
                  <div key={item.hospital.id} className="rounded overflow-hidden"
                    style={{
                      border: isFirst
                        ? "1px solid rgba(184,146,74,0.45)"
                        : "0.5px solid rgba(26,18,8,0.08)",
                      background: "white",
                    }}>

                    {/* 뱃지 바 */}
                    <div className="px-4 py-2.5 flex items-center gap-2"
                      style={{
                        background: isFirst ? "rgba(184,146,74,0.05)" : "rgba(26,18,8,0.02)",
                        borderBottom: "0.5px solid rgba(26,18,8,0.05)",
                      }}>
                      <span className="text-xl leading-none">{RANK_BADGE[rank]}</span>
                      <span className="font-['Cormorant_Garamond'] italic text-[13px] font-medium"
                        style={{ color: RANK_ACCENT[rank] }}>
                        {RANK_LABEL[rank]}
                      </span>
                      <div className="ml-auto flex items-baseline gap-1">
                        <span className="font-['Noto_Sans_KR'] text-2xl font-semibold"
                          style={{ color: isFirst ? "var(--gold)" : "var(--ink)" }}>
                          {item.total}
                        </span>
                        <span className="text-[10px] text-[var(--ink3)]">점</span>
                      </div>
                    </div>

                    {/* 본문 */}
                    <div className="px-4 pt-3 pb-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-['Noto_Serif_KR'] text-[15px] font-medium text-[var(--ink)]">
                          {item.hospital.name}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                          style={{
                            background: item.hospital.specialties?.includes("피부과") ? "#F0EBF8" : "#EBF3F8",
                            color: item.hospital.specialties?.includes("피부과") ? "#6B46A8" : "#2A6888",
                          }}>
                          {item.hospital.specialties?.includes("피부과") ? "피부과" : "성형외과"}
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--ink3)] mb-3">{item.hospital.address}</p>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded"
                          style={{ background: `${EL_COLOR[hMaxEl]}14`, color: EL_COLOR[hMaxEl] }}>
                          주오행 {EL_SHORT[hMaxEl]}
                        </span>
                        <span className="text-[11px] text-[var(--ink3)]">{item.grade}</span>
                        <span className="text-[11px] text-[var(--ink3)]">·</span>
                        <span className="text-[11px] text-[var(--ink3)]">개원 {item.hospital.license_date}</span>
                      </div>

                      <p className="text-[12px] text-[var(--ink2)] leading-relaxed mb-4">
                        {comment}
                      </p>

                      <button onClick={() => goToDetail(item)}
                        className="w-full py-2.5 text-[12px] font-medium transition-all"
                        style={{
                          border: isFirst ? "1px solid var(--gold)" : "0.5px solid var(--cream3)",
                          color: isFirst ? "var(--gold)" : "var(--ink2)",
                          background: "transparent",
                          borderRadius: "2px",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isFirst
                            ? "rgba(184,146,74,0.06)"
                            : "var(--cream)";
                        }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                        자세한 궁합 보기 →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 다시 찾기 */}
            <button
              onClick={() => { setStep("form"); setTop3([]); setError(""); }}
              className="w-full mt-4 py-3 text-[13px] text-[var(--ink3)] transition-colors"
              style={{ border: "0.5px solid var(--cream3)", background: "white", borderRadius: "2px" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--cream3)"; }}>
              ← 다시 찾기
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

// ── 공용 ────────────────────────────────────────────────
function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-[11px] font-medium tracking-wide text-[var(--ink2)] mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

const inpStyle: React.CSSProperties = {
  border: "1px solid var(--cream3)",
  borderRadius: "2px",
  padding: "11px 14px",
  fontSize: "14px",
  fontFamily: "var(--font-sans)",
  color: "var(--ink)",
  background: "white",
  outline: "none",
  width: "100%",
};
