import { Company, CompanyRating, Representative, Visit, DayOfWeek, Shift, DAYS, SHIFTS } from '@/types/pharmacy';
import { WEEK1_SCHEDULE, WEEK2_SCHEDULE, WEEK3_SCHEDULE, WEEK4_SCHEDULE, ScheduleGroup, COMPANY_RATINGS } from '@/data/fixedSchedule';

const STORAGE_KEYS = {
  companies: 'pharmacy_companies',
  visits: 'pharmacy_visits',
  telegramConfig: 'pharmacy_telegram_config',
  schedule: 'pharmacy_schedule',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// ---- Schedule (stored in localStorage, initialized from fixedSchedule) ----
interface StoredSchedule {
  week1: ScheduleGroup[];
  week2: ScheduleGroup[];
  week3: ScheduleGroup[];
  week4: ScheduleGroup[];
}

function migrateSchedule(data: any): StoredSchedule {
  if (data.week3 && data.week4) return data;
  return {
    week1: data.week1,
    week2: data.week2,
    week3: JSON.parse(JSON.stringify(data.week1)),
    week4: JSON.parse(JSON.stringify(data.week2)),
  };
}

function getStoredSchedule(): StoredSchedule {
  const data = localStorage.getItem(STORAGE_KEYS.schedule);
  if (data) return migrateSchedule(JSON.parse(data));
  const initial: StoredSchedule = {
    week1: JSON.parse(JSON.stringify(WEEK1_SCHEDULE)),
    week2: JSON.parse(JSON.stringify(WEEK2_SCHEDULE)),
    week3: JSON.parse(JSON.stringify(WEEK3_SCHEDULE)),
    week4: JSON.parse(JSON.stringify(WEEK4_SCHEDULE)),
  };
  localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(initial));
  return initial;
}

function saveStoredSchedule(schedule: StoredSchedule) {
  localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(schedule));
  autoSyncToTelegram();
}

export function getScheduleForWeek(weekNumber: number): ScheduleGroup[] {
  const stored = getStoredSchedule();
  switch (weekNumber) {
    case 1: return stored.week1;
    case 2: return stored.week2;
    case 3: return stored.week3;
    case 4: return stored.week4;
    default: return [];
  }
}

export function getAllScheduledCompanyNames(): string[] {
  const stored = getStoredSchedule();
  const names = new Set<string>();
  [stored.week1, stored.week2, stored.week3, stored.week4].flat().forEach(g => g.companies.forEach(c => names.add(c)));
  return Array.from(names);
}

export function isMainCompanyInSchedule(companyName: string): boolean {
  const stored = getStoredSchedule();
  return [stored.week1, stored.week2, stored.week3, stored.week4].flat().some(g => g.companies[0] === companyName);
}

function updateCompanyNameInSchedule(oldName: string, newName: string) {
  const stored = getStoredSchedule();
  const update = (groups: ScheduleGroup[]) => {
    groups.forEach(g => {
      g.companies = g.companies.map(c => c === oldName ? newName : c);
    });
  };
  update(stored.week1);
  update(stored.week2);
  update(stored.week3);
  update(stored.week4);
  saveStoredSchedule(stored);
}

function countARatedInSlot(slot: ScheduleGroup): number {
  const companies = getCompanies();
  return slot.companies.filter(name => {
    const c = companies.find(co => co.name === name);
    return c?.rating === 'A';
  }).length;
}

function addCompanyToScheduleByRating(companyName: string, rating: CompanyRating = 'B') {
  const stored = getStoredSchedule();
  const allWeeks = [stored.week1, stored.week2, stored.week3, stored.week4];

  allWeeks.forEach(week => {
    week.forEach(g => { g.companies = g.companies.filter(c => c !== companyName); });
  });

  const scoredLeastBusy = (slots: ScheduleGroup[], isARated: boolean): ScheduleGroup | null => {
    if (slots.length === 0) return null;
    return slots.reduce((best, curr) => {
      const bestTotal = best.companies.length;
      const currTotal = curr.companies.length;
      if (isARated) {
        const bestA = countARatedInSlot(best);
        const currA = countARatedInSlot(curr);
        if (currA < bestA) return curr;
        if (currA > bestA) return best;
      }
      return currTotal < bestTotal ? curr : best;
    });
  };

  const leastBusyAcross = (weeksList: ScheduleGroup[][], shift: Shift, isARated: boolean): ScheduleGroup | null => {
    const candidates = weeksList.flatMap(w => w.filter(g => g.shift === shift));
    return scoredLeastBusy(candidates, isARated);
  };

  if (rating === 'A') {
    const morning = leastBusyAcross([stored.week1, stored.week2], 'صباحية', true);
    if (morning) morning.companies.push(companyName);
    const eve1 = leastBusyAcross([stored.week1, stored.week2], 'مسائية', true);
    if (eve1) eve1.companies.push(companyName);
    const eve2 = leastBusyAcross([stored.week3, stored.week4], 'مسائية', true);
    if (eve2) eve2.companies.push(companyName);
  } else if (rating === 'B') {
    const morning = leastBusyAcross([stored.week1, stored.week2], 'صباحية', false);
    if (morning) morning.companies.push(companyName);
    const evening = leastBusyAcross([stored.week3, stored.week4], 'مسائية', false);
    if (evening) evening.companies.push(companyName);
  } else {
    const allSlots = allWeeks.flat();
    const slot = scoredLeastBusy(allSlots, false);
    if (slot) slot.companies.push(companyName);
  }

  saveStoredSchedule(stored);
}

