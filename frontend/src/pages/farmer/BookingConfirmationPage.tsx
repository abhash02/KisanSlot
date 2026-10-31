import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import type { Booking } from '../../types/procurement'
import { STATUS_LABELS } from '../../types/procurement'
import {
  CheckCircle2,
  Printer,
  Calendar,
  Building,
  User,
  ArrowRight,
  AlertCircle,
  Wheat,
} from 'lucide-react'

export const BookingConfirmationPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { language } = useAuth()
  const isHindi = language === 'hi'

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!bookingId) return
    setLoading(true)
    apiRequest<Booking>(`/bookings/${bookingId}`)
      .then((data) => setBooking(data))
      .catch((err) => setError(err.message || 'Failed to load booking confirmation.'))
      .finally(() => setLoading(false))
  }, [bookingId])

  const handlePrint = () => {
    window.print()
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

  if (loading) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-neutral-200 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-neutral-600 font-medium">
          {isHindi ? 'टोकन विवरण लोड हो रहा है...' : 'Generating booking receipt...'}
        </p>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-red-200 text-center">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-neutral-900 mb-2">
          {isHindi ? 'बुकिंग रसीद लोड करने में त्रुटि' : 'Receipt Not Found'}
        </h2>
        <p className="text-xs text-neutral-600 mb-4">{error || 'Booking not found.'}</p>
        <Link
          to="/farmer/bookings"
          className="inline-block px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold"
        >
          {isHindi ? 'मेरी बुकिंग्स पर जाएं' : 'Go to My Bookings'}
        </Link>
      </div>
    )
  }

  const statusMeta = STATUS_LABELS[booking.status] || STATUS_LABELS['BOOKED']

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Notification */}
      <div className="bg-emerald-800 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-emerald-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h2 className="font-bold text-base">
              {isHindi ? 'स्लॉट सफलतापूर्वक आरक्षित हो गया!' : 'Procurement Slot Confirmed!'}
            </h2>
            <p className="text-xs text-emerald-200">
              {isHindi ? 'आपका डिजिटल टोकन तैयार है। कृपया इसे सुरक्षित रखें।' : 'Your digital token is ready. Please save or print it.'}
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold border border-emerald-600 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>{isHindi ? 'प्रिंट करें' : 'Print Receipt'}</span>
        </button>
      </div>

      {/* Printable Token Receipt Card */}
      <div className="bg-white rounded-2xl border-2 border-emerald-600 shadow-md p-6 sm:p-8 relative overflow-hidden print:border-black print:shadow-none">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 pb-5 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌾</span>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-neutral-900">KisanSlot</span>
                <span className="text-xs text-neutral-500 ml-2 font-medium">किसान टोकन रसीद</span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              SIH26032 • Farmer Procurement Scheduling Receipt
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusMeta.bg} ${statusMeta.color}`}>
              {isHindi ? statusMeta.hi : statusMeta.en}
            </span>
          </div>
        </div>

        {/* Public Token Spotlight */}
        <div className="my-6 p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            {isHindi ? 'आधिकारिक टोकन संख्या (Booking Token)' : 'Public Token Reference'}
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-extrabold text-emerald-950 tracking-wider my-1">
            {booking.public_token}
          </div>
          {booking.queue_number && (
            <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 text-xs font-bold">
              {isHindi ? 'कतार क्रम संख्या' : 'Queue Sequence'}: #{booking.queue_number}
            </div>
          )}
        </div>

        {/* Receipt Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Appointment Schedule */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="font-bold text-neutral-800 flex items-center gap-1.5 border-b border-neutral-200 pb-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isHindi ? 'नियुक्ति समय एवं तारीख' : 'Scheduled Visit'}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">{isHindi ? 'तारीख:' : 'Date:'}</span>
                <strong className="text-neutral-900">{booking.slot_date}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{isHindi ? 'समय:' : 'Time Slot:'}</span>
                <strong className="text-neutral-900">
                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                </strong>
              </div>
            </div>
          </div>

          {/* Produce Info */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="font-bold text-neutral-800 flex items-center gap-1.5 border-b border-neutral-200 pb-1.5">
              <Wheat className="w-3.5 h-3.5 text-amber-700" />
              <span>{isHindi ? 'उपज एवं मात्रा' : 'Crop & Quantity'}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">{isHindi ? 'फसल:' : 'Crop:'}</span>
                <strong className="text-neutral-900">{booking.produce_type}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{isHindi ? 'मात्रा:' : 'Quantity:'}</span>
                <strong className="text-emerald-800 font-bold">
                  {booking.quantity} {booking.quantity_unit}
                </strong>
              </div>
            </div>
          </div>

          {/* Centre Location */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
            <div className="font-bold text-neutral-800 flex items-center gap-1.5 border-b border-neutral-200 pb-1.5">
              <Building className="w-3.5 h-3.5 text-blue-700" />
              <span>{isHindi ? 'खरीद केंद्र' : 'Procurement Centre'}</span>
            </div>
            <div className="font-bold text-neutral-900">{booking.centre_name}</div>
            <div className="text-neutral-500">{booking.centre_district}</div>
            <div className="text-neutral-600 text-[11px]">{booking.centre_address}</div>
          </div>

          {/* Farmer Details */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
            <div className="font-bold text-neutral-800 flex items-center gap-1.5 border-b border-neutral-200 pb-1.5">
              <User className="w-3.5 h-3.5 text-neutral-700" />
              <span>{isHindi ? 'किसान विवरण' : 'Farmer Details'}</span>
            </div>
            <div className="font-bold text-neutral-900">{booking.farmer_name}</div>
            <div className="text-neutral-600">📱 {booking.farmer_mobile}</div>
            {booking.farmer_village && (
              <div className="text-neutral-500 text-[11px]">📍 {booking.farmer_village}</div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 pt-4 border-t border-neutral-200 text-[11px] text-neutral-500 space-y-1">
          <p className="font-semibold text-neutral-700">
            {isHindi ? 'महत्वपूर्ण निर्देश:' : 'Important Instructions:'}
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-neutral-600">
            <li>
              {isHindi
                ? 'कृपया निर्धारित समय से 15 मिनट पहले खरीद केंद्र पर पहुँचें।'
                : 'Arrive at the procurement centre 15 minutes prior to your allocated slot.'}
            </li>
            <li>
              {isHindi
                ? 'केंद्र के गेट पर यह टोकन नंबर प्रदर्शित करें ताकि आपकी उपस्थिति दर्ज की जा सके।'
                : 'Present this token number at the gate operator for swift check-in.'}
            </li>
            <li>
              {isHindi
                ? 'यदि आप आने में असमर्थ हैं, तो कृपया समय से पहले पोर्टल पर स्लॉट रद्द कर दें।'
                : 'If unable to visit, please cancel via "My Bookings" to free capacity for other farmers.'}
            </li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 print:hidden">
        <Link
          to="/farmer/bookings"
          className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          {isHindi ? 'मेरी सभी बुकिंग्स देखें' : 'View All My Bookings'}
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{isHindi ? 'रसीद प्रिंट करें' : 'Print Token'}</span>
          </button>

          <Link
            to="/farmer/dashboard"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <span>{isHindi ? 'डैशबोर्ड' : 'Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
