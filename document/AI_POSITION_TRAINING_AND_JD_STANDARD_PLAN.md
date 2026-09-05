# แผนกลยุทธ์และการออกแบบระบบ: เทรน AI สำหรับร่าง Job Description ประจำตำแหน่งงาน (AI Position Training & JD Standards)

เอกสารฉบับนี้จัดทำขึ้นเพื่อสรุปแนวทางการพัฒนาระบบ **"เทรน AI สำหรับร่าง Job Description ให้ตรงตามความต้องการของแต่ละตำแหน่งงาน"** จากฐานข้อมูลตาราง `positions` ในระบบ HR AI Agent

---

## 🎯 1. ภาพรวมและเหตุผลที่แนวคิดนี้ดีที่สุด (Concept & Benefits)

### ปัญหาในปัจจุบัน (The Current Limitation)
ปัจจุบันการให้ AI ร่าง Job Description (JD) นั้น AI จะได้รับข้อมูลเพียง **"ชื่อตำแหน่งงาน (Job Title)"** และ **"ชื่อแผนก/สังกัด (Department)"** เท่านั้น ทำให้ AI ต้องคาดเดาขอบเขตงานเอง ส่งผลให้เนื้อหาที่ได้เป็นข้อความแบบทั่วไป (Generic) ไม่เจาะจงกับบริบทหรือมาตรฐานเฉพาะขององค์กร/มหาวิทยาลัย

### ทางออกที่ตอบโจทย์ระดับ Enterprise (Best Practice Solution)
การสร้างหน้า **"กำหนดมาตรฐานตำแหน่งงานเพื่อเทรน AI (Job Standard & AI Knowledge Base)"**:
1. **ดึงตำแหน่งงานจริง**: HR เลือกตำแหน่งงานที่มีอยู่แล้วในฐานข้อมูลตาราง `positions` ผ่าน Dropdown
2. **ป้อนบริบทและเกณฑ์มาตรฐาน**: HR กำหนดหน้าที่ความรับผิดชอบหลัก, คุณสมบัติเฉพาะทาง, ทักษะที่จำเป็น (Skills Tags), ระดับวุฒิการศึกษา และแนวทางการเขียนที่ต้องการ
3. **Prompt Grounding เมื่อใช้งานจริง**: เมื่อมีผู้ใช้กดปุ่ม `+ เปิดรับตำแหน่งใหม่ (ร่าง JD ด้วย AI)` ระบบจะดึงข้อมูลเกณฑ์มาตรฐานประจำตำแหน่งนี้ไปป้อนเป็นบริบทอ้างอิงให้ **Google Gemini 3.8 Flash** ทันที
4. **ผลลัพธ์ที่ได้**: JD ที่ AI สร้างออกมาจะ**ตรงตามมาตรฐานของตำแหน่งงานนั้น 100% คมชัด ตรงเป้า และแทบไม่ต้องเสียเวลาแก้ไขซ้ำ**

---

## 🗄️ 2. สิ่งที่ควรเพิ่มใน Database (ตาราง `positions`)

ในระบบฐานข้อมูล Supabase ปัจจุบัน ตาราง `positions` มีคอลัมน์พื้นฐานอยู่แล้ว (`title`, `department`, `responsibilities`, `qualifications`, `level`, `base_salary_min`, `base_salary_max`) 

เพื่อให้สามารถรองรับการเทรนและกำกับ AI ได้อย่างเต็มประสิทธิภาพ แนะนำให้เพิ่มคอลัมน์ดังต่อไปนี้:

| คอลัมน์ที่เพิ่ม | ชนิดข้อมูล (Type) | คำอธิบายและวัตถุประสงค์การใช้งาน |
| :--- | :--- | :--- |
| `required_skills` | `JSONB` | เก็บแท็กทักษะเฉพาะทางที่ตำแหน่งนี้ต้องมี เช่น `["React", "TypeScript", "การสอนอุดมศึกษา", "งานวิจัย"]` เพื่อให้ AI ดึงไปบรรจุใน JD เสมอ |
| `ai_guidelines` | `TEXT` | ข้อกำหนดหรือคำสั่งพิเศษสำหรับกำกับ AI ประจำตำแหน่งนี้ เช่น *"เน้นระบุงานวิจัยและผลงานวิชาการระดับชาติ ไม่เน้นงานธุรการทั่วไป ใช้ภาษาทางการเชิงวิชาการ"* |
| `education_level` | `VARCHAR(100)` | ระดับการศึกษาขั้นต่ำที่กำหนด เช่น ปริญญาตรี / ปริญญาโท / ปริญญาเอก |
| `experience_min_years`| `INTEGER` | จำนวนปีประสบการณ์ทำงานขั้นต่ำที่ต้องการ (เช่น 2 ปี, 5 ปี) |
| `benefits_template` | `JSONB` | สิทธิประโยชน์หรือสวัสดิการเฉพาะของตำแหน่งงานนี้ |
| `is_ai_trained` | `BOOLEAN` | สถานะระบุว่าตำแหน่งนี้ได้รับการตั้งค่าเกณฑ์มาตรฐานให้ AI แล้วหรือไม่ (ค่าเริ่มต้น: `FALSE`) สำหรับแสดง Badge สถานะบน UI |

