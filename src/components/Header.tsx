"use client";

import React from "react";
import Link from "next/link";
import { AuthModal } from "@/components/auth/AuthModal";
import { useHeaderLogic } from "./header/useHeaderLogic";
import { HeaderDesktopNav } from "./header/HeaderDesktopNav";
import { HeaderRightControls } from "./header/HeaderRightControls";
import { HeaderMobileMenu } from "./header/HeaderMobileMenu";

const Header: React.FC = () => {
  const {
    // Estados
    isMenuOpen,
    setIsMenuOpen,
    isUserMenuOpen,
    setIsUserMenuOpen,
    isAdmin,
    currentTheme,
    isAdminMenuOpen,
    setIsAdminMenuOpen,
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
    expandedCategories,
    setExpandedCategories,
    
    // Referencias
    adminMenuRef,
    userMenuRef,
    userButtonRef,
    
    // Datos de autenticación
    authUser,
    profile,
    
    // Funciones
    handleLogout,
    closeAllMenus,
    openAuthModal,
    handleSearch,
  } = useHeaderLogic();

  return (
    <div
      role="banner"
      className={`fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 text-gray-900 dark:text-white shadow-sm w-full transition-all duration-200 ${
        currentTheme === 'light'
          ? 'bg-white'
          : 'bg-black'
      }`}
      style={{
        backgroundColor: currentTheme === 'light' ? 'white' : 'black',
        opacity: 1
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 md:gap-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link
              className="flex items-center gap-3"
              href="/"
              onClick={closeAllMenus}
            >
              <img
                src="/images/logo.png"
                alt="MC Community Logo"
                className="h-8 w-8"
              />
              <span className="hidden xs:block font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                BitArena
              </span>
            </Link>
          </div>

          {/* Navegación Desktop y Búsqueda */}
          <HeaderDesktopNav
            isAdmin={isAdmin}
            isAdminMenuOpen={isAdminMenuOpen}
            setIsAdminMenuOpen={setIsAdminMenuOpen}
            closeAllMenus={closeAllMenus}
            currentTheme={currentTheme}
            profile={profile}
            adminMenuRef={adminMenuRef}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
          />

          {/* Controles del lado derecho */}
          <HeaderRightControls
            isAdmin={isAdmin}
            authUser={authUser}
            profile={profile}
            isUserMenuOpen={isUserMenuOpen}
            setIsUserMenuOpen={setIsUserMenuOpen}
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            currentTheme={currentTheme}
            userButtonRef={userButtonRef}
            userMenuRef={userMenuRef}
            handleLogout={handleLogout}
            openAuthModal={openAuthModal}
          />
        </div>
      </div>

      {/* Menú móvil */}
      <HeaderMobileMenu
        isOpen={isMenuOpen}
        authUser={authUser}
        profile={profile}
        currentTheme={currentTheme}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        closeAllMenus={closeAllMenus}
        handleLogout={handleLogout}
        openAuthModal={openAuthModal}
        noticiasMobileOpen={noticiasMobileOpen}
        setNoticiasMobileOpen={setNoticiasMobileOpen}
        foroMobileOpen={foroMobileOpen}
        setForoMobileOpen={setForoMobileOpen}
        foroCategorias={foroCategorias}
        expandedCategories={expandedCategories}
        setExpandedCategories={setExpandedCategories}
        isAdmin={isAdmin}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
        redirectTo={authRedirectTo}
      />
    </div>
  );
};

export default Header;
