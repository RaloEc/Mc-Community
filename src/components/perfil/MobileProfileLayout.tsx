"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, X } from "lucide-react";
import { Button } from "@nextui-org/react";
import ActivityFeed from "./activity-feed";
import ProfileHeader from "./profile-header";
import { FriendRequestsList } from "@/components/social/FriendRequestsList";
import { FriendsListCompact } from "@/components/social/FriendsListCompact";
import ProfileStats from "./profile-stats";
import MembershipInfo from "./membership-info";
import { LogOut } from "lucide-react";

interface MobileProfileLayoutProps {
  fetchActivities: (page: number, limit: number) => Promise<any[]>;
  estadisticas: {
    noticias: number;
    comentarios: number;
    hilos: number;
    respuestas: number;
  };
  perfil: {
    id: string;
    username: string;
    color: string;
    role: "user" | "admin" | "moderator";
    avatar_url: string;
    banner_url?: string | null;
    created_at?: string;
    ultimo_acceso?: string;
    activo?: boolean;
    followers_count?: number;
    following_count?: number;
    friends_count?: number;
    connected_accounts?: Record<string, string>;
  };
  userId?: string;
  onSignOut: () => void;
  isSigningOut: boolean;
  onEditClick?: () => void;
}

export default function MobileProfileLayout({
  fetchActivities,
  estadisticas,
  perfil,
  userId,
  onSignOut,
  isSigningOut,
  onEditClick,
}: MobileProfileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarX, setSidebarX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Manejo de drag del sidebar
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sidebarOpen) return;
    setIsDragging(true);
    setDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !sidebarOpen) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - dragStart;

    // Solo permitir arrastrar hacia la derecha (cerrar)
    if (diff > 0) {
      setSidebarX(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    // Si se arrastró más de 100px, cerrar
    if (sidebarX > 100) {
      setSidebarOpen(false);
    }

    setSidebarX(0);
  };

  // Cerrar sidebar al hacer click en overlay
  const handleOverlayClick = () => {
    setSidebarOpen(false);
    setSidebarX(0);
  };

  // Cerrar sidebar con ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
        setSidebarX(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white dark:bg-black amoled:bg-black">
      {/* Contenido principal - Feed de actividad */}
      <div className="w-full h-full flex flex-col">
        {/* Header del perfil con banner */}
        <div className="sticky top-0 z-20 bg-white dark:bg-black amoled:bg-black">
          <ProfileHeader
            perfil={{
              username: perfil.username,
              role: perfil.role,
              avatar_url: perfil.avatar_url,
              color: perfil.color,
              banner_url: perfil.banner_url || undefined,
              followers_count: perfil.followers_count ?? 0,
              following_count: perfil.following_count ?? 0,
              friends_count: perfil.friends_count ?? 0,
              connected_accounts: perfil.connected_accounts || {},
            }}
            onEditClick={onEditClick}
          />
        </div>

        {/* Indicador de deslizar + Título */}
        <div className="sticky top-[120px] z-20 flex items-center justify-between px-4 py-3 bg-white dark:bg-black amoled:bg-black border-b border-gray-200 dark:border-gray-800 amoled:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 amoled:text-gray-100">
            Actividad
          </h2>
        </div>

        {/* Feed de actividad con scroll infinito */}
        <div className="flex-1 overflow-y-auto">
          <ActivityFeed
            fetchActivities={fetchActivities}
            initialPage={1}
            itemsPerPage={10}
          />
        </div>
      </div>

      {/* Indicador visual fijo en la pantalla - Flecha para deslizar */}
      <div
        onClick={() => setSidebarOpen(true)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 amoled:hover:bg-gray-900 transition-all cursor-pointer group backdrop-blur-sm bg-white/80 dark:bg-black/80 amoled:bg-black/80 shadow-lg hover:shadow-xl"
        aria-label="Deslizar para abrir panel"
        title="Desliza para abrir más opciones"
      >
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 amoled:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 amoled:group-hover:text-gray-200 transition-colors">
          Más
        </span>
        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 amoled:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 amoled:group-hover:text-gray-200 transition-colors animate-pulse" />
      </div>

      {/* Overlay semitransparente */}
      {sidebarOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{
            opacity: sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? "auto" : "none",
          }}
        />
      )}

      {/* Sidebar deslizable desde la derecha */}
      <div
        ref={sidebarRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="fixed top-0 right-0 z-40 h-screen w-80 max-w-[90vw] bg-white dark:bg-black amoled:bg-black shadow-2xl transition-transform duration-300 ease-out overflow-y-auto"
        style={{
          transform: sidebarOpen
            ? `translateX(${sidebarX}px)`
            : "translateX(100%)",
        }}
      >
        {/* Header del sidebar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-white dark:bg-black amoled:bg-black border-b border-gray-200 dark:border-gray-800 amoled:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 amoled:text-gray-100">
            Más
          </h3>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 amoled:hover:bg-gray-900 transition-colors"
            aria-label="Cerrar panel"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400 amoled:text-gray-400" />
          </button>
        </div>

        {/* Contenido del sidebar */}
        <div className="p-4 space-y-6">
          {/* Solicitudes de amistad */}
          <FriendRequestsList userColor={perfil.color} />

          {/* Lista de amigos */}
          <FriendsListCompact
            userId={userId}
            userColor={perfil.color}
            limit={6}
          />

          {/* Estadísticas */}
          <ProfileStats estadisticas={estadisticas} />

          {/* Información de membresía */}
          <MembershipInfo
            perfil={{
              created_at: perfil.created_at,
              ultimo_acceso: perfil.ultimo_acceso,
              activo: perfil.activo,
              role: perfil.role,
            }}
          />

          {/* Botón de cerrar sesión */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 amoled:border-gray-800">
            <Button
              color="danger"
              variant="light"
              startContent={<LogOut className="w-4 h-4" />}
              onPress={onSignOut}
              isLoading={isSigningOut}
              isDisabled={isSigningOut}
              className="w-full"
            >
              {isSigningOut ? "Cerrando sesión..." : "Cerrar Sesión"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
