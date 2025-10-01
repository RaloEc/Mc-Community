import React from "react";
import Link from "next/link";

interface AdminDesktopMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  currentTheme: string;
  profile?: {
    color?: string;
  } | null;
  menuRef: React.RefObject<HTMLLIElement>;
}

export const AdminDesktopMenu: React.FC<AdminDesktopMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
  currentTheme,
  profile,
  menuRef,
}) => {
  return (
    <li className="relative" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="px-4 py-2 transition font-medium hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
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
        onClick={onToggle}
      >
        <span className="hover:bg-[var(--hover-bg)] dark:hover:bg-[var(--dark-hover-bg)] hover:text-[var(--hover-text)] dark:hover:text-[var(--dark-hover-text)] px-2 py-1 rounded">
          Admin
        </span>
      </button>
      <div
        className={`absolute top-full left-0 mt-1 w-56 rounded-md border shadow-lg ${
          currentTheme === "light"
            ? "bg-white border-gray-200"
            : "bg-black border-gray-800"
        } transition-all duration-200 ease-in-out transform origin-top-left ${
          isOpen
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <ul className="py-2 text-sm">
          <li className="menu-item">
            <Link
              href="/admin/dashboard"
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
              className={`block px-4 py-2 transition-colors ${
                currentTheme === "light"
                  ? "text-gray-700 hover:bg-[var(--hover-bg)] hover:text-[var(--hover-text)]"
                  : "text-gray-200 hover:bg-[var(--dark-hover-bg)] hover:text-[var(--dark-hover-text)]"
              }`}
              onClick={onClose}
            >
              Dashboard
            </Link>
          </li>
          <li className="menu-item">
            <Link
              href="/admin/noticias"
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
              className={`block px-4 py-2 transition-colors ${
                currentTheme === "light"
                  ? "text-gray-700 hover:bg-[var(--hover-bg)] hover:text-[var(--hover-text)]"
                  : "text-gray-200 hover:bg-[var(--dark-hover-bg)] hover:text-[var(--dark-hover-text)]"
              }`}
              onClick={onClose}
            >
              Admin Noticias
            </Link>
          </li>
          <li className="menu-item">
            <Link
              href="/admin/usuarios"
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
              className={`block px-4 py-2 transition-colors ${
                currentTheme === "light"
                  ? "text-gray-700 hover:bg-[var(--hover-bg)] hover:text-[var(--hover-text)]"
                  : "text-gray-200 hover:bg-[var(--dark-hover-bg)] hover:text-[var(--dark-hover-text)]"
              }`}
              onClick={onClose}
            >
              Admin Usuarios
            </Link>
          </li>
          <li className="menu-item">
            <Link
              href="/admin/foro"
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
              className={`block px-4 py-2 transition-colors ${
                currentTheme === "light"
                  ? "text-gray-700 hover:bg-[var(--hover-bg)] hover:text-[var(--hover-text)]"
                  : "text-gray-200 hover:bg-[var(--dark-hover-bg)] hover:text-[var(--dark-hover-text)]"
              }`}
              onClick={onClose}
            >
              Admin Foro
            </Link>
          </li>
        </ul>
      </div>
    </li>
  );
};
