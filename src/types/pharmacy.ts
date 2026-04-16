export type DayOfWeek = 'السبت' | 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء';
export type Shift = 'صباحية' | 'مسائية';

export interface Representative {
  id: string;
  name: string;
  phone?: string;
}

export type CompanyRating = 'A' | 'B' | 'C';

export interface Company {
  id: string;
  name: string;
  rating?: CompanyRating;
  representatives: Representative[];
  createdAt: string;
}

export interface Visit {
  id: string;
  companyName: string;
  representativeName: string;
  representativeId: string;
  day: DayOfWeek;
  shift: Shift;
  date: string;
  weekNumber: number;
  month: number;
  year: number;
  printed: boolean;
  printCount?: number;
}

export const DAYS: DayOfWeek[] = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'];
export const SHIFTS: Shift[] = ['صباحية', 'مسائية'];

export function getDayName(jsDay: number): DayOfWeek | null {
  const map: Record<number, DayOfWeek> = {
    0: 'الأحد',
    1: 'الإثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    6: 'السبت',
  };
  return map[jsDay] || null;
}

export function getWeekOfMonth(date: Date): number {
  const d = date.getDate();
  return Math.min(Math.ceil(d / 7), 4);
}
