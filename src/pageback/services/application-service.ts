// pageback — Application Service
// Business logic สำหรับจัดการ Application

import type { Application, ApplicationState } from '@/lib/types/candidate';

// Valid state transitions
const APPLICATION_TRANSITIONS: Record<ApplicationState, ApplicationState[]> = {
  APPLIED: ['AI_SCREENING'],
  AI_SCREENING: ['HR_REVIEW'],
  HR_REVIEW: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW_INVITED', 'REJECTED'],
  INTERVIEW_INVITED: ['INTERVIEW_CONFIRMED', 'REJECTED'],
  INTERVIEW_CONFIRMED: ['DL_TEST_ASSIGNED', 'INTERVIEWED'],
  DL_TEST_ASSIGNED: ['DL_TEST_COMPLETED'],
  DL_TEST_COMPLETED: ['INTERVIEWED'],
  INTERVIEWED: ['DECISION_PENDING'],
  DECISION_PENDING: ['OFFERED', 'REJECTED'],
  REJECTED: [],
  OFFERED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['HIRED'],
  HIRED: [],
};

export function canTransitionApplication(currentState: ApplicationState, targetState: ApplicationState): boolean {
  return APPLICATION_TRANSITIONS[currentState]?.includes(targetState) ?? false;
}

export function getAvailableApplicationTransitions(currentState: ApplicationState): ApplicationState[] {
  return APPLICATION_TRANSITIONS[currentState] || [];
}

export function getAllApplications(): Application[] {
  return [];
}

export function getApplicationById(id: string): Application | undefined {
  return undefined;
}

export function getApplicationsByVacancy(vacancyId: string): Application[] {
  return [];
}

export function getApplicationsByCandidate(candidateId: string): Application[] {
  return [];
}

export function getApplicationsByState(state: ApplicationState): Application[] {
  return [];
}

export function getApplicationStats() {
  const all: Application[] = [];
  return {
    total: all.length,
    applied: all.filter(a => a.state === 'APPLIED').length,
    screening: all.filter(a => a.state === 'AI_SCREENING').length,
    hrReview: all.filter(a => a.state === 'HR_REVIEW').length,
    shortlisted: all.filter(a => a.state === 'SHORTLISTED').length,
    interviewing: all.filter(a => ['INTERVIEW_INVITED', 'INTERVIEW_CONFIRMED', 'INTERVIEWED'].includes(a.state)).length,
    offered: all.filter(a => a.state === 'OFFERED').length,
    hired: all.filter(a => a.state === 'HIRED').length,
    rejected: all.filter(a => a.state === 'REJECTED').length,
    pendingReview: all.filter(a => ['HR_REVIEW', 'DECISION_PENDING'].includes(a.state)).length,
  };
}

export function getPipelineData() {
  const stages = [
    { key: 'APPLIED', label: 'Applied', labelTh: 'สมัครแล้ว' },
    { key: 'AI_SCREENING', label: 'AI Screening', labelTh: 'AI คัดกรอง' },
    { key: 'HR_REVIEW', label: 'HR Review', labelTh: 'HR ตรวจสอบ' },
    { key: 'SHORTLISTED', label: 'Shortlisted', labelTh: 'คัดเลือก' },
    { key: 'INTERVIEW', label: 'Interview', labelTh: 'สัมภาษณ์' },
    { key: 'DL_TEST', label: 'DL Test', labelTh: 'DL Test' },
    { key: 'DECISION', label: 'Decision', labelTh: 'ตัดสินใจ' },
    { key: 'OFFERED', label: 'Offered', labelTh: 'เสนอตำแหน่ง' },
    { key: 'HIRED', label: 'Hired', labelTh: 'เริ่มงาน' },
  ] as const;

  const all: Application[] = [];
  return stages.map(stage => ({
    ...stage,
    count: (() => {
      switch (stage.key) {
        case 'INTERVIEW': return all.filter(a => ['INTERVIEW_INVITED', 'INTERVIEW_CONFIRMED', 'INTERVIEWED'].includes(a.state)).length;
        case 'DL_TEST': return all.filter(a => ['DL_TEST_ASSIGNED', 'DL_TEST_COMPLETED'].includes(a.state)).length;
        case 'DECISION': return all.filter(a => a.state === 'DECISION_PENDING').length;
        default: return all.filter(a => a.state === stage.key).length;
      }
    })(),
  }));
}
