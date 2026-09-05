'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { VacancyStateBadge, PriorityBadge } from '@/pagefront/components/StateBadge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Briefcase06Icon,
  Building05Icon,
  User03Icon,
  Calendar03Icon,
  Target02Icon,
  Delete02Icon,
  Search01Icon,
  ChatBotIcon,
  Cancel01Icon,
  CheckmarkSquare01Icon,
  AssignmentsIcon,
  ReloadIcon,
} from '@hugeicons/core-free-icons';


import {
  fetchVacanciesFromDB,
  createVacancyInDB,
  deleteVacancyFromDB,
  generateJobDescription,
} from '@/pageback/services';

import type { Vacancy, VacancyState } from '@/lib/types/vacancy';

const FILTER_STATES: (VacancyState | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'WAITING_HR_APPROVAL',
  'PUBLISHED',
  'RECRUITING',
  'INTERVIEWING',
  'FILLED',
  'CLOSED',
];

const POPULAR_DEPARTMENTS = [
  'ฝ่ายเทคโนโลยีสารสนเทศ',
  'คณะเทคโนโลยีสารสนเทศ',
  'คณะวิศวกรรมศาสตร์',
  'คณะบริหารธุรกิจ',
  'คณะนิเทศศาสตร์',
  'สำนักการตลาดและประชาสัมพันธ์',
  'สำนักวิชาการ',
  'สำนักทรัพยากรมนุษย์ (HR)',
  'สำนักการเงินและบัญชี',
  'สำนักงานอธิการบดี',
];

