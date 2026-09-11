'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { VacancyStateBadge, PriorityBadge, ApplicationStateBadge } from '@/pagefront/components/StateBadge';
import { MatchScoreRadial } from '@/pagefront/components/MatchScoreRadial';
import { createPortal } from 'react-dom';
import { Input } from '@/components/ui/input';
import {
  fetchVacancyByIdFromDB,
  fetchApplicationsFromDB,
  updateVacancyStateInDB,
  regenerateVacancyJDInDB,
  deleteVacancyFromDB,
  updateVacancyAndJDInDB,
} from '@/pageback/services';
import { getAvailableTransitions } from '@/pageback/services/vacancy-service';
import { VACANCY_STATE_LABELS } from '@/lib/types/vacancy';
import type { Vacancy, VacancyState } from '@/lib/types/vacancy';
import type { Application } from '@/lib/types/candidate';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Building05Icon,
  User03Icon,
  Target02Icon,
  Delete02Icon,
  Quiz03Icon,
  ChatBotIcon,
  SparklesIcon,
  AssignmentsIcon,
  Edit02Icon,
  FloppyDiskIcon,
  Cancel01Icon,
  CheckmarkSquare01Icon,
  Briefcase06Icon,
} from '@hugeicons/core-free-icons';

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


export default function VacancyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { locale, t } = useLocale();
  const [vacancy, setVacancy] = useState<Vacancy | undefined>(undefined);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [editToast, setEditToast] = useState<string | null>(null);

  // Edit Modal & Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTitleTh, setEditTitleTh] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [customDept, setCustomDept] = useState('');
  const [editHeadcount, setEditHeadcount] = useState(1);
  const [editPriority, setEditPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [editSummary, setEditSummary] = useState('');
  const [editResponsibilities, setEditResponsibilities] = useState<string[]>([]);
  const [editRequirements, setEditRequirements] = useState<string[]>([]);
  const [editPreferredSkills, setEditPreferredSkills] = useState<string[]>([]);
  const [editSalaryMin, setEditSalaryMin] = useState(40000);
  const [editSalaryMax, setEditSalaryMax] = useState(75000);

  // Quick addition inputs
  const [newRespItem, setNewRespItem] = useState('');
  const [newReqItem, setNewReqItem] = useState('');
  const [newSkillItem, setNewSkillItem] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [v, apps] = await Promise.all([
      fetchVacancyByIdFromDB(id),
      fetchApplicationsFromDB(),
    ]);
    setVacancy(v);
    setApplications(apps.filter(a => a.vacancyId === id));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStateChange = async (newState: VacancyState) => {
    if (!vacancy) return;
    const ok = await updateVacancyStateInDB(vacancy.id, newState);
    if (ok) {
      setVacancy({ ...vacancy, state: newState });
    }
  };

  const handleDelete = async () => {
    if (!vacancy) return;
    const confirmed = window.confirm(
      locale === 'th'
        ? `คุณต้องการลบตำแหน่งงาน "${vacancy.position.titleTh || vacancy.position.title}" ใช่หรือไม่?`
        : `Are you sure you want to delete "${vacancy.position.title}"?`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    const ok = await deleteVacancyFromDB(vacancy.id);
    if (ok) {
      router.push('/dashboard/vacancies');
    } else {
      setIsDeleting(false);
      alert(locale === 'th' ? 'เกิดข้อผิดพลาดในการลบตำแหน่งงาน' : 'Failed to delete vacancy');
    }
  };

  const handleRegenerateJD = async () => {
    if (!vacancy) return;
    setIsRegenerating(true);
    const ok = await regenerateVacancyJDInDB(
      vacancy.id,
      vacancy.position.title || 'Specialist',
      vacancy.position.department || 'General'
    );
    if (ok) {
      const updated = await fetchVacancyByIdFromDB(vacancy.id);
      setVacancy(updated);
    }
    setIsRegenerating(false);
  };

  const openEditModal = () => {
    if (!vacancy) return;
    const jd = vacancy.jobDescription;
    setEditTitle(vacancy.position.title || '');
    setEditTitleTh(vacancy.position.titleTh || vacancy.position.title || '');

    const dept = vacancy.position.department || '';
    if (POPULAR_DEPARTMENTS.includes(dept)) {
      setEditDepartment(dept);
      setIsCustomDept(false);
    } else {
      setIsCustomDept(true);
      setCustomDept(dept);
      setEditDepartment(dept);
    }

    setEditHeadcount(vacancy.headcount || 1);
    setEditPriority(vacancy.priority || 'MEDIUM');
    setEditSummary(locale === 'th' ? (jd?.summaryTh || jd?.summary || '') : (jd?.summary || jd?.summaryTh || ''));

    const resps = locale === 'th'
      ? (jd?.responsibilitiesTh && jd.responsibilitiesTh.length > 0 ? jd.responsibilitiesTh : jd?.responsibilities || [])
      : (jd?.responsibilities && jd.responsibilities.length > 0 ? jd.responsibilities : jd?.responsibilitiesTh || []);
    setEditResponsibilities([...resps]);

    const reqs = locale === 'th'
      ? (jd?.requirementsTh && jd.requirementsTh.length > 0 ? jd.requirementsTh : jd?.requirements || [])
      : (jd?.requirements && jd.requirements.length > 0 ? jd.requirements : jd?.requirementsTh || []);
    setEditRequirements([...reqs]);

    setEditPreferredSkills(jd?.preferredSkills ? [...jd.preferredSkills] : []);
    setEditSalaryMin(jd?.salaryRange?.min || 40000);
    setEditSalaryMax(jd?.salaryRange?.max || 75000);

    setNewRespItem('');
    setNewReqItem('');
    setNewSkillItem('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!vacancy) return;
    setIsSavingEdit(true);
    try {
      const finalDept = isCustomDept ? customDept.trim() : editDepartment;
      const res = await updateVacancyAndJDInDB(vacancy.id, {
        title: editTitle.trim() || vacancy.position.title,
        titleTh: editTitleTh.trim() || editTitle.trim() || vacancy.position.title,
        department: finalDept || vacancy.position.department,
        headcount: editHeadcount,
        priority: editPriority,
        summary: editSummary,
        summaryTh: editSummary,
        responsibilities: editResponsibilities,
        responsibilitiesTh: editResponsibilities,
        requirements: editRequirements,
        requirementsTh: editRequirements,
        preferredSkills: editPreferredSkills,
        salaryMin: editSalaryMin,
        salaryMax: editSalaryMax,
      });

      if (res.success) {
        const updated = await fetchVacancyByIdFromDB(vacancy.id);
        if (updated) {
          setVacancy(updated);
        }
        setIsEditModalOpen(false);
        setEditToast(locale === 'th' ? '✓ บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว' : '✓ Successfully saved vacancy and JD updates');
        setTimeout(() => setEditToast(null), 4000);
      } else {
        alert(res.error || (locale === 'th' ? 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' : 'Failed to save changes'));
      }
    } catch (err: any) {
      alert(err.message || 'Error saving changes');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const transitions = vacancy ? getAvailableTransitions(vacancy.state) : [];

  if (!vacancy && !loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 font-semibold">{t('common.noData')}</p>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const jd = vacancy.jobDescription;
  const responsibilities = locale === 'th'
    ? (jd?.responsibilitiesTh && jd.responsibilitiesTh.length > 0 ? jd.responsibilitiesTh : jd?.responsibilities || [])
    : (jd?.responsibilities && jd.responsibilities.length > 0 ? jd.responsibilities : jd?.responsibilitiesTh || []);

  const requirements = locale === 'th'
    ? (jd?.requirementsTh && jd.requirementsTh.length > 0 ? jd.requirementsTh : jd?.requirements || [])
    : (jd?.requirements && jd.requirements.length > 0 ? jd.requirements : jd?.requirementsTh || []);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/dashboard/vacancies" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1">
        ← {t('common.back')}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {locale === 'th' ? vacancy.position.titleTh : vacancy.position.title}
            </h1>
            <VacancyStateBadge state={vacancy.state} />
            <PriorityBadge priority={vacancy.priority} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={Building05Icon} size={15} className="text-slate-400 shrink-0" />
              <span>{locale === 'th' ? vacancy.position.departmentTh : vacancy.position.department}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={User03Icon} size={15} className="text-slate-400 shrink-0" />
              <span>{vacancy.hiringManagerName}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={Target02Icon} size={15} className="text-slate-400 shrink-0" />
              <span>{vacancy.filled}/{vacancy.headcount} {locale === 'th' ? 'อัตรา' : 'filled'}</span>
            </span>
          </div>

        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {transitions.map(state => (
            <Button
              key={state}
              size="sm"
              onClick={() => handleStateChange(state)}
              variant={state === 'APPROVED' || state === 'PUBLISHED' ? 'default' : 'outline'}
              className={state === 'APPROVED' || state === 'PUBLISHED'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }
            >
              {VACANCY_STATE_LABELS[state]?.[locale] || state}
            </Button>
          ))}
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                {locale === 'th' ? 'กำลังลบ...' : 'Deleting...'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Delete02Icon} size={15} />
                {locale === 'th' ? 'ลบตำแหน่งงาน' : 'Delete Vacancy'}
              </span>
            )}
          </button>
        </div>
      </div>

      <Tabs defaultValue="jd" className="space-y-4">
        <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-xl">
          <TabsTrigger value="jd" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs font-semibold text-xs">{t('vacancy.jobDescription')}</TabsTrigger>
          <TabsTrigger value="applications" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs font-semibold text-xs">{t('vacancy.applications')} ({applications.length})</TabsTrigger>
          <TabsTrigger value="position" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-xs font-semibold text-xs">{locale === 'th' ? 'ข้อมูลตำแหน่ง' : 'Position Details'}</TabsTrigger>
        </TabsList>

        {/* JD Tab */}
        <TabsContent value="jd">
          {jd ? (
            <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900">{locale === 'th' ? jd.jobTitleTh : jd.jobTitle}</CardTitle>
                    {jd.generatedByAI && (
                      <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full mt-1.5 inline-flex items-center gap-1">
                        <HugeiconsIcon icon={ChatBotIcon} size={13} />
                        <span>{locale === 'th' ? `สร้างโดย Claude AI (${jd.aiModelVersion || 'claude-opus-5'})` : `AI Generated (${jd.aiModelVersion || 'claude-opus-5'})`}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={openEditModal}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      <HugeiconsIcon icon={Edit02Icon} size={14} />
                      <span>{locale === 'th' ? 'แก้ไขข้อมูลงาน & JD' : 'Edit Job & JD'}</span>
                    </button>
                    <button
                      onClick={handleRegenerateJD}
                      disabled={isRegenerating}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isRegenerating ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          {locale === 'th' ? 'Claude กำลังร่าง JD ใหม่...' : 'Generating with Claude...'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={SparklesIcon} size={13} />
                          <span>{locale === 'th' ? 'ให้ Claude ร่าง JD ใหม่' : 'Regenerate JD with Claude'}</span>
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {(jd.unitGroup || jd.unitName || jd.track || jd.positionLevel || jd.unitProfile || jd.reportsTo) && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {jd.unitProfile && (
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">Unit Profile: {jd.unitProfile}</span>
                    )}
                    {jd.unitGroup && (
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">{jd.unitGroup}</span>
                    )}
                    {jd.unitName && (
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">{jd.unitName}</span>
                    )}
                    {jd.track && (
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">{jd.track}</span>
                    )}
                    {jd.positionLevel && (
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">{locale === 'th' ? 'ระดับ' : 'Level'}: {jd.positionLevel}</span>
                    )}
                    {jd.reportsTo && (
                      <span className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">{locale === 'th' ? 'บังคับบัญชาโดย' : 'Reports to'}: {jd.reportsTo}</span>
                    )}
                  </div>
                )}

                <div>
                  {(jd.jobPurposeTh || jd.jobPurpose) && (
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{locale === 'th' ? 'วัตถุประสงค์ของตำแหน่ง' : 'Job Purpose'}</h4>
                  )}
                  <p className="text-sm text-slate-700 leading-relaxed font-normal">
                    {locale === 'th'
                      ? (jd.jobPurposeTh || jd.summaryTh || jd.summary)
                      : (jd.jobPurpose || jd.summary || jd.summaryTh)}
                  </p>
                </div>

                <Separator className="bg-slate-100" />

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">{locale === 'th' ? 'หน้าที่ความรับผิดชอบ' : 'Responsibilities'}</h3>
                  {jd.responsibilitiesGrouped && jd.responsibilitiesGrouped.length > 0 ? (
                    <div className="space-y-3">
                      {jd.responsibilitiesGrouped.map((duty, di) => (
                        <div key={di} className="rounded-xl border border-slate-200 p-3.5">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-sm font-bold text-slate-800">
                              {locale === 'th' ? (duty.dutyAreaTh || duty.dutyArea) : (duty.dutyArea || duty.dutyAreaTh)}
                            </p>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">{duty.weightPercent}%</span>
                          </div>
                          <ul className="space-y-1.5">
                            {(locale === 'th' ? (duty.tasksTh || duty.tasks || []) : (duty.tasks || duty.tasksTh || [])).map((task, ti) => (
                              <li key={ti} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="text-emerald-600 mt-0.5 shrink-0 font-bold">✦</span>
                                {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : responsibilities.length > 0 ? (
                    <ul className="space-y-2.5">
                      {responsibilities.map((r, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <span className="text-emerald-600 mt-0.5 shrink-0 font-bold">✦</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">{locale === 'th' ? 'ไม่มีข้อมูลหน้าที่ความรับผิดชอบ' : 'No responsibilities listed'}</p>
                  )}
                </div>

                {jd.kpis && jd.kpis.length > 0 && (
                  <>
                    <Separator className="bg-slate-100" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-3">{locale === 'th' ? 'ตัวชี้วัดผลงานหลัก (KPIs)' : 'Key Performance Indicators'}</h3>
                      <div className="space-y-2">
                        {jd.kpis.map((kpi, ki) => (
                          <div key={ki} className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-sm">
                            <p className="font-bold text-slate-800">{locale === 'th' ? (kpi.nameTh || kpi.name) : (kpi.name || kpi.nameTh)}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {locale === 'th' ? 'วิธีวัด' : 'Method'}: {locale === 'th' ? (kpi.methodTh || kpi.method) : (kpi.method || kpi.methodTh)} · {locale === 'th' ? 'เป้าหมาย' : 'Target'}: {locale === 'th' ? (kpi.targetTh || kpi.target) : (kpi.target || kpi.targetTh)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator className="bg-slate-100" />

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">{locale === 'th' ? 'คุณสมบัติที่ต้องการ' : 'Requirements'}</h3>
                  {requirements.length > 0 ? (
                    <ul className="space-y-2.5">
                      {requirements.map((r, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <span className="text-teal-600 mt-0.5 shrink-0 font-bold">●</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">{locale === 'th' ? 'ไม่มีข้อมูลคุณสมบัติที่ต้องการ' : 'No requirements listed'}</p>
                  )}
                </div>

                {jd.preferredSkills && jd.preferredSkills.length > 0 && (
                  <>
                    <Separator className="bg-slate-100" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-3">{locale === 'th' ? 'ทักษะที่ต้องการ' : 'Preferred Skills'}</h3>
                      <div className="flex flex-wrap gap-2">
                        {jd.preferredSkills.map(skill => (
                          <span key={skill} className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {jd.competencies && ((jd.competencies.core?.length || 0) > 0 || (jd.competencies.functional?.length || 0) > 0 || (jd.competencies.digitalAI?.length || 0) > 0) && (
                  <>
                    <Separator className="bg-slate-100" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-3">{locale === 'th' ? 'สมรรถนะที่ต้องการ (Competencies)' : 'Competencies'}</h3>
                      <div className="space-y-2 text-sm text-slate-700">
                        {((locale === 'th' ? jd.competencies.coreTh : jd.competencies.core)?.length || 0) > 0 && (
                          <p><span className="font-bold text-slate-800">Core:</span> {(locale === 'th' ? jd.competencies.coreTh : jd.competencies.core)?.join(', ')}</p>
                        )}
                        {jd.competencies.functional && jd.competencies.functional.length > 0 && (
                          <p><span className="font-bold text-slate-800">Functional:</span> {jd.competencies.functional.map(f => `${locale === 'th' ? (f.nameTh || f.name) : f.name} (Lv.${f.level})`).join(', ')}</p>
                        )}
                        {((locale === 'th' ? jd.competencies.digitalAITh : jd.competencies.digitalAI)?.length || 0) > 0 && (
                          <p><span className="font-bold text-slate-800">Digital &amp; AI Literacy:</span> {(locale === 'th' ? jd.competencies.digitalAITh : jd.competencies.digitalAI)?.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {jd.workingRelationships && (((jd.workingRelationships.internal?.length || 0) + (jd.workingRelationships.internalTh?.length || 0) + (jd.workingRelationships.external?.length || 0) + (jd.workingRelationships.externalTh?.length || 0)) > 0) && (
                  <>
                    <Separator className="bg-slate-100" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-3">{locale === 'th' ? 'ความสัมพันธ์ในการทำงาน' : 'Working Relationships'}</h3>
                      <div className="space-y-2 text-sm text-slate-700">
                        {((locale === 'th' ? jd.workingRelationships.internalTh : jd.workingRelationships.internal)?.length || 0) > 0 && (
                          <p><span className="font-bold text-slate-800">{locale === 'th' ? 'ภายใน' : 'Internal'}:</span> {(locale === 'th' ? jd.workingRelationships.internalTh : jd.workingRelationships.internal)?.join(', ')}</p>
                        )}
                        {((locale === 'th' ? jd.workingRelationships.externalTh : jd.workingRelationships.external)?.length || 0) > 0 && (
                          <p><span className="font-bold text-slate-800">{locale === 'th' ? 'ภายนอก' : 'External'}:</span> {(locale === 'th' ? jd.workingRelationships.externalTh : jd.workingRelationships.external)?.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {jd.workingConditions && (((jd.workingConditions.conditions?.length || 0) + (jd.workingConditions.conditionsTh?.length || 0) + (jd.workingConditions.risks?.length || 0) + (jd.workingConditions.risksTh?.length || 0)) > 0 || jd.workingConditions.pdpaInvolved) && (
                  <>
                    <Separator className="bg-slate-100" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-3">{locale === 'th' ? 'เงื่อนไขและความเสี่ยงของงาน' : 'Working Conditions & Risk'}</h3>
                      <div className="space-y-2 text-sm text-slate-700">
                        {((locale === 'th' ? jd.workingConditions.conditionsTh : jd.workingConditions.conditions)?.length || 0) > 0 && (
                          <p><span className="font-bold text-slate-800">{locale === 'th' ? 'ลักษณะงาน' : 'Conditions'}:</span> {(locale === 'th' ? jd.workingConditions.conditionsTh : jd.workingConditions.conditions)?.join(', ')}</p>
                        )}
                        {((locale === 'th' ? jd.workingConditions.risksTh : jd.workingConditions.risks)?.length || 0) > 0 && (
                          <p><span className="font-bold text-slate-800">{locale === 'th' ? 'ความเสี่ยง' : 'Risks'}:</span> {(locale === 'th' ? jd.workingConditions.risksTh : jd.workingConditions.risks)?.join(', ')}</p>
                        )}
                        {jd.workingConditions.pdpaInvolved && (
                          <p className="inline-flex font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-xs">
                            🔒 {locale === 'th' ? 'เกี่ยวข้องกับภาระหน้าที่ตาม PDPA' : 'Involves PDPA data-protection duties'}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {jd.reviewFlags && jd.reviewFlags.length > 0 && (
                  <>
                    <Separator className="bg-slate-100" />
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5">
                      <h3 className="text-sm font-bold text-amber-900 mb-2">⚠️ {locale === 'th' ? 'ข้อที่ต้องให้หน่วยงานยืนยัน' : 'Items requiring confirmation'}</h3>
                      <ul className="space-y-1">
                        {jd.reviewFlags.map((flag, i) => (
                          <li key={i} className="text-xs text-amber-800">• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {jd.salaryRange && (
                  <>
                    <Separator className="bg-slate-100" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">{locale === 'th' ? 'ค่าตอบแทน' : 'Compensation'}</h3>
                      <p className="text-base text-emerald-700 font-bold">
                        {jd.salaryRange.min.toLocaleString()} - {jd.salaryRange.max.toLocaleString()} {jd.salaryRange.currency}/month
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
              <CardContent className="py-16 text-center">
                <div className="flex justify-center mb-3">
                  <HugeiconsIcon icon={AssignmentsIcon} size={40} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium mb-4">
                  {locale === 'th' ? 'ยังไม่มี Job Description' : 'No Job Description yet'}
                </p>
                <Button
                  onClick={handleRegenerateJD}
                  disabled={isRegenerating}
                  className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  {isRegenerating ? 'Claude กำลังร่าง JD...' : (
                    <>
                      <HugeiconsIcon icon={ChatBotIcon} size={15} />
                      <span>{t('vacancy.generateJD')} ด้วย Claude</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <div className="space-y-3">
            {applications.length > 0 ? applications.map(app => (
              <Link key={app.id} href={`/dashboard/applications/${app.id}`}>
                <Card className="border-slate-200 bg-white hover:bg-emerald-50/20 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer rounded-2xl shadow-xs mb-3">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-sm font-bold text-white shadow-sm">
                          {app.candidate.firstName[0]}{app.candidate.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {locale === 'th' ? `${app.candidate.firstNameTh} ${app.candidate.lastNameTh}` : `${app.candidate.firstName} ${app.candidate.lastName}`}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {app.candidate.currentPosition} @ {app.candidate.currentCompany}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {app.matchScore && <MatchScoreRadial score={app.matchScore} size={44} />}
                        <ApplicationStateBadge state={app.state} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )) : (
              <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
                <div className="flex justify-center mb-2">
                  <HugeiconsIcon icon={Quiz03Icon} size={40} className="text-slate-300" />
                </div>
                <p className="font-semibold text-slate-600">{locale === 'th' ? 'ยังไม่มีผู้สมัคร' : 'No applications yet'}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Position Tab */}
        <TabsContent value="position">
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {locale === 'th' ? 'ข้อมูลสรุปตำแหน่งงาน' : 'Position Summary'}
                </h4>
                <Button
                  size="sm"
                  onClick={openEditModal}
                  variant="outline"
                  className="text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <HugeiconsIcon icon={Edit02Icon} size={13} />
                  <span>{locale === 'th' ? 'แก้ไขข้อมูล' : 'Edit Info'}</span>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold mb-1">{locale === 'th' ? 'ระดับ' : 'Level'}</p>
                  <p className="text-sm font-bold text-slate-900">{vacancy.position.level}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold mb-1">{locale === 'th' ? 'สายงาน' : 'Reports to'}</p>
                  <p className="text-sm font-bold text-slate-900">{vacancy.position.reportTo}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold mb-1">{locale === 'th' ? 'เหตุผล' : 'Reason'}</p>
                  <p className="text-sm font-bold text-slate-900">{vacancy.reason.replace(/_/g, ' ')}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold mb-1">{locale === 'th' ? 'วันที่เปิด' : 'Open date'}</p>
                  <p className="text-sm font-bold text-slate-900">{new Date(vacancy.openDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Success Toast */}
      {editToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border border-emerald-500/30 animate-fade-in">
          <HugeiconsIcon icon={CheckmarkSquare01Icon} size={16} className="text-emerald-400" />
          <span>{editToast}</span>
        </div>
      )}

      {/* Edit Vacancy & Job Description Modal */}
      {mounted && isEditModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-hidden">
          <div
            className="absolute inset-0"
            onClick={() => !isSavingEdit && setIsEditModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                  <HugeiconsIcon icon={Edit02Icon} size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
                    <span>{locale === 'th' ? 'แก้ไขข้อมูลตำแหน่งงาน & รายละเอียดงาน' : 'Edit Job Position & Description'}</span>
                  </h2>
                  <p className="text-[11px] sm:text-xs text-emerald-200 font-medium">
                    {locale === 'th' ? 'ปรับแต่งรายละเอียดของตำแหน่งงาน หน้าที่ความรับผิดชอบ และคุณสมบัติตามต้องการ' : 'Customize job information, responsibilities, and requirements'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isSavingEdit && setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm cursor-pointer transition-colors shrink-0"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* Position Details Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <HugeiconsIcon icon={Briefcase06Icon} size={14} className="text-emerald-700" />
                  <span>{locale === 'th' ? '1. ข้อมูลตำแหน่งงาน (Position Information)' : '1. Position Information'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">{locale === 'th' ? 'ชื่อตำแหน่งงาน (ไทย) *' : 'Job Title (Thai) *'}</label>
                    <Input
                      value={editTitleTh}
                      onChange={(e) => setEditTitleTh(e.target.value)}
                      placeholder="เช่น นักออกแบบการเรียนรู้"
                      className="font-bold text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">{locale === 'th' ? 'ชื่อตำแหน่งงาน (อังกฤษ) *' : 'Job Title (English) *'}</label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="e.g. Instructional Designer"
                      className="font-bold text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>{locale === 'th' ? 'สังกัด / แผนก *' : 'Department *'}</span>
                      <button
                        type="button"
                        onClick={() => setIsCustomDept(!isCustomDept)}
                        className="text-[10px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                      >
                        {isCustomDept ? (locale === 'th' ? 'เลือกจากรายการ' : 'Select from list') : (locale === 'th' ? '+ ระบุเอง' : '+ Custom')}
                      </button>
                    </label>

                    {isCustomDept ? (
                      <Input
                        value={customDept}
                        onChange={(e) => setCustomDept(e.target.value)}
                        placeholder="พิมพ์ชื่อสังกัด/หน่วยงาน..."
                        className="text-xs font-bold"
                      />
                    ) : (
                      <select
                        value={editDepartment}
                        onChange={(e) => setEditDepartment(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800 focus:outline-emerald-500"
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
                    <label className="text-xs font-bold text-slate-700">{locale === 'th' ? 'จำนวนที่เปิดรับ (อัตรา)' : 'Headcount'}</label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={editHeadcount}
                      onChange={(e) => setEditHeadcount(Math.max(1, Number(e.target.value)))}
                      className="text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">{locale === 'th' ? 'ระดับความเร่งด่วน' : 'Priority'}</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800 focus:outline-emerald-500"
                    >
                      <option value="LOW">{locale === 'th' ? 'ต่ำ (LOW)' : 'Low'}</option>
                      <option value="MEDIUM">{locale === 'th' ? 'ปานกลาง (MEDIUM)' : 'Medium'}</option>
                      <option value="HIGH">{locale === 'th' ? 'สูง (HIGH)' : 'High'}</option>
                      <option value="URGENT">{locale === 'th' ? 'เร่งด่วนพิเศษ (URGENT)' : 'Urgent'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* JD Details Section */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                  <HugeiconsIcon icon={AssignmentsIcon} size={14} className="text-emerald-700" />
                  <span>{locale === 'th' ? '2. รายละเอียด Job Description' : '2. Job Description Details'}</span>
                </h3>

                {/* Summary */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{locale === 'th' ? 'สรุปภาพรวมงาน (Job Summary)' : 'Job Summary'}</label>
                  <textarea
                    rows={3}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    placeholder="ระบุภาพรวมและเป้าหมายของตำแหน่งงาน..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-emerald-500"
                  />
                </div>

                {/* Responsibilities */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{locale === 'th' ? 'หน้าที่ความรับผิดชอบ (Responsibilities)' : 'Responsibilities'}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({editResponsibilities.length} ข้อ)</span>
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {editResponsibilities.map((resp, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold shrink-0">•</span>
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
                          className="text-rose-500 hover:text-rose-700 text-xs p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
                          title="ลบข้อนี้"
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={newRespItem}
                      onChange={(e) => setNewRespItem(e.target.value)}
                      placeholder={locale === 'th' ? '+ เพิ่มหน้าที่รับผิดชอบใหม่...' : '+ Add new responsibility...'}
                      className="text-xs py-1.5 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newRespItem.trim()) {
                          e.preventDefault();
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
                      className="text-xs font-bold shrink-0"
                    >
                      {locale === 'th' ? 'เพิ่ม' : 'Add'}
                    </Button>
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{locale === 'th' ? 'คุณสมบัติที่ต้องการ (Requirements & Qualifications)' : 'Requirements'}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({editRequirements.length} ข้อ)</span>
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {editRequirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-teal-600 font-bold shrink-0">●</span>
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
                          className="text-rose-500 hover:text-rose-700 text-xs p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
                          title="ลบข้อนี้"
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={newReqItem}
                      onChange={(e) => setNewReqItem(e.target.value)}
                      placeholder={locale === 'th' ? '+ เพิ่มคุณสมบัติใหม่...' : '+ Add new requirement...'}
                      className="text-xs py-1.5 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newReqItem.trim()) {
                          e.preventDefault();
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
                      className="text-xs font-bold shrink-0"
                    >
                      {locale === 'th' ? 'เพิ่ม' : 'Add'}
                    </Button>
                  </div>
                </div>

                {/* Preferred Skills */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">{locale === 'th' ? 'ทักษะเฉพาะทางที่ต้องการ (Preferred Skills)' : 'Preferred Skills'}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {editPreferredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold inline-flex items-center gap-1.5"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => setEditPreferredSkills(editPreferredSkills.filter((_, i) => i !== idx))}
                          className="hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={newSkillItem}
                      onChange={(e) => setNewSkillItem(e.target.value)}
                      placeholder={locale === 'th' ? '+ เพิ่มทักษะใหม่ เช่น Figma, SQL, React...' : '+ Add skill...'}
                      className="text-xs py-1.5 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newSkillItem.trim()) {
                          e.preventDefault();
                          if (!editPreferredSkills.includes(newSkillItem.trim())) {
                            setEditPreferredSkills([...editPreferredSkills, newSkillItem.trim()]);
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
                        if (newSkillItem.trim()) {
                          if (!editPreferredSkills.includes(newSkillItem.trim())) {
                            setEditPreferredSkills([...editPreferredSkills, newSkillItem.trim()]);
                          }
                          setNewSkillItem('');
                        }
                      }}
                      className="text-xs font-bold shrink-0"
                    >
                      {locale === 'th' ? 'เพิ่มทักษะ' : 'Add Skill'}
                    </Button>
                  </div>
                </div>

                {/* Salary Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">{locale === 'th' ? 'เงินเดือนเริ่มต้น (บาท)' : 'Min Salary (THB)'}</label>
                    <Input
                      type="number"
                      step={1000}
                      value={editSalaryMin}
                      onChange={(e) => setEditSalaryMin(Number(e.target.value))}
                      className="text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">{locale === 'th' ? 'เงินเดือนสูงสุด (บาท)' : 'Max Salary (THB)'}</label>
                    <Input
                      type="number"
                      step={1000}
                      value={editSalaryMax}
                      onChange={(e) => setEditSalaryMax(Number(e.target.value))}
                      className="text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSavingEdit}
                className="text-xs font-semibold rounded-xl"
              >
                {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit || (!editTitle.trim() && !editTitleTh.trim())}
                className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 px-5 flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingEdit ? (
                  <span className="inline-flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    <span>{locale === 'th' ? 'กำลังบันทึกข้อมูล...' : 'Saving...'}</span>
                  </span>
                ) : (
                  <>
                    <HugeiconsIcon icon={FloppyDiskIcon} size={15} />
                    <span>{locale === 'th' ? 'บันทึกการแก้ไข' : 'Save Changes'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
