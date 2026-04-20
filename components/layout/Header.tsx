"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { FiMenu, FiX, FiLogOut, FiChevronDown, FiUser, FiActivity } from "react-icons/fi";

export const Header = ({ locale }: { locale: string }) => {
  const { user, logout } = useAuth();
  const { t, isReady } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  if (!isReady) return null;

  return (
    <header 
      className={`sticky top-0 left-0 right-0 z-[9999] transition-all duration-300 mb-4 ${
        scrolled 
          ? "py-1 bg-white shadow-md border-b border-gray-100" 
          : "py-1 bg-white shadow-sm border-b border-gray-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo Section */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2"
            onClick={closeMenu}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10 transition-all duration-200">
              <span className="text-white font-black text-xl leading-none">O</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-gray-900">
              ONIVA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1">
            <NavLinks user={user} locale={locale} t={t} pathname={pathname} />
            <div className="h-6 w-[1px] bg-gray-200 mx-4" />
            <div className="flex items-center gap-3">
              <LanguageSwitcher locale={locale} />
              <AuthButton user={user} logout={logout} t={t} locale={locale} />
            </div>
          </nav>

          {/* Mobile Menu Button - Also visible on smaller desktops now due to many links */}
          <button
            className="xl:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 top-20 bg-white z-[9998] animate-in fade-in slide-in-from-top-2 duration-200 overflow-y-auto pb-10">
          <nav className="flex flex-col p-6 gap-1">
            <NavLinks user={user} locale={locale} t={t} pathname={pathname} onClick={closeMenu} mobile />

            <div className="h-[1px] bg-gray-100 my-4" />

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-4">
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2">
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

/* --- Sub-components --- */

const NavLinks = ({ user, locale, t, pathname, onClick, mobile }: any) => {
  if (!user) return null;

  const links = [
    { href: `/${locale}/${user.role}/dashboard`, label: t("navigation.home") },
    ...(user.role === "client" ? [
      { href: `/${locale}/${user.role}/profile`, label: t("navigation.profile") },
      { href: `/${locale}/${user.role}/book-trip`, label: t("client.bookTrip") },
      { href: `/${locale}/${user.role}/client-trips`, label: t("client.myTrips") },
      { href: `/${locale}/${user.role}/settings`, label: t("navigation.settings") || "Settings" },
    ] : []),
    ...(user.role === "driver" ? [
      { href: `/${locale}/${user.role}/profile`, label: t("navigation.profile") },
      { href: `/${locale}/${user.role}/driver-trips`, label: t("driver.myTrips") },
      { href: `/${locale}/${user.role}/earnings`, label: t("driver.earnings") },
      { href: `/${locale}/${user.role}/settings`, label: t("navigation.settings") || "Settings" },
    ] : []),
    ...(user.role === "admin" ? [
      { href: `/${locale}/${user.role}/drivers`, label: t("admin.drivers") },
      { href: `/${locale}/${user.role}/users`, label: t("admin.users") },
      { href: `/${locale}/${user.role}/earnings`, label: t("admin.earnings") },
      { href: `/${locale}/${user.role}/reports`, label: t("admin.reports") },
      { href: `/${locale}/${user.role}/pricing`, label: t("admin.pricing") },
      { href: `/${locale}/${user.role}/trips`, label: t("admin.trips") },
      { href: `/${locale}/${user.role}/transactions`, label: t("admin.transactions") },
      { href: `/${locale}/${user.role}/settings`, label: t("navigation.settings") || "Settings" },
    ] : []),
  ];

  return (
    <>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClick}
            className={`
              relative px-3 py-2 text-sm font-semibold transition-all duration-200 rounded-xl
              ${mobile ? "w-full text-base py-3 flex items-center justify-between" : "whitespace-nowrap"}
              ${isActive 
                ? "text-blue-600 bg-blue-50/50" 
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"}
            `}
          >
            {link.label}
            {isActive && !mobile && (
              <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-blue-600 rounded-full animate-in fade-in slide-in-from-bottom-1" />
            )}
          </Link>
        );
      })}
    </>
  );
};


const AuthButton = ({ user, logout, t, locale, mobile, onClick }: any) => {
  if (user) {
    return (
      <div className={`flex items-center gap-2 ${mobile ? "flex-col w-full mt-4" : ""}`}>
        <button
          onClick={() => {
            logout();
            if (onClick) onClick();
          }}
          className={`
            flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all duration-200
            rounded-xl shadow-sm border
            ${mobile 
              ? "w-full justify-center bg-red-50 text-red-600 border-red-100 py-4" 
              : "text-gray-700 bg-white border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100"}
          `}
        >
          <FiLogOut className="w-4 h-4" /> 
          <span>{t("common.logout")}</span>
        </button>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-3 ${mobile ? "flex-col w-full" : ""}`}>
      <Link
        href={`/${locale}/login`}
        onClick={onClick}
        className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
          mobile ? "w-full text-center py-4 bg-gray-50 text-gray-900" : "text-gray-700 hover:text-blue-600"
        }`}
      >
        {t("auth.login")}
      </Link>
      <Link
        href={`/${locale}/register`}
        onClick={onClick}
        className={`px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 transition-all ${
          mobile ? "w-full text-center py-4" : ""
        }`}
      >
        {t("auth.register")}
      </Link>
    </div>
  );
};

