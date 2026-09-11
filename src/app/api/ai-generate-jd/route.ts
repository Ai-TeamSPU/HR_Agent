// API Route สำหรับทดสอบสร้าง JD จากหน้า "เทรนโมเดล AI" (Live Test Run)
// POST /api/ai-generate-jd
// เรียก generateJobDescription() พร้อม Historical JD Lookup (Few-shot) + Training Profile Grounding

import { NextRequest, NextResponse } from 'next/server';
import { generateJobDescription, fetchApprovedJDsByDepartment, type HistoricalJDContext } from '@/pageback/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      positionTitle,
      department,
      unitGroup,
      unitName,
      track,
      positionLevel,
      existingResponsibilities,
      customSkills,
      salaryMin,
      salaryMax,
      additionalContext,
      campus,
      facultyId,
      trainingProfile,
    } = body || {};

    if (!positionTitle || !department) {
      return NextResponse.json({ success: false, error: 'ต้องระบุ positionTitle และ department' }, { status: 400 });
    }

    // ดึง JD ที่ approved แล้วในหน่วยงานเดียวกันมาเป็น Few-shot Reference
    let historicalJDs: HistoricalJDContext[] | undefined;
    try {
      const lookupUnit = unitName || department;
      const historical = await fetchApprovedJDsByDepartment(lookupUnit);
      if (historical.length > 0) {
        historicalJDs = historical.map(jd => ({
          jobTitle: jd.jobTitle,
          jobTitleTh: jd.jobTitleTh,
          unitName: jd.unitName,
          summary: jd.summary,
          responsibilitiesGrouped: jd.responsibilitiesGrouped,
          kpis: jd.kpis,
          competencies: jd.competencies,
        }));
      }
    } catch (err) {
      console.warn('Historical JD lookup warning in /api/ai-generate-jd:', err);
    }

    const jd = await generateJobDescription(positionTitle, department, {
      unitGroup,
      unitName,
      track,
      positionLevel,
      existingResponsibilities,
      customSkills,
      salaryMin,
      salaryMax,
      additionalContext,
      campus,
      facultyId,
      historicalJDs,
      trainingProfile,
    });

    return NextResponse.json({ success: true, jd });
  } catch (error: any) {
    console.error('POST /api/ai-generate-jd error:', error);
    return NextResponse.json({ success: false, error: error.message || 'สร้าง Job Description ไม่สำเร็จ' }, { status: 500 });
  }
}
