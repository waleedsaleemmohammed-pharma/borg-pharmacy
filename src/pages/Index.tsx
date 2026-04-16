import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import TodaySchedule from '@/components/TodaySchedule';
import SchedulePage from '@/components/SchedulePage';
import CompaniesPage from '@/components/CompaniesPage';
import CompanyRatingPage from '@/components/CompanyRatingPage';
import ReportsPage from '@/components/ReportsPage';
import SettingsPage from '@/components/SettingsPage';
import { seedInitialData, restoreFromTelegram, getTelegramConfig } from '@/store/pharmacyStore';

type Page = 'today' | 'schedule' | 'companies' | 'ratings' | 'reports' | 'settings';

export default function Index() {
  const [currentPage, setCurrentPage] = useState<Page>('today');
  const syncedRef = useRef(false);

  useEffect(() => {
    seedInitialData();
    if (!syncedRef.current) {
      syncedRef.current = true;
      const config = getTelegramConfig();
      if (config) {
        restoreFromTelegram().then(success => {
          if (success) {
            console.log('تم المزامنة التلقائية من تلجرام');
            window.dispatchEvent(new Event('telegram-sync-complete'));
          }
        }).catch(() => {});
      }
    }
  }, []);

  return (
    <AppLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {currentPage === 'today' && <TodaySchedule />}
      {currentPage === 'schedule' && <SchedulePage />}
      {currentPage === 'companies' && <CompaniesPage />}
      {currentPage === 'ratings' && <CompanyRatingPage />}
      {currentPage === 'reports' && <ReportsPage />}
      {currentPage === 'settings' && <SettingsPage />}
    </AppLayout>
  );
}
