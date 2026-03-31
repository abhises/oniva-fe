"use client";

import React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTranslation } from "@/hooks/useTranslation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export default function AdminSettingsPage() {
  const { t } = useTranslation();

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">
            {t("navigation.settings") || "Settings"}
          </h1>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-hidden">
            <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">
              {t("auth.changePassword") || "Change Password"}
            </h2>
            <div className="max-w-2xl">
              <ChangePasswordForm />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
