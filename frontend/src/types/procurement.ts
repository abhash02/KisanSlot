export interface Centre {
  id: string
  name: string
  district: string
  address: string
  notes?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  total_slots?: number
  active_slots?: number
}

export interface Slot {
  id: string
  centre_id: string
  centre_name?: string
  district?: string
  slot_date: string
  start_time: string
  end_time: string
  capacity: number
  booked_count: number
  remaining_capacity: number
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface BookingStatusHistory {
  id: string
  old_status?: string | null
  new_status: string
  note?: string | null
  actor_name?: string | null
  actor_role?: string | null
  created_at: string
}

export interface Booking {
  id: string
  public_token: string
  farmer_id: string
  farmer_name: string
  farmer_mobile: string
  farmer_village?: string | null
  slot_id: string
  centre_id: string
  centre_name: string
  centre_district: string
  centre_address: string
  slot_date: string
  start_time: string
  end_time: string
  produce_type: string
  quantity: number
  quantity_unit: string
  status: 'BOOKED' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'
  queue_number?: number | null
  created_at: string
  updated_at: string
  status_history: BookingStatusHistory[]
}

export interface BookingListResponse {
  items: Booking[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export const PRODUCE_OPTIONS = [
  { value: 'Wheat', label_en: 'Wheat', label_hi: 'गेहूं' },
  { value: 'Rice/Paddy', label_en: 'Rice / Paddy', label_hi: 'धान / चावल' },
  { value: 'Maize', label_en: 'Maize', label_hi: 'मक्का' },
  { value: 'Mustard', label_en: 'Mustard', label_hi: 'सरसों' },
  { value: 'Potato', label_en: 'Potato', label_hi: 'आलू' },
  { value: 'Other', label_en: 'Other Produce', label_hi: 'अन्य उपज' },
]

export const STATUS_LABELS: Record<string, { en: string; hi: string; color: string; bg: string }> = {
  BOOKED: { en: 'Booked', hi: 'बुकिंग हो गई', color: 'text-blue-800', bg: 'bg-blue-100 border-blue-200' },
  ARRIVED: { en: 'Arrived', hi: 'केंद्र पर उपस्थित', color: 'text-amber-800', bg: 'bg-amber-100 border-amber-200' },
  IN_SERVICE: { en: 'In Service', hi: 'प्रक्रिया जारी है', color: 'text-purple-800', bg: 'bg-purple-100 border-purple-200' },
  COMPLETED: { en: 'Completed', hi: 'खरीद पूरी हुई', color: 'text-emerald-800', bg: 'bg-emerald-100 border-emerald-200' },
  CANCELLED: { en: 'Cancelled', hi: 'रद्द', color: 'text-neutral-700', bg: 'bg-neutral-200 border-neutral-300' },
  REJECTED: { en: 'Rejected', hi: 'अस्वीकृत', color: 'text-red-800', bg: 'bg-red-100 border-red-200' },
}

