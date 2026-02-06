"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || "en";
  const roleFromUrl = searchParams.get("role") || "client";
  const { register, isAuthenticated } = useAuth();
  const { t, isReady } = useTranslation();
  const [formData, setFormData] = useState({
    phone: "",
    fullName: "",
    password: "",
    confirmPassword: "",
    role: roleFromUrl as "client" | "driver",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  // FIX: Only mount after client is ready
  useEffect(() => {
    setMounted(true);
  }, []);
  // FIX: Redirect if authenticated
  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push(`/${locale}/dashboard`);
    }
  }, [mounted, isAuthenticated, locale, router]);
  // FIX: Show loading while translations are loading
  if (!mounted || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
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

    if (!formData.fullName.trim()) {
      newErrors.fullName = t("auth.fullNameRequired");
    }

    if (!formData.password) {
      newErrors.password = t("auth.passwordRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
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
      await register(
        formData.phone,
        formData.fullName,
        formData.password,
        formData.role,
      );
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="card space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-blue-600">ONIVA</h1>
            <p className="text-gray-600 text-lg">{t("auth.register")}</p>
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
              label={t("auth.fullName")}
              name="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              disabled={isLoading}
            />

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Register as
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full"
              >
                <option value="client">Client - Book Rides</option>
                <option value="driver">Driver - Provide Rides</option>
              </select>
            </div>

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

            <Input
              label={t("auth.confirmPassword")}
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
            >
              {t("auth.register")}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href={`/${locale}/login`}
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                {t("auth.login")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
