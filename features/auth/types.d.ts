import { MaritalStatusArr, userRoleArr } from "../../../../HRMS/frontend/src/constant/index";
export type RegisterResponse201 = {
  id: string;
  username: string;
  email: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type LoginResponse200 = {
  refresh: string;
  access: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type Dependents = {
  name: string;
  relation: string;
  dob: string;
};

export type UserRole = (typeof userRoleArr)[number];
export type UserMaritalStatus = (typeof MaritalStatusArr)[number];
export type User = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  gender: string;
  address: string;
  employee_type: EmployeeTypeArr;
  dependents: Dependents[];
  permanent_address: string;
  emergency_name: string;
  emergency_relation: string;
  blood_group: string;
  nationality: string;
  pan_number: string;
  uid_number: string;
  esic_number: string;
  bank_account_number: string;
  ifsc_code: string;
  bank_name: string;
  marital_status: string;
  emergency_number: string;
  office: string | null;
  date_of_birth: string | null;
  phone_number: string;
  profile_image: string | null;
  position: string;
  manager_full_name: string;
  date_of_joining: string;
  manager: string | null;
  role: UserRole;
  user?: number | string;
  department: string;
  department_name: string;
  is_active: boolean;
  profile_image_url?: string;
};

export type ChangePasswordResponse = {
  detail: string;
};
