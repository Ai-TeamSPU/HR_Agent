'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { fetchVacancyByIdFromDB, submitApplicationToDB } from '@/pageback/services';
import type { Vacancy } from '@/lib/types/vacancy';

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: 'RESUME' | 'PORTFOLIO' | 'CERTIFICATE' | 'TRANSCRIPT' | 'OTHER';
  fileObj?: File;
}

export default function ApplyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const { locale, t } = useLocale();
  const [vacancy, setVacancy] = useState<Vacancy | undefined>(undefined);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPosition, setCurrentPosition] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Multiple Files State
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    async function load() {
      setLoading(true);
      const v = await fetchVacancyByIdFromDB(jobId);
      setVacancy(v);
      setLoading(false);
    }
    load();
  }, [jobId]);

  const handleFilesAdded = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: AttachedFile[] = Array.from(fileList).map((file, index) => {
      let defaultCat: AttachedFile['category'] = 'OTHER';
      const lower = file.name.toLowerCase();
      if (lower.includes('resume') || lower.includes('cv')) defaultCat = 'RESUME';
      else if (lower.includes('portfolio') || lower.includes('work')) defaultCat = 'PORTFOLIO';
      else if (lower.includes('cert') || lower.includes('certificate')) defaultCat = 'CERTIFICATE';
      else if (lower.includes('transcript') || lower.includes('grade')) defaultCat = 'TRANSCRIPT';

      return {
        id: `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        category: defaultCat,
        fileObj: file,
      };
    });

    setAttachedFiles(prev => [...prev, ...newFiles]);
  };


  const handleRemoveFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleCategoryChange = (id: string, newCategory: AttachedFile['category']) => {
    setAttachedFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, category: newCategory } : f))
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📕';
    if (ext === 'doc' || ext === 'docx') return '📘';
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return '🖼️';
    if (ext === 'zip' || ext === 'rar') return '📦';
    return '📄';
  };

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

  // ป้องกันการสมัครตำแหน่งที่ยังไม่อนุมัติ/ประกาศ
  if (!['PUBLISHED', 'RECRUITING'].includes(vacancy.state)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <p className="text-5xl mb-3">🔒</p>
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

  const handleAddSkill = (skillToAdd?: string) => {
    const text = (skillToAdd || skillInput).trim();
    if (!text) return;
    const splitSkills = text.split(/[,،]+/).map(s => s.trim()).filter(s => s.length > 0);
    const updated = Array.from(new Set([...skills, ...splitSkills]));
    setSkills(updated);
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg(locale === 'th' ? 'กรุณากรอกข้อมูลส่วนตัว (ชื่อ, นามสกุล, อีเมล, เบอร์โทรศัพท์) ให้ครบถ้วน' : 'Please fill in all required personal information fields.');
      setStep(1);
      return;
    }

    if (attachedFiles.length === 0) {
      setErrorMsg(locale === 'th' ? 'กรุณาแนบไฟล์ Resume หรือเอกสารอย่างน้อย 1 ไฟล์' : 'Please attach at least 1 document (Resume/CV)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    let filesToSubmit = attachedFiles.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
      category: f.category,
      url: `/uploads/${f.name}`,
    }));

    // If candidate selected real file objects, upload them to /api/upload
    const filesWithObj = attachedFiles.filter(f => f.fileObj);
    if (filesWithObj.length > 0) {
      try {
        const formData = new FormData();
        filesWithObj.forEach(f => {
          if (f.fileObj) formData.append('files', f.fileObj);
        });

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.success && uploadJson.files) {
          filesToSubmit = attachedFiles.map(f => {
            const found = uploadJson.files.find((u: any) => u.originalName === f.name);
            return {
              name: f.name,
              size: f.size,
              type: f.type,
              category: f.category,
              url: found ? found.url : `/uploads/${f.name}`,
            };
          });
        }
      } catch (uploadErr) {
        console.error('Error uploading files to server:', uploadErr);
      }
    }

    const res = await submitApplicationToDB({
      candidate: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        currentPosition: currentPosition.trim() || undefined,
        currentCompany: currentCompany.trim() || undefined,
        experienceYears: Number(experienceYears) || 0,
        skills: skills,
      },
      vacancyId: jobId,
      files: filesToSubmit,
    });


    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setErrorMsg(res.error || 'Submission failed');
    }
  };


  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full border-emerald-200 bg-white shadow-xl rounded-3xl p-4 animate-fade-in">
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {locale === 'th' ? 'ส่งใบสมัครสำเร็จ!' : 'Application Submitted!'}
            </h2>
            <p className="text-sm text-slate-600 mb-3 leading-relaxed">
              {locale === 'th'
                ? `ใบสมัครของคุณสำหรับตำแหน่ง ${vacancy.position.titleTh} ได้ถูกบันทึกเรียบร้อยแล้ว`
                : `Your application for ${vacancy.position.title} has been recorded successfully.`}
            </p>

            <p className="text-xs text-emerald-700 font-semibold mb-6">
              📎 {locale === 'th' ? `แนบเอกสารทั้งหมด ${attachedFiles.length} ไฟล์` : `Attached ${attachedFiles.length} file(s)`}
            </p>
            <div className="flex justify-center pt-2">
              <Link href="/jobs">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl px-8 py-2.5 shadow-md shadow-emerald-600/20 cursor-pointer">
                  {locale === 'th' ? 'ดูตำแหน่งอื่น' : 'Browse more jobs'}
                </Button>
              </Link>
            </div>

          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/jobs" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-emerald-600/20">HR</div>
            <span className="font-bold text-base text-slate-900">HR AI Agent</span>
          </Link>
          <Link href={`/jobs/${jobId}`} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
            ← {t('common.back')}
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Position header */}
        <div className="mb-6">
          <p className="text-xs text-slate-500 font-semibold mb-1">
            {locale === 'th' ? 'สมัครงานตำแหน่ง' : 'Apply for'}
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {locale === 'th' ? vacancy.position.titleTh : vacancy.position.title}
          </h1>
          <p className="text-sm text-emerald-700 font-semibold mt-0.5">
            {locale === 'th' ? vacancy.position.departmentTh : vacancy.position.department}
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { num: 1, label: locale === 'th' ? 'ข้อมูลส่วนตัว' : 'Personal Info' },
            { num: 2, label: locale === 'th' ? 'ประสบการณ์' : 'Experience' },
            { num: 3, label: locale === 'th' ? 'แนบเอกสาร (Multiple)' : 'Documents (Multiple)' },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s.num
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-200 text-slate-500'
              }`}>
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step >= s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </span>
              {i < 2 && <div className={`flex-1 h-0.5 ${step > s.num ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl animate-fade-in">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-4">{locale === 'th' ? '👤 ข้อมูลส่วนตัว' : '👤 Personal Information'}</h2>
              
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{locale === 'th' ? 'ชื่อ' : 'First Name'} *</label>
                  <Input
                    value={firstName}
                    onChange={e => {
                      setFirstName(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="bg-white border-slate-200 text-slate-900 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{locale === 'th' ? 'นามสกุล' : 'Last Name'} *</label>
                  <Input
                    value={lastName}
                    onChange={e => {
                      setLastName(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="bg-white border-slate-200 text-slate-900 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{t('login.email')} *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="bg-white border-slate-200 text-slate-900 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{locale === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'} *</label>
                <Input
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="bg-white border-slate-200 text-slate-900 rounded-xl"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => {
                    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
                      setErrorMsg(locale === 'th' ? 'กรุณากรอกข้อมูลส่วนตัวที่มีเครื่องหมาย * ให้ครบถ้วน' : 'Please fill in all required fields marked with *');
                      return;
                    }
                    setErrorMsg('');
                    setStep(2);
                  }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
                >
                  {t('common.next')} →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Experience */}
        {step === 2 && (
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl animate-fade-in">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 mb-4">{locale === 'th' ? '💼 ประสบการณ์ทำงาน' : '💼 Work Experience'}</h2>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{locale === 'th' ? 'ตำแหน่งปัจจุบัน' : 'Current Position'}</label>
                <Input
                  value={currentPosition}
                  onChange={e => setCurrentPosition(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{locale === 'th' ? 'บริษัทปัจจุบัน' : 'Current Company'}</label>
                <Input
                  value={currentCompany}
                  onChange={e => setCurrentCompany(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">{locale === 'th' ? 'ประสบการณ์ (ปี)' : 'Experience (Years)'}</label>
                <Input
                  type="number"
                  value={experienceYears}
                  onChange={e => setExperienceYears(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900 rounded-xl"
                />
              </div>


              {/* Skills Input Section */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-900 block">
                      ⚡ {locale === 'th' ? 'ทักษะและความเชี่ยวชาญ (Skills)' : 'Skills & Proficiencies'} *
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {locale === 'th'
                        ? 'พิมพ์ทักษะแล้วกด Enter หรือเลือกจากรายการแนะนำ (AI จะนำข้อมูลนี้ไปประเมินความเหมาะสม)'
                        : 'Type skills and press Enter or select suggestions (AI uses this for candidate matching)'}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {skills.length} {locale === 'th' ? 'ทักษะ' : 'skills'}
                  </span>
                </div>

                {/* Input + Add button */}
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder={locale === 'th' ? 'เช่น React, TypeScript, Next.js, AI, SQL (คั่นด้วยจุลภาคได้)' : 'e.g. React, TypeScript, Python, SQL'}
                    className="bg-white border-slate-200 text-slate-900 rounded-xl text-sm font-medium"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddSkill()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-4 text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    + {locale === 'th' ? 'เพิ่มทักษะ' : 'Add'}
                  </Button>
                </div>

                {/* Active Skills Chips */}
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 min-h-[44px]">
                    {skills.map(s => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300/80 shadow-xs animate-fade-in"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s)}
                          className="w-4 h-4 rounded-full hover:bg-emerald-200/80 text-emerald-800 flex items-center justify-center text-[10px] font-black transition-colors cursor-pointer ml-0.5"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggested Skills */}
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold mb-1.5">
                    💡 {locale === 'th' ? 'ทักษะแนะนำที่เกี่ยวข้องกับตำแหน่งนี้ (คลิกเพื่อเพิ่มทันที):' : 'Suggested Skills (Click to add):'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'AI/ML',
                      'FastAPI', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'System Design',
                      'Prompt Engineering', 'Figma', 'Agile / Scrum', 'Problem Solving'
                    ].filter(s => !skills.includes(s)).slice(0, 8).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddSkill(s)}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 transition-all cursor-pointer shadow-2xs"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" className="border-slate-200 bg-white text-slate-700 rounded-xl font-semibold" onClick={() => setStep(1)}>
                  ← {t('common.previous')}
                </Button>
                <Button onClick={() => setStep(3)} className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20">
                  {t('common.next')} →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Documents & Multiple File Upload */}
        {step === 3 && (
          <Card className="border-slate-200 bg-white shadow-xs rounded-2xl animate-fade-in">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{locale === 'th' ? '📎 แนบเอกสารการสมัคร (หลายไฟล์)' : '📎 Upload Application Documents (Multiple)'}</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {locale === 'th' ? 'สามารถแนบ Resume, Portfolio, ผลการเรียน และใบรับรองต่างๆ ได้พร้อมกัน' : 'Upload Resume, Portfolio, Transcripts, and Certificates together'}
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  {locale === 'th' ? `แนบแล้ว ${attachedFiles.length} ไฟล์` : `${attachedFiles.length} files attached`}
                </span>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                multiple
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                onChange={(e) => handleFilesAdded(e.target.files)}
              />

              {/* Drag & Drop Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFilesAdded(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30'
                }`}
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-2xl mb-3">
                  📁
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {locale === 'th' ? 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่' : 'Click to browse files or drag & drop here'}
                </p>
                <p className="text-xs text-slate-500 mt-1.5 font-medium">
                  {locale === 'th'
                    ? 'รองรับไฟล์ PDF, Word (.docx), รูปภาพ, ZIP (เลือกได้หลายไฟล์พร้อมกัน ไม่จำกัดจำนวน)'
                    : 'Supports PDF, Word (.docx), Images, ZIP (Multiple files supported)'}
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 bg-white hover:bg-slate-100 text-emerald-700 border border-slate-200 font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all"
                >
                  <span>➕</span> {locale === 'th' ? 'เลือกไฟล์จากเครื่อง' : 'Select Files'}
                </button>
              </div>

              {/* Uploaded Files List */}
              {attachedFiles.length > 0 && (
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {locale === 'th' ? 'รายการไฟล์ที่แนบไว้:' : 'Attached Files:'}
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {attachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl shadow-xs transition-all gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-2xl shrink-0">{getFileIcon(file.name)}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>

                        {/* Category Selector */}
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={file.category}
                            onChange={(e) => handleCategoryChange(file.id, e.target.value as any)}
                            className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-emerald-500"
                          >
                            <option value="RESUME">{locale === 'th' ? '📄 Resume / CV' : '📄 Resume / CV'}</option>
                            <option value="PORTFOLIO">{locale === 'th' ? '🎨 Portfolio / ผลงาน' : '🎨 Portfolio'}</option>
                            <option value="TRANSCRIPT">{locale === 'th' ? '🎓 ผลการเรียน (Transcript)' : '🎓 Transcript'}</option>
                            <option value="CERTIFICATE">{locale === 'th' ? '📜 ใบรับรอง / Cert' : '📜 Certificate'}</option>
                            <option value="OTHER">{locale === 'th' ? '📎 อื่นๆ' : '📎 Other'}</option>
                          </select>

                          {/* Delete File Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            title={locale === 'th' ? 'ลบไฟล์นี้' : 'Remove file'}
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 animate-fade-in">
                  ⚠️ {errorMsg}
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <Button variant="outline" className="border-slate-200 bg-white text-slate-700 rounded-xl font-semibold cursor-pointer" onClick={() => setStep(2)}>
                  ← {t('common.previous')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      {locale === 'th' ? 'กำลังบันทึกข้อมูล...' : 'Saving...'}
                    </span>
                  ) : (
                    `✅ ${locale === 'th' ? 'ส่งใบสมัคร' : 'Submit Application'}`
                  )}

                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
