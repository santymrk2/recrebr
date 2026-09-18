export type Product = {
  id: string;
  name: string;
  description: string | null;
  price_ars: number | null;
  price_original_ars: number | null;
  image_urls: string[];
  is_bookable: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AvailabilityBlock = {
  id: string;
  product_id: string | null;
  blocked_date: string; // YYYY-MM-DD
  reason: string | null;
  created_at: string;
};

export type BookingStatus = "pendiente" | "confirmada" | "cancelada";

export type BookingRequest = {
  id: string;
  product_id: string;
  requested_date: string; // YYYY-MM-DD
  customer_name: string;
  customer_phone: string;
  event_location: string | null;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};
