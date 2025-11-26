import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";
import { getServiceClient } from "@/utils/supabase-service";

export const dynamic = "force-dynamic";

// Función helper para crear cliente de Supabase en Route Handler
function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Ignorar errores de cookies en Route Handlers
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // Ignorar errores de cookies en Route Handlers
          }
        },
      },
    }
  );
}

// Función para organizar categorías en estructura jerárquica
function organizarCategoriasJerarquicas(categorias: any[]) {
  // Mapa para acceso rápido a categorías por ID
  const categoriasMap = new Map();

  // Primero, crear un mapa de todas las categorías
  categorias.forEach((categoria) => {
    categoriasMap.set(categoria.id, {
      ...categoria,
      hijos: [],
    });
  });

  // Categorías principales (sin parent_id)
  const categoriasRaiz: any[] = [];

  // Organizar en estructura jerárquica
  categorias.forEach((categoria) => {
    const categoriaActual = categoriasMap.get(categoria.id);
    if (!categoriaActual) return;

    if (categoria.parent_id && categoriasMap.has(categoria.parent_id)) {
      // Es una subcategoría, añadirla al padre
      const padre = categoriasMap.get(categoria.parent_id);
      if (padre && Array.isArray(padre.hijos)) {
        // Crear una copia de la categoría para evitar problemas de referencia
        padre.hijos.push({
          ...categoriaActual,
          hijos: [], // Inicializar hijos como array vacío
        });
      }
    } else {
      // Es una categoría raíz
      categoriasRaiz.push({
        ...categoriaActual,
        hijos: [], // Inicializar hijos como array vacío
      });
    }
  });

  // Ordenar categorías principales por el campo orden
  categoriasRaiz.sort((a, b) => (a.orden || 0) - (b.orden || 0));

  // Ordenar subcategorías recursivamente
  function ordenarSubcategorias(categorias: any[]) {
    categorias.forEach((cat) => {
      if (cat.hijos && cat.hijos.length > 0) {
        cat.hijos.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0));
        ordenarSubcategorias(cat.hijos);
      }
    });
  }

  ordenarSubcategorias(categoriasRaiz);

  return categoriasRaiz;
}

// Función para verificar si el usuario es administrador
async function esAdmin(supabase: any, request?: NextRequest) {
  try {
    console.log("Verificando si el usuario es administrador...");

    // Verificar si se recibió el parámetro admin=true
    const isAdminParam = request?.nextUrl.searchParams.get("admin") === "true";
    console.log("¿Parámetro admin=true recibido?", isAdminParam);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log(
      "Usuario autenticado:",
      user ? `ID: ${user.id}` : "No hay usuario autenticado"
    );

    if (!user) {
      console.log("No hay usuario autenticado, denegando acceso");
      return false;
    }

    // Obtener perfil con el campo 'role' (no 'rol')
    const { data: perfil, error: perfilError } = await supabase
      .from("perfiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (perfilError) {
      console.error("Error al obtener perfil:", perfilError);
      return false;
    }

    console.log("Rol del usuario:", perfil?.role || "No tiene rol asignado");
    const isAdmin = perfil?.role === "admin";
    console.log("¿Es administrador según la base de datos?", isAdmin);

    // Solo requerir que el usuario sea administrador, el parámetro admin=true ya está en la URL
    return isAdmin;
  } catch (error) {
    console.error("Error al verificar rol de administrador:", error);
    return false;
  }
}

