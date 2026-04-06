import { NextRequest, NextResponse } from 'next/server';
import { i18nConfig } from './config/i18n';

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if pathname starts with a supported locale
  const pathnameHasLocale = i18nConfig.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If pathname doesn't have locale, redirect with default locale
  if (!pathnameHasLocale) {
    const locale = i18nConfig.defaultLocale;
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }

  // Get current locale
  const locale = pathname.split('/')[1] || i18nConfig.defaultLocale;
  const token = request.cookies.get('token')?.value;

  // Protected routes list
  const protectedRoutes = ['/client', '/driver', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(`/${locale}${route}`) || pathname === `/${locale}${route}`
  );

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    // Optional: add a redirect query param to return to the original page after login
    // loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};