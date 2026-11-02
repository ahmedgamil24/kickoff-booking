import { supabase } from '../../../lib/supabase';
import type { BookingRow, PublicBookingResult } from '../../../types/database';
import type { BookingRegistration, BookingSummary } from '../types';
import { MAX_CONFIRMED_PLAYERS, getAvailableSpots } from '../utils/bookingRules';

export type RegistrationRequest = {
  fullName: string;
  phone: string;
};

export type RegistrationResult = {
  registration: BookingRegistration;
  status: 'confirmed' | 'waitlisted';
  cancellationToken: string;
};

const defaultSummary: BookingSummary = {
  id: 'booking-draft',
  matchDate: '2026-10-30',
  maxPlayers: MAX_CONFIRMED_PLAYERS,
  status: 'scheduled',
  confirmedCount: 0,
  waitingCount: 0,
  isOpen: false,
};

function toBookingSummary(row: Partial<PublicBookingResult> | BookingRow | null | undefined): BookingSummary {
  const normalizedRow = row as Partial<PublicBookingResult & BookingRow> | null | undefined;
  const matchDate = normalizedRow?.match_date ?? defaultSummary.matchDate;
  const status = normalizedRow?.status ?? defaultSummary.status;

  return {
    id: normalizedRow?.id ?? defaultSummary.id,
    matchDate,
    maxPlayers: normalizedRow?.max_players ?? defaultSummary.maxPlayers,
    status,
    confirmedCount: normalizedRow?.confirmed_count ?? defaultSummary.confirmedCount,
    waitingCount: normalizedRow?.waiting_count ?? defaultSummary.waitingCount,
    isOpen: status === 'open',
  };
}

export async function getPublicBookingDetails(): Promise<BookingSummary> {
  const { data, error } = await supabase.rpc('get_public_booking_details');

  if (!error && data) {
    const payload = Array.isArray(data) ? data[0] : data;
    return toBookingSummary(payload as Partial<PublicBookingResult> | null);
  }

  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .select('id, match_date, max_players, status')
    .limit(1);

  if (bookingError) {
    throw new Error(bookingError.message);
  }

  const bookingRow = bookingData?.[0] ?? null;
  return toBookingSummary(bookingRow as BookingRow | null);
}

export async function registerPlayer(request: RegistrationRequest): Promise<RegistrationResult> {
  const { data, error } = await supabase.rpc('register_player', {
    full_name: request.fullName,
    phone_number: request.phone,
  });

  if (error) {
    throw new Error(error.message);
  }

  const status = data?.status ?? 'confirmed';

  return {
    registration: {
      id: data?.registration_id ?? 'draft-registration',
      bookingId: data?.booking_id ?? 'draft-booking',
      playerId: data?.player_id ?? 'draft-player',
      status,
      createdAt: new Date().toISOString(),
      cancelledAt: null,
    },
    status,
    cancellationToken: data?.cancellation_token ?? 'draft-token',
  };
}

export async function cancelRegistration(registrationId: string, token: string): Promise<boolean> {
  const { error } = await supabase.rpc('cancel_registration', {
    registration_id: registrationId,
    cancellation_token: token,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export function computeBookingAvailability(confirmedCount: number) {
  return {
    confirmedCount,
    waitingCount: 0,
    availableSpots: getAvailableSpots(confirmedCount),
    capReached: confirmedCount >= MAX_CONFIRMED_PLAYERS,
  };
}
