import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import type { Centre, Booking, BookingListResponse } from '../../types/procurement'
import { STATUS_LABELS } from '../../types/procurement'
import {
  Users,
  Search,
  AlertCircle,
  RefreshCw,
  History,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Play,
  CheckSquare,
} from 'lucide-react'

export const AdminQueuePage = () => {
  const { language } = useAuth()
  const isHindi = language === 'hi'

  const [centres, setCentres] = useState<Centre[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedCentre, setSelectedCentre] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // Action / Note Modal State
  const [transitioningBooking, setTransitioningBooking] = useState<{
    booking: Booking
    targetStatus: string
    title: string
  } | null>(null)
  const [statusNote, setStatusNote] = useState('')
  const [actionSubmitting, setActionSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // History Modal State
  const [historyBooking, setHistoryBooking] = useState<Booking | null>(null)

  // Fetch centres for filter
  useEffect(() => {
    apiRequest<Centre[]>('/admin/centres')
      .then((data) => setCentres(data))
      .catch((err) => console.error(err))
  }, [])

  const fetchQueue = async () => {
    setLoading(true)
    setError(null)
    try {
      let queryParams = new URLSearchParams()
      queryParams.set('page', page.toString())
      queryParams.set('page_size', '15')
      if (search.trim()) queryParams.set('q', search.trim())
      if (selectedCentre) queryParams.set('centre_id', selectedCentre)
      if (selectedDate) queryParams.set('date', selectedDate)
      if (selectedStatus) queryParams.set('status', selectedStatus)

      const endpoint = `/admin/bookings?${queryParams.toString()}`
      const data = await apiRequest<BookingListResponse>(endpoint)
      setBookings(data.items)
      setTotal(data.total)
      setTotalPages(data.total_pages)
    } catch (err: any) {
      setError(err.message || 'Failed to load booking queue.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [page, selectedCentre, selectedDate, selectedStatus])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchQueue()
  }

  const handleConfirmTransition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transitioningBooking) return
    setActionSubmitting(true)
    setActionError(null)

    try {
      const updated = await apiRequest<Booking>(
        `/admin/bookings/${transitioningBooking.booking.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: transitioningBooking.targetStatus,
            note: statusNote.trim() || undefined,
          }),
        }
      )

      // Update in local state
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
      setTransitioningBooking(null)
      setStatusNote('')
    } catch (err: any) {
      setActionError(err.message || 'Status transition failed.')
    } finally {
      setActionSubmitting(false)
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
              {isHindi ? 'आगमन एवं कतार प्रबंधन' : 'Arrivals & Queue Management'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isHindi
                ? 'किसानों की उपस्थिति (ARRIVED), तौल प्रक्रिया (IN_SERVICE) और खरीद पूर्ण (COMPLETED) स्थिति दर्ज करें।'
                : 'Monitor check-ins, advance farmer queue progression, and track procurement fulfillment.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchQueue}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isHindi ? 'ताज़ा करें' : 'Refresh Queue'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isHindi
                  ? 'टोकन (KS-...), किसान का नाम या मोबाइल खोजें...'
                  : 'Search by token (KS-...), farmer name, or mobile...'
              }
              className="w-full pl-9 pr-20 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium"
            >
              {isHindi ? 'खोजें' : 'Search'}
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Centre Filter */}
            <select
              value={selectedCentre}
              onChange={(e) => {
                setSelectedCentre(e.target.value)
                setPage(1)
              }}
              className="px-2.5 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{isHindi ? 'सभी केंद्र (All Centres)' : 'All Centres'}</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setPage(1)
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(1)
              }}
              className="px-2.5 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{isHindi ? 'सभी स्थितियां (All Statuses)' : 'All Statuses'}</option>
              <option value="BOOKED">BOOKED (बुकिंग हो गई)</option>
              <option value="ARRIVED">ARRIVED (उपस्थित)</option>
              <option value="IN_SERVICE">IN_SERVICE (प्रक्रिया जारी)</option>
              <option value="COMPLETED">COMPLETED (पूरी हुई)</option>
              <option value="CANCELLED">CANCELLED (रद्द)</option>
              <option value="REJECTED">REJECTED (अस्वीकृत)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Queue Items */}
      <div className="space-y-3">
        {bookings.length === 0 && !loading && (
          <div className="bg-white rounded-2xl p-10 text-center border border-neutral-200 max-w-md mx-auto">
            <Users className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
            <h3 className="font-bold text-neutral-800 text-sm mb-1">
              {isHindi ? 'कतार में कोई बुकिंग नहीं मिली' : 'No Bookings in Queue'}
            </h3>
            <p className="text-xs text-neutral-500">
              {isHindi
                ? 'खोज मापदंड बदलें या दिनांक फ़िल्टर रीसेट करें।'
                : 'Adjust search or filter criteria to see bookings.'}
            </p>
          </div>
        )}

        {bookings.map((booking) => {
          const statusMeta = STATUS_LABELS[booking.status] || STATUS_LABELS['BOOKED']

          return (
            <div
              key={booking.id}
              className="bg-white rounded-xl p-5 border border-neutral-200 shadow-xs hover:border-neutral-300 transition-all space-y-3"
            >
              {/* Row 1: Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 pb-3 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-base text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300">
                    {booking.public_token}
                  </span>
                  {booking.queue_number && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      #{booking.queue_number}
                    </span>
                  )}
                  <span className="text-xs text-neutral-500">{booking.slot_date}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-3 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color}`}
                  >
                    {isHindi ? statusMeta.hi : statusMeta.en}
                  </span>
                </div>
              </div>

              {/* Row 2: Grid details */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {/* Farmer */}
                <div>
                  <span className="text-neutral-400 font-medium">{isHindi ? 'किसान:' : 'Farmer:'}</span>
                  <div className="font-bold text-neutral-900">{booking.farmer_name}</div>
                  <div className="text-neutral-500">📱 {booking.farmer_mobile}</div>
                  {booking.farmer_village && (
                    <div className="text-neutral-400 text-[11px]">📍 {booking.farmer_village}</div>
                  )}
                </div>

                {/* Centre & Time */}
                <div>
                  <span className="text-neutral-400 font-medium">{isHindi ? 'केंद्र व समय:' : 'Centre & Slot:'}</span>
                  <div className="font-bold text-neutral-900">{booking.centre_name}</div>
                  <div className="text-neutral-600">
                    {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                  </div>
                </div>

                {/* Produce & Quantity */}
                <div>
                  <span className="text-neutral-400 font-medium">{isHindi ? 'फसल व मात्रा:' : 'Produce:'}</span>
                  <div className="font-bold text-neutral-900">{booking.produce_type}</div>
                  <div className="text-emerald-700 font-semibold">
                    {booking.quantity} {booking.quantity_unit}
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="flex flex-col justify-center sm:items-end gap-1.5 pt-1 sm:pt-0">
                  {booking.status === 'BOOKED' && (
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <button
                        onClick={() =>
                          setTransitioningBooking({
                            booking,
                            targetStatus: 'ARRIVED',
                            title: isHindi ? 'किसान का आगमन दर्ज करें' : 'Mark Farmer Arrived',
                          })
                        }
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isHindi ? 'आगमन दर्ज करें' : 'Mark Arrived'}</span>
                      </button>

                      <button
                        onClick={() =>
                          setTransitioningBooking({
                            booking,
                            targetStatus: 'REJECTED',
                            title: isHindi ? 'बुकिंग अस्वीकृत / रद्द करें' : 'Reject Booking',
                          })
                        }
                        className="px-2.5 py-1.5 text-xs text-red-700 border border-red-300 hover:bg-red-50 rounded-lg font-medium"
                      >
                        {isHindi ? 'अस्वीकृत' : 'Reject'}
                      </button>
                    </div>
                  )}

                  {booking.status === 'ARRIVED' && (
                    <button
                      onClick={() =>
                        setTransitioningBooking({
                          booking,
                          targetStatus: 'IN_SERVICE',
                          title: isHindi ? 'तौल / खरीद सेवा शुरू करें' : 'Start Service / Unloading',
                        })
                      }
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3.5 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isHindi ? 'प्रक्रिया शुरू करें' : 'Start Service'}</span>
                    </button>
                  )}

                  {booking.status === 'IN_SERVICE' && (
                    <button
                      onClick={() =>
                        setTransitioningBooking({
                          booking,
                          targetStatus: 'COMPLETED',
                          title: isHindi ? 'खरीद प्रक्रिया पूरी दर्ज करें' : 'Complete Procurement',
                        })
                      }
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{isHindi ? 'खरीद पूरी हुई' : 'Complete Visit'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => setHistoryBooking(booking)}
                    className="text-[11px] text-neutral-500 hover:text-neutral-800 inline-flex items-center gap-1 mt-1"
                  >
                    <History className="w-3 h-3" />
                    <span>{isHindi ? 'ऑडिट इतिहास' : 'History Log'}</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-neutral-200 text-xs text-neutral-600">
          <span>
            {isHindi ? 'कुल नियुक्तियां:' : 'Total entries:'} <strong>{total}</strong> (
            {isHindi ? 'पृष्ठ' : 'Page'} {page} / {totalPages})
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-neutral-300 disabled:opacity-40 hover:bg-neutral-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-neutral-300 disabled:opacity-40 hover:bg-neutral-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Transition Note Modal */}
      {transitioningBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-neutral-200 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Queue Workflow
              </span>
              <h3 className="font-bold text-base text-neutral-900 mt-1">
                {transitioningBooking.title}
              </h3>
              <p className="text-xs text-neutral-500 font-mono">
                Token: {transitioningBooking.booking.public_token} ({transitioningBooking.booking.farmer_name})
              </p>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmTransition} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'टिप्पणी / विवरण दर्ज करें (Note)' : 'Operational Note / Reason'}
                  {['CANCELLED', 'REJECTED'].includes(transitioningBooking.targetStatus) && ' *'}
                </label>
                <textarea
                  rows={2}
                  required={['CANCELLED', 'REJECTED'].includes(transitioningBooking.targetStatus)}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder={
                    isHindi
                      ? 'उदा. किसान ट्रैक्टर के साथ गेट पर उपस्थित / तौल पर्ची तैयार...'
                      : 'e.g. Verified at weighbridge / unladen weight recorded...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-slate-700 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransitioningBooking(null)}
                  disabled={actionSubmitting}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-semibold"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold shadow-xs"
                >
                  {actionSubmitting
                    ? isHindi
                      ? 'अपडेट हो रहा है...'
                      : 'Updating...'
                    : isHindi
                    ? 'स्थिति अपडेट करें'
                    : 'Confirm Status Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Audit Trail
              </span>
              <h3 className="font-bold text-base text-neutral-900 mt-1">
                {isHindi ? 'स्थिति परिवर्तन इतिहास' : 'Booking Status Audit History'}
              </h3>
              <p className="text-xs text-neutral-500 font-mono">{historyBooking.public_token}</p>
            </div>

            <div className="space-y-3 pt-2">
              {historyBooking.status_history.map((h, idx) => (
                <div key={h.id || idx} className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
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
