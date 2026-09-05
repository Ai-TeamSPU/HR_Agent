'use client';

import type { WorkflowEvent } from '@/lib/types/ai';
import { useLocale } from '@/pagefront/providers/LocaleProvider';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  User03Icon,
  AssignmentsIcon,
  ChatBotIcon,
  FlashIcon,
  Settings01Icon,
} from '@hugeicons/core-free-icons';

interface TimelineProps {
  events: WorkflowEvent[];
  maxItems?: number;
}

const ACTOR_COLORS: Record<string, string> = {
  HR: 'bg-blue-100 text-blue-800 border-blue-200',
  AI_AGENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  AUTOMATION: 'bg-teal-100 text-teal-800 border-teal-200',
  CANDIDATE: 'bg-amber-100 text-amber-800 border-amber-200',
  SYSTEM: 'bg-slate-100 text-slate-800 border-slate-200',
};

const ACTOR_ICONS: Record<string, any> = {
  HR: User03Icon,
  AI_AGENT: ChatBotIcon,
  AUTOMATION: FlashIcon,
  CANDIDATE: AssignmentsIcon,
  SYSTEM: Settings01Icon,
};

export function Timeline({ events, maxItems }: TimelineProps) {
  const { locale } = useLocale();
  const displayEvents = maxItems ? events.slice(0, maxItems) : events;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMin = Math.floor(diffMs / (1000 * 60));
      return locale === 'th' ? `${diffMin} นาทีที่แล้ว` : `${diffMin}m ago`;
    }
    if (diffHours < 24) return locale === 'th' ? `${diffHours} ชั่วโมงที่แล้ว` : `${diffHours}h ago`;
    if (diffDays < 7) return locale === 'th' ? `${diffDays} วันที่แล้ว` : `${diffDays}d ago`;
    return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-0">
      {displayEvents.map((event, index) => {
        const IconComponent = ACTOR_ICONS[event.actorType] || User03Icon;
        return (
          <div key={event.id} className="flex gap-3 group">
            {/* Timeline line & dot */}
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${ACTOR_COLORS[event.actorType] || ACTOR_COLORS.SYSTEM} shadow-xs shrink-0`}>
                <HugeiconsIcon icon={IconComponent} size={15} />
              </div>
              {index < displayEvents.length - 1 && (
                <div className="w-px h-full min-h-[24px] bg-slate-200" />
              )}
            </div>


          {/* Content */}
          <div className="pb-4 min-w-0 flex-1">
            <p className="text-sm text-slate-800 font-medium leading-snug">
              {locale === 'th' ? event.descriptionTh : event.description}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-slate-500 font-semibold">
                {event.actorName}
              </span>
              <span className="text-[11px] text-slate-300">•</span>
              <span className="text-[11px] text-slate-400">
                {formatTime(event.createdAt)}
              </span>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);
}


