# 🏛️ คู่มือและสคริปต์ SQL นำเข้าข้อมูลบุคลากร SPU Personnel Master สู่ Supabase

> 📄 **ไฟล์ต้นฉบับ:** `SPU_Personnel_Master(เเก้ไข).xlsx`  
> 👥 **จำนวนข้อมูลบุคลากรทั้งหมด:** **2,196 รายการ**  
> 🗄️ **เป้าหมาย:** ฐานข้อมูล **Supabase (PostgreSQL)** ของระบบ HR AI Agent  
> 📅 **วันที่แปลงข้อมูล:** 27 สิงหาคม 2569  

---

## 📊 1. สรุปภาพรวมของข้อมูล (Executive Data Summary)

จากการวิเคราะห์ไฟล์ข้อมูลบุคลากร มหาวิทยาลัยศรีปทุม (SPU Personnel Master) จำนวน **2,196 แถว** ได้ผลสรุปดังนี้:

| มิติข้อมูล (Dimension) | รายละเอียดและสถิติ | สัดส่วน / จำนวน |
| :--- | :--- | :---: |
| **สถานะการทำงาน (Status)** | • บุคลากรปัจจุบัน (ปกติ / `ACTIVE`)<br>• บุคลากรที่ลาออกแล้ว (`RESIGNED`) | **799 คน (36.4%)**<br>**1,397 คน (63.6%)** |
| **สัญชาติ (Nationality)** | • สัญชาติไทย (`ไทย`)<br>• สัญชาติต่างชาติ (`ต่างชาติ`) | **2,119 คน (96.5%)**<br>**77 คน (3.5%)** |
| **สายงานหลัก (Employment Type)** | • เจ้าหน้าที่ประจำ<br>• อาจารย์ประจำ<br>• เจ้าหน้าที่ชั่วคราว<br>• อาจารย์ประจำแบบพิเศษ / อื่นๆ | 808 คน (36.8%)<br>687 คน (31.3%)<br>196 คน (8.9%)<br>505 คน (23.0%) |
| **ตำแหน่งงานที่ไม่ซ้ำ (Positions)** | รวมทั้งสิ้น **136 ตำแหน่งงาน** (เช่น คณบดี, อาจารย์, เจ้าหน้าที่, Operations Manager, ฯลฯ) | **136 ตำแหน่ง** |
| **สังกัดและหน่วยงาน (Departments)** | • ต้นสังกัดระดับกลุ่มงาน/คณะ (`parent_department`)<br>• หน่วยงานย่อย/สาขา (`department`) | **63 กลุ่มงาน/คณะ**<br>**218 หน่วยงานย่อย** |
| **อายุและอายุงาน (Age & Tenure)** | • อายุเฉลี่ย: **44.6 ปี** (ต่ำสุด 12 ปี, สูงสุด 101 ปี)<br>• อายุงานเฉลี่ย: **12.5 ปี** (สูงสุด 51 ปี) | เฉลี่ย 44.6 ปี / 12.5 ปี |

---

## 🗺️ 2. ตารางการจับคู่ฟิลด์ข้อมูล (Field Mapping Specification)

ข้อมูลจากคอลัมน์ใน Excel ถูกแปลงค่าให้เข้ากับ Schema ของ Supabase ตามมาตรฐานสากลดังนี้:

