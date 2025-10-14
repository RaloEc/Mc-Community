import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { saveCurrentUrlForRedirect } from "@/lib/utils/auth-utils";
import { useTheme } from "next-themes";

export type ForoCategoria = {
  id: string;
  nombre: string;
  slug: string;
  parent_id: string | null;
  nivel: number | null;
  color: string | null;
  subcategorias?: ForoCategoria[];
};

type ApiForoCategoria = {
  id: string;
  nombre: string;
  slug: string;
  parent_id: string | null;
  nivel: number | null;
  color: string | null;
};

export const useHeaderLogic = () => {
  const router = useRouter();
  const { session, user: authUser, profile, signOut } = useAuth();
  const { resolvedTheme } = useTheme();
  
  // Estados principales
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isForoMenuOpen, setIsForoMenuOpen] = useState(false);
  const [isNoticiasMenuOpen, setIsNoticiasMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [authRedirectTo, setAuthRedirectTo] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [foroCategorias, setForoCategorias] = useState<ForoCategoria[]>([]);
  const [foroMobileOpen, setForoMobileOpen] = useState(false);
  const [noticiasMobileOpen, setNoticiasMobileOpen] = useState(false);

  // Referencias
  const adminMenuRef = useRef<HTMLLIElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userButtonRef = useRef<HTMLButtonElement | null>(null);
  const foroMenuRef = useRef<HTMLLIElement | null>(null);
  const noticiasMenuRef = useRef<HTMLLIElement | null>(null);

  // Manejar clics fuera de los menús
  useEffect(() => {
    const checkIfClickedOutside = (e: MouseEvent) => {
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(e.target as Node)
      ) {
        setIsAdminMenuOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", checkIfClickedOutside);
    return () => {
      document.removeEventListener("mousedown", checkIfClickedOutside);
    };
  }, []);

  // Verificar si es admin
  useEffect(() => {
    if (profile?.role === "admin" || profile?.role === "moderator") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [profile]);

  // Cargar categorías del foro
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("foro_categorias")
          .select("*")
          .order("nombre");

        if (error) {
          console.error("Error fetching categorias:", error);
          return;
        }

        const categoriasMap: Record<string, ForoCategoria> = {};
        const rootCategorias: ForoCategoria[] = [];

        data.forEach((cat: ApiForoCategoria) => {
          categoriasMap[cat.id] = { ...cat, subcategorias: [] };
        });

        data.forEach((cat: ApiForoCategoria) => {
          if (cat.parent_id && categoriasMap[cat.parent_id]) {
            categoriasMap[cat.parent_id].subcategorias!.push(categoriasMap[cat.id]);
          } else {
            rootCategorias.push(categoriasMap[cat.id]);
          }
        });

        setForoCategorias(rootCategorias);
      } catch (error) {
        console.error("Error fetching categorias:", error);
      }
    };

    fetchCategorias();
  }, []);

  // Función para cerrar sesión
  const handleLogout = async () => {
    console.log("[Header] handleLogout: inicio");
    try {
      await signOut();
      console.log("[Header] handleLogout: signOut() del contexto OK");
      
      // Esperar un momento para que React Query actualice el estado
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log("[Header] handleLogout: esperando actualización de estado...");
      
    } catch (e) {
      console.warn(
        "[Header] handleLogout: error en signOut() del contexto, intento fallback directo",
        e
      );
      try {
        const sb = createClient();
        await sb.auth.signOut();
        console.log("[Header] handleLogout: fallback signOut OK");
      } catch (e2) {
        console.error("[Header] handleLogout: fallback signOut falló", e2);
      }
    }
    
    // Cerrar menús antes de redirigir
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    
    try {
      // Forzar recarga completa de la página para asegurar que se actualice todo
      console.log("[Header] handleLogout: redirigiendo a home...");
      window.location.href = "/";
    } catch (e) {
      console.error("[Header] handleLogout: error en redirección", e);
    }
    
    console.log("[Header] handleLogout: fin");
  };

  // Función para cerrar todos los menús
  const closeAllMenus = useCallback((e?: React.MouseEvent) => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsAdminMenuOpen(false);
    setIsForoMenuOpen(false);
    setIsNoticiasMenuOpen(false);
    setForoMobileOpen(false);
    setNoticiasMobileOpen(false);
    setExpandedCategories({});
  }, []);

  // Función para abrir modal de autenticación
  const openAuthModal = useCallback(
    (mode: "login" | "register", redirectTo?: string) => {
      saveCurrentUrlForRedirect();
      setAuthModalMode(mode);
      setAuthRedirectTo(redirectTo);
      setIsAuthModalOpen(true);
      closeAllMenus();
    },
    [closeAllMenus]
  );

  // Función para manejar búsqueda
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        const trimmedQuery = searchQuery.trim();
        router.push(`/buscar?q=${encodeURIComponent(trimmedQuery)}`);
        setSearchQuery("");
        if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      }
    },
    [searchQuery, isMenuOpen, router]
  );

  return {
    // Estados
    isMenuOpen,
    setIsMenuOpen,
    isUserMenuOpen,
    setIsUserMenuOpen,
    isAdmin,
    isAdminMenuOpen,
    setIsAdminMenuOpen,
    isForoMenuOpen,
    setIsForoMenuOpen,
    isNoticiasMenuOpen,
    setIsNoticiasMenuOpen,
    expandedCategories,
    setExpandedCategories,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    authRedirectTo,
    searchQuery,
    setSearchQuery,
    foroCategorias,
    foroMobileOpen,
    setForoMobileOpen,
    noticiasMobileOpen,
    setNoticiasMobileOpen,
    
    // Referencias
    adminMenuRef,
    userMenuRef,
    userButtonRef,
    foroMenuRef,
    noticiasMenuRef,
    
    // Datos de autenticación
    authUser,
    profile,
    
    // Funciones
    handleLogout,
    closeAllMenus,
    openAuthModal,
    handleSearch,
  };
};
