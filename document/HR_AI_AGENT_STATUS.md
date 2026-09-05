# 📋 HR AI Agent — คู่มือขั้นตอนถัดไป & สถานะระบบ

> **อัปเดตล่าสุด:** 18 สิงหาคม 2569  
> **สถานะ Supabase:** เชื่อมต่อเรียบร้อยแล้ว (`.env.local` + `@supabase/supabase-js` + `src/lib/supabase.ts`)

---

## 🎯 สิ่งที่คุณต้องทำตอนนี้ (Step-by-Step)

### ขั้นตอนที่ 1: รัน Schema & ข้อมูลเริ่มต้นใน Supabase (ใช้เวลา 1 นาที)
1. เปิดเบราว์เซอร์ไปที่ [Supabase SQL Editor](https://supabase.com/dashboard/project/kvvbkiasrnppxvopezin/sql)
2. **รันไฟล์ที่ 1:** เปิดไฟล์ [`supabase-schema.sql`](file:///d:/Agent/hr-ai-agent/supabase-schema.sql) คัดลอกโค้ดทั้งหมดแล้ววางใน SQL Editor แล้วกด **Run**
   - *เพื่อสร้าง 12 ตารางฐานข้อมูลหลัก + ดัชนีความเร็ว (Indexes)*
3. **รันไฟล์ที่ 2:** เปิดไฟล์ [`supabase-seed.sql`](file:///d:/Agent/hr-ai-agent/supabase-seed.sql) คัดลอกโค้ดแล้ววางใน SQL Editor แล้วกด **Run**
   - *เพื่อใส่ข้อมูลจำลอง (ตำแหน่งงาน, ผู้สมัคร, ใบสมัคร) สำหรับทดสอบระบบ*

---

### ขั้นตอนที่ 2: รันและทดสอบระบบบนเครื่องของคุณ
เปิด Terminal หรือ Command Prompt แล้วรันคำสั่ง:

```bash
# 1. เข้าสู่โฟลเดอร์โปรเจค
cd d:\Agent\hr-ai-agent

# 2. เริ่มรัน Development Server
npm run dev
```

เปิดเว็บเบราว์เซอร์ที่: **`http://localhost:3000`**

---

## 🌐 ลิงก์หน้าต่างๆ ในระบบที่พร้อมใช้งานทันที

| เส้นทาง (URL) | บทบาท | รายละเอียดหน้า |
|---------------|-------|----------------|
| **`/login`** | ทุกคน | หน้าเข้าสู่ระบบ (เลือกระหว่าง HR Portal และ Candidate Portal ได้ทันที) |
| **`/dashboard`** | HR Admin | Dashboard สรุปภาพรวม KPI, Recruitment Pipeline, AI Recommendations |
| **`/dashboard/vacancies`** | HR Admin | รายการตำแหน่งงานทั้งหมด พร้อมตัวกรองสถานะและฟังก์ชันสร้าง Job Description |
| **`/dashboard/candidates`** | HR Admin | รายการผู้สมัครทั้งหมด, ข้อมูลทักษะ, คะแนนความเหมาะสม (Match Score) |
| **`/dashboard/applications`** | HR Admin | รายการใบสมัครงาน และการเปลี่ยนสถานะตาม Workflow ขั้นตอนสรรหา |
| **`/dashboard/interviews`** | HR Admin | ปฏิทินและรายการนัดหมายสัมภาษณ์ (Upcoming / Past Interviews) |
| **`/dashboard/ai-agent`** | HR Admin | คอนโซล AI สำหรับสร้าง JD อัตโนมัติ และทดสอบจับคู่ผู้สมัครกับตำแหน่ง |
| **`/jobs`** | ผู้สมัคร | หน้าประกาศรับสมัครงานสาธารณะ สวยงาม พร้อมระบบค้นหาและกรองแผนก |
| **`/jobs/[id]`** | ผู้สมัคร | หน้ารายละเอียดงาน พร้อมอัตราเงินเดือน, คุณสมบัติ และปุ่ม "สมัครงาน" |
| **`/apply/[jobId]`** | ผู้สมัคร | ฟอร์มสมัครงาน 3 ขั้นตอน (ข้อมูลส่วนตัว -> ประสบการณ์ -> แนบเอกสาร) |
| **`/candidate/dashboard`** | ผู้สมัคร | หน้าติดตามสถานะใบสมัครของผู้สมัคร และรายการสัมภาษณ์ที่นัดหมายไว้ |

---

## 🛠️ สรุปสิ่งที่ระบบเตรียมไว้ให้แล้ว

| หัวข้อ | สถานะ | รายละเอียด |
|-------|-------|----------|
| **AI Intelligence Engine** | 🟢 เชื่อมต่อแล้ว (Google Gemini 1.5 Flash) | AI วิเคราะห์ JD และจับคู่ผู้สมัคร (Candidate Matching) สดด้วย Gemini Live API |
| **Supabase Database** | 🟢 เชื่อมต่อแล้ว (Live DB) | `src/pageback/services/supabase-service.ts` ดึง/บันทึกข้อมูลสดลง Supabase 12 ตาราง |
| **Data Types (ID)** | 🟢 BIGINT Integer ID (`1, 2, 3...`) | สะดวกและเข้าใจง่ายสำหรับ Admin |
| **Theme / Design** | 🟢 Modern Emerald Light | สว่างสดใส สะอาดตา โทนสีเขียวมรกต |

```
hr-ai-agent/
├── .env.local                    # ตั้งค่า Supabase URL และ Key เรียบร้อย
├── supabase-schema.sql           # โครงสร้างฐานข้อมูล 12 ตาราง
├── supabase-seed.sql             # ข้อมูลตัวอย่างสำหรับรันใน Supabase
├── src/
│   ├── pagefront/                # 🎨 ฝั่ง Frontend (แยกตามโครงสร้างที่คุณต้องการ)
│   │   ├── components/           # KPICard, MatchScoreRadial, StateBadge, Timeline
│   │   ├── layout/               # Sidebar, Header
│   │   └── providers/            # LocaleProvider (ระบบ 2 ภาษา ไทย/อังกฤษ)
│   ├── pageback/                 # ⚙️ ฝั่ง Backend (แยกตามโครงสร้างที่คุณต้องการ)
│   │   └── services/
│   │       ├── vacancy-service.ts       # จัดการสถานะ Vacancy State Machine
│   │       ├── application-service.ts   # จัดการกระบวนการ Application Pipeline
│   │       ├── ai-service.ts            # AI Generator & Matching logic
│   │       ├── dl-test-service.ts       # DL Test Integration Service
│   │       └── supabase-service.ts      # Supabase DB Query & Insert Service
│   ├── lib/
│   │   ├── types/                # TypeScript Types ครบถ้วน
│   │   ├── mock-data/            # Mock Datasets สำหรับทดสอบ
│   │   ├── i18n.ts               # ระบบสลับภาษา ไทย / อังกฤษ
│   │   └── supabase.ts           # Supabase Client Instance
│   └── app/                      # Next.js App Router (12 Pages)
```

---

## 🔮 ข้อมูลสำหรับขั้นตอนต่อไป (Next Requirements)

เมื่อคุณพร้อมต่อยอดในขั้นตอนถัดไป สามารถแจ้งข้อมูลเพิ่มเติมดังนี้ได้เลยครับ:
1. **ระบบ DL Test**: หากมี API Endpoint หรือรูปแบบการเชื่อมต่อของระบบ DL Test ส่งมาให้ต่อได้เลยครับ
2. **AI Provider**: หากต้องการต่อ LLM API จริง เช่น Google Gemini API (`GEMINI_API_KEY`) สามารถแจ้งได้ครับ
