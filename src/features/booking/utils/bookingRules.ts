import type { BookingSummary, BookingStatus, RegistrationStatus } from '../types';

export const MAX_CONFIRMED_PLAYERS = 12;
export const BOOKING_TIMEZONE = 'Africa/Cairo';

export function getRegistrationPriority(index: number, capacity = MAX_CONFIRMED_PLAYERS): RegistrationStatus {
  return index < capacity ? 'confirmed' : 'waitlisted';
}

export function getAvailableSpots(confirmedCount: number, capacity = MAX_CONFIRMED_PLAYERS) {
  return Math.max(capacity - confirmedCount, 0);
}

export function getBookingStatusLabel(status: BookingStatus): string {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'open':
      return 'Open';
    case 'closed':
      return 'Closed';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

export function createBookingSummary(overrides: Partial<BookingSummary> = {}): BookingSummary {
  return {
    id: 'draft-booking',
    matchDate: new Date().toISOString(),
    maxPlayers: MAX_CONFIRMED_PLAYERS,
    status: 'scheduled',
    confirmedCount: 0,
    waitingCount: 0,
    isOpen: false,
    ...overrides,
  };
}
