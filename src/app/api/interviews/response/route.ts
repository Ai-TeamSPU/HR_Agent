import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { interviewId, applicationId, action, notes = '' } = body;

    if (!action || (!interviewId && !applicationId)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const isAgree = action === 'agree';
    const interviewStatus = isAgree ? 'CONFIRMED' : 'CANCELLED';
    const applicationState = isAgree ? 'INTERVIEW_CONFIRMED' : 'REJECTED';

    let intData: any = null;
    let appData: any = null;

    // 1. ดึงข้อมูล Interview & Application เพื่อใช้แสดงผลและส่ง Notification
    if (interviewId) {
      const numIntId = Number(interviewId);
      const { data } = await supabase
        .from('interviews')
        .select('*, candidate:candidates(*), vacancy:vacancies(*, position:positions(*))')
        .eq('id', isNaN(numIntId) ? interviewId : numIntId)
        .single();
      intData = data;
    }

    if (!intData && applicationId) {
      const numAppId = Number(applicationId);
      const { data } = await supabase
        .from('applications')
        .select('*, candidate:candidates(*), vacancy:vacancies(*, position:positions(*))')
        .eq('id', isNaN(numAppId) ? applicationId : numAppId)
        .single();
      appData = data;
    }

    const candidateName = intData?.candidate?.first_name_th 
      ? `${intData.candidate.first_name_th} ${intData.candidate.last_name_th || ''}`
      : `${intData?.candidate?.first_name || appData?.candidate?.first_name || 'ผู้สมัคร'} ${intData?.candidate?.last_name || appData?.candidate?.last_name || ''}`.trim();

    const positionTitle = intData?.vacancy?.position?.title_th 
      || intData?.vacancy?.position?.title 
      || appData?.vacancy?.position?.title_th 
      || appData?.vacancy?.position?.title 
      || 'ตำแหน่งงาน';

    const targetAppId = intData?.application_id || (applicationId ? Number(applicationId) : null);
    const targetIntId = intData?.id || (interviewId ? Number(interviewId) : null);

    // 2. อัปเดตตาราง interviews
    if (targetIntId) {
      await supabase
        .from('interviews')
        .update({
          status: interviewStatus,
          notes: notes ? `${intData?.notes || ''}\n[ผู้สมัครระบุ]: ${notes}`.trim() : (intData?.notes || ''),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetIntId);
    } else if (targetAppId) {
      await supabase
        .from('interviews')
        .update({
          status: interviewStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('application_id', targetAppId);
    }

    // 3. อัปเดตตาราง applications
    if (targetAppId) {
      await supabase
        .from('applications')
        .update({
          state: applicationState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetAppId);
    }

    // 4. บันทึก Live Notification แจ้งเตือนฝ่าย HR ทันที
    await supabase.from('notifications').insert({
      user_id: 1,
      title: isAgree ? 'Interview Confirmed by Candidate' : 'Interview Declined by Candidate',
      title_th: isAgree ? '✅ ผู้สมัครตอบรับยืนยันการสัมภาษณ์แล้ว' : '❌ ผู้สมัครแจ้งขอสละสิทธิ์การสัมภาษณ์',
      message: isAgree 
        ? `${candidateName} has confirmed interview attendance for ${positionTitle}`
        : `${candidateName} has declined the interview invitation for ${positionTitle}`,
      message_th: isAgree
        ? `คุณ ${candidateName} ได้กดยืนยันเข้าร่วมสัมภาษณ์ตำแหน่ง ${positionTitle} เรียบร้อยแล้ว`
        : `คุณ ${candidateName} ได้แจ้งขอสละสิทธิ์การสัมภาษณ์ตำแหน่ง ${positionTitle}`,
      type: isAgree ? 'SUCCESS' : 'WARNING',
      is_read: false,
      action_url: targetAppId ? `/dashboard/applications/${targetAppId}` : '/dashboard/interviews',
      created_at: new Date().toISOString(),
    });

    // 5. บันทึก Workflow Event
    await supabase.from('workflow_events').insert({
      event_type: isAgree ? 'INTERVIEW_CONFIRMED' : 'INTERVIEW_CANCELLED',
      entity_type: 'APPLICATION',
      entity_id: targetAppId || targetIntId || 1,
      actor_type: 'CANDIDATE',
      actor_id: String(intData?.candidate_id || appData?.candidate_id || '1'),
      actor_name: candidateName,
      description: isAgree ? `Candidate confirmed interview for ${positionTitle}` : `Candidate declined interview for ${positionTitle}`,
      description_th: isAgree ? `ผู้สมัคร (${candidateName}) กดยืนยันการสัมภาษณ์ตำแหน่ง ${positionTitle}` : `ผู้สมัคร (${candidateName}) แจ้งขอสละสิทธิ์การสัมภาษณ์ตำแหน่ง ${positionTitle}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      action,
      interviewStatus,
      applicationState,
      candidateName,
      positionTitle,
      interview: intData,
    });
  } catch (error: any) {
    console.error('Error handling interview response:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
