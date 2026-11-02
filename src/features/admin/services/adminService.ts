import { supabase } from '../../../lib/supabase';
import type { AdminBooking, BookingStats } from '../types';

type AdminBookingRow = {
  id: string;
  match_date: string;
  status: string;
  max_players: number;
};

export async function getAdminBookings(): Promise<AdminBooking[]> {
  const { data, error } = await supabase.rpc('get_admin_bookings');

  if (error) {
    throw new Error(error.message);
  }

  return (data as AdminBookingRow[] | null ?? []).map((row) => ({
    id: row.id,
    matchDate: row.match_date,
    status: row.status,
    maxPlayers: row.max_players,
  }));
}

export async function getAdminStats(): Promise<BookingStats> {
  const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

  if (error) {
    throw new Error(error.message);
  }

  const stats = data?.[0] ?? null;

  return {
    totalBookings: Number(stats?.total_bookings ?? 0),
    upcomingBookings: Number(stats?.upcoming_bookings ?? 0),
    confirmedPlayers: Number(stats?.confirmed_players ?? 0),
    waitingPlayers: Number(stats?.waiting_players ?? 0),
  };
}
