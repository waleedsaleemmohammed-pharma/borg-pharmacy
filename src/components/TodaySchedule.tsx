import { useState } from 'react';
import { getDayName, getWeekOfMonth, type DayOfWeek, type Shift } from '@/types/pharmacy';
import { getScheduleForWeek, getCompanyByName } from '@/store/pharmacyStore';
import { type ScheduleGroup } from '@/data/fixedSchedule';
import { Sun, Moon, Building2, Users, ChevronLeft, CalendarIcon } from 'lucide-react';
import CompanyRepsPage from './CompanyRepsPage';

export default function TodaySchedule() {
  const today = new Date();
  const dayName = getDayName(today.getDay());
  const weekNum = getWeekOfMonth(today);
  const [selectedCompany, setSelectedCompany] = useState<{ name: string; day: DayOfWeek; shift: Shift } | null>(null);

  const dateStr = today.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (selectedCompany && dayName) {
    return (
      <CompanyRepsPage
        companyName={selectedCompany.name}
        day={selectedCompany.day}
        shift={selectedCompany.shift}
        weekNumber={weekNum}
        selectedDate={today}
        onBack={() => setSelectedCompany(null)}
      />
    );
  }

  if (!dayName) {
    return (
      <div className="space-y-5 animate-fade-in">
        <DateHeader dateStr={dateStr} weekNum={weekNum} dayName={null} />
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-6">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2">لا توجد زيارات في هذا اليوم</h2>
          <p className="text-sm font-bold text-muted-foreground">يوم عطلة - الزيارات من السبت إلى الأربعاء</p>
        </div>
      </div>
    );
  }

  const schedule = getScheduleForWeek(weekNum);
  const todayMorning = schedule.filter(g => g.day === dayName && g.shift === 'صباحية');
  const todayEvening = schedule.filter(g => g.day === dayName && g.shift === 'مسائية');

  return (
    <div className="space-y-5 animate-fade-in">
      <DateHeader dateStr={dateStr} weekNum={weekNum} dayName={dayName} />

      <ShiftSection
        title="الفترة الصباحية"
        icon={<Sun className="w-5 h-5" />}
        groups={todayMorning}
        onSelectCompany={(name) => setSelectedCompany({ name, day: dayName, shift: 'صباحية' })}
        colorClass="bg-morning/10 border-morning/30"
        headerClass="bg-morning/20 text-morning-foreground"
      />

      <ShiftSection
        title="الفترة المسائية"
        icon={<Moon className="w-5 h-5" />}
        groups={todayEvening}
        onSelectCompany={(name) => setSelectedCompany({ name, day: dayName, shift: 'مسائية' })}
        colorClass="bg-evening/10 border-evening/30"
        headerClass="bg-evening/20 text-evening-foreground"
      />
    </div>
  );
}

function DateHeader({ dateStr, weekNum, dayName }: {
  dateStr: string;
  weekNum: number;
  dayName: string | null;
}) {
  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-black text-foreground">{dayName || 'يوم عطلة'}</h2>
          </div>
          <p className="text-sm font-bold text-muted-foreground mt-0.5">{dateStr}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="bg-primary/10 rounded-lg px-3 py-1.5">
            <span className="text-sm font-black text-primary">الأسبوع {weekNum}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShiftSection({
  title, icon, groups, onSelectCompany, colorClass, headerClass,
}: {
  title: string;
  icon: React.ReactNode;
  groups: ScheduleGroup[];
  onSelectCompany: (name: string) => void;
  colorClass: string;
  headerClass: string;
}) {
  const allCompanies = groups.flatMap(g => g.companies);

  return (
    <div className={`border rounded-xl overflow-hidden ${colorClass}`}>
      <div className={`px-4 py-3 flex items-center gap-2 ${headerClass}`}>
        {icon}
        <h3 className="font-black text-base">{title}</h3>
        <span className="mr-auto text-sm font-bold opacity-70">{allCompanies.length} شركة</span>
      </div>
      <div className="p-2 sm:p-3 space-y-2">
        {allCompanies.map((companyName, i) => {
          const company = getCompanyByName(companyName);
          const isARated = company?.rating === 'A';
          const repCount = company?.representatives.length || 0;

          return (
            <button
              key={i}
              onClick={() => onSelectCompany(companyName)}
              className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border transition-all active:scale-[0.98] ${
                isARated
                  ? 'bg-ratinga-soft border-ratinga-border hover:bg-ratinga-soft/80'
                  : 'bg-card border-border hover:bg-muted/60'
              }`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isARated ? 'bg-ratinga text-primary-foreground' : 'bg-primary/10 text-primary'
              }`}>
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="flex-1 text-right min-w-0">
                <p className={`text-xs sm:text-sm font-black truncate ${isARated ? 'text-ratinga-foreground' : 'text-foreground'}`}>
                  {companyName}
                </p>
                <p className="text-[10px] sm:text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {repCount > 0 ? `${repCount} مندوب` : 'لا يوجد مناديب'}
                </p>
              </div>
              <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