// GET - Obtener todas las categorías o una categoría específica
export async function GET(request: NextRequest) {
  console.log("GET - Recibida solicitud para obtener categorías");

  // Primero verificamos si el usuario es administrador
  const clienteAuth = await createClient();
  const admin = await esAdmin(clienteAuth, request);

  if (!admin) {
    console.log("Acceso denegado: El usuario no es administrador");
    return NextResponse.json(
      { error: "No autorizado. Se requieren permisos de administrador." },
      { status: 403 }
    );
  }

  // Si es admin, usamos el cliente de servicio para saltarnos las restricciones RLS
  const supabase = getServiceClient();
  console.log(
    "Usuario es administrador. Usando cliente de servicio para operación administrativa"
  );

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (id) {
      // Obtener una categoría específica
      const { data, error } = await supabase
        .from("categorias")
        .select(
          `
          *,
          categoria_padre:categorias!parent_id(id, nombre)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      return NextResponse.json(data);
    } else {
      // Obtener todas las categorías con información de categoría padre
      const { data, error } = await supabase
        .from("categorias")
        .select(
          `
          *,
          categoria_padre:categorias!parent_id(id, nombre)
        `
        )
        .order("orden", { ascending: true });

      if (error) {
        // Si la tabla no existe, devolver un array vacío
        if (error.code === "42P01") {
          // UNDEFINED_TABLE
          return NextResponse.json([]);
        }
        throw error;
      }

      // Verificar si se solicita la estructura jerárquica
      const estructuraJerarquica =
        request.nextUrl.searchParams.get("jerarquica") === "true";

      if (estructuraJerarquica) {
        // Devolver en formato jerárquico
        const categoriasJerarquicas = organizarCategoriasJerarquicas(
          data || []
        );
        return NextResponse.json(categoriasJerarquicas);
      } else {
        // Devolver en formato plano (comportamiento original)
        return NextResponse.json(data);
      }
    }
  } catch (error: any) {
    console.error("Error al obtener categorías:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener categorías" },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva categoría
export async function POST(request: NextRequest) {
  console.log("POST - Recibida solicitud para crear categoría");

  // Primero verificamos si el usuario es administrador
  const clienteAuth = await createClient();
  const admin = await esAdmin(clienteAuth, request);

  if (!admin) {
    console.log("Acceso denegado: El usuario no es administrador");
    return NextResponse.json(
      { error: "No autorizado. Se requieren permisos de administrador." },
      { status: 403 }
    );
  }

  // Si es admin, usamos el cliente de servicio para saltarnos las restricciones RLS
  const supabase = getServiceClient();
  console.log(
    "Usuario es administrador. Usando cliente de servicio para operación administrativa"
  );

  try {
    const body = await request.json();

    // Validar datos requeridos
    if (!body.nombre || !body.slug) {
      return NextResponse.json(
        { error: "El nombre y el slug son obligatorios" },
        { status: 400 }
      );
    }

    // Insertar la nueva categoría
    const { data, error } = await supabase
      .from("categorias")
      .insert({
        nombre: body.nombre,
        slug: body.slug,
        descripcion: body.descripcion || null,
        orden: body.orden || 0,
        color: body.color || "#3b82f6",
        tipo: "noticia", // Campo requerido según el esquema
        parent_id: body.parent_id || null, // Campo para subcategorías
      })
      .select(
        `
        *,
        categoria_padre:categorias!parent_id(id, nombre)
      `
      )
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error al crear categoría:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear categoría" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una categoría existente
export async function PUT(request: NextRequest) {
  console.log("PUT - Recibida solicitud para actualizar categoría");

  // Primero verificamos si el usuario es administrador
  const clienteAuth = await createClient();
  const admin = await esAdmin(clienteAuth, request);

  if (!admin) {
    console.log("Acceso denegado: El usuario no es administrador");
    return NextResponse.json(
      { error: "No autorizado. Se requieren permisos de administrador." },
      { status: 403 }
    );
  }

  // Si es admin, usamos el cliente de servicio para saltarnos las restricciones RLS
  const supabase = getServiceClient();
  console.log(
    "Usuario es administrador. Usando cliente de servicio para operación administrativa"
  );

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere un ID para actualizar la categoría" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validar datos requeridos
    if (!body.nombre || !body.slug) {
      return NextResponse.json(
        { error: "El nombre y el slug son obligatorios" },
        { status: 400 }
      );
    }

    // Actualizar la categoría
    const { data, error } = await supabase
      .from("categorias")
      .update({
        nombre: body.nombre,
        slug: body.slug,
        descripcion: body.descripcion || null,
        orden: body.orden || 0,
        color: body.color || "#3b82f6",
        // No actualizamos el campo 'tipo' para mantener su valor original
        parent_id: body.parent_id || null, // Campo para subcategorías
      })
      .eq("id", id)
      .select(
        `
        *,
        categoria_padre:categorias!parent_id(id, nombre)
      `
      )
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error al actualizar categoría:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar categoría" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una categoría
export async function DELETE(request: NextRequest) {
  console.log("DELETE - Recibida solicitud para eliminar categoría");

  // Primero verificamos si el usuario es administrador
  const clienteAuth = await createClient();
  const admin = await esAdmin(clienteAuth, request);

  if (!admin) {
    console.log("Acceso denegado: El usuario no es administrador");
    return NextResponse.json(
      { error: "No autorizado. Se requieren permisos de administrador." },
      { status: 403 }
    );
  }

  // Si es admin, usamos el cliente de servicio para saltarnos las restricciones RLS
  const supabase = getServiceClient();
  console.log(
    "Usuario es administrador. Usando cliente de servicio para operación administrativa"
  );

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const forzarEliminacion = searchParams.get("forzar") === "true";

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere un ID para eliminar la categoría" },
        { status: 400 }
      );
    }

    // Verificar si hay noticias asociadas a esta categoría a través de la tabla de relación
    const { count, error: countError } = await supabase
      .from("noticias_categorias")
      .select("*", { count: "exact", head: true })
      .eq("categoria_id", id);

    if (countError) {
      console.error("Error al verificar noticias asociadas:", countError);
      // Si la tabla no existe, asumimos que no hay relaciones
      if (countError.code === "42P01") {
        // UNDEFINED_TABLE
        console.log(
          "La tabla noticias_categorias no existe, continuando con la eliminación"
        );
      } else {
        throw countError;
      }
    } else if (count && count > 0) {
      // Si hay noticias asociadas y no se está forzando la eliminación, mostrar error
      if (!forzarEliminacion) {
        // Obtener las noticias asociadas para mostrar información más detallada
        const { data: noticiasAsociadas, error: noticiasError } = await supabase
          .from("noticias_categorias")
          .select("noticia_id, noticia:noticias(titulo)")
          .eq("categoria_id", id)
          .limit(5); // Limitamos a 5 para no sobrecargar la respuesta

        let mensajeError = `No se puede eliminar la categoría porque tiene ${count} noticias asociadas.`;

        if (
          !noticiasError &&
          noticiasAsociadas &&
          noticiasAsociadas.length > 0
        ) {
          // Convertir a unknown primero y luego al tipo esperado para evitar errores de tipado
          const titulos = noticiasAsociadas
            .filter((item) => item.noticia && typeof item.noticia === "object")
            .map((item) => {
              // Acceder de forma segura al título
              const noticia = item.noticia as any;
              return noticia?.titulo || "Sin título";
            })
            .join(", ");

          if (titulos) {
            mensajeError += ` Ejemplos: ${titulos}${
              noticiasAsociadas.length < count ? "..." : ""
            }`;
          }
        }

        mensajeError +=
          ' Puedes usar el parámetro "forzar=true" para mover automáticamente estas noticias a la categoría "General" antes de eliminar.';

        console.log("Eliminación bloqueada:", mensajeError);

        return NextResponse.json(
          {
            error: mensajeError,
            tieneAsociaciones: true,
            cantidadNoticias: count,
          },
          { status: 400 }
        );
      } else {
        // Forzar eliminación: mover noticias a categoría General
        console.log(
          `Forzando eliminación de categoría ${id} y moviendo ${count} noticias a categoría General`
        );

        // 1. Buscar o crear la categoría General
        let categoriaGeneralId: string;

        // Buscar si ya existe la categoría General
        const { data: categoriaGeneral, error: errorBusqueda } = await supabase
          .from("categorias")
          .select("id")
          .eq("nombre", "General")
          .eq("tipo", "noticia")
          .single();

        if (errorBusqueda && errorBusqueda.code !== "PGRST116") {
          // Error diferente a "no encontrado"
          throw errorBusqueda;
        }

        if (categoriaGeneral) {
          // La categoría General ya existe
          categoriaGeneralId = categoriaGeneral.id;
          console.log(
            "Categoría General encontrada con ID:",
            categoriaGeneralId
          );
        } else {
          // Crear la categoría General
          const { data: nuevaCategoria, error: errorCreacion } = await supabase
            .from("categorias")
            .insert({
              nombre: "General",
              slug: "general",
              descripcion:
                "Categoría general para noticias sin categoría específica",
              orden: 999, // Último en el orden
              color: "#808080", // Gris
              tipo: "noticia",
            })
            .select()
            .single();

          if (errorCreacion) throw errorCreacion;

          categoriaGeneralId = nuevaCategoria.id;
          console.log("Categoría General creada con ID:", categoriaGeneralId);
        }

        // 2. Obtener todas las noticias asociadas a la categoría a eliminar
        const { data: asociaciones, error: errorAsociaciones } = await supabase
          .from("noticias_categorias")
          .select("noticia_id")
          .eq("categoria_id", id);

        if (errorAsociaciones) throw errorAsociaciones;

        if (!asociaciones || asociaciones.length === 0) {
          console.log("No se encontraron asociaciones para reasignar");
        } else {
          // 3. Verificar qué noticias ya están asociadas con la categoría General para evitar duplicados
          const noticiasIds = asociaciones.map((a) => a.noticia_id);

          const { data: asociacionesExistentes, error: errorExistentes } =
            await supabase
              .from("noticias_categorias")
              .select("noticia_id")
              .eq("categoria_id", categoriaGeneralId)
              .in("noticia_id", noticiasIds);

          if (errorExistentes) throw errorExistentes;

          // Filtrar solo las noticias que no tienen ya una asociación con General
          const noticiasIdsExistentes =
            asociacionesExistentes?.map((a) => a.noticia_id) || [];
          const noticiasAReasignar = noticiasIds.filter(
            (id) => !noticiasIdsExistentes.includes(id)
          );

          console.log(
            `Reasignando ${noticiasAReasignar.length} noticias a la categoría General`
          );

          // 4. Crear nuevas asociaciones con la categoría General
          if (noticiasAReasignar.length > 0) {
            const nuevasAsociaciones = noticiasAReasignar.map((noticia_id) => ({
              noticia_id,
              categoria_id: categoriaGeneralId,
            }));

            const { error: errorInsercion } = await supabase
              .from("noticias_categorias")
              .insert(nuevasAsociaciones);

            if (errorInsercion) throw errorInsercion;

            console.log(
              `${nuevasAsociaciones.length} noticias reasignadas correctamente`
            );
          }

          // 5. Eliminar las asociaciones con la categoría original
          const { error: errorEliminacionAsoc } = await supabase
            .from("noticias_categorias")
            .delete()
            .eq("categoria_id", id);

          if (errorEliminacionAsoc) throw errorEliminacionAsoc;

          console.log(
            `Asociaciones con la categoría ${id} eliminadas correctamente`
          );
        }
      }
    }
    console.log(
      `Intentando eliminar categoría con ID: ${id} con cliente de servicio`
    );
    const { data, error } = await supabase
      .from("categorias")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error al ejecutar la eliminación:", error);
      throw error;
    }

    console.log("Resultado de la eliminación:", data);

    // Verificar si la categoría fue eliminada
    const { data: checkData, error: checkError } = await supabase
      .from("categorias")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError && checkError.code === "PGRST116") {
      // PGRST116 significa que no se encontró ningún registro, lo cual es bueno
      console.log(
        "Verificación exitosa: La categoría fue eliminada correctamente"
      );
      return NextResponse.json({ success: true });
    } else {
      console.error(
        "La categoría no fue eliminada. Todavía existe:",
        checkData
      );
      return NextResponse.json(
        {
          error:
            "La categoría no fue eliminada aunque no se reportaron errores",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error al eliminar categoría:", error);
    // Mostrar más detalles del error para depuración
    console.log("Detalles del error:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: error.message || "Error al eliminar categoría" },
      { status: 500 }
    );
  }
}
