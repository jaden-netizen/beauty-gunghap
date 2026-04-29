"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import CompatibilityResult from "@/components/features/CompatibilityResult";

type Step = "info" | "search" | "result";

const STEPS = [
  { id: "info",   label: "내 정보" },
  { id: "search", label: "병원 선택" },
  { id: "result", label: "궁합 결과" },
];

export default function AnalyzePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("info");

  // 폼 상태
  const [birthDate, setBirthDate]  = useState("");
  const [birthHour, setBirthHour]  = useState<string>("");
  const [birthType, setBirthType]  = useState<"양력" | "음력">("양력");
  const [gender, setGender]        = useState<"여성" | "남성">("여성");
  const [specialty, setSpecialty]  = useState<"피부과" | "성형외과">("피부과");

  // 병원 검색
  const [query, setQuery]          = useState("");
  const [hospitals, setHospitals]  = useState<any[]>([]);
  const [searching, setSearching]  = useState(false);

  // 결과
  const [result, setResult]        = useState<any>(null);
  const [loading, setLoading]      = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "https://beauty-gunghap-production.up.railway.app";

  // TOP3 페이지에서 hospital_id + birth_date 쿼리 파람으로 넘어온 경우 자동 계산
  useEffect(() => {
    if (!router.isReady) return;
    const { hospital_id, birth_date, birth_hour } = router.query;
    if (!hospital_id || !birth_date) return;

    const bd = birth_date as string;
    const bh = birth_hour as string | undefined;
    setBirthDate(bd);
    if (bh) setBirthHour(bh);
    setStep("search");
    calcCompatibilityDirect(parseInt(hospital_id as string), bd, bh ?? null);
  }, [router.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // TOP3에서 넘어올 때 사용하는 직접 계산 함수 (파람을 직접 받음)
  const calcCompatibilityDirect = async (hospitalId: number, bd: string, bh: string | null) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/compatibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birth_date:  bd,
          birth_hour:  bh ? parseInt(bh) : null,
          birth_type:  "양력",
          hospital_id: hospitalId,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
      setStep("result");
    } catch {
      alert("궁합 계산 중 오류가 발생했습니다.");
      setStep("info");
    } finally {
      setLoading(false);
    }
  };

  // 병원 검색
  const searchHospitals = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `${API}/api/hospitals/search?q=${encodeURIComponent(query)}&specialty=${encodeURIComponent(specialty)}&limit=10`
      );
      const data = await res.json();
      setHospitals(data);
    } catch {
      alert("병원 검색 중 오류가 발생했습니다.");
    } finally {
      setSearching(false);
    }
  };

  // 궁합 계산
  const calcCompatibility = async (hospitalId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/compatibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birth_date:  birthDate,
          birth_hour:  birthHour ? parseInt(birthHour) : null,
          birth_type:  birthType,
          hospital_id: hospitalId,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult(data);
      setStep("result");
    } catch {
      alert("궁합 계산 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh", paddingTop: "64px" }}>
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* 스텝 인디케이터 */}
        {step !== "result" && (
          <div className="flex items-center mb-10">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium transition-all"
                    style={{
                      background: i < stepIdx ? "var(--cream2)" : i === stepIdx ? "var(--gold)" : "white",
                      border: i < stepIdx ? "1px solid var(--gold)" : i === stepIdx ? "none" : "1px solid var(--cream3)",
                      color: i < stepIdx ? "var(--gold)" : i === stepIdx ? "white" : "var(--ink3)",
                    }}
                  >
                    {i < stepIdx ? "✓" : i + 1}
                  </div>
                  <span className="text-[10px]"
                    style={{ color: i === stepIdx ? "var(--gold)" : "var(--ink3)" }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2 mt-[-14px]"
                    style={{ background: i < stepIdx ? "var(--gold)" : "var(--cream3)" }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 1: 내 정보 ── */}
        {step === "info" && (
          <div className="fade-in-up">
            <h1 className="font-['Noto_Serif_KR'] text-xl font-light text-[var(--ink)] mb-1">
              내 정보를 입력해주세요
            </h1>
            <p className="text-[13px] text-[var(--ink3)] mb-8 leading-relaxed">
              생년월일시로 사주팔자를 뽑아요.<br />
              태어난 시간을 모르면 비워두세요.
            </p>

            {/* 음양력 */}
            <FormGroup label="음력 / 양력">
              <SegGroup
                options={["양력", "음력"]}
                value={birthType}
                onChange={(v) => setBirthType(v as any)}
              />
            </FormGroup>

            {/* 생년월일 + 시간 */}
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="생년월일">
                <input
                  type="date" value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="inp w-full"
                  style={inpStyle}
                />
              </FormGroup>
              <FormGroup label="태어난 시 (선택)">
                <input
                  type="number" min={0} max={23} placeholder="0~23"
                  value={birthHour}
                  onChange={(e) => setBirthHour(e.target.value)}
                  className="inp w-full"
                  style={inpStyle}
                />
              </FormGroup>
            </div>

            {/* 성별 */}
            <FormGroup label="성별">
              <SegGroup
                options={["여성", "남성"]}
                value={gender}
                onChange={(v) => setGender(v as any)}
              />
            </FormGroup>

            {/* 진료과목 */}
            <FormGroup label="진료과목">
              <div className="grid grid-cols-2 gap-3">
                {(["피부과", "성형외과"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpecialty(s)}
                    className="py-4 px-4 flex items-center gap-3 transition-all"
                    style={{
                      border: `1.5px solid ${specialty === s ? "var(--gold)" : "var(--cream3)"}`,
                      background: specialty === s ? "rgba(184,146,74,0.06)" : "white",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <span className="text-xl">{s === "피부과" ? "✨" : "💎"}</span>
                    <div className="text-left">
                      <div className="text-[13px] font-medium text-[var(--ink)]">{s}</div>
                      <div className="text-[10px] text-[var(--ink3)]">
                        {s === "피부과" ? "레이저·보톡스 등" : "쌍꺼풀·코 등"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </FormGroup>

            <button
              onClick={() => setStep("search")}
              disabled={!birthDate}
              className="btn-primary w-full justify-center mt-8"
              style={{ opacity: birthDate ? 1 : 0.4 }}
            >
              다음 단계 →
            </button>
          </div>
        )}

        {/* ── STEP 2: 병원 검색 ── */}
        {step === "search" && (
          <div className="fade-in-up">
            <button
              onClick={() => setStep("info")}
              className="text-[12px] text-[var(--ink3)] mb-6 flex items-center gap-1"
            >
              ← 이전
            </button>
            <h1 className="font-['Noto_Serif_KR'] text-xl font-light text-[var(--ink)] mb-1">
              궁합 볼 병원을 선택해요
            </h1>
            <p className="text-[13px] text-[var(--ink3)] mb-6">
              병원명 또는 지역으로 검색해보세요.
            </p>

            <div className="flex gap-2 mb-5">
              <input
                type="text"
                placeholder="예) 압구정 피부과, 강남 청담 등"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchHospitals()}
                className="flex-1"
                style={{ ...inpStyle, padding: "11px 14px" }}
              />
              <button
                onClick={searchHospitals}
                className="btn-primary px-5 text-[13px]"
              >
                {searching ? "…" : "검색"}
              </button>
            </div>

            <div className="space-y-2">
              {hospitals.map((h) => (
                <button
                  key={h.id}
                  onClick={() => calcCompatibility(h.id)}
                  disabled={loading}
                  className="w-full text-left p-4 bg-white transition-all"
                  style={{
                    border: "0.5px solid var(--cream3)",
                    borderRadius: "var(--radius-sm)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--cream3)")}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-[14px] font-medium text-[var(--ink)]">{h.name}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                      style={{
                        background: h.specialties?.includes("피부과") ? "#F0EBF8" : "#EBF3F8",
                        color: h.specialties?.includes("피부과") ? "#6B46A8" : "#2A6888",
                      }}
                    >
                      {h.specialties?.includes("피부과") ? "피부과" : "성형외과"}
                    </span>
                  </div>
                  <div className="flex gap-4 text-[11px] text-[var(--ink3)] flex-wrap">
                    <span>📍 {h.district}</span>
                    <span>🗓 {h.license_date} 개원</span>
                    <span>👨‍⚕️ 의사 {h.doctor_count}명</span>
                  </div>
                </button>
              ))}
              {!searching && hospitals.length === 0 && query && (
                <p className="text-center text-[13px] text-[var(--ink3)] py-10">
                  검색 결과가 없어요. 다른 키워드로 검색해보세요.
                </p>
              )}
            </div>

            {loading && (
              <div className="text-center py-12">
                <div className="font-['Cormorant_Garamond'] italic text-[var(--gold)] text-lg tracking-widest animate-pulse">
                  오행을 분석하는 중...
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: 결과 ── */}
        {step === "result" && result && (
          <div>
            <button
              onClick={() => setStep("search")}
              className="text-[12px] text-[var(--ink3)] mb-4 flex items-center gap-1"
            >
              ← 다시 검색
            </button>
            <CompatibilityResult result={result} />
          </div>
        )}

      </div>
    </main>
  );
}

// ── 공용 컴포넌트 ──
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

function SegGroup({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded overflow-hidden" style={{ border: "1px solid var(--cream3)" }}>
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className="flex-1 py-2.5 text-[13px] transition-all"
          style={{
            background: value === opt ? "rgba(184,146,74,0.08)" : "white",
            color: value === opt ? "var(--gold)" : "var(--ink2)",
            fontWeight: value === opt ? 500 : 300,
            borderRight: i < options.length - 1 ? "1px solid var(--cream3)" : "none",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const inpStyle: React.CSSProperties = {
  border: "1px solid var(--cream3)",
  borderRadius: "var(--radius-sm)",
  padding: "11px 14px",
  fontSize: "14px",
  fontFamily: "var(--font-sans)",
  color: "var(--ink)",
  background: "white",
  outline: "none",
  width: "100%",
};
