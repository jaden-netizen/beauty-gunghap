import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";

const RANK_BADGE = ["👑", "🥈", "🥉"];
const EL_SHORT = ["木", "火", "土", "金", "水"];
const EL_COLOR = ["#5A8C3A", "#C84830", "#B8924A", "#607090", "#3A6898"];

interface Top3Item {
  hospital: { id: number; name: string; address: string; specialties?: string };
  total: number;
  grade: string;
  hospital_elements: number[];
}

interface HistoryRecord {
  id: string;
  birth_date: string;
  birth_hour: number | null;
  district: string;
  specialty: string;
  results: Top3Item[];
  created_at: string;
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session.user);
      setLoading(false);
      fetchHistory();
    });
  }, []);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from("top3_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory(data ?? []);
    setHistLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const goToDetail = (item: Top3Item, record: HistoryRecord) => {
    const params = new URLSearchParams({
      hospital_id: String(item.hospital.id),
      birth_date: record.birth_date,
    });
    if (record.birth_hour !== null) params.append("birth_hour", String(record.birth_hour));
    router.push(`/analyze?${params}`);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  if (loading) return null;

  return (
    <>
      <Head>
        <title>마이페이지 — 뷰티궁합</title>
      </Head>

      <div className="min-h-screen px-4" style={{ background: "var(--cream)", paddingTop: "88px", paddingBottom: "48px" }}>
        <div className="max-w-lg mx-auto">

          {/* 헤더 */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="font-['Cormorant_Garamond'] italic text-[11px] tracking-[0.2em] mb-1" style={{ color: "var(--gold)" }}>
                My Page
              </p>
              <h1 className="font-['Noto_Serif_KR'] font-light text-[22px]" style={{ color: "var(--ink)" }}>
                마이페이지
              </h1>
            </div>
            <button
              onClick={handleSignOut}
              className="text-[12px] transition-colors"
              style={{ color: "var(--ink3)" }}
            >
              로그아웃
            </button>
          </div>

          {/* 계정 정보 */}
          <div className="bg-white rounded-sm px-6 py-5 mb-8"
            style={{ border: "0.5px solid var(--cream3)" }}>
            <p className="text-[10px] font-medium tracking-wide mb-1" style={{ color: "var(--ink3)" }}>이메일</p>
            <p className="text-[14px]" style={{ color: "var(--ink)" }}>{user?.email}</p>
          </div>

          {/* TOP3 히스토리 */}
          <div>
            <h2 className="font-['Noto_Serif_KR'] font-light text-[16px] mb-4" style={{ color: "var(--ink)" }}>
              TOP3 조회 히스토리
            </h2>

            {histLoading ? (
              <div className="text-center py-10 text-[13px]" style={{ color: "var(--ink3)" }}>
                불러오는 중...
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white rounded-sm px-6 py-10 text-center"
                style={{ border: "0.5px solid var(--cream3)" }}>
                <p className="text-[13px] mb-4" style={{ color: "var(--ink3)" }}>
                  아직 TOP3 조회 기록이 없어요
                </p>
                <button
                  onClick={() => router.push("/top3")}
                  className="btn-primary text-[13px]"
                >
                  TOP3 찾기 →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((record) => (
                  <div key={record.id} className="bg-white rounded-sm overflow-hidden"
                    style={{ border: "0.5px solid var(--cream3)" }}>

                    {/* 조회 정보 바 */}
                    <div className="px-5 py-3 flex items-center justify-between"
                      style={{ borderBottom: "0.5px solid var(--cream3)", background: "rgba(26,18,8,0.02)" }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-medium" style={{ color: "var(--ink2)" }}>
                          {record.district} · {record.specialty}
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--ink3)" }}>
                          {record.birth_date}생
                        </span>
                      </div>
                      <span className="text-[10px] flex-shrink-0 ml-2" style={{ color: "var(--ink3)" }}>
                        {formatDate(record.created_at)}
                      </span>
                    </div>

                    {/* TOP3 결과 */}
                    <div className="px-5 py-4 space-y-3">
                      {record.results.map((item, rank) => {
                        const hMaxEl = item.hospital_elements.indexOf(Math.max(...item.hospital_elements));
                        return (
                          <div key={item.hospital.id}
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => goToDetail(item, record)}>
                            <span className="text-lg leading-none flex-shrink-0">{RANK_BADGE[rank]}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate group-hover:underline"
                                style={{ color: "var(--ink)" }}>
                                {item.hospital.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded"
                                  style={{ background: `${EL_COLOR[hMaxEl]}14`, color: EL_COLOR[hMaxEl] }}>
                                  {EL_SHORT[hMaxEl]}
                                </span>
                                <span className="text-[11px]" style={{ color: "var(--ink3)" }}>
                                  {item.grade}
                                </span>
                              </div>
                            </div>
                            <span className="font-semibold text-[18px] flex-shrink-0" style={{ color: rank === 0 ? "var(--gold)" : "var(--ink2)" }}>
                              {item.total}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
