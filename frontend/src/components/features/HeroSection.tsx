"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 배경 파티클 애니메이션
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // 오행 상징 파티클
    const symbols = ["木", "火", "土", "金", "水", "☽", "✦", "◈"];
    const colors  = [
      "rgba(90,140,58,0.12)",
      "rgba(200,72,48,0.10)",
      "rgba(184,146,74,0.14)",
      "rgba(96,112,144,0.10)",
      "rgba(58,104,152,0.10)",
      "rgba(200,184,240,0.08)",
    ];

    const particles = Array.from({ length: 28 }, () => ({
      x:    Math.random() * canvas.width,
      y:    Math.random() * canvas.height,
      vx:   (Math.random() - 0.5) * 0.3,
      vy:   (Math.random() - 0.5) * 0.2,
      size: 10 + Math.random() * 14,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      color:  colors[Math.floor(Math.random() * colors.length)],
      font:   "'Noto Serif KR', serif",
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.font = `300 ${p.size}px ${p.font}`;
        ctx.fillStyle = p.color;
        ctx.fillText(p.symbol, p.x, p.y);
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -30) p.x = canvas.width + 30;
        if (p.x > canvas.width + 30) p.x = -30;
        if (p.y < -30) p.y = canvas.height + 30;
        if (p.y > canvas.height + 30) p.y = -30;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--night)" }}
    >
      {/* 파티클 캔버스 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* 장식 원 */}
      <div
        className="absolute top-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ border: "0.5px solid rgba(184,146,74,0.08)" }}
      />
      <div
        className="absolute top-[-20px] right-[-20px] w-[260px] h-[260px] rounded-full pointer-events-none"
        style={{ border: "0.5px solid rgba(184,146,74,0.06)" }}
      />
      <div
        className="absolute bottom-[-100px] left-[-60px] w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{ border: "0.5px solid rgba(200,184,240,0.05)" }}
      />

      {/* 콘텐츠 */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* 메인 헤딩 */}
        <h1
          className="font-['Noto_Serif_KR'] font-light leading-[1.5] mb-4 fade-in-up delay-1"
          style={{ color: "white", fontSize: "clamp(22px, 3.5vw, 34px)" }}
        >
          예쁜 결과는 좋은 인연에서 시작돼요
          <br />
          <em
            className="not-italic font-normal"
            style={{ color: "var(--gold2)" }}
          >
            나와 궁합이 맞는 병원, 지금 찾아보세요
          </em>
        </h1>

        {/* 구분선 */}
        <div
          className="w-10 h-px mx-auto my-6 fade-in-up delay-2"
          style={{ background: "var(--gold)", opacity: 0.5 }}
        />

        {/* 서브 텍스트 */}
        <p
          className="text-sm font-light leading-[2] mb-10 fade-in-up delay-2"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          시술 결과는 병원 실력만의 문제가 아닐 수 있어요.
          <br />
          이제 나와 궁합이 맞는 병원을 확인하고 시술받아 보세요!
        </p>

        {/* CTA 버튼 */}
        <div className="flex flex-col gap-3 items-center fade-in-up delay-3 w-[300px] mx-auto">
          <Link href="/analyze" className="btn-primary text-[13px] w-full text-center justify-center">
            무료로 병원과의 궁합 보기
          </Link>
          <Link href="/top3" className="btn-secondary text-[13px] w-full text-center justify-center">
            나와 궁합이 좋은 병원 3곳 찾기
          </Link>
        </div>

      </div>

      {/* 스크롤 다운 */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span
          className="text-[10px] tracking-[0.2em] font-['Cormorant_Garamond'] italic"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          scroll
        </span>
        <div
          className="w-px h-8"
          style={{ background: "linear-gradient(to bottom, rgba(184,146,74,0.4), transparent)" }}
        />
      </div>
    </section>
  );
}
