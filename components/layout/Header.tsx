"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";

export const Header = ({ locale }: { locale: string }) => {
  const { user, logout } = useAuth();
  const { t, isReady } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu when a link is clicked
  const closeMenu = () => setMobileMenuOpen(false);

  if (!isReady) return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href={`/${locale}`}
            className="text-2xl font-bold text-primary"
            onClick={closeMenu}
          >
            ONIVA
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLinks user={user} locale={locale} t={t} />
            <div className="flex items-center gap-4 ml-4 border-l pl-4">
              <LanguageSwitcher locale={locale} />
              <AuthButton user={user} logout={logout} t={t} locale={locale} />
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col p-4 gap-4">
            <NavLinks user={user} locale={locale} t={t} onClick={closeMenu} />

            <div className="hr border-t border-gray-100 my-2" />

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">
                  {t("common.language")}
                </span>
                <LanguageSwitcher locale={locale} />
              </div>
              <AuthButton
                user={user}
                logout={logout}
                t={t}
                locale={locale}
                mobile
                onClick={closeMenu}
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

/* --- Sub-components for cleaner logic --- */

const NavLinks = ({ user, locale, t, onClick }: any) => {
  if (!user) return null;

  return (
    <>
      <Link
        href={`/${locale}/${user.role}/dashboard`}
        onClick={onClick}
        className="hover:text-primary transition-colors"
      >
        {t("navigation.home")}
      </Link>

      {user.role === "client" && (
        <>
          <Link href={`/${locale}/${user.role}/profile`} onClick={onClick}>
            {t("navigation.profile")}
          </Link>
          <Link href={`/${locale}/${user.role}/book-trip`} onClick={onClick}>
            {t("client.bookTrip")}
          </Link>
          <Link href={`/${locale}/${user.role}/client-trips`} onClick={onClick}>
            {t("client.myTrips")}
          </Link>
        </>
      )}

      {user.role === "driver" && (
        <>
          <Link href={`/${locale}/${user.role}/profile`} onClick={onClick}>
            {t("navigation.profile")}
          </Link>
          <Link href={`/${locale}/${user.role}/driver-trips`} onClick={onClick}>
            {t("driver.myTrips")}
          </Link>
          <Link href={`/${locale}/${user.role}/earnings`} onClick={onClick}>
            {t("driver.earnings")}
          </Link>
        </>
      )}

      {user.role === "admin" && (
        <>
          <Link href={`/${locale}/${user.role}/drivers`} onClick={onClick}>
            {t("admin.drivers")}
          </Link>
          <Link href={`/${locale}/${user.role}/users`} onClick={onClick}>
            {t("admin.users")}
          </Link>
          <Link href={`/${locale}/${user.role}/earnings`} onClick={onClick}>
            {t("admin.earnings")}
          </Link>
          <Link href={`/${locale}/${user.role}/reports`} onClick={onClick}>
            {t("admin.reports")}
          </Link>
          <Link href={`/${locale}/${user.role}/pricing`} onClick={onClick}>
            {t("admin.pricing")}
          </Link>
          <Link href={`/${locale}/${user.role}/trips`} onClick={onClick}>
            {t("admin.trips")}
          </Link>
          <Link href={`/${locale}/${user.role}/settings`} onClick={onClick}>
            {t("navigation.settings") || "Settings"}
          </Link>
        </>
      )}
    </>
  );
};

const AuthButton = ({ user, logout, t, locale, mobile, onClick }: any) => {
  if (user) {
    return (
      <button
        onClick={() => {
          logout();
          if (onClick) onClick();
        }}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-800 ${
          mobile ? "w-full justify-center" : "ml-2 shadow-sm"
        }`}
      >
        <FiLogOut className="w-[18px] h-[18px]" /> 
        <span>{t("common.logout")}</span>
      </button>
    );
  }
  return (
    <>
    <Link
      href={`/${locale}/login`}
      onClick={onClick}
      className={`btn btn-primary text-center ${mobile ? "w-full py-2" : "px-1 py-1"}`}
    >
      {t("auth.login")}
    </Link>
    <Link
      href={`/${locale}/register`}
      onClick={onClick}
      className={`btn btn-primary text-center ${mobile ? "w-full py-2" : "px-1 py-1"}`}
    >
      {t("auth.register")}
    </Link>
    </>
  );
};
