import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, AlertCircle, Phone, Lock, Shield } from 'lucide-react'

export const FarmerLoginPage: React.FC = () => {
  const { login, language } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isHindi = language === 'hi'

  const [mobileNumber, setMobileNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = (location.state as any)?.from?.pathname || '/farmer/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanMobile = mobileNumber.replace(/[\s\-\+]/g, '')
    if (!cleanMobile || cleanMobile.length < 10) {
      setError(isHindi ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.')
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
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard')
      } else {
        navigate(from, { replace: true })
      }
    } catch (err: any) {
      setError(err.message || (isHindi ? 'लॉगिन विफल रहा। कृपया विवरण जांचें।' : 'Login failed. Please verify your credentials.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-2xl shadow-sm border border-neutral-200">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">
          {isHindi ? 'किसान लॉगिन' : 'Farmer Sign In'}
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          {isHindi
            ? 'अपने पंजीकृत मोबाइल नंबर से प्रवेश करें'
            : 'Enter your registered mobile number and password'}
        </p>
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
            {isHindi ? 'मोबाइल नंबर *' : '10-Digit Mobile Number *'}
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="9876543210"
              maxLength={14}
              required
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 mt-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-neutral-300 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{isHindi ? 'सत्यापन हो रहा है...' : 'Verifying...'}</span>
            </>
          ) : (
            <span>{isHindi ? 'लॉगिन करें' : 'Sign In'}</span>
          )}
        </button>
      </form>

      {/* Navigation Links */}
      <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-col gap-3 text-center text-xs">
        <div>
          <span className="text-neutral-600">{isHindi ? 'नया किसान खाता?' : 'New farmer?'} </span>
          <Link to="/register" className="text-emerald-700 font-semibold hover:underline">
            {isHindi ? 'यहाँ पंजीकरण करें' : 'Register here'}
          </Link>
        </div>

        <div>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isHindi ? 'खरीद केंद्र अधिकारी / व्यवस्थापक लॉगिन' : 'Procurement Officer / Admin Portal'}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

