import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils/avatar-utils";
import {
  Newspaper,
  MessageSquare,
  User,
  LogOut,
  Plus,
  Search,
  ChevronDown,
} from "lucide-react";
import { ForoCategoria } from "./useHeaderLogic";

interface HeaderMobileMenuProps {
  isOpen: boolean;
  authUser: any;
  profile?: {
    username?: string;
    avatar_url?: string;
    role?: string;
  } | null;
  currentTheme: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  closeAllMenus: () => void;
  handleLogout: () => void;
  openAuthModal: (mode: "login" | "register") => void;
  noticiasMobileOpen: boolean;
  setNoticiasMobileOpen: (value: boolean) => void;
  foroMobileOpen: boolean;
  setForoMobileOpen: (value: boolean) => void;
  foroCategorias: ForoCategoria[];
  expandedCategories: Record<string, boolean>;
  setExpandedCategories: (value: React.SetStateAction<Record<string, boolean>>) => void;
  isAdmin: boolean;
}

export const HeaderMobileMenu: React.FC<HeaderMobileMenuProps> = ({
  isOpen,
  authUser,
  profile,
  currentTheme,
  searchQuery,
  setSearchQuery,
  handleSearch,
  closeAllMenus,
  handleLogout,
  openAuthModal,
  noticiasMobileOpen,
  setNoticiasMobileOpen,
  foroMobileOpen,
  setForoMobileOpen,
  foroCategorias,
  expandedCategories,
  setExpandedCategories,
  isAdmin,
}) => {
  const [adminMenuOpen, setAdminMenuOpen] = React.useState(false);
  
  if (!isOpen) return null;
  
  // Estilos en línea para evitar problemas con JSX
  const menuStyles = {
    container: {
      maxHeight: 'calc(100vh - 4rem)'
    },
    menu: {
      transform: 'translateY(0)',
      opacity: 1,
      transition: 'transform 200ms ease-out, opacity 200ms ease-out',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    }
  };
  
  return null;
};
