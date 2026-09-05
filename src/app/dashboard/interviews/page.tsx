'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Calendar03Icon,
  Search01Icon,
  CheckmarkSquare01Icon,
  Quiz03Icon,
  ReloadIcon,
  Clock01Icon,
  Alert02Icon,
  FloppyDiskIcon,
  StarIcon,
  Cancel01Icon,
  Target01Icon,
  Location01Icon,
  Link01Icon,
  AssignmentsIcon,
  ViewIcon,
  ComputerIcon,
  Building05Icon,
  Mail01Icon,
} from '@hugeicons/core-free-icons';
import {
  fetchInterviewsFromDB,
  rescheduleInterviewInDB,
  updateInterviewStatusInDB,
} from '@/pageback/services';

import {
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_STATUS_COLORS,
  INTERVIEW_STATUS_LABELS,
} from '@/lib/types/interview';
import type { Interview, InterviewType, InterviewStatus } from '@/lib/types/interview';

import Link from 'next/link';

const QUICK_REASONS = [
  'ผู้สมัครติดภารกิจ/งานประจำเดิม',
  'คณะกรรมการติดประชุมด่วน',
  'ขอปรับเวลาให้สะดวกทั้งสองฝ่าย',
  'เหตุสุดวิสัยด้านสุขภาพ/การเดินทาง',
  'ขอปรับเป็นสัมภาษณ์ออนไลน์แทน',
];

