"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";

export default function ConfirmPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleAuth = async () => {
      const hash = window.location.hash;

      if (hash.includes("error=")) {
        const params = new URLSearchParams(hash.replace("#", ""));
        const errorDesc = params.get("error_description") ?? "Link expired";
        router.push(`/login?error=${encodeURIComponent(errorDesc)}`);
        return;
      }

      if (hash.includes("access_token=")) {
        const params = new URLSearchParams(hash.replace("#", ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const type = params.get("type");

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            router.push("/login");
            return;
          }

          if (data.session?.user) {
            const { data: profile } = await supabase
              .from("Profile")
              .select("role")
              .eq("id", data.session.user.id)
              .single();

            if (type === "recovery" || profile?.role === "INSTITUTION") {
              router.push("/institution/reset-password");
            } else if (profile?.role === "ADMIN") {
              router.push("/admin");
            } else {
              router.push("/dashboard");
            }
            return;
          }
        }
      }

      router.push("/login");
    };

    void handleAuth();
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Verifying your link...</p>
      </div>
    </div>
  );
}