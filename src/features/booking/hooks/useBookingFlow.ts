import { useMemo, useState } from 'react';

export type BookingFlowState = {
  fullName: string;
  phone: string;
  isFormValid: boolean;
  submitted: boolean;
};

export function useBookingFlow() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isFormValid = useMemo(
    () => fullName.trim().length >= 2 && phone.trim().length >= 7,
    [fullName, phone],
  );

  const state: BookingFlowState = {
    fullName,
    phone,
    isFormValid,
    submitted,
  };

  return {
    state,
    setFullName,
    setPhone,
    setSubmitted,
  };
}
