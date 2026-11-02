import type { Player, PlayerRegistrationInput } from '../types';

export async function normalizePhoneNumber(phone: string): Promise<string> {
  return phone.replace(/\s+/g, '').trim();
}

export async function createPlayer(_input: PlayerRegistrationInput): Promise<Player> {
  return {
    id: 'draft-player',
    fullName: _input.fullName,
    phone: await normalizePhoneNumber(_input.phone),
    createdAt: new Date().toISOString(),
  };
}
