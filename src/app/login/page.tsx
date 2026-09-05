'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, GlobalIcon } from '@hugeicons/core-free-icons';
import { loginUserFromDB } from '@/pageback/services';

export default function LoginPage() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage(locale === 'th' ? 'กรุณากรอกอีเมล' : 'Please enter your email');
      return;
    }
    if (!password) {
      setErrorMessage(locale === 'th' ? 'กรุณากรอกรหัสผ่าน' : 'Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginUserFromDB(email, password);

      if (res.success) {
        router.push('/dashboard');
      } else {
        setErrorMessage(res.error || (locale === 'th' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'Invalid email or password'));
      }
    } catch (err: any) {
      setErrorMessage(err.message || (locale === 'th' ? 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ' : 'Connection error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 py-10">
      {/* Background soft ambient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/70 via-slate-50 to-teal-50/70" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />

      {/* Login Card */}
      <Card className="relative z-10 w-full max-w-md mx-4 border-slate-200/90 bg-white/95 backdrop-blur-xl shadow-2xl shadow-emerald-950/10 rounded-3xl animate-fade-in">
        <CardContent className="p-7 sm:p-8">
          {/* Logo & Heading */}
          <div className="text-center mb-6">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 items-center justify-center text-xl font-black text-white mb-3 shadow-lg shadow-emerald-600/25">
              HR
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {locale === 'th' ? 'เข้าสู่ระบบสำหรับเจ้าหน้าที่' : 'HR Staff & Admin Portal'}
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {locale === 'th' ? 'ระบบสรรหาและคัดกรองบุคลากรอัจฉริยะ (HR AI Agent)' : 'AI-Powered Talent Acquisition System'}
            </p>
          </div>

          {/* Language toggle */}
          <div className="flex justify-center mb-6">
            <button
              type="button"
              onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
              className="px-3.5 py-1 rounded-full text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 transition-all border border-slate-200 cursor-pointer"
            >
              {locale === 'th' ? '🇬🇧 Switch to English' : '🇹🇭 เปลี่ยนเป็นภาษาไทย'}
            </button>
          </div>

          {/* Error alert */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 animate-shake">
              <HugeiconsIcon icon={Alert02Icon} size={16} className="shrink-0 text-rose-600 mt-0.5" />
              <p className="text-xs font-bold leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">{t('login.email')}</label>
              <Input
                type="email"
                placeholder="เช่น hr.admin@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="bg-white border-slate-200 text-slate-900 focus:border-emerald-600 focus:ring-emerald-500/20 h-11 rounded-xl text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">{t('login.password')}</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="bg-white border-slate-200 text-slate-900 focus:border-emerald-600 focus:ring-emerald-500/20 h-11 rounded-xl text-sm font-medium"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-300 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {locale === 'th' ? 'กำลังตรวจสอบสิทธิ์...' : 'Authenticating...'}
                </span>
              ) : (
                locale === 'th' ? 'เข้าสู่ระบบ (Sign In) →' : 'Sign in to Dashboard →'
              )}
            </Button>
          </form>

          {/* Public jobs link for candidates */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link
              href="/jobs"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1.5"
            >
              <HugeiconsIcon icon={GlobalIcon} size={15} />
              <span>{locale === 'th' ? 'สำหรับผู้สมัครงาน: ดูตำแหน่งงานที่เปิดรับสมัคร (ไม่ต้อง Login)' : 'For Job Seekers: View open jobs (No login needed)'}</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
