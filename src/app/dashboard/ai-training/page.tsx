'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AiBrain01Icon,
  SparklesIcon,
  FlashIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  PlusSignIcon,
  RefreshIcon,
  Copy01Icon,
  Search01Icon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  Delete02Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons';
import type { TrainingProfile, AIJDGenerationResponse } from '@/lib/types/ai';
import { createVacancyInDB } from '@/pageback/services';

// ชุดแท็กทักษะแนะนำสำหรับกดเพิ่มแบบ 1 คลิก
const SUGGESTED_SKILLS = [
  'Generative AI',
  'Next.js',
  'React',
  'TypeScript',
  'PostgreSQL',
  'Python',
  'TailwindCSS',
  'Cloud Architecture',
  'Agile / Scrum',
  'Data Analysis',
  'Communication Skills',
  'Creative Thinking',
];

// ชุดเทมเพลตคำสั่งกำกับ AI
const AI_GUIDELINE_PRESETS = [
  {
    label: '💻 เน้นเทคโนโลยี & นวัตกรรม',
    text: 'เน้นสถาปัตยกรรมคลาวด์ นวัตกรรมซอฟต์แวร์ และความปลอดภัยของข้อมูลเป็นสำคัญ ใช้ภาษาทันสมัย แสดงถึงวัฒนธรรมการทำงานแบบ Agility',
  },
  {
    label: '🎓 สไตล์วิชาการ & วิจัย (Academic)',
    text: 'เน้นผลงานวิจัยตีพิมพ์ระดับนานาชาติ การสร้างสรรค์องค์ความรู้ และการบูรณาการการเรียนรู้ในระดับอุดมศึกษา ใช้ภาษาทางการเชิงวิชาการ',
  },
  {
    label: '🤝 สไตล์บริการ & ให้คำปรึกษา (Empathy)',
    text: 'เน้นความเข้าอกเข้าใจ การสื่อสารเชิงบวก และการดูแลสุขภาวะของผู้รับบริการ ใช้ภาษาที่อบอุ่นและสร้างความไว้วางใจ',
  },
];

// ตัวเลือกโปรไฟล์หน่วยงาน (UNIT PROFILE) — อ้างอิง document/Prompt Create department.md
const UNIT_PROFILE_OPTIONS = [
  { value: 'P1', label: 'P1 · ADMIN (งานสำนักงาน/บริการภายใน)' },
  { value: 'P2', label: 'P2 · COMMERCIAL (ศูนย์หนังสือ/โรงพิมพ์/บ่มเพาะธุรกิจ)' },
  { value: 'P3', label: 'P3 · TECHNICAL (อาคารสถานที่/มีเดีย/กราฟิก)' },
  { value: 'P4', label: 'P4 · INDEPENDENT (ผู้ตรวจสอบ/สภามหาวิทยาลัย/กฎหมาย)' },
  { value: 'P5', label: 'P5 · PROFESSIONAL (ให้คำปรึกษาสุขภาวะ/หอสมุด)' },
  { value: 'P6', label: 'P6 · ACADEMIC (สายวิชาการ)' },
  { value: 'P7', label: 'P7 · SEPARATE (มูลนิธิมหาวิทยาลัยศรีปทุม)' },
];

const TRACK_OPTIONS = ['สายสนับสนุนวิชาการ', 'สายวิชาการ'];

const emptyDraft = {
  titleEn: '',
  titleTh: '',
  department: '',
  level: '',
  educationLevel: 'ปริญญาตรีขึ้นไป',
  minExperienceYears: 0,
  responsibilities: [] as string[],
  requiredSkills: [] as string[],
  aiGuidelines: '',
  benefits: [] as string[],
  salaryMin: 30000,
  salaryMax: 60000,
  unitProfile: '',
  track: '',
};

