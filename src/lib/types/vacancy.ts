// Vacancy & Position Types
import type { DutyArea, KPI, Competencies, WorkingRelationships, WorkingConditions } from './ai';

export type VacancyState =
  | 'DRAFT'
  | 'JD_GENERATING'
  | 'WAITING_HR_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'RECRUITING'
  | 'INTERVIEWING'
  | 'OFFERING'
  | 'FILLED'
  | 'CLOSED';

export interface Position {
  id: string;
  title: string;
  titleTh: string;
  department: string;
  departmentTh: string;
  level: string;
  reportTo: string;
  responsibilities: string[];
  responsibilitiesTh: string[];
  qualifications: string[];
  qualificationsTh: string[];
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobDescription {
  id: string;
  vacancyId: string;
  version: number;
  jobTitle: string;
  jobTitleTh: string;
  summary: string;
  summaryTh: string;
  responsibilities: string[];
  responsibilitiesTh: string[];
  requirements: string[];
  requirementsTh: string[];
  preferredSkills: string[];
  education: string[];
  experience: string[];
  benefits: string[];
  benefitsTh: string[];
  salaryRange?: { min: number; max: number; currency: string };
  generatedByAI: boolean;
  aiModelVersion?: string;
  aiConfidence?: number;
  approvedBy?: string;
  approvedAt?: string;
  isCurrent?: boolean;
  createdAt: string;

  // ============================================================
  // ฟิลด์ใหม่ 8 หมวดมาตรฐาน (SPU JD Architect)
  // ============================================================

  // หมวด 1: ข้อมูลตำแหน่งเพิ่มเติม (Position Identification)
  unitGroup?: string;
  unitName?: string;
  track?: string;
  positionLevel?: string;
  reportsTo?: string;
  subordinates?: string[];
  unitProfile?: string;        // P1-P7

  // หมวด 2: วัตถุประสงค์ของตำแหน่ง (Job Purpose)
  jobPurpose?: string;
  jobPurposeTh?: string;

  // หมวด 3: หน้าที่ความรับผิดชอบแบบกลุ่ม (Grouped Responsibilities)
  responsibilitiesGrouped?: DutyArea[];

  // หมวด 4: ตัวชี้วัดผลงาน (KPIs)
  kpis?: KPI[];

  // หมวด 6: สมรรถนะ (Competencies)
  competencies?: Competencies;

  // หมวด 7: ความสัมพันธ์ในการทำงาน (Working Relationships)
  workingRelationships?: WorkingRelationships;

  // หมวด 8: เงื่อนไขและความเสี่ยง (Working Conditions & Risk)
  workingConditions?: WorkingConditions;

  // Metadata เพิ่มเติม
  status?: string;
  tags?: string[];
  promptUsed?: string;
  isBenchmark?: boolean;
  reviewFlags?: string[];
}

export interface Vacancy {
  id: string;
  positionId: string;
  position: Position;
  jobDescription?: JobDescription;
  state: VacancyState;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  headcount: number;
  filled: number;
  openDate: string;
  closeDate?: string;
  reason: 'NEW_POSITION' | 'REPLACEMENT' | 'EXPANSION';
  reasonDetail?: string;
  hiringManagerId: string;
  hiringManagerName: string;
  applicationCount: number;
  shortlistedCount: number;
  interviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export const VACANCY_STATE_LABELS: Record<VacancyState, Record<string, string>> = {
  DRAFT: { en: 'Draft', th: 'แบบร่าง' },
  JD_GENERATING: { en: 'AI Generating JD', th: 'AI กำลังสร้าง JD' },
  WAITING_HR_APPROVAL: { en: 'Pending Approval', th: 'รออนุมัติ' },
  APPROVED: { en: 'Approved', th: 'อนุมัติแล้ว' },
  PUBLISHED: { en: 'Published', th: 'เผยแพร่แล้ว' },
  RECRUITING: { en: 'Recruiting', th: 'กำลังรับสมัคร' },
  INTERVIEWING: { en: 'Interviewing', th: 'กำลังสัมภาษณ์' },
  OFFERING: { en: 'Offering', th: 'เสนอตำแหน่ง' },
  FILLED: { en: 'Filled', th: 'เต็มแล้ว' },
  CLOSED: { en: 'Closed', th: 'ปิดแล้ว' },
};

export const VACANCY_STATE_COLORS: Record<VacancyState, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
  JD_GENERATING: 'bg-purple-50 text-purple-700 border-purple-200',
  WAITING_HR_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
  PUBLISHED: 'bg-teal-50 text-teal-700 border-teal-200',
  RECRUITING: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
  INTERVIEWING: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  OFFERING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  FILLED: 'bg-green-50 text-green-800 border-green-300 font-semibold',
  CLOSED: 'bg-rose-50 text-rose-700 border-rose-200',
};
