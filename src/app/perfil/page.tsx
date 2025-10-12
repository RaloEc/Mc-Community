"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "@/components/ImageUploader";
import ProfileHeader from "@/components/perfil/profile-header";
import { BannerUploader } from "@/components/perfil/BannerUploader";
import ProfileStats from "@/components/perfil/profile-stats";
import ActivityFeed from "@/components/perfil/activity-feed";
import MembershipInfo from "@/components/perfil/membership-info";
import {
  Card,
  CardBody,
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Divider,
} from "@nextui-org/react";
import { LogOut, X } from "lucide-react";

interface PerfilCompleto {
  id: string;
  username: string;
  role: "user" | "admin" | "moderator";
  email?: string;
  avatar_url: string;
  banner_url?: string | null;
  color: string;
  bio?: string;
  ubicacion?: string;
  sitio_web?: string;
  activo?: boolean;
  ultimo_acceso?: string;
  created_at?: string;
  updated_at?: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const {
    user,
    session,
    profile,
    loading: authLoading,
    refreshAuth,
    refreshProfile,
  } = useAuth();
  const { toast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState({
    noticias: 0,
    comentarios: 0,
    hilos: 0,
    respuestas: 0,
  });

  // Estados para el modal de edición
  const [editData, setEditData] = useState({
    username: "",
    bio: "",
    ubicacion: "",
    sitio_web: "",
    color: "#64748B", // Gris azulado por defecto
    avatar_url: "",
    banner_url: "" as string | null,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (!user) return;

    // Construir perfil completo
    const userMetadata = user.user_metadata || {};
    const roleValue = (profile as any)?.role || "user";
    const validRole = ["user", "admin", "moderator"].includes(roleValue)
      ? (roleValue as "user" | "admin" | "moderator")
      : "user";

    const perfilCompleto: PerfilCompleto = {
      id: user.id,
      username:
        (profile as any)?.username ||
        userMetadata.full_name ||
        userMetadata.name ||
        "Usuario",
      role: validRole,
      email: session.user.email || "",
      avatar_url:
        (profile as any)?.avatar_url ||
        userMetadata.avatar_url ||
        userMetadata.picture ||
        "/images/default-avatar.png",
      banner_url: (profile as any)?.banner_url ?? null,
      color: (profile as any)?.color || "#3b82f6",
      bio: (profile as any)?.bio || "",
      ubicacion: (profile as any)?.ubicacion || "",
      sitio_web: (profile as any)?.sitio_web || "",
      activo: (profile as any)?.activo ?? true,
      ultimo_acceso:
        (profile as any)?.ultimo_acceso || new Date().toISOString(),
      created_at: session.user.created_at || new Date().toISOString(),
      updated_at: (profile as any)?.updated_at || new Date().toISOString(),
    };

    setPerfil(perfilCompleto);

    // Configurar datos para edición
    setEditData({
      username: perfilCompleto.username,
      bio: perfilCompleto.bio || "",
      ubicacion: perfilCompleto.ubicacion || "",
      sitio_web: perfilCompleto.sitio_web || "",
      color: perfilCompleto.color,
      avatar_url: perfilCompleto.avatar_url,
      banner_url: perfilCompleto.banner_url || "",
    });

    setLoading(false);

    // Cargar estadísticas
    cargarEstadisticas();
  }, [authLoading, session, user, profile, router]);

  const cargarEstadisticas = async () => {
    if (!user) return;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const [noticiasResult, comentariosResult, hilosResult, respuestasResult] =
        await Promise.all([
          supabase
            .from("noticias")
            .select("id", { count: "exact" })
            .eq("autor_id", user.id),
          supabase
            .from("comentarios")
            .select("id", { count: "exact" })
            .eq("usuario_id", user.id),
          supabase
            .from("foro_hilos")
            .select("id", { count: "exact" })
            .eq("autor_id", user.id)
            .is("deleted_at", null),
          supabase
            .from("foro_posts")
            .select("id", { count: "exact" })
            .eq("autor_id", user.id),
        ]);

      setEstadisticas({
        noticias: noticiasResult.count || 0,
        comentarios: comentariosResult.count || 0,
        hilos: hilosResult.count || 0,
        respuestas: respuestasResult.count || 0,
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  // Función para obtener el nombre del color
  const getColorName = (hex: string): string => {
    const colors: Record<string, string> = {
      "#4F46E5": "Azul",
      "#10B981": "Verde",
      "#EF4444": "Rojo",
      "#F59E0B": "Amarillo",
      "#8B5CF6": "Violeta",
      "#06B6D4": "Turquesa",
      "#F97316": "Naranja",
      "#EC4899": "Rosa",
      "#64748B": "Gris azulado",
    };
    return colors[hex] || "Personalizado";
  };

  // Función para cargar actividades con paginación
  const fetchActividades = useCallback(
    async (page: number, limit: number) => {
      if (!user) return [];

      try {
        const response = await fetch(
          `/api/perfil/actividades?userId=${user.id}&page=${page}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error("Error al cargar actividades");
        }

        const data = await response.json();
        return data.items || [];
      } catch (error) {
        console.error("Error al cargar actividades:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las actividades recientes.",
        });
        return [];
      }
    },
    [user, toast]
  );

  const handleSave = async () => {
    if (!perfil) return;

    setSaving(true);
    setError(null);

    try {
      // Guardar datos actuales para actualización inmediata
      const datosActualizados = {
        username: editData.username,
        bio: editData.bio,
        ubicacion: editData.ubicacion,
        sitio_web: editData.sitio_web,
        color: editData.color,
        avatar_url: editData.avatar_url,
        banner_url: editData.banner_url,
      };

      // Cerrar el modal inmediatamente
      onClose();

      // Actualizar la interfaz inmediatamente para mejor experiencia de usuario
      // Importante: Crear un nuevo objeto para forzar la re-renderización
      const perfilActualizado = {
        ...perfil,
        ...datosActualizados,
      };

      // Actualizar el estado local inmediatamente
      setPerfil(perfilActualizado);

      // Enviar datos al servidor
      const response = await fetch("/api/perfil/actualizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: perfil.id,
          ...datosActualizados,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar perfil");
      }

      // Obtener los datos actualizados del servidor
      const resultado = await response.json();

      // Limpiar la caché y forzar la actualización del perfil
      await refreshProfile();

      // Actualizar el estado local nuevamente con los datos más recientes
      if (resultado && resultado.data) {
        setPerfil((prev) => ({
          ...prev!,
          ...resultado.data,
        }));
      }

      // También actualizamos el contexto de autenticación
      await refreshAuth();

      // Mostrar notificación de éxito
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    } catch (error) {
      console.error("Error:", error);
      setError("Error al actualizar el perfil");
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md bg-white dark:bg-black amoled:bg-black">
          <CardBody className="text-center">
            <p>No se pudo cargar el perfil</p>
            <Button onClick={() => router.push("/")} className="mt-4">
              Volver al inicio
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black amoled:bg-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header del perfil */}
        <div className="mb-8">
          <ProfileHeader
            perfil={{
              username: perfil.username,
              role: perfil.role,
              avatar_url: perfil.avatar_url,
              color: perfil.color,
              banner_url: perfil.banner_url || undefined,
            }}
            onEditClick={onOpen}
          />
        </div>

        {/* Biografía */}
        {perfil.bio && (
          <div className="mb-8">
            <Card className="bg-white dark:bg-black amoled:bg-black">
              <CardBody className="p-6">
                <p className="text-gray-700 dark:text-gray-300 amoled:text-gray-300 leading-relaxed text-center text-lg">
                  "{perfil.bio}"
                </p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Estadísticas */}
        <div className="mb-8">
          <ProfileStats estadisticas={estadisticas} />
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Feed de actividad */}
          <div className="lg:col-span-2">
            <ActivityFeed
              fetchActivities={fetchActividades}
              initialPage={1}
              itemsPerPage={5}
            />
          </div>

          {/* Columna derecha - Información de membresía */}
          <div className="lg:col-span-1">
            <MembershipInfo
              perfil={{
                created_at: perfil.created_at,
                ultimo_acceso: perfil.ultimo_acceso,
                activo: perfil.activo,
                role: perfil.role,
              }}
            />

            {/* Botón de cerrar sesión */}
            <Card className="bg-white dark:bg-black amoled:bg-black mt-6">
              <CardBody>
                <Button
                  color="danger"
                  variant="light"
                  startContent={<LogOut className="w-4 h-4" />}
                  onPress={handleSignOut}
                  className="w-full"
                >
                  Cerrar Sesión
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de edición con scroll */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        className="max-h-[90vh]"
        backdrop="blur"
        classNames={{
          base: "bg-white dark:bg-black amoled:bg-black",
          header:
            "border-b border-gray-200 dark:border-gray-800 amoled:border-gray-800",
          body: "bg-white dark:bg-black amoled:bg-black",
          footer:
            "bg-white dark:bg-black amoled:bg-black border-t border-gray-200 dark:border-gray-800 amoled:border-gray-800",
          backdrop: "backdrop-blur-sm bg-black/10",
        }}
      >
        <ModalContent>
          <ModalHeader className="sticky top-0 z-10 bg-white dark:bg-black amoled:bg-black border-b border-gray-200 dark:border-gray-800 amoled:border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 amoled:text-gray-100">
              Editar Perfil
            </h2>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 amoled:text-gray-400 amoled:hover:text-gray-200"
            >
              <X size={20} />
            </Button>
          </ModalHeader>
          <ModalBody className="overflow-y-auto max-h-[60vh] bg-white dark:bg-black amoled:bg-black">
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 amoled:bg-red-900/20 border border-red-300 dark:border-red-800 amoled:border-red-800 text-red-700 dark:text-red-300 amoled:text-red-300 rounded-lg">
                {error}
              </div>
            )}

            {/* Sección de imagen de perfil */}
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200 amoled:text-gray-200">
                Imagen de perfil
              </h3>
              <ImageUploader
                currentImageUrl={editData.avatar_url}
                userId={perfil?.id || ""}
                onImageUploaded={(url) =>
                  setEditData((prev) => ({ ...prev, avatar_url: url }))
                }
                className="mb-2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-gray-400 mt-1">
                Sube una imagen de perfil (máx. 2MB)
              </p>
            </div>

            {/* Sección de banner de perfil */}
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200 amoled:text-gray-200">
                Banner de perfil
              </h3>
              <BannerUploader
                variant="compact"
                userId={perfil.id}
                currentBanner={editData.banner_url || perfil.banner_url || ""}
                onUpload={(url) => {
                  setEditData((prev) => ({ ...prev, banner_url: url }));
                  setPerfil((prev) =>
                    prev ? { ...prev, banner_url: url } : prev
                  );
                }}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 amoled:text-gray-400 mt-1">
                Sube una imagen de banner (máx. 5MB). Relación recomendada 4:1
                (1920x480).
              </p>
            </div>

            <Divider className="my-4" />

            <Input
              label="Nombre de usuario"
              value={editData.username}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="Tu nombre de usuario"
            />

            <Textarea
              label="Biografía"
              value={editData.bio}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Cuéntanos sobre ti..."
              maxRows={4}
            />

            <Input
              label="Ubicación"
              value={editData.ubicacion}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, ubicacion: e.target.value }))
              }
              placeholder="Tu ubicación"
            />

            <Input
              label="Sitio web"
              value={editData.sitio_web}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, sitio_web: e.target.value }))
              }
              placeholder="https://tu-sitio.com"
            />

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-white/50 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/80 dark:border-gray-700/70">
                <div
                  className="w-10 h-10 rounded-lg shadow-sm transition-all duration-200"
                  style={{
                    backgroundColor: editData.color,
                    transform: "translateY(-1px)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                    {getColorName(editData.color)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {editData.color.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Paleta de colores */}
              <div className="p-2 bg-white/30 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/60">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    "#4F46E5", // Azul
                    "#10B981", // Verde
                    "#EF4444", // Rojo
                    "#F59E0B", // Amarillo
                    "#8B5CF6", // Violeta
                    "#06B6D4", // Turquesa
                    "#F97316", // Naranja
                    "#EC4899", // Rosa
                  ].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setEditData((prev) => ({ ...prev, color }))
                      }
                      className={`relative w-full aspect-square rounded-lg transition-all duration-200 flex items-center justify-center
                        ${
                          editData.color === color
                            ? "ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-800 scale-105 shadow-sm"
                            : "hover:shadow-sm hover:scale-105"
                        }
                        after:absolute after:inset-0 after:rounded-lg after:transition-all after:duration-200
                        ${
                          editData.color === color
                            ? "after:bg-white/10"
                            : "hover:after:bg-black/5 dark:hover:after:bg-white/5"
                        }
                      `}
                      style={{ backgroundColor: color }}
                      title={getColorName(color)}
                      aria-label={`Seleccionar color ${getColorName(color)}`}
                    >
                      {editData.color === color && (
                        <svg
                          className="w-4 h-4 text-white drop-shadow-md"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSave} isLoading={saving}>
              Guardar Cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