export default function InterviewsPage() {
  const { locale, t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState<Interview | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('14:00');
  const [duration, setDuration] = useState(60);
  const [interviewType, setInterviewType] = useState<InterviewType>('TECHNICAL');
  const [formatType, setFormatType] = useState<'ONLINE' | 'ONSITE'>('ONLINE');
  const [location, setLocation] = useState('Google Meet (Online)');
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/spu-interview-room');
  const [reason, setReason] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchInterviewsFromDB();
    setInterviews(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Reschedule Modal with pre-filled current values
  const handleOpenReschedule = (interview: Interview, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentDt = new Date(interview.scheduledAt);
    const dateStr = currentDt.toISOString().split('T')[0];
    const timeStr = `${String(currentDt.getHours()).padStart(2, '0')}:${String(currentDt.getMinutes()).padStart(2, '0')}`;

    setRescheduleTarget(interview);
    setNewDate(dateStr);
    setNewTime(timeStr);
    setDuration(interview.duration || 60);
    setInterviewType(interview.type || 'TECHNICAL');
    const isOnline = Boolean(interview.meetingUrl || interview.location?.toLowerCase().includes('online') || interview.location?.toLowerCase().includes('meet'));
    setFormatType(isOnline ? 'ONLINE' : 'ONSITE');
    setLocation(interview.location || 'Google Meet (Online)');
    setMeetingUrl(interview.meetingUrl || 'https://meet.google.com/spu-interview-room');
    setReason('');
    setSendNotification(true);
  };

  // Submit Reschedule
  const handleSaveReschedule = async () => {
    if (!rescheduleTarget || !newDate || !newTime) return;

    setIsSaving(true);
    const [hours, minutes] = newTime.split(':').map(Number);
    const scheduledDateObj = new Date(newDate);
    scheduledDateObj.setHours(hours, minutes, 0, 0);

    const res = await rescheduleInterviewInDB({
      interviewId: rescheduleTarget.id,
      applicationId: rescheduleTarget.applicationId,
      newScheduledAt: scheduledDateObj.toISOString(),
      duration,
      interviewType,
      location: formatType === 'ONLINE' ? 'Google Meet (Online)' : location,
      meetingUrl: formatType === 'ONLINE' ? meetingUrl : undefined,
      rescheduleReason: reason || 'ปรับเปลี่ยนเวลาตามที่ตกลงร่วมกัน',
    });

    setIsSaving(false);

    if (res.success) {
      setRescheduleTarget(null);
      showToast(locale === 'th'
        ? `✓ เลื่อนวันนัดสัมภาษณ์ของ ${rescheduleTarget.candidateNameTh || rescheduleTarget.candidateName} สำเร็จแล้ว`
        : `✓ Successfully rescheduled interview for ${rescheduleTarget.candidateName}`);
      loadData();
    } else {
      alert(res.error || 'Failed to reschedule');
    }
  };

  // Quick Status Update (e.g. Mark Confirmed / Completed / Cancelled)
  const handleQuickStatus = async (
    interview: Interview,
    newStatus: InterviewStatus,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const res = await updateInterviewStatusInDB(interview.id, newStatus, interview.applicationId);
    if (res.success) {
      showToast(locale === 'th' ? `✓ อัปเดตสถานะเป็น ${newStatus} เรียบร้อยแล้ว` : `✓ Status updated to ${newStatus}`);
      loadData();
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // Filter and Search logic
  const filteredInterviews = interviews.filter(i => {
    const q = search.toLowerCase();
    const matchSearch =
      search === '' ||
      i.candidateName.toLowerCase().includes(q) ||
      (i.candidateNameTh && i.candidateNameTh.includes(search)) ||
      i.vacancyTitle.toLowerCase().includes(q) ||
      (i.vacancyTitleTh && i.vacancyTitleTh.includes(search)) ||
      (i.location && i.location.toLowerCase().includes(q));

    let matchTab = true;
    if (activeTab === 'UPCOMING') {
      matchTab = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(i.status);
    } else if (activeTab === 'COMPLETED') {
      matchTab = i.status === 'COMPLETED';
    } else if (activeTab === 'CANCELLED') {
      matchTab = ['CANCELLED', 'NO_SHOW'].includes(i.status);
    }

    return matchSearch && matchTab;
  });

  // KPI Calculations
  const totalCount = interviews.length;
  const upcomingCount = interviews.filter(i => ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(i.status)).length;
  const completedCount = interviews.filter(i => i.status === 'COMPLETED').length;
  const cancelledCount = interviews.filter(i => ['CANCELLED', 'NO_SHOW'].includes(i.status)).length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slide-in">
          <span className="text-emerald-400 text-lg">✓</span>
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <HugeiconsIcon icon={Calendar03Icon} size={28} className="text-pink-600 dark:text-pink-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {t('interview.title')}
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold text-xs px-2.5 py-0.5">
              Live SPU DB
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {locale === 'th'
              ? 'จัดการตารางนัดหมายสัมภาษณ์ ปรับเปลี่ยนวันนัดหมาย (Reschedule) และติดตามผลการประเมิน'
              : 'Manage interview schedules, reschedule dates, and track interview progress.'}
          </p>
        </div>

        <Link href="/dashboard/applications">
          <Button
            type="button"
            className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5 h-10 px-4"
          >
            <HugeiconsIcon icon={Quiz03Icon} size={15} />
            <span>{locale === 'th' ? 'ดูใบสมัครทั้งหมดเพื่อนัดสัมภาษณ์' : 'View Applications to Schedule'}</span>
          </Button>
        </Link>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">{locale === 'th' ? 'การสัมภาษณ์ทั้งหมด' : 'Total Interviews'}</p>
            <HugeiconsIcon icon={Calendar03Icon} size={20} className="text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1.5">{totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">เชื่อมโยงกับฐานข้อมูล</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-700">{locale === 'th' ? 'กำลังจะมาถึง' : 'Upcoming'}</p>
            <HugeiconsIcon icon={Clock01Icon} size={20} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1.5">{upcomingCount}</p>
          <p className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">รอการสัมภาษณ์</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-teal-700">{locale === 'th' ? 'สัมภาษณ์เสร็จสิ้น' : 'Completed'}</p>
            <HugeiconsIcon icon={CheckmarkSquare01Icon} size={20} className="text-teal-600" />
          </div>
          <p className="text-2xl font-black text-teal-600 mt-1.5">{completedCount}</p>
          <p className="text-[11px] text-teal-600/80 mt-0.5 font-medium">ประเมินผลเรียบร้อย</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600">{locale === 'th' ? 'ยกเลิก/ขาดนัด' : 'Cancelled / No Show'}</p>
            <HugeiconsIcon icon={Alert02Icon} size={20} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-700 mt-1.5">{cancelledCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">สามารถนัดหมายใหม่ได้</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={locale === 'th' ? 'ค้นหาชื่อผู้สมัคร, ตำแหน่งงาน, หรือสถานที่สัมภาษณ์...' : 'Search candidate name, job title, or location...'}
              className="pl-9 bg-slate-50 border-slate-200 rounded-xl text-xs sm:text-sm h-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tab Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('UPCOMING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'UPCOMING'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HugeiconsIcon icon={Calendar03Icon} size={14} />
              <span>{locale === 'th' ? 'กำลังจะมาถึง' : 'Upcoming'} ({upcomingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'COMPLETED'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HugeiconsIcon icon={CheckmarkSquare01Icon} size={14} />
              <span>{locale === 'th' ? 'เสร็จสิ้น' : 'Completed'} ({completedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HugeiconsIcon icon={StarIcon} size={14} />
              <span>{locale === 'th' ? 'ทั้งหมด' : 'All'} ({totalCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('CANCELLED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'CANCELLED'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={14} />
              <span>{locale === 'th' ? 'ยกเลิก' : 'Cancelled'} ({cancelledCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredInterviews.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-2">
          <div className="flex justify-center mb-1">
            <HugeiconsIcon icon={Calendar03Icon} size={40} className="text-slate-300" />
          </div>
          <p className="font-bold text-slate-700">
            {locale === 'th' ? 'ไม่พบรายการสัมภาษณ์ตามเงื่อนไขที่เลือก' : 'No interview schedules found'}
          </p>
          <p className="text-xs text-slate-400">
            {locale === 'th' ? 'ลองปรับเปลี่ยนแท็บสถานะ หรือค้นหาด้วยคำใหม่อีกครั้ง' : 'Try switching tabs or adjusting search query.'}
          </p>
        </div>
      )}

      {/* Interviews Grid / List */}
      {!loading && filteredInterviews.length > 0 && (
        <div className="grid gap-3.5">
          {filteredInterviews.map((interview, idx) => {
            const { date, time } = formatDateTime(interview.scheduledAt);
            const isUpcoming = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(interview.status);
            const isCancelled = ['CANCELLED', 'NO_SHOW'].includes(interview.status);

            return (
              <Card
                key={interview.id}
                className={`border-slate-200 bg-white hover:border-pink-300 hover:shadow-md transition-all rounded-2xl shadow-xs overflow-hidden ${
                  isCancelled ? 'border-rose-200/80 bg-rose-50/10' : !isUpcoming ? 'opacity-90' : ''
                }`}
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Date badge + Candidate info */}
                    <div className="flex items-start sm:items-center gap-3.5 sm:gap-4.5 min-w-0">
                      {/* Date Block */}
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border flex flex-col items-center justify-center shrink-0 shadow-2xs text-center px-1 ${
                        isCancelled
                          ? 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-200/90 text-rose-800'
                          : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/90 text-emerald-800'
                      }`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${isCancelled ? 'text-rose-800' : 'text-emerald-800'}`}>{date.split(' ')[0]}</p>
                        <p className={`text-sm sm:text-base font-extrabold leading-tight my-0.5 ${isCancelled ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {date.split(' ').slice(1, 3).join(' ')}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold bg-white/80 px-1.5 py-0.2 rounded-md">
                          ⏰ {time}
                        </p>
                      </div>

                      {/* Candidate & Position Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/dashboard/applications/${interview.applicationId}`}>
                            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 hover:text-pink-600 transition-colors cursor-pointer hover:underline">
                              {locale === 'th' ? interview.candidateNameTh || interview.candidateName : interview.candidateName}
                            </h3>
                          </Link>
                          <Badge variant="outline" className={`text-[10px] font-bold ${INTERVIEW_STATUS_COLORS[interview.status]}`}>
                            {INTERVIEW_STATUS_LABELS[interview.status]?.[locale] || interview.status}
                          </Badge>
                        </div>

                        <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate flex items-center gap-1.5">
                          <HugeiconsIcon icon={Target01Icon} size={13} className="text-slate-400" />
                          <span>{locale === 'th' ? interview.vacancyTitleTh || interview.vacancyTitle : interview.vacancyTitle}</span>
                        </p>

                        <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                          <span className={`font-bold px-2 py-0.5 rounded-md border ${
                            isCancelled
                              ? 'text-rose-700 bg-rose-50 border-rose-200/60'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200/60'
                          }`}>
                            {INTERVIEW_TYPE_LABELS[interview.type]?.[locale] || interview.type}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-medium flex items-center gap-1">
                            <HugeiconsIcon icon={Clock01Icon} size={12} className="text-slate-400" />
                            <span>{interview.duration} {locale === 'th' ? 'นาที' : 'mins'}</span>
                          </span>
                          {interview.location && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600 font-medium flex items-center gap-1">
                                <HugeiconsIcon icon={Location01Icon} size={12} className="text-slate-400" />
                                <span>{interview.location}</span>
                              </span>
                            </>
                          )}
                          {interview.meetingUrl && (
                            <>
                              <span className="text-slate-300">•</span>
                              <a
                                href={interview.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 bg-emerald-50/80 px-2 py-0.5 rounded-md"
                              >
                                <HugeiconsIcon icon={Link01Icon} size={12} />
                                <span>{locale === 'th' ? 'ลิงก์ห้องสัมภาษณ์' : 'Join Meeting'}</span>
                              </a>
                            </>
                          )}
                        </div>

                        {interview.notes && (
                          <p className="text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-lg px-2.5 py-1 mt-2 font-medium flex items-center gap-1.5">
                            <HugeiconsIcon icon={AssignmentsIcon} size={13} className="text-amber-700 shrink-0" />
                            <span>{interview.notes}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Interviewers & Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                      {/* Interviewers Avatars */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-semibold">{locale === 'th' ? 'กรรมการ:' : 'Panel:'}</span>
                        <div className="flex -space-x-2">
                          {interview.interviewers.map(int => (
                            <div
                              key={int.id}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-extrabold text-slate-700 shadow-2xs"
                              title={`${int.name} (${int.role})`}
                            >
                              {int.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons: Reschedule & Status Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Reschedule Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleOpenReschedule(interview, e)}
                          className={`h-8 text-xs font-bold rounded-xl cursor-pointer shadow-2xs flex items-center gap-1 ${
                            isCancelled
                              ? 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white border-0'
                              : 'border-amber-300 text-amber-900 bg-amber-50/60 hover:bg-amber-100 hover:text-amber-950'
                          }`}
                        >
                          <HugeiconsIcon icon={ReloadIcon} size={13} />
                          <span>{isCancelled ? (locale === 'th' ? 'นัดหมายใหม่' : 'Reschedule') : (locale === 'th' ? 'เลื่อนวันสัมภาษณ์' : 'Reschedule')}</span>
                        </Button>


                        {/* Quick Confirm Button */}
                        {interview.status === 'SCHEDULED' && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => handleQuickStatus(interview, 'CONFIRMED', e)}
                            className="h-8 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <HugeiconsIcon icon={CheckmarkSquare01Icon} size={13} />
                            <span>{locale === 'th' ? 'ยืนยันนัด' : 'Confirm'}</span>
                          </Button>
                        )}

                        {/* Quick Completed Button */}
                        {interview.status === 'CONFIRMED' && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => handleQuickStatus(interview, 'COMPLETED', e)}
                            className="h-8 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            <HugeiconsIcon icon={CheckmarkSquare01Icon} size={13} />
                            <span>{locale === 'th' ? 'สัมภาษณ์แล้ว' : 'Mark Completed'}</span>
                          </Button>
                        )}

                        {/* View Application Link */}
                        <Link href={`/dashboard/applications/${interview.applicationId}`}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer flex items-center gap-1"
                          >
                            <HugeiconsIcon icon={ViewIcon} size={13} />
                            <span>{locale === 'th' ? 'ใบสมัคร' : 'Application'}</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Reschedule Interview Dialog */}
      {mounted && rescheduleTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="absolute inset-0" onClick={() => !isSaving && setRescheduleTarget(null)} aria-hidden="true" />
          <div className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 space-y-5 animate-scale-in my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold shrink-0">
                  <HugeiconsIcon icon={ReloadIcon} size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {locale === 'th' ? 'เลื่อนวันนัดสัมภาษณ์ (Reschedule)' : 'Reschedule Interview'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    ผู้สมัคร: <span className="font-bold text-slate-800">{rescheduleTarget.candidateNameTh || rescheduleTarget.candidateName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSaving && setRescheduleTarget(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              {/* Target Job */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-[11px] text-slate-400 font-bold uppercase">{locale === 'th' ? 'ตำแหน่งงาน' : 'Position'}</p>
                <p className="font-bold text-slate-900 text-xs mt-0.5">
                  {locale === 'th' ? rescheduleTarget.vacancyTitleTh || rescheduleTarget.vacancyTitle : rescheduleTarget.vacancyTitle}
                </p>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-slate-500" />
                    <span>{locale === 'th' ? 'เลือกวันที่ใหม่ (New Date)' : 'New Date'}</span>
                  </label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="rounded-xl border-slate-200 bg-white text-xs h-9 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Clock01Icon} size={14} className="text-slate-500" />
                    <span>{locale === 'th' ? 'เลือกเวลาใหม่ (New Time)' : 'New Time'}</span>
                  </label>
                  <Input
                    type="time"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="rounded-xl border-slate-200 bg-white text-xs h-9 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Duration & Interview Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Clock01Icon} size={14} className="text-slate-500" />
                    <span>{locale === 'th' ? 'ระยะเวลา (Duration)' : 'Duration'}</span>
                  </label>
                  <select
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-emerald-500"
                  >
                    <option value={30}>30 {locale === 'th' ? 'นาที' : 'mins'}</option>
                    <option value={45}>45 {locale === 'th' ? 'นาที' : 'mins'}</option>
                    <option value={60}>60 {locale === 'th' ? 'นาที (มาตรฐาน)' : 'mins (Standard)'}</option>
                    <option value={90}>90 {locale === 'th' ? 'นาที' : 'mins'}</option>
                    <option value={120}>120 {locale === 'th' ? 'นาที' : 'mins'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <HugeiconsIcon icon={Target01Icon} size={14} className="text-slate-500" />
                    <span>{locale === 'th' ? 'รอบการสัมภาษณ์ (Type)' : 'Round Type'}</span>
                  </label>
                  <select
                    value={interviewType}
                    onChange={e => setInterviewType(e.target.value as InterviewType)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 focus:outline-emerald-500"
                  >
                    <option value="TECHNICAL">สัมภาษณ์เชิงเทคนิค (Technical)</option>
                    <option value="BEHAVIORAL">สัมภาษณ์พฤติกรรม (Behavioral)</option>
                    <option value="PANEL">สัมภาษณ์คณะกรรมการ (Panel)</option>
                    <option value="FINAL">สัมภาษณ์รอบสุดท้าย (Final)</option>
                    <option value="PHONE_SCREEN">โทรสัมภาษณ์เบื้องต้น (Phone Screen)</option>
                  </select>
                </div>
              </div>

              {/* Format: Online vs Onsite */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <HugeiconsIcon icon={Building05Icon} size={14} className="text-slate-500" />
                  <span>{locale === 'th' ? 'รูปแบบการสัมภาษณ์' : 'Format'}</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormatType('ONLINE');
                      setLocation('Google Meet (Online)');
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formatType === 'ONLINE'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <HugeiconsIcon icon={ComputerIcon} size={14} />
                    <span>ออนไลน์ (Google Meet)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormatType('ONSITE');
                      setLocation('อาคาร 11 ชั้น 8 มหาวิทยาลัยศรีปทุม (บางเขน)');
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formatType === 'ONSITE'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <HugeiconsIcon icon={Location01Icon} size={14} />
                    <span>ออนไซต์ (ณ สถานที่)</span>
                  </button>
                </div>

                {formatType === 'ONLINE' ? (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <HugeiconsIcon icon={Link01Icon} size={12} />
                      <span>ลิงก์ห้องสัมภาษณ์ (Meeting URL)</span>
                    </label>
                    <Input
                      value={meetingUrl}
                      onChange={e => setMeetingUrl(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="rounded-xl border-slate-200 bg-white text-xs h-9 font-medium"
                    />
                  </div>
                ) : (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <HugeiconsIcon icon={Building05Icon} size={12} />
                      <span>สถานที่/ห้องสัมภาษณ์ (Location / Room)</span>
                    </label>
                    <Input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="ระบุห้องหรืออาคาร..."
                      className="rounded-xl border-slate-200 bg-white text-xs h-9 font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Reschedule Reason */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <HugeiconsIcon icon={AssignmentsIcon} size={14} className="text-slate-500" />
                  <span>{locale === 'th' ? 'เหตุผลการขอเลื่อนนัดหมาย (Reschedule Reason)' : 'Reason for Reschedule'}</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {QUICK_REASONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        reason === r
                          ? 'border-amber-400 bg-amber-100/80 text-amber-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <Input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={locale === 'th' ? 'ระบุเหตุผลการเลื่อนนัดหมาย...' : 'Specify reason...'}
                  className="rounded-xl border-slate-200 bg-white text-xs h-9 font-medium"
                />
              </div>

              {/* Email Notification Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                <input
                  type="checkbox"
                  id="notifyCheck"
                  checked={sendNotification}
                  onChange={e => setSendNotification(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="notifyCheck" className="text-[11px] font-bold text-emerald-900 cursor-pointer select-none flex items-center gap-1.5">
                  <HugeiconsIcon icon={Mail01Icon} size={14} className="text-emerald-800" />
                  <span>{locale === 'th' ? 'ส่งอีเมลแจ้งเตือนวันนัดหมายใหม่ไปยังผู้สมัครและคณะกรรมการทันที' : 'Send automated calendar notification to candidate & panel'}</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRescheduleTarget(null)}
                disabled={isSaving}
                className="text-xs font-semibold rounded-xl"
              >
                {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleSaveReschedule}
                disabled={isSaving || !newDate || !newTime}
                className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
              >
                {isSaving ? 'กำลังบันทึก...' : (
                  <>
                    <HugeiconsIcon icon={FloppyDiskIcon} size={15} />
                    <span>{locale === 'th' ? 'บันทึกการเลื่อนนัดหมาย' : 'Save Reschedule'}</span>
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
