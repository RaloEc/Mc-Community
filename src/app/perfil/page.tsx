"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCheckUsername } from "@/hooks/use-check-username";
import { useIsMobile } from "@/hooks/use-mobile";
import ImageUploader from "@/components/ImageUploader";
import ProfileHeader from "@/components/perfil/profile-header";
import { BannerUploader } from "@/components/perfil/BannerUploader";
import ProfileStats from "@/components/perfil/profile-stats";
import UserActivityFeed from "@/components/perfil/UserActivityFeed";
import UserActivityFeedContainer from "@/components/perfil/UserActivityFeedContainer";
import MembershipInfo from "@/components/perfil/membership-info";
import MobileProfileLayout from "@/components/perfil/MobileProfileLayout";
import { FriendRequestsList } from "@/components/social/FriendRequestsList";
import { FriendsListCompact } from "@/components/social/FriendsListCompact";
import { ConnectedAccountsModal } from "@/components/perfil/ConnectedAccountsModal";
import { ConnectedAccountsForm } from "@/components/perfil/ConnectedAccountsForm";
import { ProfileTabs } from "@/components/perfil/ProfileTabs";
import { RiotAccountCard } from "@/components/riot/RiotAccountCard";
import { MatchHistoryList } from "@/components/riot/MatchHistoryList";
import { RiotEmptyState } from "@/components/riot/RiotEmptyState";
import { RiotTierBadge } from "@/components/riot/RiotTierBadge";
import { ChampionStatsSummary } from "@/components/riot/ChampionStatsSummary";
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
import { LogOut, X, Check, AlertCircle, Loader } from "lucide-react";

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
  connected_accounts?: Record<string, string>;
  activo?: boolean;
  ultimo_acceso?: string;
  created_at?: string;
  updated_at?: string;
}

