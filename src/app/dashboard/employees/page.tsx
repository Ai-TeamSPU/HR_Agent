'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { EmployeeStatusBadge, PriorityBadge } from '@/pagefront/components/StateBadge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  HierarchyIcon,
  UserMultiple03Icon,
  CircleIcon,
  Building05Icon,
  Search01Icon,
  ReloadIcon,
  ChatBotIcon,
  LogOutIcon,
  Briefcase06Icon,
  Cancel01Icon,
  CheckmarkSquare01Icon,
  AssignmentsIcon,
} from '@hugeicons/core-free-icons';

import {
  fetchEmployeesFromDB,
  fetchEmployeeStatsFromDB,
  fetchDepartmentsListFromDB,
  updateEmployeeStatusInDB,
  generateReplacementJDWithAI,
  createReplacementVacancyAndNotify,
} from '@/pageback/services';

import type { Employee, EmployeeStatus, EmployeeStats } from '@/lib/types/employee';
import type { AIJDGenerationResponse } from '@/lib/types/ai';

export default function PersonnelManagementPage() {
  const { locale, t } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats>({ total: 0, active: 0, resigned: 0, totalDepartments: 0 });
  const [parentDepartments, setParentDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'ALL'>('ALL');
  const [parentDeptFilter, setParentDeptFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Resignation & AI Modal States (Option B)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{ success: boolean; vacancyId?: string } | null>(null);

  // Editable JD & Vacancy Fields
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editResponsibilities, setEditResponsibilities] = useState<string[]>([]);
  const [newRespItem, setNewRespItem] = useState('');
  const [editRequirements, setEditRequirements] = useState<string[]>([]);
  const [newReqItem, setNewReqItem] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [newSkillItem, setNewSkillItem] = useState('');
  const [editPriority, setEditPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');
  const [editHeadcount, setEditHeadcount] = useState(1);
  const [editSalaryMin, setEditSalaryMin] = useState(35000);
  const [editSalaryMax, setEditSalaryMax] = useState(65000);

  // Simple Status Switch Modal (Revert to Active)
  const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);
  const [simpleTargetStatus, setSimpleTargetStatus] = useState<EmployeeStatus>('ACTIVE');

  // Load Employees Data
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    const res = await fetchEmployeesFromDB({
      page,
      pageSize,
      search,
      status: statusFilter,
      parentDepartment: parentDeptFilter,
    });
    setEmployees(res.data);
    setTotalCount(res.count);
    setTotalPages(res.totalPages);
    setLoading(false);
  }, [page, pageSize, search, statusFilter, parentDeptFilter]);

  // Load Initial Metadata (Stats & Departments)
  const loadMetadata = async () => {
    const [statsData, deptsData] = await Promise.all([
      fetchEmployeeStatsFromDB(),
      fetchDepartmentsListFromDB(),
    ]);
    setStats(statsData);
    setParentDepartments(deptsData.parentDepartments);
  };

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Debounced search reset page
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Open Resignation & AI JD Workflow (Option B)
  const handleOpenResignationWorkflow = async (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsResignModalOpen(true);
    setSubmissionSuccess(null);
    setIsAiGenerating(true);

    try {
      // Trigger AI to generate Replacement JD live
      const aiJd = await generateReplacementJDWithAI(emp);

      // Populate Editable Fields
      setEditJobTitle(aiJd.jobTitleTh || emp.position);
      setEditSummary(aiJd.summaryTh || aiJd.summary || '');
      setEditResponsibilities(aiJd.responsibilitiesTh || aiJd.responsibilities || []);
      setEditRequirements(aiJd.requirementsTh || aiJd.requirements || []);
      setEditSkills(aiJd.preferredSkills || [emp.position, emp.department]);
      setEditSalaryMin(aiJd.salaryMin || 35000);
      setEditSalaryMax(aiJd.salaryMax || 65000);
      setEditPriority('HIGH');
      setEditHeadcount(1);
    } catch (err) {
      console.warn('AI Generation fallback:', err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Regenerate AI JD inside Modal
  const handleRegenerateAI = async () => {
    if (!selectedEmployee) return;
    setIsAiGenerating(true);
    try {
      const aiJd = await generateReplacementJDWithAI(selectedEmployee);
      setEditJobTitle(aiJd.jobTitleTh || selectedEmployee.position);
      setEditSummary(aiJd.summaryTh || aiJd.summary || '');
      setEditResponsibilities(aiJd.responsibilitiesTh || aiJd.responsibilities || []);
      setEditRequirements(aiJd.requirementsTh || aiJd.requirements || []);
      setEditSkills(aiJd.preferredSkills || [selectedEmployee.position, selectedEmployee.department]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Confirm Resignation & Create Replacement Vacancy
  const handleConfirmResignationAndVacancy = async () => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);

    const jdPayload: AIJDGenerationResponse = {
      jobTitle: editJobTitle,
      jobTitleTh: editJobTitle,
      summary: editSummary,
      summaryTh: editSummary,
      responsibilities: editResponsibilities,
      responsibilitiesTh: editResponsibilities,
      requirements: editRequirements,
      requirementsTh: editRequirements,
      preferredSkills: editSkills,
      education: ['ปริญญาตรีขึ้นไปในสาขาที่เกี่ยวข้อง'],
      experience: ['ประสบการณ์การทำงาน 1-3 ปีขึ้นไป'],
      benefits: ['Social Security', 'Health Insurance', 'Annual Bonus'],
      benefitsTh: ['ประกันสังคม', 'ประกันสุขภาพกลุ่ม', 'โบนัสประจำปีตามผลงาน'],
      salaryMin: editSalaryMin,
      salaryMax: editSalaryMax,
      confidence: 0.96,
      modelVersion: 'Google Gemini Live',
      generatedAt: new Date().toISOString(),
    };

    const res = await createReplacementVacancyAndNotify(
      selectedEmployee,
      jdPayload,
      {
        priority: editPriority,
        headcount: editHeadcount,
        salaryMin: editSalaryMin,
        salaryMax: editSalaryMax,
      }
    );

    setIsSubmitting(false);

    if (res.success) {
      setSubmissionSuccess({ success: true, vacancyId: res.vacancyId });
      await Promise.all([loadEmployees(), loadMetadata()]);
    } else {
      alert(`เกิดข้อผิดพลาด: ${res.message}`);
    }
  };

  // Simple Status Switch Handler (e.g. Revert to Active)
  const handleSimpleStatusSwitch = async () => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    const ok = await updateEmployeeStatusInDB(selectedEmployee.id, simpleTargetStatus);
    setIsSubmitting(false);
    setIsSimpleModalOpen(false);
    if (ok) {
      await Promise.all([loadEmployees(), loadMetadata()]);
    } else {
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  // Helper: Format Date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <HugeiconsIcon icon={HierarchyIcon} size={28} className="text-pink-600 dark:text-pink-400 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Personnel Management
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs">
              Live DB
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {locale === 'th'
              ? `ระบบจัดการข้อมูลบุคลากร มหาวิทยาลัยศรีปทุม (SPU) และกระบวนการ AI สร้าง JD อัตโนมัติเมื่อบุคลากรลาออก`
              : `SPU Personnel directory with automated AI replacement JD workflow on resignation`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link href="/dashboard/vacancies">
            <Button
              variant="outline"
              className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-1.5"
            >
              <HugeiconsIcon icon={Briefcase06Icon} size={14} />
              <span>{locale === 'th' ? 'ดูตำแหน่งงานทั้งหมด' : 'View All Vacancies'}</span>
            </Button>
          </Link>
          <Link href="/dashboard/ai-agent">
            <Button
              className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <HugeiconsIcon icon={ChatBotIcon} size={15} />
              <span>{locale === 'th' ? 'AI Agent Console' : 'AI Console'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all rounded-2xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">{locale === 'th' ? 'บุคลากรทั้งหมด' : 'Total Personnel'}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total.toLocaleString()}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{locale === 'th' ? 'ในฐานข้อมูลระบบ' : 'In Database'}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
              <HugeiconsIcon icon={UserMultiple03Icon} size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all rounded-2xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700">{locale === 'th' ? 'ปฏิบัติงานปกติ' : 'Active Staff'}</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{stats.active.toLocaleString()}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                {stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(1)}% ของทั้งหมด` : ''}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
              <HugeiconsIcon icon={CircleIcon} size={20} className="text-emerald-500 fill-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs hover:border-slate-300 transition-all rounded-2xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600">{locale === 'th' ? 'ลาออกแล้ว' : 'Resigned Staff'}</p>
              <h3 className="text-2xl font-black text-slate-700 mt-1">{stats.resigned.toLocaleString()}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {stats.total > 0 ? `${((stats.resigned / stats.total) * 100).toFixed(1)}% ของทั้งหมด` : ''}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center">
              <HugeiconsIcon icon={CircleIcon} size={20} className="text-rose-500 fill-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs hover:border-teal-200 transition-all rounded-2xl bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-teal-700">{locale === 'th' ? 'คณะ / สังกัด' : 'Faculties & Units'}</p>
              <h3 className="text-2xl font-black text-teal-800 mt-1">{stats.totalDepartments}</h3>
              <p className="text-[11px] text-teal-600 mt-0.5">{locale === 'th' ? 'กลุ่มงานและคณะวิชา' : 'Academic & Operations'}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
              <HugeiconsIcon icon={Building05Icon} size={24} />
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Main Filter & Action Bar */}
      <Card className="border-slate-200/80 shadow-xs rounded-2xl bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                value={search}
                onChange={handleSearchChange}
                placeholder={
                  locale === 'th'
                    ? 'ค้นหาด้วยรหัสพนักงาน, ชื่อ-นามสกุล, ตำแหน่ง, หรือหน่วยงาน...'
                    : 'Search by employee code, name, position, or department...'
                }
                className="pl-9 pr-4 py-2 bg-slate-50/70 border-slate-200 rounded-xl text-xs font-medium focus:bg-white transition-all"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Department Dropdown */}
            <div className="w-full lg:w-72">
              <select
                value={parentDeptFilter}
                onChange={(e) => {
                  setParentDeptFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white transition-all cursor-pointer"
              >
                <option value="ALL">🏢 {locale === 'th' ? 'ทุกคณะ / ต้นสังกัด (ทั้งหมด)' : 'All Faculties & Divisions'}</option>
                {parentDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Size */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{locale === 'th' ? 'แสดง:' : 'Show:'}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <Separator className="bg-slate-100" />

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
              >
                {locale === 'th' ? 'ทั้งหมด' : 'All'} ({stats.total.toLocaleString()})
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ACTIVE');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/60'
                  }`}
              >
                <span>🟢</span>
                <span>{locale === 'th' ? 'ปฏิบัติงานปกติ' : 'Active'}</span>
                <span className="opacity-80 font-normal">({stats.active.toLocaleString()})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter('RESIGNED');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${statusFilter === 'RESIGNED'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                  }`}
              >
                <span>🔴</span>
                <span>{locale === 'th' ? 'ลาออกแล้ว' : 'Resigned'}</span>
                <span className="opacity-80 font-normal">({stats.resigned.toLocaleString()})</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  กำลังดึงข้อมูล...
                </span>
              ) : (
                <span>
                  {locale === 'th'
                    ? `พบ ${totalCount.toLocaleString()} รายการ (หน้า ${page}/${totalPages || 1})`
                    : `Found ${totalCount.toLocaleString()} items (Page ${page}/${totalPages || 1})`}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees Data Table */}
      <Card className="border-slate-200/80 shadow-xs rounded-2xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-28">{locale === 'th' ? 'รหัสพนักงาน' : 'Code'}</th>
                <th className="py-3 px-4">{locale === 'th' ? 'ชื่อ - นามสกุล' : 'Full Name'}</th>
                <th className="py-3 px-4">{locale === 'th' ? 'ตำแหน่งงาน' : 'Position'}</th>
                <th className="py-3 px-4">{locale === 'th' ? 'ระดับ' : 'Level'}</th>
                <th className="py-3 px-4">{locale === 'th' ? 'ต้นสังกัด / หน่วยงาน' : 'Department'}</th>
                <th className="py-3 px-4">{locale === 'th' ? 'ประเภท' : 'Type'}</th>
                <th className="py-3 px-4">{locale === 'th' ? 'วันเริ่มงาน' : 'Hire Date'}</th>
                <th className="py-3 px-4 text-center">{locale === 'th' ? 'อายุงาน' : 'Tenure'}</th>
                <th className="py-3 px-4 text-center">{locale === 'th' ? 'สถานะ' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{locale === 'th' ? 'จัดการ' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-500 font-semibold text-xs">กำลังโหลดข้อมูลบุคลากรจากฐานข้อมูล...</p>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400 font-medium">
                    <div className="flex justify-center mb-2">
                      <HugeiconsIcon icon={Search01Icon} size={36} className="text-slate-300" />
                    </div>
                    {locale === 'th' ? 'ไม่พบข้อมูลบุคลากรตามเงื่อนไขที่ค้นหา' : 'No personnel found matching the criteria'}
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const fullName = `${emp.prefix ? emp.prefix + ' ' : ''}${emp.firstName} ${emp.lastName}`.trim();
                  const isForeigner = emp.nationalityGroup === 'ต่างชาติ';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px] border border-slate-200/80">
                          {emp.employeeCode}
                        </span>
                      </td>

                      {/* Full Name */}
                      <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{fullName}</span>
                          {isForeigner && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] px-1 py-0">
                              ต่างชาติ
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block font-normal">{emp.email}</span>
                      </td>

                      {/* Position */}
                      <td className="py-3.5 px-4 font-semibold text-emerald-950">
                        {emp.position}
                      </td>

                      {/* Level */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-[11px]">
                        <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-medium">
                          {emp.level || 'เจ้าหน้าที่'}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-semibold text-slate-800">{emp.parentDepartment || emp.department}</div>
                        {emp.department && emp.department !== emp.parentDepartment && (
                          <div className="text-[11px] text-slate-400">{emp.department}</div>
                        )}
                      </td>

                      {/* Employment Type */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {emp.employmentType}
                      </td>

                      {/* Hire Date */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(emp.hireDate)}
                      </td>

                      {/* Tenure */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-slate-700">{emp.tenureYears}</span>
                        <span className="text-slate-400 text-[10px] ml-0.5">ปี</span>
                        {emp.age && (
                          <span className="text-slate-400 text-[10px] block font-normal">อายุ {emp.age}</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <EmployeeStatusBadge status={emp.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {emp.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenResignationWorkflow(emp)}
                            className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white font-bold text-[11px] rounded-lg shadow-xs shadow-rose-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <HugeiconsIcon icon={LogOutIcon} size={13} />
                            <span>{locale === 'th' ? 'แจ้งลาออก (สร้าง JD)' : 'Resign (AI JD)'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setSimpleTargetStatus('ACTIVE');
                              setIsSimpleModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <HugeiconsIcon icon={ReloadIcon} size={13} />
                            <span>{locale === 'th' ? 'ปรับเป็นปกติ' : 'Revert Active'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              {locale === 'th'
                ? `แสดงแถวที่ ${((page - 1) * pageSize + 1).toLocaleString()} ถึง ${Math.min(
                  page * pageSize,
                  totalCount
                ).toLocaleString()} จากทั้งหมด ${totalCount.toLocaleString()} รายการ`
                : `Showing ${((page - 1) * pageSize + 1).toLocaleString()} to ${Math.min(
                  page * pageSize,
                  totalCount
                ).toLocaleString()} of ${totalCount.toLocaleString()}`}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="h-8 px-2.5 text-xs rounded-lg"
              >
                ««
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 px-3 text-xs rounded-lg"
              >
                {locale === 'th' ? 'ก่อนหน้า' : 'Previous'}
              </Button>

              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800">
                {page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 px-3 text-xs rounded-lg"
              >
                {locale === 'th' ? 'ถัดไป' : 'Next'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="h-8 px-2.5 text-xs rounded-lg"
              >
                »»
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Option B Modal: Resignation & AI Auto-Replacement JD Review/Editor */}
      {mounted && isResignModalOpen && selectedEmployee && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-hidden">
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0"
            onClick={() => !isSubmitting && setIsResignModalOpen(false)}
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
                    <span>กระบวนการ AI: บันทึกการลาออก & ร่าง JD ทดแทน</span>
                    <Badge className="bg-amber-400 text-slate-900 font-extrabold text-[10px]">AI Action</Badge>
                  </h2>
                  <p className="text-[11px] sm:text-xs text-emerald-200 font-medium">
                    ตรวจสอบและปรับแต่ง Job Description ที่ AI ร่างขึ้นก่อนสร้างตำแหน่งงานใหม่
                  </p>
                </div>
              </div>

              <button
                onClick={() => !isSubmitting && setIsResignModalOpen(false)}
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
                    บันทึกการลาออก & สร้างตำแหน่งงานทดแทนสำเร็จ!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    ระบบได้ปรับสถานะของ <b>{selectedEmployee.firstName} {selectedEmployee.lastName}</b> เป็น <span className="text-rose-600 font-bold">"ลาออก"</span> และสร้างตำแหน่งงานว่าง (Vacancy #{submissionSuccess.vacancyId}) พร้อมส่งการแจ้งเตือนสดขึ้นแถบ Header เรียบร้อยแล้ว
                  </p>

                  <div className="pt-4 flex items-center justify-center gap-3">
                    <Link href={`/dashboard/vacancies`}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5">
                        <HugeiconsIcon icon={Briefcase06Icon} size={14} />
                        <span>ดูรายการตำแหน่งงานทั้งหมด</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => setIsResignModalOpen(false)}
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
                    AI กำลังดึงหน้าที่เดิมของตำแหน่ง <b>"{selectedEmployee.position}"</b> ใน <b>"{selectedEmployee.department}"</b> เพื่อจัดทำคุณสมบัติและทักษะที่จำเป็นสำหรับตำแหน่งทดแทน
                  </p>
                </div>
              ) : (
                /* Edit Form (Option B) */
                <div className="space-y-5">
                  {/* Resigning Employee Banner */}
                  <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">บุคลากรที่แจ้งลาออก:</span>
                      <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {selectedEmployee.prefix} {selectedEmployee.firstName} {selectedEmployee.lastName} ({selectedEmployee.employeeCode})
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        ตำแหน่งปัจจุบัน: <span className="font-bold text-emerald-800">{selectedEmployee.position}</span> | สังกัด: {selectedEmployee.parentDepartment || selectedEmployee.department}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-bold self-start sm:self-center">
                      สถานะใหม่: ลาออก (RESIGNED)
                    </Badge>
                  </div>

                  {/* AI Generated JD Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <HugeiconsIcon icon={AssignmentsIcon} size={16} className="text-emerald-700" />
                        <span>รายละเอียด Job Description ตำแหน่งทดแทน</span>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                          AI Drafted
                        </Badge>
                      </h3>

                      <button
                        type="button"
                        onClick={handleRegenerateAI}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60"
                      >
                        <HugeiconsIcon icon={ReloadIcon} size={13} />
                        <span>ร่างใหม่ด้วย AI</span>
                      </button>
                    </div>

                    {/* Job Title & Priority */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-700">ชื่อตำแหน่งงานทดแทน (Job Title)</label>
                        <Input
                          value={editJobTitle}
                          onChange={(e) => setEditJobTitle(e.target.value)}
                          className="font-bold text-xs"
                        />
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

                    {/* Headcount & Salary Range */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">จำนวนที่ต้องการรับ (คน)</label>
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
                        <label className="text-xs font-bold text-slate-700">เงินเดือนเริ่มต้น (บาท)</label>
                        <Input
                          type="number"
                          step={1000}
                          value={editSalaryMin}
                          onChange={(e) => setEditSalaryMin(Number(e.target.value))}
                          className="text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">เงินเดือนสูงสุด (บาท)</label>
                        <Input
                          type="number"
                          step={1000}
                          value={editSalaryMax}
                          onChange={(e) => setEditSalaryMax(Number(e.target.value))}
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
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-emerald-500"
                      />
                    </div>

                    {/* Responsibilities */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700">หน้าที่ความรับผิดชอบหลัก (Responsibilities)</label>
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
                              className="text-rose-500 hover:text-rose-700 text-xs px-2 py-1"
                            >
                              <HugeiconsIcon icon={Cancel01Icon} size={13} />
                            </button>
                          </div>
                        ))}
                      </div>

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
                      <label className="text-xs font-bold text-slate-700">คุณสมบัติผู้สมัคร (Qualifications & Requirements)</label>
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
                              className="text-rose-500 hover:text-rose-700 text-xs px-2 py-1"
                            >
                              <HugeiconsIcon icon={Cancel01Icon} size={13} />
                            </button>
                          </div>
                        ))}
                      </div>

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
                      <label className="text-xs font-bold text-slate-700">ทักษะที่ต้องการ (Skills Tags)</label>
                      <div className="flex flex-wrap gap-1.5">
                        {editSkills.map((sk, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold text-xs py-1 px-2.5 flex items-center gap-1.5"
                          >
                            <span>{sk}</span>
                            <button
                              type="button"
                              onClick={() => setEditSkills(editSkills.filter((_, i) => i !== idx))}
                              className="hover:text-rose-600 font-bold"
                            >
                              <HugeiconsIcon icon={Cancel01Icon} size={11} />
                            </button>
                          </Badge>
                        ))}
                      </div>
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
                  onClick={() => setIsResignModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs font-semibold rounded-xl"
                >
                  ยกเลิก
                </Button>

                <Button
                  onClick={handleConfirmResignationAndVacancy}
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
                      <span>ยืนยันบันทึกการลาออก & เปิดรับตำแหน่งทดแทน</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Simple Status Switch Modal (Revert to Active) */}
      {mounted && isSimpleModalOpen && selectedEmployee && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-hidden">
          <div
            className="absolute inset-0"
            onClick={() => !isSubmitting && setIsSimpleModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scale-in my-auto">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <HugeiconsIcon icon={ReloadIcon} size={18} className="text-slate-700" />
              <span>ปรับเปลี่ยนสถานะบุคลากร</span>
            </h3>
            <p className="text-xs text-slate-600">
              ต้องการปรับสถานะของคุณ <b>{selectedEmployee.firstName} {selectedEmployee.lastName}</b> กลับเป็นสถานะ:
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">เลือกสถานะใหม่:</label>
              <select
                value={simpleTargetStatus}
                onChange={(e) => setSimpleTargetStatus(e.target.value as EmployeeStatus)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-800"
              >
                <option value="ACTIVE">🟢 ปฏิบัติงานปกติ (ACTIVE)</option>
                <option value="RESIGNED">🔴 ลาออก (RESIGNED)</option>
                <option value="TERMINATED">⚫ พ้นสภาพ (TERMINATED)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSimpleModalOpen(false)}
                disabled={isSubmitting}
                className="text-xs font-semibold rounded-xl"
              >
                ยกเลิก
              </Button>
              <Button
                size="sm"
                onClick={handleSimpleStatusSwitch}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
