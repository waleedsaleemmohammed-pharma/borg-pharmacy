import { Company, CompanyRating, DAYS, SHIFTS, type DayOfWeek, type Shift } from '@/types/pharmacy';
import { type ScheduleGroup } from '@/data/fixedSchedule';

export interface StoredScheduleShape {
  week1: ScheduleGroup[];
  week2: ScheduleGroup[];
  week3: ScheduleGroup[];
  week4: ScheduleGroup[];
}

type WeekNumber = 1 | 2 | 3 | 4;
type SlotRef = { week: WeekNumber; group: ScheduleGroup };
type Placement = { week: WeekNumber; day: DayOfWeek; shift: Shift };

const WEEKS: WeekNumber[] = [1, 2, 3, 4];
const TARGET_TOTAL_PER_SLOT = 8;
const MIN_TOTAL_PER_SLOT = 6;
const TARGET_A_PER_SLOT = 2;
const TARGET_OTHER_PER_SLOT = 6;
const RATING_ORDER: Record<CompanyRating, number> = { A: 0, B: 1, C: 2 };

function normalizeRating(rating?: CompanyRating): CompanyRating {
  return rating || 'B';
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function createEmptyWeek(): ScheduleGroup[] {
  return DAYS.flatMap(day => SHIFTS.map(shift => ({ day, shift, companies: [] })));
}

export function createEmptyStoredSchedule(): StoredScheduleShape {
  return {
    week1: createEmptyWeek(),
    week2: createEmptyWeek(),
    week3: createEmptyWeek(),
    week4: createEmptyWeek(),
  };
}

function getWeekGroups(schedule: StoredScheduleShape, week: WeekNumber): ScheduleGroup[] {
  switch (week) {
    case 1: return schedule.week1;
    case 2: return schedule.week2;
    case 3: return schedule.week3;
    case 4: return schedule.week4;
  }
}

function getAllSlots(schedule: StoredScheduleShape): SlotRef[] {
  return WEEKS.flatMap(week => getWeekGroups(schedule, week).map(group => ({ week, group })));
}

function compareScores(next: number[], current: number[]) {
  for (let i = 0; i < next.length; i++) {
    if (next[i] !== current[i]) return next[i] < current[i];
  }
  return false;
}

function getCounts(group: ScheduleGroup, ratingsByName: Map<string, CompanyRating>) {
  const aCount = group.companies.filter(name => ratingsByName.get(name) === 'A').length;
  return {
    total: group.companies.length,
    aCount,
    otherCount: group.companies.length - aCount,
  };
}

function getScore(slot: SlotRef, company: Company, ratingsByName: Map<string, CompanyRating>, placements: Placement[]) {
  const counts = getCounts(slot.group, ratingsByName);
  const sameWeekPenalty = placements.some(p => p.week === slot.week) ? 1 : 0;
  const sameDayPenalty = placements.some(p => p.week === slot.week && p.day === slot.group.day) ? 1 : 0;
  const tieBreaker = hashString(`${company.name}-${slot.week}-${slot.group.day}-${slot.group.shift}`);

  if (normalizeRating(company.rating) === 'A') {
    return [
      counts.aCount >= TARGET_A_PER_SLOT ? 1 : 0,
      counts.total < MIN_TOTAL_PER_SLOT ? 0 : 1,
      counts.total >= TARGET_TOTAL_PER_SLOT ? 1 : 0,
      counts.aCount,
      counts.total,
      sameWeekPenalty,
      sameDayPenalty,
      tieBreaker,
    ];
  }

  return [
    counts.total < MIN_TOTAL_PER_SLOT ? 0 : 1,
    counts.otherCount >= TARGET_OTHER_PER_SLOT ? 1 : 0,
    counts.total >= TARGET_TOTAL_PER_SLOT ? 1 : 0,
    counts.total,
    counts.otherCount,
    sameWeekPenalty,
    sameDayPenalty,
    tieBreaker,
  ];
}

function pickBestSlot(
  slots: SlotRef[],
  company: Company,
  ratingsByName: Map<string, CompanyRating>,
  placementsByCompany: Map<string, Placement[]>,
  shift?: Shift,
) {
  const placements = placementsByCompany.get(company.name) || [];
  const candidates = slots.filter(slot => (!shift || slot.group.shift === shift) && !slot.group.companies.includes(company.name));

  let bestSlot: SlotRef | null = null;
  let bestScore: number[] | null = null;

  candidates.forEach(slot => {
    const score = getScore(slot, company, ratingsByName, placements);
    if (!bestSlot || !bestScore || compareScores(score, bestScore)) {
      bestSlot = slot;
      bestScore = score;
    }
  });

  return bestSlot;
}

function placeVisit(
  slots: SlotRef[],
  company: Company,
  ratingsByName: Map<string, CompanyRating>,
  placementsByCompany: Map<string, Placement[]>,
  shift?: Shift,
) {
  const slot = pickBestSlot(slots, company, ratingsByName, placementsByCompany, shift);
  if (!slot) return;

  slot.group.companies.push(company.name);
  const placements = placementsByCompany.get(company.name) || [];
  placements.push({ week: slot.week, day: slot.group.day, shift: slot.group.shift });
  placementsByCompany.set(company.name, placements);
}

function sortCompaniesForOutput(companies: Company[]) {
  return [...companies].sort((a, b) => {
    const ratingDiff = RATING_ORDER[normalizeRating(a.rating)] - RATING_ORDER[normalizeRating(b.rating)];
    if (ratingDiff !== 0) return ratingDiff;
    const hashDiff = hashString(a.name) - hashString(b.name);
    if (hashDiff !== 0) return hashDiff;
    return a.name.localeCompare(b.name, 'ar');
  });
}

function sortSlotCompanies(schedule: StoredScheduleShape, ratingsByName: Map<string, CompanyRating>) {
  getAllSlots(schedule).forEach(({ group }) => {
    group.companies.sort((a, b) => {
      const ratingDiff = RATING_ORDER[ratingsByName.get(a) || 'B'] - RATING_ORDER[ratingsByName.get(b) || 'B'];
      if (ratingDiff !== 0) return ratingDiff;
      return a.localeCompare(b, 'ar');
    });
  });
}

export function buildBalancedSchedule(companies: Company[]): StoredScheduleShape {
  const schedule = createEmptyStoredSchedule();
  const slots = getAllSlots(schedule);
  const normalizedCompanies = sortCompaniesForOutput(companies).map(company => ({
    ...company,
    rating: normalizeRating(company.rating),
  }));
  const ratingsByName = new Map(normalizedCompanies.map(company => [company.name, normalizeRating(company.rating)]));
  const placementsByCompany = new Map<string, Placement[]>();

  normalizedCompanies.filter(company => company.rating === 'A').forEach(company => {
    placeVisit(slots, company, ratingsByName, placementsByCompany, 'صباحية');
    placeVisit(slots, company, ratingsByName, placementsByCompany, 'مسائية');
    placeVisit(slots, company, ratingsByName, placementsByCompany, 'مسائية');
  });

  normalizedCompanies.filter(company => company.rating === 'B').forEach(company => {
    placeVisit(slots, company, ratingsByName, placementsByCompany, 'صباحية');
    placeVisit(slots, company, ratingsByName, placementsByCompany, 'مسائية');
  });

  normalizedCompanies.filter(company => company.rating === 'C').forEach(company => {
    placeVisit(slots, company, ratingsByName, placementsByCompany);
  });

  sortSlotCompanies(schedule, ratingsByName);
  return schedule;
}
