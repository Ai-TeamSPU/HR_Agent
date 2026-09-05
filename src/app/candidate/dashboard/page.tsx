'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { ApplicationStateBadge } from '@/pagefront/components/StateBadge';
import { fetchApplicationsFromDB } from '@/pageback/services';
import type { Application } from '@/lib/types/candidate';

export default function CandidateDashboardPage() {
  const { locale, setLocale, t } = useLocale();
  const [applications, setApplications] = useState<Application[]>([]);
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/jobs" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-emerald-600/20">HR</div>
            <span className="font-bold text-base text-slate-900">HR AI Agent</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={() => setLocale(locale === 'th' ? 'en' : 'th')} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-all border border-slate-200">
              {locale === 'th' ? 'EN' : 'TH'}
            </button>
            <Link href="/jobs">
              <Button size="sm" variant="outline" className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl">
                {locale === 'th' ? 'ดูตำแหน่งงาน' : 'Browse Jobs'}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {locale === 'th' ? 'พอร์ทัลผู้สมัครงาน' : 'Candidate Portal'}
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {locale === 'th' ? 'ติดตามสถานะการสมัครและการสัมภาษณ์ของคุณ (Supabase Live)' : 'Track your applications and interviews (Supabase Live)'}
            </p>
          </div>
        </div>

        {/* Applications list */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">{locale === 'th' ? 'ใบสมัครของคุณ' : 'Your Applications'}</h2>

          {applications.map(app => (
            <Card key={app.id} className="border-slate-200 bg-white shadow-xs rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {locale === 'th' ? app.vacancyTitleTh : app.vacancyTitle}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      🏢 {app.department} • 📅 {locale === 'th' ? 'สมัครเมื่อ' : 'Applied'}{' '}
                      {new Date(app.appliedAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}
                    </p>
                  </div>
                  <ApplicationStateBadge state={app.state} />
                </div>

                {/* Progress bar */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                    <span>{locale === 'th' ? 'ขั้นตอนปัจจุบัน' : 'Current Step'}</span>
                    <span className="text-emerald-700 font-bold">{app.state.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all"
                      style={{
                        width: app.state === 'APPLIED' ? '15%'
                          : app.state === 'AI_SCREENING' ? '30%'
                          : app.state === 'HR_REVIEW' ? '45%'
                          : app.state === 'SHORTLISTED' ? '60%'
                          : app.state.startsWith('INTERVIEW') ? '75%'
                          : app.state.startsWith('DL_TEST') ? '85%'
                          : app.state === 'OFFERED' || app.state === 'HIRED' ? '100%' : '10%',
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