function addCompanyToSchedule(companyName: string) {
  addCompanyToScheduleByRating(companyName, 'B');
}

function removeCompanyFromSchedule(companyName: string) {
  const stored = getStoredSchedule();
  [stored.week1, stored.week2, stored.week3, stored.week4].forEach(week => {
    week.forEach(g => {
      g.companies = g.companies.filter(c => c !== companyName);
    });
  });
  saveStoredSchedule(stored);
}

// ---- Companies ----
export function getCompanies(): Company[] {
  const data = localStorage.getItem(STORAGE_KEYS.companies);
  return data ? JSON.parse(data) : [];
}

export function saveCompanies(companies: Company[]) {
  localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(companies));
  autoSyncToTelegram();
}

export function getCompanyByName(name: string): Company | undefined {
  return getCompanies().find(c => c.name === name);
}

export function addCompany(name: string, rating: CompanyRating = 'B'): Company {
  const companies = getCompanies();
  const existing = companies.find(c => c.name === name);
  if (existing) return existing;
  const company: Company = { id: generateId(), name, rating, representatives: [], createdAt: new Date().toISOString() };
  companies.push(company);
  saveCompanies(companies);
  addCompanyToScheduleByRating(name, rating);
  return company;
}

export function updateCompanyRating(id: string, rating: CompanyRating) {
  const companies = getCompanies();
  const company = companies.find(c => c.id === id);
  if (!company) return;
  company.rating = rating;
  saveCompanies(companies);
  addCompanyToScheduleByRating(company.name, rating);
}

export function getCompanyRatings(): Record<string, CompanyRating> {
  const ratings: Record<string, CompanyRating> = {};
  getCompanies().forEach(c => { ratings[c.id] = c.rating || 'B'; });
  return ratings;
}

export function deleteCompany(id: string) {
  const companies = getCompanies();
  const company = companies.find(c => c.id === id);
  if (company) {
    removeCompanyFromSchedule(company.name);
  }
  saveCompanies(companies.filter(c => c.id !== id));
}

export function updateCompanyName(id: string, newName: string) {
  const companies = getCompanies();
  const company = companies.find(c => c.id === id);
  if (company) {
    const oldName = company.name;
    company.name = newName;
    saveCompanies(companies);
    updateCompanyNameInSchedule(oldName, newName);
    const visits = getVisits();
    let changed = false;
    visits.forEach(v => {
      if (v.companyName === oldName) {
        v.companyName = newName;
        changed = true;
      }
    });
    if (changed) saveVisits(visits);
  }
}

export function addRepresentative(companyId: string, name: string, phone?: string): Representative {
  const companies = getCompanies();
  const company = companies.find(c => c.id === companyId);
  if (!company) throw new Error('Company not found');
  const rep: Representative = { id: generateId(), name, phone };
  company.representatives.push(rep);
  saveCompanies(companies);
  return rep;
}

export function removeRepresentative(companyId: string, repId: string) {
  const companies = getCompanies();
  const company = companies.find(c => c.id === companyId);
  if (!company) return;
  company.representatives = company.representatives.filter(r => r.id !== repId);
  saveCompanies(companies);
}

// ---- Visits ----
export function getVisits(): Visit[] {
  const data = localStorage.getItem(STORAGE_KEYS.visits);
  return data ? JSON.parse(data) : [];
}

export function saveVisits(visits: Visit[]) {
  localStorage.setItem(STORAGE_KEYS.visits, JSON.stringify(visits));
  autoSyncToTelegram();
}

