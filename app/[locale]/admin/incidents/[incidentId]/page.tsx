"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { apiClient } from '@/services/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import toast from 'react-hot-toast';

export default function AdminIncidentDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const incidentId = params?.incidentId ? String(params.incidentId) : null;
  const router = useRouter();

  const [incident, setIncident] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadIncident = async () => {
    if (!incidentId) return;
    setIsLoading(true);
    try {
      const response = await apiClient.getAdminIncident(incidentId);
      if (response && response.success) {
        setIncident(response.data);
      } else {
        toast.error(t('admin.failedLoadTrips'));
        router.back();
      }
    } catch (err) {
      console.error(err);
      toast.error(t('admin.failedLoadTrips'));
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadIncident(); }, [incidentId]);

  const handleAction = async (status: 'investigating' | 'resolved' | 'suspended') => {
    if (!incidentId) return;

    try {
      await apiClient.updateAdminIncident(incidentId, {
        status,
        resolutionNote: status === 'resolved' ? 'Incident resolved' : status === 'suspended' ? 'Driver suspended' : 'Investigation in progress',
        action: status === 'suspended' ? 'suspend_driver' : undefined,
      });
      toast.success(t('admin.success'));
      loadIncident();
    } catch (err) {
      console.error(err);
      toast.error(t('admin.failedLoadTrips'));
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader />
        </div>
      </ProtectedRoute>
    );
  }

  if (!incident) return null;

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('admin.incident')} #{incident.id}</h1>
              <p className="text-sm text-gray-500">Trip #{incident.trip_id} | Status: {incident.status}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.back()}>{t('common.back')}</Button>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800">Type</h2>
              <p className="text-gray-700">{incident.type}</p>
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Description</h2>
              <p className="text-gray-700">{incident.description}</p>
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Reported By</h2>
              <p className="text-gray-700">{incident.reported_by || 'Unknown'}</p>
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Resolution Note</h2>
              <p className="text-gray-700">{incident.resolution_note || '-'}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => handleAction('investigating')}>Mark Investigating</Button>
            <Button variant="primary" size="sm" onClick={() => handleAction('resolved')}>Mark Resolved</Button>
            <Button variant="danger" size="sm" onClick={() => handleAction('suspended')}>Suspend Driver</Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