### 📜 SQL Script สำหรับรันเพิ่มคอลัมน์ใน Supabase SQL Editor
```sql
-- เพิ่มคอลัมน์สำหรับการเทรนและกำหนดมาตรฐาน AI ให้กับตำแหน่งงาน
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS required_skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_guidelines TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS education_level VARCHAR(100) DEFAULT 'ปริญญาตรีขึ้นไป',
ADD COLUMN IF NOT EXISTS experience_min_years INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS benefits_template JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_ai_trained BOOLEAN DEFAULT FALSE;

-- สร้าง Index เพื่อเพิ่มความเร็วในการค้นหาตำแหน่งที่เทรนแล้ว
CREATE INDEX IF NOT EXISTS idx_positions_is_ai_trained ON positions(is_ai_trained);
```

---

## 🖥️ 3. การออกแบบหน้า Page สำหรับเทรน AI (UI/UX Concept)

แนะนำให้พัฒนาเป็นแท็บใหม่ในหน้า **AI Agent (`/dashboard/ai-agent`)** ภายใต้ชื่อแท็บ:  
**`🧠 เทรน AI ประจำตำแหน่ง (AI JD Training)`**

### โครงสร้างหน้าจอ (Layout & Components):

```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🧠 เทรน AI ประจำตำแหน่งงาน (Job Standard & AI Knowledge Base)             │
│ กำหนดเกณฑ์มาตรฐานและแนวทางการร่าง Job Description ให้ Google Gemini 3.8 Flash │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ 1. เลือกตำแหน่งงาน (Position Selector)                                     │
│    [ Dropdown เลือกตำแหน่งงานจากตาราง positions ▾ ]  [ + เพิ่มตำแหน่งใหม่ ] │
│    • แผนก: ฝ่ายเทคโนโลยีสารสนเทศ  • ระดับ: ปฏิบัติการ  • สถานะ: [✓ เทรนแล้ว]  │
│                                                                            │
│ 2. หน้าที่ความรับผิดชอบหลัก (Core Responsibilities)                         │
│    • พัฒนาและดูแลระบบเว็บแอปพลิเคชันขององค์กรด้วย Next.js [ ลบ ]           │
│    • ออกแบบและบริหารจัดการฐานข้อมูล Supabase / PostgreSQL [ ลบ ]          │
│    [ + เพิ่มข้อความรับผิดชอบใหม่...                              ] [ เพิ่ม ] │
│                                                                            │
│ 3. คุณสมบัติและทักษะที่ต้องการ (Qualifications & Skills)                   │
│    วุฒิการศึกษาขั้นต่ำ: [ ปริญญาตรีขึ้นไป ▾ ]  ประสบการณ์ขั้นต่ำ: [ 2 ปี ]    │
│    ทักษะและเครื่องมือ (Skills Tags):                                        │
│    [ Next.js ✕ ] [ TypeScript ✕ ] [ PostgreSQL ✕ ] [ REST API ✕ ]         │
│    [ + พิมพ์ทักษะแล้วกด Enter...                                ] [ เพิ่ม ] │
│                                                                            │
│ 4. คำสั่งพิเศษกำกับ AI (Custom Prompt Guidelines)                          │
│    ┌──────────────────────────────────────────────────────────────────────┐│
│    │ เน้นงานสถาปัตยกรรมคลาวด์และความปลอดภัยของข้อมูลเป็นสำคัญ             ││
│    │ ใช้ภาษาทางการ โทนสร้างแรงบันดาลใจ สไตล์มหาวิทยาลัยศรีปทุม            ││
│    └──────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ 5. ปุ่มดำเนินการ (Action Buttons)                                          │
│    [ ⚡ ทดสอบให้ AI ร่างตัวอย่าง (Test Run) ]  [ 💾 บันทึกเกณฑ์มาตรฐานลง DB ]│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 4. กลไกการทำงานของ AI ร่วมกับ Gemini 3.8 Flash (Prompt Grounding)

เมื่อ HR เปิดหน้า **"+ เปิดรับตำแหน่งใหม่"** หรือกด **"ร่างใหม่ด้วย AI"**:
1. ระบบจะค้นหาข้อมูลตำแหน่งงานนั้นในตาราง `positions`
2. หากตำแหน่งนี้มีข้อมูล `is_ai_trained = true`:
   - ระบบจะนำ `responsibilities`, `qualifications`, `required_skills`, และ `ai_guidelines` มาประกอบเป็น Prompt Grounding
3. **โครงสร้าง Prompt ที่ส่งให้ Gemini 3.8 Flash**:
   ```
   You are an expert HR AI Agent for Sripatum University (SPU).
   Generate a precise, professional Job Description strictly based on the following approved organizational standards:
   
   - Target Position: "เจ้าหน้าที่พัฒนาระบบสารสนเทศ"
   - Department: "สำนักเทคโนโลยีสารสนเทศ"
   - Minimum Education: "ปริญญาตรีขึ้นไป สาขาวิทยาการคอมพิวเตอร์ หรือสาขาที่เกี่ยวข้อง"
   - Minimum Experience: 2 years
   - Mandatory Core Responsibilities: [...]
   - Mandatory Skills & Stack: ["Next.js", "TypeScript", "PostgreSQL", "TailwindCSS"]
   - Special Tone & Directives: "เน้นย้ำเรื่องความปลอดภัยของข้อมูลนักศึกษาและนวัตกรรมการศึกษา"
   ```
4. Gemini 3.8 Flash จะประมวลผลและสร้าง Job Description ที่สอดคล้องกับมาตรฐานของมหาวิทยาลัยทันที

---

## 🚀 5. ผลพลอยได้ที่เพิ่มขึ้น (High Value Synergies)

1. **AI Screening แม่นยำขึ้นแบบก้าวกระโดด**:
   - เมื่อเกณฑ์คุณสมบัติใน JD มีความชัดเจน ตอนที่มีผู้สมัครยื่น Resume เข้ามา ระบบ Gemini 3.8 Flash จะใช้เกณฑ์ชุดเดียวกันนี้มาคำนวณคะแนน **Match Score** และวิเคราะห์จุดแข็ง/จุดอ่อน (Strengths & Gaps) ได้อย่างตรงจุด ไม่มีความคลาดเคลื่อน
2. **ลดภาระงานของ HR ลงมากกว่า 90%**:
   - HR ไม่ต้องเริ่มต้นเขียน JD ใหม่จากความว่างเปล่า ทุกตำแหน่งมีมาตรฐานอ้างอิงชัดเจน
3. **รักษามาตรฐานองค์กร (Enterprise Standardization)**:
   - ไม่ว่าเจ้าหน้าที่ HR คนใดจะเป็นผู้เปิดรับสมัคร ข้อมูล JD จะคงคุณภาพและมาตรฐานภาษาขององค์กรไว้เสมอ

---

## 📋 6. แผนงานการพัฒนา (Step-by-Step Implementation)

- [ ] **ขั้นตอนที่ 1**: รัน SQL เพิ่มคอลัมน์ใน Supabase สำหรับตาราง `positions`
- [ ] **ขั้นตอนที่ 2**: เพิ่ม Service ฟังก์ชันใน `supabase-service.ts` สำหรับบันทึกและดึงเกณฑ์มาตรฐานของตำแหน่ง (`updatePositionTrainingData`, `fetchPositionTrainingById`)
- [ ] **ขั้นตอนที่ 3**: พัฒนาแท็บ UI `🧠 เทรน AI ประจำตำแหน่ง` ในหน้า `src/app/dashboard/ai-agent/page.tsx`
- [ ] **ขั้นตอนที่ 4**: เชื่อมต่อฟังก์ชัน `generateJobDescription` ให้ดึงข้อมูลเกณฑ์มาตรฐานที่เทรนไว้ไปใช้ร่วมกับ **Gemini 3.8 Flash**
- [ ] **ขั้นตอนที่ 5**: ทดสอบการร่าง JD และทดสอบการนำไปเปิดรับสมัครในหน้าตำแหน่งว่าง
