// i18n — Simple internationalization system

import { type Locale } from '@/lib/types';
export type { Locale };

export const translations = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', th: 'Dashboard' },
  'nav.personnel': { en: 'Personnel Management', th: 'Personnel Management' },
  'nav.vacancies': { en: 'Job Positions', th: 'ตำแหน่งงาน' },
  'nav.candidates': { en: 'Candidate', th: 'ผู้สมัคร' },
  'nav.applications': { en: 'Applications', th: 'ใบสมัคร' },
  'nav.interviews': { en: 'Interviews', th: 'การสัมภาษณ์' },
  'nav.aiAgent': { en: 'AI Agent', th: 'AI Agent' },
  'nav.settings': { en: 'Settings', th: 'ตั้งค่า' },
  'nav.jobs': { en: 'Job Openings', th: 'ตำแหน่งงาน' },
  'nav.myApplications': { en: 'My Applications', th: 'ใบสมัครของฉัน' },
  'nav.myInterviews': { en: 'My Interviews', th: 'การสัมภาษณ์ของฉัน' },
  'nav.logout': { en: 'Logout', th: 'ออกจากระบบ' },

  // Dashboard
  'dashboard.title': { en: 'HR Dashboard', th: 'HR Dashboard' },

  'dashboard.openVacancies': { en: 'Open Positions', th: 'ตำแหน่งงานเปิดรับ' },
  'dashboard.activeCandidates': { en: 'Active Candidates', th: 'ผู้สมัครที่กำลังดำเนินการ' },
  'dashboard.pendingReviews': { en: 'Pending Reviews', th: 'รอตรวจสอบ' },
  'dashboard.interviewsToday': { en: 'Interviews Today', th: 'สัมภาษณ์วันนี้' },
  'dashboard.recruitmentPipeline': { en: 'Recruitment Pipeline', th: 'สถานะการสรรหา' },
  'dashboard.recentActivity': { en: 'Recent Activity', th: 'กิจกรรมล่าสุด' },
  'dashboard.aiRecommendations': { en: 'AI Recommendations', th: 'คำแนะนำจาก AI' },
  'dashboard.welcome': { en: 'Welcome back', th: 'ยินดีต้อนรับกลับ' },

  // Vacancy
  'vacancy.title': { en: 'Job Positions', th: 'ตำแหน่งงาน' },
  'vacancy.create': { en: 'Create Position', th: 'สร้างตำแหน่งงานใหม่' },

  'vacancy.department': { en: 'Department', th: 'แผนก' },
  'vacancy.priority': { en: 'Priority', th: 'ความสำคัญ' },
  'vacancy.headcount': { en: 'Headcount', th: 'จำนวนที่รับ' },
  'vacancy.applications': { en: 'Applications', th: 'ใบสมัคร' },
  'vacancy.status': { en: 'Status', th: 'สถานะ' },
  'vacancy.generateJD': { en: 'Generate JD with AI', th: 'สร้าง JD ด้วย AI' },
  'vacancy.approveJD': { en: 'Approve JD', th: 'อนุมัติ JD' },
  'vacancy.publish': { en: 'Publish', th: 'เผยแพร่' },
  'vacancy.jobDescription': { en: 'Job Description', th: 'รายละเอียดงาน' },

  // Candidate
  'candidate.title': { en: 'Candidates', th: 'ผู้สมัคร (Candidates)' },

  'candidate.name': { en: 'Name', th: 'ชื่อ' },
  'candidate.email': { en: 'Email', th: 'อีเมล' },
  'candidate.phone': { en: 'Phone', th: 'โทรศัพท์' },
  'candidate.experience': { en: 'Experience', th: 'ประสบการณ์' },
  'candidate.skills': { en: 'Skills', th: 'ทักษะ' },
  'candidate.matchScore': { en: 'Match Score', th: 'คะแนนจับคู่' },
  'candidate.resume': { en: 'Resume', th: 'เรซูเม่' },
  'candidate.profile': { en: 'Profile', th: 'โปรไฟล์' },
  'candidate.source': { en: 'Source', th: 'แหล่งที่มา' },

  // Application
  'application.title': { en: 'Applications', th: 'ใบสมัคร' },
  'application.shortlist': { en: 'Shortlist', th: 'คัดเลือก' },
  'application.reject': { en: 'Reject', th: 'ไม่ผ่าน' },
  'application.hold': { en: 'Hold', th: 'รอพิจารณา' },
  'application.inviteInterview': { en: 'Invite Interview', th: 'เชิญสัมภาษณ์' },
  'application.assignDLTest': { en: 'Assign DL Test', th: 'มอบหมาย DL Test' },
  'application.makeOffer': { en: 'Make Offer', th: 'เสนอตำแหน่ง' },
  'application.timeline': { en: 'Timeline', th: 'ไทม์ไลน์' },
  'application.aiAnalysis': { en: 'AI Analysis', th: 'ผลวิเคราะห์ AI' },

  // Interview
  'interview.title': { en: 'Interviews', th: 'การสัมภาษณ์' },
  'interview.schedule': { en: 'Schedule Interview', th: 'นัดสัมภาษณ์' },
  'interview.feedback': { en: 'Feedback', th: 'ความเห็น' },
  'interview.upcoming': { en: 'Upcoming', th: 'ที่จะมาถึง' },
  'interview.past': { en: 'Past', th: 'ที่ผ่านมา' },

  // AI Agent
  'ai.title': { en: 'AI Agent Console', th: 'ศูนย์ควบคุม AI Agent' },
  'ai.jdGenerator': { en: 'JD Generator', th: 'สร้าง JD' },
  'ai.candidateMatcher': { en: 'Candidate Matcher', th: 'จับคู่ผู้สมัคร' },
  'ai.recommendations': { en: 'Recommendations', th: 'คำแนะนำ' },
  'ai.history': { en: 'AI History', th: 'ประวัติ AI' },
  'ai.generating': { en: 'AI is generating...', th: 'AI กำลังประมวลผล...' },

  // Common
  'common.search': { en: 'Search', th: 'ค้นหา' },
  'common.filter': { en: 'Filter', th: 'กรอง' },
  'common.save': { en: 'Save', th: 'บันทึก' },
  'common.cancel': { en: 'Cancel', th: 'ยกเลิก' },
  'common.confirm': { en: 'Confirm', th: 'ยืนยัน' },
  'common.delete': { en: 'Delete', th: 'ลบ' },
  'common.edit': { en: 'Edit', th: 'แก้ไข' },
  'common.view': { en: 'View', th: 'ดูรายละเอียด' },
  'common.back': { en: 'Back', th: 'กลับ' },
  'common.next': { en: 'Next', th: 'ถัดไป' },
  'common.previous': { en: 'Previous', th: 'ก่อนหน้า' },
  'common.all': { en: 'All', th: 'ทั้งหมด' },
  'common.noData': { en: 'No data available', th: 'ไม่มีข้อมูล' },
  'common.loading': { en: 'Loading...', th: 'กำลังโหลด...' },
  'common.years': { en: 'years', th: 'ปี' },
  'common.apply': { en: 'Apply Now', th: 'สมัครเลย' },

  // Login
  'login.title': { en: 'Sign In', th: 'เข้าสู่ระบบ' },
  'login.subtitle': { en: 'HR AI Agent System', th: 'ระบบ HR AI Agent' },
  'login.email': { en: 'Email', th: 'อีเมล' },
  'login.password': { en: 'Password', th: 'รหัสผ่าน' },
  'login.signIn': { en: 'Sign In', th: 'เข้าสู่ระบบ' },
  'login.hrPortal': { en: 'HR Portal', th: 'ระบบ HR' },
  'login.candidatePortal': { en: 'Candidate Portal', th: 'ระบบผู้สมัคร' },

  // Jobs (Public)
  'jobs.title': { en: 'Career Opportunities', th: 'ตำแหน่งงานที่เปิดรับ' },
  'jobs.subtitle': { en: 'Find your next career move', th: 'ค้นหาโอกาสใหม่ในอาชีพของคุณ' },
  'jobs.searchPlaceholder': { en: 'Search positions...', th: 'ค้นหาตำแหน่ง...' },
  'jobs.location': { en: 'Location', th: 'สถานที่' },
  'jobs.type': { en: 'Employment Type', th: 'ประเภทงาน' },
  'jobs.fullTime': { en: 'Full-time', th: 'เต็มเวลา' },
  'jobs.applyNow': { en: 'Apply Now', th: 'สมัครเลย' },
  'jobs.viewDetails': { en: 'View Details', th: 'ดูรายละเอียด' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  const translation = translations[key];
  if (!translation) return key;
  return translation[locale] || translation.en;
}

export function getLocaleLabel(locale: Locale): string {
  return locale === 'th' ? 'ไทย' : 'EN';
}
