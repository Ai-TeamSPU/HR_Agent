// API Routes สำหรับหน้า "เทรนโมเดล AI" (/dashboard/ai-training)
// GET    /api/ai-training        — ดึงเกณฑ์มาตรฐาน AI ประจำตำแหน่งทั้งหมด
// POST   /api/ai-training        — บันทึก/อัปเดตเกณฑ์มาตรฐาน (Training Profile)
// DELETE /api/ai-training?id=... — ลบเกณฑ์มาตรฐาน

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchTrainingProfiles,
  upsertTrainingProfile,
  deleteTrainingProfile,
} from '@/pageback/services';

export async function GET() {
  try {
    const profiles = await fetchTrainingProfiles();
    return NextResponse.json({ success: true, profiles });
  } catch (error: any) {
    console.error('GET /api/ai-training error:', error);
    return NextResponse.json({ success: false, error: error.message || 'ดึงเกณฑ์มาตรฐานไม่สำเร็จ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body?.positionTitle || !body?.department) {
      return NextResponse.json({ success: false, error: 'ต้องระบุ positionTitle และ department' }, { status: 400 });
    }

    const result = await upsertTrainingProfile(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error('POST /api/ai-training error:', error);
    return NextResponse.json({ success: false, error: error.message || 'บันทึกเกณฑ์มาตรฐานไม่สำเร็จ' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ต้องระบุ id' }, { status: 400 });
    }

    const ok = await deleteTrainingProfile(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'ลบเกณฑ์มาตรฐานไม่สำเร็จ' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/ai-training error:', error);
    return NextResponse.json({ success: false, error: error.message || 'ลบเกณฑ์มาตรฐานไม่สำเร็จ' }, { status: 500 });
  }
}
