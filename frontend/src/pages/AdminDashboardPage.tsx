import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../lib/api'
import {
  Shield,
  Building,
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'

interface AdminSummary {
  total_farmers: number
  active_centres: number
  total_slots: number
  total_bookings: number
  completed_bookings: number
}

export const AdminDashboardPage = () => {
  const { user, language } = useAuth()
  const isHindi = language === 'hi'

  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest<AdminSummary>('/admin/summary')
      setSummary(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load admin summary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-xs font-medium mb-3 border border-slate-700">
              <Shield className="w-3.5 h-3.5" />
              <span>{isHindi ? 'अधिकृत प्रशासनिक नियंत्रण कक्ष' : 'Authorized Administrator Console'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {isHindi ? `व्यवस्थापक: ${user.full_name}` : `Admin: ${user.full_name}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isHindi
                ? 'खरीद केंद्रों, स्लॉट क्षमता और किसान कतार का संचालन एवं निगरानी करें।'
                : 'Manage procurement centres, configure slot capacity, and supervise the arrival queue.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSummary}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div>
        <h2 className="text-xs font-bold text-neutral-500 mb-3 uppercase tracking-wider">
          {isHindi ? 'प्रणाली सारांश मैट्रिक्स' : 'System Overview Metrics'}
        </h2>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Farmers */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold">{isHindi ? 'पंजीकृत किसान' : 'Farmers'}</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              {loading ? '...' : summary?.total_farmers ?? 0}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {isHindi ? 'सत्यापित किसान खाते' : 'Registered user accounts'}
            </div>
          </div>

          {/* Active Centres */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold">{isHindi ? 'सक्रिय केंद्र' : 'Centres'}</span>
              <Building className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              {loading ? '...' : summary?.active_centres ?? 0}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {isHindi ? 'खरीद केंद्र' : 'Active procurement hubs'}
            </div>
          </div>

          {/* Total Slots */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold">{isHindi ? 'कुल स्लॉट' : 'Slots'}</span>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              {loading ? '...' : summary?.total_slots ?? 0}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {isHindi ? 'उपलब्ध समय खिड़कियां' : 'Scheduled time windows'}
            </div>
          </div>

          {/* Bookings */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold">{isHindi ? 'सक्रिय बुकिंग्स' : 'Active Bookings'}</span>
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              {loading ? '...' : summary?.total_bookings ?? 0}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1">
              {summary?.completed_bookings ?? 0} {isHindi ? 'खरीद पूर्ण' : 'completed'}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Modules Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Manage Centres */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:border-slate-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                <Building className="w-4 h-4 text-slate-700" />
                <span>{isHindi ? 'खरीद केंद्र प्रबंधन' : 'Procurement Centres'}</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Centres
              </span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              {isHindi
                ? 'नए खरीद केंद्र पंजीकृत करें, पते संपादित करें और उनकी सक्रिय स्थिति को नियंत्रित करें।'
                : 'Create new procurement hubs, update addresses or operating notes, and toggle availability.'}
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs text-neutral-400">{isHindi ? 'केंद्र सूची एवं संपादन' : 'Centre Registry'}</span>
            <Link
              to="/admin/centres"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>{isHindi ? 'केंद्र प्रबंधित करें' : 'Manage Centres'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Manage Slots */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:border-slate-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                <Calendar className="w-4 h-4 text-purple-700" />
                <span>{isHindi ? 'स्लॉट एवं क्षमता प्रबंधन' : 'Slots & Capacity'}</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Capacity
              </span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              {isHindi
                ? 'दिनांक अनुसार समय स्लॉट खोलें, क्षमता निर्धारित करें एवं ओवरलैप रोकथाम के साथ स्लॉट संचालित करें।'
                : 'Open time slots by date, configure max bookings, and adjust capacities safely.'}
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs text-neutral-400">{isHindi ? 'क्षमता नियंत्रण' : 'Capacity Control'}</span>
            <Link
              to="/admin/slots"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>{isHindi ? 'स्लॉट प्रबंधित करें' : 'Manage Slots'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Queue & Arrival Check-in */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{isHindi ? 'आगमन एवं कतार प्रबंधन' : 'Live Queue & Check-in'}</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Queue
              </span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              {isHindi
                ? 'टोकन खोजें, किसान आगमन (ARRIVED) दर्ज करें, तौल प्रक्रिया (IN_SERVICE) शुरू करें और पूर्ण (COMPLETED) करें।'
                : 'Search tokens, check in arriving farmers, progress visits to weighbridge service, and complete.'}
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs text-neutral-400">{isHindi ? 'दैनिक परिचालन' : 'Daily Operations'}</span>
            <Link
              to="/admin/queue"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>{isHindi ? 'कतार खोलें' : 'Open Queue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Reports & Analytics */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:border-emerald-400 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                <TrendingUp className="w-4 h-4 text-blue-700" />
                <span>{isHindi ? 'रिपोर्ट एवं आवक विश्लेषण' : 'Procurement Analytics'}</span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Analytics
              </span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              {isHindi
                ? 'फसल अनुसार आवक मात्रा, केंद्र थ्रूपुट और दैनिक परिचालन सारांश रिपोर्ट देखें व प्रिंट करें।'
                : 'View crop volume summaries, centre throughput breakdown, and printable fulfillment reports.'}
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-xs text-neutral-400">{isHindi ? 'परिचालन रिपोर्ट' : 'Operational Reports'}</span>
            <Link
              to="/admin/reports"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>{isHindi ? 'रिपोर्ट देखें' : 'View Reports'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
