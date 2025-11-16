import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener GIFs favoritos del usuario, ordenados por uso y fecha
    const { data: favorites, error } = await supabase
      .from("gif_favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("usage_count", { ascending: false })
      .order("last_used_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[API GIFs Favorites] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch favorites" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      results: favorites || [],
    });
  } catch (error) {
    console.error("[API GIFs Favorites] Error interno:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gif_url, tenor_id, title } = await request.json();

    if (!gif_url) {
      return NextResponse.json(
        { error: "gif_url is required" },
        { status: 400 }
      );
    }

    // Intentar insertar o actualizar (upsert)
    const { data, error } = await supabase
      .from("gif_favorites")
      .upsert(
        {
          user_id: user.id,
          gif_url,
          tenor_id: tenor_id || null,
          title: title || null,
          usage_count: 1,
          last_used_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,gif_url",
        }
      )
      .select();

    if (error) {
      console.error("[API GIFs Favorites] Error al guardar:", error);
      return NextResponse.json(
        { error: "Failed to save favorite" },
        { status: 500 }
      );
    }

    // Si ya existía, incrementar usage_count
    if (data && data.length > 0) {
      const favorite = data[0];
      const { error: updateError } = await supabase
        .from("gif_favorites")
        .update({
          usage_count: favorite.usage_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", favorite.id);

      if (updateError) {
        console.error("[API GIFs Favorites] Error al actualizar:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[API GIFs Favorites] Error interno:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
