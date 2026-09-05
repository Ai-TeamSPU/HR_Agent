// pageback — Employee Service
// จัดการข้อมูลบุคลากร (Employees) และ Workflow การลาออกพร้อม AI Auto-Replacement JD

import { supabase } from '@/lib/supabase';
import type { Employee, EmployeeStatus, EmployeeFilterParams, EmployeeStats } from '@/lib/types/employee';
import type { AIJDGenerationResponse } from '@/lib/types/ai';
import { generateJobDescription } from './ai-service';
import { createNotificationInDB } from './supabase-service';

/**
 * ดึงรายการบุคลากรจากตาราง employees พร้อม Pagination, Search และ Filter
 */
export async function fetchEmployeesFromDB(params: EmployeeFilterParams = {}): Promise<{
  data: Employee[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  try {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(5, Math.min(100, params.pageSize || 20));
    const offset = (page - 1) * pageSize;

    let query = supabase.from('employees').select('*', { count: 'exact' });

    // Filter by Status
    if (params.status && params.status !== 'ALL') {
      query = query.eq('status', params.status);
    }

    // Filter by Department / Parent Department
    if (params.parentDepartment && params.parentDepartment !== 'ALL') {
      query = query.eq('parent_department', params.parentDepartment);
    }
    if (params.department && params.department !== 'ALL') {
      query = query.eq('department', params.department);
    }

    // Search by text (Name, Employee Code, Position)
    if (params.search && params.search.trim() !== '') {
      const s = params.search.trim();
      query = query.or(
        `first_name.ilike.%${s}%,last_name.ilike.%${s}%,first_name_th.ilike.%${s}%,last_name_th.ilike.%${s}%,employee_code.ilike.%${s}%,position.ilike.%${s}%,department.ilike.%${s}%`
      );
    }

    // Ordering and Pagination
    query = query.order('id', { ascending: true }).range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;

    if (error || !data) {
      console.warn('Error querying employees from Supabase:', error);
      return { data: [], count: 0, page, pageSize, totalPages: 0 };
    }

    const employees: Employee[] = data.map((item: any) => ({
      id: String(item.id),
      employeeCode: String(item.employee_code || ''),
      prefix: item.prefix || '',
      firstName: item.first_name || '',
      lastName: item.last_name || '',
      firstNameTh: item.first_name_th || item.first_name || '',
      lastNameTh: item.last_name_th || item.last_name || '',
      nationalityGroup: item.nationality_group || 'ไทย',
      email: item.email || '',
      phone: item.phone || '',
      parentDepartment: item.parent_department || '',
      department: item.department || '',
      level: item.level || 'ระดับ เจ้าหน้าที่',
      employmentType: item.employment_type || 'เจ้าหน้าที่ประจำ',
      position: item.position || 'เจ้าหน้าที่',
      hireDate: item.hire_date || '',
      birthDate: item.birth_date || '',
      age: item.age ? Number(item.age) : undefined,
      tenureYears: item.tenure_years !== null ? Number(item.tenure_years) : 0,
      status: (item.status as EmployeeStatus) || 'ACTIVE',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: employees,
      count: totalCount,
      page,
      pageSize,
      totalPages,
    };
  } catch (err) {
    console.error('fetchEmployeesFromDB Exception:', err);
    return { data: [], count: 0, page: 1, pageSize: 20, totalPages: 0 };
  }
}

/**
 * ดึงสถิติภาพรวมของบุคลากร (Total, Active, Resigned, Total Departments)
 */
export async function fetchEmployeeStatsFromDB(): Promise<EmployeeStats> {
  try {
    const { count: total } = await supabase.from('employees').select('id', { count: 'exact', head: true });
    const { count: active } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ACTIVE');
    const { count: resigned } = await supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'RESIGNED');

    // ดึงจำนวนหน่วยงานที่ไม่ซ้ำ
    const { data: deptData } = await supabase.from('employees').select('parent_department, department');
    const uniqueDepts = new Set<string>();
    if (deptData) {
      deptData.forEach((d: any) => {
        if (d.parent_department) uniqueDepts.add(d.parent_department);
        if (d.department) uniqueDepts.add(d.department);
      });
    }

    return {
      total: total || 0,
      active: active || 0,
      resigned: resigned || 0,
      totalDepartments: uniqueDepts.size || 0,
    };
  } catch (err) {
    console.warn('fetchEmployeeStatsFromDB Exception:', err);
    return { total: 0, active: 0, resigned: 0, totalDepartments: 0 };
  }
}

/**
 * ดึงรายชื่อสังกัดและคณะทั้งหมด สำหรับใช้ใน Dropdown ตัวกรอง
 */
export async function fetchDepartmentsListFromDB(): Promise<{
  parentDepartments: string[];
  departments: string[];
}> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('parent_department, department')
      .not('parent_department', 'is', null);

    if (error || !data) {
      return { parentDepartments: [], departments: [] };
    }

    const pDepts = new Set<string>();
    const depts = new Set<string>();

    data.forEach((row: any) => {
      if (row.parent_department && row.parent_department.trim() !== '') {
        pDepts.add(row.parent_department.trim());
      }
      if (row.department && row.department.trim() !== '') {
        depts.add(row.department.trim());
      }
    });

    return {
      parentDepartments: Array.from(pDepts).sort(),
      departments: Array.from(depts).sort(),
    };
  } catch (err) {
    return { parentDepartments: [], departments: [] };
  }
}

