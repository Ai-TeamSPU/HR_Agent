'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { fetchVacancyByIdFromDB } from '@/pageback/services';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  LockKeyIcon,
  Building05Icon,
  Location01Icon,
  Briefcase06Icon,
  AssignmentsIcon,
  Target01Icon,
  Idea01Icon,
  GiftIcon,
  CheckmarkSquare01Icon,
} from '@hugeicons/core-free-icons';
import type { Vacancy } from '@/lib/types/vacancy';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { locale, setLocale, t } = useLocale();
  const [vacancy, setVacancy] = useState<Vacancy | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const v = await fetchVacancyByIdFromDB(id);
      setVacancy(v);
      setLoading(false);
    }
    load();
  }, [id]);

  if (!vacancy && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-semibold">{t('common.noData')}</p>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ป้องกันการเข้าถึงตำแหน่งที่ยังไม่อนุมัติ/ประกาศ
  if (!['PUBLISHED', 'RECRUITING'].includes(vacancy.state)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="flex justify-center mb-3">
          <HugeiconsIcon icon={LockKeyIcon} size={48} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {locale === 'th' ? 'ตำแหน่งงานนี้ยังไม่เปิดรับสมัคร' : 'This position is not currently open'}
        </h2>
        <p className="text-xs text-slate-500 mb-6 max-w-sm">
          {locale === 'th' ? 'ตำแหน่งงานนี้ยังอยู่ในขั้นตอนการตรวจสอบของ HR หรือยังไม่ประกาศเปิดรับอย่างเป็นทางการ' : 'This vacancy is under review or not yet published.'}
        </p>
        <Link href="/jobs">
          <Button className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold rounded-xl shadow-md">
            {locale === 'th' ? '← กลับไปดูตำแหน่งงานที่เปิดรับ' : '← Back to open positions'}
          </Button>
        </Link>
      </div>
    );
  }

  const jd = vacancy.jobDescription;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/jobs" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-emerald-600/20">HR</div>
            <span className="font-bold text-base text-slate-900">HR AI Agent</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={() => setLocale(locale === 'th' ? 'en' : 'th')} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-all border border-slate-200">
              {locale === 'th' ? 'EN' : 'TH'}
            </button>
            <Link href="/login">
              <button
                type="button"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-all border border-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <HugeiconsIcon icon={LockKeyIcon} size={14} className="text-slate-500" />
                <span>{locale === 'th' ? 'สำหรับเจ้าหน้าที่ HR' : 'HR Staff Login'}</span>
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/jobs" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1">
          ← {locale === 'th' ? 'กลับไปรายการตำแหน่ง' : 'Back to all positions'}
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                {locale === 'th' ? vacancy.position.titleTh : vacancy.position.title}
              </h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 font-medium flex-wrap">
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Building05Icon} size={15} className="text-slate-400" />
                  <span>{locale === 'th' ? vacancy.position.departmentTh : vacancy.position.department}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Location01Icon} size={15} className="text-slate-400" />
                  <span>Bangkok, Thailand</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={Briefcase06Icon} size={15} className="text-slate-400" />
                  <span>{t('jobs.fullTime')}</span>
                </span>
              </div>
            </div>

            {jd && (
              <Card className="border-slate-200 bg-white shadow-xs rounded-2xl">
                <CardContent className="p-6 space-y-6">
                  <p className="text-sm text-slate-700 leading-relaxed font-normal">
                    {locale === 'th' ? jd.summaryTh : jd.summary}
                  </p>

                  <Separator className="bg-slate-100" />

                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <HugeiconsIcon icon={AssignmentsIcon} size={18} className="text-emerald-600" />
                      <span>{locale === 'th' ? 'หน้าที่ความรับผิดชอบ' : 'Responsibilities'}</span>
                    </h3>
                    <ul className="space-y-2.5">
                      {(locale === 'th' ? jd.responsibilitiesTh : jd.responsibilities).map((r, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                          <span className="text-emerald-600 mt-1 shrink-0 font-bold text-xs">●</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator className="bg-slate-100" />

                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <HugeiconsIcon icon={Target01Icon} size={18} className="text-teal-600" />
                      <span>{locale === 'th' ? 'คุณสมบัติที่ต้องการ' : 'Requirements'}</span>
                    </h3>
                    <ul className="space-y-2.5">
                      {(locale === 'th' ? jd.requirementsTh : jd.requirements).map((r, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                          <span className="text-teal-600 mt-1 shrink-0 font-bold text-xs">●</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {jd.preferredSkills.length > 0 && (
                    <>
                      <Separator className="bg-slate-100" />
                      <div>
                        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <HugeiconsIcon icon={Idea01Icon} size={18} className="text-amber-500" />
                          <span>{locale === 'th' ? 'ทักษะที่ต้องการ' : 'Preferred Skills'}</span>
                        </h3>
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

                  {jd.benefits.length > 0 && (
                    <>
                      <Separator className="bg-slate-100" />
                      <div>
                        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <HugeiconsIcon icon={GiftIcon} size={18} className="text-pink-600" />
                          <span>{locale === 'th' ? 'สวัสดิการ' : 'Benefits'}</span>
                        </h3>
                        <ul className="grid grid-cols-2 gap-2.5">
                          {(locale === 'th' ? jd.benefitsTh : jd.benefits).map((b, i) => (
                            <li key={i} className="text-sm text-slate-700 flex items-center gap-2 font-medium">
                              <HugeiconsIcon icon={CheckmarkSquare01Icon} size={14} className="text-emerald-600 shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-emerald-200 bg-emerald-50/50 shadow-xs rounded-2xl sticky top-20">
              <CardContent className="p-6 space-y-5">
                {jd?.salaryRange && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">{locale === 'th' ? 'ค่าตอบแทน' : 'Salary Range'}</p>
                    <p className="text-xl font-bold text-emerald-700">
                      {jd.salaryRange.min.toLocaleString()} - {jd.salaryRange.max.toLocaleString()} ฿
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">{locale === 'th' ? 'ต่อเดือน' : 'per month'}</p>
                  </div>
                )}

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span className="text-slate-500 font-medium">{locale === 'th' ? 'ระดับ' : 'Level'}</span>
                    <span className="font-bold text-slate-900">{vacancy.position.level}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-emerald-100">
                    <span className="text-slate-500 font-medium">{locale === 'th' ? 'จำนวนรับ' : 'Openings'}</span>
                    <span className="font-bold text-slate-900">{vacancy.headcount}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">{locale === 'th' ? 'วันเปิดรับ' : 'Open Date'}</span>
                    <span className="font-bold text-slate-900">{new Date(vacancy.openDate).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <Link href={`/apply/${vacancy.id}`}>
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 h-12 text-base">
                    {t('jobs.applyNow')} →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
