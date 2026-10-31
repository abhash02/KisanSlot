import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import type { Centre } from '../../types/procurement'
import {
  Plus,
  Search,
  MapPin,
  AlertCircle,
  RefreshCw,
  X,
  Edit2,
  ArrowLeft,
} from 'lucide-react'

export const AdminCentresPage = () => {
  const { language } = useAuth()
  const isHindi = language === 'hi'

  const [centres, setCentres] = useState<Centre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDistrict, setNewDistrict] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newIsActive, setNewIsActive] = useState(true)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Edit Modal
  const [editingCentre, setEditingCentre] = useState<Centre | null>(null)

  const fetchCentres = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest<Centre[]>('/admin/centres')
      setCentres(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load centres.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCentres()
  }, [])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSubmitting(true)
    try {
      const created = await apiRequest<Centre>('/admin/centres', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          district: newDistrict.trim(),
          address: newAddress.trim(),
          notes: newNotes.trim() || undefined,
          is_active: newIsActive,
        }),
      })
      setCentres((prev) => [created, ...prev])
      setCreateModalOpen(false)
      // reset form
      setNewName('')
      setNewDistrict('')
      setNewAddress('')
      setNewNotes('')
    } catch (err: any) {
      setFormError(err.message || 'Failed to create centre.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleToggleStatus = async (centre: Centre) => {
    try {
      const updated = await apiRequest<Centre>(`/admin/centres/${centre.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !centre.is_active }),
      })
      setCentres((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch (err: any) {
      alert(`Error updating centre status: ${err.message}`)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCentre) return
    setFormSubmitting(true)
    setFormError(null)

    try {
      const updated = await apiRequest<Centre>(`/admin/centres/${editingCentre.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editingCentre.name.trim(),
          district: editingCentre.district.trim(),
          address: editingCentre.address.trim(),
          notes: editingCentre.notes?.trim() || undefined,
          is_active: editingCentre.is_active,
        }),
      })
      setCentres((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setEditingCentre(null)
    } catch (err: any) {
      setFormError(err.message || 'Failed to update centre.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const filteredCentres = centres.filter((c) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(term) ||
      c.district.toLowerCase().includes(term) ||
      c.address.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/admin/dashboard"
                className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isHindi ? 'नियंत्रण कक्ष' : 'Admin Console'}</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold">
              {isHindi ? 'खरीद केंद्र प्रबंधन' : 'Procurement Centre Management'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isHindi
                ? 'खरीद केंद्रों को जोड़ें, जानकारी संपादित करें और सक्रिय/निष्क्रिय स्थिति को नियंत्रित करें।'
                : 'Create, inspect, modify details, and manage active availability of procurement centres.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCentres}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => {
                setFormError(null)
                setCreateModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{isHindi ? 'नया केंद्र जोड़ें' : 'Add New Centre'}</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isHindi ? 'केंद्र का नाम, जिला या पता खोजें...' : 'Filter by name, district, address...'}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Centres List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCentres.map((centre) => (
          <div
            key={centre.id}
            className={`bg-white rounded-xl p-5 border shadow-sm flex flex-col justify-between transition-all ${
              centre.is_active ? 'border-neutral-200' : 'border-neutral-200 bg-neutral-50/70 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">{centre.name}</h3>
                  <div className="text-xs text-neutral-500 font-medium">{centre.district}</div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    centre.is_active
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                  }`}
                >
                  {centre.is_active ? (isHindi ? 'सक्रिय' : 'ACTIVE') : isHindi ? 'निष्क्रिय' : 'INACTIVE'}
                </span>
              </div>

              <div className="flex items-start gap-1.5 text-xs text-neutral-600 mb-3">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <span>{centre.address}</span>
              </div>

              {centre.notes && (
                <div className="text-[11px] bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-neutral-600 mb-3 italic">
                  "{centre.notes}"
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
              <span className="text-neutral-500">
                {centre.active_slots ?? 0} {isHindi ? 'सक्रिय स्लॉट' : 'active slots'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingCentre({ ...centre })}
                  className="px-2.5 py-1 text-xs rounded border border-neutral-300 hover:bg-neutral-50 text-neutral-700 inline-flex items-center gap-1 font-medium"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isHindi ? 'संपादित करें' : 'Edit'}</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(centre)}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                    centre.is_active
                      ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {centre.is_active
                    ? isHindi
                      ? 'निष्क्रिय करें'
                      : 'Deactivate'
                    : isHindi
                    ? 'सक्रिय करें'
                    : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Centre Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 space-y-4 relative">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {isHindi ? 'नया खरीद केंद्र' : 'New Hub'}
              </span>
              <h3 className="font-bold text-lg text-neutral-900 mt-1">
                {isHindi ? 'खरीद केंद्र का विवरण दर्ज करें' : 'Create Procurement Centre'}
              </h3>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'केंद्र का नाम *' : 'Centre Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Karnal Grain Hub"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'जिला / क्षेत्र *' : 'District *'}
                </label>
                <input
                  type="text"
                  required
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  placeholder="e.g. Karnal"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'पूरा पता या लैंडमार्क *' : 'Address / Landmark *'}
                </label>
                <textarea
                  required
                  rows={2}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Near Mandi Gate, GT Road"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'ऑपरेटिंग निर्देश (वैकल्पिक)' : 'Operating Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Open Mon-Sat 8AM-5PM"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="create_is_active"
                  checked={newIsActive}
                  onChange={(e) => setNewIsActive(e.target.checked)}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="create_is_active" className="text-xs text-neutral-700 font-medium">
                  {isHindi ? 'केंद्र को तुरंत सक्रिय रखें' : 'Active immediately'}
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-semibold"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-xs"
                >
                  {formSubmitting
                    ? isHindi
                      ? 'सहेज रहे हैं...'
                      : 'Saving...'
                    : isHindi
                    ? 'केंद्र बनाएं'
                    : 'Create Centre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Centre Modal */}
      {editingCentre && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 space-y-4 relative">
            <button
              onClick={() => setEditingCentre(null)}
              className="absolute right-4 top-4 p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {isHindi ? 'केंद्र संपादन' : 'Edit Centre'}
              </span>
              <h3 className="font-bold text-lg text-neutral-900 mt-1">
                {isHindi ? 'खरीद केंद्र का विवरण बदलें' : 'Update Procurement Centre'}
              </h3>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'केंद्र का नाम *' : 'Centre Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingCentre.name}
                  onChange={(e) => setEditingCentre({ ...editingCentre, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'जिला / क्षेत्र *' : 'District *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingCentre.district}
                  onChange={(e) => setEditingCentre({ ...editingCentre, district: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'पूरा पता या लैंडमार्क *' : 'Address / Landmark *'}
                </label>
                <textarea
                  required
                  rows={2}
                  value={editingCentre.address}
                  onChange={(e) => setEditingCentre({ ...editingCentre, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'ऑपरेटिंग निर्देश' : 'Operating Notes'}
                </label>
                <input
                  type="text"
                  value={editingCentre.notes || ''}
                  onChange={(e) => setEditingCentre({ ...editingCentre, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-slate-700 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={editingCentre.is_active}
                  onChange={(e) => setEditingCentre({ ...editingCentre, is_active: e.target.checked })}
                  className="rounded border-neutral-300 text-slate-800 focus:ring-slate-700"
                />
                <label htmlFor="edit_is_active" className="text-xs text-neutral-700 font-medium">
                  {isHindi ? 'केंद्र सक्रिय है (Active)' : 'Centre is active'}
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCentre(null)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-semibold"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold shadow-xs"
                >
                  {formSubmitting ? (isHindi ? 'सहेज रहे हैं...' : 'Updating...') : isHindi ? 'अद्यतन करें' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
