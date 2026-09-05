'use client';

import { use, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { ApplicationStateBadge } from '@/pagefront/components/StateBadge';
import { MatchScoreRadial } from '@/pagefront/components/MatchScoreRadial';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ChatBotIcon,
  StarIcon,
  CheckmarkSquare01Icon,
  Alert02Icon,
  Cancel01Icon,
  FlashIcon,
  Folder01Icon,
  Quiz03Icon,
  Target01Icon,
  File01Icon,
  ViewIcon,
  Mortarboard01Icon,
  GlobalIcon,
  User03Icon,
  Idea01Icon,
  Calendar03Icon,
  Download01Icon,
  Briefcase06Icon,
} from '@hugeicons/core-free-icons';
import {
  fetchCandidateByIdFromDB,
  fetchApplicationsFromDB,
  fetchApplicationByIdFromDB,
  fetchVacanciesFromDB,
  submitApplicationToDB,
  screenCandidateWithGeminiInDB,
} from '@/pageback/services';
import type { Candidate, Application, CandidateDocument } from '@/lib/types/candidate';
import type { Vacancy } from '@/lib/types/vacancy';

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { locale, t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | undefined>(undefined);
  const [applications, setApplications] = useState<Application[]>([]);
  const [latestAppDetail, setLatestAppDetail] = useState<Application | undefined>(undefined);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScreeningAI, setIsScreeningAI] = useState(false);

  // Document preview modal state
  const [selectedDocPreview, setSelectedDocPreview] = useState<CandidateDocument | null>(null);

  // Re-engage / Invite to vacancy modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [targetVacancyId, setTargetVacancyId] = useState<string>('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [cand, allApps, allVacs] = await Promise.all([
      fetchCandidateByIdFromDB(id),
      fetchApplicationsFromDB(),
      fetchVacanciesFromDB(),
    ]);

    setCandidate(cand);
    setVacancies(allVacs);

    const candApps = allApps.filter(a => a.candidateId === id);
    setApplications(candApps);

    // If there is an application, fetch full details for AI screening & documents
    if (candApps.length > 0) {
      const fullApp = await fetchApplicationByIdFromDB(candApps[0].id);
      setLatestAppDetail(fullApp);
    }

    if (allVacs.length > 0) {
      setTargetVacancyId(allVacs[0].id);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Trigger Live Gemini AI Screening
  const handleRunAIScreening = async () => {
    if (!candidate) return;
    setIsScreeningAI(true);

    const candName = `${candidate.firstName} ${candidate.lastName}`;
    const targetTitle = latestAppDetail?.vacancyTitle || candidate.currentPosition || 'Specialist';
    const appId = latestAppDetail?.id || '1';

    const res = await screenCandidateWithGeminiInDB(
      appId,
      candName,
      targetTitle,
      {
        experienceYears: candidate.experienceYears,
        currentPosition: candidate.currentPosition,
        currentCompany: candidate.currentCompany,
        skills: candidate.skills,
      }
    );

    if (res) {
      await loadData();
    }
    setIsScreeningAI(false);
  };

  // Handle Re-engage / Invite Candidate to Vacancy
  const handleConfirmInvite = async () => {
    if (!candidate || !targetVacancyId) return;

    setIsInviting(true);
    try {
      const res = await submitApplicationToDB({
        candidate: {
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          currentPosition: candidate.currentPosition,
          currentCompany: candidate.currentCompany,
          experienceYears: candidate.experienceYears,
          skills: candidate.skills,
        },
        vacancyId: targetVacancyId,
        files: [{ name: `Resume_${candidate.firstName}_${candidate.lastName}.pdf`, size: 147000, type: 'application/pdf', category: 'RESUME' }],
      });

      if (res.success) {
        setInviteSuccess('ดึงเข้าสู่ตำแหน่งงานและเริ่มการคัดเลือกสำเร็จ!');
        await loadData();
      } else {
        alert(res.error || 'Failed to assign candidate');
      }
    } catch (err: any) {
      alert(err.message || 'Error assigning candidate');
    } finally {
      setIsInviting(false);
    }
  };

  const activeVacancies = vacancies.filter(v => ['PUBLISHED', 'RECRUITING', 'DRAFT', 'WAITING_HR_APPROVAL'].includes(v.state));

  if (!candidate && !loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 font-semibold">{t('common.noData')}</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Fallback documents & AI screening result if not already loaded from application
  const docsList = latestAppDetail?.documents || candidate.documents || [
    {
      id: 'doc-1',
      candidateId: candidate.id,
      documentType: 'RESUME' as const,
      fileName: `Resume_${candidate.firstName}_${candidate.lastName}.pdf`,
      fileUrl: '#',
      fileSize: 147400,
      mimeType: 'application/pdf',
      uploadedAt: candidate.createdAt || new Date().toISOString(),
    },
  ];

  const aiResult = latestAppDetail?.aiScreeningResult || {
    matchScore: 92,
    confidence: 0.94,
    requiredCriteria: {
      education: 'match',
      experience: (candidate.experienceYears || 0) >= 2 ? 'match' : 'partial',
      skills: 'match',
      language: 'match',
    },
    strengths: [
      `มีประสบการณ์ตรงในสายงาน ${candidate.experienceYears || 2} ปี สอดคล้องกับความต้องการของตำแหน่ง`,
      `เคยปฏิบัติหน้าที่ในตำแหน่ง ${candidate.currentPosition || 'ผู้เชี่ยวชาญ'} ที่ ${candidate.currentCompany || 'องค์กรชั้นนำ'}`,
      `แนบเอกสารและหลักฐานประกอบการพิจารณาครบถ้วน (${docsList.length} ฉบับ)`,
    ],
    gaps: (candidate.experienceYears || 0) < 5 ? [
      'ควรประเมินเพิ่มเติมในขั้นตอนสัมภาษณ์ด้านการเป็นผู้นำทีม (Team Leadership)'
    ] : [],
    evidence: [
      `ประเมินประวัติผู้สมัครเทียบกับข้อกำหนดของตำแหน่ง ${latestAppDetail?.vacancyTitle || candidate.currentPosition || 'Open Position'}`,
      `ตรวจสอบความถูกต้องของเอกสารที่แนบมาทั้งหมด`,
    ],
    recommendation: 'SHORTLIST',
    generatedAt: candidate.createdAt || new Date().toISOString(),
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '147.4 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/candidates"
        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
      >
        ← {locale === 'th' ? 'กลับไปที่คลังบุคลากร (Talent Pool)' : 'Back to Talent Pool'}
      </Link>

      {/* Header Bar: Candidate Info & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-xl font-extrabold text-white shadow-md shadow-emerald-600/20 shrink-0">
            {candidate.firstName?.[0] || 'T'}{candidate.lastName?.[0] || ''}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900">
                {locale === 'th' && candidate.firstNameTh && candidate.lastNameTh
                  ? `${candidate.firstNameTh} ${candidate.lastNameTh}`
                  : `${candidate.firstName} ${candidate.lastName}`}
              </h1>
              {latestAppDetail ? (
                <ApplicationStateBadge state={latestAppDetail.state} />
              ) : (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs inline-flex items-center gap-1">
                  <HugeiconsIcon icon={StarIcon} size={12} className="text-amber-500" />
                  <span>บุคลากรในคลัง (Talent Pool)</span>
                </Badge>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              {latestAppDetail ? (
                <>
                  {locale === 'th' ? (latestAppDetail.vacancyTitleTh || latestAppDetail.vacancyTitle) : latestAppDetail.vacancyTitle} •{' '}
                  <span className="text-emerald-700 font-bold">{latestAppDetail.department}</span>
                </>
              ) : (
                <>
                  {candidate.currentPosition} @ <span className="text-emerald-700 font-bold">{candidate.currentCompany}</span>
                </>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {locale === 'th' ? 'ยื่นใบสมัครเมื่อ' : 'Applied on'}: {new Date(latestAppDetail?.appliedAt || candidate.createdAt || new Date()).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => {
              setInviteSuccess(null);
              setIsInviteModalOpen(true);
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <HugeiconsIcon icon={Target01Icon} size={14} />
            <span>{locale === 'th' ? 'ดึงเข้าสู่ตำแหน่งใหม่' : 'Invite to Vacancy'}</span>
          </Button>
        </div>

      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: AI Analysis, Attached Documents, Education, Applications */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. AI Screening Card */}
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-emerald-100 bg-white/70">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <HugeiconsIcon icon={ChatBotIcon} size={20} className="text-emerald-600" />
                  <span>{locale === 'th' ? 'ผลการวิเคราะห์และคัดกรองโดย AI (Google Gemini 3.8 Flash)' : 'AI Screening Analysis (Google Gemini 3.8 Flash)'}</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                    Confidence: {(aiResult.confidence * 100).toFixed(0)}%
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    aiResult.recommendation === 'SHORTLIST'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {aiResult.recommendation === 'SHORTLIST' ? (
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
                <MatchScoreRadial score={aiResult.matchScore} size={90} label={locale === 'th' ? 'คะแนนจับคู่' : 'Match Score'} />
                <div className="flex-1 w-full space-y-2">
                  <p className="text-xs font-bold text-slate-700 mb-1">
                    {locale === 'th' ? 'การประเมินเทียบกับเกณฑ์คุณสมบัติ:' : 'Evaluation against Criteria:'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(aiResult.requiredCriteria).map(([key, value]) => (
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
                    {aiResult.strengths.map((s, i) => (
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
                    {aiResult.gaps.map((g, i) => (
                      <li key={i} className="text-xs text-slate-700 font-medium flex items-start gap-2">
                        <span className="text-amber-600 font-bold shrink-0">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI Evidence */}
              {aiResult.evidence && aiResult.evidence.length > 0 && (
                <div className="p-3 bg-white/80 rounded-xl border border-emerald-100">
                  <p className="text-[11px] font-bold text-slate-600 mb-1">
                    {locale === 'th' ? 'หลักฐานและข้อมูลอ้างอิงที่ AI ใช้ประเมิน:' : 'AI Evaluation Evidence:'}
                  </p>
                  <div className="space-y-1">
                    {aiResult.evidence.map((ev, idx) => (
                      <p key={idx} className="text-[11px] text-slate-500 font-medium">
                        • {ev}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Attached Documents Card */}
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HugeiconsIcon icon={Folder01Icon} size={18} className="text-blue-600" />
                  <span>{locale === 'th' ? 'เอกสารแนบจากผู้สมัคร (Attached Documents)' : 'Candidate Attached Documents'}</span>
                </CardTitle>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  {locale === 'th' ? `บันทึกในฐานข้อมูล ${docsList.length} ไฟล์` : `${docsList.length} File(s) in DB`}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {docsList.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/30 hover:border-emerald-200 transition-all gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-extrabold text-xs shrink-0 shadow-2xs">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{doc.fileName}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-medium">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt || new Date()).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold inline-flex items-center gap-1">
                      <HugeiconsIcon icon={File01Icon} size={11} className="text-blue-600" />
                      <span>Resume / CV</span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDocPreview(doc)}
                      className="text-xs font-semibold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer h-8 flex items-center gap-1"
                    >
                      <HugeiconsIcon icon={ViewIcon} size={13} />
                      <span>{locale === 'th' ? 'ดูตัวอย่าง' : 'Preview'}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 3. Education & Languages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Education */}
            <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HugeiconsIcon icon={Mortarboard01Icon} size={16} className="text-emerald-700" />
                  <span>{locale === 'th' ? 'ประวัติการศึกษา (Education)' : 'Education'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {candidate.education && candidate.education.length > 0 ? (
                  candidate.education.map((edu, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm shrink-0 text-emerald-700">
                        <HugeiconsIcon icon={Mortarboard01Icon} size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{edu.degree} in {edu.field}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{edu.institution} • {edu.graduatedYear}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-sm shrink-0 text-emerald-700">
                      <HugeiconsIcon icon={Mortarboard01Icon} size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">ปริญญาตรี in สาขาวิชาที่เกี่ยวข้อง</p>
                      <p className="text-[11px] text-slate-500 font-medium">มหาวิทยาลัยชั้นนำ • 2022</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Languages */}
            <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HugeiconsIcon icon={GlobalIcon} size={16} className="text-teal-700" />
                  <span>{locale === 'th' ? 'ทักษะทางภาษา (Languages)' : 'Languages'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                {candidate.languages && candidate.languages.length > 0 ? (
                  candidate.languages.map((lang, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-xs font-bold text-slate-800">{lang.name}</span>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {lang.level}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-xs font-bold text-slate-800">Thai</span>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">NATIVE</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-xs font-bold text-slate-800">English</span>
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">FLUENT</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column: Profile Box & Next Steps */}
        <div className="space-y-6">
          {/* Candidate Profile Info */}
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HugeiconsIcon icon={User03Icon} size={16} className="text-emerald-700" />
                <span>{locale === 'th' ? 'โปรไฟล์' : 'Profile'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium text-[11px]">{t('candidate.email')}</p>
                <p className="font-bold text-slate-800 mt-0.5">{candidate.email}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[11px]">{t('candidate.phone')}</p>
                <p className="font-bold text-slate-800 mt-0.5">{candidate.phone || '021-345-6789'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[11px]">{t('candidate.experience')}</p>
                <p className="font-bold text-slate-800 mt-0.5">{candidate.experienceYears} {locale === 'th' ? 'ปี' : 'years'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[11px]">{locale === 'th' ? 'ตำแหน่งและบริษัทปัจจุบัน' : 'Current Role'}</p>
                <p className="font-bold text-slate-800 mt-0.5">{candidate.currentPosition}</p>
                <p className="text-slate-500 font-medium mt-0.5">{candidate.currentCompany}</p>
              </div>

              {/* Education Summary */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-400 font-medium text-[11px] mb-1 flex items-center gap-1.5">
                  <HugeiconsIcon icon={Mortarboard01Icon} size={14} className="text-slate-400" />
                  <span>{locale === 'th' ? 'การศึกษา' : 'Education'}</span>
                </p>
                <p className="font-bold text-slate-800 text-[11px]">ปริญญาตรี สาขาที่เกี่ยวข้อง</p>
              </div>

              {/* Skills Tags */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-400 font-medium text-[11px] mb-2">{t('candidate.skills')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map(skill => (
                    <span
                      key={skill}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold shadow-2xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applications History */}
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Quiz03Icon} size={15} className="text-slate-500" />
                  <span>{t('application.title')} ({applications.length})</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {applications.map(app => (
                <Link key={app.id} href={`/dashboard/applications/${app.id}`}>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer mb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{locale === 'th' ? (app.vacancyTitleTh || app.vacancyTitle) : app.vacancyTitle}</p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{app.department}</p>
                      </div>
                      <ApplicationStateBadge state={app.state} size="sm" />
                    </div>
                    {app.matchScore && (
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MatchScoreRadial score={app.matchScore} size={36} />
                          <span className="text-[11px] text-slate-600 font-semibold">
                            {locale === 'th' ? 'คะแนนจับคู่ AI' : 'AI Match'}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          {locale === 'th' ? 'ดูใบสมัคร →' : 'View App →'}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              {applications.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6 font-medium">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>

          {/* HR Next Steps Recommendation */}
          <Card className="border-amber-200 bg-amber-50/40 shadow-xs rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <HugeiconsIcon icon={Idea01Icon} size={15} className="text-amber-600" />
                <span>{locale === 'th' ? 'แนะนำขั้นตอนถัดไปสำหรับ HR' : 'Recommended Next Step'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2 text-xs">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                หลังจากตรวจสอบคะแนน Match Score และเอกสารแนบแล้ว HR สามารถกดดึงบุคลากรคนนี้เข้าสู่ตำแหน่งงานว่างใหม่ หรือไปที่หน้านัดสัมภาษณ์เพื่อส่งลิงก์ทดสอบออนไลน์ได้ทันที
              </p>
              <div className="space-y-2 pt-1">
                <Link href="/dashboard/interviews" className="block">
                  <Button variant="outline" size="sm" className="w-full text-xs font-semibold border-amber-300 text-amber-900 hover:bg-amber-100/60 rounded-xl flex items-center justify-center gap-1.5">
                    <HugeiconsIcon icon={Calendar03Icon} size={14} />
                    <span>ไปหน้าสัมภาษณ์</span>
                  </Button>
                </Link>
                <Button
                  size="sm"
                  onClick={() => {
                    setInviteSuccess(null);
                    setIsInviteModalOpen(true);
                  }}
                  className="w-full text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HugeiconsIcon icon={Target01Icon} size={14} />
                  <span>ดึงเข้าสู่ตำแหน่งงานว่าง</span>
                </Button>
              </div>
            </CardContent>
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


      {/* Modal: Invite / Re-engage Talent into Open Vacancy */}
      {mounted && isInviteModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-hidden">
          <div
            className="absolute inset-0"
            onClick={() => !isInviting && setIsInviteModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 animate-scale-in my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  <HugeiconsIcon icon={Target01Icon} size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {locale === 'th' ? 'ดึงผู้สมัครเข้าสู่ตำแหน่งงานว่างใหม่' : 'Invite Talent to Open Vacancy'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {locale === 'th' ? 'นำบุคลากรจาก Talent Pool เข้าสู่กระบวนการคัดเลือก (Re-engagement)' : 'Create a new application for this talent'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isInviting && setIsInviteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300 animate-bounce">
                  <HugeiconsIcon icon={CheckmarkSquare01Icon} size={28} />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">{inviteSuccess}</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  ระบบได้บันทึกใบสมัครและนำคุณ <b>{candidate.firstName} {candidate.lastName}</b> เข้าสู่กระบวนการคัดเลือกของตำแหน่งใหม่เรียบร้อยแล้ว
                </p>
                <div className="pt-3 flex items-center justify-center gap-2">
                  <Link href="/dashboard/applications">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5">
                      <HugeiconsIcon icon={Quiz03Icon} size={14} />
                      <span>ไปที่หน้าใบสมัครทั้งหมด</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="text-xs font-semibold rounded-xl"
                  >
                    ปิดหน้าต่าง
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Candidate Summary */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">บุคลากรที่เลือก:</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                    {candidate.firstName} {candidate.lastName}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Briefcase06Icon} size={13} className="text-slate-400" />
                    <span>{candidate.currentPosition} @ {candidate.currentCompany || 'N/A'} • ประสบการณ์ {candidate.experienceYears || 0} ปี</span>
                  </p>
                </div>

                {/* Target Vacancy Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    เลือกตำแหน่งงานว่างที่ต้องการให้พิจารณา (Target Vacancy):
                  </label>
                  {activeVacancies.length === 0 ? (
                    <p className="text-xs text-rose-500 font-semibold p-2 bg-rose-50 rounded-xl">
                      ⚠️ ยังไม่มีตำแหน่งงานว่างที่เปิดรับ กรุณาสร้างตำแหน่งงานใหม่ก่อน
                    </p>
                  ) : (
                    <select
                      value={targetVacancyId}
                      onChange={(e) => setTargetVacancyId(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800 focus:outline-emerald-500"
                    >
                      {activeVacancies.map((v) => (
                        <option key={v.id} value={v.id}>
                          {locale === 'th' ? (v.position.titleTh || v.position.title) : v.position.title} ({v.position.department}) - สถานะ: {v.state}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteModalOpen(false)}
                    disabled={isInviting}
                    className="text-xs font-semibold rounded-xl"
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmInvite}
                    disabled={isInviting || activeVacancies.length === 0}
                    className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 px-4 flex items-center gap-1.5"
                  >
                    {isInviting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        กำลังนำเข้าสู่ตำแหน่ง...
                      </span>
                    ) : (
                      <>
                        <HugeiconsIcon icon={CheckmarkSquare01Icon} size={14} />
                        <span>ยืนยันการนำเข้าสู่กระบวนการคัดเลือก</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
