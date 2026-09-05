# 🤖 HR AI Agent — Complete Autonomous Recruitment & HR Automation Platform

> ระบบ HR AI Agent อัจฉริยะแบบครบวงจรสำหรับการบริหารจัดการกระบวนการสรรหาบุคลากร (End-to-End Recruitment Automation) ขับเคลื่อนด้วย **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Google Gemini AI**, และ **Supabase Database**

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
d:\Agent\
├── hr-ai-agent/                               # โฟลเดอร์ซอร์สโค้ดหลักของ Web Application (Next.js)
│   ├── src/
│   │   ├── app/                              # App Router Pages
│   │   │   ├── apply/[jobId]/                # หน้ากรอกใบสมัครของผู้สมัครภายนอก (Candidate Application Portal)
│   │   │   ├── candidate/dashboard/          # แดชบอร์ดติดตามสถานะของผู้สมัคร
│   │   │   ├── dashboard/                    # HR Management Dashboard
│   │   │   │   ├── ai-agent/                 # ระบบ AI Agent สร้าง JD & วิเคราะห์จับคู่ผู้สมัคร
│   │   │   │   ├── applications/             # รายการใบสมัครและการคัดกรอง
│   │   │   │   ├── candidates/               # ฐานข้อมูลผู้สมัคร (Candidate Pool)
│   │   │   │   ├── interviews/               # ปฏิทินและระบบจัดการนัดสัมภาษณ์
│   │   │   │   └── vacancies/                # ระบบเปิดรับตำแหน่งงานและอนุมัติ JD
│   │   │   ├── jobs/                         # Career Portal หน้าประกาศรับสมัครงานสาธารณะ
│   │   │   └── login/                        # หน้าระบบเข้าสู่ระบบสำหรับ HR
│   │   ├── components/ui/                    # Reusable UI Components
│   │   ├── lib/                              # Supabase Client, Types, Mock Data
│   │   ├── pageback/services/                # Backend / Service Layer & Gemini AI Integration
│   │   └── pagefront/                        # Frontend Components, Layouts, Providers
│   ├── package.json
│   └── tsconfig.json
├── CURRENT_DATA_STATE.md                     # เอกสารอธิบายสถานะข้อมูลในระบบ
├── DATABASE_SCHEMA_EXPLANATION.md            # เอกสารอธิบายโครงสร้าง Table และความสัมพันธ์ใน Database
├── DATA_SOURCE_EXPLANATION.md                # เอกสารอธิบายแหล่งที่มาและการเชื่อมต่อข้อมูล
├── HR_AI_AGENT_CONVERSATION_HISTORY.md       # ประวัติการสนทนาและการพัฒนาทั้งหมด (Full Conversation Transcript)
├── HR_AI_AGENT_STATUS.md                     # สรุปสถานะฟังก์ชันและภาพรวมระบบ
├── HR_AI_Agent_Website_System_Blueprint.md   # ผังการออกแบบระบบและข้อกำหนดทางเทคนิค (System Blueprint)
├── LOGIN_ACCOUNTS.md                         # ข้อมูลบัญชีผู้ใช้งานสำหรับทดสอบและเข้าสู่ระบบ HR
├── supabase-auth-update.sql                  # SQL Script สำหรับตารางผู้ใช้งานและ Authentication
├── supabase-notifications-setup.sql          # SQL Script สำหรับระบบ Real-time Notifications
├── supabase-schema.sql                       # SQL Schema ทั้งหมดของระบบ HR AI Agent
├── supabase-seed.sql                         # ข้อมูลตั้งต้น (Seed Data)
└── supabase-skills-update.sql                # SQL Script สำหรับการรองรับ Candidate Skills & GIN Index
```

---

## 🚀 เทคโนโลยีหลักที่ใช้ (Tech Stack)

* **Frontend & Framework:** Next.js 16 (App Router), React 19, TypeScript
* **Styling & Design System:** Tailwind CSS, Radix UI Primitives, Lucide Icons, Glassmorphism, Dual Theme
* **AI & LLM Engine:** Google Gemini (Gemini 1.5 Flash / Gemini 2.0 / Gemini 3.6)
* **Database & Auth:** Supabase PostgreSQL Database, Row-Level Security, JSONB Data Type, GIN Indexing
* **Internationalization:** Multi-language Support (ภาษาไทย / English)

---

## 🛠️ วิธีการรันโปรเจกต์ (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
cd hr-ai-agent
npm install
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` ในโฟลเดอร์ `hr-ai-agent/` โดยดูตัวอย่างจาก `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### 3. รัน Development Server
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่: [http://localhost:3000](http://localhost:3000)

---

## 📄 ข้อมูลบัญชีสำหรับเข้าสู่ระบบ HR (Login Accounts)
| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) |
| :--- | :--- | :--- |
| **HR Admin** | `admin@company.com` | `admin1234` |
| **HR Recruiter** | `recruiter@company.com` | `admin1234` |
| **Hiring Manager** | `manager@company.com` | `admin1234` |