| คอลัมน์ใน Excel | ฟิลด์ในตาราง `employees` | ชนิดข้อมูล (Data Type) | กฎการแปลงข้อมูล (Transformation Rule) |
| :--- | :--- | :--- | :--- |
| `รหัส` | `employee_code` | `VARCHAR(20) UNIQUE` | รหัสพนักงาน (เช่น `56010809`) ใช้เป็น Unique Key |
| `คำนำหน้า` | `prefix` | `VARCHAR(100)` | นาย, นางสาว, ดอกเตอร์, ผศ.ดร., ศ.ดร., ฯลฯ |
| `ชื่อ` | `first_name` & `first_name_th` | `VARCHAR(100)` | ชื่อภาษาไทย/อังกฤษ |
| `นามสกุล` | `last_name` & `last_name_th` | `VARCHAR(100)` | นามสกุลภาษาไทย/อังกฤษ |
| `กลุ่มสัญชาติ` | `nationality_group` | `VARCHAR(50)` | `ไทย` หรือ `ต่างชาติ` |
| *(สร้างอัตโนมัติ)* | `email` | `VARCHAR(255)` | สร้างมาตรฐานอีเมลมหาวิทยาลัย: `{employee_code}@spu.ac.th` |
| `ต้นสังกัด` | `parent_department` | `VARCHAR(150)` | คณะ / กลุ่มงานใหญ่ (เช่น `กลุ่มงานบริการเทคโนโลยี`, `วิศวกรรมศาสตร์`) |
| `หน่วยงาน` | `department` | `VARCHAR(150)` | หน่วยงานย่อย / ภาควิชา / สาขา |
| `ระดับตำแหน่ง` | `level` | `VARCHAR(50)` | ระดับ Manager, Senior, อาจารย์, คณบดี, ฯลฯ |
| `ประเภท` | `employment_type` | `VARCHAR(150)` | เจ้าหน้าที่ประจำ, อาจารย์ประจำ, พนักงานรายวัน, ฯลฯ |
| `ตำแหน่ง` | `position` | `VARCHAR(200)` | ชื่อตำแหน่งงาน |
| `วันเริ่มงาน` | `hire_date` | `DATE` | **แปลงปี พ.ศ. ➔ ค.ศ.** (เช่น `2556-06-01` ➔ `2013-06-01`) |
| `วันเกิด` | `birth_date` | `DATE` | **แปลงปี พ.ศ. ➔ ค.ศ.** และจัดการค่าว่าง / Leap Day (`29/02/2000`) |
| `อายุ` | `age` | `INTEGER` | อายุปีบริบูรณ์ (ถ้าเป็น 0 หรือว่างจะเซ็ตเป็น `NULL`) |
| `อายุงาน` | `tenure_years` | `INTEGER` | จำนวนปีที่ทำงาน |
| `สถานะ` | `status` | `VARCHAR(20)` | `ปกติ` ➔ **`ACTIVE`**<br>`ลาออก` ➔ **`RESIGNED`** |

---

## 🚀 3. ขั้นตอนการรันนำเข้าข้อมูลใน Supabase (Step-by-Step Execution)

คุณสามารถนำเข้าข้อมูลได้ง่ายๆ ผ่าน **Supabase SQL Editor** ดังนี้:

