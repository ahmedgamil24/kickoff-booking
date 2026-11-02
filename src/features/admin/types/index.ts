export type AdminBooking = {
  id: string;
  matchDate: string;
  status: string;
  maxPlayers: number;
};

export type BookingStats = {
  totalBookings: number;
  upcomingBookings: number;
  confirmedPlayers: number;
  waitingPlayers: number;
};
