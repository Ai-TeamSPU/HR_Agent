'use client';

import { Badge } from '@/components/ui/badge';
import { type VacancyState, VACANCY_STATE_LABELS, VACANCY_STATE_COLORS } from '@/lib/types/vacancy';
import { type ApplicationState, APPLICATION_STATE_LABELS, APPLICATION_STATE_COLORS } from '@/lib/types/candidate';
import { useLocale } from '@/pagefront/providers/LocaleProvider';

interface VacancyStateBadgeProps {
  state: VacancyState;
  size?: 'sm' | 'default';
}

export function VacancyStateBadge({ state, size = 'default' }: VacancyStateBadgeProps) {
  const { locale } = useLocale();
  const label = VACANCY_STATE_LABELS[state]?.[locale] || state;
  const colorClass = VACANCY_STATE_COLORS[state] || '';

  return (
    <Badge
      variant="outline"
      className={`${colorClass} border font-medium ${size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}
    >
      {label}
    </Badge>
  );
}

interface ApplicationStateBadgeProps {
  state: ApplicationState;
  size?: 'sm' | 'default';
}

export function ApplicationStateBadge({ state, size = 'default' }: ApplicationStateBadgeProps) {
  const { locale } = useLocale();
  const label = APPLICATION_STATE_LABELS[state]?.[locale] || state;
  const colorClass = APPLICATION_STATE_COLORS[state] || '';

  return (
    <Badge
      variant="outline"
      className={`${colorClass} border font-medium ${size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}
    >
      {label}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
  URGENT: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
};

const PRIORITY_LABELS: Record<string, Record<string, string>> = {
  LOW: { en: 'Low', th: 'ต่ำ' },
  MEDIUM: { en: 'Medium', th: 'ปานกลาง' },
  HIGH: { en: 'High', th: 'สูง' },
  URGENT: { en: 'Urgent', th: 'เร่งด่วน' },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { locale } = useLocale();
  return (
    <Badge
      variant="outline"
      className={`${PRIORITY_STYLES[priority]} border font-medium text-xs px-2 py-0.5`}
    >
      {PRIORITY_LABELS[priority]?.[locale] || priority}
    </Badge>
  );
}

export function EmployeeStatusBadge({ status }: { status: 'ACTIVE' | 'RESIGNED' | 'TERMINATED' }) {
  const { locale } = useLocale();
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
    RESIGNED: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
    TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
  };

  const labels: Record<string, Record<string, string>> = {
    ACTIVE: { en: 'Active', th: 'ปกติ' },
    RESIGNED: { en: 'Resigned', th: 'ลาออก' },
    TERMINATED: { en: 'Terminated', th: 'พ้นสภาพ' },
  };

  return (
    <Badge variant="outline" className={`${styles[status] || styles.ACTIVE} text-xs px-2.5 py-0.5 shadow-2xs`}>
      {labels[status]?.[locale] || status}
    </Badge>
  );
}
