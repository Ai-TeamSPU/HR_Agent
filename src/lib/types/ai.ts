// AI Agent Types

export interface AIJDGenerationRequest {
  positionId: string;
  department: string;
  existingJD?: string;
  responsibilities?: string[];
  qualifications?: string[];
}

export interface AIJDGenerationResponse {
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
  salaryMin?: number;
  salaryMax?: number;
  generatedAt: string;
  modelVersion: string;
  confidence: number;
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
