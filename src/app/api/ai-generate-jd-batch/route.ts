// API Route สำหรับโหมด BATCH — สร้าง JD หลายตำแหน่งพร้อมกัน
// POST /api/ai-generate-jd-batch
// รับ Array ของตำแหน่ง แล้วสร้าง JD ทีละรายการผ่าน generateJobDescriptionBatch()

import { NextRequest, NextResponse } from 'next/server';
import { generateJobDescriptionBatch, type BatchJDPositionInput } from '@/pageback/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const positions: BatchJDPositionInput[] = body?.positions;
    const { campus, facultyId } = body || {};

    if (!Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json({ success: false, error: 'ต้องระบุ positions เป็น array ที่มีอย่างน้อย 1 ตำแหน่ง' }, { status: 400 });
    }

    const invalid = positions.find(p => !p.positionTitle || !p.department);
    if (invalid) {
      return NextResponse.json({ success: false, error: 'แต่ละตำแหน่งต้องมี positionTitle และ department' }, { status: 400 });
    }

    const results = await generateJobDescriptionBatch(positions, { campus, facultyId });

    return NextResponse.json({
      success: true,
      results,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
    });
  } catch (error: any) {
    console.error('POST /api/ai-generate-jd-batch error:', error);
    return NextResponse.json({ success: false, error: error.message || 'สร้าง JD แบบ Batch ไม่สำเร็จ' }, { status: 500 });
  }
}
