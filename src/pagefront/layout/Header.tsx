'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { useSidebar } from '@/pagefront/providers/SidebarProvider';
import { useTheme } from '@/pagefront/providers/ThemeProvider';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Notification02Icon,
  Notification01Icon,
  Mailbox01Icon,
  CheckmarkSquare01Icon,
  Clock01Icon,
  FlashIcon,
  User03Icon,
  Settings01Icon,
  LogOutIcon,
  File01Icon,
  ChatBotIcon,
  Calendar03Icon,
  AssignmentsIcon,
  SparklesIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import {

  fetchNotificationsFromDB,
  markNotificationAsReadInDB,
  markAllNotificationsAsReadInDB,
} from '@/pageback/services';


interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  titleTh: string;
  message: string;
  messageTh: string;
  type: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

const DEFAULT_USER = {
  id: '1',
  name: 'Somchai Prasert',
  nameTh: 'สมชาย ประเสริฐ',
  email: 'somchai.p@spu.ac.th',
  role: 'HR Manager',
  department: 'ฝ่ายทรัพยากรบุคคล',
  avatarUrl: '',
};

export function Header() {
  const { locale, setLocale, t } = useLocale();
  const { toggleMobile } = useSidebar();
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(DEFAULT_USER);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load user from localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hr_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) {
          setCurrentUser(prev => ({
            ...prev,
            name: parsed.name || prev.name,
            nameTh: parsed.nameTh || prev.nameTh,
            email: parsed.email,
            role: parsed.role || prev.role,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);


  // Fetch notifications from Supabase
  const loadNotifications = async () => {
    try {
      const data = await fetchNotificationsFromDB();
      if (data && Array.isArray(data)) {
        setNotifications(data.map((item: any) => ({
          id: String(item.id),
          userId: item.user_id ? String(item.user_id) : undefined,
          title: item.title || '',
          titleTh: item.title_th || item.title || '',
          message: item.message || '',
          messageTh: item.message_th || item.message || '',
          type: item.type || 'INFO',
          read: item.read ?? false,
          actionUrl: item.action_url,
          createdAt: item.created_at || new Date().toISOString(),
        })));
      }
    } catch (err) {
      console.warn('Could not fetch notifications from DB:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 15s for new notifications
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  /**
   * ถอดรหัสหาหน้าที่ต้องนำทางไป (Destination URL) จากข้อมูลการแจ้งเตือน
   */
  const resolveNotificationUrl = (notif: NotificationItem): string => {
    // 1. ถ้ามี actionUrl ที่ระบุหน้ารายการเฉพาะเจาะจง (ไม่ใช่แค่ generic /dashboard)
    if (notif.actionUrl && notif.actionUrl.trim() !== '' && notif.actionUrl !== '/dashboard') {
      return notif.actionUrl;
    }

    // 2. วิเคราะห์จากข้อความ Title และ Message
    const combined = `${notif.title} ${notif.titleTh} ${notif.message} ${notif.messageTh}`.toLowerCase();

    // กรณีเกี่ยวข้องกับ Vacancy ID (เช่น "Vacancy #6" หรือ "ตำแหน่งงาน #6")
    const vacancyMatch = combined.match(/vacancy\s*#?\s*(\d+)/i) || combined.match(/ตำแหน่งงาน\s*#?\s*(\d+)/i);
    if (vacancyMatch && vacancyMatch[1]) {
      return `/dashboard/vacancies/${vacancyMatch[1]}`;
    }

    // กรณีเกี่ยวข้องกับ Application ID (เช่น "Application #1" หรือ "ใบสมัคร #1")
    const appMatch = combined.match(/application\s*#?\s*(\d+)/i) || combined.match(/ใบสมัคร\s*#?\s*(\d+)/i);
    if (appMatch && appMatch[1]) {
      return `/dashboard/applications/${appMatch[1]}`;
    }

    // หมวดหมู่งานตามคำสำคัญ
    if (combined.includes('interview') || combined.includes('สัมภาษณ์')) {
      return '/dashboard/interviews';
    }
    if (combined.includes('applied') || combined.includes('สมัคร') || combined.includes('application')) {
      return '/dashboard/applications';
    }
    if (combined.includes('screening') || combined.includes('คัดกรอง') || combined.includes('gemini') || combined.includes('ai')) {
      return '/dashboard/ai-agent';
    }
    if (combined.includes('vacancy') || combined.includes('ตำแหน่งงาน') || combined.includes('job description') || combined.includes('jd')) {
      return '/dashboard/vacancies';
    }
    if (combined.includes('employee') || combined.includes('พนักงาน') || combined.includes('ลาออก')) {
      return '/dashboard/employees';
    }

    return '/dashboard';
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    // คำนวณหา URL ปลายทางของรายการนั้นทันที
    const targetUrl = resolveNotificationUrl(notif);

    // 1. ปรับสถานะให้อ่านแล้วใน Local state ทันที (จุดสีแดงหายทันที)
    setNotifications(prev =>
      prev.map(n => (n.id === notif.id ? { ...n, read: true } : n))
    );

    // 2. ปิดหน้าต่าง Notification Dropdown ทันที
    setShowNotifications(false);

    // 3. บันทึกสถานะอ่านแล้วลง Supabase ใน Background (ไม่บล็อก UI)
    markNotificationAsReadInDB(notif.id).catch(err => {
      console.warn('Background mark notification read error:', err);
    });

    // 4. นำทางผู้ใช้งานไปยังหน้ารายการนั้นทันที!
    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await markAllNotificationsAsReadInDB();
  };

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hr_user');
        sessionStorage.clear();
      }
    } catch (e) {
      console.warn('Logout cleanup:', e);
    }
    router.push('/login');
  };

  const getNotificationIcon = (notif: NotificationItem) => {
    const text = (notif.titleTh + ' ' + notif.title + ' ' + notif.messageTh).toLowerCase();
    if (text.includes('สมัคร') || text.includes('application')) return <HugeiconsIcon icon={File01Icon} size={18} className="text-blue-600 dark:text-blue-400" />;
    if (text.includes('ai') || text.includes('คัดกรอง') || text.includes('gemini')) return <HugeiconsIcon icon={ChatBotIcon} size={18} className="text-emerald-600 dark:text-emerald-400" />;
    if (text.includes('สัมภาษณ์') || text.includes('interview')) return <HugeiconsIcon icon={Calendar03Icon} size={18} className="text-amber-600 dark:text-amber-400" />;
    if (text.includes('jd') || text.includes('job description')) return <HugeiconsIcon icon={AssignmentsIcon} size={18} className="text-purple-600 dark:text-purple-400" />;
    if (text.includes('อนุมัติ') || text.includes('approved') || text.includes('published')) return <HugeiconsIcon icon={SparklesIcon} size={18} className="text-teal-600 dark:text-teal-400" />;
    return <HugeiconsIcon icon={Notification01Icon} size={18} className="text-pink-600 dark:text-pink-400" />;
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return locale === 'th' ? 'เมื่อสักครู่' : 'Just now';
      if (diffMin < 60) return locale === 'th' ? `${diffMin} นาทีที่แล้ว` : `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return locale === 'th' ? `${diffHour} ชั่วโมงที่แล้ว` : `${diffHour}h ago`;
      const diffDay = Math.floor(diffHour / 24);
      return locale === 'th' ? `${diffDay} วันที่แล้ว` : `${diffDay}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-rose-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl transition-all">
      <div className="flex h-full items-center justify-between px-3.5 sm:px-6">
        {/* Left: Mobile Hamburger & Page context */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Hamburger Menu Button on Mobile/Tablet */}
          <button
            onClick={toggleMobile}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-pink-50 dark:hover:bg-slate-800 transition-colors border border-rose-200/80 dark:border-slate-700 shadow-2xs cursor-pointer"
            aria-label="Open navigation menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo preview on mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
              HR
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 hidden xs:inline-block">HR AI Agent</span>
          </div>

          <div className="hidden md:block text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('dashboard.welcome')},
            <span className="text-slate-900 dark:text-pink-300 font-semibold ml-1">
              {locale === 'th' ? currentUser.nameTh : currentUser.name}
            </span>
          </div>
        </div>


        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button (Two-tone Color Contrast Indicator) */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer active:scale-95 shadow-2xs ${
              isDark
                ? 'bg-black/90 border-pink-500 text-pink-300 hover:bg-slate-900 hover:border-pink-400'
                : 'bg-white border-pink-300 text-pink-700 hover:bg-pink-50 hover:border-pink-400'
            }`}
            title={locale === 'th' ? 'สลับธีม: สีชมพู-ขาว / สีชมพู-ดำ' : 'Toggle Theme: Pink-Light / Pink-Dark'}
          >
            {/* Minimalist Split Contrast Swatch */}
            <span className="w-3.5 h-3.5 rounded-full border border-pink-400 flex overflow-hidden shrink-0 shadow-2xs">
              <span className="w-1/2 h-full bg-rose-500" />
              <span className={`w-1/2 h-full ${isDark ? 'bg-black' : 'bg-white'}`} />
            </span>
            <span className="tracking-wide">
              {isDark
                ? (locale === 'th' ? 'ชมพู-ดำ' : 'Pink-Dark')
                : (locale === 'th' ? 'ชมพู-ขาว' : 'Pink-Light')}
            </span>
          </button>


          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 hover:bg-pink-50 text-slate-700 hover:text-pink-800 border-slate-200'
            }`}
          >
            {locale === 'th' ? 'EN' : 'TH'}
          </button>

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) loadNotifications();
              }}
              className={`relative p-2 rounded-xl transition-all cursor-pointer border active:scale-95 ${
                isDark
                  ? 'hover:bg-slate-800 text-slate-300 hover:text-pink-300 border-transparent hover:border-slate-700'
                  : 'hover:bg-pink-50 text-slate-600 hover:text-pink-800 border-transparent hover:border-pink-200'
              }`}
              aria-label="Toggle notifications"
            >
              <HugeiconsIcon icon={Notification02Icon} size={20} className="transition-transform group-hover:scale-105" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[9px] bg-rose-500 text-white border-0 flex items-center justify-center font-bold animate-pulse">
                  {unreadCount}
                </Badge>
              )}

            </button>

            {/* Notification dropdown */}
            {showNotifications && (
              <div className={`fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-12 w-auto sm:w-96 rounded-2xl border shadow-2xl py-2 z-50 animate-fade-in max-h-[80vh] flex flex-col ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-extrabold">
                      {locale === 'th' ? 'การแจ้งเตือนสด' : 'Live Notifications'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} {locale === 'th' ? 'ใหม่' : 'new'}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <HugeiconsIcon icon={CheckmarkSquare01Icon} size={13} />
                      <span>{locale === 'th' ? 'อ่านทั้งหมด' : 'Mark all read'}</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
                      <HugeiconsIcon icon={Mailbox01Icon} size={32} className="text-slate-300 dark:text-slate-600" />
                      <span>{locale === 'th' ? 'ไม่มีการแจ้งเตือนในขณะนี้' : 'No notifications yet'}</span>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`group px-4 py-3 hover:bg-pink-50/70 dark:hover:bg-slate-800/80 cursor-pointer transition-all ${
                          !notif.read ? 'bg-pink-50/50 dark:bg-pink-950/20' : ''
                        }`}
                        title={locale === 'th' ? 'คลิกเพื่อไปยังหน้ารายการนี้' : 'Click to go to this page'}
                      >
                        <div className="flex items-start gap-3">
                          <span className="shrink-0 mt-0.5">
                            {getNotificationIcon(notif)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-xs truncate ${!notif.read ? 'font-bold text-pink-950 dark:text-pink-200' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                                {locale === 'th' ? notif.titleTh : notif.title}
                              </p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                )}
                                <HugeiconsIcon
                                  icon={ArrowRight01Icon}
                                  size={13}
                                  className="text-slate-300 dark:text-slate-600 group-hover:text-pink-600 dark:group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all"
                                />
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                              {locale === 'th' ? notif.messageTh : notif.message}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              {notif.createdAt && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                                  <HugeiconsIcon icon={Clock01Icon} size={11} className="text-slate-400 dark:text-slate-500" />
                                  <span>{formatRelativeTime(notif.createdAt)}</span>
                                </p>
                              )}
                              <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                {locale === 'th' ? 'เปิดดูทันที →' : 'View →'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center">
                  <p className="text-[10px] text-slate-400 font-medium inline-flex items-center gap-1.5 justify-center">
                    <HugeiconsIcon icon={FlashIcon} size={12} className="text-amber-500" />
                    <span>{locale === 'th' ? 'แจ้งเตือนอัตโนมัติแบบเรียลไทม์จากระบบ HR AI Agent' : 'Real-time alerts synced with Supabase'}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-pink-50 dark:hover:bg-slate-800 transition-all outline-none border border-transparent hover:border-pink-200 dark:hover:border-slate-700 cursor-pointer"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-600 text-xs font-bold text-white shadow-sm">
                  {(currentUser.name || 'HR').split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {locale === 'th' ? currentUser.nameTh : currentUser.name}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1.5">
              <DropdownMenuItem
                onClick={() => router.push('/dashboard')}
                className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer py-2 flex items-center gap-2"
              >
                <HugeiconsIcon icon={User03Icon} size={14} className="text-slate-500" />
                <span>{locale === 'th' ? 'โปรไฟล์' : 'Profile'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer py-2 flex items-center gap-2">
                <HugeiconsIcon icon={Settings01Icon} size={14} className="text-slate-500" />
                <span>{t('nav.settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 rounded-lg cursor-pointer py-2 transition-colors flex items-center gap-2"
              >
                <HugeiconsIcon icon={LogOutIcon} size={14} className="text-rose-600" />
                <span>{t('nav.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

