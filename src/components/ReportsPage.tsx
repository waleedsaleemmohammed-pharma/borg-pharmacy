import { useState, useEffect } from 'react';
import { getCompanies, getVisits, getAllScheduledCompanyNames } from '@/store/pharmacyStore';
import { Company, Visit } from '@/types/pharmacy';
import { BarChart3, Building2, Users, CalendarCheck, AlertTriangle, CheckCircle, XCircle, FileDown, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToPDF, downloadAsHTML } from '@/utils/pdfExport';

const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [companies, setCompanies] = useState<Company[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    setCompanies(getCompanies());
    setVisits(getVisits().filter(v => v.month === month && v.year === year));
  }, [month, year]);

  const totalReps = companies.reduce((sum, c) => sum + c.representatives.length, 0);
  const totalVisits = visits.length;
  const uniqueCompaniesVisited = new Set(visits.map(v => v.companyName)).size;

  const allScheduledCompanies = getAllScheduledCompanyNames();
  const companiesWithVisits = new Set(visits.map(v => v.companyName));
  const companiesWithoutVisits = allScheduledCompanies.filter(c => !companiesWithVisits.has(c));

  const weekBreakdown = [1, 2, 3, 4].map(w => ({
    week: w,
    visits: visits.filter(v => v.weekNumber === w).length,
    companies: new Set(visits.filter(v => v.weekNumber === w).map(v => v.companyName)).size,
  }));

  function handleDownloadPDF() {
    exportToPDF('reports-print-area', `تقرير_${MONTH_NAMES[month]}_${year}`);
  }

  function handleDownloadHTML() {
    downloadAsHTML('reports-print-area', `تقرير_${MONTH_NAMES[month]}_${year}`);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 no-print">
        <div className="flex gap-2 flex-1">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="rounded-lg border bg-card px-3 py-2 text-sm font-bold text-foreground flex-1 sm:flex-none"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="rounded-lg border bg-card px-3 py-2 text-sm font-bold text-foreground"
          >
            {[2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="gap-1.5 font-black flex-1 sm:flex-none text-xs sm:text-sm">
            <FileDown className="w-3.5 h-3.5" />
            PDF
          </Button>
          <Button onClick={handleDownloadHTML} variant="outline" size="sm" className="gap-1.5 font-black flex-1 sm:flex-none text-xs sm:text-sm">
            <FileCode className="w-3.5 h-3.5" />
            HTML
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Building2} label="إجمالي الشركات" value={companies.length} color="primary" />
        <StatCard icon={Users} label="إجمالي المناديب" value={totalReps} color="accent" />
        <StatCard icon={CalendarCheck} label="زيارات هذا الشهر" value={totalVisits} color="success" />
        <StatCard icon={CheckCircle} label="شركات زارت" value={uniqueCompaniesVisited} color="info" />
      </div>

      <div className="bg-card border rounded-xl p-4 sm:p-5">
        <h3 className="font-black text-sm mb-3 flex items-center gap-2 text-foreground">
          <BarChart3 className="w-4 h-4 text-primary" />
          ملخص أسبوعي
        </h3>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {weekBreakdown.map(w => (
            <div key={w.week} className="bg-muted/50 rounded-lg p-2 sm:p-3 text-center">
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground">أسبوع {w.week}</p>
              <p className="text-lg sm:text-xl font-black text-foreground">{w.visits}</p>
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground">{w.companies} شركة</p>
            </div>
          ))}
        </div>
      </div>

      {visits.length > 0 && (
        <div className="bg-card border rounded-xl p-4 sm:p-5">
          <h3 className="font-black text-sm mb-3 flex items-center gap-2 text-foreground">
            <CheckCircle className="w-4 h-4 text-success" />
            المناديب الذين حضروا ({visits.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {visits.map(v => (
              <div key={v.id} className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-green-50 rounded-lg px-2 sm:px-3 py-2 border border-green-200">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span className="font-black text-foreground">{v.representativeName}</span>
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">- {v.companyName}</span>
                <span className="mr-auto text-[10px] sm:text-xs font-bold text-muted-foreground">{v.day} ({v.shift})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {companiesWithoutVisits.length > 0 && (
        <div className="bg-card border border-warning/30 rounded-xl p-4 sm:p-5">
          <h3 className="font-black text-sm mb-3 text-warning flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            شركات لم تزر هذا الشهر ({companiesWithoutVisits.length})
          </h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {companiesWithoutVisits.slice(0, 30).map(c => (
              <span key={c} className="text-[10px] sm:text-xs font-bold bg-warning/10 text-warning-foreground px-2 sm:px-3 py-1 rounded-full">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {companies.filter(c => c.representatives.length === 0).length > 0 && (
        <div className="bg-card border border-destructive/30 rounded-xl p-4 sm:p-5">
          <h3 className="font-black text-sm mb-3 text-destructive flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            شركات بدون مناديب مسجلين
          </h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {companies.filter(c => c.representatives.length === 0).slice(0, 20).map(c => (
              <span key={c.id} className="text-[10px] sm:text-xs font-bold bg-destructive/10 text-destructive px-2 sm:px-3 py-1 rounded-full">
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div id="reports-print-area" className="hidden">
        <div className="header">
          <h1>مستشفى برج الأطباء - إدارة الصيدلية</h1>
          <p>تقرير زيارات شهر {MONTH_NAMES[month]} {year}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <div className="stat-card">
            <div className="stat-value">{companies.length}</div>
            <div className="stat-label">إجمالي الشركات</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalReps}</div>
            <div className="stat-label">إجمالي المناديب</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalVisits}</div>
            <div className="stat-label">زيارات هذا الشهر</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{uniqueCompaniesVisited}</div>
            <div className="stat-label">شركات زارت</div>
          </div>
        </div>

        {visits.length > 0 && (
          <>
            <h3 style={{ fontWeight: 900, fontSize: '14px', marginBottom: '8px' }}>المناديب الذين حضروا ({visits.length})</h3>
            <table>
              <thead>
                <tr>
                  <th>المندوب</th>
                  <th>الشركة</th>
                  <th>اليوم</th>
                  <th>الفترة</th>
                  <th>الأسبوع</th>
                </tr>
              </thead>
              <tbody>
                {visits.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 900 }}>{v.representativeName}</td>
                    <td style={{ fontWeight: 700 }}>{v.companyName}</td>
                    <td>{v.day}</td>
                    <td>{v.shift}</td>
                    <td>الأسبوع {v.weekNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {companiesWithoutVisits.length > 0 && (
          <>
            <h3 style={{ fontWeight: 900, fontSize: '14px', margin: '15px 0 8px', color: '#b45309' }}>
              شركات لم تزر هذا الشهر ({companiesWithoutVisits.length})
            </h3>
            <div style={{ fontSize: '10px', lineHeight: '1.8' }}>
              {companiesWithoutVisits.join(' • ')}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'info';
}) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
  };

  return (
    <div className="bg-card border rounded-xl p-3 sm:p-4">
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${colorMap[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl sm:text-2xl font-black text-foreground">{value}</p>
      <p className="text-[10px] sm:text-xs font-bold text-muted-foreground">{label}</p>
    </div>
  );
}
