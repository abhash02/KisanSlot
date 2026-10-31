import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, ArrowRight, Activity, Users } from 'lucide-react'

interface HealthState {
  status: string
  app: string
  version: string
  database: string
}

export const HomePage: React.FC = () => {
  const { isAuthenticated, role, language } = useAuth()
  const [health, setHealth] = useState<HealthState | null>(null)
  const isHindi = language === 'hi'

  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth(null))
  }, [])

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-emerald-800 to-emerald-900 text-white rounded-2xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SIH26032 Prototype • KisanSlot
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {isHindi
              ? 'मंडी में भीड़ से बचें, अपनी उपज बेचने का समय पहले से चुनें'
              : 'Avoid Mandi Crowds — Schedule Your Procurement Slot in Advance'}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            {isHindi
              ? 'किसानस्लॉट के साथ खरीद केंद्रों पर पारदर्शी और समयबद्ध सेवा का लाभ उठाएं। अपना टोकन घर बैठे प्राप्त करें।'
              : 'Empowering farmers with transparent, predictable procurement visits. Reserve a guaranteed time window and save hours of waiting.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link
                to={role === 'ADMIN' ? '/admin/dashboard' : '/farmer/dashboard'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-900 font-bold text-sm shadow-md transition-all hover:gap-3"
              >
                <span>{isHindi ? 'अपने डैशबोर्ड पर जाएं' : 'Open Your Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-900 font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
                >
                  <span>{isHindi ? 'नया किसान पंजीकरण' : 'Register as Farmer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 text-white font-medium text-sm border border-emerald-500/40 transition-colors"
                >
                  <span>{isHindi ? 'किसान लॉगिन' : 'Farmer Sign In'}</span>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="hidden lg:block absolute -right-12 -bottom-16 text-9xl opacity-20 pointer-events-none select-none">
          🌾
        </div>
      </section>

      {/* Demonstration Prototype Disclaimer */}
      <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
        <span className="text-xl mt-0.5">⚠️</span>
        <div>
          <div className="font-bold">
            {isHindi ? 'छात्र परियोजना प्रोटोटाइप सूचना' : 'Student Hackathon Prototype Notice'}
          </div>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            {isHindi
              ? 'यह वेब अनुप्रयोग स्मार्ट इंडिया हैकथॉन (SIH26032) के लिए बनाया गया एक प्रोटोटाइप है। यह कोई आधिकारिक सरकारी खरीद पोर्टल नहीं है और न ही वास्तविक एमएसपी (न्यूनतम समर्थन मूल्य) का भुगतान करता है।'
              : 'This application is a student demonstration prototype developed for SIH26032. It does not replace official state marketing boards, nor does it guarantee procurement prices or government transactions.'}
          </p>
        </div>
      </section>

      {/* How it Works: 3 Steps */}
      <section>
        <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <span>🚜</span>
          <span>{isHindi ? 'यह कैसे काम करता है? (3 आसान चरण)' : 'How it Works (3 Easy Steps)'}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm mb-3">
              1
            </div>
            <h3 className="font-bold text-neutral-900 text-base mb-1">
              {isHindi ? 'केंद्र और समय चुनें' : 'Choose Centre & Slot'}
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {isHindi
                ? 'अपने नजदीकी खरीद केंद्र पर उपलब्ध तारीखों और खाली स्लॉट की जांच करें।'
                : 'Browse registered procurement centres and view available time slots with live remaining capacity.'}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm mb-3">
              2
            </div>
            <h3 className="font-bold text-neutral-900 text-base mb-1">
              {isHindi ? 'उपज दर्ज कर टोकन पाएं' : 'Enter Produce & Book'}
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {isHindi
                ? 'फसल का प्रकार और मात्रा दर्ज करके तुरंत अपना अद्वितीय डिजिटल टोकन सुरक्षित करें।'
                : 'Specify produce type and expected quintals to receive a cryptographically secure booking token.'}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm mb-3">
              3
            </div>
            <h3 className="font-bold text-neutral-900 text-base mb-1">
              {isHindi ? 'निर्धारित समय पर पहुंचें' : 'Arrive at Scheduled Time'}
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {isHindi
                ? 'टोकन दिखाएं और बिना लंबी कतारों के सुगम खरीद प्रक्रिया का हिस्सा बनें।'
                : 'Show your token to the centre operator for swift check-in, queue progression, and unloading.'}
            </p>
          </div>
        </div>
      </section>

      {/* Role Access Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
              <Users className="w-4 h-4" />
              <span>{isHindi ? 'किसान अनुभाग' : 'Farmer Portal'}</span>
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-2">
              {isHindi ? 'किसान पंजीकरण एवं लॉगिन' : 'Farmer Registration & Access'}
            </h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              {isHindi
                ? 'अपने 10 अंकों के मोबाइल नंबर से लॉगिन करें। अपने सभी पिछले और आगामी टोकन देखें।'
                : 'Sign in with your 10-digit mobile number. Track active tokens, status history, or cancel upcoming visits.'}
            </p>
          </div>
          <div className="flex gap-2 pt-3 border-t border-neutral-100">
            <Link
              to="/login"
              className="text-xs font-semibold px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            >
              {isHindi ? 'लॉगिन करें' : 'Sign In'}
            </Link>
            <Link
              to="/register"
              className="text-xs font-medium px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors"
            >
              {isHindi ? 'नया खाता बनाएं' : 'Create Account'}
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-2">
              <Shield className="w-4 h-4" />
              <span>{isHindi ? 'प्रशासक अनुभाग' : 'Administrator Portal'}</span>
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-2">
              {isHindi ? 'केंद्र व्यवस्थापक लॉगिन' : 'Procurement Centre Officer'}
            </h3>
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              {isHindi
                ? 'खरीद केंद्रों का प्रबंधन करें, स्लॉट क्षमता निर्धारित करें एवं टोकन कतार का संचालन करें।'
                : 'Manage centers, configure slot capacities, inspect farmer tokens, and manage live queue transitions.'}
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-100">
            <Link
              to="/admin/login"
              className="inline-block text-xs font-semibold px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg transition-colors"
            >
              {isHindi ? 'व्यवस्थापक लॉगिन' : 'Admin Sign In'}
            </Link>
          </div>
        </div>
      </section>

      {/* System Status Footnote */}
      {health && (
        <section className="bg-neutral-100 rounded-xl p-3 text-xs text-neutral-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>
              {health.app} API: <strong className="text-emerald-700">{health.status}</strong> | Database: <strong className={health.database === 'connected' ? 'text-emerald-700' : 'text-amber-700'}>{health.database}</strong>
            </span>
          </div>
          <span className="text-[11px] text-neutral-500">v{health.version}</span>
        </section>
      )}
    </div>
  )
}
