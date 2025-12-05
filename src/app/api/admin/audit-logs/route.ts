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
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const action = url.searchParams.get("action");
    const offset = (page - 1) * limit;

    // Obtener logs de auditoría
    let query = supabase
      .from("activity_audit_logs")
      .select(
        "id, user_id, action, activity_type, activity_id, target_user_id, reason, created_at",
        { count: "exact" }
      );

    if (action) {
      query = query.eq("action", action);
    }

    const {
      data: logs,
      count,
      error,
    } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Admin Audit Logs] Error:", error);
      return NextResponse.json(
        { error: "Error al obtener logs de auditoría" },
        { status: 500 }
      );
    }

    // Obtener información de usuarios
    const userIds = new Set<string>();
    logs?.forEach((log: any) => {
      userIds.add(log.user_id);
      if (log.target_user_id) userIds.add(log.target_user_id);
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
    const mappedLogs = logs?.map((log: any) => ({
      id: log.id,
      action: log.action,
      user: usersMap[log.user_id] || null,
      targetUser: log.target_user_id ? usersMap[log.target_user_id] : null,
      activityType: log.activity_type,
      activityId: log.activity_id,
      reason: log.reason,
      createdAt: log.created_at,
    }));

    // Estadísticas de acciones
    const { data: actionStats } = await supabase
      .from("activity_audit_logs")
      .select("action", { count: "exact" });

    const stats = {
      hide: actionStats?.filter((l: any) => l.action === "hide").length || 0,
      unhide:
        actionStats?.filter((l: any) => l.action === "unhide").length || 0,
      admin_delete:
        actionStats?.filter((l: any) => l.action === "admin_delete").length ||
        0,
    };

    return NextResponse.json(
      {
        data: mappedLogs,
        stats,
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
    console.error("[Admin Audit Logs] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
