// pageback — Vacancy Service
// Business logic สำหรับจัดการ Vacancy

import type { Vacancy, VacancyState } from '@/lib/types/vacancy';

// Valid state transitions
const VACANCY_TRANSITIONS: Record<VacancyState, VacancyState[]> = {
  DRAFT: ['APPROVED', 'WAITING_HR_APPROVAL', 'PUBLISHED'],
  JD_GENERATING: ['WAITING_HR_APPROVAL', 'DRAFT'],
  WAITING_HR_APPROVAL: ['APPROVED', 'DRAFT', 'PUBLISHED'],
  APPROVED: ['PUBLISHED', 'RECRUITING'],
  PUBLISHED: ['RECRUITING', 'CLOSED'],
  RECRUITING: ['INTERVIEWING', 'CLOSED'],
  INTERVIEWING: ['OFFERING', 'RECRUITING', 'CLOSED'],
  OFFERING: ['FILLED', 'INTERVIEWING'],
  FILLED: ['CLOSED'],
  CLOSED: ['DRAFT', 'RECRUITING'],
};

export function canTransition(currentState: VacancyState, targetState: VacancyState): boolean {
  return VACANCY_TRANSITIONS[currentState]?.includes(targetState) ?? false;
}

export function getAvailableTransitions(currentState: VacancyState): VacancyState[] {
  return VACANCY_TRANSITIONS[currentState] || [];
}

export function getAllVacancies(): Vacancy[] {
  return [];
}

export function getVacancyById(id: string): Vacancy | undefined {
  return undefined;
}

export function getVacanciesByState(state: VacancyState): Vacancy[] {
  return [];
}

export function getVacancyStats() {
  return {
    total: 0,
    draft: 0,
    active: 0,
    filled: 0,
    closed: 0,
    pendingApproval: 0,
    totalApplications: 0,
    totalShortlisted: 0,
  };
}


