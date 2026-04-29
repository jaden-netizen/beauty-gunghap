"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const isHome = router.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const bg = isHome
    ? scrolled
      ? "rgba(14,11,26,0.92)"
      : "transparent"
    : "rgba(14,11,26,0.96)";

  const avatarLetter = user?.email?.[0]?.toUpperCase() ?? "?";

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

        {/* 우측 영역 */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* 아바타 */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium"
              style={{
                background: "rgba(184,146,74,0.15)",
                border: "0.5px solid var(--gold)",
                color: "var(--gold)",
              }}
              title={user.email}
            >
              {avatarLetter}
            </div>
            {/* 로그아웃 */}
            <button
              onClick={handleSignOut}
              className="text-[12px] tracking-wide transition-colors"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="transition-colors"
              style={{
                padding: "7px 20px",
                borderRadius: "2px",
                fontSize: "13px",
                fontWeight: 400,
                background: "transparent",
                border: `1px solid ${scrolled ? "rgba(184,146,74,0.5)" : "rgba(184,146,74,0.4)"}`,
                color: scrolled ? "var(--gold)" : "var(--gold2)",
              }}
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="transition-colors"
              style={{
                padding: "7px 20px",
                borderRadius: "2px",
                fontSize: "13px",
                fontWeight: 400,
                background: "var(--gold)",
                border: "none",
                color: "white",
              }}
            >
              회원가입
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
