import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import type { Booking } from '../../types/procurement'
import { STATUS_LABELS } from '../../types/procurement'
import {
  Ticket,
  Calendar,
  Building,
  Wheat,
  XCircle,
  FileText,
  AlertCircle,
  RefreshCw,
  Plus,
  History,
  X,
} from 'lucide-react'

export const MyBookingsPage = () => {
  const { language } = useAuth()
  const isHindi = language === 'hi'

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PAST'>('ALL')

  // Cancellation state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  // Status History Modal
  const [historyBooking, setHistoryBooking] = useState<Booking | null>(null)

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest<Booking[]>('/bookings/mine')
      setBookings(data)
    } catch (err: any) {
      setError(err.message || (isHindi ? 'बुकिंग्स लोड करने में विफल।' : 'Failed to load bookings.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleCancelConfirm = async () => {
    if (!cancellingBooking) return
    setCancelLoading(true)
    setCancelError(null)

    try {
      const updated = await apiRequest<Booking>(`/bookings/${cancellingBooking.id}/cancel`, {
        method: 'POST',
      })
      // Update local state
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
      setCancellingBooking(null)
    } catch (err: any) {
      setCancelError(err.message || (isHindi ? 'रद्दीकरण विफल रहा।' : 'Cancellation failed.'))
    } finally {
      setCancelLoading(false)
    }
  }

  const formatTime = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(':')
      const hour = parseInt(h, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const h12 = hour % 12 || 12
      return `${h12}:${m} ${ampm}`
    } catch {
      return timeStr
    }
  }

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ACTIVE') {
      return ['BOOKED', 'ARRIVED', 'IN_SERVICE'].includes(b.status)
    }
    if (activeTab === 'PAST') {
      return ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status)
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-2">
              <Ticket className="w-3.5 h-3.5" />
              <span>{isHindi ? 'मेरी बुकिंग्स' : 'My Procurement Visits'}</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {isHindi ? 'मेरे आरक्षित स्लॉट एवं टोकन' : 'My Bookings & Tokens'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              {isHindi
                ? 'अपने सक्रिय टोकन, कतार स्थिति एवं पिछली खरीद का इतिहास यहां देखें।'
                : 'Track appointment tokens, live queue statuses, or cancel eligible upcoming visits.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
            </button>

            <Link
              to="/farmer/centres"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{isHindi ? 'नया स्लॉट बुक करें' : 'Book New Slot'}</span>
            </Link>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="mt-6 pt-4 border-t border-neutral-100 flex gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'ALL'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {isHindi ? 'सभी बुकिंग्स' : 'All Bookings'} ({bookings.length})
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'ACTIVE'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {isHindi ? 'सक्रिय (Active)' : 'Active Visits'} (
            {bookings.filter((b) => ['BOOKED', 'ARRIVED', 'IN_SERVICE'].includes(b.status)).length})
          </button>

          <button
            onClick={() => setActiveTab('PAST')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'PAST'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {isHindi ? 'पूर्ण / रद्द' : 'Past / Completed'} (
            {bookings.filter((b) => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status)).length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && bookings.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-6 rounded-xl border border-neutral-200 animate-pulse space-y-3">
              <div className="h-5 bg-neutral-200 rounded w-1/3"></div>
              <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBookings.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center border border-neutral-200 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
            <Ticket className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-neutral-800 text-base mb-1">
            {isHindi ? 'कोई बुकिंग नहीं मिली' : 'No Bookings Found'}
          </h3>
          <p className="text-xs text-neutral-500 mb-5">
            {isHindi
              ? 'आपने अभी तक कोई खरीद स्लॉट आरक्षित नहीं किया है।'
              : 'You have not scheduled any procurement visits yet.'}
          </p>
          <Link
            to="/farmer/centres"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>{isHindi ? 'पहला स्लॉट बुक करें' : 'Book Your First Slot'}</span>
          </Link>
        </div>
      )}

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((b) => {
          const statusMeta = STATUS_LABELS[b.status] || STATUS_LABELS['BOOKED']
          const canCancel = b.status === 'BOOKED'

          return (
            <div
              key={b.id}
              className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:border-neutral-300 transition-all space-y-4"
            >
              {/* Card Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 pb-3 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-base text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    {b.public_token}
                  </span>
                  {b.queue_number && (
                    <span className="text-xs bg-neutral-100 text-neutral-700 font-semibold px-2 py-0.5 rounded">
                      {isHindi ? 'कतार' : 'Queue'}: #{b.queue_number}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${statusMeta.bg} ${statusMeta.color}`}
                  >
                    {isHindi ? statusMeta.hi : statusMeta.en}
                  </span>
                </div>
              </div>

              {/* Card Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-600">
                {/* Date & Time */}
                <div className="space-y-1">
                  <div className="text-neutral-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isHindi ? 'तारीख व समय' : 'Date & Time'}</span>
                  </div>
                  <div className="font-bold text-neutral-900">{b.slot_date}</div>
                  <div className="text-neutral-600">
                    {formatTime(b.start_time)} – {formatTime(b.end_time)}
                  </div>
                </div>

                {/* Centre */}
                <div className="space-y-1">
                  <div className="text-neutral-400 font-medium flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isHindi ? 'खरीद केंद्र' : 'Centre'}</span>
                  </div>
                  <div className="font-bold text-neutral-900">{b.centre_name}</div>
                  <div className="text-neutral-500 truncate">{b.centre_district}</div>
                </div>

                {/* Produce & Quantity */}
                <div className="space-y-1">
                  <div className="text-neutral-400 font-medium flex items-center gap-1">
                    <Wheat className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isHindi ? 'फसल व मात्रा' : 'Produce & Quantity'}</span>
                  </div>
                  <div className="font-bold text-neutral-900">{b.produce_type}</div>
                  <div className="text-emerald-700 font-semibold">
                    {b.quantity} {b.quantity_unit}
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => setHistoryBooking(b)}
                  className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-800 transition-colors"
                >
                  <History className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{isHindi ? 'स्थिति इतिहास देखें' : 'View Audit History'}</span>
                </button>

                <div className="flex items-center gap-2">
                  {canCancel && (
                    <button
                      onClick={() => setCancellingBooking(b)}
                      className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors"
                    >
                      {isHindi ? 'बुकिंग रद्द करें' : 'Cancel Slot'}
                    </button>
                  )}

                  <Link
                    to={`/farmer/bookings/${b.id}/confirmation`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-semibold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isHindi ? 'रसीद / टोकन' : 'View Token'}</span>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cancellation Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-neutral-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-neutral-900">
                {isHindi ? 'क्या आप यह स्लॉट रद्द करना चाहते हैं?' : 'Cancel this Booking?'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {isHindi
                  ? `टोकन ${cancellingBooking.public_token} को रद्द कर दिया जाएगा और स्लॉट किसी अन्य किसान के लिए खाली हो जाएगा।`
                  : `Booking token ${cancellingBooking.public_token} will be cancelled and the slot capacity will be freed.`}
              </p>
            </div>

            {cancelError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                disabled={cancelLoading}
                className="w-1/2 py-2 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                {isHindi ? 'नहीं, रखें' : 'Keep Booking'}
              </button>

              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={cancelLoading}
                className="w-1/2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                {cancelLoading ? (isHindi ? 'रद्द हो रहा है...' : 'Cancelling...') : isHindi ? 'हाँ, रद्द करें' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status History Modal */}
      {historyBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 space-y-4 relative">
            <button
              onClick={() => setHistoryBooking(null)}
              className="absolute right-4 top-4 p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {isHindi ? 'ऑडिट ट्रेल' : 'Audit Trail'}
              </span>
              <h3 className="font-bold text-base text-neutral-900 mt-0.5">
                {isHindi ? 'स्थिति परिवर्तन इतिहास' : 'Booking Status History'}
              </h3>
              <p className="text-xs text-neutral-500 font-mono">{historyBooking.public_token}</p>
            </div>

            {/* Timeline */}
            <div className="space-y-4 pt-2">
              {historyBooking.status_history.map((h, idx) => (
                <div key={h.id || idx} className="flex items-start gap-3 text-xs relative">
                  {/* Circle */}
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="space-y-0.5 flex-1 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <div className="flex items-center justify-between font-bold text-neutral-800">
                      <span>{h.new_status}</span>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>
                    {h.note && <p className="text-neutral-600 italic text-[11px]">"{h.note}"</p>}
                    <div className="text-[10px] text-neutral-500">
                      Actor: {h.actor_name || 'System'} ({h.actor_role || 'SYSTEM'})
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setHistoryBooking(null)}
              className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold"
            >
              {isHindi ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
