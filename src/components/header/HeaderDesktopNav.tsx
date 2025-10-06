import React from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AdminDesktopMenu } from "./AdminDesktopMenu";

interface HeaderDesktopNavProps {
  isAdmin: boolean;
  isAdminMenuOpen: boolean;
  setIsAdminMenuOpen: (value: boolean) => void;
  closeAllMenus: () => void;
  profile?: {
    color?: string;
  } | null;
  adminMenuRef: React.RefObject<HTMLLIElement>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
}

export const HeaderDesktopNav: React.FC<HeaderDesktopNavProps> = ({
  isAdmin,
  isAdminMenuOpen,
  setIsAdminMenuOpen,
  closeAllMenus,
  profile,
  adminMenuRef,
  searchQuery,
  setSearchQuery,
  handleSearch,
}) => {
  return (
    <>
      {/* Navegación principal - Solo Desktop */}
      <nav aria-label="Global" className="hidden lg:block">
        <ul className="flex items-center gap-1 text-sm">
          <li className="menu-item">
            <Link
              href="/noticias"
              className="px-4 py-2 rounded-lg transition-colors font-medium"
              style={
                {
                  "--tw-text-opacity": 1,
                  "--tw-bg-opacity": 0.05,
                  "--hover-bg": profile?.color
                    ? `${profile.color}1a`
                    : "rgba(37, 99, 235, 0.1)",
                  "--hover-text": profile?.color || "#2563eb",
                  "--dark-hover-bg": profile?.color
                    ? `${profile.color}1a`
                    : "rgba(96, 165, 250, 0.1)",
                  "--dark-hover-text": profile?.color || "#60a5fa",
                  "--tw-ring-color": profile?.color || "#2563eb",
                  "--dark-ring-color": profile?.color || "#60a5fa",
                } as React.CSSProperties
              }
              onClick={closeAllMenus}
            >
              <span className="hover:bg-[var(--hover-bg)] dark:hover:bg-[var(--dark-hover-bg)] hover:text-[var(--hover-text)] dark:hover:text-[var(--dark-hover-text)] px-2 py-1 rounded">
                Noticias
              </span>
            </Link>
          </li>
          <li className="menu-item">
            <Link
              href="/foro"
              className="px-4 py-2 rounded-lg transition-colors font-medium"
              style={
                {
                  "--tw-text-opacity": 1,
                  "--tw-bg-opacity": 0.05,
                  "--hover-bg": profile?.color
                    ? `${profile.color}1a`
                    : "rgba(37, 99, 235, 0.1)",
                  "--hover-text": profile?.color || "#2563eb",
                  "--dark-hover-bg": profile?.color
                    ? `${profile.color}1a`
                    : "rgba(96, 165, 250, 0.1)",
                  "--dark-hover-text": profile?.color || "#60a5fa",
                  "--tw-ring-color": profile?.color || "#2563eb",
                  "--dark-ring-color": profile?.color || "#60a5fa",
                } as React.CSSProperties
              }
              onClick={closeAllMenus}
            >
              <span className="hover:bg-[var(--hover-bg)] dark:hover:bg-[var(--dark-hover-bg)] hover:text-[var(--hover-text)] dark:hover:text-[var(--dark-hover-text)] px-2 py-1 rounded">
                Foro
              </span>
            </Link>
          </li>
          {isAdmin && (
            <AdminDesktopMenu
              isOpen={isAdminMenuOpen}
              onToggle={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
              onClose={() => setIsAdminMenuOpen(false)}
              profile={profile}
              menuRef={adminMenuRef}
            />
          )}
        </ul>
      </nav>

      {/* Barra de búsqueda centrada - solo desktop */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Buscar noticias, hilos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={
              {
                "--focus-border-color": profile?.color || "#3b82f6",
                "--focus-ring-color": profile?.color
                  ? `${profile.color}40`
                  : "rgba(59, 130, 246, 0.25)",
              } as React.CSSProperties
            }
            className={`pl-10 pr-4 py-2 w-full bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 rounded-full
              focus:border-[var(--focus-border-color)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color)]
              dark:focus:border-[var(--focus-border-color)] dark:focus-visible:ring-2 dark:focus-visible:ring-[var(--focus-ring-color)]
              transition-colors duration-200`}
          />
        </form>
      </div>
    </>
  );
};
