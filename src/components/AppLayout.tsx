import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Building2, BarChart3, Menu, X, Home, Settings, Star } from 'lucide-react';
import { LOGO_BASE64 } from '@/data/logoBase64';

type Page = 'today' | 'schedule' | 'companies' | 'ratings' | 'reports' | 'settings';

interface AppLayoutProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  children: React.ReactNode;
}

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'today', label: 'جدول اليوم', icon: Home },
  { id: 'schedule', label: 'الجدول الكامل', icon: Calendar },
  { id: 'companies', label: 'الشركات والمناديب', icon: Building2 },
  { id: 'ratings', label: 'تقييم الشركات', icon: Star },
  { id: 'reports', label: 'التقارير', icon: BarChart3 },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export default function AppLayout({ currentPage, onPageChange, children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <img src={LOGO_BASE64} alt="برج الأطباء" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <h1 className="font-black text-lg leading-tight">برج الأطباء</h1>
              <p className="text-xs font-bold opacity-80">إدارة الصيدلية</p>
            </div>
            <button className="lg:hidden mr-auto" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { onPageChange(item.id); setSidebarOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-black transition-colors',
                  currentPage === item.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/80'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 mx-3 mb-3 rounded-lg bg-sidebar-accent/30 text-xs font-bold opacity-80">
            نظام إدارة زيارات مندوبي الأدوية
          </div>
        </div>
      </aside>

      <main className="flex-1 min-h-screen">
        <header className="bg-card border-b px-4 py-3 flex items-center gap-3 no-print">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <img src={LOGO_BASE64} alt="برج الأطباء" className="w-8 h-8 rounded-full object-cover" />
          <h2 className="text-lg font-black text-foreground">
            {navItems.find(n => n.id === currentPage)?.label}
          </h2>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
