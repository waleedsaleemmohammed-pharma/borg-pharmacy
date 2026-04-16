import { useState } from 'react';
import { DAYS, SHIFTS, type DayOfWeek, type Shift } from '@/types/pharmacy';
import { getScheduleForWeek, getCompanyByName } from '@/store/pharmacyStore';
import { Button } from '@/components/ui/button';
import { FileDown, FileCode } from 'lucide-react';
import { exportToPDF, downloadAsHTML } from '@/utils/pdfExport';

export default function SchedulePage() {
  const [week, setWeek] = useState(1);
  const schedule = getScheduleForWeek(week);

  function getCompaniesForCell(day: DayOfWeek, shift: Shift): string[] {
    return schedule.filter(g => g.day === day && g.shift === shift).flatMap(g => g.companies);
  }

  function isARated(name: string): boolean {
    const company = getCompanyByName(name);
    return company?.rating === 'A';
  }

  function handleDownloadPDF() {
    exportToPDF('schedule-print-area', `جدول_الأسبوع_${week}`);
  }

  function handleDownloadHTML() {
    downloadAsHTML('schedule-print-area', `جدول_الأسبوع_${week}`);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex gap-1 bg-card rounded-lg border p-1 flex-1">
          {[1, 2, 3, 4].map(w => (
            <button
              key={w}
              onClick={() => setWeek(w)}
              className={`flex-1 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-black transition-colors ${
                week === w ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
              }`}
            >
              أسبوع {w}
            </button>
          ))}
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


      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-black">اليوم</th>
                <th className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-black">الفترة الصباحية</th>
                <th className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-black">الفترة المسائية</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, i) => (
                <tr key={day} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                  <td className="px-2 sm:px-4 py-4 font-black text-xs sm:text-sm text-foreground border-l min-w-[60px] sm:min-w-[80px]">{day}</td>
                  {SHIFTS.map(shift => {
                    const companies = getCompaniesForCell(day, shift);
                    return (
                      <td key={shift} className="px-2 sm:px-4 py-3 border-l">
                        <div className="space-y-1">
                          {companies.map((name, ci) => (
                            <div
                              key={ci}
                              className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-black ${
                                isARated(name)
                                  ? 'bg-ratinga-soft border border-ratinga-border text-ratinga-foreground'
                                  : 'bg-muted/50 border text-foreground'
                              }`}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="schedule-print-area" className="hidden">
        <div className="header">
          <h1>مستشفى برج الأطباء - إدارة الصيدلية</h1>
          <p>جدول زيارات شركات الأدوية - الأسبوع {week}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>اليوم</th>
              <th>الفترة الصباحية</th>
              <th>الفترة المسائية</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td style={{ fontWeight: 900, fontSize: '12px' }}>{day}</td>
                {SHIFTS.map(shift => {
                  const companies = getCompaniesForCell(day, shift);
                  return (
                    <td key={shift}>
                      {companies.map((name, ci) => (
                        <div key={ci} className={`company-tag ${isARated(name) ? 'company-main' : 'company-normal'}`}>
                          {name}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
