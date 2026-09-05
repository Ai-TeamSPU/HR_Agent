'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { KPICard } from '@/pagefront/components/KPICard';
import { Timeline } from '@/pagefront/components/Timeline';
import { MatchScoreRadial } from '@/pagefront/components/MatchScoreRadial';
import { VacancyStateBadge } from '@/pagefront/components/StateBadge';
import {
  fetchVacanciesFromDB,
  fetchApplicationsFromDB,
  fetchInterviewsFromDB,
  fetchAIRecommendationsFromDB,
  fetchWorkflowEventsFromDB,
} from '@/pageback/services';
import type { Vacancy } from '@/lib/types/vacancy';
import type { Application } from '@/lib/types/candidate';
import type { Interview } from '@/lib/types/interview';
import type { AIRecommendation, WorkflowEvent } from '@/lib/types/ai';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Briefcase02Icon,
  UserGroupIcon,
  Clock01Icon,
  Calendar04Icon,
  ChatBotIcon,
  CheckmarkSquare01Icon,
  Quiz03Icon,
} from '@hugeicons/core-free-icons';


export default function DashboardPage() {
  const { locale, t } = useLocale();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [vacs, apps, ints, recs, evts] = await Promise.all([
        fetchVacanciesFromDB(),
        fetchApplicationsFromDB(),
        fetchInterviewsFromDB(),
        fetchAIRecommendationsFromDB(),
        fetchWorkflowEventsFromDB(),
      ]);
      setVacancies(vacs);
      setApplications(apps);
      setInterviews(ints);
      setRecommendations(recs);
      setEvents(evts);
      setLoading(false);
    }
    loadData();
  }, []);

  const todayInterviews = interviews.filter(i => {
    const date = new Date(i.scheduledAt);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  });

  const activeVacancies = vacancies.filter(v =>
    ['PUBLISHED', 'RECRUITING', 'INTERVIEWING', 'OFFERING'].includes(v.state)
  );

  const pendingReviews = applications.filter(a =>
    ['HR_REVIEW', 'DECISION_PENDING'].includes(a.state)
  );

  // Pipeline counts from real application states
  const stages = [
    { key: 'APPLIED', label: 'Applied', labelTh: 'สมัครแล้ว' },
    { key: 'AI_SCREENING', label: 'AI Screening', labelTh: 'AI คัดกรอง' },
    { key: 'HR_REVIEW', label: 'HR Review', labelTh: 'HR ตรวจสอบ' },
    { key: 'SHORTLISTED', label: 'Shortlisted', labelTh: 'ผ่านคัดเลือก' },
    { key: 'INTERVIEW', label: 'Interview', labelTh: 'สัมภาษณ์' },
    { key: 'DL_TEST', label: 'DL Test', labelTh: 'ทดสอบ DL' },
    { key: 'OFFERED', label: 'Offered', labelTh: 'เสนอตำแหน่ง' },
    { key: 'HIRED', label: 'Hired', labelTh: 'รับเข้าทำงาน' },
  ];

  const pipeline = stages.map(st => {
    const count = applications.filter(a => {
      if (st.key === 'INTERVIEW') return ['INTERVIEW_INVITED', 'INTERVIEW_CONFIRMED', 'INTERVIEWED'].includes(a.state);
      if (st.key === 'DL_TEST') return ['DL_TEST_ASSIGNED', 'DL_TEST_COMPLETED'].includes(a.state);
      return a.state === st.key;
    }).length;
    return { ...st, count };
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{t('dashboard.title')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {locale === 'th' ? 'ภาพรวมระบบสรรหาบุคลากร (ข้อมูลสดจาก Supabase)' : 'Recruitment system overview (Live from Supabase)'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Supabase Live DB
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title={t('dashboard.openVacancies')}
          value={activeVacancies.length}
          subtitle={locale === 'th' ? `${vacancies.length} ตำแหน่งทั้งหมด` : `${vacancies.length} total`}
          icon={<HugeiconsIcon icon={Briefcase02Icon} size={22} />}
          trend={{ value: 12, isPositive: true }}
          accentColor="from-emerald-600 to-teal-700"
        />
        <KPICard
          title={t('dashboard.activeCandidates')}
          value={applications.filter(a => !['REJECTED', 'HIRED'].includes(a.state)).length}
          subtitle={locale === 'th' ? `${applications.length} ใบสมัครทั้งหมด` : `${applications.length} total applications`}
          icon={<HugeiconsIcon icon={UserGroupIcon} size={22} />}
          trend={{ value: 8, isPositive: true }}
          accentColor="from-teal-600 to-cyan-700"
        />
        <KPICard
          title={t('dashboard.pendingReviews')}
          value={pendingReviews.length}
          subtitle={locale === 'th' ? 'ต้องดำเนินการ' : 'Action required'}
          icon={<HugeiconsIcon icon={Clock01Icon} size={22} />}
          accentColor="from-amber-500 to-orange-600"
        />
        <KPICard
          title={t('dashboard.interviewsToday')}
          value={todayInterviews.length}
          subtitle={locale === 'th' ? `${interviews.filter(i => i.status === 'SCHEDULED' || i.status === 'CONFIRMED').length} กำลังจะมาถึง` : `${interviews.filter(i => i.status === 'SCHEDULED' || i.status === 'CONFIRMED').length} upcoming`}
          icon={<HugeiconsIcon icon={Calendar04Icon} size={22} />}
          accentColor="from-emerald-600 to-green-700"
        />
      </div>


      {/* Recruitment Pipeline */}
      <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">{t('dashboard.recruitmentPipeline')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
            {pipeline.map((stage, index) => (
              <div key={stage.key} className="flex items-center">
                <div className="flex flex-col items-center min-w-[96px] group cursor-pointer">
                  <div className={`w-full py-3 px-2 rounded-xl text-center transition-all ${
                    stage.count > 0
                      ? 'bg-emerald-50/80 border border-emerald-200 hover:border-emerald-400 shadow-xs'
                      : 'bg-slate-50 border border-slate-200/80 hover:border-slate-300'
                  }`}>
                    <p className={`text-xl font-bold ${stage.count > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {stage.count}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1 font-semibold leading-tight">
                      {locale === 'th' ? stage.labelTh : stage.label}
                    </p>
                  </div>
                </div>
                {index < pipeline.length - 1 && (
                  <div className="text-slate-300 px-1 text-xs shrink-0 font-bold">→</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Vacancies */}
        <Card className="lg:col-span-1 border-slate-200 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900">
                {locale === 'th' ? 'ตำแหน่งที่เปิดรับ' : 'Active Vacancies'}
              </CardTitle>
              <Link href="/dashboard/vacancies" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
                {locale === 'th' ? 'ดูทั้งหมด →' : 'View all →'}
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {activeVacancies.slice(0, 4).map(vacancy => (
              <Link
                key={vacancy.id}
                href={`/dashboard/vacancies/${vacancy.id}`}
                className="block p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-emerald-800 transition-colors">
                      {locale === 'th' ? vacancy.position.titleTh : vacancy.position.title}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {locale === 'th' ? vacancy.position.departmentTh : vacancy.position.department}
                    </p>
                  </div>
                  <VacancyStateBadge state={vacancy.state} size="sm" />
                </div>
                <div className="flex items-center gap-3 mt-2.5 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-slate-600">
                    <HugeiconsIcon icon={Quiz03Icon} size={14} className="text-slate-400 shrink-0" />
                    <span>{vacancy.applicationCount} {locale === 'th' ? 'ใบสมัคร' : 'apps'}</span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <HugeiconsIcon icon={CheckmarkSquare01Icon} size={14} className="text-emerald-600 shrink-0" />
                    <span>{vacancy.shortlistedCount} {locale === 'th' ? 'คัดเลือก' : 'shortlisted'}</span>
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Center: AI Recommendations */}
        <Card className="lg:col-span-1 border-slate-200 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HugeiconsIcon icon={ChatBotIcon} size={20} className="text-pink-600 dark:text-pink-400 shrink-0" />
                <span>{t('dashboard.aiRecommendations')}</span>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {recommendations.map(rec => (
              <Link
                key={rec.id}
                href={`/dashboard/applications/${rec.applicationId}`}
                className="block p-3.5 rounded-xl bg-gradient-to-br from-emerald-50/50 to-teal-50/40 border border-emerald-100 hover:border-emerald-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <MatchScoreRadial score={rec.overallFit} size={54} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{rec.candidateName}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{rec.vacancyTitle}</p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {Object.entries(rec.scores).map(([key, val]) => {
                        const scoreVal = Number(val);
                        return scoreVal > 0 ? (
                          <span
                            key={key}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold"
                          >
                            {key === 'jobMatch' ? 'Match' : key === 'experience' ? 'Exp' : key === 'dlTest' ? 'DL' : 'Int'}: {scoreVal}%
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 p-2 rounded-lg bg-white/80 border border-emerald-100">
                  <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                    {locale === 'th' ? rec.reasoningTh : rec.reasoning}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Right: Activity Timeline */}
        <Card className="lg:col-span-1 border-slate-200 bg-white shadow-xs rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Timeline events={events} maxItems={8} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