export default function AITrainingPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<TrainingProfile[]>([]);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'trained' | 'untrained'>('all');

  // Form states ของตำแหน่งที่เลือก / กำลังสร้างใหม่
  const [titleEn, setTitleEn] = useState(emptyDraft.titleEn);
  const [titleTh, setTitleTh] = useState(emptyDraft.titleTh);
  const [department, setDepartment] = useState(emptyDraft.department);
  const [level, setLevel] = useState(emptyDraft.level);
  const [unitProfile, setUnitProfile] = useState(emptyDraft.unitProfile);
  const [track, setTrack] = useState(emptyDraft.track);
  const [educationLevel, setEducationLevel] = useState(emptyDraft.educationLevel);
  const [minExperienceYears, setMinExperienceYears] = useState(emptyDraft.minExperienceYears);
  const [responsibilities, setResponsibilities] = useState<string[]>(emptyDraft.responsibilities);
  const [newRespInput, setNewRespInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(emptyDraft.requiredSkills);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [aiGuidelines, setAiGuidelines] = useState(emptyDraft.aiGuidelines);
  const [benefits, setBenefits] = useState<string[]>(emptyDraft.benefits);
  const [newBenefitInput, setNewBenefitInput] = useState('');
  const [salaryMin, setSalaryMin] = useState(emptyDraft.salaryMin);
  const [salaryMax, setSalaryMax] = useState(emptyDraft.salaryMax);
  const [isTrained, setIsTrained] = useState(false);
  const [lastTrainedAt, setLastTrainedAt] = useState<string | undefined>(undefined);

  // UI Interactive States
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [testRunCompleted, setTestRunCompleted] = useState(false);
  const [aiTestError, setAiTestError] = useState<string | null>(null);
  const [liveJDResult, setLiveJDResult] = useState<AIJDGenerationResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'preview' | 'prompt'>('preview');

  const currentPosition = useMemo(
    () => positions.find((p) => p.id === selectedId),
    [positions, selectedId]
  );

  // ดึงเกณฑ์มาตรฐาน AI ประจำตำแหน่งทั้งหมดจาก Supabase
  const fetchProfiles = useCallback(async (): Promise<TrainingProfile[]> => {
    setIsLoadingPositions(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/ai-training');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'โหลดข้อมูลไม่สำเร็จ');
      const profiles: TrainingProfile[] = json.profiles || [];
      setPositions(profiles);
      return profiles;
    } catch (err: any) {
      setLoadError(err.message || 'เชื่อมต่อ Supabase ไม่สำเร็จ');
      return [];
    } finally {
      setIsLoadingPositions(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles().then((profiles) => {
      if (profiles.length > 0) {
        selectProfile(profiles[0]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // โหลดค่าของ Profile ที่เลือกเข้าสู่ฟอร์ม
  const selectProfile = (p: TrainingProfile) => {
    setSelectedId(p.id);
    setIsCreatingNew(false);
    setTitleEn(p.positionTitle);
    setTitleTh(p.positionTitleTh || p.positionTitle);
    setDepartment(p.department);
    setLevel(p.level);
    setUnitProfile(p.unitProfile || '');
    setTrack(p.track || '');
    setEducationLevel(p.educationLevel || 'ปริญญาตรีขึ้นไป');
    setMinExperienceYears(p.minExperienceYears || 0);
    setResponsibilities(p.standardResponsibilities || []);
    setRequiredSkills(p.requiredSkills || []);
    setAiGuidelines(p.aiGuidelines || '');
    setBenefits(p.standardBenefits || []);
    setSalaryMin(p.salaryRange?.min || 30000);
    setSalaryMax(p.salaryRange?.max || 60000);
    setIsTrained(p.isTrained);
    setLastTrainedAt(p.lastTrainedAt);
    setLiveJDResult(null);
    setTestRunCompleted(p.isTrained);
  };

  // เริ่มสร้างเกณฑ์มาตรฐานสำหรับตำแหน่งใหม่ (ยังไม่บันทึกจนกว่าจะกดบันทึก)
  const handleAddNewProfile = () => {
    setSelectedId(undefined);
    setIsCreatingNew(true);
    setTitleEn(emptyDraft.titleEn);
    setTitleTh(emptyDraft.titleTh);
    setDepartment(emptyDraft.department);
    setLevel(emptyDraft.level);
    setUnitProfile(emptyDraft.unitProfile);
    setTrack(emptyDraft.track);
    setEducationLevel(emptyDraft.educationLevel);
    setMinExperienceYears(emptyDraft.minExperienceYears);
    setResponsibilities([]);
    setRequiredSkills([]);
    setAiGuidelines('');
    setBenefits([]);
    setSalaryMin(emptyDraft.salaryMin);
    setSalaryMax(emptyDraft.salaryMax);
    setIsTrained(false);
    setLastTrainedAt(undefined);
    setLiveJDResult(null);
    setTestRunCompleted(false);
  };

  const handleDeleteProfile = async (id: string) => {
    try {
      const res = await fetch(`/api/ai-training?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'ลบไม่สำเร็จ');

      const refreshed = await fetchProfiles();
      if (selectedId === id) {
        if (refreshed.length > 0) selectProfile(refreshed[0]);
        else handleAddNewProfile();
      }
    } catch (err: any) {
      setLoadError(err.message || 'ลบเกณฑ์มาตรฐานไม่สำเร็จ');
    }
  };

  // กรองตำแหน่งงาน
  const filteredPositions = useMemo(() => {
    return positions.filter((p) => {
      const matchSearch =
        (p.positionTitleTh || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.positionTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.department || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (filterTab === 'trained') return matchSearch && p.isTrained;
      if (filterTab === 'untrained') return matchSearch && !p.isTrained;
      return matchSearch;
    });
  }, [positions, searchQuery, filterTab]);

  // เพิ่ม Responsibility
  const handleAddResponsibility = () => {
    if (newRespInput.trim()) {
      setResponsibilities([...responsibilities, newRespInput.trim()]);
      setNewRespInput('');
    }
  };

  const handleRemoveResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  // เพิ่ม Skill
  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (trimmed && !requiredSkills.includes(trimmed)) {
      setRequiredSkills([...requiredSkills, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  // เพิ่ม Benefit
  const handleAddBenefit = () => {
    if (newBenefitInput.trim() && !benefits.includes(newBenefitInput.trim())) {
      setBenefits([...benefits, newBenefitInput.trim()]);
      setNewBenefitInput('');
    }
  };

  const handleRemoveBenefit = (benefit: string) => {
    setBenefits(benefits.filter((b) => b !== benefit));
  };

  // ทดสอบให้ Claude ร่าง JD จริงจากเกณฑ์ที่ตั้งไว้ (Live Test Run)
  const handleRunAITest = async () => {
    setIsSimulatingAI(true);
    setSimulationStep(1);
    setAiTestError(null);

    const stepTimer1 = setTimeout(() => setSimulationStep(2), 500);
    const stepTimer2 = setTimeout(() => setSimulationStep(3), 1100);

    try {
      const res = await fetch('/api/ai-generate-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionTitle: titleEn || titleTh,
          department,
          unitName: department,
          track,
          positionLevel: level,
          existingResponsibilities: responsibilities,
          customSkills: requiredSkills,
          salaryMin,
          salaryMax,
          trainingProfile: {
            positionTitle: titleEn || titleTh,
            positionTitleTh: titleTh,
            department,
            level,
            educationLevel,
            minExperienceYears,
            standardResponsibilities: responsibilities,
            requiredSkills,
            aiGuidelines,
            standardBenefits: benefits,
            unitProfile,
            track,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Claude สร้าง JD ไม่สำเร็จ');
      setLiveJDResult(json.jd as AIJDGenerationResponse);
      setTestRunCompleted(true);
    } catch (err: any) {
      setAiTestError(err.message || 'เชื่อมต่อ Claude ไม่สำเร็จ กรุณาตรวจสอบ ANTHROPIC_API_KEY');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsSimulatingAI(false);
    }
  };

  // บันทึกเกณฑ์มาตรฐานลง Supabase จริง
  const handleSaveTraining = async () => {
    if (!titleTh.trim() || !department.trim()) {
      setSaveError('กรุณากรอกชื่อตำแหน่ง (ไทย) และหน่วยงานก่อนบันทึก');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const payload: TrainingProfile = {
        id: isCreatingNew ? undefined : selectedId,
        positionTitle: titleEn || titleTh,
        positionTitleTh: titleTh,
        department,
        level,
        educationLevel,
        minExperienceYears,
        standardResponsibilities: responsibilities,
        requiredSkills,
        aiGuidelines,
        standardBenefits: benefits,
        salaryRange: { min: salaryMin, max: salaryMax },
        unitProfile: unitProfile || undefined,
        track: track || undefined,
        isTrained: true,
      };

      const res = await fetch('/api/ai-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'บันทึกเกณฑ์มาตรฐานไม่สำเร็จ');

      const refreshed = await fetchProfiles();
      const saved = refreshed.find((p) => p.id === json.id);
      if (saved) selectProfile(saved);

      setSaveToastVisible(true);
      setTimeout(() => setSaveToastVisible(false), 3500);
    } catch (err: any) {
      setSaveError(err.message || 'บันทึกเกณฑ์มาตรฐานไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  // เปิดรับสมัครตำแหน่งนี้จริง — สร้าง Position + Vacancy + Job Description (8 หมวด) ลง Supabase
  // จากผลลัพธ์ที่ Claude สร้างไว้ (liveJDResult) แล้วพาไปหน้ารายละเอียดตำแหน่งงานที่สร้างขึ้น
  // หมายเหตุ: ตำแหน่งใหม่จะเริ่มที่สถานะ DRAFT เหมือนการสร้างจากหน้า "ตำแหน่งงาน" ทุกประการ
  // ต้องผ่านขั้นตอนอนุมัติ/เผยแพร่ตามปกติก่อนจึงจะไปแสดงที่หน้า /jobs สาธารณะ
  const handlePublishVacancy = async () => {
    if (!liveJDResult) return;

    setIsPublishing(true);
    setPublishError(null);
    try {
      const res = await createVacancyInDB({
        title: liveJDResult.jobTitle || titleEn || titleTh,
        titleTh: liveJDResult.jobTitleTh || titleTh,
        department,
        departmentTh: department,
        headcount: 1,
        priority: 'MEDIUM',
        reason: 'NEW_POSITION',
        generateAIJD: false,
        salaryMin,
        salaryMax,
        unitName: department,
        track,
        positionLevel: level,
        aiJdOverride: liveJDResult,
      });

      if (!res.success || !res.vacancyId) {
        throw new Error(res.error || 'สร้างตำแหน่งงานไม่สำเร็จ');
      }

      router.push(`/dashboard/vacancies/${res.vacancyId}`);
    } catch (err: any) {
      setPublishError(err.message || 'เปิดรับสมัครตำแหน่งนี้ไม่สำเร็จ');
    } finally {
      setIsPublishing(false);
    }
  };

  // คืนค่าเริ่มต้น (ยกเลิกการแก้ไขที่ยังไม่บันทึก)
  const handleReset = () => {
    if (currentPosition) selectProfile(currentPosition);
    else handleAddNewProfile();
  };

  // คัดลอกข้อความ JD (ใช้ผลลัพธ์จริงจาก Claude ถ้ามี ไม่งั้นใช้เกณฑ์ที่ตั้งไว้)
  const handleCopyJD = () => {
    let jdText = '';
    if (liveJDResult) {
      jdText = `
ตำแหน่ง: ${liveJDResult.jobTitleTh} (${liveJDResult.jobTitle})
หน่วยงาน: ${liveJDResult.unitName || department} | ระดับ: ${liveJDResult.positionLevel || level} | Unit Profile: ${liveJDResult.unitProfile || unitProfile || '-'}

[วัตถุประสงค์ของตำแหน่ง]
${liveJDResult.jobPurposeTh || liveJDResult.summaryTh}

[หน้าที่ความรับผิดชอบหลัก]
${(liveJDResult.responsibilitiesGrouped && liveJDResult.responsibilitiesGrouped.length > 0)
  ? liveJDResult.responsibilitiesGrouped.map((d, i) => `${i + 1}. ${d.dutyAreaTh} (${d.weightPercent}%)\n   - ${(d.tasksTh || []).join('\n   - ')}`).join('\n')
  : liveJDResult.responsibilitiesTh.map((r, i) => `${i + 1}. ${r}`).join('\n')}

[ตัวชี้วัดผลงานหลัก]
${(liveJDResult.kpis || []).map((k) => `• ${k.nameTh} — วิธีวัด: ${k.methodTh} (เป้าหมาย: ${k.targetTh})`).join('\n')}

[ทักษะที่ต้องการ]
${liveJDResult.preferredSkills.join(', ')}

[สวัสดิการ]
${liveJDResult.benefitsTh.map((b) => `• ${b}`).join('\n')}
      `.trim();
    } else {
      jdText = `
ตำแหน่ง: ${titleTh} (${titleEn})
หน่วยงาน: ${department}
ระดับตำแหน่ง: ${level}
วุฒิการศึกษา: ${educationLevel} | ประสบการณ์ขั้นต่ำ: ${minExperienceYears} ปี

[หน้าที่ความรับผิดชอบหลัก]
${responsibilities.map((r, i) => `${i + 1}. ${r}`).join('\n')}

[ทักษะที่ต้องการ]
${requiredSkills.join(', ')}

[สวัสดิการ]
${benefits.map((b) => `• ${b}`).join('\n')}
      `.trim();
    }

    navigator.clipboard.writeText(jdText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // สถิติภาพรวม
  const trainedCount = positions.filter((p) => p.isTrained).length;
  const trainedPercent = positions.length > 0 ? Math.round((trainedCount / positions.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast แจ้งเตือนการบันทึก */}
      {saveToastVisible && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
          </div>
          <div>
            <p className="font-semibold text-sm">บันทึกเกณฑ์มาตรฐานสำเร็จ!</p>
            <p className="text-xs text-emerald-100">ตำแหน่งงานนี้พร้อมใช้สำหรับให้ Claude ร่าง JD อัตโนมัติแล้ว</p>
          </div>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium">
              <HugeiconsIcon icon={AiBrain01Icon} size={15} className="text-indigo-300 animate-pulse" />
              <span>AI Knowledge Grounding Studio</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-300 font-semibold">SPU JD Architect · Claude Opus 5</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              🧠 เทรน AI ประจำตำแหน่งงาน
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              กำหนดเกณฑ์มาตรฐาน ทักษะ และคำสั่งกำกับพิเศษ (Custom Prompt Guidelines) ให้กับ AI
              เพื่อให้การร่าง Job Description ครบ 8 หมวดมาตรฐาน สอดคล้องกับอัตลักษณ์ของมหาวิทยาลัยศรีปทุม (SPU) 100%
            </p>
          </div>

          {/* Mini Stats Card */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md px-4 py-3 rounded-xl">
            <div className="text-center px-2">
              <p className="text-xs text-slate-400 font-medium">ตำแหน่งทั้งหมด</p>
              <p className="text-xl font-bold text-white">{positions.length}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center px-2">
              <p className="text-xs text-slate-400 font-medium">เทรนแล้ว</p>
              <p className="text-xl font-bold text-emerald-400">{trainedCount}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center px-2">
              <p className="text-xs text-slate-400 font-medium">ความพร้อม</p>
              <p className="text-xl font-bold text-indigo-300">{trainedPercent}%</p>
            </div>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
          <HugeiconsIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ================================================================
            👈 คอลัมน์ซ้าย: Training Studio (ฟอร์มกำหนดเกณฑ์มาตรฐาน) (7 คอลัมน์)
           ================================================================ */}
        <div className="lg:col-span-7 space-y-6">

          {/* การ์ด 1: เลือกตำแหน่งงาน */}
          <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">1</span>
                    เลือกตำแหน่งงานที่ต้องการเทรน (Position Selector)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    เลือกจากเกณฑ์มาตรฐานที่มีอยู่ในระบบ หรือสร้างตำแหน่งใหม่เพื่อกำหนดเกณฑ์ AI
                  </CardDescription>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg text-xs">
                  <button
                    onClick={() => setFilterTab('all')}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      filterTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ทั้งหมด ({positions.length})
                  </button>
                  <button
                    onClick={() => setFilterTab('trained')}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      filterTab === 'trained' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✓ เทรนแล้ว ({trainedCount})
                  </button>
                  <button
                    onClick={() => setFilterTab('untrained')}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      filterTab === 'untrained' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    รอการเทรน ({positions.length - trainedCount})
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {/* Search Bar + ปุ่มเพิ่มตำแหน่งใหม่ */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อตำแหน่ง, แผนก หรือกลุ่มงาน..."
                    className="pl-9 text-xs h-9 bg-slate-50/50"
                  />
                </div>
                <Button
                  onClick={handleAddNewProfile}
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 text-xs gap-1 font-semibold shrink-0 cursor-pointer"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={14} />
                  ตำแหน่งใหม่
                </Button>
              </div>

              {/* Positions List Chips */}
              {isLoadingPositions ? (
                <p className="text-xs text-slate-400 py-6 text-center">กำลังโหลดเกณฑ์มาตรฐานจาก Supabase...</p>
              ) : filteredPositions.length === 0 && !isCreatingNew ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  {positions.length === 0 ? 'ยังไม่มีเกณฑ์มาตรฐานในระบบ — กด "ตำแหน่งใหม่" เพื่อเริ่มเทรน AI' : 'ไม่พบตำแหน่งที่ตรงกับการค้นหา'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredPositions.map((pos) => {
                    const isSelected = pos.id === selectedId && !isCreatingNew;
                    return (
                      <div
                        key={pos.id}
                        onClick={() => selectProfile(pos)}
                        className={`group p-3 rounded-xl border cursor-pointer transition-all text-left flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-bold leading-snug line-clamp-1 ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {pos.positionTitleTh || pos.positionTitle}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {pos.isTrained ? (
                              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none text-[10px] px-1.5 py-0">
                                ✓ เทรนแล้ว
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px] px-1.5 py-0">
                                รอเทรน
                              </Badge>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); pos.id && handleDeleteProfile(pos.id); }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                              title="ลบเกณฑ์มาตรฐานนี้"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={12} />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{pos.department}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ข้อมูลตำแหน่ง (แก้ไขได้) */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">SPU</span>
                    {isCreatingNew ? 'กำลังสร้างตำแหน่งใหม่' : 'ข้อมูลตำแหน่ง'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {isTrained ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} />
                        พร้อมใช้งาน {lastTrainedAt ? `(${lastTrainedAt})` : ''}
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                        ⚠️ ยังไม่มีเกณฑ์มาตรฐานเฉพาะ
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input value={titleTh} onChange={(e) => setTitleTh(e.target.value)} placeholder="ชื่อตำแหน่ง (ไทย) *" className="text-xs h-8 bg-white" />
                  <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="ชื่อตำแหน่ง (English)" className="text-xs h-8 bg-white" />
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="หน่วยงาน/แผนก *" className="text-xs h-8 bg-white" />
                  <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="ระดับตำแหน่ง (เช่น ปฏิบัติการ, หัวหน้างาน)" className="text-xs h-8 bg-white" />

                  <select
                    value={unitProfile}
                    onChange={(e) => setUnitProfile(e.target.value)}
                    className="text-xs h-8 px-2.5 rounded-md border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Unit Profile (P1-P7)...</option>
                    {UNIT_PROFILE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  <select
                    value={track}
                    onChange={(e) => setTrack(e.target.value)}
                    className="text-xs h-8 px-2.5 rounded-md border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">สายงาน...</option>
                    {TRACK_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-indigo-700 font-medium whitespace-nowrap">งบเงินเดือน:</span>
                    <Input type="number" value={salaryMin} onChange={(e) => setSalaryMin(Number(e.target.value) || 0)} className="text-xs h-8 bg-white" />
                    <span className="text-slate-400">-</span>
                    <Input type="number" value={salaryMax} onChange={(e) => setSalaryMax(Number(e.target.value) || 0)} className="text-xs h-8 bg-white" />
                  </div>
                </div>

                {saveError && (
                  <p className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-1.5">{saveError}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* การ์ด 2: หน้าที่ความรับผิดชอบหลัก (Core Responsibilities) */}
          <Card className="border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">2</span>
                    หน้าที่ความรับผิดชอบหลัก (Core Responsibilities Grounding)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    ข้อกำหนดงานหลักที่ AI ต้องนำไปเรียบเรียงบรรจุใน Job Description เสมอ
                  </CardDescription>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {responsibilities.length} ข้อ
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {/* รายการ Responsibilities */}
              <div className="space-y-2">
                {responsibilities.map((resp, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between gap-3 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/20 transition-all text-xs group"
                  >
                    <div className="flex items-start gap-2.5 flex-1">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-slate-700 leading-relaxed">{resp}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveResponsibility(index)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors rounded-md hover:bg-red-50 shrink-0 cursor-pointer"
                      title="ลบข้อนี้"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* ช่องเพิ่มหน้าที่ใหม่ */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  value={newRespInput}
                  onChange={(e) => setNewRespInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddResponsibility()}
                  placeholder="พิมพ์ข้อความหน้าที่ความรับผิดชอบใหม่ แล้วกด Enter หรือคลิกเพิ่ม..."
                  className="text-xs h-9 bg-slate-50/50"
                />
                <Button
                  onClick={handleAddResponsibility}
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 text-xs gap-1 font-semibold shrink-0 cursor-pointer"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={14} />
                  เพิ่ม
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* การ์ด 3: คุณสมบัติ & ทักษะที่ต้องการ (Qualifications & Skills) */}
          <Card className="border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">3</span>
                คุณสมบัติและทักษะที่ต้องการ (Qualifications & Skills Tags)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                เกณฑ์การศึกษา ประสบการณ์ และแท็กทักษะเฉพาะสำหรับคำนวณ Match Score
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* แถว 1: วุฒิการศึกษา & ประสบการณ์ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    วุฒิการศึกษาขั้นต่ำ:
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="ปริญญาตรีขึ้นไป">ปริญญาตรีขึ้นไป</option>
                    <option value="ปริญญาตรี (ตรงสายงาน)">ปริญญาตรี (ตรงสายงาน)</option>
                    <option value="ปริญญาโทขึ้นไป">ปริญญาโทขึ้นไป</option>
                    <option value="ปริญญาโท หรือ ปริญญาเอก">ปริญญาโท หรือ ปริญญาเอก</option>
                    <option value="ปริญญาเอก">ปริญญาเอก</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    ประสบการณ์ทำงานขั้นต่ำ (ปี):
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMinExperienceYears(Math.max(0, minExperienceYears - 1))}
                      className="h-9 w-9 text-sm font-bold cursor-pointer"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={minExperienceYears}
                      onChange={(e) => setMinExperienceYears(Number(e.target.value) || 0)}
                      className="h-9 text-xs text-center font-bold"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMinExperienceYears(minExperienceYears + 1)}
                      className="h-9 w-9 text-sm font-bold cursor-pointer"
                    >
                      +
                    </Button>
                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">ปีขึ้นไป</span>
                  </div>
                </div>
              </div>

              {/* แถว 2: Skills Tags */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>ทักษะและเครื่องมือบังคับ (Required Skills & Tech Stack):</span>
                  <span className="text-[11px] text-slate-400 font-normal">กด Enter เพื่อเพิ่มแท็ก</span>
                </label>

                {/* กล่องแสดง Tags */}
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 min-h-[44px]">
                  {requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 bg-white border border-indigo-200 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-md shadow-2xs group"
                    >
                      <span>{skill}</span>
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={12} />
                      </button>
                    </span>
                  ))}

                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(newSkillInput);
                      }
                    }}
                    placeholder="+ พิมพ์ชื่อทักษะ..."
                    className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-800 focus:outline-hidden placeholder:text-slate-400 px-1"
                  />
                </div>

                {/* ทักษะแนะนำสำหรับคลิกเลือกทันที */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
                    <HugeiconsIcon icon={SparklesIcon} size={12} className="text-indigo-500" />
                    ทักษะแนะนำ:
                  </span>
                  {SUGGESTED_SKILLS.filter((s) => !requiredSkills.includes(s)).slice(0, 6).map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => handleAddSkill(suggested)}
                      className="text-[11px] bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-2 py-0.5 rounded-full border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer"
                    >
                      + {suggested}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* การ์ด 4: คำสั่งพิเศษกำกับ AI (Custom Prompt Guidelines) */}
          <Card className="border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">4</span>
                    คำสั่งพิเศษกำกับ AI (Custom Prompt Guidelines & Tone)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    กำหนดบุคลิก โทนภาษา และจุดเน้นย้ำเฉพาะตำแหน่งให้ Claude
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {/* Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {AI_GUIDELINE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAiGuidelines(preset.text)}
                    className="text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <textarea
                value={aiGuidelines}
                onChange={(e) => setAiGuidelines(e.target.value)}
                rows={3}
                placeholder="ระบุข้อกำหนดเพิ่มเติม เช่น เน้นย้ำเรื่องความปลอดภัยของข้อมูลนักศึกษา, ใช้ภาษาทางการสร้างแรงบันดาลใจ..."
                className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 leading-relaxed"
              />
            </CardContent>
          </Card>

          {/* การ์ด 5: สิทธิประโยชน์และสวัสดิการ (Benefits Template) */}
          <Card className="border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">5</span>
                สวัสดิการและสิทธิประโยชน์ (Benefits Template)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                สวัสดิการเฉพาะตำแหน่งสำหรับดึงดูดบุคลากรคุณภาพ
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap gap-1.5 min-h-[38px]">
                {benefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-2.5 py-1 rounded-md"
                  >
                    <span>{benefit}</span>
                    <button
                      onClick={() => handleRemoveBenefit(benefit)}
                      className="text-emerald-500 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={12} />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={newBenefitInput}
                  onChange={(e) => setNewBenefitInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddBenefit()}
                  placeholder="+ เพิ่มสวัสดิการใหม่..."
                  className="text-xs h-9 bg-slate-50/50"
                />
                <Button
                  onClick={handleAddBenefit}
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 text-xs font-semibold shrink-0 cursor-pointer"
                >
                  เพิ่ม
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <HugeiconsIcon icon={RefreshIcon} size={14} />
              คืนค่าเริ่มต้น
            </Button>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleRunAITest}
                disabled={isSimulatingAI || !titleTh.trim() || !department.trim()}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer h-10 px-4 disabled:opacity-50"
              >
                <HugeiconsIcon icon={FlashIcon} size={15} />
                {isSimulatingAI ? 'กำลังประมวลผลผ่าน Claude...' : '⚡ ทดสอบให้ AI ร่างตัวอย่าง (Live Test Run)'}
              </Button>

              <Button
                onClick={handleSaveTraining}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer h-10 px-5 disabled:opacity-50"
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกเกณฑ์มาตรฐาน'}
              </Button>
            </div>
          </div>

        </div>

        {/* ================================================================
            👉 คอลัมน์ขวา: Live AI Playground & Generated JD Preview (5 คอลัมน์)
           ================================================================ */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">

          <Card className="border-indigo-200/80 shadow-lg rounded-xl overflow-hidden bg-white">
            {/* Header ของ Playground */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-4 text-white">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                    <HugeiconsIcon icon={AiBrain01Icon} size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      Live AI JD Preview
                    </h3>
                    <p className="text-[10px] text-indigo-200">
                      ขับเคลื่อนโดย SPU JD Architect · Claude Opus 5
                    </p>
                  </div>
                </div>

                <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>

              {/* Preview Tabs */}
              <div className="flex items-center gap-1 mt-3 bg-white/10 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setPreviewTab('preview')}
                  className={`flex-1 py-1 px-2 rounded-md font-medium text-xs transition-all cursor-pointer ${
                    previewTab === 'preview' ? 'bg-white text-indigo-950 font-bold shadow-xs' : 'text-indigo-200 hover:text-white'
                  }`}
                >
                  📄 ผลลัพธ์ Job Description
                </button>
                <button
                  onClick={() => setPreviewTab('prompt')}
                  className={`flex-1 py-1 px-2 rounded-md font-medium text-xs transition-all cursor-pointer ${
                    previewTab === 'prompt' ? 'bg-white text-indigo-950 font-bold shadow-xs' : 'text-indigo-200 hover:text-white'
                  }`}
                >
                  🔍 โครงสร้าง Prompt Grounding
                </button>
              </div>
            </div>

            {/* Content Area */}
            <CardContent className="p-4 space-y-4 max-h-[calc(100vh-230px)] overflow-y-auto">

              {/* Simulation Loader เมื่อกด Live Test Run */}
              {isSimulatingAI && (
                <div className="p-6 text-center space-y-3 bg-indigo-50/50 rounded-xl border border-indigo-100 animate-in fade-in duration-300">
                  <div className="relative w-12 h-12 mx-auto">
                    <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
                      <HugeiconsIcon icon={SparklesIcon} size={18} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-900">
                      {simulationStep === 1 && '1/3 กำลังวิเคราะห์หน้าที่ความรับผิดชอบและทักษะ...'}
                      {simulationStep === 2 && '2/3 สังเคราะห์ Prompt Grounding ตามมาตรฐาน SPU JD Architect...'}
                      {simulationStep === 3 && '3/3 Claude กำลังเรียบเรียง Job Description ครบ 8 หมวด...'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">ประมวลผลด้วยอัตลักษณ์มหาวิทยาลัยศรีปทุม</p>
                  </div>
                </div>
              )}

              {!isSimulatingAI && aiTestError && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0 mt-0.5" />
                  <span>{aiTestError}</span>
                </div>
              )}

              {/* แท็บที่ 1: ผลลัพธ์ Job Description */}
              {!isSimulatingAI && previewTab === 'preview' && (
                <div className="space-y-4 text-left">
                  {liveJDResult ? (
                    <>
                      {liveJDResult.modelVersion === 'claude-fallback-v1' && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                          <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">⚠️ นี่คือผลลัพธ์สำรอง ไม่ใช่ผลลัพธ์จริงจาก Claude</p>
                            <p className="mt-0.5 text-amber-800">
                              Claude ไม่ตอบสนอง (อาจเป็นเพราะยังไม่ได้รีสตาร์ท dev server หลังตั้งค่า ANTHROPIC_API_KEY,
                              เครดิตในบัญชี Anthropic ไม่พอ หรือ Claude กำลังมีผู้ใช้งานหนาแน่นชั่วคราว) เนื้อหาด้านล่างจึงเป็นเทมเพลตสำรองที่{' '}
                              <strong>ไม่ได้อิงจากเกณฑ์มาตรฐานที่ตั้งไว้</strong> — กด &quot;ทดสอบให้ AI ร่างตัวอย่าง&quot; ซ้ำอีกครั้ง
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {liveJDResult.modelVersion === 'claude-fallback-v1' ? (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] px-2 py-0">
                              ⚠️ ผลลัพธ์สำรอง (ไม่ใช่ Claude จริง)
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-[10px] px-2 py-0">
                              ✨ ผลลัพธ์จริงจาก Claude
                            </Badge>
                          )}
                          {liveJDResult.unitProfile && (
                            <Badge variant="outline" className="text-indigo-700 border-indigo-200 bg-indigo-50 text-[10px] px-2 py-0">
                              Unit Profile: {liveJDResult.unitProfile}
                            </Badge>
                          )}
                          {liveJDResult.positionLevel && (
                            <Badge variant="outline" className="text-slate-600 text-[10px] px-2 py-0">
                              ระดับ: {liveJDResult.positionLevel}
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">{liveJDResult.jobTitleTh}</h2>
                        <p className="text-xs text-slate-500 font-medium">{liveJDResult.jobTitle} · {liveJDResult.unitName || department}</p>
                      </div>

                      {(liveJDResult.jobPurposeTh || liveJDResult.summaryTh) && (
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                            <HugeiconsIcon icon={SparklesIcon} size={14} className="text-amber-500" />
                            วัตถุประสงค์ของตำแหน่ง (Job Purpose)
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{liveJDResult.jobPurposeTh || liveJDResult.summaryTh}</p>
                        </div>
                      )}

                      {/* หมวด 3: หน้าที่ความรับผิดชอบแบบกลุ่ม */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-800">หน้าที่ความรับผิดชอบหลัก (Key Responsibilities):</h4>
                        {liveJDResult.responsibilitiesGrouped && liveJDResult.responsibilitiesGrouped.length > 0 ? (
                          <div className="space-y-2.5">
                            {liveJDResult.responsibilitiesGrouped.map((duty, di) => (
                              <div key={di} className="rounded-lg border border-slate-200 p-2.5">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <p className="text-xs font-bold text-indigo-900">{duty.dutyAreaTh || duty.dutyArea}</p>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-indigo-700 border-indigo-200 bg-indigo-50">{duty.weightPercent}%</Badge>
                                </div>
                                <ul className="space-y-1">
                                  {(duty.tasksTh || duty.tasks || []).map((task, ti) => (
                                    <li key={ti} className="flex items-start gap-2 text-[11px] text-slate-600">
                                      <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                                      <span>{task}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <ul className="space-y-1.5">
                            {liveJDResult.responsibilitiesTh.map((resp, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                                <span>{resp}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* หมวด 4: KPIs */}
                      {liveJDResult.kpis && liveJDResult.kpis.length > 0 && (
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                          <h4 className="text-xs font-bold text-slate-800">ตัวชี้วัดผลงานหลัก (KPIs):</h4>
                          <div className="space-y-1.5">
                            {liveJDResult.kpis.map((kpi, ki) => (
                              <div key={ki} className="text-[11px] bg-slate-50 border border-slate-100 rounded-md p-2">
                                <p className="font-bold text-slate-800">{kpi.nameTh || kpi.name}</p>
                                <p className="text-slate-500">วิธีวัด: {kpi.methodTh || kpi.method} · เป้าหมาย: {kpi.targetTh || kpi.target}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* หมวด 5: คุณสมบัติ */}
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <h4 className="text-xs font-bold text-slate-800">คุณสมบัติผู้สมัคร (Qualifications):</h4>
                        <ul className="space-y-1 text-xs text-slate-600">
                          {liveJDResult.requirementsTh.map((r, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* หมวด 6: สมรรถนะ */}
                      {liveJDResult.competencies && (
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                          <h4 className="text-xs font-bold text-slate-800">สมรรถนะที่ต้องการ (Competencies):</h4>
                          <div className="space-y-1.5 text-[11px] text-slate-600">
                            {liveJDResult.competencies.coreTh && liveJDResult.competencies.coreTh.length > 0 && (
                              <p><span className="font-semibold text-slate-700">Core:</span> {liveJDResult.competencies.coreTh.join(', ')}</p>
                            )}
                            {liveJDResult.competencies.functional && liveJDResult.competencies.functional.length > 0 && (
                              <p><span className="font-semibold text-slate-700">Functional:</span> {liveJDResult.competencies.functional.map(f => `${f.nameTh || f.name} (Lv.${f.level})`).join(', ')}</p>
                            )}
                            {liveJDResult.competencies.digitalAITh && liveJDResult.competencies.digitalAITh.length > 0 && (
                              <p><span className="font-semibold text-slate-700">Digital & AI:</span> {liveJDResult.competencies.digitalAITh.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* หมวด 7: ความสัมพันธ์ในการทำงาน */}
                      {liveJDResult.workingRelationships && ((liveJDResult.workingRelationships.internalTh?.length || 0) > 0 || (liveJDResult.workingRelationships.externalTh?.length || 0) > 0) && (
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                          <h4 className="text-xs font-bold text-slate-800">ความสัมพันธ์ในการทำงาน (Working Relationships):</h4>
                          <div className="space-y-1 text-[11px] text-slate-600">
                            {liveJDResult.workingRelationships.internalTh && liveJDResult.workingRelationships.internalTh.length > 0 && (
                              <p><span className="font-semibold text-slate-700">ภายใน:</span> {liveJDResult.workingRelationships.internalTh.join(', ')}</p>
                            )}
                            {liveJDResult.workingRelationships.externalTh && liveJDResult.workingRelationships.externalTh.length > 0 && (
                              <p><span className="font-semibold text-slate-700">ภายนอก:</span> {liveJDResult.workingRelationships.externalTh.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* หมวด 8: เงื่อนไขและความเสี่ยง */}
                      {liveJDResult.workingConditions && ((liveJDResult.workingConditions.conditionsTh?.length || 0) > 0 || (liveJDResult.workingConditions.risksTh?.length || 0) > 0 || liveJDResult.workingConditions.pdpaInvolved) && (
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                          <h4 className="text-xs font-bold text-slate-800">เงื่อนไขและความเสี่ยงของงาน (Working Conditions & Risk):</h4>
                          <div className="space-y-1 text-[11px] text-slate-600">
                            {liveJDResult.workingConditions.conditionsTh && liveJDResult.workingConditions.conditionsTh.length > 0 && (
                              <p><span className="font-semibold text-slate-700">ลักษณะงาน:</span> {liveJDResult.workingConditions.conditionsTh.join(', ')}</p>
                            )}
                            {liveJDResult.workingConditions.risksTh && liveJDResult.workingConditions.risksTh.length > 0 && (
                              <p><span className="font-semibold text-slate-700">ความเสี่ยง:</span> {liveJDResult.workingConditions.risksTh.join(', ')}</p>
                            )}
                            {liveJDResult.workingConditions.pdpaInvolved && (
                              <p className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 inline-block">🔒 เกี่ยวข้องกับภาระหน้าที่ตาม PDPA</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ทักษะและสวัสดิการ */}
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <h4 className="text-xs font-bold text-slate-800">ทักษะเฉพาะทางที่ต้องการ:</h4>
                        <div className="flex flex-wrap gap-1">
                          {liveJDResult.preferredSkills.map((skill) => (
                            <span key={skill} className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium px-2 py-0.5 rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <h4 className="text-xs font-bold text-slate-800">สวัสดิการ:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                          {liveJDResult.benefitsTh.map((b) => (
                            <div key={b} className="flex items-center gap-1.5">
                              <span className="text-indigo-500 text-xs">•</span>
                              <span className="text-[11px]">{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {liveJDResult.reviewFlags && liveJDResult.reviewFlags.length > 0 && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
                          <p className="font-bold">⚠️ ข้อที่ต้องให้หน่วยงานยืนยัน:</p>
                          {liveJDResult.reviewFlags.map((flag, i) => <p key={i}>• {flag}</p>)}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Preview ฉบับร่างจากเกณฑ์ที่ตั้งไว้ (ก่อนกดทดสอบ) */}
                      <div className="border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 text-[10px] px-2 py-0">
                            ร่างจากเกณฑ์ที่ตั้งไว้
                          </Badge>
                          <Badge variant="outline" className="text-slate-600 text-[10px] px-2 py-0">
                            ระดับ: {level || '-'}
                          </Badge>
                          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] px-2 py-0">
                            งบประมาณ: ฿{salaryMin.toLocaleString()} - ฿{salaryMax.toLocaleString()}
                          </Badge>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">{titleTh || 'ตั้งชื่อตำแหน่งก่อนเพื่อดูตัวอย่าง'}</h2>
                        <p className="text-xs text-slate-500 font-medium">{titleEn} {department ? `· ${department}` : ''}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-800">หน้าที่ความรับผิดชอบหลัก (Key Responsibilities):</h4>
                        {responsibilities.length > 0 ? (
                          <ul className="space-y-1.5">
                            {responsibilities.map((resp, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                                <span>{resp}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-slate-400">ยังไม่มีข้อมูล — เพิ่มในการ์ดที่ 2 ด้านซ้าย</p>
                        )}
                      </div>

                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <h4 className="text-xs font-bold text-slate-800">ทักษะเฉพาะทางที่ต้องการ:</h4>
                        <div className="flex flex-wrap gap-1">
                          {requiredSkills.map((skill) => (
                            <span key={skill} className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium px-2 py-0.5 rounded-md">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <h4 className="text-xs font-bold text-slate-800">สวัสดิการ:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                          {benefits.map((b) => (
                            <div key={b} className="flex items-center gap-1.5">
                              <span className="text-indigo-500 text-xs">•</span>
                              <span className="text-[11px]">{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-2.5 py-2">
                        💡 กด &quot;ทดสอบให้ AI ร่างตัวอย่าง&quot; เพื่อให้ Claude สร้าง Job Description ครบ 8 หมวดจริง
                      </p>
                    </>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <Button
                      onClick={handleCopyJD}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs gap-1.5 cursor-pointer h-9"
                    >
                      <HugeiconsIcon icon={Copy01Icon} size={14} />
                      {copied ? '✓ คัดลอกเรียบร้อย' : 'คัดลอกข้อความ JD'}
                    </Button>

                    <Button
                      size="sm"
                      onClick={handlePublishVacancy}
                      disabled={!liveJDResult || isPublishing}
                      title={!liveJDResult ? 'กด "ทดสอบให้ AI ร่างตัวอย่าง" ก่อน เพื่อให้มีผลลัพธ์ JD จริงไว้บันทึก' : undefined}
                      className="flex-1 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer h-9 disabled:opacity-50"
                    >
                      <span>{isPublishing ? 'กำลังสร้างตำแหน่งงาน...' : 'เปิดรับสมัครตำแหน่งนี้'}</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </Button>
                  </div>

                  {!liveJDResult && (
                    <p className="text-[11px] text-slate-400 text-center -mt-2">
                      ต้องกด &quot;ทดสอบให้ AI ร่างตัวอย่าง&quot; ให้สำเร็จก่อน จึงจะเปิดรับสมัครตำแหน่งนี้ได้
                    </p>
                  )}

                  {liveJDResult?.modelVersion === 'claude-fallback-v1' && (
                    <p className="text-[11px] font-medium text-amber-700 text-center -mt-2">
                      ⚠️ ผลลัพธ์ด้านบนเป็นเทมเพลตสำรอง (ไม่ใช่ Claude จริง) — แนะนำให้ทดสอบซ้ำให้ได้ผลจริงก่อนเปิดรับสมัคร
                    </p>
                  )}

                  {publishError && (
                    <p className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2.5 py-1.5">{publishError}</p>
                  )}
                </div>
              )}

              {/* แท็บที่ 2: โครงสร้าง Prompt Grounding */}
              {!isSimulatingAI && previewTab === 'prompt' && (
                <div className="space-y-3 text-left">
                  <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
                    <p className="text-slate-400">// --- SPU JD Architect · System Grounding Prompt ---</p>
                    <p className="text-indigo-300 mt-2">You are &quot;SPU JD Architect&quot; for Sripatum University (SPU).</p>
                    <p className="mt-2 text-slate-200">
                      Generate a Job Description covering all 8 standard HR categories:
                    </p>
                    <div className="mt-2 pl-3 border-l-2 border-indigo-500 space-y-1 text-emerald-300">
                      <p>Target Position: &quot;{titleTh}&quot; ({titleEn})</p>
                      <p>Department / Unit: &quot;{department}&quot;</p>
                      <p>Unit Profile: &quot;{unitProfile || 'ไม่ระบุ'}&quot; | Track: &quot;{track || 'ไม่ระบุ'}&quot;</p>
                      <p>Level: &quot;{level}&quot;</p>
                      <p>Minimum Education: &quot;{educationLevel}&quot;</p>
                      <p>Minimum Experience: {minExperienceYears} years</p>
                      <p>Mandatory Responsibilities: {JSON.stringify(responsibilities)}</p>
                      <p>Mandatory Tech Stack: {JSON.stringify(requiredSkills)}</p>
                      <p>Approved Benefits: {JSON.stringify(benefits)}</p>
                      <p>Salary Budget: {salaryMin.toLocaleString()} - {salaryMax.toLocaleString()} THB/month</p>
                      <p className="text-amber-300">Tone &amp; Guidelines: &quot;{aiGuidelines}&quot;</p>
                    </div>
                    <p className="mt-3 text-slate-400">// Output strictly formatted as SPU 8-Category JSON Schema</p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      💡 ทำไมเกณฑ์นี้ถึงสำคัญ?
                    </p>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      เมื่อ HR ไปที่หน้า <strong>&quot;+ เปิดรับตำแหน่งใหม่&quot;</strong> หรือกด <strong>&quot;ร่างใหม่ด้วย AI&quot;</strong> ระบบจะนำ Grounding Prompt ชุดนี้ (รวมถึง JD ที่เคยอนุมัติแล้วในหน่วยงานเดียวกันเป็น Few-shot Reference) ส่งให้ Claude อัตโนมัติ ทำให้ไม่ต้องพิมพ์ Prompt เองซ้ำซ้อน และยังใช้เป็นชุดมาตรฐานในการตรวจคัดกรอง Resume ผู้สมัครอีกด้วย
                    </p>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
