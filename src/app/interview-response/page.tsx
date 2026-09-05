'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  ComputerIcon,
  Building05Icon,
  AssignmentsIcon,
  Target01Icon,
  Idea01Icon,
  Alert02Icon,
} from '@hugeicons/core-free-icons';

function InterviewResponseContent() {
  const searchParams = useSearchParams();
  const actionParam = searchParams.get('action') || 'agree';
  const interviewId = searchParams.get('interviewId') || searchParams.get('id') || '';
  const appId = searchParams.get('appId') || searchParams.get('applicationId') || '';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [responseAction, setResponseAction] = useState<'agree' | 'reject'>(
    actionParam === 'reject' ? 'reject' : 'agree'
  );
  const [data, setData] = useState<{
    candidateName?: string;
    positionTitle?: string;
    interview?: any;
  }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function submitResponse() {
      try {
        setLoading(true);
        const res = await fetch('/api/interviews/response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionParam,
            interviewId,
            applicationId: appId,
          }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          setSuccess(true);
          setResponseAction(json.action);
          setData({
            candidateName: json.candidateName,
            positionTitle: json.positionTitle,
            interview: json.interview,
          });
        } else {
          setErrorMsg(json.error || 'ไม่สามารถบันทึกสถานะได้ กรุณาลองใหม่อีกครั้ง');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } finally {
        setLoading(false);
      }
    }

    if (interviewId || appId) {
      submitResponse();
    } else {
      setLoading(false);
      setErrorMsg('ไม่พบรหัสการนัดหมายสัมภาษณ์');
    }
  }, [actionParam, interviewId, appId]);

  const isAgree = responseAction === 'agree';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-slate-50 to-rose-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-xl space-y-6 animate-fade-in">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 shadow-lg shadow-pink-600/30 text-white font-black text-2xl tracking-wider mb-1">
            SPU
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            HR AI AGENT — มหาวิทยาลัยศรีปทุม
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            ระบบตอบรับและยืนยันการนัดหมายสัมภาษณ์งาน (Candidate Confirmation Portal)
          </p>
        </div>

        {/* Main Status Card */}
        <Card className="border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden">
          {loading ? (
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-700">กำลังบันทึกการตอบรับเข้าสู่ระบบ HR...</p>
              <p className="text-xs text-slate-400">กรุณารอสักครู่ ระบบกำลังอัปเดตข้อมูลไปยังฐานข้อมูล</p>
            </CardContent>
          ) : errorMsg ? (
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <HugeiconsIcon icon={Alert02Icon} size={32} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">เกิดข้อผิดพลาด</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">{errorMsg}</p>
              <p className="text-xs text-slate-400">
                หากท่านพบปัญหา สามารถติดต่อฝ่ายบุคคลได้ที่ <span className="font-semibold text-slate-700">human.resource.2569@gmail.com</span>
              </p>
            </CardContent>
          ) : (
            <div>
              {/* Top Banner */}
              <div
                className={`p-6 sm:p-8 text-center text-white ${
                  isAgree
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
                    : 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 text-white">
                  <HugeiconsIcon
                    icon={isAgree ? CheckmarkCircle02Icon : CancelCircleIcon}
                    size={36}
                    className="text-white"
                  />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {isAgree ? 'ยืนยันการเข้าร่วมสัมภาษณ์สำเร็จ!' : 'บันทึกการขอสละสิทธิ์เรียบร้อยแล้ว'}
                </h2>
                <p className="text-xs sm:text-sm text-white/90 font-medium mt-1.5 max-w-md mx-auto">
                  {isAgree
                    ? `ขอบคุณ คุณ${data.candidateName || 'ผู้สมัคร'} ทางฝ่ายทรัพยากรบุคคล มหาวิทยาลัยศรีปทุม ได้รับการยืนยันของท่านเรียบร้อยแล้ว`
                    : `ทางมหาวิทยาลัยศรีปทุม ได้รับการแจ้งสละสิทธิ์ของ คุณ${data.candidateName || 'ผู้สมัคร'} เรียบร้อยแล้ว ขอขอบพระคุณสำหรับความสนใจ`}
                </p>
              </div>

              {/* Detail Content */}
              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Summary Info */}
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                    <span className="text-xs text-slate-500 font-semibold">ตำแหน่งงาน:</span>
                    <span className="text-xs font-bold text-slate-900">{data.positionTitle || 'ไม่ระบุตำแหน่ง'}</span>
                  </div>

                  {data.interview?.scheduled_at && (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                          <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-slate-400" />
                          วันที่สัมภาษณ์:
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {new Date(data.interview.scheduled_at).toLocaleDateString('th-TH', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                          <HugeiconsIcon icon={Clock01Icon} size={14} className="text-slate-400" />
                          เวลา:
                        </span>
                        <span className="text-xs font-bold text-rose-600">
                          {new Date(data.interview.scheduled_at).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          น. ({data.interview.duration || 60} นาที)
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                          <HugeiconsIcon
                            icon={data.interview.location?.includes('Google Meet') || data.interview.meeting_url ? ComputerIcon : Location01Icon}
                            size={14}
                            className="text-slate-400"
                          />
                          รูปแบบ / สถานที่:
                        </span>
                        <span className="text-xs font-bold text-slate-800 text-right max-w-[240px] truncate">
                          {data.interview.meeting_url ? 'Google Meet (ออนไลน์)' : (data.interview.location || 'มหาวิทยาลัยศรีปทุม')}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Next Steps Guidance */}
                {isAgree ? (
                  <div className="space-y-4">
                    {/* DL Test Banner */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-violet-900 flex items-center gap-1.5">
                          <HugeiconsIcon icon={AssignmentsIcon} size={15} />
                          <span>แบบทดสอบทักษะดิจิทัล (DL Exam with AI Validation)</span>
                        </span>
                        <span className="text-[10px] bg-violet-200/80 text-violet-900 font-bold px-2.5 py-0.5 rounded-full">
                          กรุณาทำก่อนวันสัมภาษณ์
                        </span>
                      </div>
                      <p className="text-xs text-violet-800 leading-relaxed font-medium">
                        เพื่อประกอบการประเมินผลการคัดเลือก ขอความกรุณาท่านทำแบบทดสอบทักษะดิจิทัลผ่านระบบด้านล่างนี้ก่อนถึงวันนัดหมายสัมภาษณ์
                      </p>
                      <a
                        href="https://ai-teamspu.github.io/DL-exam-system-with-AI-validation/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-violet-600/20 transition-all active:scale-95 text-center"
                      >
                        <HugeiconsIcon icon={Target01Icon} size={15} />
                        <span>เข้าสู่ระบบทำแบบทดสอบ DL Test (คลิกที่นี่) ↗</span>
                      </a>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-950">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <HugeiconsIcon icon={Idea01Icon} size={15} className="text-amber-600" />
                        <span>คำแนะนำในการเตรียมตัว:</span>
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-emerald-800 font-medium pl-1">
                        <li>กรุณาเตรียมตัวให้พร้อมล่วงหน้า 10-15 นาทีก่อนเริ่มการสัมภาษณ์</li>
                        <li>หากเป็นการสัมภาษณ์ออนไลน์ กรุณาตรวจสอบกล้อง ไมโครโฟน และสัญญาณอินเทอร์เน็ต</li>
                        <li>เตรียม Portfolio ผลงาน หรือเอกสารที่เกี่ยวข้องพร้อมนำเสนอต่อคณะกรรมการ</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                    ระบบได้บันทึกการขอสละสิทธิ์ของท่านและแจ้งฝ่ายทรัพยากรบุคคลเรียบร้อยแล้ว มหาวิทยาลัยศรีปทุมขอขอบพระคุณในความสนใจและขอให้ท่านประสบความสำเร็จในก้าวต่อไปของสายอาชีพครับ
                  </div>
                )}


                {/* Contact Card */}
                <div className="pt-2 text-center text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-600">ฝ่ายสรรหาและพัฒนาทรัพยากรบุคคล มหาวิทยาลัยศรีปทุม</p>
                  <p>อีเมล: human.resource.2569@gmail.com • โทรศัพท์: 02-579-1111</p>
                </div>
              </CardContent>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function InterviewResponsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <InterviewResponseContent />
    </Suspense>
  );
}
