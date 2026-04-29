import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import type { IncomingMessage, ServerResponse } from "http";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 브라우저 클라이언트 (클라이언트 컴포넌트용)
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SSR 클라이언트 (getServerSideProps용)
export function createServerSupabaseClient(
  req: IncomingMessage & { cookies: Partial<Record<string, string>> },
  res: ServerResponse
) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return req.cookies[name];
      },
      set(name: string, value: string, options: CookieOptions) {
        const cookie = `${name}=${value}; Path=/; HttpOnly; SameSite=Lax${
          options?.maxAge ? `; Max-Age=${options.maxAge}` : ""
        }${options?.secure ? "; Secure" : ""}`;
        res.setHeader("Set-Cookie", cookie);
      },
      remove(name: string, options: CookieOptions) {
        const cookie = `${name}=; Path=/; Max-Age=0${
          options?.secure ? "; Secure" : ""
        }`;
        res.setHeader("Set-Cookie", cookie);
      },
    },
  });
}
