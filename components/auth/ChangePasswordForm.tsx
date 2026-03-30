"use client";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { FiLock } from "react-icons/fi";
import toast from "react-hot-toast";

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const { request, isLoading } = useApi();
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (formData.newPassword.length < 6) {
      return toast.error("Password too short");
    }

    const result = await request(() => apiClient.changePassword({
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    }));

    if (result) {
      toast.success(t("auth.passwordChangedSuccess") || "Password updated!");
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-6 mt-6 border-t">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <FiLock /> {t("auth.changePassword")}
      </h3>
      <Input
        label={t("auth.oldPassword")}
        type="password"
        name="oldPassword"
        value={formData.oldPassword}
        onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
        disabled={isLoading}
      />
      <Input
        label={t("auth.newPassword")}
        type="password"
        name="newPassword"
        value={formData.newPassword}
        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
        disabled={isLoading}
      />
      <Input
        label={t("auth.confirmNewPassword")}
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        disabled={isLoading}
      />
      <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
        {t("auth.changePassword")}
      </Button>
    </form>
  );
}
