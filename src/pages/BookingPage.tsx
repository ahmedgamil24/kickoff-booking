import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBanner } from '../components/shared/ErrorBanner';
import { LoadingState } from '../components/shared/LoadingState';
import { useBookingFlow } from '../features/booking/hooks/useBookingFlow';
import { getPublicBookingDetails, registerPlayer } from '../features/booking/services/bookingService';
import { MAX_CONFIRMED_PLAYERS, getAvailableSpots } from '../features/booking/utils/bookingRules';
import type { BookingSummary } from '../features/booking/types';

export function BookingPage() {
  const { t } = useTranslation();
  const { state, setFullName, setPhone, setSubmitted } = useBookingFlow();
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadBooking() {
      try {
        setLoading(true);
        setError(null);
        const summary = await getPublicBookingDetails();

        if (isActive) {
          setBooking(summary);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Unable to load booking data.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadBooking();

    return () => {
      isActive = false;
    };
  }, []);

  const confirmedPlayers = booking?.confirmedCount ?? 0;
  const waitingPlayers = booking?.waitingCount ?? 0;
  const availableSpots = getAvailableSpots(
    confirmedPlayers,
    booking?.maxPlayers ?? MAX_CONFIRMED_PLAYERS,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!state.isFormValid) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await registerPlayer({
        fullName: state.fullName.trim(),
        phone: state.phone.trim(),
      });

      setSubmitted(true);
      setSuccessMessage(
        result.status === 'confirmed'
          ? t('booking.successConfirmed')
          : t('booking.successWaiting'),
      );

      const refreshed = await getPublicBookingDetails();
      setBooking(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-6 text-slate-900 dark:text-slate-50">
      <header className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-lg shadow-emerald-200/60 dark:border-emerald-700/40 dark:bg-emerald-950/70 dark:shadow-emerald-950/40">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">{t('header.brand')}</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{t('booking.headerTitle')}</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-emerald-100/85">{t('booking.headerSubtitle')}</p>
      </header>

      {loading ? (
        <LoadingState message={t('booking.loading')} />
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('booking.confirmed')}</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-300">
            {confirmedPlayers} / {booking?.maxPlayers ?? MAX_CONFIRMED_PLAYERS}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('booking.availableSpots')}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{availableSpots}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('booking.waitingList')}</p>
          <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-300">{waitingPlayers}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/30"
        >
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('booking.registerTitle')}</h2>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm text-slate-600 dark:text-slate-300">
                {t('booking.fullName')}
              </label>
              <input
                id="fullName"
                value={state.fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
                placeholder={t('booking.fullNamePlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm text-slate-600 dark:text-slate-300">
                {t('booking.phoneNumber')}
              </label>
              <input
                id="phone"
                value={state.phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
                placeholder={t('booking.phonePlaceholder')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!state.isFormValid || loading || submitting}
            className="mt-6 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
          >
            {submitting ? t('booking.registering') : t('booking.registerNow')}
          </button>

          {error ? <ErrorBanner message={error} /> : null}

          {successMessage ? (
            <p className="mt-4 rounded-xl border border-emerald-700/50 bg-emerald-950/60 p-3 text-sm text-emerald-200">
              {successMessage}
            </p>
          ) : null}
        </form>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('booking.overviewTitle')}</h3>

          <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>• {t('booking.matchDay')}: {t('booking.matchDayValue')}</li>
            <li>• {t('booking.openWindow')}: {t('booking.openWindowValue')}</li>
            <li>• {t('booking.closeWindow')}: {t('booking.closeWindowValue')}</li>
            <li>• {t('booking.capacity')}: {booking?.maxPlayers ?? MAX_CONFIRMED_PLAYERS} {t('booking.capacityValue')}</li>
            <li>• {t('booking.safety')}: {t('booking.safetyValue')}</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
