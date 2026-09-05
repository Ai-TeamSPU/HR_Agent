// Interview Types

export type InterviewType = 'PHONE_SCREEN' | 'TECHNICAL' | 'BEHAVIORAL' | 'PANEL' | 'FINAL';
export type InterviewStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Interview {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateNameTh: string;
  vacancyId: string;
  vacancyTitle: string;
  vacancyTitleTh?: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt: string;
  duration: number; // minutes
  location?: string;
  meetingUrl?: string;
  interviewers: Interviewer[];
  feedback?: InterviewFeedback[];
  overallScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interviewer {
  id: string;
  name: string;
  role: string;
  department: string;
  avatarUrl?: string;
}

export interface InterviewFeedback {
  interviewerId: string;
  interviewerName: string;
  scores: {
    technicalSkill: number;
    communication: number;
    problemSolving: number;
    teamwork: number;
    cultureFit: number;
  };
  overallScore: number;
  strengths: string[];
  concerns: string[];
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'HOLD' | 'NO_HIRE';
  notes?: string;
  submittedAt: string;
}

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, Record<string, string>> = {
  PHONE_SCREEN: { en: 'Phone Screen', th: 'สัมภาษณ์ทางโทรศัพท์' },
  TECHNICAL: { en: 'Technical', th: 'สัมภาษณ์เทคนิค' },
  BEHAVIORAL: { en: 'Behavioral', th: 'สัมภาษณ์พฤติกรรม' },
  PANEL: { en: 'Panel', th: 'สัมภาษณ์คณะกรรมการ' },
  FINAL: { en: 'Final', th: 'สัมภาษณ์รอบสุดท้าย' },
};

export const INTERVIEW_STATUS_COLORS: Record<InterviewStatus, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
  CONFIRMED: 'bg-teal-50 text-teal-700 border-teal-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  NO_SHOW: 'bg-slate-100 text-slate-700 border-slate-300',
};

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, Record<string, string>> = {
  SCHEDULED: { en: 'SCHEDULED', th: 'นัดหมายแล้ว' },
  CONFIRMED: { en: 'CONFIRMED', th: 'ยืนยันแล้ว' },
  IN_PROGRESS: { en: 'IN PROGRESS', th: 'กำลังสัมภาษณ์' },
  COMPLETED: { en: 'COMPLETED', th: 'สัมภาษณ์เสร็จสิ้น' },
  CANCELLED: { en: 'CANCELLED / OVERDUE', th: 'ยกเลิก / ขาดนัด' },
  NO_SHOW: { en: 'NO SHOW', th: 'ขาดนัดสัมภาษณ์' },
};

