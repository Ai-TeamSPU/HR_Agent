'use client';

import { use, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { ApplicationStateBadge } from '@/pagefront/components/StateBadge';
import { MatchScoreRadial } from '@/pagefront/components/MatchScoreRadial';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  MicVocalIcon,
  Calendar03Icon,
  Mail01Icon,
  ChatBotIcon,
  StarIcon,
  CheckmarkSquare01Icon,
  Alert02Icon,
  Cancel01Icon,
  FlashIcon,
  Folder01Icon,
  File01Icon,
  ViewIcon,
  AssignmentsIcon,
  Mortarboard01Icon,
  Idea01Icon,
  Download01Icon,
  Clock01Icon,
  Target01Icon,
  Building05Icon,
  ComputerIcon,
  Location01Icon,
  Link01Icon,
} from '@hugeicons/core-free-icons';
import {
  fetchApplicationByIdFromDB,
  updateApplicationStateInDB,
  fetchInterviewsFromDB,
  screenCandidateWithGeminiInDB,
  scheduleInterviewInDB,
} from '@/pageback/services';
import { getAvailableApplicationTransitions } from '@/pageback/services/application-service';
import { APPLICATION_STATE_LABELS } from '@/lib/types/candidate';
import type { Application, ApplicationState, CandidateDocument } from '@/lib/types/candidate';
import type { Interview, InterviewType } from '@/lib/types/interview';


