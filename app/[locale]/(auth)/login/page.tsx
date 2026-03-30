"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { login, isAuthenticated } = useAuth();
  const { t, isReady } = useTranslation();
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  // FIX: Only mount after client is ready
  useEffect(() => {
    setMounted(true);
  }, []);
  // FIX: Redirect if authenticated
  // useEffect(() => {
  //   if (mounted && isAuthenticated) {
  //     router.push(`/${locale}/dashboard`);
  //   }
  // }, [mounted, isAuthenticated, locale, router]);
  // FIX: Show loading while translations are loading
  if (!mounted || !isReady) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="card space-y-8">
            <div className="text-center space-y-4">
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.phone.trim()) {
      newErrors.phone = t("auth.phoneRequired");
    }

    if (!formData.password) {
      newErrors.password = t("auth.passwordRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.phone, formData.password);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="card space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-blue-600">ONIVA</h1>
            <p className="text-gray-600 text-lg">{t("auth.login")}</p>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t("auth.phone")}
              name="phone"
              type="tel"
              placeholder="+1234567890"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              disabled={isLoading}
            />

            <Input
              label={t("auth.password")}
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              disabled={isLoading}
            />

            {/* <div className="flex justify-end">
              <Link
                href={`/${locale}/forgot-password`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div> */}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
            >
              {t("auth.login")}
            </Button>
          </form>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-gray-600">
              {t("auth.noAccount")}{" "}
              <Link
                href={`/${locale}/register`}
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                {t("auth.register")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
