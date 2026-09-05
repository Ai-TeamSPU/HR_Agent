-- =========================================================================
-- HR AI Agent — Add & Verify Candidate Skills Column in Supabase
-- คำแนะนำ: คัดลอกสคริปต์นี้ไปวางและกด Run ใน Supabase SQL Editor
-- =========================================================================

-- 1. เพิ่มคอลัมน์ skills ในตาราง candidates (ประเภท JSONB รองรับ Array ของทักษะ)
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;

-- 2. สร้าง GIN Index สำหรับค้นหาทักษะอย่างรวดเร็ว (High-Performance Skill Search)
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates USING GIN (skills);

-- 3. อัปเดตตัวอย่างทักษะสำหรับ Candidate ที่มีอยู่แล้วในระบบ
UPDATE candidates
SET skills = '["AI Development", "Python", "FastAPI", "Prompt Engineering", "LLM Integration", "PyTorch"]'::jsonb
WHERE email LIKE '%thanaporn%' OR first_name ILIKE '%Thanaporn%';

UPDATE candidates
SET skills = '["React", "Next.js", "TypeScript", "Node.js", "Tailwind CSS", "PostgreSQL"]'::jsonb
WHERE email LIKE '%siriporn%' OR first_name ILIKE '%Siriporn%';

-- 4. ตรวจสอบข้อมูลคอลัมน์ skills ในตาราง candidates
SELECT id, first_name, last_name, current_position, skills FROM candidates ORDER BY id;
