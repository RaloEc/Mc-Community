import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const isRecovered = url.searchParams.get("is_recovered") === "true";

    // Obtener snapshots de contenido borrado
    let query = supabase
      .from("deleted_content_snapshots")
      .select(
        "id, activity_type, activity_id, original_user_id, deleted_by_user_id, deleted_at, is_recovered, recovered_at, content_snapshot",
        { count: "exact" }
      )
      .eq("is_recovered", isRecovered)
      .order("deleted_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: snapshots, count, error } = await query;

    if (error) {
      console.error("[Admin Deleted Content] Error:", error);
      return NextResponse.json(
        { error: "Error al obtener contenido borrado" },
        { status: 500 }
      );
    }

    // Obtener información de usuarios
    const userIds = new Set<string>();
    snapshots?.forEach((snapshot: any) => {
      if (snapshot.original_user_id) userIds.add(snapshot.original_user_id);
      if (snapshot.deleted_by_user_id) userIds.add(snapshot.deleted_by_user_id);
    });

    let usersMap: Record<string, any> = {};
    if (userIds.size > 0) {
      const { data: users } = await supabase
        .from("perfiles")
        .select("id, username, avatar_url")
        .in("id", Array.from(userIds));

      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Mapear respuesta
    const mappedSnapshots = snapshots?.map((snapshot: any) => ({
      id: snapshot.id,
      activityType: snapshot.activity_type,
      activityId: snapshot.activity_id,
      originalUser: usersMap[snapshot.original_user_id] || null,
      deletedBy: usersMap[snapshot.deleted_by_user_id] || null,
      deletedAt: snapshot.deleted_at,
      isRecovered: snapshot.is_recovered,
      recoveredAt: snapshot.recovered_at,
      content: snapshot.content_snapshot,
    }));

    return NextResponse.json(
      {
        data: mappedSnapshots,
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Admin Deleted Content] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
