import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

export type AppRouteConfig = {
  path: string;
  label: string;
  element: ReactNode;
};

export function AppRouter({ routes }: { routes: AppRouteConfig[] }) {
  return (
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
