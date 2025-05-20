import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Cliente para el servidor (SSR)
export const createServerClient = () => createServerComponentClient({ cookies });
