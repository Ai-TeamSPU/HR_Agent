'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { MatchScoreRadial } from '@/pagefront/components/MatchScoreRadial';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChatBotIcon, Search01Icon, Quiz03Icon } from '@hugeicons/core-free-icons';
import { supabase } from '@/lib/supabase';

import {
  generateJobDescription,
  matchCandidate,
  createVacancyInDB,
  updateVacancyStateInDB,
  fetchVacanciesFromDB,
  fetchCandidatesFromDB,
  fetchAIRecommendationsFromDB,
  createNotificationInDB,
} from '@/pageback/services';
import type { AIJDGenerationResponse, AICandidateMatchResponse, AIRecommendation } from '@/lib/types/ai';
import type { Vacancy } from '@/lib/types/vacancy';
import type { Candidate } from '@/lib/types/candidate';

export default function AIAgentPage() {
  const { locale, t } = useLocale();
  const [jdResult, setJdResult] = useState<AIJDGenerationResponse | null>(null);
  const [matchResult, setMatchResult] = useState<AICandidateMatchResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvedVacancyId, setApprovedVacancyId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Input states
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [salaryMin, setSalaryMin] = useState('40000');
  const [salaryMax, setSalaryMax] = useState('75000');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editResponsibilities, setEditResponsibilities] = useState('');
  const [editRequirements, setEditRequirements] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editSalaryMin, setEditSalaryMin] = useState('40000');
  const [editSalaryMax, setEditSalaryMax] = useState('75000');

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills([...selectedSkills, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  // Matcher states
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedVacancyId, setSelectedVacancyId] = useState('');

  useEffect(() => {
    async function loadData() {
      const [vList, cList, rList] = await Promise.all([
        fetchVacanciesFromDB(),
        fetchCandidatesFromDB(),
        fetchAIRecommendationsFromDB(),
      ]);
      setVacancies(vList);
      setCandidates(cList);
      setRecommendations(rList);
      if (vList.length > 0) setSelectedVacancyId(vList[0].id);
      if (cList.length > 0) setSelectedCandidateId(cList[0].id);
    }
    loadData();
  }, []);


  const handleGenerateJD = async () => {
    setIsGenerating(true);
    setApprovedVacancyId(null);
    setIsPublished(false);
    setIsEditing(false);

    const posTitle = selectedPosition || 'ผู้จัดการฝ่ายขาย';
    const deptTitle = selectedDepartment || 'ฝ่ายการตลาด';
    const sMin = Number(salaryMin) || 40000;
    const sMax = Number(salaryMax) || 75000;

    const result = await generateJobDescription(posTitle, deptTitle, {
      customSkills: selectedSkills,
      salaryMin: sMin,
      salaryMax: sMax,
    });

    setJdResult(result);
    setEditTitle(locale === 'th' ? result.jobTitleTh : result.jobTitle);
    setEditSummary(locale === 'th' ? result.summaryTh : result.summary);
    setEditResponsibilities((locale === 'th' ? result.responsibilitiesTh : result.responsibilities).join('\n'));
    setEditRequirements((locale === 'th' ? result.requirementsTh : result.requirements).join('\n'));
    setEditSkills(result.preferredSkills || selectedSkills);
    setEditSalaryMin(String(result.salaryMin || sMin));
    setEditSalaryMax(String(result.salaryMax || sMax));

    setIsGenerating(false);

    // บันทึกลงตาราง vacancies และ job_descriptions ในสถานะ DRAFT ทันที เพื่อให้ไปแสดงในหน้า "ตำแหน่งว่าง" (หมวด DRAFT)
    try {
      const draftRes = await createVacancyInDB({
        title: result.jobTitle || posTitle,
        titleTh: result.jobTitleTh || posTitle,
        department: deptTitle,
        departmentTh: deptTitle,
        headcount: 1,
        priority: 'MEDIUM',
        reason: 'NEW_POSITION',
        reasonDetail: 'ร่างโดย AI Agent (สถานะ DRAFT)',
        generateAIJD: false,
      });

      if (draftRes.success && draftRes.vacancyId) {
        setApprovedVacancyId(draftRes.vacancyId);

        // บันทึกเนื้อหา JD ลงตาราง job_descriptions
        const numVacId = Number(draftRes.vacancyId);
        await supabase.from('job_descriptions').insert({
          vacancy_id: isNaN(numVacId) ? 1 : numVacId,
          version: 1,
          job_title: result.jobTitle,
          job_title_th: result.jobTitleTh,
          summary: result.summary,
          summary_th: result.summaryTh,
          responsibilities: result.responsibilities,
          responsibilities_th: result.responsibilitiesTh,
          requirements: result.requirements,
          requirements_th: result.requirementsTh,
          preferred_skills: result.preferredSkills || selectedSkills,
          education: result.education,
          experience: result.experience,
          benefits: result.benefits,
          benefits_th: result.benefitsTh,
          salary_min: sMin,
          salary_max: sMax,
          salary_currency: 'THB',
          generated_by_ai: true,
          ai_model_version: result.modelVersion || 'claude-opus-5',
          ai_confidence: result.confidence || 0.96,
        });

        // ส่งการแจ้งเตือน
        await createNotificationInDB({
          title: 'AI Job Description Drafted',
          titleTh: '📝 JD ร่างเสร็จแล้ว (บันทึกเป็น DRAFT)',
          message: `Job Description for "${result.jobTitleTh || result.jobTitle}" is saved as DRAFT in Vacancies page`,
          messageTh: `ตำแหน่งงาน "${result.jobTitleTh || result.jobTitle}" ถูกบันทึกลงหน้าตำแหน่งว่างในหมวด DRAFT แล้ว รอ HR ตรวจสอบและอนุมัติ`,
          type: 'INFO',
          actionUrl: `/dashboard/vacancies/${draftRes.vacancyId}`,
        });
      }
    } catch (saveErr) {
      console.warn('Auto save draft vacancy warning:', saveErr);
    }
  };

  const handleSaveEdit = () => {
    if (!jdResult) return;
    const respList = editResponsibilities.split('\n').filter(s => s.trim().length > 0);
    const reqList = editRequirements.split('\n').filter(s => s.trim().length > 0);

    setJdResult({
      ...jdResult,
      jobTitle: editTitle,
      jobTitleTh: editTitle,
      summary: editSummary,
      summaryTh: editSummary,
      responsibilities: respList,
      responsibilitiesTh: respList,
      requirements: reqList,
      requirementsTh: reqList,
      preferredSkills: editSkills,
      salaryMin: Number(editSalaryMin) || 40000,
      salaryMax: Number(editSalaryMax) || 75000,
    });
    setIsEditing(false);
  };

  const handleApproveJD = async () => {
    if (!jdResult) return;
    setIsApproving(true);

    const title = editTitle || jdResult.jobTitleTh || jdResult.jobTitle;
    const dept = selectedDepartment || 'ฝ่ายการตลาด';

    let targetVacancyId = approvedVacancyId;

    if (!targetVacancyId) {
      const res = await createVacancyInDB({
        title: title,
        titleTh: title,
        department: dept,
        departmentTh: dept,
        headcount: 1,
        priority: 'MEDIUM',
        reason: 'NEW_POSITION',
        reasonDetail: 'สร้างและอนุมัติผ่านระบบ AI Agent',
        generateAIJD: false,
      });
      if (res.success && res.vacancyId) {
        targetVacancyId = res.vacancyId;
        setApprovedVacancyId(res.vacancyId);
      }
    }

    if (targetVacancyId) {
      // เปลี่ยนสถานะเป็น APPROVED
      await updateVacancyStateInDB(targetVacancyId, 'APPROVED');

      // อัปเดตเนื้อหา JD ล่าสุดที่อาจถูกแก้ไข
      const numVacId = Number(targetVacancyId);
      const respList = editResponsibilities.split('\n').filter(s => s.trim().length > 0);
      const reqList = editRequirements.split('\n').filter(s => s.trim().length > 0);

      await supabase.from('job_descriptions').update({
        job_title: title,
        job_title_th: title,
        summary: editSummary,
        summary_th: editSummary,
        responsibilities: respList,
        responsibilities_th: respList,
        requirements: reqList,
        requirements_th: reqList,
        preferred_skills: editSkills,
        salary_min: Number(editSalaryMin) || 40000,
        salary_max: Number(editSalaryMax) || 75000,
      }).eq('vacancy_id', isNaN(numVacId) ? 1 : numVacId);

      // ส่งการแจ้งเตือน
      try {
        await createNotificationInDB({
          title: 'JD Approved',
          titleTh: '✅ อนุมัติ Job Description สำเร็จ',
          message: `Job Description for "${title}" has been approved by HR`,
          messageTh: `Job Description ตำแหน่ง "${title}" ได้รับการอนุมัติแล้ว พร้อมประกาศรับสมัคร`,
          type: 'SUCCESS',
          actionUrl: `/dashboard/vacancies/${targetVacancyId}`,
        });
      } catch (notifErr) {
        console.warn('Error creating notification in handleApproveJD:', notifErr);
      }
    } else {
      alert('บันทึก JD ไม่สำเร็จ');
    }

    setIsApproving(false);
  };

  const handlePublishNow = async () => {
    if (!approvedVacancyId) return;
    const ok = await updateVacancyStateInDB(approvedVacancyId, 'PUBLISHED');
    if (ok) {
      setIsPublished(true);

      // ส่งการแจ้งเตือนเมื่อประกาศรับสมัครสำเร็จ
      try {
        await createNotificationInDB({
          title: 'Vacancy Published',
          titleTh: '🚀 ประกาศรับสมัครงานสำเร็จ',
          message: `Vacancy #${approvedVacancyId} is now live on the career portal`,
          messageTh: `ตำแหน่งงานรหัส #${approvedVacancyId} เปิดรับสมัครบนหน้าเว็บเรียบร้อยแล้ว`,
          type: 'SUCCESS',
          actionUrl: `/jobs`,
        });
      } catch (notifErr) {
        console.warn('Error creating notification in handlePublishNow:', notifErr);
      }
    }
  };

  const handleMatch = async () => {
    setIsMatching(true);
    const candidateObj = candidates.find(c => c.id === selectedCandidateId) || candidates[0];
    const vacancyObj = vacancies.find(v => v.id === selectedVacancyId) || vacancies[0];

    const result = await matchCandidate(
      candidateObj ? `${candidateObj.firstName} ${candidateObj.lastName}` : 'Candidate',
      vacancyObj ? (vacancyObj.position.titleTh || vacancyObj.position.title) : 'Target Position',
      {
        skills: candidateObj?.skills,
        experienceYears: candidateObj?.experienceYears,
        currentPosition: candidateObj?.currentPosition,
      }
    );

    setMatchResult(result);
    setIsMatching(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5 sm:gap-3">
          <HugeiconsIcon icon={ChatBotIcon} size={28} className="text-pink-600 dark:text-pink-400 shrink-0" />
          <span>{t('ai.title')}</span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {locale === 'th'
            ? 'ระบบ AI Agent (Claude) ช่วยร่าง Job Description, วิเคราะห์จับคู่ผู้สมัคร และอนุมัติเปิดรับสมัคร'
            : 'AI Agent (Claude) generates JDs, matches candidates, and automates hiring'}
        </p>
      </div>

      <Tabs defaultValue="jd" className="space-y-4">
        <TabsList className="flex flex-wrap sm:inline-flex bg-slate-100 border border-slate-200 p-1 rounded-xl h-auto gap-1">
          <TabsTrigger value="jd" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs font-bold text-xs cursor-pointer py-1.5 px-3">
            📝 {t('ai.jdGenerator')}
          </TabsTrigger>
          <TabsTrigger value="match" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs font-bold text-xs cursor-pointer py-1.5 px-3">
            🎯 {t('ai.candidateMatcher')}
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs font-bold text-xs cursor-pointer py-1.5 px-3">
            ⭐ {t('ai.recommendations')}
          </TabsTrigger>
        </TabsList>

        {/* 1. JD Generator */}
        <TabsContent value="jd" className="space-y-4">
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">{locale === 'th' ? 'สร้าง Job Description ด้วย Claude' : 'Generate JD with Claude AI'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">{locale === 'th' ? 'ชื่อตำแหน่ง' : 'Position Title'}</label>
                  <Input
                    value={selectedPosition}
                    onChange={e => setSelectedPosition(e.target.value)}
                    placeholder="เช่น ผู้จัดการฝ่ายขาย, Senior AI Engineer, นักบัญชี"
                    className="bg-white border-slate-200 text-slate-900 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">{locale === 'th' ? 'แผนก' : 'Department'}</label>
                  <Input
                    value={selectedDepartment}
                    onChange={e => setSelectedDepartment(e.target.value)}
                    placeholder="เช่น การตลาด, Engineering, การเงินและบัญชี"
                    className="bg-white border-slate-200 text-slate-900 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* Skills & Tech Stack Input */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>🎯 {locale === 'th' ? 'ทักษะ & Skills ที่ต้องการเน้น (Skills / Tech Stack)' : 'Required Skills & Tech Stack'}</span>
                  <span className="text-[11px] font-normal text-slate-500">{selectedSkills.length} ทักษะที่เลือก</span>
                </label>

                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addSkill(skillInput);
                      }
                    }}
                    placeholder={locale === 'th' ? 'พิมพ์ทักษะแล้วกด Enter เช่น React, SQL, ปิดงบการเงิน' : 'Type skill & press Enter'}
                    className="bg-white border-slate-200 text-slate-900 rounded-xl text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addSkill(skillInput)}
                    className="shrink-0 bg-white border-slate-300 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    + {locale === 'th' ? 'เพิ่มทักษะ' : 'Add'}
                  </Button>
                </div>

                {/* Selected Skills Chips */}
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedSkills.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-red-600 ml-1 text-xs font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Skill Suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-600 self-center mr-1">
                    {locale === 'th' ? 'ทักษะแนะนำ:' : 'Suggestions:'}
                  </span>
                  {[
                    'React', 'TypeScript', 'Node.js', 'Python', 'SQL',
                    'ปิดงบการเงิน', 'วางแผนภาษี', 'ERP / SAP', 'Project Management',
                    'Digital Marketing', 'Data Analysis', 'Sales Strategy',
                  ].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      disabled={selectedSkills.includes(s)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        selectedSkills.includes(s)
                          ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-500 hover:text-emerald-700'
                      }`}
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salary Range Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">
                    💰 {locale === 'th' ? 'ฐานเงินเดือนเริ่มต้น (Min Salary - บาท)' : 'Min Salary (THB)'}
                  </label>
                  <Input
                    type="number"
                    value={salaryMin}
                    onChange={e => setSalaryMin(e.target.value)}
                    placeholder="40000"
                    className="bg-white border-slate-200 text-slate-900 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 mb-1 block">
                    💰 {locale === 'th' ? 'ฐานเงินเดือนสูงสุด (Max Salary - บาท)' : 'Max Salary (THB)'}
                  </label>
                  <Input
                    type="number"
                    value={salaryMax}
                    onChange={e => setSalaryMax(e.target.value)}
                    placeholder="75000"
                    className="bg-white border-slate-200 text-slate-900 rounded-xl font-bold"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerateJD}
                disabled={isGenerating}
                className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    {locale === 'th' ? 'Claude กำลังร่าง JD ตามทักษะและเงินเดือน...' : 'Claude Generating...'}
                  </span>
                ) : (
                  `🤖 ${locale === 'th' ? 'สร้าง JD อัจฉริยะ (Claude AI)' : 'Generate JD with AI'}`
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Approved Banner */}
          {approvedVacancyId && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-xs">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    {locale === 'th' ? '🎉 อนุมัติและบันทึก Job Description เรียบร้อยแล้ว!' : '🎉 JD Approved and Saved Successfully!'}
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {isPublished
                      ? (locale === 'th' ? '✅ ประกาศรับสมัครในหน้าเว็บ Career Portal เรียบร้อยแล้ว' : '✅ Published to Careers portal')
                      : (locale === 'th' ? 'สถานะ: อนุมัติแล้ว (APPROVED) — พร้อมประกาศรับสมัคร' : 'Status: APPROVED — Ready to publish')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isPublished && (
                  <Button
                    size="sm"
                    onClick={handlePublishNow}
                    className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                  >
                    🚀 {locale === 'th' ? 'กดประกาศรับสมัครทันที' : 'Publish Now'}
                  </Button>
                )}
                <Link href={`/dashboard/vacancies/${approvedVacancyId}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-100 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <HugeiconsIcon icon={Search01Icon} size={14} />
                    <span>{locale === 'th' ? 'ดูตำแหน่งนี้' : 'View Vacancy'}</span>
                  </Button>
                </Link>
                <Link href="/dashboard/vacancies">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <HugeiconsIcon icon={Quiz03Icon} size={14} />
                    <span>{locale === 'th' ? 'รายการตำแหน่งทั้งหมด' : 'All Vacancies'}</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* JD Result */}
          {jdResult && (
            <Card className="border-emerald-200 bg-white shadow-xs rounded-2xl animate-fade-in overflow-hidden">
              <CardHeader className="border-b border-emerald-100 bg-emerald-50/40">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-900">
                      {locale === 'th' ? jdResult.jobTitleTh : jdResult.jobTitle}
                    </CardTitle>
                    <p className="text-xs text-emerald-800 font-bold mt-1">
                      💰 ฐานเงินเดือน: {Number(editSalaryMin || jdResult.salaryMin || 40000).toLocaleString()} - {Number(editSalaryMax || jdResult.salaryMax || 75000).toLocaleString()} THB/เดือน
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                    🤖 Claude • Confidence: {(jdResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                {isEditing ? (
                  /* Edit Mode Form */
                  <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">ชื่อตำแหน่ง</label>
                      <Input
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="bg-white border-slate-300 font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">เงินเดือนเริ่มต้น (Min)</label>
                        <Input
                          type="number"
                          value={editSalaryMin}
                          onChange={e => setEditSalaryMin(e.target.value)}
                          className="bg-white border-slate-300 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">เงินเดือนสูงสุด (Max)</label>
                        <Input
                          type="number"
                          value={editSalaryMax}
                          onChange={e => setEditSalaryMax(e.target.value)}
                          className="bg-white border-slate-300 font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">คำอธิบายภาพรวม (Summary)</label>
                      <textarea
                        rows={3}
                        value={editSummary}
                        onChange={e => setEditSummary(e.target.value)}
                        className="w-full rounded-xl bg-white border border-slate-300 p-3 text-xs text-slate-800 focus:outline-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">หน้าที่ความรับผิดชอบ (บรรทัดละ 1 ข้อ)</label>
                      <textarea
                        rows={4}
                        value={editResponsibilities}
                        onChange={e => setEditResponsibilities(e.target.value)}
                        className="w-full rounded-xl bg-white border border-slate-300 p-3 text-xs text-slate-800 focus:outline-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">คุณสมบัติผู้สมัคร (บรรทัดละ 1 ข้อ)</label>
                      <textarea
                        rows={4}
                        value={editRequirements}
                        onChange={e => setEditRequirements(e.target.value)}
                        className="w-full rounded-xl bg-white border border-slate-300 p-3 text-xs text-slate-800 focus:outline-emerald-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit} className="bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer">
                        💾 บันทึกการแก้ไข
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl text-xs font-bold cursor-pointer">
                        ยกเลิก
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <>
                    <p className="text-sm text-slate-700 leading-relaxed font-normal">
                      {locale === 'th' ? jdResult.summaryTh : jdResult.summary}
                    </p>

                    {/* Preferred Skills */}
                    {jdResult.preferredSkills && jdResult.preferredSkills.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 mb-2">🎯 {locale === 'th' ? 'ทักษะเฉพาะทางที่ต้องการ (Key Skills)' : 'Key Skills'}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {jdResult.preferredSkills.map((sk, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-2">{locale === 'th' ? 'หน้าที่ความรับผิดชอบ' : 'Responsibilities'}</h4>
                      <ul className="space-y-2">
                        {(locale === 'th' ? jdResult.responsibilitiesTh : jdResult.responsibilities).map((r, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">✦</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-2">{locale === 'th' ? 'คุณสมบัติ' : 'Requirements'}</h4>
                      <ul className="space-y-2">
                        {(locale === 'th' ? jdResult.requirementsTh : jdResult.requirements).map((r, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                            <span className="text-teal-600 font-bold">●</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Bottom Action Bar */}
                <div className="flex flex-wrap gap-2.5 pt-3 border-t border-slate-100">
                  <Button
                    size="sm"
                    disabled={isApproving}
                    onClick={handleApproveJD}
                    className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer text-xs"
                  >
                    {isApproving ? (
                      <span className="flex items-center gap-1.5">
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        {locale === 'th' ? 'กำลังบันทึกและอนุมัติ...' : 'Approving...'}
                      </span>
                    ) : (
                      <span>✅ {locale === 'th' ? 'อนุมัติ JD (Approve JD)' : 'Approve JD'}</span>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    ✏️ {isEditing ? (locale === 'th' ? 'ปิดการแก้ไข' : 'Cancel Edit') : (locale === 'th' ? 'แก้ไขข้อความ' : 'Edit JD')}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isGenerating}
                    onClick={handleGenerateJD}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    🔄 {locale === 'th' ? 'ให้ Claude ร่างใหม่' : 'Regenerate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 2. Candidate Matcher */}
        <TabsContent value="match" className="space-y-4">
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">{locale === 'th' ? 'จับคู่ผู้สมัครกับตำแหน่งด้วย Claude' : 'Match Candidate to Position with Claude'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">{locale === 'th' ? 'ตำแหน่งที่ต้องการจับคู่' : 'Vacancy'}</label>
                  <select
                    value={selectedVacancyId}
                    onChange={e => setSelectedVacancyId(e.target.value)}
                    className="w-full h-11 rounded-xl bg-white border border-slate-200 px-3 text-sm text-slate-900 font-medium cursor-pointer"
                  >
                    {vacancies.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.position.titleTh || v.position.title} ({v.position.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">{locale === 'th' ? 'ผู้สมัครที่ต้องการวิเคราะห์' : 'Candidate'}</label>
                  <select
                    value={selectedCandidateId}
                    onChange={e => setSelectedCandidateId(e.target.value)}
                    className="w-full h-11 rounded-xl bg-white border border-slate-200 px-3 text-sm text-slate-900 font-medium cursor-pointer"
                  >
                    {candidates.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.firstNameTh || c.firstName} {c.lastNameTh || c.lastName} ({c.currentPosition || 'ผู้สมัคร'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button
                onClick={handleMatch}
                disabled={isMatching}
                className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {isMatching ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    {locale === 'th' ? 'Claude กำลังวิเคราะห์จับคู่...' : 'Claude Matching...'}
                  </span>
                ) : (
                  `🎯 ${locale === 'th' ? 'วิเคราะห์ความเหมาะสมด้วย Claude' : 'Analyze Match with Claude'}`
                )}
              </Button>
            </CardContent>
          </Card>

          {matchResult && (
            <Card className="border-emerald-200 bg-white shadow-xs rounded-2xl animate-fade-in">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <MatchScoreRadial score={matchResult.matchScore} size={96} label={locale === 'th' ? 'คะแนนจับคู่' : 'Match Score'} />
                  <div className="flex-1 w-full space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        matchResult.recommendation === 'SHORTLIST' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {matchResult.recommendation === 'SHORTLIST' ? '✅ SHORTLIST' : '⏸️ HOLD'}
                      </span>
                      <span className="text-xs font-medium text-slate-500">Confidence: {(matchResult.confidence * 100).toFixed(0)}%</span>
                    </div>
                    {Object.entries(matchResult.requiredCriteria).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <span className="text-slate-600 font-semibold capitalize">{key}</span>
                        <span className={`font-bold ${val === 'match' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {val === 'match' ? '✅' : '⚠️'} {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 3. Recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length === 0 ? (
            <Card className="border-slate-200 bg-white shadow-xs rounded-2xl p-10 text-center space-y-2">
              <p className="text-4xl mb-2">🤖</p>
              <p className="text-base font-bold text-slate-800">
                {locale === 'th' ? 'ยังไม่มีข้อมูลผลการแนะนำของ AI ในระบบ' : 'No AI recommendations found'}
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {locale === 'th'
                  ? 'เมื่อผู้สมัครยื่นใบสมัครและผ่านการวิเคราะห์/ประเมินความเหมาะสมโดย AI (Claude) ข้อมูลผลการแนะนำจะปรากฏที่นี่'
                  : 'Candidate match results evaluated by Claude AI will appear here once candidates apply.'}
              </p>
            </Card>
          ) : (
            recommendations.map(rec => (
              <Card key={rec.id} className="border-slate-200 bg-white shadow-xs rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start gap-5">
                    <MatchScoreRadial score={rec.overallFit} size={70} label={locale === 'th' ? 'ความเหมาะสม' : 'Overall Fit'} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-base font-bold text-slate-900">{rec.candidateName}</p>
                          <p className="text-xs text-slate-500 font-medium">{rec.vacancyTitle}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          rec.recommendation === 'STRONG_HIRE' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          rec.recommendation === 'HIRE' ? 'bg-green-100 text-green-800 border border-green-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {rec.recommendation.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 mt-3">
                        {rec.scores && Object.entries(rec.scores).map(([key, val]) => (
                          <div key={key} className="text-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <p className="text-sm font-bold text-slate-900">{typeof val === 'number' && val > 0 ? `${val}%` : '-'}</p>
                            <p className="text-[10px] text-slate-500 font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          💡 {locale === 'th' ? rec.reasoningTh || rec.reasoning : rec.reasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
