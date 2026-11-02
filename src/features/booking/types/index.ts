export type BookingStatus = 'scheduled' | 'open' | 'closed' | 'completed' | 'cancelled';
export type RegistrationStatus = 'confirmed' | 'waitlisted' | 'cancelled';

export type BookingSummary = {
  id: string;
  matchDate: string;
  maxPlayers: number;
  status: BookingStatus;
  confirmedCount: number;
  waitingCount: number;
  isOpen: boolean;
};

export type BookingRegistration = {
  id: string;
  bookingId: string;
  playerId: string;
  status: RegistrationStatus;
  createdAt: string;
  cancelledAt: string | null;
};
