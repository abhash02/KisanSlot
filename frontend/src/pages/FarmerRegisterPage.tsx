import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus, AlertCircle, Phone, Lock, User, MapPin } from 'lucide-react'

export const FarmerRegisterPage: React.FC = () => {
  const { registerFarmer, language } = useAuth()
  const navigate = useNavigate()
  const isHindi = language === 'hi'

  const [fullName, setFullName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [password, setPassword] = useState('')
  const [village, setVillage] = useState('')
  const [preferredLang, setPreferredLang] = useState<'hi' | 'en'>(language)
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = isHindi ? 'कृपया कम से कम 2 अक्षरों का नाम दर्ज करें।' : 'Name must be at least 2 characters.'
    }

    const cleanMobile = mobileNumber.replace(/[\s\-\+]/g, '')
    const mobilePattern = /^[6-9]\d{9}$/
    // Check if ends with 10 digits or is 10 digits
    const last10 = cleanMobile.slice(-10)
    if (!mobilePattern.test(last10) || (cleanMobile.length !== 10 && !cleanMobile.startsWith('91'))) {
      errors.mobileNumber = isHindi
        ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें (6-9 से शुरू)।'
        : 'Please enter a valid 10-digit mobile number starting with 6-9.'
    }

    if (!password || password.length < 6) {
      errors.password = isHindi
        ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
        : 'Password must be at least 6 characters long.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await registerFarmer({
        full_name: fullName.trim(),
        mobile_number: mobileNumber.trim(),
        password,
        village: village.trim() || undefined,
        preferred_language: preferredLang,
      })
      navigate('/farmer/dashboard')
    } catch (err: any) {
      setSubmitError(err.message || (isHindi ? 'पंजीकरण विफल रहा। पुनः प्रयास करें।' : 'Registration failed. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-6 p-6 bg-white rounded-2xl shadow-sm border border-neutral-200">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">
          {isHindi ? 'किसान नया पंजीकरण' : 'Farmer Registration'}
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          {isHindi
            ? 'अपनी उपज का स्लॉट बुक करने के लिए खाता बनाएं'
            : 'Create an account to book procurement visits'}
        </p>
      </div>

      {submitError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            {isHindi ? 'पूरा नाम *' : 'Full Name *'}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isHindi ? 'उदा. रमेश कुमार' : 'e.g. Ramesh Kumar'}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                fieldErrors.fullName ? 'border-red-400 bg-red-50/30' : 'border-neutral-300'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          </div>
          {fieldErrors.fullName && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            {isHindi ? '10 अंकों का मोबाइल नंबर *' : '10-Digit Mobile Number *'}
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="9876543210"
              maxLength={14}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                fieldErrors.mobileNumber ? 'border-red-400 bg-red-50/30' : 'border-neutral-300'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          </div>
          {fieldErrors.mobileNumber && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.mobileNumber}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            {isHindi ? 'पासवर्ड (कम से कम 6 अक्षर) *' : 'Password (min 6 characters) *'}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                fieldErrors.password ? 'border-red-400 bg-red-50/30' : 'border-neutral-300'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        {/* Village (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            {isHindi ? 'गाँव / क्षेत्र (वैकल्पिक)' : 'Village / Locality (Optional)'}
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder={isHindi ? 'उदा. रामपुर' : 'e.g. Rampur'}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Preferred Language */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1">
            {isHindi ? 'पसंदीदा भाषा' : 'Preferred Language'}
          </label>
          <select
            value={preferredLang}
            onChange={(e) => setPreferredLang(e.target.value as 'hi' | 'en')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="en">English</option>
          </select>
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
              <span>{isHindi ? 'पंजीकरण हो रहा है...' : 'Creating Account...'}</span>
            </>
          ) : (
            <span>{isHindi ? 'खाता बनाएं एवं आगे बढ़ें' : 'Register & Proceed'}</span>
          )}
        </button>
      </form>

      {/* Link to Login */}
      <div className="mt-6 pt-4 border-t border-neutral-100 text-center text-xs text-neutral-600">
        <span>{isHindi ? 'पहले से खाता है?' : 'Already have an account?'} </span>
        <Link to="/login" className="text-emerald-700 font-semibold hover:underline">
          {isHindi ? 'यहाँ लॉगिन करें' : 'Sign In here'}
        </Link>
      </div>
    </div>
  )
}