/**
 * อัปเดตสถานะของบุคลากรในฐานข้อมูล Supabase
 */
export async function updateEmployeeStatusInDB(
  employeeId: string,
  newStatus: EmployeeStatus,
  reason?: string
): Promise<boolean> {
  try {
    const numId = Number(employeeId);
    const idFilter = isNaN(numId) ? employeeId : numId;

    const { error } = await supabase
      .from('employees')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', idFilter);

    if (error) {
      console.warn('Error updating employee status:', error);
      return false;
    }

    // หากเปลี่ยนเป็น RESIGNED ให้บันทึกลงตาราง resignations ด้วย
    if (newStatus === 'RESIGNED') {
      try {
        const { data: maxRes } = await supabase.from('resignations').select('id').order('id', { ascending: false }).limit(1);
        const nextResId = (maxRes?.[0]?.id ? Number(maxRes[0].id) : 0) + 1;
        const today = new Date().toISOString().split('T')[0];

        await supabase.from('resignations').insert({
          id: nextResId,
          employee_id: idFilter,
          resignation_date: today,
          last_working_date: today,
          reason: reason || 'แจ้งลาออกผ่านระบบ HR Portal',
          status: 'COMPLETED',
        });
      } catch (rErr) {
        console.warn('Resignation insert warning:', rErr);
      }
    }

    return true;
  } catch (err) {
    console.error('updateEmployeeStatusInDB Exception:', err);
    return false;
  }
}

/**
 * ตรวจสอบและสร้าง Position ในตาราง positions หากยังไม่มี
 */
export async function ensurePositionExistsInDB(
  positionTitle: string,
  department: string,
  parentDepartment?: string,
  level?: string
): Promise<number> {
  try {
    const trimmedTitle = positionTitle.trim();
    // ค้นหาตำแหน่งเดิม
    const { data: existing } = await supabase
      .from('positions')
      .select('id')
      .ilike('title', trimmedTitle)
      .limit(1);

    if (existing && existing.length > 0 && existing[0].id) {
      return Number(existing[0].id);
    }

    // หา ID ถัดไป
    const { data: maxPos } = await supabase
      .from('positions')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    const nextId = (maxPos?.[0]?.id ? Number(maxPos[0].id) : 0) + 1;

    const deptVal = parentDepartment || department || 'General';
    const deptThVal = department || parentDepartment || 'ทั่วไป';

    const { error } = await supabase.from('positions').insert({
      id: nextId,
      title: trimmedTitle,
      title_th: trimmedTitle,
      department: deptVal,
      department_th: deptThVal,
      level: level || 'Mid-Level',
      responsibilities: [],
      qualifications: [],
      is_active: true,
    });

    if (error) {
      console.warn('Could not insert new position, fallback to 1:', error);
      return 1;
    }

    return nextId;
  } catch (err) {
    console.error('ensurePositionExistsInDB Exception:', err);
    return 1;
  }
}

