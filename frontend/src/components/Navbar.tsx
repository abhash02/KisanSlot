import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Menu, X, User as UserIcon, LogOut, Shield, Globe } from 'lucide-react'

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, role, logout, language, setLanguage } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  const toggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi')
  }

  const isHindi = language === 'hi'

  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <Link to="/" className="flex items-center space-x-3 group" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight">KisanSlot</span>
                <span className="text-xs bg-emerald-950/60 text-emerald-300 font-medium px-2 py-0.5 rounded-full border border-emerald-600/40">
                  किसानस्लॉट
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 hidden sm:block">
                {isHindi ? 'कृषि खरीद स्लॉट शेड्यूलिंग प्रणाली' : 'Farmer Procurement Scheduling'}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-xs bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-700/60 transition-colors"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isHindi ? 'English' : 'हिन्दी'}</span>
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to={role === 'ADMIN' ? '/admin/dashboard' : '/farmer/dashboard'}
                  className="flex items-center space-x-2 text-sm bg-emerald-700/60 hover:bg-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-600/40 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-emerald-200" />
                  <span className="font-medium truncate max-w-[140px]">{user.full_name}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-300">
                    {role === 'ADMIN' ? (isHindi ? 'व्यवस्थापक' : 'Admin') : (isHindi ? 'किसान' : 'Farmer')}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 text-xs text-emerald-200 hover:text-white bg-red-950/40 hover:bg-red-900/60 px-3 py-1.5 rounded-lg border border-red-800/40 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'लॉगआउट' : 'Sign Out'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-sm text-emerald-100 hover:text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700/60 transition-colors"
                >
                  {isHindi ? 'किसान लॉगिन' : 'Farmer Login'}
                </Link>

                <Link
                  to="/register"
                  className="text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
                >
                  {isHindi ? 'नया पंजीकरण' : 'Register'}
                </Link>

                <Link
                  to="/admin/login"
                  className="flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-700/50 hover:bg-emerald-900/40 transition-colors ml-1"
                  title="Official Administrator Login"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'व्यवस्थापक' : 'Admin'}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleLanguage}
              className="p-1.5 text-xs bg-emerald-900/60 text-emerald-200 rounded border border-emerald-700/60"
            >
              {isHindi ? 'EN' : 'हि'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-emerald-100 hover:bg-emerald-700 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-emerald-900 border-t border-emerald-700 px-4 pt-3 pb-5 space-y-3">
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-800">
                <div>
                  <div className="font-medium text-sm text-white">{user.full_name}</div>
                  <div className="text-xs text-emerald-300">{user.mobile_number}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 uppercase font-bold">
                  {role}
                </span>
              </div>
              <Link
                to={role === 'ADMIN' ? '/admin/dashboard' : '/farmer/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm py-2 px-3 rounded-lg bg-emerald-800 text-white"
              >
                {isHindi ? 'डैशबोर्ड पर जाएं' : 'Go to Dashboard'}
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-2 text-sm text-red-200 bg-red-900/60 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                <span>{isHindi ? 'लॉगआउट' : 'Sign Out'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 px-3 rounded-lg bg-emerald-800/80 text-white text-sm"
              >
                {isHindi ? 'किसान लॉगिन' : 'Farmer Login'}
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 px-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
              >
                {isHindi ? 'नया किसान पंजीकरण' : 'Farmer Registration'}
              </Link>
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 px-3 rounded-lg border border-emerald-700 text-emerald-200 text-xs"
              >
                {isHindi ? 'व्यवस्थापक पोर्टल लॉगिन' : 'Admin Portal Login'}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

