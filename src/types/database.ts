export type DatabaseBookingStatus =
  | 'scheduled'
  | 'open'
  | 'closed'
  | 'completed'
  | 'cancelled';

export type DatabaseRegistrationStatus = 'confirmed' | 'waitlisted' | 'cancelled';

export type BookingRow = {
  id: string;
  match_date: string;
  max_players: number;
  status: DatabaseBookingStatus;
  opens_at?: string | null;
  closes_at?: string | null;
  created_at?: string | null;
};

export type PublicBookingResult = {
  id: string;
  match_date: string;
  max_players: number;
  status: DatabaseBookingStatus;
  confirmed_count?: number;
  waiting_count?: number;
};
