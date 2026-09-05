// pageback — DL Test Service
// Interface สำหรับเชื่อมต่อกับระบบ DL Test ภายนอก
// เมื่อระบบ DL Test API พร้อม ให้ implement ตาม interface นี้

export interface DLTestAssignRequest {
  candidateId: string;
  applicationId: string;
  candidateEmail: string;
  candidateName: string;
  positionTitle: string;
  testType?: string; // ประเภทของ Test (ถ้ามีหลายแบบ)
}

export interface DLTestAssignResponse {
  success: boolean;
  testId: string;
  testUrl: string; // URL ที่ส่งให้ candidate ไปทำ test
  expiresAt: string; // วันหมดอายุ
  message?: string;
}

export interface DLTestResultResponse {
  testId: string;
  candidateId: string;
  applicationId: string;
  knowledgeScore: number;    // คะแนนความรู้
  practicalScore: number;    // คะแนนปฏิบัติ
  totalScore: number;        // คะแนนรวม
  maxScore: number;          // คะแนนเต็ม
  resultStatus: 'PASS' | 'FAIL' | 'PENDING'; // สถานะผ่าน/ไม่ผ่าน
  completedAt: string | null; // เวลาที่ทำเสร็จ (null = ยังไม่ทำ)
  details?: {
    sections: {
      name: string;
      score: number;
      maxScore: number;
    }[];
  };
}

// ==============================
// Mock Implementation (Phase 1)
// ==============================

const mockTestResults: Record<string, DLTestResultResponse> = {};

export async function assignDLTest(request: DLTestAssignRequest): Promise<DLTestAssignResponse> {
  // TODO: Phase 2 — เรียก API ระบบ DL Test จริง
  // const response = await fetch(`${DL_TEST_API_URL}/api/tests/assign`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${DL_TEST_API_KEY}`,
  //   },
  //   body: JSON.stringify(request),
  // });

  // Mock response
  const testId = `dl-test-${Date.now()}`;
  
  // จำลองผลทดสอบ
  mockTestResults[testId] = {
    testId,
    candidateId: request.candidateId,
    applicationId: request.applicationId,
    knowledgeScore: 0,
    practicalScore: 0,
    totalScore: 0,
    maxScore: 100,
    resultStatus: 'PENDING',
    completedAt: null,
  };

  return {
    success: true,
    testId,
    testUrl: 'https://ai-teamspu.github.io/DL-exam-system-with-AI-validation/',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    message: 'Test assigned successfully',
  };
}


export async function getDLTestResult(testId: string): Promise<DLTestResultResponse> {
  // TODO: Phase 2 — เรียก API ระบบ DL Test จริง
  // const response = await fetch(`${DL_TEST_API_URL}/api/tests/${testId}/result`, {
  //   headers: {
  //     'Authorization': `Bearer ${DL_TEST_API_KEY}`,
  //   },
  // });

  // Mock: Return sample completed result
  return mockTestResults[testId] || {
    testId,
    candidateId: 'unknown',
    applicationId: 'unknown',
    knowledgeScore: 82,
    practicalScore: 76,
    totalScore: 79,
    maxScore: 100,
    resultStatus: 'PASS' as const,
    completedAt: new Date().toISOString(),
    details: {
      sections: [
        { name: 'Digital Knowledge', score: 82, maxScore: 100 },
        { name: 'Practical Skills', score: 76, maxScore: 100 },
      ],
    },
  };
}

export async function getDLTestStatus(testId: string): Promise<'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'> {
  // TODO: Phase 2 — เรียก API ระบบ DL Test จริง
  const result = await getDLTestResult(testId);
  if (result.completedAt) return 'COMPLETED';
  return 'PENDING';
}
