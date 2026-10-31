import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'

// Public Pages
import { HomePage } from './pages/HomePage'
import { FarmerRegisterPage } from './pages/FarmerRegisterPage'
import { FarmerLoginPage } from './pages/FarmerLoginPage'
import { AdminLoginPage } from './pages/AdminLoginPage'

// Farmer Pages
import { FarmerDashboardPage } from './pages/FarmerDashboardPage'
import { BrowseCentresPage } from './pages/farmer/BrowseCentresPage'
import { SlotSelectionPage } from './pages/farmer/SlotSelectionPage'
import { MyBookingsPage } from './pages/farmer/MyBookingsPage'
import { BookingConfirmationPage } from './pages/farmer/BookingConfirmationPage'

// Admin Pages
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminCentresPage } from './pages/admin/AdminCentresPage'
import { AdminSlotsPage } from './pages/admin/AdminSlotsPage'
import { AdminQueuePage } from './pages/admin/AdminQueuePage'
import { AdminReportsPage } from './pages/admin/AdminReportsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col font-sans antialiased selection:bg-emerald-200 selection:text-emerald-900">
          <Navbar />

          <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<FarmerRegisterPage />} />
              <Route path="/login" element={<FarmerLoginPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Farmer Routes (Protected role="FARMER") */}
              <Route
                path="/farmer/dashboard"
                element={
                  <ProtectedRoute allowedRole="FARMER">
                    <FarmerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/farmer/centres"
                element={
                  <ProtectedRoute allowedRole="FARMER">
                    <BrowseCentresPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/farmer/centres/:centreId/slots"
                element={
                  <ProtectedRoute allowedRole="FARMER">
                    <SlotSelectionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/farmer/bookings"
                element={
                  <ProtectedRoute allowedRole="FARMER">
                    <MyBookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/farmer/bookings/:bookingId/confirmation"
                element={
                  <ProtectedRoute allowedRole="FARMER">
                    <BookingConfirmationPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes (Protected role="ADMIN") */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/centres"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <AdminCentresPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/slots"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <AdminSlotsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/queue"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <AdminQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute allowedRole="ADMIN">
                    <AdminReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Global Footer */}
          <footer className="bg-white border-t border-neutral-200 mt-auto py-6 text-center text-xs text-neutral-500 print:hidden">
            <div className="max-w-6xl mx-auto px-4 space-y-1">
              <p>
                <strong>KisanSlot (किसानस्लॉट)</strong> — Farmer Procurement Scheduling Platform
              </p>
              <p className="text-[11px] text-neutral-400">
                Smart India Hackathon Prototype (SIH26032) • React 19, FastAPI & PostgreSQL
              </p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
