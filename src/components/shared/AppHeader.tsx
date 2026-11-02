import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

type ThemeMode = 'light' | 'dark';
type LanguageMode = 'en' | 'ar';

export function AppHeader() {
  const { i18n, t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const savedTheme = window.localStorage.getItem('kickoff-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [language, setLanguage] = useState<LanguageMode>(() => {
    if (typeof window === 'undefined') {
      return 'en';
    }

    const savedLanguage = window.localStorage.getItem('kickoff-language');
    return savedLanguage === 'ar' ? 'ar' : 'en';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    window.localStorage.setItem('kickoff-theme', theme);
    window.localStorage.setItem('kickoff-language', language);
  }, [theme, language]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [i18n, language]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={[
        'sticky top-0 z-40 border-b transition-all duration-300 ease-out',
        isScrolled
          ? 'border-slate-200/70 bg-white/60 shadow-sm backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/65'
          : 'border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80',
      ].join(' ')}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-base font-bold text-white shadow-sm shadow-emerald-500/30">
            K
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">{t('header.brand')}</p>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white">{t('header.title')}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="cursor-pointer"
            variant="outline"
            size="icon"
            onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
            aria-label={t('header.toggleTheme')}
            title={theme === 'dark' ? t('header.lightMode') : t('header.darkMode')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage((currentLanguage) => (currentLanguage === 'en' ? 'ar' : 'en'))}
            aria-label={t('header.toggleLanguage')}
            className="gap-2 px-3 cursor-pointer py-3.75"
          >
            {/* <Globe2 className="h-4 w-4" /> */}
            <span>{language === 'en' ? 'ع / EN' : 'EN / ع'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
