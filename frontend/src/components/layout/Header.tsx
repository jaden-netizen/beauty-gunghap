"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const isHome = router.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bg = isHome
    ? scrolled
      ? "rgba(14,11,26,0.92)"
      : "transparent"
    : "rgba(14,11,26,0.96)";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: bg,
        backdropFilter: scrolled || !isHome ? "blur(12px)" : "none",
        borderBottom: scrolled || !isHome ? "0.5px solid rgba(184,146,74,0.12)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex items-center">
          <img
            src="/logo-horizontal-dark.svg"
            alt="뷰티궁합"
            style={{ height: "38px", width: "auto" }}
          />
        </Link>

        {/* 네비 */}
        <nav className="hidden sm:flex items-center gap-7">
          {[
            { href: "/", label: "홈" },
            { href: "/analyze", label: "궁합 보기" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-[12px] tracking-wide transition-colors"
              style={{
                color: router.pathname === href ? "var(--gold)" : "rgba(255,255,255,0.55)",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link href="/analyze" className="btn-primary text-[12px] py-2.5 px-5">
          무료로 시작
        </Link>
      </div>
    </header>
  );
}