function PerfilPageContent() {
  const router = useRouter();
  const {
    user,
    profile,
    signOut,
    loading: authLoading,
    session,
    refreshProfile,
    refreshAuth,
  } = useAuth();
  const { toast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useIsMobile(1024); // Usar layout móvil en pantallas < 1024px

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [loading, setLoading] = useState(true);
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
    color: "#64748B", // Gris azulado por defecto
    avatar_url: "",
    banner_url: "" as string | null,
    connected_accounts: {} as Record<string, string>,
  });
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [riotAccount, setRiotAccount] = useState<any>(null);
  const [loadingRiotAccount, setLoadingRiotAccount] = useState(false);
  const isOwnProfile = user?.id === perfil?.id;
  const searchParams = useSearchParams();

  // Lee el tab activo desde la URL, fallback a "posts"
  const activeTab = (searchParams.get("tab") as "posts" | "lol") || "posts";

  const syncEditDataWithPerfil = useCallback((perfilData: PerfilCompleto) => {
    // Parsear connected_accounts si es string JSON
    let connectedAccounts: Record<string, string> = {};
    const rawConnectedAccounts = perfilData.connected_accounts;
    if (rawConnectedAccounts) {
      if (typeof rawConnectedAccounts === "string") {
        try {
          connectedAccounts = JSON.parse(rawConnectedAccounts);
        } catch (e) {
          console.error("Error parsing connected_accounts:", e);
          connectedAccounts = {};
        }
      } else if (typeof rawConnectedAccounts === "object") {
        connectedAccounts = rawConnectedAccounts;
      }
    }

    setEditData({
      username: perfilData.username || "",
      bio: perfilData.bio || "",
      color: perfilData.color,
      avatar_url: perfilData.avatar_url,
      banner_url: perfilData.banner_url || "",
      connected_accounts: connectedAccounts,
    });
  }, []);

  // Validación de username
  const usernameCheck = useCheckUsername(editData.username, user?.id);

  const normalizedCurrentUsername = useMemo(
    () => (perfil?.username ?? "").trim(),
    [perfil?.username]
  );
  const normalizedEditUsername = useMemo(
    () => editData.username.trim(),
    [editData.username]
  );
  const usernameChanged = normalizedEditUsername !== normalizedCurrentUsername;
  const hasUsernameValue = normalizedEditUsername.length > 0;
  const shouldShowAvailability = usernameChanged && hasUsernameValue;

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

    // Parsear connected_accounts si es string JSON
    let connectedAccounts: Record<string, string> = {};
    const rawConnectedAccounts = (profile as any)?.connected_accounts;
    if (rawConnectedAccounts) {
      if (typeof rawConnectedAccounts === "string") {
        try {
          connectedAccounts = JSON.parse(rawConnectedAccounts);
        } catch (e) {
          console.error("[PerfilPage] Error parsing connected_accounts:", e);
          connectedAccounts = {};
        }
      } else if (typeof rawConnectedAccounts === "object") {
        connectedAccounts = rawConnectedAccounts;
      }
    }

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
      connected_accounts: connectedAccounts,
      activo: (profile as any)?.activo ?? true,
      ultimo_acceso:
        (profile as any)?.ultimo_acceso || new Date().toISOString(),
      created_at: session.user.created_at || new Date().toISOString(),
      updated_at: (profile as any)?.updated_at || new Date().toISOString(),
    };

    setPerfil(perfilCompleto);

    // Configurar datos para edición
    syncEditDataWithPerfil(perfilCompleto);

    setLoading(false);

    // Cargar estadísticas
    cargarEstadisticas();
  }, [authLoading, session, user, profile, router, syncEditDataWithPerfil]);

  useEffect(() => {
    if (isOpen && perfil) {
      syncEditDataWithPerfil(perfil);
      setError(null);
    }
  }, [isOpen, perfil, syncEditDataWithPerfil]);

  // Cargar cuenta de Riot vinculada
  useEffect(() => {
    const loadRiotAccount = async () => {
      if (!user) return;
      setLoadingRiotAccount(true);
      try {
        const response = await fetch("/api/riot/account");
        if (response.ok) {
          const data = await response.json();
          setRiotAccount(data.account);
          console.log("[Perfil] Cuenta Riot cargada:", data.account);
        } else {
          console.log("[Perfil] No hay cuenta Riot vinculada (404 o similar)");
          setRiotAccount(null);
        }
      } catch (error) {
        console.error("[Perfil] Error loading Riot account:", error);
        setRiotAccount(null);
      } finally {
        setLoadingRiotAccount(false);
      }
    };

    loadRiotAccount();
  }, [user]);

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
        color: editData.color,
        avatar_url: editData.avatar_url,
        banner_url: editData.banner_url,
        connected_accounts: editData.connected_accounts,
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
    if (isSigningOut) return; // Evitar múltiples clics

    console.log("[Perfil] Iniciando proceso de cierre de sesión...");
    setIsSigningOut(true);

    try {
      // 1. Intentar con el signOut del contexto de autenticación
      console.log(
        "[Perfil] Intentando cierre de sesión con el contexto de autenticación..."
      );
      await signOut();
      console.log("[Perfil] Cierre de sesión exitoso con el contexto");

      // 2. Redirigir y forzar recarga para limpiar todo el estado
      console.log("[Perfil] Redirigiendo a la página principal...");
      window.location.href = "/";
      return; // Salir de la función para evitar ejecutar el código restante
    } catch (error) {
      console.error("[Perfil] Error en cierre de sesión con contexto:", error);

      // 3. Si falla, intentar con una instancia directa de Supabase
      try {
        console.log(
          "[Perfil] Intentando cierre de sesión con instancia directa..."
        );
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.auth.signOut();
        console.log("[Perfil] Cierre de sesión exitoso con instancia directa");
      } catch (innerError) {
        console.error(
          "[Perfil] Error en cierre de sesión con instancia directa:",
          innerError
        );
      } finally {
        // 4. En cualquier caso, forzar recarga para asegurar limpieza
        console.log("[Perfil] Forzando recarga de la página...");
        window.location.href = "/";
      }
    } finally {
      // 5. Asegurarse de que el estado se limpie
      console.log("[Perfil] Limpiando estado de carga...");
      setIsSigningOut(false);
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

  // Layout móvil
  if (isMobile) {
    return (
      <>
        <MobileProfileLayout
          fetchActivities={fetchActividades}
          estadisticas={estadisticas}
          perfil={{
            id: perfil.id,
            username: perfil.username,
            color: perfil.color,
            role: perfil.role,
            avatar_url: perfil.avatar_url,
            banner_url: perfil.banner_url,
            created_at: perfil.created_at,
            ultimo_acceso: perfil.ultimo_acceso,
            activo: perfil.activo,
            followers_count: (profile as any)?.followers_count ?? 0,
            following_count: (profile as any)?.following_count ?? 0,
            friends_count: (profile as any)?.friends_count ?? 0,
            connected_accounts:
              editData.connected_accounts ||
              (profile as any)?.connected_accounts ||
              {},
          }}
          userId={user?.id}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
          onEditClick={onOpen}
          riotAccount={riotAccount}
        />

        {/* Modal de edición - Renderizado fuera del layout móvil para evitar z-index issues */}
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size="2xl"
          scrollBehavior="inside"
          className="max-h-[90vh] z-50"
          backdrop="blur"
          classNames={{
            base: "bg-white dark:bg-black amoled:bg-black z-50",
            header:
              "border-b border-gray-200 dark:border-gray-800 amoled:border-gray-800",
            body: "bg-white dark:bg-black amoled:bg-black",
            footer:
              "bg-white dark:bg-black amoled:bg-black border-t border-gray-200 dark:border-gray-800 amoled:border-gray-800",
            backdrop: "backdrop-blur-sm bg-black/10 z-40",
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

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    label="Nombre de usuario"
                    value={editData.username}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    placeholder="Tu nombre de usuario"
                    isInvalid={
                      shouldShowAvailability &&
                      usernameCheck.available === false
                    }
                    color={
                      shouldShowAvailability
                        ? usernameCheck.available === true
                          ? "success"
                          : usernameCheck.available === false
                          ? "danger"
                          : "default"
                        : "default"
                    }
                    endContent={
                      shouldShowAvailability && (
                        <div className="flex items-center gap-2">
                          {usernameCheck.loading && (
                            <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                          )}
                          {!usernameCheck.loading &&
                            usernameCheck.available === true && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          {!usernameCheck.loading &&
                            usernameCheck.available === false && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                        </div>
                      )
                    }
                  />
                </div>
                {shouldShowAvailability && (
                  <div className="text-sm">
                    {usernameCheck.loading && (
                      <p className="text-gray-500 dark:text-gray-400">
                        Verificando disponibilidad...
                      </p>
                    )}
                    {!usernameCheck.loading &&
                      usernameCheck.available === true && (
                        <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          {usernameCheck.message || "Username disponible"}
                        </p>
                      )}
                    {!usernameCheck.loading &&
                      usernameCheck.available === false && (
                        <p className="text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {usernameCheck.error || "Username no disponible"}
                        </p>
                      )}
                  </div>
                )}
              </div>

              <Textarea
                label="Biografía"
                value={editData.bio}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Cuéntanos sobre ti..."
                maxRows={4}
              />

              <Divider className="my-4" />

              {/* Sección de cuentas conectadas */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 amoled:text-gray-200">
                  Cuentas Conectadas
                </h3>
                <ConnectedAccountsForm
                  accounts={editData.connected_accounts || {}}
                  onChange={(accounts) =>
                    setEditData((prev) => ({
                      ...prev,
                      connected_accounts: accounts,
                    }))
                  }
                />
              </div>

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
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                color="primary"
                onPress={handleSave}
                isLoading={isSaving}
                isDisabled={
                  isSaving ||
                  (usernameChanged && usernameCheck.available !== true)
                }
              >
                Guardar Cambios
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }

  // Layout desktop
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
              followers_count: (profile as any)?.followers_count ?? 0,
              following_count: (profile as any)?.following_count ?? 0,
              friends_count: (profile as any)?.friends_count ?? 0,
              connected_accounts: (profile as any)?.connected_accounts || {},
            }}
            riotTier={riotAccount?.tier}
            riotRank={riotAccount?.rank}
            riotAccount={riotAccount}
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

        {/* Sistema de Pestañas */}
        <ProfileTabs hasRiotAccount={!!riotAccount} />

        {/* CTA para vincular Riot cuando es su propio perfil */}
        {!riotAccount && isOwnProfile && (
          <div className="mt-6">
            <RiotEmptyState
              isOwnProfile
              onLinkClick={() => {
                window.location.href = "/api/riot/login";
              }}
            />
          </div>
        )}

        {/* Contenido de Pestañas */}
        {activeTab === "posts" ? (
          // Pestaña Actividad
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Columna izquierda - Feed de actividad */}
            <div className="lg:col-span-2">
              <UserActivityFeedContainer
                fetchActivities={fetchActividades}
                userColor={perfil.color}
              />
            </div>

            {/* Columna derecha - Información de membresía */}
            <div className="lg:col-span-1 space-y-6">
              {/* Solicitudes de amistad */}
              <FriendRequestsList userColor={perfil.color} />

              {/* Lista de amigos */}
              <FriendsListCompact
                userId={user?.id}
                userColor={perfil.color}
                limit={8}
              />

              {/* Estadísticas */}
              <ProfileStats estadisticas={estadisticas} />

              <MembershipInfo
                perfil={{
                  created_at: perfil.created_at,
                  ultimo_acceso: perfil.ultimo_acceso,
                  activo: perfil.activo,
                  role: perfil.role,
                }}
              />

              {/* Botón de cerrar sesión */}
              <Card className="bg-white dark:bg-black amoled:bg-black">
                <CardBody>
                  <Button
                    color="danger"
                    variant="light"
                    startContent={<LogOut className="w-4 h-4" />}
                    onPress={handleSignOut}
                    isLoading={isSigningOut}
                    isDisabled={isSigningOut}
                    className="w-full"
                  >
                    {isSigningOut ? "Cerrando sesión..." : "Cerrar Sesión"}
                  </Button>
                </CardBody>
              </Card>
            </div>
          </div>
        ) : (
          // Pestaña League of Legends
          <div className="mt-8 space-y-6">
            {riotAccount ? (
              <>
                {/* Tarjeta de cuenta de Riot */}
                <RiotAccountCard useVisualDesign={true} />

                {/* Resumen de campeones */}
                {riotAccount.puuid && (
                  <ChampionStatsSummary puuid={riotAccount.puuid} limit={5} />
                )}

                {/* Historial de partidas */}
                <MatchHistoryList userId={user?.id} />
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Modal de edición con scroll */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        className="max-h-[90vh] z-50"
        backdrop="blur"
        classNames={{
          base: "bg-white dark:bg-black amoled:bg-black z-50",
          header:
            "border-b border-gray-200 dark:border-gray-800 amoled:border-gray-800",
          body: "bg-white dark:bg-black amoled:bg-black",
          footer:
            "bg-white dark:bg-black amoled:bg-black border-t border-gray-200 dark:border-gray-800 amoled:border-gray-800",
          backdrop: "backdrop-blur-sm bg-black/10 z-40",
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

            <div className="space-y-2">
              <div className="relative">
                <Input
                  label="Nombre de usuario"
                  value={editData.username}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="Tu nombre de usuario"
                  isInvalid={
                    shouldShowAvailability && usernameCheck.available === false
                  }
                  color={
                    shouldShowAvailability
                      ? usernameCheck.available === true
                        ? "success"
                        : usernameCheck.available === false
                        ? "danger"
                        : "default"
                      : "default"
                  }
                  endContent={
                    shouldShowAvailability && (
                      <div className="flex items-center gap-2">
                        {usernameCheck.loading && (
                          <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                        )}
                        {!usernameCheck.loading &&
                          usernameCheck.available === true && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        {!usernameCheck.loading &&
                          usernameCheck.available === false && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                      </div>
                    )
                  }
                />
              </div>
              {shouldShowAvailability && (
                <div className="text-sm">
                  {usernameCheck.loading && (
                    <p className="text-gray-500 dark:text-gray-400">
                      Verificando disponibilidad...
                    </p>
                  )}
                  {!usernameCheck.loading &&
                    usernameCheck.available === true && (
                      <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        {usernameCheck.message || "Username disponible"}
                      </p>
                    )}
                  {!usernameCheck.loading &&
                    usernameCheck.available === false && (
                      <p className="text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {usernameCheck.error || "Username no disponible"}
                      </p>
                    )}
                </div>
              )}
            </div>

            <Textarea
              label="Biografía"
              value={editData.bio}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Cuéntanos sobre ti..."
              maxRows={4}
            />

            <Divider className="my-4" />

            {/* Sección de cuentas conectadas */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 amoled:text-gray-200">
                Cuentas Conectadas
              </h3>
              <ConnectedAccountsForm
                accounts={editData.connected_accounts || {}}
                onChange={(accounts) =>
                  setEditData((prev) => ({
                    ...prev,
                    connected_accounts: accounts,
                  }))
                }
              />
            </div>

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
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={isSaving}
              isDisabled={
                isSaving ||
                (usernameChanged && usernameCheck.available !== true)
              }
            >
              Guardar Cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de gestión de cuentas conectadas */}
      <ConnectedAccountsModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        userId={perfil?.id || ""}
        onSave={async () => {
          // Refrescar el perfil después de guardar cuentas
          await refreshProfile();
          // Recargar los datos del perfil desde el servidor
          if (perfil?.id && user?.id) {
            try {
              const { createClient } = await import("@/lib/supabase/client");
              const supabase = createClient();
              const { data: updatedProfile } = await supabase
                .from("perfiles")
                .select("*")
                .eq("id", perfil.id)
                .single();

              if (updatedProfile) {
                // Parsear connected_accounts si es string JSON
                let connectedAccounts: Record<string, string> = {};
                const rawConnectedAccounts = updatedProfile?.connected_accounts;
                if (rawConnectedAccounts) {
                  if (typeof rawConnectedAccounts === "string") {
                    try {
                      connectedAccounts = JSON.parse(rawConnectedAccounts);
                    } catch (e) {
                      console.error("Error parsing connected_accounts:", e);
                      connectedAccounts = {};
                    }
                  } else if (typeof rawConnectedAccounts === "object") {
                    connectedAccounts = rawConnectedAccounts;
                  }
                }

                setPerfil((prev) =>
                  prev
                    ? {
                        ...prev,
                        ...updatedProfile,
                        connected_accounts: connectedAccounts,
                      }
                    : prev
                );
              }
            } catch (error) {
              console.error("Error refrescando perfil:", error);
            }
          }
        }}
      />
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-slate-400">
          <Spinner label="Cargando perfil…" />
        </div>
      }
    >
      <PerfilPageContent />
    </Suspense>
  );
}
