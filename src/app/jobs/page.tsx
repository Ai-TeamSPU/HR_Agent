'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  LockKeyIcon,
  FireIcon,
  Building05Icon,
  Location01Icon,
  Briefcase06Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { fetchPublishedVacanciesFromDB } from '@/pageback/services';
import type { Vacancy } from '@/lib/types/vacancy';

export default function JobsPage() {
  const { locale, setLocale, t } = useLocale();
  const [publishedVacancies, setPublishedVacancies] = useState<Vacancy[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchPublishedVacanciesFromDB();
      setPublishedVacancies(data);
      setLoading(false);
    }
    load();
  }, []);

  const departments = ['ALL', ...new Set(publishedVacancies.map(v => v.position.department))];

  const filtered = publishedVacancies.filter(v => {
    const matchSearch = search === '' ||
      v.position.title.toLowerCase().includes(search.toLowerCase()) ||
      v.position.titleTh.includes(search) ||
      v.position.department.toLowerCase().includes(search.toLowerCase()) ||
      (v.position.departmentTh && v.position.departmentTh.includes(search));
    const matchDept = selectedDept === 'ALL' || v.position.department === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/jobs" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-emerald-600/20">
              HR
            </div>
            <span className="font-bold text-base text-slate-900">HR AI Agent</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 transition-all border border-slate-200"
            >
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

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/60 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            <span className="text-gradient">{t('jobs.title')}</span>
          </h1>
          <p className="text-base text-slate-600 mt-3 max-w-xl mx-auto font-medium">
            {t('jobs.subtitle')}
          </p>
          
          <div className="mt-8 max-w-lg mx-auto">
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('jobs.searchPlaceholder')}
                className="pl-11 h-13 bg-slate-50 border-slate-200 rounded-2xl text-sm focus:border-emerald-600 focus:ring-emerald-500/20 text-slate-900 shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-10 pb-20">
        {/* Department filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDept === dept
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {dept === 'ALL' ? (locale === 'th' ? 'ทุกแผนก' : 'All Departments') : dept}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-slate-500 font-semibold mb-4">
          {locale === 'th' ? `พบ ${filtered.length} ตำแหน่งงาน (Supabase Live)` : `${filtered.length} positions found (Supabase Live)`}
        </p>

        {/* Job Cards */}
        <div className="grid gap-4">
          {filtered.map((vacancy, idx) => (
            <Link key={vacancy.id} href={`/jobs/${vacancy.id}`}>
              <Card
                className="border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group rounded-2xl shadow-xs animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {locale === 'th' ? vacancy.position.titleTh : vacancy.position.title}
                        </h2>
                        {vacancy.priority === 'URGENT' && (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-bold inline-flex items-center gap-1">
                            <HugeiconsIcon icon={FireIcon} size={12} className="text-rose-600" />
                            <span>{locale === 'th' ? 'เร่งด่วน' : 'Urgent'}</span>
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mb-3 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={Building05Icon} size={14} className="text-slate-400" />
                          <span>{locale === 'th' ? vacancy.position.departmentTh : vacancy.position.department}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={Location01Icon} size={14} className="text-slate-400" />
                          <span>Bangkok, Thailand</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={Briefcase06Icon} size={14} className="text-slate-400" />
                          <span>{t('jobs.fullTime')}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={UserGroupIcon} size={14} className="text-slate-400" />
                          <span>{vacancy.headcount} {locale === 'th' ? 'อัตรา' : 'opening(s)'}</span>
                        </span>
                      </div>

                      {vacancy.jobDescription && (
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {locale === 'th' ? vacancy.jobDescription.summaryTh : vacancy.jobDescription.summary}
                        </p>
                      )}

                      {/* Skills */}
                      {vacancy.jobDescription?.preferredSkills && (
                        <div className="flex flex-wrap gap-1.5 mt-3.5">
                          {vacancy.jobDescription.preferredSkills.slice(0, 5).map(skill => (
                            <span key={skill} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      {vacancy.jobDescription?.salaryRange && (
                        <p className="text-sm font-bold text-emerald-700">
                          {vacancy.jobDescription.salaryRange.min.toLocaleString()}-{vacancy.jobDescription.salaryRange.max.toLocaleString()} ฿
                        </p>
                      )}
                      <Button
                        size="sm"
                        className="mt-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 opacity-90 group-hover:opacity-100 transition-all"
                      >
                        {t('jobs.applyNow')} →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200">
            <div className="flex justify-center mb-3">
              <HugeiconsIcon icon={Search01Icon} size={48} className="text-slate-300" />
            </div>
            <p className="text-base font-bold text-slate-700">{locale === 'th' ? 'ไม่พบตำแหน่งที่ค้นหา' : 'No positions found'}</p>
            <p className="text-xs text-slate-500 mt-1">{locale === 'th' ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'Try different search or filter'}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 font-medium">
        <p>© 2026 HR AI Agent. {locale === 'th' ? 'ระบบสรรหาบุคลากรอัจฉริยะ' : 'Intelligent Recruitment System'}</p>
      </footer>
    </div>
  );
}
