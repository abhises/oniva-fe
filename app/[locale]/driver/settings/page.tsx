"use client";

import { useTranslation } from "react-i18next";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { FiSettings } from "react-icons/fi";

export default function DriverSettingsPage() {
  const { t } = useTranslation();

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <FiSettings className="text-primary" />
          {t("common.settings", "Settings")}
        </h1>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-2xl">
          <h2 className="text-xl font-bold mb-6 text-gray-800">{t("common.changePassword", "Change Password")}</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </ProtectedRoute>
  );
}
