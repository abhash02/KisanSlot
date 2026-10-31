import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldAlert } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRole?: 'FARMER' | 'ADMIN'
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { isAuthenticated, isLoading, role, language } = useAuth()
  const location = useLocation()
  const isHindi = language === 'hi'

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-neutral-600">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">
          {isHindi ? 'सत्यापन हो रहा है, कृपया प्रतीक्षा करें...' : 'Verifying authentication, please wait...'}
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to admin login if attempting admin route, else farmer login
    const targetPath = allowedRole === 'ADMIN' ? '/admin/login' : '/login'
    return <Navigate to={targetPath} state={{ from: location }} replace />
  }

  if (allowedRole && role !== allowedRole) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl shadow-sm border border-red-200 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 mb-2">
          {isHindi ? 'पहुंच अस्वीकृत (अनधिकृत भूमिका)' : 'Access Restricted'}
        </h2>
        <p className="text-sm text-neutral-600 mb-6">
          {isHindi
            ? `आपका वर्तमान खाता (${role === 'ADMIN' ? 'व्यवस्थापक' : 'किसान'}) इस पृष्ठ को देखने के लिए अधिकृत नहीं है।`
            : `Your current account (${role}) does not have permission to view this section.`}
        </p>
        <div className="flex flex-col gap-2">
          <a
            href={role === 'ADMIN' ? '/admin/dashboard' : '/farmer/dashboard'}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isHindi ? 'अपने पोर्टल पर जाएं' : 'Go to your portal'}
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
