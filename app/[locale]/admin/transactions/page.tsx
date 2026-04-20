'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/services/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/common/Button'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  FiArrowLeft, FiSearch, FiRefreshCw, FiDownload,
  FiDollarSign, FiChevronLeft, FiChevronRight, FiFilter,
  FiTrendingUp, FiUsers, FiPercent
} from 'react-icons/fi'

interface Transaction {
  id: number
  status: string
  booking_type: string
  pickup_address: string
  destination_address: string
  actual_distance: number
  estimated_distance: number
  total_price: number
  final_price: number
  base_price: number
  platform_commission: number
  driver_earnings: number
  payment_method: string
  region: string
  created_at: string
  completed_at: string
  client_id: number
  client_name: string
  client_phone: string
  driver_id: number
  driver_name: string
  driver_phone: string
}

interface Summary {
  totalRevenue: number
  totalCommission: number
  totalDriverEarnings: number
  count: number
  activeCommission?: number
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-indigo-100 text-indigo-800',
}

export default function AdminTransactionsPage() {
  const router = useRouter()
  const { t } = useTranslation()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pagination, setPagination] = useState({ total: 0, limit: 25, offset: 0, hasMore: false })

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await apiClient.getAdminTransactions({
        status: statusFilter,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: pagination.limit,
        offset: pagination.offset,
      }) as any

      if (res?.success) {
        setTransactions(res.data || [])
        setSummary(res.summary || null)
        setPagination(p => ({ ...p, ...res.pagination }))
      }
    } catch (err) {
      toast.error('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, search, startDate, endDate, pagination.limit, pagination.offset])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(p => ({ ...p, offset: 0 }))
    fetchTransactions()
  }

  const exportExcel = () => {
    if (!transactions.length) return

    const rows = transactions.map((tx, i) => ({
      '#': i + 1,
      'Trip ID': tx.id,
      'Date': tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '-',
      'Time': tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      'Client Name': tx.client_name || '-',
      'Client Phone': tx.client_phone || '-',
      'Driver Name': tx.driver_name || '-',
      'Driver Phone': tx.driver_phone || '-',
      'Pickup': tx.pickup_address || '-',
      'Destination': tx.destination_address || '-',
      'Distance (km)': parseFloat(String(tx.actual_distance || tx.estimated_distance || 0)).toFixed(1),
      'Booking Type': tx.booking_type || '-',
      'Payment Method': tx.payment_method || '-',
      'Region': tx.region || '-',
      'Base Price (CFA)': Math.round(tx.base_price || 0),
      'Total Fare (CFA)': Math.round(tx.final_price || tx.total_price || 0),
      'Platform Commission (CFA)': Math.round(tx.platform_commission || 0),
      'Commission Rate (%)': tx.total_price > 0 || tx.final_price > 0 ? (((tx.platform_commission || 0) / (tx.final_price || tx.total_price || 1)) * 100).toFixed(1) : '0.0',
      'Driver Earnings (CFA)': Math.round(tx.driver_earnings || 0),
      'Status': tx.status || '-',
      'Completed At': tx.completed_at ? new Date(tx.completed_at).toLocaleString() : '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)

    // Auto-size columns
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String((r as any)[key] || '').length)) + 2
    }))
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')

    // Add a summary sheet
    if (summary) {
      const summaryData = [
        { 'Metric': 'Total Revenue', 'Value (CFA)': Math.round(summary.totalRevenue) },
        { 'Metric': 'Platform Commission', 'Value (CFA)': Math.round(summary.totalCommission) },
        { 'Metric': 'Driver Earnings', 'Value (CFA)': Math.round(summary.totalDriverEarnings) },
        { 'Metric': 'Total Trips', 'Value (CFA)': summary.count },
      ]
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 18 }]
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    }

    const filename = `oniva-transactions-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, filename)
    toast.success(`Exported ${rows.length} transactions!`)
  }


  const statusOptions = ['all', 'completed', 'in_progress', 'cancelled', 'pending']

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
              <FiArrowLeft className="w-4 h-4" /> {t('common.back', 'Back')}
            </Button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                  <FiDollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{t('admin.transactions')}</h1>
                  <p className="text-sm text-gray-500">{t('admin.transactionsDesc')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={fetchTransactions} disabled={isLoading}>
                  <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {t('admin.pricing.refresh', 'Refresh')}
                </Button>
                <Button variant="primary" size="sm" onClick={exportExcel} disabled={!transactions.length}>
                  <FiDownload className="w-4 h-4" />
                  {t('admin.exportExcel', 'Export Excel')}
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: t('admin.totalRevenue', 'Total Revenue'), value: summary.totalRevenue, color: 'from-blue-500 to-indigo-600', icon: <FiTrendingUp /> },
                { label: t('admin.platformCommission', 'Platform Commission'), value: summary.totalCommission, color: 'from-purple-500 to-fuchsia-600', icon: <FiPercent /> },
                { label: t('admin.driverEarnings', 'Driver Earnings'), value: summary.totalDriverEarnings, color: 'from-emerald-500 to-teal-600', icon: <FiUsers /> },
                { label: t('admin.activeRate', 'Commission Rate'), value: summary.activeCommission ?? 25, color: 'from-amber-500 to-orange-600', icon: <FiPercent />, suffix: '%' },
                { label: t('admin.totalTrips', 'Total Trips'), value: summary.count, color: 'from-orange-400 to-red-500', icon: <FiDollarSign />, isCurrency: false },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} text-white mb-3 shadow`}>
                    {card.icon}
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {(card as any).suffix 
                      ? `${card.value}${card.suffix}`
                      : (card as any).isCurrency === false
                        ? card.value.toLocaleString()
                        : `${Math.round(card.value).toLocaleString()} CFA`}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FiFilter className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{t('admin.filterOptions', 'Filters')}</h2>
            </div>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('common.search', 'Search client, driver...')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              {/* Start Date */}
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition"
              />

              {/* End Date */}
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none transition"
              />

              {/* Status */}
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, offset: 0 })) }}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none bg-white transition cursor-pointer"
              >
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </form>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <FiRefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-20">
                <FiDollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t('admin.noTransactions', 'No transactions found for the selected filters.')}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                        <th className="px-5 py-3">{t('admin.tripId', 'Trip #')}</th>
                        <th className="px-5 py-3">{t('common.date', 'Date')}</th>
                        <th className="px-5 py-3">{t('admin.client', 'Client')}</th>
                        <th className="px-5 py-3">{t('admin.driver', 'Driver')}</th>
                        <th className="px-5 py-3">{t('admin.route', 'Route')}</th>
                        <th className="px-5 py-3">{t('admin.distance', 'Distance')}</th>
                        <th className="px-5 py-3 text-right">{t('admin.fare', 'Total Fare')}</th>
                        <th className="px-5 py-3 text-right">{t('admin.platformCommission', 'Platform Fee')}</th>
                        <th className="px-5 py-3 text-right">{t('admin.rate', 'Rate')}</th>
                        <th className="px-5 py-3 text-right">{t('admin.driverEarnings', 'Driver Earn.')}</th>
                        <th className="px-5 py-3">{t('admin.paymentMethod', 'Payment')}</th>
                        <th className="px-5 py-3">{t('common.status', 'Status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-5 py-4 font-bold text-blue-600">#{tx.id}</td>
                          <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                            <div>{new Date(tx.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-medium text-gray-900">{tx.client_name || '—'}</div>
                            <div className="text-xs text-gray-400">{tx.client_phone || ''}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-medium text-gray-900">{tx.driver_name || '—'}</div>
                            <div className="text-xs text-gray-400">{tx.driver_phone || ''}</div>
                          </td>
                          <td className="px-5 py-4 max-w-xs">
                            <div className="text-gray-900 truncate">{tx.pickup_address}</div>
                            <div className="text-xs text-gray-400 truncate">→ {tx.destination_address || '-'}</div>
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {parseFloat(String(tx.actual_distance || tx.estimated_distance || 0)).toFixed(1)} km
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-gray-900">
                            {Math.round(tx.final_price || tx.total_price || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">CFA</span>
                          </td>
                          <td className="px-5 py-4 text-right text-purple-700 font-semibold">
                            {Math.round(tx.platform_commission || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">CFA</span>
                          </td>
                          <td className="px-5 py-4 text-right text-blue-600 font-medium">
                            {tx.final_price || tx.total_price ? (((tx.platform_commission || 0) / (tx.final_price || tx.total_price)) * 100).toFixed(1) : '0.0'}%
                          </td>
                          <td className="px-5 py-4 text-right text-emerald-700 font-semibold">
                            {Math.round(tx.driver_earnings || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">CFA</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {tx.payment_method === 'cash' ? '💵' : '📱'} {tx.payment_method}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[tx.status] || 'bg-gray-100 text-gray-700'}`}>
                              {tx.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Showing <strong>{pagination.offset + 1}–{Math.min(pagination.offset + pagination.limit, pagination.total)}</strong> of <strong>{pagination.total}</strong>
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pagination.offset === 0}
                      onClick={() => setPagination(p => ({ ...p, offset: Math.max(0, p.offset - p.limit) }))}
                    >
                      <FiChevronLeft className="w-4 h-4" /> {t('admin.previous', 'Previous')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!pagination.hasMore}
                      onClick={() => setPagination(p => ({ ...p, offset: p.offset + p.limit }))}
                    >
                      {t('common.next', 'Next')} <FiChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
