import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import HeroSection from "@/components/features/HeroSection";

/* ── Intersection Observer 훅 ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── 섹션 타이틀 ── */
function SectionLabel({ en, ko, dark = false }: { en: string; ko: string; dark?: boolean }) {
  return (
    <div className="text-center mb-14">
      <p className="font-['Cormorant_Garamond'] italic text-[13px] tracking-[0.3em] mb-3" style={{ color: "var(--gold3)" }}>
        {en}
      </p>
      <h2 className="font-['Noto_Serif_KR'] font-light" style={{ color: dark ? "white" : "var(--ink)", fontSize: "clamp(22px,4vw,32px)" }}>
        {ko}
      </h2>
      <div className="w-8 h-px mx-auto mt-5" style={{ background: "var(--gold)", opacity: 0.45 }} />
    </div>
  );
}

/* ══════════════════════════════════════════
   SECTION 1.5 — Service Intro
══════════════════════════════════════════ */
const STATS = [
  { value: "8,842개", label: "병원" },
  { value: "서울 25개", label: "구" },
  { value: "100%", label: "사주 기반" },
];

function IntroSection() {
  const ref = useReveal();
  return (
    <section className="py-20 text-center" style={{ background: "var(--cream2)" }}>
      <div ref={ref} className="reveal max-w-2xl mx-auto px-6">
        <h2
          className="font-['Noto_Serif_KR'] font-bold leading-[1.6] mb-6"
          style={{ color: "var(--ink)", fontSize: "clamp(20px, 3vw, 26px)" }}
        >
          시술 잘 하는 병원은 많아요.
          <br />
          근데 왜 결과가 다를까요?
        </h2>

        <div className="w-8 h-px mx-auto mb-6" style={{ background: "var(--gold)", opacity: 0.5 }} />

        <p
          className="font-['Noto_Sans_KR'] font-light leading-[2.0] mb-12"
          style={{ color: "var(--ink2)", fontSize: "15px" }}
        >
          같은 시술도 병원과의 궁합이 맞아야 더 좋은 결과를 기대할 수 있어요.
          <br />
          뷰티궁합은 나와 궁합이 맞는 병원을 찾아드리는 서비스예요.
        </p>

        <div className="flex justify-center gap-10">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span
                className="font-['Noto_Serif_KR'] font-semibold"
                style={{ color: "var(--ink)", fontSize: "clamp(15px, 2vw, 18px)" }}
              >
                {s.value}
              </span>
              <span
                className="text-[12px] tracking-wide"
                style={{ color: "var(--ink3)" }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   SECTION 2 — Feature
══════════════════════════════════════════ */
const FEATURES = [
  { symbol: "木", color: "#5A8C3A", title: "사주 오행 분석", desc: "생년월일시로 뽑은 사주팔자의 목·화·토·금·수 기운을 분석해 병원의 오행과 비교합니다." },
  { symbol: "火", color: "#C84830", title: "시술 최적 시기",  desc: "월간 천간·지지와 일간의 합충 관계를 계산해 올해 12개월 중 가장 좋은 방문 시기를 알려드려요." },
  { symbol: "金", color: "#607090", title: "Best 3 추천",    desc: "내 지역 전체 병원과 궁합을 자동 계산해 나와 가장 잘 맞는 Top 3 병원을 추천해드립니다." },
];

function FeatureCard({ f, delay }: { f: typeof FEATURES[0]; delay: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${delay} p-8 rounded-sm`} style={{ background: "white", border: "0.5px solid var(--cream3)" }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6 font-['Noto_Serif_KR'] text-xl"
        style={{ background: `${f.color}18`, color: f.color, border: `0.5px solid ${f.color}30` }}>
        {f.symbol}
      </div>
      <h3 className="font-['Noto_Serif_KR'] text-[17px] font-normal mb-3" style={{ color: "var(--ink)" }}>{f.title}</h3>
      <p className="text-[13px] leading-[1.9]" style={{ color: "var(--ink3)" }}>{f.desc}</p>
    </div>
  );
}

function FeatureSection() {
  const ref = useReveal();
  return (
    <section className="py-28" style={{ background: "var(--cream)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div ref={ref} className="reveal"><SectionLabel en="Why Beauty-Gunghap" ko="왜 뷰티궁합인가요?" /></div>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} f={f} delay={`reveal-delay-${i + 1}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   SECTION 3 — How it Works
══════════════════════════════════════════ */
const STEPS = [
  { num: "01", title: "내 정보 입력", desc: "생년월일시와 관심 진료과목을 입력해요.", icon: "✍️" },
  { num: "02", title: "병원 검색",    desc: "병원명·지역으로 검색하거나 Best 3를 요청해요.", icon: "🔍" },
  { num: "03", title: "궁합 결과",    desc: "오행 분석·점수·추천 시기를 한눈에 확인해요.", icon: "✨" },
];

function StepCard({ s, delay }: { s: typeof STEPS[0]; delay: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${delay} text-center`}>
      <div className="w-20 h-20 rounded-full flex flex-col items-center justify-center mx-auto mb-6"
        style={{ border: "0.5px solid rgba(184,146,74,0.25)", background: "rgba(184,146,74,0.05)" }}>
        <span className="text-2xl mb-0.5">{s.icon}</span>
        <span className="font-['Cormorant_Garamond'] italic text-[10px] tracking-widest" style={{ color: "var(--gold3)" }}>{s.num}</span>
      </div>
      <h3 className="font-['Noto_Serif_KR'] text-[16px] font-normal text-white mb-3">{s.title}</h3>
      <p className="text-[13px] leading-[1.9]" style={{ color: "rgba(255,255,255,0.45)" }}>{s.desc}</p>
    </div>
  );
}

function HowItWorksSection() {
  const ref = useReveal();
  return (
    <section className="py-28" style={{ background: "var(--night)" }}>
      <div className="max-w-4xl mx-auto px-6">
        <div ref={ref} className="reveal"><SectionLabel en="How it Works" ko="3단계로 알아보는 나의 병원 운" dark /></div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-[33%] right-[33%] h-px"
            style={{ background: "linear-gradient(to right, rgba(184,146,74,0.1), rgba(184,146,74,0.35), rgba(184,146,74,0.1))" }} />
          {STEPS.map((s, i) => (
            <StepCard key={s.num} s={s} delay={`reveal-delay-${i + 1}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   SECTION 4 — Result Preview
══════════════════════════════════════════ */
function ResultPreviewSection() {
  const titleRef = useReveal();
  const cardRef  = useReveal();
  const score    = 82;
  const circ     = 2 * Math.PI * 52;
  const offset   = circ * (1 - score / 100);

  return (
    <section className="py-28" style={{ background: "var(--cream2)" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div ref={titleRef} className="reveal"><SectionLabel en="Sample Result" ko="이런 결과를 받아보실 수 있어요" /></div>
        <div ref={cardRef} className="reveal max-w-sm mx-auto">
          {/* 카드 헤더 */}
          <div className="px-6 py-7 relative overflow-hidden" style={{ background: "var(--night2)", borderRadius: "2px 2px 0 0" }}>
            <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full"
              style={{ border: "0.5px solid rgba(184,146,74,0.1)" }} />
            <p className="font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.2em] mb-1" style={{ color: "var(--gold3)" }}>
              Compatibility Result
            </p>
            <h3 className="font-['Noto_Serif_KR'] text-[17px] text-white mb-1">강남 청담피부과의원</h3>
            <p className="text-[12px] mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>서울 강남구 청담동 · 개원 2010-03-15</p>
            <div className="flex items-center gap-5">
              <div className="relative w-[100px] h-[100px] flex-shrink-0">
                <svg width="100" height="100" viewBox="0 0 120 120" className="-rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--gold)" strokeWidth="6"
                    strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold text-white leading-none">{score}</span>
                  <span className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>/ 100</span>
                </div>
              </div>
              <div>
                <div className="font-['Noto_Serif_KR'] text-[17px] text-white mb-2">🟡 좋음</div>
                <p className="text-[12px] leading-[1.8]" style={{ color: "rgba(255,255,255,0.5)" }}>
                  화(火)가 강한 당신과<br />토(土) 기운의 병원은<br />상생 관계입니다.
                </p>
              </div>
            </div>
          </div>
          {/* 카드 바디 */}
          <div className="px-6 py-6 bg-white" style={{ borderRadius: "0 0 2px 2px", border: "0.5px solid var(--cream3)" }}>
            <p className="text-[11px] font-medium tracking-wide mb-3" style={{ color: "var(--ink3)" }}>2025년 추천 방문 시기</p>
            <div className="grid grid-cols-6 gap-1 mb-5">
              {Array.from({ length: 12 }, (_, i) => {
                const m = i + 1;
                const best = [3, 7, 11].includes(m);
                const avoid = [9, 12].includes(m);
                return (
                  <div key={m} className="aspect-square rounded-sm flex flex-col items-center justify-center"
                    style={{ background: best ? "#E8F4ED" : avoid ? "#FBF0F0" : "var(--cream)", border: `0.5px solid ${best ? "#A8D4B8" : avoid ? "#E8B8B8" : "var(--cream3)"}` }}>
                    <span className="text-[12px] font-medium leading-none" style={{ color: best ? "#2D6B46" : avoid ? "#8B3030" : "var(--ink3)" }}>{m}</span>
                    <span className="text-[7px] mt-0.5" style={{ color: best ? "#6AAC30" : avoid ? "#C84B4B" : "var(--cream3)" }}>
                      {best ? "★" : avoid ? "△" : "·"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[12px] leading-[1.9]" style={{ color: "var(--ink2)" }}>
              ✅ <strong>3월·7월·11월</strong>이 최적 방문 시기예요.<br />
              ⚠️ <strong>9월·12월</strong>은 피하는 것이 좋아요.
            </p>
            <Link href="/analyze" className="btn-primary w-full justify-center mt-5 text-[13px]">
              내 궁합 확인하기 →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   SECTION 5 — FAQ
══════════════════════════════════════════ */
const FAQS = [
  { q: "병원 궁합이란 무엇인가요?", a: "생년월일시로 뽑은 사주팔자의 오행 기운과 병원 개원일의 오행 기운을 비교·분석해 두 기운이 얼마나 잘 어울리는지 점수로 나타낸 것입니다. 천간합충·지지합충형·일간 관계 등 전통 명리학 원리를 적용합니다." },
  { q: "음력 생년월일도 계산되나요?",  a: "네, 입력 시 음력/양력을 선택할 수 있습니다. 음력 날짜는 내부적으로 양력으로 변환 후 사주를 계산합니다." },
  { q: "결과는 얼마나 정확한가요?",   a: "뷰티궁합은 전통 만세력 기반으로 사주팔자를 정확하게 추출합니다. 다만 결과는 재미와 참고용으로 활용해 주시고, 최종 의료 결정은 전문가와 상담하시길 권장드립니다." },
  { q: "Best 3 추천은 어떻게 결정되나요?", a: "선택한 구(district)와 진료과목의 모든 병원을 대상으로 궁합 점수를 자동 계산해 상위 3개 병원을 추려드립니다. 오행·천간·지지·일간 4개 항목의 합산 점수로 순위를 정합니다." },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useReveal();
  return (
    <section className="py-28" style={{ background: "var(--cream)" }}>
      <div className="max-w-2xl mx-auto px-6">
        <div ref={ref} className="reveal"><SectionLabel en="FAQ" ko="자주 묻는 질문" /></div>
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <div key={i} className="rounded-sm overflow-hidden" style={{ border: "0.5px solid var(--cream3)", background: "white" }}>
              <button className="w-full text-left px-6 py-5 flex items-center justify-between gap-4" onClick={() => setOpen(open === i ? null : i)}>
                <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{f.q}</span>
                <span className="flex-shrink-0 text-lg transition-transform duration-200"
                  style={{ transform: open === i ? "rotate(45deg)" : "none", color: "var(--gold)" }}>+</span>
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-[13px] leading-[2]" style={{ color: "var(--ink2)", borderTop: "0.5px solid var(--cream3)" }}>
                  <p className="pt-4">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   SECTION 6 — Footer
══════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ background: "var(--night)", borderTop: "0.5px solid rgba(184,146,74,0.1)" }}>
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ border: "0.5px solid var(--gold)", background: "rgba(184,146,74,0.08)" }}>
                <span className="font-['Noto_Serif_KR'] text-[10px]" style={{ color: "var(--gold)" }}>궁</span>
              </div>
              <span className="font-['Cormorant_Garamond'] text-[17px] tracking-[0.08em] text-white">뷰티궁합</span>
            </div>
            <p className="font-['Cormorant_Garamond'] italic text-[13px] tracking-wide mb-1" style={{ color: "var(--gold3)" }}>Beauty &amp; Destiny</p>
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>사주로 찾는 나의 뷰티 파트너</p>
          </div>
          <div className="flex gap-16">
            {[
              { title: "서비스", links: [["무료 궁합", "/analyze"], ["Best 3 추천", "/"]] },
              { title: "정보",   links: [["개인정보처리방침", "/"], ["이용약관", "/"]] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-[11px] tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>{title}</p>
                <ul className="space-y-3">
                  {links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-[11px]"
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" }}>
          <span>© 2025 뷰티궁합. All rights reserved.</span>
          <span className="font-['Cormorant_Garamond'] italic tracking-wide">Beauty &amp; Destiny</span>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function HomePage() {
  return (
    <>
      <Head>
        <title>뷰티궁합 — 사주로 찾는 나의 피부과·성형외과</title>
        <meta name="description" content="사주팔자 오행으로 나와 인연이 깊은 피부과·성형외과를 찾아드립니다." />
      </Head>
      <main>
        <HeroSection />
        <IntroSection />
        <FeatureSection />
        <HowItWorksSection />
        <ResultPreviewSection />
        <FAQSection />
        <Footer />
      </main>
    </>
  );
}
