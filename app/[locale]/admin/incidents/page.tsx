"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { apiClient } from '@/services/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

interface IncidentItem {
  id: number;
  trip_id: number;
  type: string;
  description: string;
  status: string;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
  driver_id: number;
  client_id: number;
  driver_name?: string;
  client_name?: string;
}

export default function AdminIncidentsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'investigating' | 'resolved' | 'closed' | 'suspended'>('all');

  const loadIncidents = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getAdminIncidents({ status: statusFilter });
      if (response && response.success) {
        setIncidents(response.data);
      } else {
        toast.error(t('admin.failedLoadTrips'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('admin.failedLoadTrips'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadIncidents(); }, [statusFilter]);

  const handleIncidentAction = async (incidentId: number, action: 'resolved' | 'suspended') => {
    try {
      const status = action;
      await apiClient.updateAdminIncident(incidentId, {
        status,
        resolutionNote: action === 'resolved' ? 'Issue resolved by admin' : 'Driver suspended due to incident',
        action: action === 'suspended' ? 'suspend_driver' : undefined,
      });
      toast.success(t('admin.success'));
      loadIncidents();
    } catch (error) {
      console.error(error);
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

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <FiAlertCircle />
              {t('admin.incidents') || 'Incident Reports'}
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/en/admin/trips')}>
              <FiArrowLeft className="w-4 h-4 mr-1" /> {t('common.back')}
            </Button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {(['all', 'open', 'investigating', 'resolved', 'closed', 'suspended'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? t('common.all') : status}
              </Button>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-3">{t('admin.tripId')}</th>
                  <th className="px-4 py-3">{t('admin.driver')}</th>
                  <th className="px-4 py-3">{t('admin.client')}</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">{t('common.status')}</th>
                  <th className="px-4 py-3">{t('common.startDate')}</th>
                  <th className="px-4 py-3">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  incidents.map((incident) => (
                    <tr key={incident.id} className="border-b">
                      <td className="px-4 py-3">#{incident.trip_id}</td>
                      <td className="px-4 py-3">{incident.driver_name || incident.driver_id || '-'}</td>
                      <td className="px-4 py-3">{incident.client_name || incident.client_id || '-'}</td>
                      <td className="px-4 py-3">{incident.type}</td>
                      <td className="px-4 py-3">{incident.status}</td>
                      <td className="px-4 py-3">{new Date(incident.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 space-x-2">
                        <Button variant="primary" size="sm" onClick={() => router.push(`/en/admin/incidents/${incident.id}`)}>
                          {t('common.viewDetails')}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleIncidentAction(incident.id, 'resolved')}>
                          Resolve
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleIncidentAction(incident.id, 'suspended')}>
                          Suspend Driver
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
