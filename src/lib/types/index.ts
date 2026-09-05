export * from './vacancy';
export * from './candidate';
export * from './interview';
export * from './ai';
export * from './employee';

// Common types

export type UserRole = 'HR_ADMIN' | 'HIRING_MANAGER' | 'INTERVIEWER' | 'CANDIDATE';

export interface User {
  id: string;
  email: string;
  name: string;
  nameTh: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
  createdAt: string;
}

export type Locale = 'en' | 'th';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  titleTh: string;
  message: string;
  messageTh: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ACTION_REQUIRED';
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}
