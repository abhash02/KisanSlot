import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import type { Centre } from '../../types/procurement'
import { Building, MapPin, Search, Calendar, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react'

export const BrowseCentresPage = () => {
  const { language } = useAuth()
  const isHindi = language === 'hi'
  const navigate = useNavigate()

  const [centres, setCentres] = useState<Centre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')

  const fetchCentres = async () => {
    setLoading(true)
    setError(null)
    try {
      let queryParams = new URLSearchParams()
      if (searchQuery.trim()) queryParams.set('q', searchQuery.trim())
      if (selectedDistrict.trim()) queryParams.set('district', selectedDistrict.trim())

      const endpoint = `/centres${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const data = await apiRequest<Centre[]>(endpoint)
      setCentres(data)
    } catch (err: any) {
      setError(err.message || (isHindi ? 'केंद्र सूची लोड करने में विफल।' : 'Failed to load centres.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCentres()
  }, [selectedDistrict])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCentres()
  }

  // Extract unique districts for dropdown
  const uniqueDistricts = Array.from(new Set(centres.map((c) => c.district))).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
              <Building className="w-3.5 h-3.5" />
              <span>{isHindi ? 'खरीद केंद्र चयन' : 'Procurement Centres'}</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {isHindi ? 'अपने नजदीकी खरीद केंद्र का चयन करें' : 'Select a Procurement Centre'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              {isHindi
                ? 'उपलब्ध तिथियों और खाली समय स्लॉट को देखने के लिए केंद्र चुनें'
                : 'Browse registered centres to check available dates and time slots'}
            </p>
          </div>

          <button
            onClick={fetchCentres}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 pt-5 border-t border-neutral-100 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHindi ? 'केंद्र का नाम या पता खोजें...' : 'Search centre name or address...'}
              className="w-full pl-9 pr-20 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium"
            >
              {isHindi ? 'खोजें' : 'Search'}
            </button>
          </form>

          {uniqueDistricts.length > 0 && (
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{isHindi ? 'सभी जिले (All Districts)' : 'All Districts'}</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && centres.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white p-6 rounded-xl border border-neutral-200 animate-pulse space-y-3">
              <div className="h-5 bg-neutral-200 rounded w-2/3"></div>
              <div className="h-3 bg-neutral-100 rounded w-1/2"></div>
              <div className="h-12 bg-neutral-50 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && centres.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center border border-neutral-200 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
            <Building className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-neutral-800 text-base mb-1">
            {isHindi ? 'कोई खरीद केंद्र नहीं मिला' : 'No Procurement Centres Found'}
          </h3>
          <p className="text-xs text-neutral-500 mb-4">
            {isHindi
              ? 'वर्तमान में कोई सक्रिय केंद्र उपलब्ध नहीं है या आपके खोज मानदंडों से मेल नहीं खाता।'
              : 'No active centres match your current search criteria.'}
          </p>
          {(searchQuery || selectedDistrict) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedDistrict('')
              }}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              {isHindi ? 'फ़िल्टर हटाएं' : 'Clear filters'}
            </button>
          )}
        </div>
      )}

      {/* Centres Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {centres.map((centre) => (
          <div
            key={centre.id}
            className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:border-emerald-500 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-neutral-900 text-base">{centre.name}</h3>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  {centre.district}
                </span>
              </div>

              <div className="flex items-start gap-1.5 text-xs text-neutral-600 mb-3">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{centre.address}</span>
              </div>

              {centre.notes && (
                <div className="text-[11px] bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-neutral-600 mb-4 italic">
                  "{centre.notes}"
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  <strong>{centre.active_slots ?? 0}</strong> {isHindi ? 'सक्रिय स्लॉट' : 'Active Slots'}
                </span>
              </div>

              <button
                onClick={() => navigate(`/farmer/centres/${centre.id}/slots`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <span>{isHindi ? 'स्लॉट देखें' : 'View Slots'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
