'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { ApplicationStateBadge } from '@/pagefront/components/StateBadge';
import { MatchScoreRadial } from '@/pagefront/components/MatchScoreRadial';
import { HugeiconsIcon } from '@hugeicons/react';
import { Task01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { fetchApplicationsFromDB } from '@/pageback/services';

import type { Application, ApplicationState } from '@/lib/types/candidate';

const INTERVIEW_STAGES: ApplicationState[] = ['INTERVIEW_INVITED', 'INTERVIEW_CONFIRMED', 'INTERVIEWED'];

const FILTER_STATES: (ApplicationState | 'ALL')[] = [
  'ALL',
  'APPLIED',
  'AI_SCREENING',
  'HR_REVIEW',
  'SHORTLISTED',
  'DECISION_PENDING',
  'OFFERED',
  'HIRED',
  'REJECTED',
];

export default function ApplicationsPage() {
  const { locale, t } = useLocale();
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<ApplicationState | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchApplicationsFromDB();
      setApplications(data);
      setLoading(false);
    }
    load();
  }, []);

  // กรองเฉพาะใบสมัครที่ยังไม่ได้ส่งไปสู่ขั้นตอนการสัมภาษณ์ (เมื่อนัดสัมภาษณ์แล้วจะย้ายไปเมนู 'การสัมภาษณ์')
  const preInterviewApplications = applications.filter(a => !INTERVIEW_STAGES.includes(a.state));

  const filtered = preInterviewApplications.filter(a => {
    const matchSearch = search === '' ||
      a.candidate.firstName.toLowerCase().includes(search.toLowerCase()) ||
      a.candidate.lastName.toLowerCase().includes(search.toLowerCase()) ||
      a.candidate.firstNameTh.includes(search) ||
      a.vacancyTitle.toLowerCase().includes(search.toLowerCase());
    const matchState = filterState === 'ALL' || a.state === filterState;
    return matchSearch && matchState;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <HugeiconsIcon icon={Task01Icon} size={28} className="text-pink-600 dark:text-pink-400 shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('application.title')}</h1>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          {locale === 'th' ? `ใบสมัครทั้งหมด ${preInterviewApplications.length} รายการ (Supabase Live)` : `${preInterviewApplications.length} total applications (Supabase Live)`}
        </p>
      </div>



      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm w-full">
          <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <Input
            placeholder={locale === 'th' ? 'ค้นหาชื่อผู้สมัคร, ตำแหน่ง...' : 'Search candidate, position...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-slate-200 text-slate-900 focus:border-emerald-600 focus:ring-emerald-500/20 rounded-xl shadow-xs"
          />
        </div>
      </div>

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

      <div className="space-y-2.5">
        {filtered.map((app, idx) => (
          <Link key={app.id} href={`/dashboard/applications/${app.id}`}>
            <Card
              className="border-slate-200 bg-white hover:bg-emerald-50/20 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer rounded-2xl shadow-xs animate-fade-in"
              style={{ animationDelay: `${idx * 25}ms` }}
            >
              <CardContent className="p-3.5 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-sm shrink-0">
                      {app.candidate.firstName[0]}{app.candidate.lastName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {locale === 'th' ? `${app.candidate.firstNameTh} ${app.candidate.lastNameTh}` : `${app.candidate.firstName} ${app.candidate.lastName}`}
                      </p>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {locale === 'th' ? app.vacancyTitleTh : app.vacancyTitle} • <span className="text-emerald-700">{app.department}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {app.matchScore && <MatchScoreRadial score={app.matchScore} size={40} />}
                    <ApplicationStateBadge state={app.state} />
                    <span className="text-xs text-slate-400 font-medium hidden xs:inline-block">
                      {new Date(app.appliedAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
            <div className="flex justify-center mb-2">
              <HugeiconsIcon icon={Search01Icon} size={40} className="text-slate-300" />
            </div>
            <p className="font-semibold text-slate-600">{t('common.noData')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
