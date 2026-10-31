import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import type { Centre, Slot, Booking } from '../../types/procurement'
import { PRODUCE_OPTIONS } from '../../types/procurement'
import {
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'

export const SlotSelectionPage = () => {
  const { centreId } = useParams<{ centreId: string }>()
  const { language } = useAuth()
  const isHindi = language === 'hi'
  const navigate = useNavigate()

  const [centre, setCentre] = useState<Centre | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Date selection (default to tomorrow or today)
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)

  // Booking Modal State
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null)
  const [produceType, setProduceType] = useState('Wheat')
  const [quantity, setQuantity] = useState<string>('20')
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. Fetch Centre info
  useEffect(() => {
    if (!centreId) return
    apiRequest<Centre>(`/centres/${centreId}`)
      .then((data) => setCentre(data))
      .catch((err) => setError(err.message || 'Centre not found.'))
  }, [centreId])

  // 2. Fetch Slots for selected date
  const fetchSlots = async () => {
    if (!centreId) return
    setLoadingSlots(true)
    setError(null)
    try {
      const data = await apiRequest<Slot[]>(`/centres/${centreId}/slots?date=${selectedDate}`)
      setSlots(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load slots for this date.')
    } finally {
      setLoadingSlots(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [centreId, selectedDate])

  // Quick date pill options (Next 5 days)
  const quickDates = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const iso = d.toISOString().split('T')[0]
    const label =
      i === 0
        ? isHindi
          ? 'आज (Today)'
          : 'Today'
        : i === 1
        ? isHindi
          ? 'कल (Tomorrow)'
          : 'Tomorrow'
        : d.toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    return { iso, label }
  })

  // Format time (HH:MM:SS -> 12-hour or readable)
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

  const handleOpenBooking = (slot: Slot) => {
    setActiveSlot(slot)
    setBookingError(null)
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSlot) return
    setBookingError(null)

    const parsedQty = parseFloat(quantity)
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setBookingError(isHindi ? 'कृपया एक वैध सकारात्मक मात्रा दर्ज करें।' : 'Please enter a valid positive quantity.')
      return
    }

    setIsSubmitting(true)
    try {
      const booking = await apiRequest<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          slot_id: activeSlot.id,
          produce_type: produceType,
          quantity: parsedQty,
          quantity_unit: 'quintal',
        }),
      })

      // Navigate to confirmation page
      navigate(`/farmer/bookings/${booking.id}/confirmation`)
    } catch (err: any) {
      setBookingError(err.message || (isHindi ? 'बुकिंग विफल रही। पुनः प्रयास करें।' : 'Booking failed. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/farmer/centres"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-emerald-700 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isHindi ? 'सभी खरीद केंद्र देखें' : 'Back to Centres'}</span>
        </Link>
      </div>

      {/* Centre Details Banner */}
      {centre && (
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {centre.district}
                </span>
                <span className="text-xs text-neutral-400">•</span>
                <span className="text-xs text-emerald-700 font-medium">
                  {isHindi ? 'सक्रिय खरीद केंद्र' : 'Active Centre'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900">{centre.name}</h1>
              <div className="flex items-center gap-1.5 text-xs text-neutral-600 mt-2">
                <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                <span>{centre.address}</span>
              </div>
            </div>

            {centre.notes && (
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs text-neutral-600 max-w-sm">
                <span className="font-semibold text-neutral-700">{isHindi ? 'निर्देश:' : 'Notes:'}</span> {centre.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Date Selector Tabs */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-3">
        <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
          {isHindi ? 'तारीख चुनें (Select Date)' : 'Select Appointment Date'}
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {quickDates.map((qd) => (
            <button
              key={qd.iso}
              onClick={() => setSelectedDate(qd.iso)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedDate === qd.iso
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-600/30'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {qd.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-neutral-500 hidden sm:inline">
              {isHindi ? 'अन्य तारीख:' : 'Custom Date:'}
            </span>
            <input
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Slots Section */}
      <div>
        <h2 className="text-base font-bold text-neutral-900 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <span>
              {isHindi ? 'उपलब्ध समय स्लॉट' : 'Available Time Slots'} — {selectedDate}
            </span>
          </div>
          <span className="text-xs font-normal text-neutral-500">
            {slots.length} {isHindi ? 'स्लॉट पाए गए' : 'slots configured'}
          </span>
        </h2>

        {/* Loading Slots */}
        {loadingSlots && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-5 rounded-xl border border-neutral-200 animate-pulse space-y-3">
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                <div className="h-8 bg-neutral-100 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty Slots */}
        {!loadingSlots && slots.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center border border-neutral-200 max-w-md mx-auto">
            <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-neutral-800 text-sm mb-1">
              {isHindi ? 'इस तारीख को कोई स्लॉट उपलब्ध नहीं है' : 'No Slots Available for this Date'}
            </h3>
            <p className="text-xs text-neutral-500">
              {isHindi
                ? 'कृपया कोई अन्य तारीख चुनें या केंद्र के संचालन दिनों की जांच करें।'
                : 'Please select an alternate date from the tabs above.'}
            </p>
          </div>
        )}

        {/* Slots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {slots.map((slot) => {
            const isFull = slot.remaining_capacity <= 0
            const isClosed = slot.status !== 'OPEN'

            return (
              <div
                key={slot.id}
                className={`bg-white rounded-xl p-5 border transition-all flex flex-col justify-between ${
                  isFull || isClosed
                    ? 'border-neutral-200 opacity-75'
                    : 'border-neutral-200 hover:border-emerald-500 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                    </span>

                    {isClosed ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                        {isHindi ? 'बंद' : 'CLOSED'}
                      </span>
                    ) : isFull ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                        {isHindi ? 'पूर्ण' : 'FULL'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {isHindi ? 'उपलब्ध' : 'OPEN'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-neutral-600 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">{isHindi ? 'शेष क्षमता:' : 'Remaining:'}</span>
                      <strong className={slot.remaining_capacity > 0 ? 'text-emerald-700' : 'text-red-600'}>
                        {slot.remaining_capacity} / {slot.capacity} {isHindi ? 'स्थान' : 'spots'}
                      </strong>
                    </div>

                    {/* Capacity progress bar */}
                    <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{
                          width: `${Math.min(100, Math.round((slot.booked_count / slot.capacity) * 100))}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {slot.notes && (
                    <p className="text-[11px] text-neutral-500 italic mb-3">"{slot.notes}"</p>
                  )}
                </div>

                <button
                  onClick={() => handleOpenBooking(slot)}
                  disabled={isFull || isClosed}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-colors ${
                    isFull || isClosed
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm'
                  }`}
                >
                  {isClosed
                    ? isHindi
                      ? 'स्लॉट बंद है'
                      : 'Slot Closed'
                    : isFull
                    ? isHindi
                      ? 'स्लॉट भर गया है'
                      : 'Fully Booked'
                    : isHindi
                    ? 'यह स्लॉट बुक करें'
                    : 'Book This Slot'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Booking Form Modal */}
      {activeSlot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close button */}
            <button
              onClick={() => setActiveSlot(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {isHindi ? 'स्लॉट आरक्षण' : 'Confirm Reservation'}
              </span>
              <h3 className="text-xl font-bold text-neutral-900 mt-2">
                {isHindi ? 'अपनी उपज का विवरण दर्ज करें' : 'Enter Crop & Quantity'}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {centre?.name} • {activeSlot.slot_date} ({formatTime(activeSlot.start_time)} - {formatTime(activeSlot.end_time)})
              </p>
            </div>

            {bookingError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Produce Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'उपज / फसल का प्रकार *' : 'Produce / Crop Type *'}
                </label>
                <div className="relative">
                  <select
                    value={produceType}
                    onChange={(e) => setProduceType(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {PRODUCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {isHindi ? opt.label_hi : opt.label_en} ({opt.value})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'अनुमानित मात्रा (क्विंटल में) *' : 'Estimated Quantity (in Quintals) *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    placeholder="20"
                    className="w-full pl-3 pr-16 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-medium text-neutral-400">
                    {isHindi ? 'क्विंटल' : 'quintal'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {isHindi ? '1 क्विंटल = 100 किलोग्राम' : '1 quintal = 100 kilograms'}
                </p>
              </div>

              {/* Confirmation Notice */}
              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isHindi ? 'तत्काल टोकन जारी' : 'Instant Token Issuance'}</span>
                </div>
                <p>
                  {isHindi
                    ? 'बुकिंग की पुष्टि करते ही आपका विशिष्ट डिजिटल टोकन नंबर जनरेट हो जाएगा।'
                    : 'Confirming will immediately reserve your slot and generate your unique visit token.'}
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSlot(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isHindi ? 'आरक्षण हो रहा है...' : 'Booking...'}</span>
                    </>
                  ) : (
                    <span>{isHindi ? 'बुकिंग कन्फर्म करें' : 'Confirm Booking'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