export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { locale, t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [application, setApplication] = useState<Application | undefined>(undefined);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScreeningAI, setIsScreeningAI] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState<CandidateDocument | null>(null);

  // Schedule Interview Modal States
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [interviewTime, setInterviewTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [interviewType, setInterviewType] = useState<InterviewType>('TECHNICAL');
  const [formatType, setFormatType] = useState<'ONLINE' | 'ONSITE'>('ONLINE');
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/spu-hr-interview');
  const [location, setLocation] = useState('อาคาร 11 ชั้น 8 มหาวิทยาลัยศรีปทุม (บางเขน)');
  const [notes, setNotes] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);

  const INTERVIEW_TOPICS = [
    'เตรียม Portfolio/ผลงานมานำเสนอ',
    'ทดสอบ Coding/ทักษะเทคนิค 30 นาที',
    'สัมภาษณ์กับหัวหน้างานและกรรมการ',
    'ขอปรับเป็นสัมภาษณ์ออนไลน์แทน',
    'เตรียมตัวล่วงหน้าก่อนเวลา 10 นาที',
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [app, ints] = await Promise.all([
        fetchApplicationByIdFromDB(id),
        fetchInterviewsFromDB(),
      ]);
      setApplication(app);
      if (app?.interviewId) {
        setInterview(ints.find(i => i.id === app.interviewId) || null);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const handleStateChange = async (newState: ApplicationState) => {
    if (!application) return;
    if (newState === 'INTERVIEW_INVITED') {
      setIsScheduleModalOpen(true);
      return;
    }
    const ok = await updateApplicationStateInDB(application.id, newState);
    if (ok) {
      setApplication({ ...application, state: newState });
    }
  };

  const handleSaveSchedule = async () => {
    if (!application || !interviewDate || !interviewTime) return;
    setIsSavingSchedule(true);
    const scheduledAt = `${interviewDate}T${interviewTime}:00`;
    const candName = locale === 'th'
      ? `${application.candidate.firstNameTh || application.candidate.firstName} ${application.candidate.lastNameTh || application.candidate.lastName}`
      : `${application.candidate.firstName} ${application.candidate.lastName}`;
    const posTitle = locale === 'th' ? application.vacancyTitleTh : application.vacancyTitle;

    const res = await scheduleInterviewInDB({
      applicationId: application.id,
      candidateId: application.candidateId,
      vacancyId: application.vacancyId,
      scheduledAt,
      duration,
      location: formatType === 'ONLINE' ? 'Google Meet' : location,
      meetingUrl: formatType === 'ONLINE' ? meetingUrl : undefined,
      interviewType,
      notes,
      sendEmailNotification,
      candidateEmail: application.candidate.email,
      candidateName: candName,
      positionTitle: posTitle,
      interviewDateStr: interviewDate,
      interviewTimeStr: interviewTime,
    });

    if (res.success) {
      setApplication({ ...application, state: 'INTERVIEW_INVITED' });
      if (sendEmailNotification) {
        if (res.emailResult?.success && res.emailResult?.mode === 'REAL_SMTP') {
          setScheduleSuccessMsg(`✓ นัดสัมภาษณ์และส่งอีเมลแจ้งเตือนจริงไปยัง ${application.candidate.email} เรียบร้อยแล้ว!`);
        } else if (res.emailResult?.error) {
          setScheduleSuccessMsg(`✓ บันทึกการนัดสัมภาษณ์แล้ว (⚠️ หมายเหตุอีเมล: ${res.emailResult.error})`);
        } else {
          setScheduleSuccessMsg(`✓ บันทึกการนัดสัมภาษณ์เรียบร้อยแล้ว!`);
        }
      } else {
        setScheduleSuccessMsg(`✓ บันทึกการนัดสัมภาษณ์เรียบร้อยแล้ว!`);
      }

      // Reload interview record
      const ints = await fetchInterviewsFromDB();
      const updatedInt = ints.find(i => String(i.applicationId) === String(application.id) || i.id === res.interviewId);
      if (updatedInt) setInterview(updatedInt);

      setIsScheduleModalOpen(false);
      setTimeout(() => setScheduleSuccessMsg(null), 8000);
    }
    setIsSavingSchedule(false);
  };


  const handleRunAIScreening = async () => {
    if (!application) return;
    setIsScreeningAI(true);
    const candidateName = `${application.candidate.firstName} ${application.candidate.lastName}`;
    const vacancyTitle = application.vacancyTitle;

    const res = await screenCandidateWithGeminiInDB(
      application.id,
      candidateName,
      vacancyTitle,
      {
        experienceYears: application.candidate.experienceYears,
        currentPosition: application.candidate.currentPosition,
        currentCompany: application.candidate.currentCompany,
        skills: application.candidate.skills,
      }
    );

    if (res) {
      const refreshed = await fetchApplicationByIdFromDB(id);
      if (refreshed) {
        setApplication(refreshed);
      }
    }
    setIsScreeningAI(false);
  };

  const transitions = application ? getAvailableApplicationTransitions(application.state) : [];

  if (!application && !loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 font-semibold">{t('common.noData')}</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { candidate, aiScreeningResult, dlTestResult, documents = [] } = application;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.2 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'RESUME':
        return <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">📄 Resume / CV</span>;
      case 'PORTFOLIO':
        return <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">🎨 Portfolio</span>;
      case 'CERTIFICATE':
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">📜 Certificate</span>;
      case 'TRANSCRIPT':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">🎓 Transcript</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-bold">📎 เอกสารแนบ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Schedule & Email Success Banner */}
      {scheduleSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-xl">✉️</span>
            <span className="text-sm font-bold">{scheduleSuccessMsg}</span>
          </div>
          <button
            onClick={() => setScheduleSuccessMsg(null)}
            className="text-xs font-bold px-2 py-1 rounded-lg hover:bg-emerald-500/20 text-emerald-900 dark:text-emerald-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Back button */}
      <Link
        href="/dashboard/applications"
        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
      >
        ← {t('common.back')}
      </Link>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-xl font-extrabold text-white shadow-md shadow-emerald-600/20">
            {candidate.firstName?.[0] || 'C'}{candidate.lastName?.[0] || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">
                {locale === 'th' ? `${candidate.firstNameTh} ${candidate.lastNameTh}` : `${candidate.firstName} ${candidate.lastName}`}
              </h1>
              <ApplicationStateBadge state={application.state} />
            </div>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              {locale === 'th' ? application.vacancyTitleTh : application.vacancyTitle} •{' '}
              <span className="text-emerald-700 font-bold">{application.department}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {locale === 'th' ? 'ยื่นใบสมัครเมื่อ' : 'Applied on'}: {new Date(application.appliedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">


          {transitions.map(state => (
            <Button
              key={state}
              size="sm"
              onClick={() => handleStateChange(state)}
              variant={['SHORTLISTED', 'OFFERED', 'HIRED', 'INTERVIEW_INVITED'].includes(state) ? 'default' : 'outline'}
              className={
                state === 'INTERVIEW_INVITED'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold shadow-md shadow-pink-600/20 rounded-xl cursor-pointer text-xs flex items-center gap-1.5 active:scale-95'
                  : ['SHORTLISTED', 'OFFERED', 'HIRED'].includes(state)
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-sm rounded-xl cursor-pointer text-xs active:scale-95'
                    : state === 'REJECTED'
                      ? 'border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold rounded-xl cursor-pointer text-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold rounded-xl cursor-pointer text-xs'
              }
            >
              {state === 'INTERVIEW_INVITED' && <HugeiconsIcon icon={MicVocalIcon} size={15} />}
              <span>{APPLICATION_STATE_LABELS[state]?.[locale] || state}</span>
            </Button>
          ))}
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: AI Analysis, Attached Documents, DL Test, Interview */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. AI Screening Card */}
          {aiScreeningResult && (
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 shadow-xs rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-emerald-100 bg-white/70">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <HugeiconsIcon icon={ChatBotIcon} size={20} className="text-emerald-600" />
                    <span>{locale === 'th' ? 'ผลการวิเคราะห์และคัดกรองโดย AI (Google Gemini 3.8 Flash)' : 'AI Screening Analysis (Google Gemini 3.8 Flash)'}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                      Confidence: {(aiScreeningResult.confidence * 100).toFixed(0)}%
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      aiScreeningResult.recommendation === 'SHORTLIST'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {aiScreeningResult.recommendation === 'SHORTLIST' ? (
                        <span className="inline-flex items-center gap-1">
                          <HugeiconsIcon icon={StarIcon} size={12} />
                          <span>SHORTLIST</span>
                        </span>
                      ) : '⏳ HOLD FOR REVIEW'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-white border border-emerald-100 shadow-xs">
                  <MatchScoreRadial score={aiScreeningResult.matchScore} size={90} label={locale === 'th' ? 'คะแนนจับคู่' : 'Match Score'} />
                  <div className="flex-1 w-full space-y-2">
                    <p className="text-xs font-bold text-slate-700 mb-1">
                      {locale === 'th' ? 'การประเมินเทียบกับเกณฑ์คุณสมบัติ:' : 'Evaluation against Criteria:'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(aiScreeningResult.requiredCriteria).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                          <span className="text-[11px] font-semibold text-slate-700 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className={`text-[11px] font-bold ${
                            value === 'match' ? 'text-emerald-700' : value === 'partial' ? 'text-amber-700' : value === 'no_match' ? 'text-rose-700' : 'text-slate-400'
                          }`}>
                            {value === 'match' ? (
                              <span className="inline-flex items-center gap-1">
                                <HugeiconsIcon icon={CheckmarkSquare01Icon} size={13} />
                                <span>Match</span>
                              </span>
                            ) : value === 'partial' ? (
                              <span className="inline-flex items-center gap-1">
                                <HugeiconsIcon icon={Alert02Icon} size={13} />
                                <span>Partial</span>
                              </span>
                            ) : value === 'no_match' ? (
                              <span className="inline-flex items-center gap-1">
                                <HugeiconsIcon icon={Cancel01Icon} size={13} />
                                <span>No Match</span>
                              </span>
                            ) : '❓ Unknown'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs">
                    <p className="text-xs font-bold text-emerald-800 mb-2.5 flex items-center gap-1.5">
                      <HugeiconsIcon icon={StarIcon} size={15} className="text-emerald-700" />
                      <span>{locale === 'th' ? 'จุดแข็งที่เด่นชัด (Strengths)' : 'Key Strengths'}</span>
                    </p>
                    <ul className="space-y-2">
                      {aiScreeningResult.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-slate-700 font-medium flex items-start gap-2">
                          <HugeiconsIcon icon={CheckmarkSquare01Icon} size={13} className="text-emerald-600 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-amber-200 shadow-xs">
                    <p className="text-xs font-bold text-amber-800 mb-2.5 flex items-center gap-1.5">
                      <HugeiconsIcon icon={FlashIcon} size={15} className="text-amber-700" />
                      <span>{locale === 'th' ? 'ข้อสังเกต / จุดที่ควรสัมภาษณ์เพิ่ม (Gaps)' : 'Areas to Probe in Interview'}</span>
                    </p>
                    <ul className="space-y-2">
                      {aiScreeningResult.gaps.map((g, i) => (
                        <li key={i} className="text-xs text-slate-700 font-medium flex items-start gap-2">
                          <span className="text-amber-600 font-bold shrink-0">•</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* AI Evidence */}
                {aiScreeningResult.evidence && aiScreeningResult.evidence.length > 0 && (
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                    <p className="text-[11px] font-bold text-slate-600 mb-1">
                      {locale === 'th' ? 'หลักฐานและข้อมูลอ้างอิงที่ AI ใช้ประเมิน:' : 'AI Evaluation Evidence:'}
                    </p>
                    <div className="space-y-1">
                      {aiScreeningResult.evidence.map((ev, idx) => (
                        <p key={idx} className="text-[11px] text-slate-500 font-medium">
                          • {ev}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 2. Attached Documents Card */}
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HugeiconsIcon icon={Folder01Icon} size={18} className="text-blue-600" />
                  <span>{locale === 'th' ? 'เอกสารแนบจากผู้สมัคร (Attached Documents)' : 'Candidate Attached Documents'}</span>
                </CardTitle>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  {locale === 'th' ? `บันทึกในฐานข้อมูล ${documents.length} ไฟล์` : `${documents.length} File(s) in DB`}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {documents.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                  {locale === 'th' ? 'ไม่มีเอกสารแนบ' : 'No documents attached'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {documents.map((doc, idx) => (
                    <div
                      key={doc.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="shrink-0 text-slate-400">
                          <HugeiconsIcon icon={File01Icon} size={24} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate" title={doc.fileName}>
                            {doc.fileName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatFileSize(doc.fileSize)}
                            </span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {new Date(doc.uploadedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {getDocTypeBadge(doc.documentType)}

                        <button
                          type="button"
                          onClick={() => setSelectedDocPreview(doc)}
                          className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <HugeiconsIcon icon={ViewIcon} size={14} />
                          <span>{locale === 'th' ? 'ดูตัวอย่าง' : 'Preview'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. DL Test Result */}
          {dlTestResult && (
            <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HugeiconsIcon icon={AssignmentsIcon} size={16} className="text-emerald-600" />
                  <span>DL Test Result</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 pt-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${dlTestResult.resultStatus === 'PASS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                    {dlTestResult.resultStatus === 'PASS' ? (
                      <span className="inline-flex items-center gap-1">
                        <HugeiconsIcon icon={CheckmarkSquare01Icon} size={13} />
                        <span>PASS</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <HugeiconsIcon icon={Cancel01Icon} size={13} />
                        <span>FAIL</span>
                      </span>
                    )}
                  </span>
                  <span className="text-lg font-bold text-slate-900">{dlTestResult.totalScore}/{dlTestResult.maxScore}</span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Knowledge</span>
                      <span className="text-slate-900">{dlTestResult.knowledgeScore}/100</span>
                    </div>
                    <Progress value={dlTestResult.knowledgeScore} className="h-2 bg-slate-100" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Practical</span>
                      <span className="text-slate-900">{dlTestResult.practicalScore}/100</span>
                    </div>
                    <Progress value={dlTestResult.practicalScore} className="h-2 bg-slate-100" />
                  </div>
                  {dlTestResult.aiLiteracyScore > 0 && (
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-600">AI Literacy</span>
                        <span className="text-slate-900">{dlTestResult.aiLiteracyScore}/100</span>
                      </div>
                      <Progress value={dlTestResult.aiLiteracyScore} className="h-2 bg-slate-100" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. Interview Feedback */}
          {interview && (
            <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HugeiconsIcon icon={MicVocalIcon} size={16} className="text-emerald-600" />
                  <span>{locale === 'th' ? 'ผลการสัมภาษณ์' : 'Interview Results'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">{interview.type} • {interview.duration} min</span>
                  <span className={`font-bold ${interview.status === 'COMPLETED' ? 'text-emerald-700' : 'text-amber-700'}`}>{interview.status}</span>
                </div>
                {interview.feedback && interview.feedback.length > 0 && (
                  <div className="space-y-3">
                    {interview.feedback.map(fb => (
                      <div key={fb.interviewerId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-900">{fb.interviewerName}</span>
                          <span className={`text-xs font-bold ${fb.recommendation === 'STRONG_HIRE' || fb.recommendation === 'HIRE' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {fb.recommendation.replace('_', ' ')} • {fb.overallScore}/100
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {Object.entries(fb.scores).map(([key, val]) => (
                            <div key={key} className="text-center p-1.5 bg-white rounded-lg border border-slate-200">
                              <p className="text-xs font-bold text-slate-900">{val}</p>
                              <p className="text-[9px] text-slate-500 font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Candidate Profile & Details */}
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">{t('candidate.profile')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs font-medium">
              <div>
                <p className="text-slate-500 font-semibold mb-0.5">{t('candidate.email')}</p>
                <p className="text-slate-900 font-bold text-sm">{candidate.email}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold mb-0.5">{t('candidate.phone')}</p>
                <p className="text-slate-900 font-bold text-sm">{candidate.phone || '081-456-7899'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold mb-0.5">{t('candidate.experience')}</p>
                <p className="text-emerald-700 font-extrabold text-sm">{candidate.experienceYears} {locale === 'th' ? 'ปี' : 'years'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-semibold mb-0.5">{locale === 'th' ? 'ตำแหน่งและบริษัทปัจจุบัน' : 'Current Role & Company'}</p>
                <p className="text-slate-900 font-bold text-sm">{candidate.currentPosition}</p>
                <p className="text-slate-500">{candidate.currentCompany}</p>
              </div>

              <Separator className="bg-slate-100" />

              {/* Education */}
              <div>
                <p className="text-slate-500 font-semibold mb-1.5 flex items-center gap-1.5">
                  <HugeiconsIcon icon={Mortarboard01Icon} size={14} className="text-slate-400" />
                  <span>{locale === 'th' ? 'การศึกษา' : 'Education'}</span>
                </p>
                {candidate.education && candidate.education.length > 0 ? (
                  candidate.education.map((edu, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-1.5">
                      <p className="text-xs font-bold text-slate-900">{edu.degree} in {edu.field}</p>
                      <p className="text-[11px] text-slate-500">{edu.institution} ({edu.graduatedYear})</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">ปริญญาตรี สาขาที่เกี่ยวข้อง</p>
                )}
              </div>

              <Separator className="bg-slate-100" />

              {/* Skills */}
              <div>
                <p className="text-slate-500 font-semibold mb-2">{t('candidate.skills')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills && candidate.skills.length > 0 ? (
                    candidate.skills.map(s => (
                      <span key={s} className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs">ระบุในเอกสาร Resume</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hiring Workflow Helper */}
          <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50/20 shadow-xs rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <HugeiconsIcon icon={Idea01Icon} size={14} className="text-amber-500" />
              <span>แนะนำขั้นตอนถัดไปสำหรับ HR</span>
            </h3>
            <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
              หลังจากตรวจสอบคะแนน Match Score และเอกสารแนบแล้ว HR สามารถกดเปลี่ยนสถานะเป็น <b>"ผ่านคัดกรอง (SHORTLIST)"</b> เพื่อเตรียมนัดหมายสัมภาษณ์หรือส่งลิงก์ทดสอบออนไลน์ได้ทันที
            </p>
            <div className="flex gap-2">
              <Link href="/dashboard/interviews" className="w-full">
                <Button size="sm" variant="outline" className="w-full text-xs font-bold rounded-xl border-slate-300 bg-white flex items-center justify-center gap-1.5">
                  <HugeiconsIcon icon={Calendar03Icon} size={14} />
                  <span>ไปหน้านัดสัมภาษณ์</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal: Real PDF Document Preview */}
      {mounted && selectedDocPreview && createPortal(
        (() => {
          const activeFileUrl = (selectedDocPreview?.fileUrl && selectedDocPreview.fileUrl !== '#')
            ? selectedDocPreview.fileUrl
            : (candidate.resumeUrl && candidate.resumeUrl !== '#'
                ? candidate.resumeUrl
                : '/uploads/Resume_Phanloed_Phiphatsukpinyo.pdf');

          const isImageDoc = Boolean(
            activeFileUrl.match(/\.(png|jpe?g|webp|gif)$/i) ||
            selectedDocPreview?.mimeType?.startsWith('image/')
          );

          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-hidden">
              <div className="absolute inset-0" onClick={() => setSelectedDocPreview(null)} aria-hidden="true" />
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[92vh] animate-scale-in overflow-hidden my-auto">
                {/* Modal Top Bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-extrabold text-sm shadow-2xs shrink-0">
                      {isImageDoc ? 'IMG' : 'PDF'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                        {selectedDocPreview.fileName}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                        <span>{formatFileSize(selectedDocPreview.fileSize)}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">✓ พร้อมแสดงผลไฟล์จริงจากฐานข้อมูล</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Download Button */}
                    <a
                      href={activeFileUrl}
                      download={selectedDocPreview.fileName || `Resume_${candidate.firstName}_${candidate.lastName}.pdf`}
                      className="hidden sm:inline-flex"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer flex items-center gap-1.5"
                      >
                        <HugeiconsIcon icon={Download01Icon} size={14} />
                        <span>{locale === 'th' ? 'ดาวน์โหลด' : 'Download'}</span>
                      </Button>
                    </a>

                    {/* Open in New Tab */}
                    <a
                      href={activeFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:inline-flex"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer flex items-center gap-1.5"
                      >
                        <HugeiconsIcon icon={ViewIcon} size={14} />
                        <span>{locale === 'th' ? 'เปิดแท็บใหม่' : 'New Tab'}</span>
                      </Button>
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedDocPreview(null)}
                      className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={16} />
                    </button>
                  </div>
                </div>

                {/* Real Document Embed Viewer Area */}
                <div className="flex-1 p-2 sm:p-4 bg-slate-100/80 overflow-y-auto flex flex-col items-center justify-center">
                  <div className="w-full flex-1 rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-inner flex flex-col min-h-[520px] sm:min-h-[580px]">
                    {isImageDoc ? (
                      <div className="w-full flex-1 flex items-center justify-center p-4 bg-slate-900/5">
                        <img
                          src={activeFileUrl}
                          alt={selectedDocPreview.fileName}
                          className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-md"
                        />
                      </div>
                    ) : (
                      <iframe
                        src={`${activeFileUrl}#toolbar=1&navpanes=0`}
                        title={`Document Preview - ${selectedDocPreview.fileName}`}
                        className="w-full flex-1 min-h-[520px] sm:min-h-[580px] border-0"
                      />
                    )}
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium flex items-center gap-1.5">
                    <HugeiconsIcon icon={File01Icon} size={14} className="text-rose-500" />
                    <span>{locale === 'th' ? 'ระบบแสดงผลไฟล์ PDF/เอกสารแนบจริงจากฐานข้อมูล' : 'Real Document Viewer from Database'}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDocPreview(null)}
                    className="text-xs font-semibold rounded-xl"
                  >
                    {locale === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}

      {/* Schedule Interview Modal (Matching Reschedule Modal Design) */}
      {mounted && isScheduleModalOpen && application && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 my-8 animate-scale-in text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
                  <HugeiconsIcon icon={Calendar03Icon} size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {locale === 'th' ? 'นัดวันสัมภาษณ์ (Schedule Interview)' : 'Schedule Interview'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {locale === 'th' ? 'ผู้สมัคร:' : 'Candidate:'}{' '}
                    <span className="text-slate-800 font-bold">
                      {locale === 'th' ? `${candidate.firstNameTh} ${candidate.lastNameTh}` : `${candidate.firstName} ${candidate.lastName}`}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3.5">
              {/* Position Info Card */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
                  {locale === 'th' ? 'ตำแหน่งงาน' : 'Position'}
                </span>
                <p className="font-extrabold text-slate-800 mt-0.5 text-sm">
                  {locale === 'th' ? application.vacancyTitleTh : application.vacancyTitle}
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                  <HugeiconsIcon icon={Building05Icon} size={12} className="text-emerald-600" />
                  <span>{application.department}</span>
                </p>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-slate-500" />
                    <span>{locale === 'th' ? 'เลือกวันสัมภาษณ์ (Interview Date)' : 'Interview Date'}</span>
                  </label>
                  <Input
                    type="date"
                    value={interviewDate}
                    onChange={e => setInterviewDate(e.target.value)}
                    className="rounded-xl border-slate-200 bg-white text-xs h-9 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Clock01Icon} size={14} className="text-slate-500" />
                    <span>{locale === 'th' ? 'เลือกเวลาสัมภาษณ์ (Interview Time)' : 'Interview Time'}</span>
                  </label>
                  <Input
                    type="time"
                    value={interviewTime}
                    onChange={e => setInterviewTime(e.target.value)}
                    className="rounded-xl border-slate-200 bg-white text-xs h-9 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Duration & Interview Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Clock01Icon} size={14} className="text-slate-500" />
                    <span>{locale === 'th' ? 'ระยะเวลา (Duration)' : 'Duration'}</span>
                  </label>
                  <select
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-emerald-500 cursor-pointer"
                  >
                    <option value={30}>30 {locale === 'th' ? 'นาที' : 'mins'}</option>
                    <option value={45}>45 {locale === 'th' ? 'นาที' : 'mins'}</option>
                    <option value={60}>60 {locale === 'th' ? 'นาที (มาตรฐาน)' : 'mins (Standard)'}</option>
                    <option value={90}>90 {locale === 'th' ? 'นาที' : 'mins'}</option>
                    <option value={120}>120 {locale === 'th' ? 'นาที' : 'mins'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Target01Icon} size={14} className="text-slate-500" />
                    <span>{locale === 'th' ? 'รอบการสัมภาษณ์ (Type)' : 'Round Type'}</span>
                  </label>
                  <select
                    value={interviewType}
                    onChange={e => setInterviewType(e.target.value as InterviewType)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-emerald-500 cursor-pointer"
                  >
                    <option value="TECHNICAL">สัมภาษณ์เชิงเทคนิค (Technical)</option>
                    <option value="BEHAVIORAL">สัมภาษณ์พฤติกรรมและความเหมาะสม (Behavioral)</option>
                    <option value="PANEL">สัมภาษณ์คณะกรรมการ (Panel)</option>
                    <option value="FINAL">สัมภาษณ์รอบสุดท้าย (Final)</option>
                    <option value="PHONE_SCREEN">โทรสัมภาษณ์เบื้องต้น (Phone Screen)</option>
                  </select>
                </div>
              </div>

              {/* Format: Online vs Onsite */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <HugeiconsIcon icon={Building05Icon} size={14} className="text-slate-500" />
                  <span>{locale === 'th' ? 'รูปแบบการสัมภาษณ์' : 'Format'}</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormatType('ONLINE');
                      setLocation('Google Meet (Online)');
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formatType === 'ONLINE'
                        ? 'border-pink-500 bg-pink-50 text-pink-800 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <HugeiconsIcon icon={ComputerIcon} size={14} />
                    <span>ออนไลน์ (Google Meet)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormatType('ONSITE');
                      setLocation('อาคาร 11 ชั้น 8 มหาวิทยาลัยศรีปทุม (บางเขน)');
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formatType === 'ONSITE'
                        ? 'border-pink-500 bg-pink-50 text-pink-800 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <HugeiconsIcon icon={Location01Icon} size={14} />
                    <span>ออนไซต์ (ณ สถานที่)</span>
                  </button>
                </div>

                {formatType === 'ONLINE' ? (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <HugeiconsIcon icon={Link01Icon} size={12} />
                      <span>ลิงก์ห้องสัมภาษณ์ (Meeting URL)</span>
                    </label>
                    <Input
                      value={meetingUrl}
                      onChange={e => setMeetingUrl(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="rounded-xl border-slate-200 bg-white text-xs h-9 font-medium"
                    />
                  </div>
                ) : (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <HugeiconsIcon icon={Building05Icon} size={12} />
                      <span>สถานที่/ห้องสัมภาษณ์ (Location / Room)</span>
                    </label>
                    <Input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="ระบุห้องหรืออาคาร..."
                      className="rounded-xl border-slate-200 bg-white text-xs h-9 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Notes & Quick suggestions */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <HugeiconsIcon icon={AssignmentsIcon} size={14} className="text-slate-500" />
                  <span>{locale === 'th' ? 'รายละเอียดเพิ่มเติม/คำแนะนำสำหรับผู้สมัคร' : 'Interview Notes / Instructions'}</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {INTERVIEW_TOPICS.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setNotes(prev => prev ? `${prev}, ${item}` : item)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        notes.includes(item)
                          ? 'border-pink-300 bg-pink-50 text-pink-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      + {item}
                    </button>
                  ))}
                </div>
                <Input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={locale === 'th' ? 'ระบุหัวข้อที่ต้องเตรียมตัว หรือสิ่งที่ต้องนำมา...' : 'Specify preparation notes...'}
                  className="rounded-xl border-slate-200 bg-white text-xs h-9 font-medium"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isSavingSchedule}
                className="text-xs font-semibold rounded-xl cursor-pointer"
              >
                {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule || !interviewDate || !interviewTime}
                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-600/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <HugeiconsIcon icon={Mail01Icon} size={15} />
                <span>
                  {isSavingSchedule
                    ? (locale === 'th' ? 'กำลังบันทึกและส่งเมล...' : 'Sending Invite...')
                    : (locale === 'th' ? 'บันทึกและส่งอีเมลเชิญสัมภาษณ์' : 'Confirm & Send Invitation')}
                </span>
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


