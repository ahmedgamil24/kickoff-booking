import { useTranslation } from 'react-i18next';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message }: LoadingStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700 dark:border-emerald-700/30 dark:bg-slate-900/70 dark:text-emerald-100">
      {message ?? t('common.loading')}
    </div>
  );
}
