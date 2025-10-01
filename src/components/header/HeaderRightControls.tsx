import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Plus, PenSquare, Menu, X } from "lucide-react";
import { UserDesktopMenu } from "./UserDesktopMenu";

interface HeaderRightControlsProps {
  isAdmin: boolean;
  authUser: any;
  profile?: {
    username?: string;
    avatar_url?: string;
    role?: string;
    color?: string;
  } | null;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (value: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (value: boolean) => void;
  currentTheme: string;
  userButtonRef: React.RefObject<HTMLButtonElement>;
  userMenuRef: React.RefObject<HTMLDivElement>;
  handleLogout: () => void;
  openAuthModal: (mode: "login" | "register") => void;
}

export const HeaderRightControls: React.FC<HeaderRightControlsProps> = ({
  isAdmin,
  authUser,
  profile,
  isUserMenuOpen,
  setIsUserMenuOpen,
  isMenuOpen,
  setIsMenuOpen,
  currentTheme,
  userButtonRef,
  userMenuRef,
  handleLogout,
  openAuthModal,
}) => {
  return (
    <div className="flex items-center gap-1 md:gap-3">
      {/* Botones de creación - Ocultar en pantallas menores a 1024px */}
      <div className="hidden lg:flex items-center gap-2">
        <ModeToggle />
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-sm"
            style={
              {
                "--hover-bg": profile?.color
                  ? `${profile.color}1a`
                  : "rgba(37, 99, 235, 0.1)",
                "--hover-text": profile?.color || "#2563eb",
                "--dark-hover-bg": profile?.color
                  ? `${profile.color}1a`
                  : "rgba(96, 165, 250, 0.1)",
                "--dark-hover-text": profile?.color || "#60a5fa",
              } as React.CSSProperties
            }
          >
            <Link href="/admin/noticias/nueva" className="hover:bg-[var(--hover-bg)] dark:hover:bg-[var(--dark-hover-bg)] hover:text-[var(--hover-text)] dark:hover:text-[var(--dark-hover-text)] px-2 py-1 rounded">
              <Plus className="h-4 w-4 mr-1" />
              Noticia
            </Link>
          </Button>
        )}
        {authUser && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-sm"
            style={
              {
                "--hover-bg": profile?.color
                  ? `${profile.color}1a`
                  : "rgba(37, 99, 235, 0.1)",
                "--hover-text": profile?.color || "#2563eb",
                "--dark-hover-bg": profile?.color
                  ? `${profile.color}1a`
                  : "rgba(96, 165, 250, 0.1)",
                "--dark-hover-text": profile?.color || "#60a5fa",
              } as React.CSSProperties
            }
          >
            <Link href="/foro/nuevo-hilo" className="hover:bg-[var(--hover-bg)] dark:hover:bg-[var(--dark-hover-bg)] hover:text-[var(--hover-text)] dark:hover:text-[var(--dark-hover-text)] px-2 py-1 rounded">
              <PenSquare className="h-4 w-4 mr-1" />
              Hilo
            </Link>
          </Button>
        )}
      </div>

      {/* Usuario/Auth - Desktop */}
      <div className="hidden lg:flex items-center gap-4">
        {authUser ? (
          <UserDesktopMenu
            isOpen={isUserMenuOpen}
            onToggle={() => setIsUserMenuOpen(!isUserMenuOpen)}
            onClose={() => setIsUserMenuOpen(false)}
            onLogout={handleLogout}
            currentTheme={currentTheme}
            authUser={authUser}
            profile={profile}
            userButtonRef={userButtonRef}
            userMenuRef={userMenuRef}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAuthModal("login")}
            >
              Iniciar Sesión
            </Button>
            <Button
              size="sm"
              onClick={() => openAuthModal("register")}
            >
              Registrarse
            </Button>
          </div>
        )}
      </div>

      {/* Botón de menú móvil - Mostrar en pantallas menores a 1024px */}
      <div className="block lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2"
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