export function recordVisit(visit: Omit<Visit, 'id'>): Visit {
  const visits = getVisits();
  const existing = visits.find(v =>
    v.representativeId === visit.representativeId &&
    v.date === visit.date &&
    v.shift === visit.shift
  );
  if (existing) {
    existing.printCount = (existing.printCount || 1) + 1;
    saveVisits(visits);
    return existing;
  }
  const newVisit: Visit = { ...visit, id: generateId(), printCount: 1 };
  visits.push(newVisit);
  saveVisits(visits);
  return newVisit;
}

export function getVisitPrintCount(representativeId: string, date: string, shift: string): number {
  const visit = getVisits().find(v =>
    v.representativeId === representativeId &&
    v.date === date &&
    v.shift === shift
  );
  return visit?.printCount || 0;
}

export function hasVisitToday(representativeId: string, date: string, shift: string): boolean {
  return getVisits().some(v =>
    v.representativeId === representativeId &&
    v.date === date &&
    v.shift === shift
  );
}

// ---- Seed data ----
export function seedInitialData() {
  if (getCompanies().length > 0) return;
  const names = getAllScheduledCompanyNames();
  const companies: Company[] = names.map(name => ({
    id: generateId(),
    name,
    representatives: [],
    createdAt: new Date().toISOString(),
  }));
  saveCompanies(companies);
}

// ---- Telegram Integration ----
export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export function getTelegramConfig(): TelegramConfig | null {
  const data = localStorage.getItem(STORAGE_KEYS.telegramConfig);
  return data ? JSON.parse(data) : null;
}

export function saveTelegramConfig(config: TelegramConfig) {
  localStorage.setItem(STORAGE_KEYS.telegramConfig, JSON.stringify(config));
}

export async function testTelegramConnection(botToken: string, chatId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: '✅ تم الاتصال بنجاح - برج الأطباء' }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function syncToTelegram(): Promise<boolean> {
  const config = getTelegramConfig();
  if (!config) return false;

  const backup = {
    companies: getCompanies(),
    visits: getVisits(),
    schedule: localStorage.getItem(STORAGE_KEYS.schedule) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.schedule)!) : null,
    exportDate: new Date().toISOString(),
  };

  try {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const formData = new FormData();
    formData.append('chat_id', config.chatId);
    formData.append('document', blob, `pharmacy_backup_${new Date().toISOString().split('T')[0]}.json`);
    formData.append('caption', `📦 نسخة احتياطية تلقائية - ${new Date().toLocaleString('ar-SA')}`);

    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendDocument`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function restoreFromTelegram(): Promise<boolean> {
  const config = getTelegramConfig();
  if (!config) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/getUpdates?offset=-10&limit=10`);
    const data = await res.json();
    if (!data.ok) return false;

    const messages = data.result || [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]?.message;
      if (msg?.document && msg.document.file_name?.endsWith('.json') && String(msg.chat.id) === String(config.chatId)) {
        const fileRes = await fetch(`https://api.telegram.org/bot${config.botToken}/getFile?file_id=${msg.document.file_id}`);
        const fileData = await fileRes.json();
        if (!fileData.ok) continue;

        const downloadRes = await fetch(`https://api.telegram.org/file/bot${config.botToken}/${fileData.result.file_path}`);
        const backup = await downloadRes.json();

        if (backup.companies) {
          localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(backup.companies));
        }
        if (backup.visits) {
          localStorage.setItem(STORAGE_KEYS.visits, JSON.stringify(backup.visits));
        }
        if (backup.schedule) {
          localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(backup.schedule));
        }
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function autoSyncToTelegram() {
  const config = getTelegramConfig();
  if (!config) return;
  const lastSync = localStorage.getItem('pharmacy_last_sync');
  const now = Date.now();
  if (lastSync && now - parseInt(lastSync) < 30000) return;
  localStorage.setItem('pharmacy_last_sync', String(now));
  syncToTelegram().catch(() => {});
}

// ---- Backup / Restore ----
export function exportAllData(): string {
  return JSON.stringify({
    companies: getCompanies(),
    visits: getVisits(),
    schedule: localStorage.getItem(STORAGE_KEYS.schedule) ? JSON.parse(localStorage.getItem(STORAGE_KEYS.schedule)!) : null,
    telegramConfig: getTelegramConfig(),
    exportDate: new Date().toISOString(),
  }, null, 2);
}

export function importAllData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.companies) localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(data.companies));
    if (data.visits) localStorage.setItem(STORAGE_KEYS.visits, JSON.stringify(data.visits));
    if (data.schedule) localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(data.schedule));
    if (data.telegramConfig) localStorage.setItem(STORAGE_KEYS.telegramConfig, JSON.stringify(data.telegramConfig));
    return true;
  } catch {
    return false;
  }
}
