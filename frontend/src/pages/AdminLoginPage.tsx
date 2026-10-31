import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, AlertCircle, Phone, Lock, ArrowLeft } from 'lucide-react'

export const AdminLoginPage: React.FC = () => {
  const { login, language } = useAuth()
  const navigate = useNavigate()
  const isHindi = language === 'hi'

  const [mobileNumber, setMobileNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanMobile = mobileNumber.replace(/[\s\-\+]/g, '')
    if (!cleanMobile || cleanMobile.length < 10) {
      setError(isHindi ? 'कृपया 10 अंकों का व्यवस्थापक मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.')
      return
    }

    if (!password) {
      setError(isHindi ? 'कृपया पासवर्ड दर्ज करें।' : 'Please enter your password.')
      return
    }

    setIsSubmitting(true)
    try {
      const user = await login({
        mobile_number: cleanMobile,
        password,
      })

      if (user.role !== 'ADMIN') {
        setError(
          isHindi
            ? 'यह खाता व्यवस्थापक नहीं है। आपको किसान पोर्टल पर भेजा जा रहा है...'
            : 'This account does not have administrator privileges. Redirecting to farmer portal...'
        )
        setTimeout(() => navigate('/farmer/dashboard'), 1500)
        return
      }

      navigate('/admin/dashboard')
    } catch (err: any) {
      setError(err.message || (isHindi ? 'व्यवस्थापक प्रमाणीकरण विफल रहा।' : 'Administrator authentication failed.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-2xl shadow-md border border-neutral-200">
      {/* Title Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto mb-3 border border-slate-300">
          <Shield className="w-6 h-6 text-slate-700" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isHindi ? 'व्यवस्थापक लॉगिन' : 'Administrator Portal'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isHindi
            ? 'खरीद केंद्र अधिकारी एवं संचालन प्रबंधन'
            : 'Procurement Centre Officers & Queue Operators'}
        </p>
      </div>

      {/* Security notice */}
      <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs">
        <span className="font-semibold">{isHindi ? 'सुरक्षा सूचना:' : 'Security Notice:'}</span>{' '}
        {isHindi
          ? 'यह क्षेत्र केवल अधिकृत खरीद केंद्र कर्मियों के लिए है। सभी लॉगिन प्रयास ऑडिट किए जाते हैं।'
          : 'Restricted area for authorized personnel. Admin credentials are provisioned via secure backend seed commands.'}
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            {isHindi ? 'व्यवस्थापक मोबाइल नंबर *' : 'Admin Mobile Number *'}
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="9000011111"
              maxLength={14}
              required
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-slate-700"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            {isHindi ? 'पासवर्ड *' : 'Password *'}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-slate-700"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 mt-2 bg-slate-800 hover:bg-slate-900 disabled:bg-neutral-300 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{isHindi ? 'सत्यापन हो रहा है...' : 'Authenticating...'}</span>
            </>
          ) : (
            <span>{isHindi ? 'व्यवस्थापक के रूप में प्रवेश करें' : 'Sign In as Administrator'}</span>
          )}
        </button>
      </form>

      {/* Back to Farmer Portal */}
      <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isHindi ? 'किसान लॉगिन पर वापस जाएं' : 'Back to Farmer Login'}</span>
        </Link>
      </div>
    </div>
  )
}

