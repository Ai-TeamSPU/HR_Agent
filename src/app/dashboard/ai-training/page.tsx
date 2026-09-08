'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
} from '@hugeicons/core-free-icons';

// --- ประเภทข้อมูลเกณฑ์มาตรฐาน AI ประจำตำแหน่ง (Client-side Data) ---
export interface PositionTrainingProfile {
  id: number;
  title: string;
  titleTh: string;
  department: string;
  level: string;
  educationLevel: string;
  minExperienceYears: number;
  responsibilities: string[];
  requiredSkills: string[];
  aiGuidelines: string;
  benefits: string[];
  isTrained: boolean;
  salaryRange: { min: number; max: number };
  lastTrainedAt?: string;
}

// ข้อมูลเริ่มต้นจำลองตำแหน่งงานจริงของมหาวิทยาลัยศรีปทุม (SPU)
const INITIAL_POSITIONS: PositionTrainingProfile[] = [
  {
    id: 1,
    title: 'Information System Developer',
    titleTh: 'เจ้าหน้าที่พัฒนาระบบสารสนเทศ',
    department: 'สำนักเทคโนโลยีสารสนเทศและการสื่อสาร',
    level: 'ปฏิบัติการ',
    educationLevel: 'ปริญญาตรีขึ้นไป',
    minExperienceYears: 2,
    responsibilities: [
      'พัฒนาและดูแลระบบเว็บแอปพลิเคชันของมหาวิทยาลัยด้วย Next.js, React และ TypeScript',
      'ออกแบบและบริหารจัดการฐานข้อมูล Supabase / PostgreSQL ให้มีเสถียรภาพและความปลอดภัย',
      'เชื่อมโยง API และสถาปัตยกรรมบริการร่วมกับระบบ Digital Hub ขององค์กร',
      'ตรวจสอบและเพิ่มประสิทธิภาพด้านความปลอดภัย (Security & Performance Tuning) ของระบบสารสนเทศ',
    ],
    requiredSkills: ['Next.js', 'TypeScript', 'PostgreSQL', 'TailwindCSS', 'REST API', 'Git'],
    aiGuidelines: 'เน้นสถาปัตยกรรมคลาวด์ ความปลอดภัยของข้อมูลนักศึกษา (PDPA) และการพัฒนาระบบที่รองรับผู้ใช้งานพร้อมกันจำนวนมาก ใช้ภาษาทางการ โทนสร้างสรรค์และสร้างแรงบันดาลใจ สไตล์มหาวิทยาลัยศรีปทุม',
    benefits: [
      'กองทุนสำรองเลี้ยงชีพ',
      'ทุนการศึกษาต่อระดับปริญญาโท-เอก',
      'ประกันสุขภาพกลุ่มและทันตกรรม',
      'ส่วนลดค่าเล่าเรียนบุตร',
      'นโยบายทำงานแบบไฮบริด (Hybrid WFH)',
    ],
    isTrained: true,
    salaryRange: { min: 38000, max: 65000 },
    lastTrainedAt: '2026-09-07 14:30 น.',
  },
  {
    id: 2,
    title: 'Counseling Psychologist',
    titleTh: 'นักจิตวิทยาให้คำปรึกษา',
    department: 'ศูนย์ให้คำปรึกษาสุขภาวะ (กลุ่มงานกิจการนักศึกษา)',
    level: 'ปฏิบัติการ',
    educationLevel: 'ปริญญาตรีขึ้นไป (สาขาจิตวิทยาการปรึกษา/จิตวิทยาคลินิก)',
    minExperienceYears: 1,
    responsibilities: [
      'ให้บริการคำปรึกษาเชิงจิตวิทยารายบุคคลและกลุ่มแก่นักศึกษาและบุคลากร',
      'จัดโครงการและกิจกรรมเชิงรุกเพื่อส่งเสริมสุขภาวะทางจิตและการปรับตัวในรั้วมหาวิทยาลัย',
      'ประเมินคัดกรองภาวะสุขภาพจิต และประสานงานส่งต่อผู้รับบริการกรณีเคสวิกฤติ',
    ],
    requiredSkills: ['Psychological Counseling', 'Crisis Intervention', 'Active Listening', 'Empathy', 'Case Assessment'],
    aiGuidelines: 'ใช้ภาษาที่อบอุ่น อ่อนโยน ให้กำลังใจ สื่อถึงการดูแลเอาใจใส่นักศึกษาอย่างใกล้ชิดและเคารพสิทธิส่วนบุคคลอย่างสูงสุด',
    benefits: [
      'ประกันสุขภาพและประกันอุบัติเหตุ',
      'งบประมาณสนับสนุนการเข้าอบรมและต่อยอดวิชาชีพ',
      'วันหยุดพักผ่อนประจำปี 15 วัน',
      'สิทธิ์การใช้บริการศูนย์สุขภาพและฟิตเนสของมหาวิทยาลัย',
    ],
    isTrained: true,
    salaryRange: { min: 30000, max: 48000 },
    lastTrainedAt: '2026-09-06 11:15 น.',
  },
  {
    id: 3,
    title: 'Lecturer in Computer Science & AI',
    titleTh: 'อาจารย์ประจำสาขาวิทยาการคอมพิวเตอร์และปัญญาประดิษฐ์',
    department: 'คณะเทคโนโลยีสารสนเทศ',
    level: 'วิชาการ',
    educationLevel: 'ปริญญาโท หรือ ปริญญาเอก',
    minExperienceYears: 2,
    responsibilities: [
      'จัดการเรียนการสอนในรายวิชาปัญญาประดิษฐ์ (AI), Machine Learning และ Software Engineering',
      'ทำงานวิจัยและผลิตผลงานวิชาการเพื่อตีพิมพ์ในระดับชาติหรือนานาชาติ (Scopus/TCI)',
      'เป็นที่ปรึกษาโครงงานนวัตกรรมและส่งเสริมให้นักศึกษาเข้าร่วมการแข่งขันระดับประเทศ',
    ],
    requiredSkills: ['Artificial Intelligence', 'Machine Learning', 'Python', 'Deep Learning', 'Curriculum Design', 'Research Methodology'],
    aiGuidelines: 'เน้นคุณสมบัติด้านการสร้างสรรค์งานวิจัยนวัตกรรมใหม่ๆ ความสามารถในการถ่ายทอดความรู้ให้ผู้เรียนคิดเป็นทำได้จริง มุ่งสร้างนักศึกษาที่พร้อมทำงานในอุตสาหกรรมเทคโนโลยีระดับโลก',
    benefits: [
      'เงินสนับสนุนพิเศษสำหรับผลงานวิจัยตีพิมพ์',
      'ทุนสนับสนุนงานวิจัยประจำปี',
      'ประกันสุขภาพกลุ่ม',
      'กองทุนสำรองเลี้ยงชีพ',
    ],
    isTrained: false,
    salaryRange: { min: 45000, max: 80000 },
  },
  {
    id: 4,
    title: 'Financial & Budget Analyst',
    titleTh: 'เจ้าหน้าที่วิเคราะห์การเงินและงบประมาณ',
    department: 'กลุ่มงานการคลัง',
    level: 'ปฏิบัติการ',
    educationLevel: 'ปริญญาตรี (การเงิน, การบัญชี, เศรษฐศาสตร์)',
    minExperienceYears: 1,
    responsibilities: [
      'รวบรวมและวิเคราะห์ข้อมูลแผนงบประมาณรายรับ-รายจ่ายของหน่วยงานต่างๆ ในมหาวิทยาลัย',
      'ติดตามและตรวจสอบการใช้จ่ายงบประมาณให้ถูกต้องตามระเบียบและนโยบายของมหาวิทยาลัย',
      'จัดทำรายงานสรุปสถานะทางการเงินเชิงวิเคราะห์เพื่อเสนอต่อผู้บริหาร',
    ],
    requiredSkills: ['Financial Analysis', 'Budgeting', 'Advanced Excel', 'Financial Modeling', 'Reporting'],
    aiGuidelines: 'เน้นความละเอียดรอบคอบ ความโปร่งใส ตรวจสอบได้ และการมีทักษะคิดวิเคราะห์เชิงตัวเลขอย่างเป็นระบบ',
    benefits: [
      'ประกันสังคมและประกันกลุ่ม',
      'โบนัสประจำปีตามผลการประเมิน',
      'สวัสดิการตรวจสุขภาพประจำปี',
    ],
    isTrained: false,
    salaryRange: { min: 28000, max: 42000 },
  },
  {
    id: 5,
    title: 'Dean of Architecture & Design',
    titleTh: 'คณบดีคณะการออกแบบและสถาปัตยกรรมศาสตร์',
    department: 'คณะการออกแบบและสถาปัตยกรรมศาสตร์',
    level: 'บริหาร',
    educationLevel: 'ปริญญาเอก หรือ ตำแหน่งทางวิชาการ รศ./ศ.',
    minExperienceYears: 5,
    responsibilities: [
      'กำหนดทิศทางเชิงยุทธศาสตร์และการพัฒนาคณะให้สอดคล้องกับมาตรฐานสากลและเทรนด์การออกแบบยุคใหม่',
      'บริหารจัดการหลักสูตร งานวิจัย และเครือข่ายความร่วมมือกับภาคธุรกิจอุตสาหกรรมสร้างสรรค์',
      'กำกับดูแลการบริหารงานบุคคล การเงิน และการพัฒนาศักยภาพอาจารย์และนักศึกษา',
    ],
    requiredSkills: ['Strategic Leadership', 'Academic Administration', 'Design Thinking', 'Partnership Building', 'Creative Vision'],
    aiGuidelines: 'ใช้ภาษาที่สะท้อนถึงวิสัยทัศน์ผู้นำระดับสูง มีความคิดสร้างสรรค์ ทันสมัย และสามารถขับเคลื่อนคณะสู่เวทีระดับนานาชาติ',
    benefits: [
      'ค่าตอบแทนตำแหน่งผู้บริหาร',
      'สิทธิประโยชน์และสวัสดิการระดับผู้บริหารระดับสูง',
      'กองทุนสำรองเลี้ยงชีพในอัตราพิเศษ',
      'งบประมาณพัฒนาวิชาการและศึกษาดูงานต่างประเทศ',
    ],
    isTrained: false,
    salaryRange: { min: 90000, max: 180000 },
  },
];

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

