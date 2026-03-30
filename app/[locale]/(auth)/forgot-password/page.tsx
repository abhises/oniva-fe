"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { t } = useTranslation();
  const { request, isLoading } = useApi();
  
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP & New Password
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return toast.error(t("auth.phoneRequired"));
    
    const result = await request(() => apiClient.forgotPassword(phone));
    if (result) {
      setStep(2);
      toast.success(t("auth.sendResetCodeSuccess") || "Reset code sent!");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error("OTP is required");
    if (newPassword.length < 6) return toast.error("Password too short");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

    const result = await request(() => apiClient.resetPassword({
      phone,
      otp,
      newPassword
    }));

    if (result) {
      toast.success(t("auth.passwordResetSuccess"));
      router.push(`/${locale}/login`);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="card space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-blue-600">ONIVA</h1>
            <p className="text-gray-600 text-lg">{t("auth.forgotPassword")}</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <Input
                label={t("auth.phone")}
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
                {t("auth.sendResetCode")}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <Input
                label={t("auth.resetCode")}
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isLoading}
              />
              <Input
                label={t("auth.newPassword")}
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
              <Input
                label={t("auth.confirmNewPassword")}
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
                {t("auth.resetPassword")}
              </Button>
            </form>
          )}

          <div className="text-center">
            <Link href={`/${locale}/login`} className="text-blue-600 font-semibold hover:text-blue-700">
              {t("common.backToLogin") || "Back to Login"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
