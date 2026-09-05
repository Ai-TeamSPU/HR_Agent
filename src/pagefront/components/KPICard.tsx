'use client';

import { type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; isPositive: boolean };
  accentColor?: string;
}

export function KPICard({ title, value, subtitle, icon, trend, accentColor = 'from-emerald-500 to-teal-600' }: KPICardProps) {
  return (
    <Card className="relative overflow-hidden border-slate-200/90 bg-white shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 group rounded-xl">
      <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${accentColor} opacity-[0.06] rounded-bl-full group-hover:opacity-[0.12] transition-opacity`} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
              {trend && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trend.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${accentColor} text-white shadow-md shadow-emerald-500/20`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
