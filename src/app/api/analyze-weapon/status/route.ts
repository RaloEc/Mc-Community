import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Autenticar usuario
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Obtener jobId de la URL
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    // 3. Consultar el job
    // Aseguramos que el usuario solo pueda ver sus propios jobs (gracias a RLS o este .eq)
    const { data: job, error: jobError } = await supabase
      .from("weapon_analysis_jobs")
      .select("id, status, result, error_message, weapon_stats_record_id")
      .eq("id", jobId)
      .eq("user_id", user.id) // ¡Importante!
      .single();

    if (jobError || !job) {
      console.warn("[job-status] Job no encontrado o acceso denegado", {
        jobId,
        userId: user.id,
        jobError,
      });
      return NextResponse.json(
        { error: "Job not found or access denied" },
        { status: 404 }
      );
    }

    // 4. Devolver el estado del job
    return NextResponse.json(job);
  } catch (error) {
    console.error("[job-status] Error inesperado:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
