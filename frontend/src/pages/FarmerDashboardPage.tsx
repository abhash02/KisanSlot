import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../lib/api'
import type { Booking } from '../types/procurement'
import { STATUS_LABELS } from '../types/procurement'
import {
  Phone,
  MapPin,
  CalendarPlus,
  Ticket,
  CheckCircle,
  ShieldCheck,
  Building,
  ArrowRight,
  Clock,
  Wheat,
} from 'lucide-react'

export const FarmerDashboardPage = () => {
  const { user, language } = useAuth()
  const isHindi = language === 'hi'

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)
  const [totalBookingsCount, setTotalBookingsCount] = useState<number>(0)

  useEffect(() => {
    apiRequest<Booking[]>('/bookings/mine')
      .then((data) => {
        setTotalBookingsCount(data.length)
        const upcoming = data.find((b) => ['BOOKED', 'ARRIVED', 'IN_SERVICE'].includes(b.status))
        setActiveBooking(upcoming || null)
      })
      .catch((err) => console.error('Failed to load bookings on dashboard', err))
  }, [])

  if (!user) return null

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

  const statusMeta = activeBooking ? STATUS_LABELS[activeBooking.status] || STATUS_LABELS['BOOKED'] : null

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-emerald-800 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700 text-emerald-200 text-xs font-medium mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isHindi ? 'प्रमाणित किसान सत्र' : 'Verified Farmer Session'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {isHindi ? `स्वागत है, ${user.full_name} जी!` : `Welcome, ${user.full_name}!`}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
              {isHindi
                ? 'अपने खरीद स्लॉट और टोकन स्थिति का प्रबंधन यहां करें।'
                : 'Manage your procurement booking slots and live queue status here.'}
            </p>
          </div>

          <div className="bg-emerald-900/60 border border-emerald-700/60 rounded-xl p-4 text-xs text-emerald-100 space-y-1.5 min-w-[220px]">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-300" />
              <span>{user.mobile_number}</span>
            </div>
            {user.village && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                <span>
                  {isHindi ? 'गाँव:' : 'Village:'} {user.village}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isHindi ? 'खाता स्थिति:' : 'Account Status:'}{' '}
                <strong className="text-emerald-300">{isHindi ? 'सक्रिय' : 'Active'}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Upcoming Booking Card (if present) */}
      {activeBooking && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/60 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎫</span>
              <div>
                <h3 className="font-bold text-neutral-900 text-base">
                  {isHindi ? 'आपकी आगामी नियुक्ति (Upcoming Visit)' : 'Upcoming Procurement Appointment'}
                </h3>
                <span className="font-mono text-xs text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {activeBooking.public_token}
                </span>
              </div>
            </div>

            {statusMeta && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusMeta.bg} ${statusMeta.color}`}>
                {isHindi ? statusMeta.hi : statusMeta.en}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-700 mb-4">
            <div className="flex items-start gap-2">
              <Building className="w-4 h-4 text-emerald-700 mt-0.5" />
              <div>
                <div className="text-neutral-500">{isHindi ? 'खरीद केंद्र:' : 'Centre:'}</div>
                <div className="font-bold text-neutral-900">{activeBooking.centre_name}</div>
                <div className="text-neutral-500 text-[11px]">{activeBooking.centre_district}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-emerald-700 mt-0.5" />
              <div>
                <div className="text-neutral-500">{isHindi ? 'तारीख व समय:' : 'Date & Time:'}</div>
                <div className="font-bold text-neutral-900">{activeBooking.slot_date}</div>
                <div>
                  {formatTime(activeBooking.start_time)} - {formatTime(activeBooking.end_time)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Wheat className="w-4 h-4 text-amber-700 mt-0.5" />
              <div>
                <div className="text-neutral-500">{isHindi ? 'उपज व कतार:' : 'Crop & Queue:'}</div>
                <div className="font-bold text-neutral-900">
                  {activeBooking.produce_type} ({activeBooking.quantity} {activeBooking.quantity_unit})
                </div>
                {activeBooking.queue_number && (
                  <div className="text-emerald-700 font-semibold">
                    {isHindi ? 'कतार संख्या' : 'Queue Sequence'}: #{activeBooking.queue_number}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200/60">
            <Link
              to={`/farmer/bookings/${activeBooking.id}/confirmation`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <span>{isHindi ? 'डिजिटल रसीद / टोकन देखें' : 'View Token Receipt'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Core Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Book Slot */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-emerald-500 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-neutral-900 mb-1">
              {isHindi ? 'नया खरीद स्लॉट बुक करें' : 'Book Procurement Slot'}
            </h2>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              {isHindi
                ? 'नजदीकी केंद्र चुनें, फसल की मात्रा दर्ज करें और अपनी पसंद की तारीख व समय पर स्लॉट सुरक्षित करें।'
                : 'Browse registered centres, enter crop quantity, and reserve your guaranteed visit time window.'}
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-medium">
              {isHindi ? 'आसान 3-चरणीय प्रक्रिया' : 'Simple 3-step booking'}
            </span>
            <Link
              to="/farmer/centres"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
            >
              <span>{isHindi ? 'केंद्र चुनें' : 'Choose Centre'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* My Bookings */}
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm flex flex-col justify-between hover:border-amber-500 transition-all">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Ticket className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-neutral-900 mb-1">
              {isHindi ? 'मेरी बुकिंग्स एवं टोकन' : 'My Bookings & Tokens'}
            </h2>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              {isHindi
                ? 'अपने सक्रिय टोकन नंबर, कतार स्थिति और पिछली खरीद का इतिहास देखें या टोकन रसीद डाउनलोड करें।'
                : 'Track your booking references, check-in status, queue sequence, or print receipt tokens.'}
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-500">
              {isHindi ? 'कुल नियुक्तियां:' : 'Total bookings:'}{' '}
              <strong className="text-neutral-800">{totalBookingsCount}</strong>
            </span>
            <Link
              to="/farmer/bookings"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
            >
              <span>{isHindi ? 'बुकिंग्स देखें' : 'View Bookings'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Security & Verification Callout */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-600 flex items-start gap-3">
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-neutral-800">
            {isHindi ? 'सत्र सुरक्षा स्थिति:' : 'Session Security:'}
          </span>{' '}
          {isHindi
            ? 'आपका पासवर्ड Argon2 के साथ सुरक्षित रूप से एन्क्रिप्टेड है। स्लॉट आरक्षण वास्तविक समय में परमाणु डेटाबेस लॉकिंग से सुरक्षित है।'
            : 'Your credentials are cryptographically protected with Argon2 hashing. Slot reservations are protected by atomic database transactions.'}
        </div>
      </div>
    </div>
  )
}