### 🔹 ขั้นตอนที่ 1: เปิด Supabase SQL Editor
1. เข้าไปที่ [Supabase Dashboard - SQL Editor](https://supabase.com/dashboard/project/kvvbkiasrnppxvopezin/sql)
2. คลิกปุ่ม **"+ New Query"**

### 🔹 ขั้นตอนที่ 2: รันไฟล์ SQL นำเข้าข้อมูล
เปิดไฟล์ [`spu-personnel-seed.sql`](file:///c:/Users/iceor/Downloads/งานเมยฺ์เอง/HR_Agent/spu-personnel-seed.sql) คัดลอกโค้ดทั้งหมด แล้ววางใน SQL Editor แล้วกด **Run** ✅

---

## 💻 4. สคริปต์ SQL สำหรับนำเข้าข้อมูล (SQL Scripts)

### 📌 ส่วนที่ 1: ปรับปรุงโครงสร้างตาราง `employees` & สร้าง Indexes (DDL)

```sql
-- 1. เพิ่มฟิลด์สำหรับรองรับข้อมูลบุคลากร SPU ครบถ้วน 100%
ALTER TABLE employees 
  ADD COLUMN IF NOT EXISTS prefix VARCHAR(100),
  ADD COLUMN IF NOT EXISTS nationality_group VARCHAR(50) DEFAULT 'ไทย',
  ADD COLUMN IF NOT EXISTS parent_department VARCHAR(150),
  ADD COLUMN IF NOT EXISTS employment_type VARCHAR(150),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS tenure_years INTEGER;

-- 2. สร้าง Indexes เพื่อเร่งความเร็วในการค้นหา
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_parent_department ON employees(parent_department);
CREATE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code);
```

---

### 📌 ส่วนที่ 2: นำเข้าตำแหน่งงาน 136 ตำแหน่งของ SPU เข้าตาราง `positions` (ทางเลือกเสริม)

สคริปต์นี้จะช่วยนำชื่อตำแหน่งทั้งหมด 136 ตำแหน่งของ SPU เข้าสู่ตาราง `positions` เพื่อให้ระบบ HR AI Agent สามารถนำไปใช้เปิดรับสมัครและสร้าง JD ต่อได้ทันที:

> 📁 ดูสคริปต์เต็มได้ที่: [`spu-positions-seed.sql`](file:///c:/Users/iceor/Downloads/งานเมยฺ์เอง/HR_Agent/spu-positions-seed.sql)

```sql
INSERT INTO positions (title, title_th, department, department_th, level) VALUES
  ('Operations Manager', 'Operations Manager', 'กลุ่มงานบริการเทคโนโลยี', 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร', 'ระดับ Manager'),
  ('Sernior E-Learning System Administrator', 'Sernior E-Learning System Administrator', 'กลุ่มงานโครงสร้างพื้นฐาน', 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร', 'ระดับ Senior'),
  ('Senior System Engineer', 'Senior System Engineer', 'กลุ่มงานบริการเทคโนโลยี', 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร', 'ระดับ Senior'),
  ('คณบดี', 'คณบดี', 'การออกแบบและสถาปัตยกรรมศาสตร์', 'การออกแบบและสถาปัตยกรรมศาสตร์', 'ระดับ คณบดี'),
  ('ผู้อำนวยการ สำนักวิชาศึกษาทั่วไป', 'ผู้อำนวยการ สำนักวิชาศึกษาทั่วไป', 'วิชาศึกษาทั่วไป', 'วิชาศึกษาทั่วไป', 'ระดับ คณบดี'),
  ('เจ้าหน้าที่', 'เจ้าหน้าที่', 'นิเทศศาสตร์', 'สำนักงานเลขานุการ', 'ระดับ เจ้าหน้าที่'),
  ('อาจารย์', 'อาจารย์', 'การท่องเที่ยวและการบริการ', 'การจัดการการท่องเที่ยว', 'ระดับ อาจารย์')
  -- (และอีก 129 ตำแหน่งในไฟล์ spu-positions-seed.sql)
ON CONFLICT DO NOTHING;
```

---

### 📌 ส่วนที่ 3: ตัวอย่างคำสั่ง INSERT ข้อมูลบุคลากร (ตาราง `employees`)

> 📁 สคริปต์ฉบับสมบูรณ์สำหรับ **2,196 รายชื่อ** ถูกจัดเตรียมและแบ่งเป็น 9 Batch ไว้อย่างเรียบร้อยในไฟล์:  
> 👉 [`spu-personnel-seed.sql`](file:///c:/Users/iceor/Downloads/งานเมยฺ์เอง/HR_Agent/spu-personnel-seed.sql) *(ขนาด 571 KB)*

**ตัวอย่างโครงสร้างคำสั่ง SQL:**
```sql
INSERT INTO employees (
  employee_code, prefix, first_name, last_name, first_name_th, last_name_th,
  nationality_group, email, parent_department, department, level, employment_type,
  position, hire_date, birth_date, age, tenure_years, status
) VALUES
  ('56010809', 'นาย', 'ปัณณ์ภูมิ', 'พาณิชย์พร', 'ปัณณ์ภูมิ', 'พาณิชย์พร', 'ไทย', '56010809@spu.ac.th', 'กลุ่มงานบริการเทคโนโลยี', 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร', 'ระดับ Manager', 'เจ้าหน้าที่ประจำ', 'Operations Manager', '2013-06-01', '1978-01-27', 48, 13, 'RESIGNED'),
  ('44010787', 'นางสาว', 'ธราศิริ', 'รุ่งกาญจน์', 'ธราศิริ', 'รุ่งกาญจน์', 'ไทย', '44010787@spu.ac.th', 'กลุ่มงานโครงสร้างพื้นฐาน', 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร', 'ระดับ Senior', 'เจ้าหน้าที่ประจำ (1 มิ.ย.53  SPT-SPU)', 'Sernior E-Learning System Administrator', '2001-10-16', '1978-04-03', 48, 24, 'ACTIVE'),
  ('56011012', 'นาย', 'ลภเมธ', 'มณีกิจ', 'ลภเมธ', 'มณีกิจ', 'ไทย', '56011012@spu.ac.th', 'กลุ่มงานบริการเทคโนโลยี', 'ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร', 'ระดับ Senior', 'เจ้าหน้าที่ประจำ', 'Senior System Engineer', '2013-06-10', '1982-04-01', 44, 13, 'RESIGNED'),
  ('50010690', 'ดอกเตอร์', 'จุฑามาศ', 'วิทย์วงศ์', 'จุฑามาศ', 'วิทย์วงศ์', 'ไทย', '50010690@spu.ac.th', 'การออกแบบและสถาปัตยกรรมศาสตร์', 'การออกแบบและสถาปัตยกรรมศาสตร์', 'ระดับ คณบดี', 'อาจารย์ประจำ', 'คณบดี', '2007-08-21', '1976-11-03', 50, 19, 'ACTIVE')
  -- (ต่อด้วยรายชื่อทั้งหมดจนครบ 2,196 รายการ แบ่งเป็น 9 ชุด)
ON CONFLICT (employee_code) DO UPDATE SET
  prefix = EXCLUDED.prefix,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  first_name_th = EXCLUDED.first_name_th,
  last_name_th = EXCLUDED.last_name_th,
  nationality_group = EXCLUDED.nationality_group,
  email = EXCLUDED.email,
  parent_department = EXCLUDED.parent_department,
  department = EXCLUDED.department,
  level = EXCLUDED.level,
  employment_type = EXCLUDED.employment_type,
  position = EXCLUDED.position,
  hire_date = EXCLUDED.hire_date,
  birth_date = EXCLUDED.birth_date,
  age = EXCLUDED.age,
  tenure_years = EXCLUDED.tenure_years,
  status = EXCLUDED.status,
  updated_at = NOW();
```

---

### 📌 ส่วนที่ 4: ซิงค์ประวัติพนักงานที่ลาออกลงตาราง `resignations` อัตโนมัติ (Automation Sync)

หากต้องการให้ระบบบันทึกประวัติการลาออกในตาราง `resignations` สำหรับพนักงาน 1,397 คนที่มีสถานะเป็น `RESIGNED`:

```sql
INSERT INTO resignations (employee_id, resignation_date, last_working_date, reason, status)
SELECT 
  id, 
  (hire_date + (COALESCE(tenure_years, 0) || ' years')::interval)::date,
  (hire_date + (COALESCE(tenure_years, 0) || ' years')::interval)::date,
  'ลาออกตามบันทึกประวัติบุคลากร SPU Personnel Master',
  'COMPLETED'
FROM employees
WHERE status = 'RESIGNED'
  AND NOT EXISTS (SELECT 1 FROM resignations r WHERE r.employee_id = employees.id);
```

---

## 🔍 5. คำสั่ง SQL สำหรับตรวจสอบความถูกต้องของข้อมูล (Verification Queries)

หลังจากรันสคริปต์แล้ว คุณสามารถรันคำสั่งเหล่านี้เพื่อตรวจสอบผลลัพธ์ใน Supabase ได้ทันที:

```sql
-- 1. นับจำนวนพนักงานทั้งหมดในระบบ (ต้องได้ 2,196+ คน)
SELECT COUNT(*) AS total_employees FROM employees;

-- 2. ดูการแบ่งสัดส่วนสถานะ (Active vs Resigned)
SELECT status, COUNT(*) AS count, ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS percentage
FROM employees
GROUP BY status;

-- 3. ตรวจสอบ 10 อันดับสังกัด/คณะที่มีบุคลากรมากที่สุด
SELECT parent_department, COUNT(*) AS total_staff
FROM employees
GROUP BY parent_department
ORDER BY total_staff DESC
LIMIT 10;

-- 4. ตรวจสอบ 10 อันดับตำแหน่งงานยอดนิยม
SELECT position, COUNT(*) AS total_staff
FROM employees
GROUP BY position
ORDER BY total_staff DESC
LIMIT 10;

-- 5. สรุปอายุเฉลี่ยและอายุงานเฉลี่ยตามประเภทพนักงาน
SELECT 
  employment_type,
  COUNT(*) AS total_count,
  ROUND(AVG(age), 1) AS avg_age,
  ROUND(AVG(tenure_years), 1) AS avg_tenure
FROM employees
GROUP BY employment_type
ORDER BY total_count DESC
LIMIT 10;
```

---

## 📁 รายการไฟล์ที่เกี่ยวข้องในระบบ (File Artifacts)

| ชื่อไฟล์ | ตำแหน่งจัดเก็บ | คำอธิบาย |
| :--- | :--- | :--- |
| **`spu-personnel-seed.sql`** | `c:\Users\iceor\Downloads\งานเมยฺ์เอง\HR_Agent\spu-personnel-seed.sql` | สคริปต์ SQL หลักสำหรับ Insert บุคลากรทั้ง 2,196 รายการ |
| **`spu-positions-seed.sql`** | `c:\Users\iceor\Downloads\งานเมยฺ์เอง\HR_Agent\spu-positions-seed.sql` | สคริปต์ SQL สำหรับสร้าง Position ทั้ง 136 ตำแหน่ง |
| **`SPU_PERSONNEL_DATABASE_IMPORT.md`** | `c:\Users\iceor\Downloads\งานเมยฺ์เอง\HR_Agent\SPU_PERSONNEL_DATABASE_IMPORT.md` | เอกสารคู่มือและคำอธิบายฉบับนี้ |
| **`SPU_Personnel_Master(เเก้ไข).xlsx`** | `c:\Users\iceor\Downloads\งานเมยฺ์เอง\HR_Agent\SPU_Personnel_Master(เเก้ไข).xlsx` | ไฟล์ Excel ข้อมูล Master ต้นทาง |
