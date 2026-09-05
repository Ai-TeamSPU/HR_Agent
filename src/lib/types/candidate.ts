// Candidate & Application Types

export type ApplicationState =
  | 'APPLIED'
  | 'AI_SCREENING'
  | 'HR_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW_INVITED'
  | 'INTERVIEW_CONFIRMED'
  | 'DL_TEST_ASSIGNED'
  | 'DL_TEST_COMPLETED'
  | 'INTERVIEWED'
  | 'DECISION_PENDING'
  | 'REJECTED'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'HIRED';

export interface CandidateDocument {
  id: string;
  candidateId: string;
  documentType: 'RESUME' | 'PORTFOLIO' | 'CERTIFICATE' | 'TRANSCRIPT' | 'OTHER';
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
}

export interface Candidate {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  firstNameTh: string;
  lastNameTh: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  currentPosition?: string;
  currentCompany?: string;
  experienceYears: number;
  education: Education[];
  skills: string[];
  languages: Language[];
  resumeUrl?: string;
  documents?: CandidateDocument[];
  source: 'CAREER_PORTAL' | 'EMAIL' | 'CANDIDATE_POOL' | 'REFERRAL' | 'LINKEDIN';
  createdAt: string;
  updatedAt: string;
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  graduatedYear: number;
  gpa?: number;
}

export interface Language {
  name: string;
  level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'NATIVE';
}

export interface Application {
  id: string;
  candidateId: string;
  candidate: Candidate;
  vacancyId: string;
  vacancyTitle: string;
  vacancyTitleTh: string;
  department: string;
  state: ApplicationState;
  aiScreeningResult?: AIScreeningResult;
  matchScore?: number;
  documents?: CandidateDocument[];
  interviewId?: string;
  dlTestId?: string;
  dlTestResult?: DLTestResult;
  hrNotes?: string;
  rejectionReason?: string;
  appliedAt: string;
  updatedAt: string;
}

export interface AIScreeningResult {
  matchScore: number;
  confidence: number;
  requiredCriteria: Record<string, 'match' | 'partial' | 'no_match' | 'unknown'>;
  strengths: string[];
  gaps: string[];
  evidence: string[];
  recommendation: 'SHORTLIST' | 'HOLD' | 'REJECT';
  generatedAt: string;
}

export interface DLTestResult {
  testId: string;
  candidateId: string;
  applicationId: string;
  knowledgeScore: number;
  practicalScore: number;
  aiLiteracyScore: number;
  totalScore: number;
  maxScore: number;
  completedAt: string;
  resultStatus: 'PASS' | 'FAIL' | 'PENDING';
}

export const APPLICATION_STATE_LABELS: Record<ApplicationState, Record<string, string>> = {
  APPLIED: { en: 'Applied', th: 'สมัครแล้ว' },
  AI_SCREENING: { en: 'AI Screening', th: 'AI กำลังคัดกรอง' },
  HR_REVIEW: { en: 'HR Review', th: 'HR กำลังตรวจสอบ' },
  SHORTLISTED: { en: 'Shortlisted', th: 'ผ่านคัดกรอง' },
  INTERVIEW_INVITED: { en: 'Interview Invited', th: 'เชิญสัมภาษณ์' },
  INTERVIEW_CONFIRMED: { en: 'Interview Confirmed', th: 'ยืนยันสัมภาษณ์' },
  DL_TEST_ASSIGNED: { en: 'DL Test Assigned', th: 'มอบหมาย DL Test' },
  DL_TEST_COMPLETED: { en: 'DL Test Done', th: 'ทำ DL Test แล้ว' },
  INTERVIEWED: { en: 'Interviewed', th: 'สัมภาษณ์แล้ว' },
  DECISION_PENDING: { en: 'Decision Pending', th: 'รอตัดสินใจ' },
  REJECTED: { en: 'Rejected', th: 'ไม่ผ่าน' },
  OFFERED: { en: 'Offered', th: 'เสนอตำแหน่ง' },
  ACCEPTED: { en: 'Accepted', th: 'ตอบรับ' },
  HIRED: { en: 'Hired', th: 'เริ่มงาน' },
};

export const APPLICATION_STATE_COLORS: Record<ApplicationState, string> = {
  APPLIED: 'bg-slate-100 text-slate-700 border-slate-300',
  AI_SCREENING: 'bg-purple-50 text-purple-700 border-purple-200',
  HR_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  SHORTLISTED: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
  INTERVIEW_INVITED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  INTERVIEW_CONFIRMED: 'bg-teal-50 text-teal-700 border-teal-200',
  DL_TEST_ASSIGNED: 'bg-orange-50 text-orange-700 border-orange-200',
  DL_TEST_COMPLETED: 'bg-lime-50 text-lime-800 border-lime-200',
  INTERVIEWED: 'bg-blue-50 text-blue-700 border-blue-200',
  DECISION_PENDING: 'bg-yellow-50 text-yellow-800 border-yellow-300',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  OFFERED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
  HIRED: 'bg-emerald-600 text-white border-emerald-600 font-semibold',
};
