-- ============================================================================
-- 1. SQL สำหรับปรับปรุง Foreign Keys ให้ลบข้อมูลแบบอัตโนมัติ (ON DELETE CASCADE)
-- ทำให้หลังจากนี้เวลากดลบ Vacancy หรือ Application ระบบจะลบข้อมูลลูกที่ผูกไว้ให้ทันที
-- ============================================================================

-- 1. Job Descriptions & Applications (ผูกกับ Vacancies)
ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_vacancy_id_fkey;
ALTER TABLE job_descriptions ADD CONSTRAINT job_descriptions_vacancy_id_fkey 
  FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE;

ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_vacancy_id_fkey;
ALTER TABLE applications ADD CONSTRAINT applications_vacancy_id_fkey 
  FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE;

-- 2. Interviews & Interview Relations
ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_vacancy_id_fkey;
ALTER TABLE interviews ADD CONSTRAINT interviews_vacancy_id_fkey 
  FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE;

ALTER TABLE interviews DROP CONSTRAINT IF EXISTS interviews_application_id_fkey;
ALTER TABLE interviews ADD CONSTRAINT interviews_application_id_fkey 
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;

ALTER TABLE interview_interviewers DROP CONSTRAINT IF EXISTS interview_interviewers_interview_id_fkey;
ALTER TABLE interview_interviewers ADD CONSTRAINT interview_interviewers_interview_id_fkey 
  FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE;

ALTER TABLE interview_feedback DROP CONSTRAINT IF EXISTS interview_feedback_interview_id_fkey;
ALTER TABLE interview_feedback ADD CONSTRAINT interview_feedback_interview_id_fkey 
  FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE;

-- 3. DL Tests & Test Results
ALTER TABLE dl_tests DROP CONSTRAINT IF EXISTS dl_tests_application_id_fkey;
ALTER TABLE dl_tests ADD CONSTRAINT dl_tests_application_id_fkey 
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;

ALTER TABLE dl_test_results DROP CONSTRAINT IF EXISTS dl_test_results_dl_test_id_fkey;
ALTER TABLE dl_test_results ADD CONSTRAINT dl_test_results_dl_test_id_fkey 
  FOREIGN KEY (dl_test_id) REFERENCES dl_tests(id) ON DELETE CASCADE;

ALTER TABLE dl_test_results DROP CONSTRAINT IF EXISTS dl_test_results_application_id_fkey;
ALTER TABLE dl_test_results ADD CONSTRAINT dl_test_results_application_id_fkey 
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;

-- 4. Offers & Hires
ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_vacancy_id_fkey;
ALTER TABLE offers ADD CONSTRAINT offers_vacancy_id_fkey 
  FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE;

ALTER TABLE offers DROP CONSTRAINT IF EXISTS offers_application_id_fkey;
ALTER TABLE offers ADD CONSTRAINT offers_application_id_fkey 
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;

ALTER TABLE hires DROP CONSTRAINT IF EXISTS hires_offer_id_fkey;
ALTER TABLE hires ADD CONSTRAINT hires_offer_id_fkey 
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE;

-- 5. AI Recommendations
ALTER TABLE ai_recommendations DROP CONSTRAINT IF EXISTS ai_recommendations_vacancy_id_fkey;
ALTER TABLE ai_recommendations ADD CONSTRAINT ai_recommendations_vacancy_id_fkey 
  FOREIGN KEY (vacancy_id) REFERENCES vacancies(id) ON DELETE CASCADE;

ALTER TABLE ai_recommendations DROP CONSTRAINT IF EXISTS ai_recommendations_application_id_fkey;
ALTER TABLE ai_recommendations ADD CONSTRAINT ai_recommendations_application_id_fkey 
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;


-- ============================================================================
-- 2. SQL สำหรับลบตำแหน่งงานที่ว่างทั้งหมดออกในครั้งเดียว (Clear All Vacancies)
-- ============================================================================

DELETE FROM hires;
DELETE FROM offers;
DELETE FROM dl_test_results;
DELETE FROM dl_tests;
DELETE FROM interview_feedback;
DELETE FROM interview_interviewers;
DELETE FROM interviews;
DELETE FROM ai_recommendations;
DELETE FROM applications;
DELETE FROM job_descriptions;
DELETE FROM vacancies;

-- ตรวจสอบผลลัพธ์
SELECT COUNT(*) AS remaining_vacancies FROM vacancies;