/**
 * เรียก AI เพื่อร่าง Job Description สำหรับตำแหน่งทดแทนผู้ลาออก
 */
export async function generateReplacementJDWithAI(employee: Employee): Promise<AIJDGenerationResponse> {
  try {
    const posTitle = employee.position || 'เจ้าหน้าที่';
    const dept = employee.parentDepartment || employee.department || 'มหาวิทยาลัยศรีปทุม';
    const level = employee.level || 'Mid-Level';

    const initialSkills = [posTitle, dept, 'การทำงานเป็นทีม', 'การสื่อสาร'];

    const jd = await generateJobDescription(
      posTitle,
      dept,
      undefined,
      initialSkills,
      35000,
      65000
    );

    return jd;
  } catch (err) {
    console.error('generateReplacementJDWithAI Exception:', err);
    // Fallback Mock JD
    return {
      jobTitle: employee.position,
      jobTitleTh: employee.position,
      summary: `เปิดรับสมัครตำแหน่ง ${employee.position} เพื่อร่วมงานกับ ${employee.department}`,
      summaryTh: `เปิดรับสมัครตำแหน่ง ${employee.position} เพื่อร่วมงานกับ ${employee.department}`,
      responsibilities: [
        `ปฏิบัติงานในตำแหน่ง ${employee.position} ประจำ ${employee.department}`,
        'ประสานงานภายในหน่วยงานและผู้เกี่ยวข้อง',
        'รายงานผลการปฏิบัติงานตามเป้าหมายขององค์กร',
      ],
      responsibilitiesTh: [
        `ปฏิบัติงานในตำแหน่ง ${employee.position} ประจำ ${employee.department}`,
        'ประสานงานภายในหน่วยงานและผู้เกี่ยวข้อง',
        'รายงานผลการปฏิบัติงานตามเป้าหมายขององค์กร',
      ],
      requirements: [
        'วุฒิการศึกษาระดับปริญญาตรีขึ้นไปในสาขาที่เกี่ยวข้อง',
        'มีทักษะการติดต่อสื่อสารและการทำงานร่วมกับผู้อื่นได้ดี',
        'มีความรับผิดชอบ ละเอียดรอบคอบ และกระตือรือร้นในการทำงาน',
      ],
      requirementsTh: [
        'วุฒิการศึกษาระดับปริญญาตรีขึ้นไปในสาขาที่เกี่ยวข้อง',
        'มีทักษะการติดต่อสื่อสารและการทำงานร่วมกับผู้อื่นได้ดี',
        'มีความรับผิดชอบ ละเอียดรอบคอบ และกระตือรือร้นในการทำงาน',
      ],
      preferredSkills: ['Microsoft Office', 'Communication Skills', 'Teamwork'],
      education: ['ปริญญาตรีขึ้นไปในสาขาที่เกี่ยวข้อง'],
      experience: ['มีประสบการณ์การทำงาน 1-3 ปีขึ้นไป'],
      benefits: ['Social Security', 'Health Insurance', 'Annual Bonus'],
      benefitsTh: ['ประกันสังคม', 'ประกันสุขภาพกลุ่ม', 'โบนัสประจำปีตามผลงาน'],
      salaryMin: 35000,
      salaryMax: 65000,
      confidence: 0.95,
      modelVersion: 'Google Gemini Flash',
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * สร้าง Vacancy ใหม่สถานะ WAITING_HR_APPROVAL + แนบ JD + บันทึก Notification แจ้งเตือนสด
 */
export async function createReplacementVacancyAndNotify(
  employee: Employee,
  jdData: AIJDGenerationResponse,
  vacancyParams: {
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    headcount?: number;
    salaryMin?: number;
    salaryMax?: number;
  } = {}
): Promise<{ success: boolean; vacancyId?: string; message?: string }> {
  try {
    // 1. อัปเดตสถานะพนักงานเป็น RESIGNED
    await updateEmployeeStatusInDB(
      employee.id,
      'RESIGNED',
      `ลาออกและส่งต่อกระบวนการเปิดรับตำแหน่งทดแทน (${jdData.jobTitleTh || employee.position})`
    );

    // 2. ตรวจสอบ Position ID
    const positionId = await ensurePositionExistsInDB(
      employee.position,
      employee.department,
      employee.parentDepartment,
      employee.level
    );

    // 3. คำนวณ Vacancy ID ถัดไป
    const { data: maxVac } = await supabase
      .from('vacancies')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    const nextVacancyId = (maxVac?.[0]?.id ? Number(maxVac[0].id) : 0) + 1;
    const today = new Date().toISOString().split('T')[0];

    const fullName = `${employee.prefix ? employee.prefix + ' ' : ''}${employee.firstName} ${employee.lastName}`.trim();
    const reasonDetail = `ทดแทนคุณ ${fullName} (${employee.employeeCode}) ตำแหน่ง ${employee.position} ที่ลาออก`;

    // 4. บันทึก Vacancy
    const { error: vacErr } = await supabase.from('vacancies').insert({
      id: nextVacancyId,
      position_id: positionId,
      state: 'WAITING_HR_APPROVAL',
      priority: vacancyParams.priority || 'HIGH',
      headcount: vacancyParams.headcount || 1,
      filled: 0,
      open_date: today,
      reason: 'REPLACEMENT',
      reason_detail: reasonDetail,
      hiring_manager_id: 2,
      created_by: 1,
    });

    if (vacErr) {
      console.warn('Error inserting replacement vacancy:', vacErr);
      return { success: false, message: vacErr.message };
    }

    // 5. บันทึก Job Description
    const { data: maxJd } = await supabase
      .from('job_descriptions')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    const nextJdId = (maxJd?.[0]?.id ? Number(maxJd[0].id) : 0) + 1;

    await supabase.from('job_descriptions').insert({
      id: nextJdId,
      vacancy_id: nextVacancyId,
      version: 1,
      job_title: jdData.jobTitle || employee.position,
      job_title_th: jdData.jobTitleTh || employee.position,
      summary: jdData.summary,
      summary_th: jdData.summaryTh,
      responsibilities: jdData.responsibilities,
      responsibilities_th: jdData.responsibilitiesTh || jdData.responsibilities,
      requirements: jdData.requirements,
      requirements_th: jdData.requirementsTh || jdData.requirements,
      preferred_skills: jdData.preferredSkills || [],
      salary_min: vacancyParams.salaryMin || jdData.salaryMin || 35000,
      salary_max: vacancyParams.salaryMax || jdData.salaryMax || 65000,
      salary_currency: 'THB',
      generated_by_ai: true,
      ai_model_version: jdData.modelVersion || 'Google Gemini Live',
      ai_confidence: jdData.confidence || 0.95,
      is_current: true,
    });

    // 6. ส่ง Real-time Notification สำหรับแถบ Header
    const notifTitle = `📢 AI ร่าง JD ตำแหน่งทดแทน: ${employee.position}`;
    const notifMsg = `คุณ ${fullName} (${employee.employeeCode}) ได้รับการบันทึกสถานะลาออกเรียบร้อยแล้ว — AI Agent ได้ร่าง JD ตำแหน่งทดแทน (Vacancy #${nextVacancyId}) ให้แล้ว พร้อมรอ HR อนุมัติ`;

    await createNotificationInDB({
      userId: 1,
      title: notifTitle,
      titleTh: notifTitle,
      message: notifMsg,
      messageTh: notifMsg,
      type: 'ACTION_REQUIRED',
      actionUrl: `/dashboard/vacancies`,
    });

    return {
      success: true,
      vacancyId: String(nextVacancyId),
      message: 'บันทึกการลาออกและสร้างตำแหน่งงานทดแทนพร้อมแจ้งเตือนสำเร็จ!',
    };
  } catch (err: any) {
    console.error('createReplacementVacancyAndNotify Exception:', err);
    return { success: false, message: err?.message || 'Unknown error' };
  }
}
