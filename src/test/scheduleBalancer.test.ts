import { describe, expect, it } from 'vitest';
import { buildBalancedSchedule } from '../store/scheduleBalancer';
import { type Company, type CompanyRating, type Shift } from '../types/pharmacy';

function makeCompany(name: string, rating: CompanyRating): Company {
  return {
    id: name,
    name,
    rating,
    representatives: [],
    createdAt: '2026-04-16T00:00:00.000Z',
  };
}

function getAllGroups(schedule: ReturnType<typeof buildBalancedSchedule>) {
  return [...schedule.week1, ...schedule.week2, ...schedule.week3, ...schedule.week4];
}

function countVisits(schedule: ReturnType<typeof buildBalancedSchedule>, companyName: string, shift?: Shift) {
  return getAllGroups(schedule).filter(group => group.companies.includes(companyName) && (!shift || group.shift === shift)).length;
}

describe('buildBalancedSchedule', () => {
  it('fills morning and evening slots evenly for rating B companies', () => {
    const companies = Array.from({ length: 120 }, (_, index) => makeCompany(`شركة B ${index + 1}`, 'B'));
    const schedule = buildBalancedSchedule(companies);

    getAllGroups(schedule).forEach(group => {
      expect(group.companies).toHaveLength(6);
    });

    companies.forEach(company => {
      expect(countVisits(schedule, company.name, 'صباحية')).toBe(1);
      expect(countVisits(schedule, company.name, 'مسائية')).toBe(1);
    });
  });

  it('caps rating A pressure and lets rating C fill the lightest slots', () => {
    const aCompanies = Array.from({ length: 20 }, (_, index) => makeCompany(`شركة A ${index + 1}`, 'A'));
    const bCompanies = Array.from({ length: 80 }, (_, index) => makeCompany(`شركة B ${index + 1}`, 'B'));
    const cCompanies = Array.from({ length: 20 }, (_, index) => makeCompany(`شركة C ${index + 1}`, 'C'));
    const schedule = buildBalancedSchedule([...aCompanies, ...bCompanies, ...cCompanies]);

    getAllGroups(schedule).forEach(group => {
      const aCount = group.companies.filter(name => name.startsWith('شركة A')).length;
      expect(group.companies).toHaveLength(6);
      expect(aCount).toBeLessThanOrEqual(2);
    });

    aCompanies.forEach(company => {
      expect(countVisits(schedule, company.name, 'صباحية')).toBe(1);
      expect(countVisits(schedule, company.name, 'مسائية')).toBe(2);
    });

    bCompanies.forEach(company => {
      expect(countVisits(schedule, company.name, 'صباحية')).toBe(1);
      expect(countVisits(schedule, company.name, 'مسائية')).toBe(1);
    });

    cCompanies.forEach(company => {
      expect(countVisits(schedule, company.name)).toBe(1);
    });
  });
});