'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { MatchScoreRadial } from '@/pagefront/components/MatchScoreRadial';
import { ApplicationStateBadge } from '@/pagefront/components/StateBadge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  User03Icon,
  ClipboardListIcon,
  StarIcon,
  BaggageClaimIcon,
  Target01Icon,
  Search01Icon,
  Quiz03Icon,
  Mail01Icon,
  SmartPhone01Icon,
  Building05Icon,
  ViewIcon,
  Cancel01Icon,
  CheckmarkSquare01Icon,
  Briefcase06Icon,
  UserGroupIcon,
  Tag01Icon,
  SparklesIcon,
  Alert02Icon,
} from '@hugeicons/core-free-icons';
import {
  fetchCandidatesFromDB,
  fetchApplicationsFromDB,
  fetchVacanciesFromDB,
  submitApplicationToDB,
} from '@/pageback/services';

import type { Candidate, Application } from '@/lib/types/candidate';
import type { Vacancy } from '@/lib/types/vacancy';

const POPULAR_SKILL_CHIPS = [
  'ALL',
  'React',
  'TypeScript',
  'Python',
  'Machine Learning',
  'PostgreSQL',
  'SQL',
  'Data Analysis',
  'Problem Solving',
  'Teamwork',
];

export default function TalentPoolPage() {
  const { locale, t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('ALL');
  const [expFilter, setExpFilter] = useState<'ALL' | '0-2' | '3-5' | '5+'>('ALL');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | 'HIGH_SCORE' | 'EXPERIENCED' | 'HAS_RESUME'>('ALL');

  // Re-engage / Invite to Vacancy Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [targetVacancyId, setTargetVacancyId] = useState<string>('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [cands, apps, vacs] = await Promise.all([
      fetchCandidatesFromDB(),
      fetchApplicationsFromDB(),
      fetchVacanciesFromDB(),
    ]);
    setCandidates(cands);
    setApplications(apps);
    setVacancies(vacs);
    if (vacs.length > 0) {
      setTargetVacancyId(vacs[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Exclude candidates who have already been hired (สถานะ 'HIRED' รับเข้าทำงานแล้ว)
  const availableCandidates = candidates.filter(c => {
    const isHired = applications.some(a => a.candidateId === c.id && a.state === 'HIRED');
    return !isHired;
  });

  // Filter Logic
  const filteredCandidates = availableCandidates.filter(c => {
    const q = search.toLowerCase();
    const matchSearch =
      search === '' ||
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      (c.firstNameTh && c.firstNameTh.includes(search)) ||
      (c.lastNameTh && c.lastNameTh.includes(search)) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(search)) ||
      (c.currentPosition && c.currentPosition.toLowerCase().includes(q)) ||
      (c.currentCompany && c.currentCompany.toLowerCase().includes(q)) ||
      c.skills.some(s => s.toLowerCase().includes(q));

    // Skill Chip Filter
    const matchSkill =
      selectedSkill === 'ALL' ||
      c.skills.some(s => s.toLowerCase() === selectedSkill.toLowerCase());

    // Experience Filter
    const exp = c.experienceYears || 0;
    const matchExp =
      expFilter === 'ALL' ||
      (expFilter === '0-2' && exp <= 2) ||
      (expFilter === '3-5' && exp >= 3 && exp <= 5) ||
      (expFilter === '5+' && exp > 5);

    // Rating / Tag Filter
    const candApps = applications.filter(a => a.candidateId === c.id);
    const bestScore = candApps.reduce((max, a) => Math.max(max, a.matchScore || 0), 0);
    const matchRating =
      ratingFilter === 'ALL' ||
      (ratingFilter === 'HIGH_SCORE' && bestScore >= 80) ||
      (ratingFilter === 'EXPERIENCED' && exp >= 2) ||
      (ratingFilter === 'HAS_RESUME' && (c.resumeUrl || (c.documents && c.documents.length > 0) || true));

    return matchSearch && matchSkill && matchExp && matchRating;
  });

  // Calculate Talent Pool Statistics (เฉพาะผู้ที่ยังไม่ได้รับเข้าทำงาน)
  const totalTalents = availableCandidates.length;
  const highPotentialCount = availableCandidates.filter(c => {
    const apps = applications.filter(a => a.candidateId === c.id);
    const bestScore = apps.reduce((max, a) => Math.max(max, a.matchScore || 0), 0);
    return bestScore >= 80;
  }).length;
  const experiencedCount = availableCandidates.filter(c => (c.experienceYears || 0) >= 2).length;
  const activeVacancies = vacancies.filter(v => ['PUBLISHED', 'RECRUITING', 'DRAFT', 'WAITING_HR_APPROVAL'].includes(v.state));


  // Handle Invite / Re-engage Candidate to a new vacancy
  const handleOpenInviteModal = (candidate: Candidate, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCandidate(candidate);
    setInviteSuccess(null);
    if (activeVacancies.length > 0) {
      setTargetVacancyId(activeVacancies[0].id);
    }
    setIsInviteModalOpen(true);
  };

  const handleConfirmInvite = async () => {
    if (!selectedCandidate || !targetVacancyId) return;

    setIsInviting(true);
    try {
      const res = await submitApplicationToDB({
        candidate: {
          firstName: selectedCandidate.firstName,
          lastName: selectedCandidate.lastName,
          email: selectedCandidate.email,
          phone: selectedCandidate.phone,
          currentPosition: selectedCandidate.currentPosition,
          currentCompany: selectedCandidate.currentCompany,
          experienceYears: selectedCandidate.experienceYears,
          skills: selectedCandidate.skills,
        },
        vacancyId: targetVacancyId,
        files: [{ name: `Resume_${selectedCandidate.firstName}_${selectedCandidate.lastName}.pdf`, size: 147000, type: 'application/pdf', category: 'RESUME' }],
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <HugeiconsIcon icon={User03Icon} size={28} className="text-pink-600 dark:text-pink-400 shrink-0" />
            <span>{locale === 'th' ? 'ผู้สมัคร (Candidates)' : 'Candidates'}</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {locale === 'th'
              ? 'ศูนย์รวมประวัติผู้สมัคร ค้นหาตามทักษะความสามารถ และดึงผู้สมัครมาจับคู่กับตำแหน่งงานใหม่'
              : 'Candidate database to search by skills and match to open job vacancies.'}
          </p>
        </div>

        <Link href="/dashboard/applications">
          <Button
            variant="outline"
            className="border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl shadow-2xs self-start sm:self-auto flex items-center gap-1.5"
          >
            <HugeiconsIcon icon={Quiz03Icon} size={15} />
            <span>{locale === 'th' ? 'ไปที่กระบวนการคัดเลือก (Applications Pipeline) →' : 'View Applications Pipeline →'}</span>
          </Button>
        </Link>
      </div>

      {/* Talent Pool KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200 bg-white rounded-2xl shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {locale === 'th' ? 'ผู้สมัครทั้งหมด' : 'Total Candidates'}
              </p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalTalents}</p>
              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                <HugeiconsIcon icon={UserGroupIcon} size={12} />
                <span>ข้อมูลเชื่อมต่อสด</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <HugeiconsIcon icon={ClipboardListIcon} size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white rounded-2xl shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {locale === 'th' ? 'ศักยภาพสูง (Match 80%+)' : 'High Match Rate'}
              </p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">{highPotentialCount}</p>
              <p className="text-[10px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                <HugeiconsIcon icon={StarIcon} size={12} />
                <span>AI Screening Pass</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <HugeiconsIcon icon={StarIcon} size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white rounded-2xl shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {locale === 'th' ? 'มีประสบการณ์ (2+ ปี)' : 'Experienced (2+ yrs)'}
              </p>
              <p className="text-2xl font-extrabold text-teal-700 mt-1">{experiencedCount}</p>
              <p className="text-[10px] text-teal-600 font-semibold mt-0.5 flex items-center gap-1">
                <HugeiconsIcon icon={Briefcase06Icon} size={12} />
                <span>พร้อมปฏิบัติงาน</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <HugeiconsIcon icon={BaggageClaimIcon} size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white rounded-2xl shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {locale === 'th' ? 'ตำแหน่งงานว่างที่เปิดรับ' : 'Active Vacancies'}
              </p>
              <p className="text-2xl font-extrabold text-indigo-700 mt-1">{activeVacancies.length}</p>
              <p className="text-[10px] text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
                <HugeiconsIcon icon={Target01Icon} size={12} />
                <span>พร้อมดึงไปร่วมงาน</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <HugeiconsIcon icon={Target01Icon} size={20} />
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Sourcing Search & Multi-Filter Toolbar */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              placeholder={locale === 'th' ? 'ค้นหาชื่อบุคลากร, อีเมล, เบอร์โทร, ตำแหน่งปัจจุบัน, บริษัท, หรือทักษะ...' : 'Search talent name, email, role, skills...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600 focus:ring-emerald-500/20 rounded-xl shadow-xs text-xs sm:text-sm pl-9 h-10"
            />
          </div>

          {/* Quick Experience Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            {(['ALL', '0-2', '3-5', '5+'] as const).map(exp => (
              <button
                key={exp}
                type="button"
                onClick={() => setExpFilter(exp)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${expFilter === exp
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                {exp === 'ALL' ? (locale === 'th' ? 'ทุกประสบการณ์' : 'All Exp') : `${exp} ${locale === 'th' ? 'ปี' : 'yrs'}`}
              </button>
            ))}
          </div>
        </div>

        {/* Skill Filter Chips */}
        <div className="space-y-1.5 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
              <HugeiconsIcon icon={Tag01Icon} size={13} className="text-slate-400" />
              <span>{locale === 'th' ? 'กรองตามทักษะความเชี่ยวชาญ (Skill Sourcing):' : 'Filter by Core Skill:'}</span>
            </span>
            {selectedSkill !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedSkill('ALL')}
                className="text-[11px] text-rose-600 hover:underline font-bold inline-flex items-center gap-1"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={11} />
                <span>{locale === 'th' ? 'ล้างตัวกรองทักษะ' : 'Clear skill'}</span>
              </button>
            )}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {POPULAR_SKILL_CHIPS.map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => setSelectedSkill(skill)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${selectedSkill === skill
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                  }`}
              >
                {skill === 'ALL' && <HugeiconsIcon icon={StarIcon} size={11} className={selectedSkill === skill ? 'text-white' : 'text-amber-500'} />}
                <span>{skill === 'ALL' ? (locale === 'th' ? 'ทุกทักษะ' : 'All Skills') : skill}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCandidates.length === 0 && (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
          <div className="flex justify-center mb-1">
            {availableCandidates.length === 0 && candidates.length > 0 ? (
              <HugeiconsIcon icon={SparklesIcon} size={40} className="text-emerald-500" />
            ) : (
              <HugeiconsIcon icon={Search01Icon} size={40} className="text-slate-300" />
            )}
          </div>
          <p className="font-bold text-slate-700">
            {availableCandidates.length === 0 && candidates.length > 0
              ? (locale === 'th' ? 'ผู้สมัครทั้งหมดได้รับการบรรจุเข้าทำงาน (HIRED) เรียบร้อยแล้ว' : 'All candidates have been hired into active personnel')
              : (locale === 'th' ? 'ไม่พบบุคลากรที่ตรงกับเงื่อนไขการค้นหา' : 'No talents matched your criteria')}
          </p>
          <p className="text-xs text-slate-400">
            {availableCandidates.length === 0 && candidates.length > 0
              ? (locale === 'th' ? 'รายชื่อที่ได้รับการบรรจุจะถูกย้ายไปจัดการในหน้า "จัดการบุคลากร (Personnel Management)" โดยอัตโนมัติ' : 'Hired candidates are now actively managed in Personnel Management')
              : (locale === 'th' ? 'ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองทักษะ' : 'Try adjusting search query or skill filter')}
          </p>
        </div>
      )}


      {/* Talent Cards Grid */}
      {!loading && filteredCandidates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((candidate, idx) => {
            const candApps = applications.filter(a => a.candidateId === candidate.id);
            const latestApp = candApps[0];
            const bestScore = candApps.reduce((max, a) => Math.max(max, a.matchScore || 0), 0);

            return (
              <Card
                key={candidate.id}
                className="border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all group rounded-2xl shadow-xs flex flex-col justify-between h-full"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col justify-between flex-1 space-y-4">
                  <div>
                    {/* Header Row: Avatar, Name, Role & AI Score */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-base font-bold text-white shadow-md shadow-emerald-600/20 shrink-0">
                          {candidate.firstName?.[0] || 'T'}{candidate.lastName?.[0] || ''}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/dashboard/candidates/${candidate.id}`}>
                            <p className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors truncate cursor-pointer hover:underline">
                              {locale === 'th' && candidate.firstNameTh && candidate.lastNameTh
                                ? `${candidate.firstNameTh} ${candidate.lastNameTh}`
                                : `${candidate.firstName} ${candidate.lastName}`}
                            </p>
                          </Link>
                          <p className="text-xs text-slate-600 font-semibold truncate mt-0.5">
                            {candidate.currentPosition || 'บุคลากรในระบบ'} {candidate.currentCompany ? `@ ${candidate.currentCompany}` : ''}
                          </p>
                        </div>
                      </div>

                      {bestScore > 0 && (
                        <div className="shrink-0 text-right" title="คะแนนความเหมาะสมสูงสุดที่ AI เคยประเมิน">
                          <MatchScoreRadial score={bestScore} size={44} />
                        </div>
                      )}
                    </div>

                    {/* Talent Badges */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {bestScore >= 80 && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-[10px] inline-flex items-center gap-1">
                          <HugeiconsIcon icon={StarIcon} size={11} className="text-amber-600" />
                          <span>High Potential</span>
                        </Badge>
                      )}
                      {(candidate.experienceYears || 0) >= 2 && (
                        <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 font-bold text-[10px] inline-flex items-center gap-1">
                          <HugeiconsIcon icon={SparklesIcon} size={11} className="text-teal-600" />
                          <span>มีประสบการณ์ตรง ({candidate.experienceYears} ปี)</span>
                        </Badge>
                      )}
                    </div>

                    {/* Contact Bar */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="truncate flex items-center gap-1.5">
                        <HugeiconsIcon icon={Mail01Icon} size={13} className="text-slate-400" />
                        <span>{candidate.email}</span>
                      </span>
                      {candidate.phone && (
                        <span className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={SmartPhone01Icon} size={13} className="text-slate-400" />
                          <span>{candidate.phone}</span>
                        </span>
                      )}
                    </div>

                    {/* Application History Banner (Synced with Applications) */}
                    {latestApp ? (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50/40 border border-emerald-200/70">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1">
                              <HugeiconsIcon icon={Target01Icon} size={12} className="text-emerald-700" />
                              <span>{locale === 'th' ? 'ประวัติการสมัครในระบบ:' : 'Past Application:'}</span>
                            </p>
                            <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                              {locale === 'th' ? (latestApp.vacancyTitleTh || latestApp.vacancyTitle) : latestApp.vacancyTitle}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                              <HugeiconsIcon icon={Building05Icon} size={12} className="text-slate-400" />
                              <span>{latestApp.department}</span>
                            </p>
                          </div>
                          <div className="shrink-0">
                            <ApplicationStateBadge state={latestApp.state} size="sm" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 text-slate-400 text-[11px] font-medium text-center border border-slate-100">
                        ยังไม่มีประวัติการยื่นใบสมัคร
                      </div>
                    )}

                    {/* Skills Tags */}
                    <div className="mt-3.5 space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {locale === 'th' ? 'ทักษะความสามารถ (Skills):' : 'Key Skills:'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills.slice(0, 6).map(skill => {
                          const isHighlighted = selectedSkill !== 'ALL' && skill.toLowerCase() === selectedSkill.toLowerCase();
                          return (
                            <span
                              key={skill}
                              className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold border ${isHighlighted
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                            >
                              {skill}
                            </span>
                          );
                        })}
                        {candidate.skills.length > 6 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-semibold">
                            +{candidate.skills.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link href={`/dashboard/candidates/${candidate.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <HugeiconsIcon icon={ViewIcon} size={14} />
                        <span>{locale === 'th' ? 'ดูโปรไฟล์' : 'View Profile'}</span>
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      onClick={(e) => handleOpenInviteModal(candidate, e)}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <HugeiconsIcon icon={Target01Icon} size={14} />
                      <span>{locale === 'th' ? 'ดึงเข้าตำแหน่ง' : 'Re-engage'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Invite / Re-engage Talent into Open Vacancy */}
      {mounted && isInviteModalOpen && selectedCandidate && createPortal(
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
                  ระบบได้บันทึกใบสมัครและนำคุณ <b>{selectedCandidate.firstName} {selectedCandidate.lastName}</b> เข้าสู่กระบวนการคัดเลือกของตำแหน่งใหม่เรียบร้อยแล้ว
                </p>
                <div className="pt-3 flex items-center justify-center gap-2">
                  <Link href="/dashboard/applications">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5">
                      <HugeiconsIcon icon={Quiz03Icon} size={15} />
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
                    {selectedCandidate.firstName} {selectedCandidate.lastName}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Briefcase06Icon} size={13} className="text-slate-400" />
                    <span>{selectedCandidate.currentPosition} @ {selectedCandidate.currentCompany || 'N/A'} • ประสบการณ์ {selectedCandidate.experienceYears || 0} ปี</span>
                  </p>
                </div>

                {/* Target Vacancy Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    เลือกตำแหน่งงานว่างที่ต้องการให้พิจารณา (Target Vacancy):
                  </label>
                  {activeVacancies.length === 0 ? (
                    <p className="text-xs text-rose-500 font-semibold p-2 bg-rose-50 rounded-xl flex items-center gap-1.5">
                      <HugeiconsIcon icon={Alert02Icon} size={14} className="text-rose-500 shrink-0" />
                      <span>ยังไม่มีตำแหน่งงานว่างที่เปิดรับ กรุณาสร้างตำแหน่งงานใหม่ก่อน</span>
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
