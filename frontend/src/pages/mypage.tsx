import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session.user);
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (loading) return null;

  return (
    <>
      <Head>
        <title>마이페이지 — 뷰티궁합</title>
      </Head>

      <div
        className="min-h-screen px-4 py-12"
        style={{ background: "var(--cream)", paddingTop: "88px" }}
      >
        <div className="max-w-md mx-auto">
          <h1
            className="font-['Noto_Serif_KR'] font-light text-[22px] mb-8"
            style={{ color: "var(--ink)" }}
          >
            마이페이지
          </h1>

          <div
            className="bg-white rounded-sm px-8 py-7 mb-4"
            style={{ border: "0.5px solid var(--cream3)" }}
          >
            <p className="text-[11px] font-medium tracking-wide mb-1" style={{ color: "var(--ink3)" }}>
              이메일
            </p>
            <p className="text-[15px]" style={{ color: "var(--ink)" }}>
              {user?.email}
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-3 text-[13px] rounded-sm transition-colors mt-4"
            style={{
              border: "1px solid var(--cream3)",
              color: "var(--ink3)",
              background: "white",
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}
