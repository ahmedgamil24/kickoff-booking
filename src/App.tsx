import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router/AppRouter';
import { AppHeader } from './components/shared/AppHeader';
import { AdminPage } from './pages/AdminPage';
import { BookingPage } from './pages/BookingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { appRoutes } from './routes/routes';

const routes = [
  {
    path: appRoutes.booking,
    label: 'Booking',
    element: <BookingPage />,
  },
  {
    path: appRoutes.admin,
    label: 'Admin',
    element: <AdminPage />,
  },
  {
    path: appRoutes.notFound,
    label: 'Not Found',
    element: <NotFoundPage />,
  },
];

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50">
      <AppHeader />
      <AppProviders>
        <BrowserRouter>
          <AppRouter routes={routes} />
        </BrowserRouter>
      </AppProviders>
    </div>
  );
}

export default App;
