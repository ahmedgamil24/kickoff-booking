import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBanner } from '../components/shared/ErrorBanner';
import { LoadingState } from '../components/shared/LoadingState';
import { getAdminBookings, getAdminStats } from '../features/admin/services/adminService';
import { signInAdmin, signOutAdmin, getCurrentSession } from '../features/admin/services/authService';
import type { AdminBooking, BookingStats } from '../features/admin/types';
import { supabase } from '../lib/supabase';

const defaultStats: BookingStats = {
  totalBookings: 0,
  upcomingBookings: 0,
  confirmedPlayers: 0,
  waitingPlayers: 0,
};

export function AdminPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Awaited<ReturnType<typeof getCurrentSession>>>(null);
  const [stats, setStats] = useState<BookingStats>(defaultStats);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        setLoading(true);
        const currentSession = await getCurrentSession();

        if (mounted) {
          setSession(currentSession);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to read admin session.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    let mounted = true;

    async function loadDashboardData() {
      try {
        setLoadingData(true);
        setError(null);

        const [nextBookings, nextStats] = await Promise.all([getAdminBookings(), getAdminStats()]);

        if (mounted) {
          setBookings(nextBookings);
          setStats(nextStats);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unable to load dashboard data.');
        }
      } finally {
        if (mounted) {
          setLoadingData(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, [session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const data = await signInAdmin(email, password);
      setSession(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);

    try {
      await signOutAdmin();
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign out.');
    }
  };

  if (loading) {
    return <LoadingState message={t('admin.checkingSession')} />;
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center p-6">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/30">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('admin.signInTitle')}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('admin.signInSubtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm text-slate-600 dark:text-slate-300">{t('admin.email')}</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('admin.emailPlaceholder')}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm text-slate-600 dark:text-slate-300">{t('admin.password')}</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('admin.passwordPlaceholder')}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
                required
              />
            </div>

            {error ? <ErrorBanner message={error} /> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
            >
              {submitting ? t('admin.signingIn') : t('admin.signIn')}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6 text-slate-900 dark:text-slate-100">
      <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">{t('header.brand')}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{t('admin.dashboardTitle')}</h1>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
        >
          {t('admin.signOut')}
        </button>
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      {loadingData ? <LoadingState message={t('admin.loadingData')} /> : null}

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.upcomingBookings')}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats.upcomingBookings}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.confirmedPlayers')}</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-300">{stats.confirmedPlayers}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.waitingList')}</p>
          <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-300">{stats.waitingPlayers}</p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('admin.bookingsTitle')}</h2>

        {bookings.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t('admin.noBookings')}</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700 dark:divide-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <tr>
                  <th className="px-4 py-3">{t('admin.matchDate')}</th>
                  <th className="px-4 py-3">{t('admin.status')}</th>
                  <th className="px-4 py-3">{t('admin.maxPlayers')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3">{booking.matchDate}</td>
                    <td className="px-4 py-3">{booking.status}</td>
                    <td className="px-4 py-3">{booking.maxPlayers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
