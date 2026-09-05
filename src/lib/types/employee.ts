// lib/types/employee.ts
// ประเภทข้อมูลบุคลากรและพารามิเตอร์การกรอง

export type EmployeeStatus = 'ACTIVE' | 'RESIGNED' | 'TERMINATED';

export interface Employee {
  id: string;
  employeeCode: string;
  prefix?: string;
  firstName: string;
  lastName: string;
  firstNameTh?: string;
  lastNameTh?: string;
  nationalityGroup?: string;
  email: string;
  phone?: string;
  parentDepartment?: string;
  department: string;
  level?: string;
  employmentType?: string;
  position: string;
  hireDate: string;
  birthDate?: string;
  age?: number;
  tenureYears?: number;
  status: EmployeeStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: EmployeeStatus | 'ALL';
  department?: string;
  parentDepartment?: string;
}

export interface EmployeeStats {
  total: number;
  active: number;
  resigned: number;
  totalDepartments: number;
}
