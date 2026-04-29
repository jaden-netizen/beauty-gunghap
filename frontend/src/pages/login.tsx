import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn } from "@/lib/auth";

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 1C4.582 1 1 3.91 1 7.5c0 2.368 1.523 4.44 3.822 5.617L4 15.5l3.323-1.717C7.872 13.923 8.428 14 9 14c4.418 0 8-2.91 8-6.5S13.418 1 9 1z"
        fill="#3A1D1D"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.push("/analyze");
  };

  const inputClass =
    "w-full px-4 py-3 text-sm rounded-sm text-[var(--ink)] placeholder:text-[var(--ink3)] bg-white transition-colors";
  const inputStyle = { border: "1px solid var(--cream3)" };

  return (
    <>
      <Head>
        <title>로그인 — 뷰티궁합</title>
      </Head>

      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: "var(--cream)" }}
      >
        <div
          className="w-full max-w-md bg-white rounded-sm px-10 py-12"
          style={{ boxShadow: "0 2px 40px rgba(0,0,0,0.06)", border: "0.5px solid var(--cream3)" }}
        >
          {/* 로고 */}
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.svg" alt="뷰티궁합" className="w-14 h-14 mb-4" />
            <h1
              className="font-['Noto_Serif_KR'] font-light text-[22px]"
              style={{ color: "var(--ink)" }}
            >
              다시 만나서 반가워요
            </h1>
          </div>

          {/* 소셜 로그인 */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <button
                disabled
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-sm text-[13px] font-medium cursor-not-allowed"
                style={{ background: "#FEE500", color: "#1A1208", opacity: 0.55 }}
              >
                <KakaoIcon />
                카카오로 로그인
              </button>
              <span className="absolute -top-2.5 right-3 text-[9px] font-medium bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full border border-gray-200">
                준비 중
              </span>
            </div>

            <div className="relative">
              <button
                disabled
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-sm text-[13px] font-medium cursor-not-allowed"
                style={{ background: "white", border: "1px solid #E0E0E0", color: "#3D3020", opacity: 0.55 }}
              >
                <GoogleIcon />
                구글로 로그인
              </button>
              <span className="absolute -top-2.5 right-3 text-[9px] font-medium bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full border border-gray-200">
                준비 중
              </span>
            </div>
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: "var(--cream3)" }} />
            <span className="text-[11px] tracking-wide" style={{ color: "var(--ink3)" }}>
              또는 이메일로 로그인
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--cream3)" }} />
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              required
              className={inputClass}
              style={inputStyle}
            />

            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
                className={inputClass}
                style={{ ...inputStyle, paddingRight: "44px" }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--ink3)" }}
              >
                <EyeIcon open={showPw} />
              </button>
            </div>

            {error && (
              <p className="text-[12px]" style={{ color: "var(--fire)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-1 text-[13px]"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* 하단 링크 */}
          <p className="text-center mt-6 text-[13px]" style={{ color: "var(--ink3)" }}>
            아직 계정이 없나요?{" "}
            <Link
              href="/signup"
              className="font-medium transition-colors"
              style={{ color: "var(--gold)" }}
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
