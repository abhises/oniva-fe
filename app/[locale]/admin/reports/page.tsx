'use client'
import { useEffect, useState } from 'react'
import { use } from 'react'
import { useTranslation } from 'react-i18next'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { Loader } from '@/components/common/Loader'
import { StatsCard } from '@/components/common/StatsCard'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/services/api'
import { FiDownload, FiFilter, FiCalendar, FiTrendingUp, FiDollarSign, FiStar } from 'react-icons/fi'
interface ReportData {
period: string
totalTrips: number
totalEarnings: number
platformCommission: number
driverEarnings: number
averageFare: number
averageRating: number
activeUsers: number
activeDrivers: number
newUsers: number
newDrivers: number
}
interface RevenueData {
  period: string
  trips: number
  total_revenue: string
  commission: string
  avg_trip_value: string
}
interface RegionalData {
  region: string
  trips: number
  total_revenue: string
  commission: string
  active_drivers: number
}
interface ReportsPageProps {
params: Promise<{ locale: string }>
}
interface DateRange {
startDate: string
endDate: string
period: 'daily' | 'weekly' | 'monthly'
}
export default function ReportsPage({ params }: ReportsPageProps) {
// FIX: Use React.use() to unwrap params
const { locale } = use(params)
const { t } = useTranslation()
const { isLoading, request } = useApi({ showError: true, showSuccess: false })
const [reportData, setReportData] = useState<ReportData | null>(null)
const [revenueData, setRevenueData] = useState<RevenueData[]>([])
const [regionalData, setRegionalData] = useState<RegionalData[]>([])
const [error, setError] = useState<string | null>(null)
const [dateRange, setDateRange] = useState<DateRange>({
startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
.toISOString()
.split('T')[0],
endDate: new Date().toISOString().split('T')[0],
period: 'monthly',
})
useEffect(() => {
const fetchReport = async () => {
  try {
    setError(null)
    const [summaryResult, revenueResult, regionalResult] = await Promise.all([
      request<ReportData>(() =>
        apiClient.getAdminReportSummary({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          period: dateRange.period,
        })
      ),
      request<RevenueData[]>(() =>
        apiClient.getAdminRevenueReport({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          period: dateRange.period,
        })
      ),
      request<RegionalData[]>(() =>
        apiClient.getAdminRegionalReport()
      )
    ])

    if (summaryResult) {
      setReportData(summaryResult)
      setRevenueData(revenueResult || [])
      setRegionalData(regionalResult || [])
    } else {
      setError('Failed to load report data')
      setReportData(null)
    }
  } catch (err) {
    setError('Failed to load report data')
    setReportData(null)
  }
}

fetchReport()
}, [dateRange, request])
const handleExportPDF = () => {
  alert(t('admin.exportSoon'))
}
const handleExportCSV = () => {
  if (!reportData) return
  
  const headers = [t('admin.metric'), t('admin.value')]
  const rows = [
    ["Total Trips", reportData.totalTrips],
    ["Total Platform Earnings", `${reportData.platformCommission} XOF`],
    ["Driver Earnings", `${reportData.driverEarnings} XOF`],
    ["Average Fare", `${reportData.averageFare} XOF`],
    ["Average Rating", reportData.averageRating],
    ["Active Users", reportData.activeUsers],
    ["Active Drivers", reportData.activeDrivers],
    ["New Users", reportData.newUsers],
    ["New Drivers", reportData.newDrivers],
  ]
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n")
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `oniva_report_${dateRange.startDate}_${dateRange.endDate}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
return (
<ProtectedRoute allowedRoles={['admin']}>
<div className="max-w-7xl mx-auto px-4 py-8">
<div className="flex justify-between items-center mb-8">
<h1 className="text-3xl font-bold">{t('admin.reports')}</h1>
<div className="flex gap-2">
<Button
           variant="secondary"
           size="sm"
           onClick={handleExportPDF}
           className="flex items-center gap-2"
         >
<FiDownload size={16} />
{t('admin.exportPdf')}
</Button>
<Button
           variant="secondary"
           size="sm"
           onClick={handleExportCSV}
           className="flex items-center gap-2"
         >
<FiDownload size={16} />
{t('admin.exportCsv')}
</Button>
</div>
</div>
    {/* Error Message */}
    {error && (
      <Card className="mb-8 bg-red-50 border-2 border-red-200">
        <div className="text-red-700 font-semibold">{error}</div>
      </Card>
    )}

    {/* Date Range Filter */}
    <Card className="mb-8">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FiFilter size={20} />
        {t('admin.filterOptions')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            <FiCalendar size={16} className="inline mr-2" />
            {t('common.startDate')}
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <FiCalendar size={16} className="inline mr-2" />
            {t('common.endDate')}
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t('admin.reportPeriod')}
          </label>
          <select
            value={dateRange.period}
            onChange={(e) =>
              setDateRange({
                ...dateRange,
                period: e.target.value as 'daily' | 'weekly' | 'monthly',
              })
            }
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
          >
            <option value="daily">{t('admin.daily')}</option>
            <option value="weekly">{t('admin.weekly')}</option>
            <option value="monthly">{t('admin.monthly')}</option>
          </select>
        </div>
      </div>
    </Card>

    {isLoading ? (
      <Loader />
    ) : reportData ? (
      <>
        {/* Report Period */}
        <Card className="mb-8 bg-blue-50 border-l-4 border-blue-600">
          <p className="text-sm text-gray-600">{t('admin.reportPeriod')}</p>
          <p className="text-2xl font-bold text-blue-600 capitalize">
            {t(`admin.${reportData.period}`)}
          </p>
        </Card>

        {/* Key Metrics */}
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            label={t('admin.totalTrips')}
            value={reportData.totalTrips.toLocaleString()}
            icon={<FiTrendingUp className="text-blue-500" />}
          />

          <StatsCard
            label={t('admin.platformEarnings')}
            value={`${reportData.platformCommission.toLocaleString()} XOF`}
            icon={<FiDollarSign className="text-green-600" />}
          />

          <StatsCard
            label={t('admin.driverEarnings')}
            value={`${reportData.driverEarnings.toLocaleString()} XOF`}
            icon={<FiDollarSign className="text-blue-600" />}
          />

          <StatsCard
            label={t('admin.averageRating')}
            value={`${reportData.averageRating.toFixed(1)} ★`}
            icon={<FiStar className="text-yellow-500" />}
          />
        </div>

        {/* Detailed Report Table */}
        <Card>
          <h2 className="text-2xl font-bold mb-6">{t('admin.detailedMetrics')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-semibold">{t('admin.metric')}</th>
                  <th className="text-right p-4 font-semibold">{t('admin.value')}</th>
                  <th className="text-right p-4 font-semibold">{t('admin.change')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">{t('admin.totalTrips')}</td>
                  <td className="p-4 text-right font-semibold">
                    {reportData.totalTrips}
                  </td>
                  <td className="p-4 text-right text-green-600">
                    ↑ 12%
                  </td>
                </tr>

                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">{t('admin.totalPlatformEarnings')}</td>
                  <td className="p-4 text-right font-semibold">
                    {reportData.platformCommission.toLocaleString()} XOF
                  </td>
                  <td className="p-4 text-right text-green-600">
                    ↑ 15%
                  </td>
                </tr>

                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">{t('admin.driverEarnings')}</td>
                  <td className="p-4 text-right font-semibold">
                    {reportData.driverEarnings.toLocaleString()} XOF
                  </td>
                  <td className="p-4 text-right text-green-600">
                    ↑ 18%
                  </td>
                </tr>

                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">{t('admin.averageFarePerTrip')}</td>
                  <td className="p-4 text-right font-semibold">
                    {reportData.averageFare.toLocaleString()} XOF
                  </td>
                  <td className="p-4 text-right text-gray-600">
                    → 0%
                  </td>
                </tr>

                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">{t('admin.averageRating')}</td>
                  <td className="p-4 text-right font-semibold">
                    {reportData.averageRating.toFixed(1)} ★
                  </td>
                  <td className="p-4 text-right text-green-600">
                    ↑ 2%
                  </td>
                </tr>

                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">{t('admin.activeUsers')}</td>
                  <td className="p-4 text-right font-semibold">
                    {reportData.activeUsers}
                  </td>
                  <td className="p-4 text-right text-green-600">
                    ↑ 8%
                  </td>
                </tr>

                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">{t('admin.activeDrivers')}</td>
                  <td className="p-4 text-right font-semibold">
                    {reportData.activeDrivers}
                  </td>
                  <td className="p-4 text-right text-green-600">
                    ↑ 5%
                  </td>
                </tr>

                <tr className="border-b hover:bg-gray-50">
                  <td className="p-4">{t('admin.newUsers')}</td>
                  <td className="p-4 text-right font-semibold">
                    {reportData.newUsers}
                  </td>
                  <td className="p-4 text-right text-blue-600">
                    New
                  </td>
                </tr>

                <tr className="hover:bg-gray-50">
                  <td className="p-4">{t('admin.newDrivers')}</td>
                  <td className="p-4 text-right font-semibold">
                    {reportData.newDrivers}
                  </td>
                  <td className="p-4 text-right text-blue-600">
                    New
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Revenue Trends Table */}
        {revenueData.length > 0 && (
          <Card className="mt-8">
            <h2 className="text-2xl font-bold mb-6">{t('admin.revenueBreakdown')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold">{t('common.period')}</th>
                    <th className="text-right p-4 font-semibold">{t('admin.trips')}</th>
                    <th className="text-right p-4 font-semibold">{t('admin.grossRevenue')}</th>
                    <th className="text-right p-4 font-semibold">{t('admin.platformCommission')}</th>
                    <th className="text-right p-4 font-semibold">{t('admin.avgTripValue')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {revenueData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{new Date(row.period).toLocaleDateString()}</td>
                      <td className="p-4 text-right">{row.trips}</td>
                      <td className="p-4 text-right font-semibold text-green-600">{Number(row.total_revenue || 0).toLocaleString()} XOF</td>
                      <td className="p-4 text-right font-semibold text-blue-600">{Number(row.commission || 0).toLocaleString()} XOF</td>
                      <td className="p-4 text-right text-gray-700">{Number(row.avg_trip_value || 0).toLocaleString()} XOF</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Regional Performance Table */}
        {regionalData.length > 0 && (
          <Card className="mt-8">
            <h2 className="text-2xl font-bold mb-6">{t('admin.regionalPerformance')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-semibold">{t('admin.region')}</th>
                    <th className="text-right p-4 font-semibold">{t('admin.trips')}</th>
                    <th className="text-right p-4 font-semibold">{t('admin.totalRevenue')}</th>
                    <th className="text-right p-4 font-semibold">{t('admin.platformCommission')}</th>
                    <th className="text-right p-4 font-semibold">{t('admin.activeDrivers')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {regionalData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-4 capitalize font-bold text-gray-900">{row.region}</td>
                      <td className="p-4 text-right">{row.trips}</td>
                      <td className="p-4 text-right font-semibold text-green-600">{Number(row.total_revenue || 0).toLocaleString()} XOF</td>
                      <td className="p-4 text-right font-semibold text-blue-600">{Number(row.commission || 0).toLocaleString()} XOF</td>
                      <td className="p-4 text-right text-gray-700">{row.active_drivers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Summary */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600">
          <h3 className="font-bold text-lg mb-4">{t('admin.reportSummaryTitle')}</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            {t('admin.reportSummaryText_part1')}{' '}
            <span className="font-semibold">
              {reportData.totalTrips} {t('admin.trips').toLowerCase()}
            </span>
            , {t('admin.reportSummaryText_part2')}{' '}
            <span className="font-semibold">
              {reportData.totalEarnings.toLocaleString()} XOF
            </span>{' '}
            {t('admin.reportSummaryText_part3')}{' '}
            <span className="font-semibold">
              {reportData.platformCommission.toLocaleString()} XOF
            </span>{' '}
            {t('admin.reportSummaryText_part4')}{' '}
            <span className="font-semibold">
              {reportData.driverEarnings.toLocaleString()} XOF
            </span>
            {t('admin.reportSummaryText_part5')}{' '}
            <span className="font-semibold">
              {reportData.activeUsers} {t('admin.activeUsers').toLowerCase()}
            </span>{' '}
            {t('common.and') || 'and'}{' '}
            <span className="font-semibold">
              {reportData.activeDrivers} {t('admin.activeDrivers').toLowerCase()}
            </span>
            , {t('admin.reportSummaryText_part7')}
          </p>
        </Card>
      </>
    ) : (
      <Card className="text-center py-12">
        <p className="text-gray-600">{t('admin.noReportData')}</p>
      </Card>
    )}
  </div>
</ProtectedRoute>
)
}