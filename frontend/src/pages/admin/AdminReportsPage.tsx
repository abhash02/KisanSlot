import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import type { Booking, Centre } from '../../types/procurement'
import {
  Printer,
  Wheat,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react'

export const AdminReportsPage = () => {
  const { language } = useAuth()
  const isHindi = language === 'hi'

  const [bookings, setBookings] = useState<Booking[]>([])
  const [centres, setCentres] = useState<Centre[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [bookingsData, centresData] = await Promise.all([
        apiRequest<{ items: Booking[] }>('/admin/bookings?page=1&page_size=100'),
        apiRequest<Centre[]>('/admin/centres'),
      ])
      setBookings(bookingsData.items)
      setCentres(centresData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Analytics computation
  const totalQuintals = bookings.reduce((sum, b) => sum + b.quantity, 0)
  const completedQuintals = bookings
    .filter((b) => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + b.quantity, 0)

  // Breakdown by produce
  const produceBreakdown: Record<string, { count: number; quintals: number }> = {}
  bookings.forEach((b) => {
    if (!produceBreakdown[b.produce_type]) {
      produceBreakdown[b.produce_type] = { count: 0, quintals: 0 }
    }
    produceBreakdown[b.produce_type].count += 1
    produceBreakdown[b.produce_type].quintals += b.quantity
  })

  // Breakdown by status
  const statusCounts: Record<string, number> = {}
  bookings.forEach((b) => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/admin/dashboard"
                className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isHindi ? 'नियंत्रण कक्ष' : 'Admin Console'}</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold">
              {isHindi ? 'खरीद रिपोर्ट एवं विश्लेषण' : 'Procurement Reports & Analytics'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isHindi
                ? 'उपज आवक, केंद्र प्रदर्शन और स्लॉट उपयोगिता का परिचालन सारांश।'
                : 'Summary analytics on crop volumes, operational throughput, and status distribution.'}
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>{isHindi ? 'प्रिंट रिपोर्ट' : 'Print Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500">
            {isHindi ? 'कुल उपज अनुसूचित' : 'Total Scheduled'}
          </span>
          <div className="text-2xl font-bold text-neutral-900 mt-1">
            {totalQuintals.toFixed(1)} <span className="text-xs font-normal text-neutral-500">Qtl</span>
          </div>
          <span className="text-[11px] text-neutral-400">
            {bookings.length} {isHindi ? 'टोकन बुकिंग' : 'farmer tokens'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500">
            {isHindi ? 'खरीद पूर्ण (Fulfilled)' : 'Procured Volume'}
          </span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {completedQuintals.toFixed(1)} <span className="text-xs font-normal text-neutral-500">Qtl</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {statusCounts['COMPLETED'] || 0} {isHindi ? 'सफल खरीद' : 'completed'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500">
            {isHindi ? 'सक्रिय मंडी केंद्र' : 'Active Centres'}
          </span>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {centres.filter((c) => c.is_active).length}
          </div>
          <span className="text-[11px] text-neutral-400">
            {isHindi ? 'सक्रिय खरीद केंद्र' : 'operational hubs'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-semibold text-neutral-500">
            {isHindi ? 'वर्तमान में कतार में' : 'Active in Queue'}
          </span>
          <div className="text-2xl font-bold text-purple-700 mt-1">
            {(statusCounts['BOOKED'] || 0) + (statusCounts['ARRIVED'] || 0) + (statusCounts['IN_SERVICE'] || 0)}
          </div>
          <span className="text-[11px] text-purple-600 font-medium">
            {isHindi ? 'प्रतीक्षारत किसान' : 'waiting farmers'}
          </span>
        </div>
      </div>

      {/* Two Columns: Produce Breakdown & Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Produce Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-1.5">
            <Wheat className="w-4 h-4 text-amber-600" />
            <span>{isHindi ? 'फसल अनुसार उपज आवक' : 'Breakdown by Produce Type'}</span>
          </h2>

          <div className="space-y-3">
            {Object.keys(produceBreakdown).length === 0 && (
              <p className="text-xs text-neutral-400 italic">No bookings recorded yet.</p>
            )}

            {Object.entries(produceBreakdown).map(([produce, val]) => (
              <div key={produce} className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 text-xs">
                <div className="flex items-center justify-between font-bold text-neutral-900 mb-1">
                  <span>{produce}</span>
                  <span className="text-emerald-700 font-bold">
                    {val.quintals.toFixed(1)} Qtl ({val.count} visits)
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600"
                    style={{
                      width: `${totalQuintals > 0 ? (val.quintals / totalQuintals) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>{isHindi ? 'कतार स्थिति वितरण' : 'Status Distribution'}</span>
          </h2>

          <div className="space-y-2 text-xs">
            {['BOOKED', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'REJECTED'].map((st) => {
              const count = statusCounts[st] || 0
              const pct = bookings.length > 0 ? Math.round((count / bookings.length) * 100) : 0
              return (
                <div key={st} className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 border border-neutral-100">
                  <span className="font-semibold text-neutral-700">{st}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-500">{pct}%</span>
                    <strong className="text-neutral-900 min-w-[30px] text-right">{count}</strong>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
