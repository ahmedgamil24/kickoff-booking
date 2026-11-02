import { useTranslation } from 'react-i18next';

type ErrorBannerProps = {
  message?: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700/40 dark:bg-red-950/60 dark:text-red-100">
      {message ?? t('common.somethingWentWrong')}
    </div>
  );
}
