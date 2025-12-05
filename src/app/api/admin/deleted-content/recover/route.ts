import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface RecoverRequest {
  snapshotId: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que es admin
    const { data: profile, error: profileError } = await supabase
      .from("perfiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "No tienes permisos de administrador" },
        { status: 403 }
      );
    }

    const { snapshotId } = (await request.json()) as RecoverRequest;

    if (!snapshotId) {
      return NextResponse.json(
        { error: "snapshotId requerido" },
        { status: 400 }
      );
    }

    // Obtener snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from("deleted_content_snapshots")
      .select("*")
      .eq("id", snapshotId)
      .single();

    if (snapshotError || !snapshot) {
      return NextResponse.json(
        { error: "Snapshot no encontrado" },
        { status: 404 }
      );
    }

    if (snapshot.is_recovered) {
      return NextResponse.json(
        { error: "Este contenido ya fue recuperado" },
        { status: 409 }
      );
    }

    const { activity_type, activity_id, content_snapshot } = snapshot;

    // Restaurar contenido según tipo
    let restoreError = null;

    switch (activity_type) {
      case "forum_thread": {
        const { error } = await supabase
          .from("foro_hilos")
          .update({ deleted_at: null })
          .eq("id", activity_id);
        restoreError = error;
        break;
      }

      case "forum_post": {
        const { error } = await supabase
          .from("foro_posts")
          .update({ deleted_at: null })
          .eq("id", activity_id);
        restoreError = error;
        break;
      }

      case "weapon_stats": {
        const { error } = await supabase
          .from("weapon_stats_records")
          .update({ deleted_at: null })
          .eq("id", activity_id);
        restoreError = error;
        break;
      }

      case "lol_match": {
        const { error } = await supabase
          .from("user_activity_entries")
          .update({ deleted_at: null })
          .eq("match_id", activity_id);
        restoreError = error;
        break;
      }

      case "noticia": {
        const { error } = await supabase
          .from("noticias")
          .update({ deleted_at: null })
          .eq("id", activity_id);
        restoreError = error;
        break;
      }

      case "comentario": {
        const { error } = await supabase
          .from("comentarios")
          .update({ deleted_at: null })
          .eq("id", activity_id);
        restoreError = error;
        break;
      }
    }

    if (restoreError) {
      console.error("[Admin Recover Content] Error:", restoreError);
      return NextResponse.json(
        { error: "Error al recuperar contenido" },
        { status: 500 }
      );
    }

    // Marcar snapshot como recuperado
    const { error: updateError } = await supabase
      .from("deleted_content_snapshots")
      .update({
        is_recovered: true,
        recovered_at: new Date().toISOString(),
        recovered_by_user_id: user.id,
      })
      .eq("id", snapshotId);

    if (updateError) {
      console.error(
        "[Admin Recover Content] Error updating snapshot:",
        updateError
      );
      return NextResponse.json(
        { error: "Error al actualizar snapshot" },
        { status: 500 }
      );
    }

    console.log("[Admin Recover Content] Success:", {
      admin_id: user.id,
      snapshot_id: snapshotId,
      activity_type,
      activity_id,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[Admin Recover Content] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