export default function VacanciesPage() {
  const { locale, t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<VacancyState | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // AI JD Vacancy Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    success: boolean;
    vacancyId?: string;
    title?: string;
  } | null>(null);

  // Editable JD & Vacancy Fields (Empty by default for new vacancy)
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('ฝ่ายเทคโนโลยีสารสนเทศ');
  const [customDept, setCustomDept] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [editPriority, setEditPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [editReason, setEditReason] = useState<'NEW_POSITION' | 'REPLACEMENT' | 'EXPANSION'>('NEW_POSITION');
  const [editHeadcount, setEditHeadcount] = useState<number>(1);
  const [editSalaryMin, setEditSalaryMin] = useState<number>(0);
  const [editSalaryMax, setEditSalaryMax] = useState<number>(0);

  // Detailed JD Content
  const [editSummary, setEditSummary] = useState('');
  const [editResponsibilities, setEditResponsibilities] = useState<string[]>([]);
  const [newRespItem, setNewRespItem] = useState('');
  const [editRequirements, setEditRequirements] = useState<string[]>([]);
  const [newReqItem, setNewReqItem] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [newSkillItem, setNewSkillItem] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadVacancies = async () => {
    setLoading(true);
    const data = await fetchVacanciesFromDB();
    setVacancies(data);
    setLoading(false);
  };

  useEffect(() => {
    loadVacancies();
  }, []);

  // Helper to trigger AI drafting with Gemini
  const triggerAIDraft = async (
    title: string,
    dept: string,
    skillsList: string[] = ['React', 'Node.js', 'SQL', 'TypeScript'],
    salMin: number = 40000,
    salMax: number = 75000
  ) => {
    setIsAiGenerating(true);
    try {
      const res = await generateJobDescription(
        title || 'ตำแหน่งงานใหม่',
        dept || 'ฝ่ายเทคโนโลยีสารสนเทศ',
        undefined,
        skillsList,
        salMin,
        salMax
      );

      if (res) {
        setEditJobTitle(res.jobTitleTh || res.jobTitle || title);
        setEditSummary(res.summaryTh || res.summary || '');
        setEditResponsibilities(
          res.responsibilitiesTh && res.responsibilitiesTh.length > 0
            ? res.responsibilitiesTh
            : res.responsibilities || []
        );
        setEditRequirements(
          res.requirementsTh && res.requirementsTh.length > 0
            ? res.requirementsTh
            : res.requirements || []
        );
        if (res.preferredSkills && res.preferredSkills.length > 0) {
          setEditSkills(res.preferredSkills);
        }
        if (res.salaryMin) setEditSalaryMin(res.salaryMin);
        if (res.salaryMax) setEditSalaryMax(res.salaryMax);
      }
    } catch (err) {
      console.warn('AI JD Draft warning:', err);
      // Fallback template
      setEditSummary(`เรากำลังมองหา ${title} เพื่อร่วมงานกับทีม ${dept} ขับเคลื่อนนวัตกรรมและสร้างผลกระทบที่สำคัญต่อการเติบโตขององค์กร`);
      setEditResponsibilities([
        `นำและจัดการโครงการทางเทคโนโลยีของ ${dept}`,
        'ประสานงานร่วมกับทีมข้ามสายงานเพื่อส่งมอบผลงานตามเป้าหมาย',
        'ติดตาม ปรับปรุง และประเมินผลการปฏิบัติงานตามมาตรฐานสากล',
      ]);
      setEditRequirements([
        'วุฒิการศึกษาระดับปริญญาตรีขึ้นไปในสาขาที่เกี่ยวข้อง',
        'มีประสบการณ์การทำงานตรง 2-5 ปีขึ้นไป',
        'มีทักษะการสื่อสาร การแก้ปัญหา และการทำงานเป็นทีมที่ดี',
      ]);
      setEditSkills(['Problem Solving', 'Teamwork', 'Communication']);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleOpenCreateModal = () => {
    // Reset to empty fields for creating a new vacancy without mock data
    setEditJobTitle('');
    setEditDepartment('ฝ่ายเทคโนโลยีสารสนเทศ');
    setIsCustomDept(false);
    setCustomDept('');
    setEditPriority('MEDIUM');
    setEditReason('NEW_POSITION');
    setEditHeadcount(1);
    setEditSalaryMin(0);
    setEditSalaryMax(0);
    setEditSummary('');
    setEditResponsibilities([]);
    setEditRequirements([]);
    setEditSkills([]);
    setNewRespItem('');
    setNewReqItem('');
    setNewSkillItem('');
    setSubmissionSuccess(null);
    setIsModalOpen(true);
  };

  const handleRegenerateAI = () => {
    const finalTitle = editJobTitle.trim();
    if (!finalTitle) {
      alert(locale === 'th' ? 'กรุณากรอกชื่อตำแหน่งงานก่อนให้ AI ร่าง JD' : 'Please enter position title before generating AI JD');
      return;
    }
    const currentDept = isCustomDept ? (customDept || 'ทั่วไป') : editDepartment;
    triggerAIDraft(
      finalTitle,
      currentDept,
      editSkills.length > 0 ? editSkills : undefined,
      editSalaryMin > 0 ? editSalaryMin : 35000,
      editSalaryMax > 0 ? editSalaryMax : 65000
    );
  };

  const handleConfirmCreateVacancy = async () => {
    const finalTitle = editJobTitle.trim();
    if (!finalTitle) {
      alert(locale === 'th' ? 'กรุณาระบุชื่อตำแหน่งงาน' : 'Please enter position title');
      return;
    }

    const finalDept = isCustomDept ? (customDept.trim() || 'ทั่วไป') : editDepartment;

    setIsSubmitting(true);
    try {
      const res = await createVacancyInDB({
        title: finalTitle,
        titleTh: finalTitle,
        department: finalDept,
        departmentTh: finalDept,
        headcount: Number(editHeadcount) || 1,
        priority: editPriority,
        reason: editReason,
        generateAIJD: false,
        skills: editSkills,
        salaryMin: Number(editSalaryMin) || 40000,
        salaryMax: Number(editSalaryMax) || 75000,
        customJD: {
          summary: editSummary,
          summaryTh: editSummary,
          responsibilities: editResponsibilities,
          responsibilitiesTh: editResponsibilities,
          requirements: editRequirements,
          requirementsTh: editRequirements,
          preferredSkills: editSkills,
        },
      });

      if (res.success && res.vacancyId) {
        setSubmissionSuccess({
          success: true,
          vacancyId: res.vacancyId,
          title: finalTitle,
        });
        await loadVacancies();
      } else {
        alert(res.error || 'Failed to create vacancy');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating vacancy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVacancy = async (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      locale === 'th'
        ? `คุณต้องการลบตำแหน่งงาน "${title}" ใช่หรือไม่? (การกระทำนี้จะลบข้อมูลออกจากฐานข้อมูลทันที)`
        : `Are you sure you want to delete "${title}"?`
    );

    if (!confirmed) return;

    setDeletingId(id);
    const ok = await deleteVacancyFromDB(id);
    setDeletingId(null);

    if (ok) {
      await loadVacancies();
    } else {
      alert(locale === 'th' ? 'เกิดข้อผิดพลาดในการลบตำแหน่งงาน' : 'Failed to delete vacancy');
    }
  };

  const filteredVacancies = vacancies.filter(v => {
    const matchSearch =
      search === '' ||
      v.position.title.toLowerCase().includes(search.toLowerCase()) ||
      v.position.titleTh.includes(search) ||
      v.position.department.toLowerCase().includes(search.toLowerCase());
    const matchState = filterState === 'ALL' || v.state === filterState;
    return matchSearch && matchState;
  });

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <HugeiconsIcon icon={Briefcase06Icon} size={28} className="text-pink-600 dark:text-pink-400 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{t('vacancy.title')}</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {locale === 'th' ? 'จัดการตำแหน่งงานและ Job Description (Supabase Live)' : 'Manage positions and job descriptions (Supabase Live)'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 shadow-md shadow-emerald-600/20 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 self-start sm:self-auto"
        >
          <HugeiconsIcon icon={ChatBotIcon} size={16} />
          <span>+ {locale === 'th' ? 'เปิดรับตำแหน่งใหม่ (ร่าง JD ด้วย AI)' : 'Create Vacancy with AI'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder={locale === 'th' ? 'ค้นหาตำแหน่ง, แผนก...' : 'Search position, department...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border-slate-200 text-slate-900 focus:border-emerald-600 focus:ring-emerald-500/20 max-w-full sm:max-w-xs rounded-xl shadow-xs text-xs"
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_STATES.map(state => (
            <button
              key={state}
              onClick={() => setFilterState(state)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterState === state
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {state === 'ALL' ? (locale === 'th' ? 'ทั้งหมด' : 'All') : state.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Vacancy Cards */}
      <div className="grid gap-3">
        {filteredVacancies.map((vacancy, idx) => (
          <Link key={vacancy.id} href={`/dashboard/vacancies/${vacancy.id}`}>
            <Card
              className="border-slate-200 bg-white hover:bg-emerald-50/20 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group rounded-2xl shadow-xs animate-fade-in"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {locale === 'th' ? vacancy.position.titleTh : vacancy.position.title}
                      </h3>
                      <VacancyStateBadge state={vacancy.state} />
                      <PriorityBadge priority={vacancy.priority} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-500 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <HugeiconsIcon icon={Building05Icon} size={15} className="text-slate-400 shrink-0" />
                        <span>{locale === 'th' ? vacancy.position.departmentTh : vacancy.position.department}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <HugeiconsIcon icon={User03Icon} size={15} className="text-slate-400 shrink-0" />
                        <span>{vacancy.hiringManagerName}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <HugeiconsIcon icon={Calendar03Icon} size={15} className="text-slate-400 shrink-0" />
                        <span>{new Date(vacancy.openDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <HugeiconsIcon icon={Target02Icon} size={15} className="text-slate-400 shrink-0" />
                        <span>{vacancy.headcount} {locale === 'th' ? 'อัตรา' : 'position(s)'}</span>
                      </span>
                    </div>

                  </div>

                  {/* Stats & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-center">
                      <p className="text-base sm:text-lg font-bold text-slate-800">{vacancy.applicationCount}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{locale === 'th' ? 'ใบสมัคร' : 'Applications'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base sm:text-lg font-bold text-emerald-700">{vacancy.shortlistedCount}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{locale === 'th' ? 'คัดเลือก' : 'Shortlisted'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base sm:text-lg font-bold text-teal-700">{vacancy.interviewCount}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{locale === 'th' ? 'สัมภาษณ์' : 'Interviews'}</p>
                    </div>
                    <button
                      type="button"
                      title={locale === 'th' ? 'ลบตำแหน่งงานนี้' : 'Delete this vacancy'}
                      disabled={deletingId === vacancy.id}
                      onClick={(e) => handleDeleteVacancy(vacancy.id, locale === 'th' ? vacancy.position.titleTh : vacancy.position.title, e)}
                      className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer shrink-0 disabled:opacity-50 ml-auto sm:ml-0"
                    >
                      {deletingId === vacancy.id ? (
                        <svg className="animate-spin h-4 w-4 text-red-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      ) : (
                        <HugeiconsIcon icon={Delete02Icon} size={18} className="text-slate-400 hover:text-red-600 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {!loading && filteredVacancies.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
            <div className="flex justify-center mb-2">
              <HugeiconsIcon icon={Search01Icon} size={40} className="text-slate-300" />
            </div>
            <p className="font-semibold text-slate-600">{t('common.noData')}</p>
          </div>
        )}
      </div>

      {/* Rich AI Job Description Modal (Matching Option B Style) */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-hidden">
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-scale-in my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                  <HugeiconsIcon icon={ChatBotIcon} size={22} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                    <span>กระบวนการ AI: เปิดรับตำแหน่งงานใหม่ & ร่าง JD อัจฉริยะ</span>
                    <Badge className="bg-amber-400 text-slate-900 font-extrabold text-[10px]">AI Action</Badge>
                  </h2>
                  <p className="text-[11px] sm:text-xs text-emerald-200 font-medium">
                    กรอกข้อมูลตำแหน่งงาน และให้ Google Gemini AI ช่วยร่างรายละเอียด Job Description ก่อนเปิดรับสมัคร
                  </p>
                </div>
              </div>

              <button
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm cursor-pointer transition-colors shrink-0"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 sm:space-y-6">
              {submissionSuccess ? (
                /* Success State */
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300 animate-bounce">
                    <HugeiconsIcon icon={CheckmarkSquare01Icon} size={32} />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    สร้างตำแหน่งงานใหม่ & บันทึก Job Description สำเร็จ!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    ระบบได้สร้างตำแหน่งงานว่าง (Vacancy #{submissionSuccess.vacancyId}) สำหรับ <b>"{submissionSuccess.title}"</b> พร้อมบันทึก Job Description จาก AI และแจ้งเตือนสดไปยังแดชบอร์ดเรียบร้อยแล้ว
                  </p>

                  <div className="pt-4 flex items-center justify-center gap-3">
                    <Link href={`/dashboard/vacancies/${submissionSuccess.vacancyId}`}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5">
                        <HugeiconsIcon icon={Briefcase06Icon} size={14} />
                        <span>ดูรายละเอียดตำแหน่งงานนี้</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="text-xs font-semibold rounded-xl"
                    >
                      ปิดหน้าต่าง
                    </Button>
                  </div>
                </div>
              ) : isAiGenerating ? (
                /* Loading State */
                <div className="py-16 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <h4 className="text-base font-bold text-slate-900">
                    Google Gemini AI กำลังวิเคราะห์และร่าง Job Description...
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    AI กำลังสร้างโครงสร้างหน้าที่ความรับผิดชอบ คุณสมบัติผู้สมัคร และทักษะที่จำเป็นสำหรับตำแหน่ง <b>"{editJobTitle}"</b>
                  </p>
                </div>
              ) : (
                /* Edit Form (Option B Layout) */
                <div className="space-y-5">
                  {/* Position Details Header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <HugeiconsIcon icon={AssignmentsIcon} size={16} className="text-emerald-700" />
                        <span>รายละเอียดตำแหน่งงาน & Job Description</span>
                        {editSummary && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                            AI Drafted
                          </Badge>
                        )}
                      </h3>

                      <button
                        type="button"
                        onClick={handleRegenerateAI}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1.5 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 transition-all hover:bg-emerald-100"
                        title={locale === 'th' ? 'กรอกชื่อตำแหน่งแล้วกดให้ AI ร่าง JD' : 'Generate JD from job title'}
                      >
                        <HugeiconsIcon icon={ReloadIcon} size={13} />
                        <span>ร่างใหม่ด้วย AI</span>
                      </button>
                    </div>

                    {/* Job Title, Department, and Priority */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ชื่อตำแหน่งงาน (Job Title) *</label>
                        <Input
                          value={editJobTitle}
                          onChange={(e) => setEditJobTitle(e.target.value)}
                          placeholder="เช่น อาจารย์ประจำสาขาวิชา, เจ้าหน้าที่วิชาการ..."
                          className="font-bold text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>สังกัด / แผนก *</span>
                          <button
                            type="button"
                            onClick={() => setIsCustomDept(!isCustomDept)}
                            className="text-[10px] text-emerald-700 hover:underline font-semibold"
                          >
                            {isCustomDept ? 'เลือกจากรายการ' : '+ ระบุเอง'}
                          </button>
                        </label>

                        {isCustomDept ? (
                          <Input
                            value={customDept}
                            onChange={(e) => setCustomDept(e.target.value)}
                            placeholder="พิมพ์ชื่อแผนก/หน่วยงาน..."
                            className="text-xs font-bold"
                          />
                        ) : (
                          <select
                            value={editDepartment}
                            onChange={(e) => setEditDepartment(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800"
                          >
                            {POPULAR_DEPARTMENTS.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">ระดับความเร่งด่วน</label>
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800"
                        >
                          <option value="LOW">ต่ำ (LOW)</option>
                          <option value="MEDIUM">ปานกลาง (MEDIUM)</option>
                          <option value="HIGH">สูง (HIGH)</option>
                          <option value="URGENT">เร่งด่วนพิเศษ (URGENT)</option>
                        </select>
                      </div>
                    </div>

                    {/* Headcount, Reason, and Salary Range */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">จำนวนที่รับ (คน)</label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={editHeadcount}
                          onChange={(e) => setEditHeadcount(Number(e.target.value))}
                          className="text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">เหตุผลการเปิดรับ</label>
                        <select
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800"
                        >
                          <option value="NEW_POSITION">ตำแหน่งใหม่ (NEW_POSITION)</option>
                          <option value="EXPANSION">ขยายทีม (EXPANSION)</option>
                          <option value="REPLACEMENT">ทดแทนคนเดิม (REPLACEMENT)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">เงินเดือนเริ่มต้น (บาท)</label>
                        <Input
                          type="number"
                          step={1000}
                          value={editSalaryMin === 0 ? '' : editSalaryMin}
                          onChange={(e) => setEditSalaryMin(Number(e.target.value) || 0)}
                          placeholder="เช่น 35000"
                          className="text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">เงินเดือนสูงสุด (บาท)</label>
                        <Input
                          type="number"
                          step={1000}
                          value={editSalaryMax === 0 ? '' : editSalaryMax}
                          onChange={(e) => setEditSalaryMax(Number(e.target.value) || 0)}
                          placeholder="เช่น 60000"
                          className="text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">สรุปภาพรวมงาน (Job Summary)</label>
                      <textarea
                        rows={3}
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        placeholder="ระบุภาพรวมและเป้าหมายของตำแหน่งงาน... (หรือพิมพ์ชื่อตำแหน่งแล้วคลิก 'ร่างใหม่ด้วย AI')"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-emerald-500"
                      />
                    </div>

                    {/* Responsibilities */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>หน้าที่ความรับผิดชอบหลัก (Responsibilities)</span>
                        {editResponsibilities.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-medium">({editResponsibilities.length} ข้อ)</span>
                        )}
                      </label>
                      {editResponsibilities.length > 0 ? (
                        <div className="space-y-1.5">
                          {editResponsibilities.map((resp, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-emerald-600 font-bold">•</span>
                              <Input
                                value={resp}
                                onChange={(e) => {
                                  const updated = [...editResponsibilities];
                                  updated[idx] = e.target.value;
                                  setEditResponsibilities(updated);
                                }}
                                className="text-xs py-1.5 flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => setEditResponsibilities(editResponsibilities.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-700 text-xs px-2 py-1 cursor-pointer"
                              >
                                <HugeiconsIcon icon={Cancel01Icon} size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-1">
                          {locale === 'th' ? 'ยังไม่มีหน้าที่ความรับผิดชอบ (พิมพ์แล้วกด "เพิ่ม" หรือคลิก "ร่างใหม่ด้วย AI" ด้านบน)' : 'No responsibilities yet.'}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <Input
                          value={newRespItem}
                          onChange={(e) => setNewRespItem(e.target.value)}
                          placeholder="+ เพิ่มหน้าที่รับผิดชอบใหม่..."
                          className="text-xs py-1.5"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newRespItem.trim()) {
                              setEditResponsibilities([...editResponsibilities, newRespItem.trim()]);
                              setNewRespItem('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (newRespItem.trim()) {
                              setEditResponsibilities([...editResponsibilities, newRespItem.trim()]);
                              setNewRespItem('');
                            }
                          }}
                          className="text-xs font-bold"
                        >
                          เพิ่ม
                        </Button>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>คุณสมบัติผู้สมัคร (Qualifications & Requirements)</span>
                        {editRequirements.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-medium">({editRequirements.length} ข้อ)</span>
                        )}
                      </label>
                      {editRequirements.length > 0 ? (
                        <div className="space-y-1.5">
                          {editRequirements.map((req, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-teal-600 font-bold">•</span>
                              <Input
                                value={req}
                                onChange={(e) => {
                                  const updated = [...editRequirements];
                                  updated[idx] = e.target.value;
                                  setEditRequirements(updated);
                                }}
                                className="text-xs py-1.5 flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => setEditRequirements(editRequirements.filter((_, i) => i !== idx))}
                                className="text-rose-500 hover:text-rose-700 text-xs px-2 py-1 cursor-pointer"
                              >
                                <HugeiconsIcon icon={Cancel01Icon} size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-1">
                          {locale === 'th' ? 'ยังไม่มีคุณสมบัติที่ระบุ (พิมพ์แล้วกด "เพิ่ม" หรือคลิก "ร่างใหม่ด้วย AI" ด้านบน)' : 'No requirements yet.'}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <Input
                          value={newReqItem}
                          onChange={(e) => setNewReqItem(e.target.value)}
                          placeholder="+ เพิ่มคุณสมบัติใหม่..."
                          className="text-xs py-1.5"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newReqItem.trim()) {
                              setEditRequirements([...editRequirements, newReqItem.trim()]);
                              setNewReqItem('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (newReqItem.trim()) {
                              setEditRequirements([...editRequirements, newReqItem.trim()]);
                              setNewReqItem('');
                            }
                          }}
                          className="text-xs font-bold"
                        >
                          เพิ่ม
                        </Button>
                      </div>
                    </div>

                    {/* Preferred Skills Tags */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>ทักษะที่ต้องการ (Skills Tags)</span>
                        {editSkills.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-medium">({editSkills.length} ทักษะ)</span>
                        )}
                      </label>
                      {editSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {editSkills.map((sk, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs bg-slate-50 text-slate-700 border-slate-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold"
                            >
                              <span>{sk}</span>
                              <button
                                type="button"
                                onClick={() => setEditSkills(editSkills.filter((_, i) => i !== idx))}
                                className="text-slate-400 hover:text-rose-500 cursor-pointer text-[10px]"
                              >
                                ✕
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">
                          {locale === 'th' ? 'ยังไม่มีทักษะที่ระบุ (พิมพ์ทักษะแล้วกด "เพิ่ม" ได้ตามต้องการ)' : 'No skills specified yet.'}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <Input
                          value={newSkillItem}
                          onChange={(e) => setNewSkillItem(e.target.value)}
                          placeholder="+ เพิ่มทักษะ (เช่น React, Python, การสื่อสาร)..."
                          className="text-xs py-1.5"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newSkillItem.trim()) {
                              if (!editSkills.includes(newSkillItem.trim())) {
                                setEditSkills([...editSkills, newSkillItem.trim()]);
                              }
                              setNewSkillItem('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (newSkillItem.trim() && !editSkills.includes(newSkillItem.trim())) {
                              setEditSkills([...editSkills, newSkillItem.trim()]);
                              setNewSkillItem('');
                            }
                          }}
                          className="text-xs font-bold"
                        >
                          เพิ่มแท็ก
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!submissionSuccess && !isAiGenerating && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs font-semibold rounded-xl"
                >
                  ยกเลิก
                </Button>

                <Button
                  onClick={handleConfirmCreateVacancy}
                  disabled={isSubmitting || !editJobTitle}
                  className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 px-5 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังบันทึกและสร้างตำแหน่ง...
                    </span>
                  ) : (
                    <>
                      <HugeiconsIcon icon={CheckmarkSquare01Icon} size={15} />
                      <span>ยืนยันการสร้างตำแหน่งงาน & เปิดรับสมัคร</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