export default function AITrainingPage() {
  const [positions, setPositions] = useState<PositionTrainingProfile[]>(INITIAL_POSITIONS);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'trained' | 'untrained'>('all');

  // Form states ของตำแหน่งที่เลือก
  const currentPosition = useMemo(
    () => positions.find((p) => p.id === selectedId) || positions[0],
    [positions, selectedId]
  );

  const [titleTh, setTitleTh] = useState(currentPosition.titleTh);
  const [department, setDepartment] = useState(currentPosition.department);
  const [level, setLevel] = useState(currentPosition.level);
  const [educationLevel, setEducationLevel] = useState(currentPosition.educationLevel);
  const [minExperienceYears, setMinExperienceYears] = useState(currentPosition.minExperienceYears);
  const [responsibilities, setResponsibilities] = useState<string[]>(currentPosition.responsibilities);
  const [newRespInput, setNewRespInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(currentPosition.requiredSkills);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [aiGuidelines, setAiGuidelines] = useState(currentPosition.aiGuidelines);
  const [benefits, setBenefits] = useState<string[]>(currentPosition.benefits);
  const [newBenefitInput, setNewBenefitInput] = useState('');

  // UI Interactive States
  const [isSimulatingAI, setIsSimulatingAI] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [testRunCompleted, setTestRunCompleted] = useState(true);
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewTab, setPreviewTab] = useState<'preview' | 'prompt'>('preview');

  // Sync state เมื่อเลือกตำแหน่งใหม่
  useEffect(() => {
    setTitleTh(currentPosition.titleTh);
    setDepartment(currentPosition.department);
    setLevel(currentPosition.level);
    setEducationLevel(currentPosition.educationLevel);
    setMinExperienceYears(currentPosition.minExperienceYears);
    setResponsibilities(currentPosition.responsibilities);
    setRequiredSkills(currentPosition.requiredSkills);
    setAiGuidelines(currentPosition.aiGuidelines);
    setBenefits(currentPosition.benefits);
    setTestRunCompleted(currentPosition.isTrained);
  }, [currentPosition]);

  // กรองตำแหน่งงาน
  const filteredPositions = useMemo(() => {
    return positions.filter((p) => {
      const matchSearch =
        p.titleTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.department.toLowerCase().includes(searchQuery.toLowerCase());

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

  // จำลองการทดสอบรัน AI (Live Test Run Simulation)
  const handleRunAITest = () => {
    setIsSimulatingAI(true);
    setSimulationStep(1);

    setTimeout(() => {
      setSimulationStep(2);
    }, 700);

    setTimeout(() => {
      setSimulationStep(3);
    }, 1500);

    setTimeout(() => {
      setIsSimulatingAI(false);
      setTestRunCompleted(true);
    }, 2200);
  };

  // บันทึกเกณฑ์มาตรฐาน (Client State + LocalStorage)
  const handleSaveTraining = () => {
    const updated = positions.map((p) => {
      if (p.id === currentPosition.id) {
        return {
          ...p,
          titleTh,
          department,
          level,
          educationLevel,
          minExperienceYears,
          responsibilities,
          requiredSkills,
          aiGuidelines,
          benefits,
          isTrained: true,
          lastTrainedAt: 'เพิ่งอัปเดตเมื่อสักครู่',
        };
      }
      return p;
    });

    setPositions(updated);
    setSaveToastVisible(true);
    setTimeout(() => setSaveToastVisible(false), 3500);
  };

  // คืนค่าเริ่มต้น
  const handleReset = () => {
    const original = INITIAL_POSITIONS.find((p) => p.id === currentPosition.id);
    if (original) {
      setTitleTh(original.titleTh);
      setDepartment(original.department);
      setLevel(original.level);
      setEducationLevel(original.educationLevel);
      setMinExperienceYears(original.minExperienceYears);
      setResponsibilities(original.responsibilities);
      setRequiredSkills(original.requiredSkills);
      setAiGuidelines(original.aiGuidelines);
      setBenefits(original.benefits);
    }
  };

  // คัดลอกข้อความ JD
  const handleCopyJD = () => {
    const jdText = `
ตำแหน่ง: ${titleTh} (${currentPosition.title})
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

    navigator.clipboard.writeText(jdText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // สถิติภาพรวม
  const trainedCount = positions.filter((p) => p.isTrained).length;
  const trainedPercent = Math.round((trainedCount / positions.length) * 100);

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
            <p className="text-xs text-emerald-100">ตำแหน่งงานนี้พร้อมใช้สำหรับให้ Gemini 3.8 Flash ร่าง JD อัตโนมัติแล้ว</p>
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
              <span className="text-emerald-300 font-semibold">Gemini 3.8 Flash Ready</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              🧠 เทรน AI ประจำตำแหน่งงาน
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              กำหนดเกณฑ์มาตรฐาน ทักษะ และคำสั่งกำกับพิเศษ (Custom Prompt Guidelines) ให้กับ AI 
              เพื่อให้การร่าง Job Description และการคัดกรองผู้สมัครสอดคล้องกับอัตลักษณ์ของมหาวิทยาลัยศรีปทุม (SPU) 100%
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
                    เลือกจากมาตรฐานตำแหน่งงานในระบบเพื่อกำหนดหรือปรับปรุงเกณฑ์ AI
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
              {/* Search Bar */}
              <div className="relative">
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

              {/* Positions List Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredPositions.map((pos) => {
                  const isSelected = pos.id === currentPosition.id;
                  return (
                    <div
                      key={pos.id}
                      onClick={() => setSelectedId(pos.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-bold leading-snug line-clamp-1 ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                          {pos.titleTh}
                        </p>
                        {pos.isTrained ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none text-[10px] px-1.5 py-0">
                            ✓ เทรนแล้ว
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px] px-1.5 py-0">
                            รอเทรน
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{pos.department}</p>
                    </div>
                  );
                })}
              </div>

              {/* Active Position Info Summary Card */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    SPU
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-indigo-950">{titleTh}</h3>
                    <p className="text-[11px] text-indigo-700">{department} • ระดับ: {level}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-500">สถานะ AI:</span>
                  {currentPosition.isTrained ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} />
                      พร้อมใช้งาน ({currentPosition.lastTrainedAt})
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      ⚠️ ยังไม่มีเกณฑ์มาตรฐานเฉพาะ
                    </span>
                  )}
                </div>
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
                    กำหนดบุคลิก โทนภาษา และจุดเน้นย้ำเฉพาะตำแหน่งให้ Google Gemini
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
                disabled={isSimulatingAI}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer h-10 px-4"
              >
                <HugeiconsIcon icon={FlashIcon} size={15} />
                {isSimulatingAI ? 'กำลังประมวลผลผ่าน Gemini...' : '⚡ ทดสอบให้ AI ร่างตัวอย่าง (Live Test Run)'}
              </Button>

              <Button
                onClick={handleSaveTraining}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer h-10 px-5"
              >
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                บันทึกเกณฑ์มาตรฐาน
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
                      ขับเคลื่อนโดย Google Gemini 3.8 Flash (Grounding Mode)
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
                      {simulationStep === 2 && '2/3 สังเคราะห์ Prompt Grounding ตามมาตรฐาน SPU...'}
                      {simulationStep === 3 && '3/3 Gemini 3.8 Flash กำลังเรียบเรียง Job Description...'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">ประมวลผลด้วยอัตลักษณ์มหาวิทยาลัยศรีปทุม</p>
                  </div>
                </div>
              )}

              {/* แท็บที่ 1: ผลลัพธ์ Job Description */}
              {!isSimulatingAI && previewTab === 'preview' && (
                <div className="space-y-4 text-left">
                  {/* Title & Department Header */}
                  <div className="border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 text-[10px] px-2 py-0">
                        {department}
                      </Badge>
                      <Badge variant="outline" className="text-slate-600 text-[10px] px-2 py-0">
                        ระดับ: {level}
                      </Badge>
                      <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] px-2 py-0">
                        งบประมาณ: ฿{currentPosition.salaryRange.min.toLocaleString()} - ฿{currentPosition.salaryRange.max.toLocaleString()}
                      </Badge>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">{titleTh}</h2>
                    <p className="text-xs text-slate-500 font-medium">{currentPosition.title}</p>
                  </div>

                  {/* ภาพรวมตำแหน่งงาน (Summary) */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <HugeiconsIcon icon={SparklesIcon} size={14} className="text-amber-500" />
                      บทสรุปตำแหน่งงาน (Role Summary by Gemini)
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      เปิดรับสมัครผู้เชี่ยวชาญในตำแหน่ง <strong>{titleTh}</strong> เพื่อร่วมขับเคลื่อนภารกิจนวัตกรรมและการศึกษาของมหาวิทยาลัยศรีปทุม โดยมุ่งเน้นการใช้เทคโนโลยีที่ทันสมัยและความเป็นมืออาชีพในการยกระดับมาตรฐานขององค์กร
                    </p>
                  </div>

                  {/* หน้าที่ความรับผิดชอบ */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800">
                      หน้าที่ความรับผิดชอบหลัก (Key Responsibilities):
                    </h4>
                    <ul className="space-y-1.5">
                      {responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* คุณสมบัติที่ต้องการ */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <h4 className="text-xs font-bold text-slate-800">
                      คุณสมบัติผู้สมัคร (Qualifications):
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>วุฒิการศึกษา: <strong>{educationLevel}</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span>ประสบการณ์ทำงาน: อย่างน้อย <strong>{minExperienceYears} ปี</strong> ในสายงานที่เกี่ยวข้อง</span>
                      </li>
                      {aiGuidelines && (
                        <li className="flex items-start gap-2 bg-amber-50/70 p-2 rounded-md border border-amber-200/60 text-amber-900 text-[11px] leading-relaxed">
                          <span className="font-bold shrink-0">คำสั่งกำกับพิเศษ:</span>
                          <span>{aiGuidelines}</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* ทักษะและเครื่องมือ */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <h4 className="text-xs font-bold text-slate-800">
                      ทักษะเฉพาะทางที่ต้องการ (Skills & Tech Stack):
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium px-2 py-0.5 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* สวัสดิการ */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <h4 className="text-xs font-bold text-slate-800">
                      สวัสดิการ (Perks & Benefits):
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                      {benefits.map((b) => (
                        <div key={b} className="flex items-center gap-1.5">
                          <span className="text-indigo-500 text-xs">•</span>
                          <span className="text-[11px]">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

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

                    <Link href="/dashboard/vacancies" className="flex-1">
                      <Button
                        size="sm"
                        className="w-full text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer h-9"
                      >
                        <span>เปิดรับสมัครตำแหน่งนี้</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* แท็บที่ 2: โครงสร้าง Prompt Grounding */}
              {!isSimulatingAI && previewTab === 'prompt' && (
                <div className="space-y-3 text-left">
                  <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
                    <p className="text-slate-400">// --- System Grounding Prompt for Gemini 3.8 Flash ---</p>
                    <p className="text-indigo-300 mt-2">You are an expert HR AI Recruitment Agent for Sripatum University (SPU).</p>
                    <p className="mt-2 text-slate-200">
                      Generate an enterprise Job Description adhering strictly to organizational standards:
                    </p>
                    <div className="mt-2 pl-3 border-l-2 border-indigo-500 space-y-1 text-emerald-300">
                      <p>Target Position: &quot;{titleTh}&quot; ({currentPosition.title})</p>
                      <p>Department: &quot;{department}&quot;</p>
                      <p>Level: &quot;{level}&quot;</p>
                      <p>Minimum Education: &quot;{educationLevel}&quot;</p>
                      <p>Minimum Experience: {minExperienceYears} years</p>
                      <p>Mandatory Responsibilities: {JSON.stringify(responsibilities)}</p>
                      <p>Mandatory Tech Stack: {JSON.stringify(requiredSkills)}</p>
                      <p>Approved Benefits: {JSON.stringify(benefits)}</p>
                      <p className="text-amber-300">Tone &amp; Guidelines: &quot;{aiGuidelines}&quot;</p>
                    </div>
                    <p className="mt-3 text-slate-400">// Output strictly formatted in SPU Standard JSON</p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      💡 ทำไมเกณฑ์นี้ถึงสำคัญ?
                    </p>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      เมื่อ HR ไปที่หน้า <strong>&quot;+ เปิดรับตำแหน่งใหม่&quot;</strong> หรือกด <strong>&quot;ร่างใหม่ด้วย AI&quot;</strong> ระบบจะนำ Grounding Prompt ชุดนี้ส่งให้ Gemini อัตโนมัติ ทำให้ไม่ต้องพิมพ์ Prompt เองซ้ำซ้อน และยังใช้เป็นชุดมาตรฐานในการตรวจคัดกรอง Resume ผู้สมัครอีกด้วย
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
