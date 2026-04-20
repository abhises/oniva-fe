'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/services/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/common/Button';

import {
  FiUser, FiPhone, FiGlobe, FiEdit2,
  FiCheck, FiX, FiCamera, FiLoader,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const setUser = useAuthStore((s) => s.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string>((user as any)?.profile_photo || '');

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: (user as any)?.email || '',
    language: user?.language || 'en',
  });

  // Fetch fresh profile from DB on every page load (store may not have profile_photo)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiClient.getClientProfile() as any;
        const data = res?.data || res;
        if (data) {
          const photo = data.profile_photo || '';
          setProfilePhoto(photo);
          setProfileForm({
            fullName: data.full_name || user?.fullName || '',
            email: data.email || '',
            language: data.language || user?.language || 'en',
          });
          // Sync store so header stays fresh
          if (user && photo && !(user as any).profile_photo) {
            setUser({ ...user, ...(user as any), profile_photo: photo });
          }
        }
      } catch {
        // fallback to store values already set
      }
    };
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Photo Upload ──────────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG or WebP images are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5 MB');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const ext = file.name.split('.').pop();
      const filePath = `profiles/${user?.id || 'unknown'}/avatar_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('oniva-image')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('oniva-image')
        .getPublicUrl(filePath);

      // Persist to backend
      await apiClient.updateClientProfile({
        fullName: user?.fullName || '',
        language: user?.language || 'en',
        profilePhoto: publicUrl,
      });

      setProfilePhoto(publicUrl);
      setUser({ ...user!, ...(user as any), profile_photo: publicUrl });
      toast.success('Profile photo updated!');
    } catch (err: any) {
      toast.error(err.message || 'Photo upload failed');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Text Profile Save ─────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profileForm.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    try {
      setIsSaving(true);
      const result = await apiClient.updateClientProfile({
        fullName: profileForm.fullName,
        email: profileForm.email || undefined,
        language: profileForm.language,
      });
      if (result?.success) {
        setUser({ ...user!, fullName: profileForm.fullName, language: profileForm.language });
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileForm({
      fullName: user?.fullName || '',
      email: (user as any)?.email || '',
      language: user?.language || 'en',
    });
    setIsEditing(false);
  };

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('navigation.profile')}</h1>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">

          {/* Header: Avatar + Name + Edit Button */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-5">

              {/* Avatar with upload overlay */}
              <div className="relative group">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Hover overlay */}
                <label
                  className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Change photo"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                    disabled={isUploadingPhoto}
                  />
                  {isUploadingPhoto ? (
                    <FiLoader className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <FiCamera className="w-5 h-5 text-white" />
                  )}
                </label>

                {isUploadingPhoto && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.fullName}</h2>
                <p className="text-sm text-gray-500 capitalize flex items-center gap-1">
                  <FiUser className="w-3.5 h-3.5" /> {user?.role}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Hover avatar to change photo</p>
              </div>
            </div>

            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <FiEdit2 className="w-4 h-4 mr-1" /> {t('common.edit')}
              </Button>
            )}
          </div>

          {/* Body */}
          <div className="p-6">
            {isEditing ? (
              /* ---- EDIT MODE ---- */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                    {t('auth.fullName')}
                  </label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Enter your email (optional)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                    {t('common.language')}
                  </label>
                  <select
                    value={profileForm.language}
                    onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="primary" onClick={handleSaveProfile} isLoading={isSaving} disabled={isSaving}>
                    <FiCheck className="w-4 h-4 mr-1" /> {t('common.save')}
                  </Button>
                  <Button variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
                    <FiX className="w-4 h-4 mr-1" /> {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              /* ---- VIEW MODE ---- */
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FiUser className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">{t('auth.fullName')}</p>
                    <p className="font-semibold text-gray-900">{user?.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FiPhone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">{t('auth.phone')}</p>
                    <p className="font-semibold text-gray-900">{user?.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FiGlobe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">{t('common.language')}</p>
                    <p className="font-semibold text-gray-900 uppercase">{user?.language}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


      </div>
    </ProtectedRoute>
  );
}