// AI Agent Types — SPU JD Architect 8 หมวด (Full Pipeline)

// ============================================================
// Supporting Interfaces สำหรับ JD 8 หมวดมาตรฐาน
// ============================================================

/** หมวด 3: กลุ่มภารกิจ (Duty Area) พร้อม % สัดส่วนเวลา */
export interface DutyArea {
  dutyArea: string;
  dutyAreaTh: string;
  weightPercent: number;
  tasks: string[];
  tasksTh: string[];
}

/** หมวด 4: ตัวชี้วัดผลงาน (KPI) */
export interface KPI {
  name: string;
  nameTh: string;
  method: string;
  methodTh: string;
  target: string;
  targetTh: string;
}

/** หมวด 6: สมรรถนะ (Competencies) — Core / Functional / Digital & AI */
export interface FunctionalCompetency {
  name: string;
  nameTh: string;
  level: number; // 1-5
}

export interface Competencies {
  core: string[];
  coreTh: string[];
  functional: FunctionalCompetency[];
  digitalAI: string[];
  digitalAITh: string[];
}

/** หมวด 7: ความสัมพันธ์ในการทำงาน */
export interface WorkingRelationships {
  internal: string[];
  internalTh: string[];
  external: string[];
  externalTh: string[];
}

/** หมวด 8: เงื่อนไขและความเสี่ยงของงาน */
export interface WorkingConditions {
  conditions: string[];
  conditionsTh: string[];
  risks: string[];
  risksTh: string[];
  pdpaInvolved: boolean;
}

// ============================================================
// JD Generation Request / Response
// ============================================================

export interface AIJDGenerationRequest {
  positionId: string;
  department: string;
  existingJD?: string;
  responsibilities?: string[];
  qualifications?: string[];
  // ฟิลด์ใหม่สำหรับ 8 หมวด
  unitGroup?: string;
  unitName?: string;
  track?: string;
  positionLevel?: string;
  additionalContext?: string;
  campus?: string;
  facultyId?: string;
}

export interface AIJDGenerationResponse {
  // หมวด 1: ข้อมูลตำแหน่ง (Position Identification)
  jobTitle: string;
  jobTitleTh: string;
  unitGroup?: string;
  unitName?: string;
  track?: string;
  positionLevel?: string;
  reportsTo?: string;
  subordinates?: string[];
  unitProfile?: string;

  // หมวด 2: วัตถุประสงค์ของตำแหน่ง (Job Purpose)
  jobPurpose?: string;
  jobPurposeTh?: string;
  summary: string;
  summaryTh: string;

  // หมวด 3: หน้าที่ความรับผิดชอบหลัก (Key Responsibilities)
  responsibilitiesGrouped?: DutyArea[];
  responsibilities: string[];
  responsibilitiesTh: string[];

  // หมวด 4: ตัวชี้วัดผลงาน (KPIs)
  kpis?: KPI[];

  // หมวด 5: คุณสมบัติประจำตำแหน่ง (Qualifications)
  requirements: string[];
  requirementsTh: string[];
  preferredSkills: string[];
  education: string[];
  experience: string[];

  // หมวด 6: สมรรถนะ (Competencies)
  competencies?: Competencies;

  // หมวด 7: ความสัมพันธ์ในการทำงาน
  workingRelationships?: WorkingRelationships;

  // หมวด 8: เงื่อนไขและความเสี่ยง
  workingConditions?: WorkingConditions;

  // สวัสดิการ & เงินเดือน (คงเดิม)
  benefits: string[];
  benefitsTh: string[];
  salaryMin?: number;
  salaryMax?: number;

  // Metadata
  generatedAt: string;
  modelVersion: string;
  confidence: number;
  reviewFlags?: string[];
}

// ============================================================
// Training Profile (สำหรับหน้า เทรนโมเดล AI)
// ============================================================

export interface TrainingProfile {
  id?: string;
  positionId?: string;
  positionTitle: string;
  positionTitleTh: string;
  department: string;
  level: string;
  educationLevel: string;
  minExperienceYears: number;
  standardResponsibilities: string[];
  requiredSkills: string[];
  aiGuidelines: string;
  standardBenefits: string[];
  salaryRange: { min: number; max: number };
  unitProfile?: string;
  track?: string;
  isTrained: boolean;
  lastTrainedAt?: string;
  updatedBy?: string;
}

// ============================================================
// Faculty (เตรียมรองรับอนาคต)
// ============================================================

export interface Faculty {
  id?: string;
  name: string;
  nameTh: string;
  code: string;
  isActive: boolean;
}

export interface AICandidateMatchRequest {
  vacancyId: string;
  candidateId: string;
}

export interface AICandidateMatchResponse {
  matchScore: number;
  confidence: number;
  requiredCriteria: Record<string, 'match' | 'partial' | 'no_match' | 'unknown'>;
  strengths: string[];
  strengthsTh: string[];
  gaps: string[];
  gapsTh: string[];
  evidence: string[];
  recommendation: 'SHORTLIST' | 'HOLD' | 'REJECT';
  generatedAt: string;
  modelVersion: string;
}

export interface AIRecruitmentRecommendation {
  id: string;
  applicationId: string;
  candidateName: string;
  vacancyTitle: string;
  overallFit: number;
  scores: {
    jobMatch: number;
    experience: number;
    dlTest: number;
    interview: number;
  };
  strengths: string[];
  strengthsTh: string[];
  gaps: string[];
  gapsTh: string[];
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'HOLD' | 'REJECT';
  reasoning: string;
  reasoningTh: string;
  generatedAt: string;
}

export type AIRecommendation = AIRecruitmentRecommendation;

export interface AIRun {
  id: string;
  agentType: 'JD_GENERATOR' | 'CANDIDATE_MATCHER' | 'RECRUITMENT_RECOMMENDER' | 'RESUME_PARSER';
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  modelVersion: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface WorkflowEvent {
  id: string;
  type: string;
  entityType: 'VACANCY' | 'APPLICATION' | 'INTERVIEW' | 'CANDIDATE';
  entityId: string;
  actorType: 'HR' | 'AI_AGENT' | 'AUTOMATION' | 'CANDIDATE' | 'SYSTEM';
  actorId: string;
  actorName: string;
  description: string;
  descriptionTh: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}
