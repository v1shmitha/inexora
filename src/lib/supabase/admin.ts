import { createClient } from "@supabase/supabase-js";


export function createAdminClient() {
  // console.log("SERVICE KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 30));
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// export function createAdminClient() {
//   return createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!
//   );
// }