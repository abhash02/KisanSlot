import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { apiRequest } from '../../lib/api'
import type { Centre, Slot } from '../../types/procurement'
import {
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  AlertCircle,
  X,
  Edit2,
  Lock,
  Unlock,
  ArrowLeft,
} from 'lucide-react'

export const AdminSlotsPage = () => {
  const { language } = useAuth()
  const isHindi = language === 'hi'

  const [centres, setCentres] = useState<Centre[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedCentreId, setSelectedCentreId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create Slot Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [modalCentreId, setModalCentreId] = useState('')
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0])
  const [modalStartTime, setModalStartTime] = useState('09:00')
  const [modalEndTime, setModalEndTime] = useState('11:00')
  const [modalCapacity, setModalCapacity] = useState('15')
  const [modalNotes, setModalNotes] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Edit Capacity Modal State
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null)
  const [editCapacityVal, setEditCapacityVal] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  // 1. Fetch Centres for dropdown
  useEffect(() => {
    apiRequest<Centre[]>('/admin/centres')
      .then((data) => {
        setCentres(data)
        if (data.length > 0 && !selectedCentreId) {
          // optionally keep empty for all
        }
      })
      .catch((err) => console.error(err))
  }, [])

  // 2. Fetch Slots
  const fetchSlots = async () => {
    setLoading(true)
    setError(null)
    try {
      let queryParams = new URLSearchParams()
      if (selectedCentreId) queryParams.set('centre_id', selectedCentreId)
      if (selectedDate) queryParams.set('date', selectedDate)

      const endpoint = `/admin/slots${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const data = await apiRequest<Slot[]>(endpoint)
      setSlots(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load slots.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots()
  }, [selectedCentreId, selectedDate])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError(null)

    if (!modalCentreId) {
      setModalError(isHindi ? 'कृपया खरीद केंद्र चुनें।' : 'Please select a centre.')
      return
    }

    if (modalStartTime >= modalEndTime) {
      setModalError(isHindi ? 'प्रारंभ समय समाप्ति समय से पहले होना चाहिए।' : 'Start time must precede end time.')
      return
    }

    const cap = parseInt(modalCapacity, 10)
    if (isNaN(cap) || cap <= 0) {
      setModalError(isHindi ? 'कृपया वैध सकारात्मक क्षमता दर्ज करें।' : 'Capacity must be a positive integer.')
      return
    }

    setSubmitting(true)
    try {
      // Append :00 for seconds if not present
      const startTimeFormatted = modalStartTime.length === 5 ? `${modalStartTime}:00` : modalStartTime
      const endTimeFormatted = modalEndTime.length === 5 ? `${modalEndTime}:00` : modalEndTime

      const created = await apiRequest<Slot>('/admin/slots', {
        method: 'POST',
        body: JSON.stringify({
          centre_id: modalCentreId,
          slot_date: modalDate,
          start_time: startTimeFormatted,
          end_time: endTimeFormatted,
          capacity: cap,
          status: 'OPEN',
          notes: modalNotes.trim() || undefined,
        }),
      })

      setSlots((prev) => [created, ...prev])
      setCreateModalOpen(false)
      setModalNotes('')
    } catch (err: any) {
      setModalError(err.message || 'Failed to create slot.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleSlotStatus = async (slot: Slot) => {
    const nextStatus = slot.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    try {
      const updated = await apiRequest<Slot>(`/admin/slots/${slot.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    } catch (err: any) {
      alert(`Error updating slot status: ${err.message}`)
    }
  }

  const handleEditCapacitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSlot) return
    setEditError(null)

    const cap = parseInt(editCapacityVal, 10)
    if (isNaN(cap) || cap <= 0) {
      setEditError('Capacity must be a positive number.')
      return
    }

    if (cap < editingSlot.booked_count) {
      setEditError(
        isHindi
          ? `क्षमता को ${editingSlot.booked_count} से कम नहीं किया जा सकता, क्योंकि पहले से इतने सक्रिय किसान बुक हैं।`
          : `Capacity cannot be reduced below ${editingSlot.booked_count} active bookings.`
      )
      return
    }

    try {
      const updated = await apiRequest<Slot>(`/admin/slots/${editingSlot.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ capacity: cap }),
      })
      setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      setEditingSlot(null)
    } catch (err: any) {
      setEditError(err.message || 'Failed to update capacity.')
    }
  }

  const formatTime = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(':')
      const hour = parseInt(h, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const h12 = hour % 12 || 12
      return `${h12}:${m} ${ampm}`
    } catch {
      return timeStr
    }
  }

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
              {isHindi ? 'स्लॉट एवं क्षमता प्रबंधन' : 'Slot & Capacity Management'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isHindi
                ? 'खरीद केंद्रों के लिए समय स्लॉट बनाएं, क्षमता निर्धारित करें और ओवरलैप को रोकें।'
                : 'Configure procurement time windows, manage maximum farmer limits, and toggle open/closed slots.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSlots}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => {
                setModalError(null)
                if (centres.length > 0 && !modalCentreId) {
                  setModalCentreId(centres[0].id)
                }
                setCreateModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{isHindi ? 'नया स्लॉट बनाएं' : 'Create New Slot'}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{isHindi ? 'केंद्र चुनें:' : 'Centre:'}</span>
            <select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{isHindi ? 'सभी केंद्र (All Centres)' : 'All Centres'}</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.district})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{isHindi ? 'तारीख:' : 'Date:'}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                {isHindi ? 'साफ़ करें' : 'Clear'}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Slots List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((slot) => {
          const isOpen = slot.status === 'OPEN'
          const isFull = slot.remaining_capacity <= 0

          return (
            <div
              key={slot.id}
              className={`bg-white rounded-xl p-5 border shadow-sm flex flex-col justify-between transition-all ${
                isOpen ? 'border-neutral-200' : 'border-neutral-200 bg-neutral-50/70 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-semibold text-neutral-500">{slot.centre_name}</span>
                    <div className="font-bold text-neutral-900 text-sm mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{slot.slot_date}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isOpen
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-300'
                    }`}
                  >
                    {slot.status}
                  </span>
                </div>

                <div className="text-sm font-bold text-neutral-800 flex items-center gap-1.5 my-3">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <span>
                    {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                  </span>
                </div>

                {/* Capacity stats */}
                <div className="space-y-1.5 text-xs text-neutral-600 mb-4 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <div className="flex justify-between">
                    <span>{isHindi ? 'सक्रिय बुकिंग्स:' : 'Booked:'}</span>
                    <strong className="text-neutral-900">
                      {slot.booked_count} {isHindi ? 'किसान' : 'farmers'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{isHindi ? 'शेष खाली स्थान:' : 'Remaining:'}</span>
                    <strong className={slot.remaining_capacity > 0 ? 'text-emerald-700' : 'text-red-600'}>
                      {slot.remaining_capacity} / {slot.capacity}
                    </strong>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className={`h-full ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{
                        width: `${Math.min(100, Math.round((slot.booked_count / slot.capacity) * 100))}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {slot.notes && (
                  <p className="text-[11px] text-neutral-500 italic mb-3">"{slot.notes}"</p>
                )}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setEditingSlot(slot)
                    setEditCapacityVal(slot.capacity.toString())
                    setEditError(null)
                  }}
                  className="px-2.5 py-1 text-xs rounded border border-neutral-300 hover:bg-neutral-50 text-neutral-700 inline-flex items-center gap-1 font-medium"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isHindi ? 'क्षमता बदलें' : 'Capacity'}</span>
                </button>

                <button
                  onClick={() => handleToggleSlotStatus(slot)}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition-colors inline-flex items-center gap-1 ${
                    isOpen
                      ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {isOpen ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  <span>{isOpen ? (isHindi ? 'स्लॉट बंद करें' : 'Close Slot') : isHindi ? 'खोलें' : 'Open Slot'}</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Slot Modal */}
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
                {isHindi ? 'नया समय स्लॉट' : 'New Slot'}
              </span>
              <h3 className="font-bold text-lg text-neutral-900 mt-1">
                {isHindi ? 'स्लॉट विवरण एवं क्षमता निर्धारित करें' : 'Configure Slot & Capacity'}
              </h3>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'खरीद केंद्र चुनें *' : 'Procurement Centre *'}
                </label>
                <select
                  required
                  value={modalCentreId}
                  onChange={(e) => setModalCentreId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
                >
                  <option value="">{isHindi ? '-- केंद्र चुनें --' : '-- Select Centre --'}</option>
                  {centres
                    .filter((c) => c.is_active)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.district})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'तारीख (Date) *' : 'Slot Date *'}
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {isHindi ? 'प्रारंभ समय *' : 'Start Time *'}
                  </label>
                  <input
                    type="time"
                    required
                    value={modalStartTime}
                    onChange={(e) => setModalStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {isHindi ? 'समाप्ति समय *' : 'End Time *'}
                  </label>
                  <input
                    type="time"
                    required
                    value={modalEndTime}
                    onChange={(e) => setModalEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'अधिकतम स्लॉट क्षमता (किसानों की संख्या) *' : 'Capacity (Max Bookings) *'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={modalCapacity}
                  onChange={(e) => setModalCapacity(e.target.value)}
                  placeholder="15"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'निर्देश (वैकल्पिक)' : 'Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="e.g. Dedicated for wheat weighing"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
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
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-xs"
                >
                  {submitting ? (isHindi ? 'बना रहे हैं...' : 'Creating...') : isHindi ? 'स्लॉट जोड़ें' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Capacity Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-neutral-200 space-y-4 relative">
            <button
              onClick={() => setEditingSlot(null)}
              className="absolute right-4 top-4 p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-bold text-base text-neutral-900">
                {isHindi ? 'स्लॉट क्षमता बदलें' : 'Update Slot Capacity'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {editingSlot.centre_name} • {editingSlot.slot_date}
              </p>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditCapacitySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {isHindi ? 'नई क्षमता' : 'New Capacity'}
                </label>
                <input
                  type="number"
                  min={editingSlot.booked_count}
                  required
                  value={editCapacityVal}
                  onChange={(e) => setEditCapacityVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-slate-700"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  {isHindi
                    ? `वर्तमान सक्रिय बुकिंग्स: ${editingSlot.booked_count}`
                    : `Active bookings in this slot: ${editingSlot.booked_count}`}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-semibold"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold"
                >
                  {isHindi ? 'सहेजें' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
